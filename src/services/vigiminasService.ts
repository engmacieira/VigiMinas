import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Estabelecimento,
  InspecaoVapt,
  LogAuditoria,
  VigiMinasIndicadores,
  ConfiguracaoSistema,
  FiscalSanitario,
  DadosSecretaria,
  ConfiguracaoExercicio,
  OpcoesExportacao,
  ResultadoExportacao,
  AlertasInspecoesVapt,
  AlertaInspecaoVaptInfo,
  SituacaoAlvara,
  SituacaoEstabelecimento
} from '../types/vigiminas';
import {
  createWithAudit,
  updateWithAudit,
  deleteWithAudit,
  softDeleteWithAudit,
  restoreWithAudit
} from '../lib/firestoreAuditMiddleware';
import {
  SEED_ESTABELECIMENTOS,
  SEED_INSPECOES_VAPT,
  SEED_LOGS_AUDITORIA,
  SEED_CONFIGURACAO_SISTEMA,
  FISCAIS_MUNICIPIO
} from '../data/braunasInitialData';

const ESTABELECIMENTOS_COLLECTION = 'estabelecimentos';
const INSPECOES_VAPT_COLLECTION = 'inspecoes_vapt';
const LOGS_AUDITORIA_COLLECTION = 'logs_auditoria';
const CONFIGURACOES_COLLECTION = 'configuracoes_sistema';

const LOCAL_STORAGE_EST_KEY = 'vigiminas_braunas_estabelecimentos_backup';
const LOCAL_STORAGE_VAPT_KEY = 'vigiminas_braunas_vapt_backup';
const LOCAL_STORAGE_LOGS_KEY = 'vigiminas_braunas_logs_backup';
const LOCAL_STORAGE_CONFIG_KEY = 'vigiminas_braunas_config_backup';

export async function fetchLogsAuditoria(): Promise<LogAuditoria[]> {
  try {
    const snap = await getDocs(collection(db, LOGS_AUDITORIA_COLLECTION));
    if (snap.empty) {
      await seedInitialLogs();
      return SEED_LOGS_AUDITORIA;
    }
    const list: LogAuditoria[] = [];
    snap.forEach((docSnapshot) => {
      list.push({ ...(docSnapshot.data() as LogAuditoria), id: docSnapshot.id });
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn('Falha ao consultar logs_auditoria no Firestore:', error);
    try {
      const backup = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
      if (backup) {
        return JSON.parse(backup);
      }
    } catch {
      // Ignora erro
    }
    return SEED_LOGS_AUDITORIA;
  }
}

export async function seedInitialLogs(): Promise<void> {
  for (const log of SEED_LOGS_AUDITORIA) {
    try {
      await setDoc(doc(db, LOGS_AUDITORIA_COLLECTION, log.id), log);
    } catch (e) {
      console.warn('Erro ao semear log', log.id, e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(SEED_LOGS_AUDITORIA));
}

export async function registrarLogAuditoria(
  log: Omit<LogAuditoria, 'id' | 'timestamp'>
): Promise<void> {
  const logCompleto: LogAuditoria = {
    ...log,
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, LOGS_AUDITORIA_COLLECTION, logCompleto.id), logCompleto);
  } catch (error) {
    console.warn('Falha ao salvar log no Firestore:', error);
  }

  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    const list: LogAuditoria[] = backup ? JSON.parse(backup) : [...SEED_LOGS_AUDITORIA];
    list.unshift(logCompleto);
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao atualizar cache local de logs:', e);
  }
}

/**
 * Consulta ou inicializa as configurações gerais do sistema (Secretaria, Fiscais, Exercício e Metas)
 */
export async function fetchConfiguracaoSistema(): Promise<ConfiguracaoSistema> {
  try {
    const configDocRef = doc(db, CONFIGURACOES_COLLECTION, 'geral');
    const docSnap = await getDoc(configDocRef);
    if (!docSnap.exists()) {
      console.log('Coleção de configurações vazia. Semeando configurações padrão da VISA de Braúnas/MG...');
      await seedInitialConfiguracao();
      return SEED_CONFIGURACAO_SISTEMA;
    }
    const data = docSnap.data() as ConfiguracaoSistema;
    const configCompleta: ConfiguracaoSistema = {
      ...SEED_CONFIGURACAO_SISTEMA,
      ...data,
      id: 'geral'
    };
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(configCompleta));
    return configCompleta;
  } catch (err) {
    console.warn('Falha ao consultar configuracoes_sistema no Firestore, utilizando cache ou seed:', err);
    try {
      const backup = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      if (backup) {
        return JSON.parse(backup);
      }
    } catch {
      // Ignora erro
    }
    return SEED_CONFIGURACAO_SISTEMA;
  }
}

export async function seedInitialConfiguracao(): Promise<void> {
  try {
    const configDocRef = doc(db, CONFIGURACOES_COLLECTION, 'geral');
    await setDoc(configDocRef, {
      ...SEED_CONFIGURACAO_SISTEMA,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Erro ao semear configuracoes_sistema iniciais:', e);
  }
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(SEED_CONFIGURACAO_SISTEMA));
}

export async function saveConfiguracaoSistema(
  config: ConfiguracaoSistema,
  auditContext?: { usuario?: string; fiscalResponsavel?: string; detalhesPersonalizados?: string }
): Promise<void> {
  const timestamp = new Date().toISOString();
  const configToSave: ConfiguracaoSistema = {
    ...config,
    id: 'geral',
    updatedAt: timestamp
  };

  const detalhes = auditContext?.detalhesPersonalizados ||
    `Atualização cadastral do sistema: Secretaria (${config.secretaria.nomeOrgao}), Exercício ${config.exercicioAtivo.anoExercicio} e corpo técnico com ${config.fiscais.length} fiscal(is).`;

  // Persiste no Firestore com middleware de auditoria
  await updateWithAudit('configuracoes_sistema', 'geral', configToSave, {
    ...auditContext,
    fiscalResponsavel: auditContext?.fiscalResponsavel || config.fiscais[0]?.nome || FISCAIS_MUNICIPIO[0],
    detalhesPersonalizados: detalhes
  });

  // Atualiza cache local
  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(configToSave));
  } catch (e) {
    console.error('Erro ao atualizar cache local de configurações:', e);
  }
}

export async function fetchEstabelecimentos(): Promise<Estabelecimento[]> {
  try {
    const snap = await getDocs(collection(db, ESTABELECIMENTOS_COLLECTION));
    if (snap.empty) {
      const config = await fetchConfiguracaoSistema();
      if (config && config.bancoInicializado) {
        localStorage.setItem(LOCAL_STORAGE_EST_KEY, JSON.stringify([]));
        return [];
      }
      console.log('Coleção de estabelecimentos vazia no Firestore. Semeando dados iniciais de Braúnas/MG...');
      await seedInitialEstabelecimentos();
      return SEED_ESTABELECIMENTOS;
    }
    const list: Estabelecimento[] = [];
    snap.forEach((docSnapshot) => {
      list.push({ ...(docSnapshot.data() as Estabelecimento), id: docSnapshot.id });
    });
    localStorage.setItem(LOCAL_STORAGE_EST_KEY, JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn('Falha ao consultar Firestore diretamente, utilizando cache local ou semente:', error);
    try {
      const backup = localStorage.getItem(LOCAL_STORAGE_EST_KEY);
      if (backup) {
        return JSON.parse(backup);
      }
    } catch {
      // Ignora erro de JSON
    }
    return SEED_ESTABELECIMENTOS;
  }
}

export async function seedInitialEstabelecimentos(): Promise<void> {
  for (const est of SEED_ESTABELECIMENTOS) {
    try {
      await setDoc(doc(db, ESTABELECIMENTOS_COLLECTION, est.id), est);
    } catch (e) {
      console.warn('Erro ao semear estabelecimento', est.id, e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_EST_KEY, JSON.stringify(SEED_ESTABELECIMENTOS));
}

export async function saveEstabelecimento(
  estabelecimento: Estabelecimento,
  auditContext?: { usuario?: string; fiscalResponsavel?: string; detalhesPersonalizados?: string }
): Promise<void> {
  const backup = localStorage.getItem(LOCAL_STORAGE_EST_KEY);
  const listExistente: Estabelecimento[] = backup ? JSON.parse(backup) : [...SEED_ESTABELECIMENTOS];
  const isEdicao = listExistente.some(item => item.id === estabelecimento.id);

  const fiscal = auditContext?.fiscalResponsavel || 
    estabelecimento.fiscaisUltimaInspecao?.[0] || 
    FISCAIS_MUNICIPIO[0];

  const detalhes = auditContext?.detalhesPersonalizados || (isEdicao
    ? `Atualização cadastral do estabelecimento. Risco: ${estabelecimento.nivelRisco}, Situação: ${estabelecimento.situacaoEstabelecimento}, Alvará: ${estabelecimento.situacaoAlvara}.`
    : `Inclusão cadastral do estabelecimento em Braúnas/MG (${estabelecimento.nivelRisco}).`);

  // Executa persistência no Firestore através do Middleware de Auditoria
  if (isEdicao) {
    await updateWithAudit('estabelecimentos', estabelecimento.id, estabelecimento, {
      ...auditContext,
      fiscalResponsavel: fiscal,
      detalhesPersonalizados: detalhes
    });
  } else {
    await createWithAudit('estabelecimentos', estabelecimento.id, estabelecimento, {
      ...auditContext,
      fiscalResponsavel: fiscal,
      detalhesPersonalizados: detalhes
    });
  }

  // Atualiza cache local
  try {
    let list: Estabelecimento[] = backup ? JSON.parse(backup) : [...SEED_ESTABELECIMENTOS];
    const index = list.findIndex(item => item.id === estabelecimento.id);
    if (index >= 0) {
      list[index] = { ...estabelecimento, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...estabelecimento, createdAt: new Date().toISOString() });
    }
    localStorage.setItem(LOCAL_STORAGE_EST_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao atualizar cache local:', e);
  }
}

export async function deleteEstabelecimento(
  id: string,
  motivoExclusao?: string,
  auditContext?: { usuario?: string; fiscalResponsavel?: string; detalhesPersonalizados?: string }
): Promise<void> {
  let nomeDeletado = id;
  const timestamp = new Date().toISOString();
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_EST_KEY);
    if (backup) {
      const list: Estabelecimento[] = JSON.parse(backup);
      const estEncontrado = list.find(item => item.id === id);
      if (estEncontrado) {
        nomeDeletado = estEncontrado.razaoSocial;
        estEncontrado.isDeleted = true;
        estEncontrado.deletedAt = timestamp;
        estEncontrado.deletedBy = auditContext?.usuario || 'eng.macieira@gmail.com';
        estEncontrado.motivoExclusao = motivoExclusao || 'Exclusão lógica realizada pelo usuário';
      }
      localStorage.setItem(LOCAL_STORAGE_EST_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Erro ao atualizar exclusão no cache local:', e);
  }

  // Executa exclusão lógica (soft delete) através do Middleware de Auditoria
  await softDeleteWithAudit('estabelecimentos', id, nomeDeletado, {
    ...auditContext,
    fiscalResponsavel: auditContext?.fiscalResponsavel || FISCAIS_MUNICIPIO[0],
    detalhesPersonalizados: auditContext?.detalhesPersonalizados || `Arquivamento do cadastro de ${nomeDeletado}.${motivoExclusao ? ` Motivo: "${motivoExclusao}"` : ''}`
  }, motivoExclusao);
}

export async function deletePermanenteEstabelecimento(
  id: string,
  motivoExclusao?: string,
  auditContext?: { usuario?: string; fiscalResponsavel?: string; detalhesPersonalizados?: string }
): Promise<void> {
  let nomeDeletado = id;
  const timestamp = new Date().toISOString();
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_EST_KEY);
    if (backup) {
      const list: Estabelecimento[] = JSON.parse(backup);
      const estEncontrado = list.find(item => item.id === id);
      if (estEncontrado) {
        nomeDeletado = estEncontrado.razaoSocial;
        estEncontrado.isDeleted = true;
        estEncontrado.isPermanentlyDeleted = true;
        estEncontrado.permanentlyDeletedAt = timestamp;
        estEncontrado.permanentlyDeletedBy = auditContext?.usuario || 'eng.macieira@gmail.com';
        estEncontrado.motivoExclusaoPermanente = motivoExclusao || 'Exclusão definitiva solicitada na aba de arquivados';
      }
      localStorage.setItem(LOCAL_STORAGE_EST_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Erro ao atualizar exclusão definitiva no cache local:', e);
  }

  // Executa atualização auditada no Firestore (Soft delete com retenção permanente no banco para administradores)
  try {
    await updateWithAudit('estabelecimentos', id, {
      isDeleted: true,
      isPermanentlyDeleted: true,
      permanentlyDeletedAt: timestamp,
      permanentlyDeletedBy: auditContext?.usuario || 'eng.macieira@gmail.com',
      motivoExclusaoPermanente: motivoExclusao || 'Exclusão definitiva solicitada na aba de arquivados'
    }, {
      ...auditContext,
      fiscalResponsavel: auditContext?.fiscalResponsavel || FISCAIS_MUNICIPIO[0],
      detalhesPersonalizados: auditContext?.detalhesPersonalizados || `Exclusão definitiva da visão do usuário do cadastro de ${nomeDeletado}. Registro retido no banco de dados para administradores.${motivoExclusao ? ` Motivo: "${motivoExclusao}"` : ''}`
    });
  } catch (err) {
    console.warn('Falha ao persistir exclusão permanente no Firestore, mantido em cache local:', err);
  }
}

export async function restoreEstabelecimento(
  id: string,
  auditContext?: { usuario?: string; fiscalResponsavel?: string; detalhesPersonalizados?: string }
): Promise<void> {
  let nomeRestaurado = id;
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_EST_KEY);
    if (backup) {
      const list: Estabelecimento[] = JSON.parse(backup);
      const estEncontrado = list.find(item => item.id === id);
      if (estEncontrado) {
        nomeRestaurado = estEncontrado.razaoSocial;
        estEncontrado.isDeleted = false;
        estEncontrado.isPermanentlyDeleted = false;
        estEncontrado.permanentlyDeletedAt = undefined;
        estEncontrado.permanentlyDeletedBy = undefined;
        estEncontrado.motivoExclusaoPermanente = undefined;
        estEncontrado.deletedAt = undefined;
        estEncontrado.deletedBy = undefined;
        estEncontrado.motivoExclusao = undefined;
      }
      localStorage.setItem(LOCAL_STORAGE_EST_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Erro ao restaurar estabelecimento no cache local:', e);
  }

  await restoreWithAudit('estabelecimentos', id, nomeRestaurado, {
    ...auditContext,
    fiscalResponsavel: auditContext?.fiscalResponsavel || FISCAIS_MUNICIPIO[0],
    detalhesPersonalizados: auditContext?.detalhesPersonalizados || `Restauração do cadastro de estabelecimento previamente arquivado (${nomeRestaurado}).`
  });
}

export async function fetchInspecoesVapt(): Promise<InspecaoVapt[]> {
  try {
    const snap = await getDocs(collection(db, INSPECOES_VAPT_COLLECTION));
    if (snap.empty) {
      const config = await fetchConfiguracaoSistema();
      if (config && config.bancoInicializado) {
        localStorage.setItem(LOCAL_STORAGE_VAPT_KEY, JSON.stringify([]));
        return [];
      }
      console.log('Coleção de vistorias VAPT vazia no Firestore. Semeando dados iniciais...');
      await seedInitialVapt();
      return SEED_INSPECOES_VAPT;
    }
    const list: InspecaoVapt[] = [];
    snap.forEach((docSnapshot) => {
      list.push({ ...(docSnapshot.data() as InspecaoVapt), id: docSnapshot.id });
    });
    localStorage.setItem(LOCAL_STORAGE_VAPT_KEY, JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn('Falha ao consultar vistorias VAPT no Firestore:', error);
    try {
      const backup = localStorage.getItem(LOCAL_STORAGE_VAPT_KEY);
      if (backup) {
        return JSON.parse(backup);
      }
    } catch {
      // Ignora erro
    }
    return SEED_INSPECOES_VAPT;
  }
}

export async function seedInitialVapt(): Promise<void> {
  for (const vapt of SEED_INSPECOES_VAPT) {
    try {
      await setDoc(doc(db, INSPECOES_VAPT_COLLECTION, vapt.id), vapt);
    } catch (e) {
      console.warn('Erro ao semear VAPT', vapt.id, e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_VAPT_KEY, JSON.stringify(SEED_INSPECOES_VAPT));
}

export async function saveInspecaoVapt(
  inspecao: InspecaoVapt,
  auditContext?: { usuario?: string; fiscalResponsavel?: string; detalhesPersonalizados?: string }
): Promise<void> {
  const backup = localStorage.getItem(LOCAL_STORAGE_VAPT_KEY);
  const listExistente: InspecaoVapt[] = backup ? JSON.parse(backup) : [...SEED_INSPECOES_VAPT];
  const isEdicao = listExistente.some(item => item.id === inspecao.id);

  const fiscal = auditContext?.fiscalResponsavel || 
    inspecao.fiscaisResponsaveis?.[0] || 
    FISCAIS_MUNICIPIO[1];

  const detalhes = auditContext?.detalhesPersonalizados || 
    `Vistoria VAPT em ambiente de trabalho ${isEdicao ? 'atualizada' : 'registrada'} (${inspecao.numeroRelatorioTermo} - Status: ${inspecao.statusInspecao}).`;

  // Executa persistência no Firestore através do Middleware de Auditoria
  if (isEdicao) {
    await updateWithAudit('inspecoes_vapt', inspecao.id, inspecao, {
      ...auditContext,
      fiscalResponsavel: fiscal,
      detalhesPersonalizados: detalhes
    });
  } else {
    await createWithAudit('inspecoes_vapt', inspecao.id, inspecao, {
      ...auditContext,
      fiscalResponsavel: fiscal,
      detalhesPersonalizados: detalhes
    });
  }

  try {
    let list: InspecaoVapt[] = backup ? JSON.parse(backup) : [...SEED_INSPECOES_VAPT];
    const index = list.findIndex(item => item.id === inspecao.id);
    if (index >= 0) {
      list[index] = { ...inspecao, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...inspecao, createdAt: new Date().toISOString() });
    }
    localStorage.setItem(LOCAL_STORAGE_VAPT_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao atualizar cache de VAPT:', e);
  }
}

export async function deleteInspecaoVapt(
  id: string,
  motivoExclusao?: string,
  auditContext?: { usuario?: string; fiscalResponsavel?: string; detalhesPersonalizados?: string }
): Promise<void> {
  let nomeDeletado = id;
  const timestamp = new Date().toISOString();
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_VAPT_KEY);
    if (backup) {
      const list: InspecaoVapt[] = JSON.parse(backup);
      const itemEncontrado = list.find(item => item.id === id);
      if (itemEncontrado) {
        nomeDeletado = itemEncontrado.numeroRelatorioTermo;
        itemEncontrado.isDeleted = true;
        itemEncontrado.deletedAt = timestamp;
        itemEncontrado.deletedBy = auditContext?.usuario || 'eng.macieira@gmail.com';
        itemEncontrado.motivoExclusao = motivoExclusao || 'Exclusão lógica de relatório de vistoria VAPT';
      }
      localStorage.setItem(LOCAL_STORAGE_VAPT_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Erro ao atualizar exclusão no cache local:', e);
  }

  // Executa exclusão lógica (soft delete) através do Middleware de Auditoria
  await softDeleteWithAudit('inspecoes_vapt', id, nomeDeletado, {
    ...auditContext,
    fiscalResponsavel: auditContext?.fiscalResponsavel || FISCAIS_MUNICIPIO[1],
    detalhesPersonalizados: auditContext?.detalhesPersonalizados || `Exclusão lógica (soft delete) do relatório de vistoria VAPT (${nomeDeletado}).${motivoExclusao ? ` Motivo: "${motivoExclusao}"` : ''}`
  }, motivoExclusao);
}

export async function restoreInspecaoVapt(
  id: string,
  auditContext?: { usuario?: string; fiscalResponsavel?: string; detalhesPersonalizados?: string }
): Promise<void> {
  let nomeRestaurado = id;
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_VAPT_KEY);
    if (backup) {
      const list: InspecaoVapt[] = JSON.parse(backup);
      const itemEncontrado = list.find(item => item.id === id);
      if (itemEncontrado) {
        nomeRestaurado = itemEncontrado.numeroRelatorioTermo;
        itemEncontrado.isDeleted = false;
        itemEncontrado.deletedAt = undefined;
        itemEncontrado.deletedBy = undefined;
        itemEncontrado.motivoExclusao = undefined;
      }
      localStorage.setItem(LOCAL_STORAGE_VAPT_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Erro ao restaurar VAPT no cache local:', e);
  }

  await restoreWithAudit('inspecoes_vapt', id, nomeRestaurado, {
    ...auditContext,
    fiscalResponsavel: auditContext?.fiscalResponsavel || FISCAIS_MUNICIPIO[1],
    detalhesPersonalizados: auditContext?.detalhesPersonalizados || `Restauração do relatório de vistoria VAPT previamente arquivado (${nomeRestaurado}).`
  });
}

/**
 * Cruza dados da coleção 'inspecoes_vapt' com a data atual para identificar vistorias
 * vencidas ou próximas de vencer nos próximos 5 dias.
 */
export function calcularAlertasVapt(
  inspecoesVapt: InspecaoVapt[],
  estabelecimentos: Estabelecimento[],
  dataReferencia?: Date
): AlertasInspecoesVapt {
  const hoje = dataReferencia || new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

  const limite5Dias = new Date(hoje);
  limite5Dias.setDate(limite5Dias.getDate() + 5);
  const limite5DiasStr = limite5Dias.toISOString().split('T')[0];

  const mapaEst = new Map<string, Estabelecimento>();
  estabelecimentos.forEach(e => mapaEst.set(e.id, e));

  const alertas: AlertaInspecaoVaptInfo[] = [];
  let totalVencidas = 0;
  let totalProximasVencer = 0;

  inspecoesVapt.forEach(vapt => {
    // Ignora vistorias excluídas logicamente
    if (vapt.isDeleted) return;

    // Monitora vistorias em acompanhamento (com prazo de adequação legal/retorno)
    if (vapt.statusInspecao === 'Em Acompanhamento') {
      let dataAlvo = vapt.dataRetornoPrevista;
      if (!dataAlvo && vapt.dataInspecao && vapt.prazoAdequacaoDias) {
        const d = new Date(vapt.dataInspecao + 'T00:00:00');
        d.setDate(d.getDate() + vapt.prazoAdequacaoDias);
        dataAlvo = d.toISOString().split('T')[0];
      }

      if (dataAlvo) {
        // Cálculo da diferença em dias corridos
        const dAlvo = new Date(dataAlvo + 'T00:00:00');
        const dHoje = new Date(hojeStr + 'T00:00:00');
        const diffMs = dAlvo.getTime() - dHoje.getTime();
        const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (dataAlvo < hojeStr) {
          totalVencidas++;
          alertas.push({
            inspecao: vapt,
            estabelecimento: mapaEst.get(vapt.estabelecimentoId),
            tipoAlerta: 'vencida',
            diasDiferenca: diffDias,
            dataLimite: dataAlvo
          });
        } else if (dataAlvo <= limite5DiasStr) {
          totalProximasVencer++;
          alertas.push({
            inspecao: vapt,
            estabelecimento: mapaEst.get(vapt.estabelecimentoId),
            tipoAlerta: 'proxima',
            diasDiferenca: diffDias,
            dataLimite: dataAlvo
          });
        }
      }
    }
  });

  // Ordena os alertas: mais vencidos primeiro, depois os que vencem mais cedo
  alertas.sort((a, b) => a.diasDiferenca - b.diasDiferenca);

  return {
    totalAlertas: totalVencidas + totalProximasVencer,
    totalVencidas,
    totalProximasVencer,
    alertas
  };
}

/**
 * Cálculo oficial dos 5 indicadores do Programa VigiMinas (SES/MG)
 */
export function calcularIndicadores(
  estabelecimentos: Estabelecimento[],
  inspecoesVapt: InspecaoVapt[],
  ano = 2026,
  metasConfig?: Partial<ConfiguracaoExercicio>
): VigiMinasIndicadores {
  const anoStr = String(ano);
  const metaVapt = metasConfig?.metaInd11Vapt ?? 2;
  const metaRiscoI = metasConfig?.metaInd13RiscoI ?? 15;
  const metaRiscoII = metasConfig?.metaInd14RiscoII ?? 90;
  const metaRiscoIII = metasConfig?.metaInd15RiscoIII ?? 100;

  // Filtra registros excluídos logicamente para os indicadores oficiais
  const estValidos = estabelecimentos.filter(e => !e.isDeleted);
  const vaptValidas = inspecoesVapt.filter(v => !v.isDeleted);

  // Indicador 12: Total de estabelecimentos cadastrados
  const ind12TotalCadastrados = estValidos.length;
  const ind12Ativos = estValidos.filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso').length;
  const ind12Inativos = estValidos.filter(e => e.situacaoEstabelecimento === 'Inativo').length;

  // Estabelecimentos Ativos para os indicadores de risco (inclui Suspensos conforme diretriz do VigiMinas)
  const estabelecimentosAtivos = estValidos.filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso');

  // Indicador 13: Risco I (Meta padrão >= 15% inspecionados no ano)
  const riscoI = estabelecimentosAtivos.filter(e => e.nivelRisco === 'Risco I');
  const ind13TotalRiscoI = riscoI.length;
  const ind13InspecionadosAno = riscoI.filter(e =>
    (e.dataUltimaInspecaoInicio && e.dataUltimaInspecaoInicio.startsWith(anoStr)) ||
    (e.dataUltimaInspecaoFim && e.dataUltimaInspecaoFim.startsWith(anoStr))
  ).length;
  const ind13Percentual = ind13TotalRiscoI > 0
    ? Number(((ind13InspecionadosAno / ind13TotalRiscoI) * 100).toFixed(1))
    : 100;
  const ind13MetaAtingida = ind13Percentual >= metaRiscoI;

  // Indicador 14: Risco II com alvará inspecionados no ano (Meta padrão >= 90%)
  const riscoII = estabelecimentosAtivos.filter(e => e.nivelRisco === 'Risco II');
  const ind14TotalRiscoII = riscoII.length;
  const ind14InspecionadosAno = riscoII.filter(e =>
    (e.dataUltimaInspecaoInicio && e.dataUltimaInspecaoInicio.startsWith(anoStr)) ||
    (e.dataUltimaInspecaoFim && e.dataUltimaInspecaoFim.startsWith(anoStr))
  ).length;
  const ind14Percentual = ind14TotalRiscoII > 0
    ? Number(((ind14InspecionadosAno / ind14TotalRiscoII) * 100).toFixed(1))
    : 100;
  const ind14MetaAtingida = ind14Percentual >= metaRiscoII;

  // Indicador 15: Risco III inspecionados no ano (Meta 100%)
  const riscoIII = estabelecimentosAtivos.filter(e => e.nivelRisco === 'Risco III');
  const ind15TotalRiscoIII = riscoIII.length;
  const ind15InspecionadosAno = riscoIII.filter(e =>
    (e.dataUltimaInspecaoInicio && e.dataUltimaInspecaoInicio.startsWith(anoStr)) ||
    (e.dataUltimaInspecaoFim && e.dataUltimaInspecaoFim.startsWith(anoStr))
  ).length;
  const ind15Percentual = ind15TotalRiscoIII > 0
    ? Number(((ind15InspecionadosAno / ind15TotalRiscoIII) * 100).toFixed(1))
    : 100;
  const ind15MetaAtingida = ind15Percentual >= metaRiscoIII;

  // Indicador 11: Inspeções em Ambientes de Trabalho (VAPT - Saúde do Trabalhador)
  const ind11TotalInspecoesAno = vaptValidas.filter(v =>
    v.dataInspecao && v.dataInspecao.startsWith(anoStr)
  ).length;
  const ind11MetaAtingida = ind11TotalInspecoesAno >= metaVapt;

  return {
    anoReferencia: ano,
    ind12TotalCadastrados,
    ind12Ativos,
    ind12Inativos,
    ind13TotalRiscoI,
    ind13InspecionadosAno,
    ind13Percentual,
    ind13MetaAtingida,
    ind14TotalRiscoII,
    ind14InspecionadosAno,
    ind14Percentual,
    ind14MetaAtingida,
    ind15TotalRiscoIII,
    ind15InspecionadosAno,
    ind15Percentual,
    ind15MetaAtingida,
    ind11TotalInspecoesAno,
    ind11MetaAtingida
  };
}

/**
 * Exporta a planilha oficial do VigiMinas (SES/MG) em formato .xlsx
 */
export function exportarPlanilhaVigiMinas(
  estabelecimentos: Estabelecimento[],
  indicadores: VigiMinasIndicadores,
  ano = 2026
): void {
  // Aba 1: Relação Oficial de Estabelecimentos
  const dadosEstabelecimentos = estabelecimentos.map((e, index) => ({
    'Nº': index + 1,
    'CNPJ / CPF': e.cnpjCpf,
    'Razão Social': e.razaoSocial,
    'Nome Fantasia': e.nomeFantasia || '-',
    'Logradouro': e.endereco?.logradouro || '',
    'Número': e.endereco?.numero || 'S/N',
    'Bairro': e.endereco?.bairro || '',
    'CEP': e.endereco?.cep || '35189-000',
    'Município / UF': e.endereco?.municipio || 'Braúnas/MG',
    'Telefone': e.contato?.telefone || '-',
    'E-mail': e.contato?.email || '-',
    'Código CNAE': e.cnaeCodigo,
    'Descrição da Atividade Econômica (CNAE)': e.cnaeDescricao,
    'Grau de Risco Sanitário': e.nivelRisco,
    'Competência de Fiscalização': e.competenciaFiscalizacao,
    'Parecer Projeto Arquitetônico': e.parecerProjetoArquitetonico,
    'Situação Cadastral': e.situacaoEstabelecimento,
    'Observações / Justificativa da Baixa / Suspensão': e.observacoesBaixa || (e.situacaoEstabelecimento === 'Inativo' ? 'Inativo sem justificativa' : e.situacaoEstabelecimento === 'Suspenso' ? 'Suspenso/Interditado pela VISA' : 'Ativo regular'),
    'Situação do Alvará Sanitário': e.situacaoAlvara,
    'Número do Alvará / Dispensa': e.numeroAlvara || '-',
    'Data Validade do Alvará': e.dataValidadeAlvara ? formatarDataBr(e.dataValidadeAlvara) : '-',
    'Data Início Última Inspeção': e.dataUltimaInspecaoInicio ? formatarDataBr(e.dataUltimaInspecaoInicio) : '-',
    'Data Fim Última Inspeção': e.dataUltimaInspecaoFim ? formatarDataBr(e.dataUltimaInspecaoFim) : '-',
    'Inspecionado no Ano Vigente?': (e.dataUltimaInspecaoInicio?.startsWith(String(ano)) || e.dataUltimaInspecaoFim?.startsWith(String(ano))) ? 'SIM' : 'NÃO',
    'Data Próxima Inspeção Prevista': e.dataProximaInspecao ? formatarDataBr(e.dataProximaInspecao) : '-',
    'Fiscais Responsáveis': (e.fiscaisUltimaInspecao && e.fiscaisUltimaInspecao.length > 0) ? e.fiscaisUltimaInspecao.join('; ') : 'Equipe VISA Braúnas'
  }));

  // Aba 2: Apuração e Consolidação de Metas VigiMinas
  const dadosMetas = [
    {
      'Indicador': 'Indicador 11 - VAPT / Saúde do Trabalhador',
      'Descrição': 'Vistorias e Inspeções em Ambientes e Processos de Trabalho realizadas no município',
      'Meta Pactuada SES/MG': '>= 2 inspeções no ano',
      'Numerador (Realizado)': `${indicadores.ind11TotalInspecoesAno} vistorias`,
      'Denominador (Alvo)': '2 inspeções mínimas',
      'Resultado Alcançado': `${indicadores.ind11TotalInspecoesAno}`,
      'Situação da Meta 2026': indicadores.ind11MetaAtingida ? 'META CUMPRIDA' : 'EM ANDAMENTO'
    },
    {
      'Indicador': 'Indicador 12 - Cadastro Municipal',
      'Descrição': 'Total de Estabelecimentos Sujeitos à VISA Cadastrados no Município de Braúnas/MG',
      'Meta Pactuada SES/MG': 'Cadastro Completo e Atualizado',
      'Numerador (Realizado)': `${indicadores.ind12Ativos} ativos`,
      'Denominador (Alvo)': `${indicadores.ind12TotalCadastrados} total (${indicadores.ind12Inativos} baixados/histórico)`,
      'Resultado Alcançado': '100% atualizado',
      'Situação da Meta 2026': 'CONFORME'
    },
    {
      'Indicador': 'Indicador 13 - Risco I (Baixo Risco)',
      'Descrição': 'Percentual de estabelecimentos de Risco I inspecionados no ano',
      'Meta Pactuada SES/MG': '>= 15,0%',
      'Numerador (Realizado)': `${indicadores.ind13InspecionadosAno} inspecionados`,
      'Denominador (Alvo)': `${indicadores.ind13TotalRiscoI} ativos cadastrados`,
      'Resultado Alcançado': `${indicadores.ind13Percentual.toFixed(1)}%`,
      'Situação da Meta 2026': indicadores.ind13MetaAtingida ? 'META CUMPRIDA' : 'ABAIXO DA META'
    },
    {
      'Indicador': 'Indicador 14 - Risco II (Médio Risco)',
      'Descrição': 'Percentual de estabelecimentos de Risco II com alvará inspecionados no ano',
      'Meta Pactuada SES/MG': '>= 90,0%',
      'Numerador (Realizado)': `${indicadores.ind14InspecionadosAno} inspecionados`,
      'Denominador (Alvo)': `${indicadores.ind14TotalRiscoII} ativos cadastrados`,
      'Resultado Alcançado': `${indicadores.ind14Percentual.toFixed(1)}%`,
      'Situação da Meta 2026': indicadores.ind14MetaAtingida ? 'META CUMPRIDA' : 'ABAIXO DA META'
    },
    {
      'Indicador': 'Indicador 15 - Risco III (Alto Risco)',
      'Descrição': 'Percentual de estabelecimentos de Risco III inspecionados no ano',
      'Meta Pactuada SES/MG': '100,0%',
      'Numerador (Realizado)': `${indicadores.ind15InspecionadosAno} inspecionados`,
      'Denominador (Alvo)': `${indicadores.ind15TotalRiscoIII} ativos cadastrados`,
      'Resultado Alcançado': `${indicadores.ind15Percentual.toFixed(1)}%`,
      'Situação da Meta 2026': indicadores.ind15MetaAtingida ? 'META CUMPRIDA' : 'ABAIXO DA META'
    }
  ];

  // Criação do Workbook
  const wb = XLSX.utils.book_new();

  const wsEst = XLSX.utils.json_to_sheet(dadosEstabelecimentos);
  const wsMetas = XLSX.utils.json_to_sheet(dadosMetas);

  // Ajuste de largura das colunas
  wsEst['!cols'] = [
    { wch: 5 },  // Nº
    { wch: 20 }, // CNPJ
    { wch: 38 }, // Razao Social
    { wch: 30 }, // Fantasia
    { wch: 25 }, // Logradouro
    { wch: 8 },  // Numero
    { wch: 18 }, // Bairro
    { wch: 12 }, // CEP
    { wch: 15 }, // Municipio
    { wch: 16 }, // Telefone
    { wch: 28 }, // Email
    { wch: 14 }, // CNAE
    { wch: 45 }, // CNAE Desc
    { wch: 12 }, // Risco
    { wch: 14 }, // Comp
    { wch: 12 }, // Parecer
    { wch: 12 }, // Sit Cadastral
    { wch: 40 }, // Obs Baixa
    { wch: 16 }, // Sit Alvara
    { wch: 16 }, // Num Alvara
    { wch: 14 }, // Val Alvara
    { wch: 14 }, // Ult Inic
    { wch: 14 }, // Ult Fim
    { wch: 10 }, // No ano?
    { wch: 14 }, // Prox Insp
    { wch: 25 }, // Fiscais
  ];

  wsMetas['!cols'] = [
    { wch: 35 }, // Indicador
    { wch: 45 }, // Descricao
    { wch: 22 }, // Meta
    { wch: 20 }, // Numerador
    { wch: 24 }, // Denominador
    { wch: 16 }, // Resultado
    { wch: 18 }  // Situacao
  ];

  XLSX.utils.book_append_sheet(wb, wsEst, 'Estabelecimentos VISA');
  XLSX.utils.book_append_sheet(wb, wsMetas, 'Metas VigiMinas');

  const fileName = `VigiMinas_Braunas_MG_Indicadores_${ano}_Oficial.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function formatarDataBr(dataIso: string): string {
  if (!dataIso) return '-';
  const partes = dataIso.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataIso;
}

export function aplicarMascaraCnpjCpf(valor: string): string {
  const limpo = valor.replace(/\D/g, '');
  if (limpo.length <= 11) {
    // CPF: 000.000.000-00
    return limpo
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return limpo
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
}

export function aplicarMascaraCep(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 8);
  return limpo.replace(/(\d{5})(\d)/, '$1-$2');
}

export function aplicarMascaraTelefone(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 11);
  if (limpo.length <= 10) {
    return limpo
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return limpo
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Função auxiliar para interpretar datas de planilhas (seriais do Excel, DD/MM/AAAA ou AAAA-MM-DD)
 */
function normalizarDataExcel(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    // Serial do Excel (base 1899-12-30)
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Ignora erro
    }
  }

  const str = String(val).trim();
  // Se estiver em formato brasileiro DD/MM/AAAA ou D/M/AAAA
  const matchBr = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (matchBr) {
    const dia = matchBr[1].padStart(2, '0');
    const mes = matchBr[2].padStart(2, '0');
    const ano = matchBr[3];
    return `${ano}-${mes}-${dia}`;
  }

  // Se já estiver em formato ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  return '';
}

/**
 * Gera e realiza o download de uma planilha modelo (.xlsx) com cabeçalhos padronizados,
 * dados demonstrativos e aba de instruções para preenchimento pelos fiscais ou secretaria.
 */
export function gerarPlanilhaModeloEstabelecimentos(): void {
  const wb = XLSX.utils.book_new();

  // Dados demonstrativos com as colunas oficiais exigidas pelo VigiMinas
  const dadosModelo = [
    {
      'CNPJ_OU_CPF': '12.345.678/0001-90',
      'RAZAO_SOCIAL': 'DROGARIA E FARMACIA BRAUNAS LTDA',
      'NOME_FANTASIA': 'DROGARIA CENTRAL',
      'IDENTIFICACAO_MUNICIPAL': 'IM-1044',
      'CNAE_CODIGO': '4771-7/01',
      'CNAE_DESCRICAO': 'Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas',
      'CNAES_SECUNDARIOS': '4772-5/00 - Comércio varejista de cosméticos, produtos de perfumaria e de higiene pessoal',
      'NIVEL_RISCO': 'Risco I',
      'LOGRADOURO': 'Av. Brasil',
      'NUMERO': '150',
      'BAIRRO': 'Centro',
      'CEP': '35189-000',
      'MUNICIPIO': 'Braúnas/MG',
      'TELEFONE': '(33) 3295-1234',
      'EMAIL': 'contato@drogariacentralbraunas.com.br',
      'SITUACAO_ESTABELECIMENTO': 'Ativo',
      'SITUACAO_ALVARA': 'Válido',
      'NUMERO_ALVARA': 'ALV-2026/001',
      'VALIDADE_ALVARA': '31/12/2026',
      'DATA_ULTIMA_INSPECAO_INICIO': '15/01/2026',
      'DATA_ULTIMA_INSPECAO_FIM': '15/01/2026',
      'DATA_PROXIMA_INSPECAO': '15/01/2027',
      'COMPETENCIA_FISCALIZACAO': 'Municipal',
      'PARECER_PROJETO_ARQUITETONICO': 'Não Aplicável',
      'FISCAIS_RESPONSAVEIS': 'Lucas Silveira, Matheus Oliveira',
      'OBSERVACOES_BAIXA': ''
    },
    {
      'CNPJ_OU_CPF': '98.765.432/0001-11',
      'RAZAO_SOCIAL': 'SUPERMERCADO E PADARIA VALE DO ACO EIRELI',
      'NOME_FANTASIA': 'SUPERMERCADO BOM PRECO',
      'IDENTIFICACAO_MUNICIPAL': 'IM-2089',
      'CNAE_CODIGO': '4711-3/02',
      'CNAE_DESCRICAO': 'Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios',
      'CNAES_SECUNDARIOS': '4721-1/03 - Comércio varejista de produtos de padaria e confeitaria; 4722-9/01 - Comércio varejista de carnes - açougues',
      'NIVEL_RISCO': 'Risco II',
      'LOGRADOURO': 'Rua Tiradentes',
      'NUMERO': '42',
      'BAIRRO': 'Centro',
      'CEP': '35189-000',
      'MUNICIPIO': 'Braúnas/MG',
      'TELEFONE': '(33) 99876-5432',
      'EMAIL': 'financeiro@supermercadobompreco.com.br',
      'SITUACAO_ESTABELECIMENTO': 'Ativo',
      'SITUACAO_ALVARA': 'Válido',
      'NUMERO_ALVARA': 'ALV-2026/002',
      'VALIDADE_ALVARA': '31/12/2026',
      'DATA_ULTIMA_INSPECAO_INICIO': '10/02/2026',
      'DATA_ULTIMA_INSPECAO_FIM': '10/02/2026',
      'DATA_PROXIMA_INSPECAO': '10/02/2027',
      'COMPETENCIA_FISCALIZACAO': 'Municipal',
      'PARECER_PROJETO_ARQUITETONICO': 'Sim',
      'FISCAIS_RESPONSAVEIS': 'Edmila Ferreira',
      'OBSERVACOES_BAIXA': ''
    },
    {
      'CNPJ_OU_CPF': '11.222.333/0001-44',
      'RAZAO_SOCIAL': 'LABORATORIO DE ANALISES CLINICAS SANTA RITA LTDA',
      'NOME_FANTASIA': 'LAB SANTA RITA',
      'IDENTIFICACAO_MUNICIPAL': 'IM-3012',
      'CNAE_CODIGO': '8640-2/02',
      'CNAE_DESCRICAO': 'Laboratórios clínicos e postos de coleta',
      'CNAES_SECUNDARIOS': '',
      'NIVEL_RISCO': 'Risco III',
      'LOGRADOURO': 'Rua Minas Gerais',
      'NUMERO': '88',
      'BAIRRO': 'Bela Vista',
      'CEP': '35189-000',
      'MUNICIPIO': 'Braúnas/MG',
      'TELEFONE': '(33) 3295-4321',
      'EMAIL': 'laudos@laboratoriosantarita.com.br',
      'SITUACAO_ESTABELECIMENTO': 'Ativo',
      'SITUACAO_ALVARA': 'Válido',
      'NUMERO_ALVARA': 'ALV-2026/003',
      'VALIDADE_ALVARA': '30/11/2026',
      'DATA_ULTIMA_INSPECAO_INICIO': '05/03/2026',
      'DATA_ULTIMA_INSPECAO_FIM': '06/03/2026',
      'DATA_PROXIMA_INSPECAO': '05/09/2026',
      'COMPETENCIA_FISCALIZACAO': 'Municipal',
      'PARECER_PROJETO_ARQUITETONICO': 'Sim',
      'FISCAIS_RESPONSAVEIS': 'Lucas Silveira, Matheus Oliveira',
      'OBSERVACOES_BAIXA': ''
    }
  ];

  // Instruções de preenchimento
  const instrucoes = [
    { 'CAMPO': 'CNPJ_OU_CPF', 'OBRIGATORIO': 'Sim', 'FORMATO_ACEITO': '00.000.000/0000-00 ou 000.000.000-00', 'DESCRICAO': 'Documento federal da empresa ou pessoa física responsável.' },
    { 'CAMPO': 'RAZAO_SOCIAL', 'OBRIGATORIO': 'Sim', 'FORMATO_ACEITO': 'Texto', 'DESCRICAO': 'Nome oficial empresarial registrado na Receita / JUCEMG.' },
    { 'CAMPO': 'NOME_FANTASIA', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Texto', 'DESCRICAO': 'Nome comercial ou de fachada.' },
    { 'CAMPO': 'IDENTIFICACAO_MUNICIPAL', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Letras e Números (Alfanumérico)', 'DESCRICAO': 'Inscrição ou identificação municipal do contribuinte na Prefeitura.' },
    { 'CAMPO': 'CNAE_CODIGO', 'OBRIGATORIO': 'Sim', 'FORMATO_ACEITO': '0000-0/00', 'DESCRICAO': 'Código CNAE primário/principal sujeito à vigilância sanitária.' },
    { 'CAMPO': 'CNAE_DESCRICAO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Texto', 'DESCRICAO': 'Descrição da atividade econômica principal.' },
    { 'CAMPO': 'CNAES_SECUNDARIOS', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Texto (separados por ponto e vírgula ";")', 'DESCRICAO': 'CNAEs e atividades econômicas secundárias do estabelecimento.' },
    { 'CAMPO': 'NIVEL_RISCO', 'OBRIGATORIO': 'Sim', 'FORMATO_ACEITO': 'Risco I, Risco II ou Risco III', 'DESCRICAO': 'Classificação de risco sanitário conforme Resolução SES/MG.' },
    { 'CAMPO': 'LOGRADOURO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Texto', 'DESCRICAO': 'Rua, Avenida, Praça, etc.' },
    { 'CAMPO': 'NUMERO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Texto/Número', 'DESCRICAO': 'Número do imóvel ou S/N.' },
    { 'CAMPO': 'BAIRRO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Texto', 'DESCRICAO': 'Bairro de localização em Braúnas/MG.' },
    { 'CAMPO': 'CEP', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': '35189-000', 'DESCRICAO': 'Código de Endereçamento Postal.' },
    { 'CAMPO': 'MUNICIPIO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Braúnas/MG', 'DESCRICAO': 'Município de competência sanitária.' },
    { 'CAMPO': 'TELEFONE', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': '(33) 0000-0000', 'DESCRICAO': 'Telefone fixo ou WhatsApp comercial.' },
    { 'CAMPO': 'EMAIL', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'nome@dominio.com', 'DESCRICAO': 'E-mail para notificações e termos sanitários.' },
    { 'CAMPO': 'SITUACAO_ESTABELECIMENTO', 'OBRIGATORIO': 'Sim', 'FORMATO_ACEITO': 'Ativo, Suspenso ou Inativo', 'DESCRICAO': 'Situação cadastral na VISA (Suspenso conta na base ativa).' },
    { 'CAMPO': 'SITUACAO_ALVARA', 'OBRIGATORIO': 'Sim', 'FORMATO_ACEITO': 'Válido, Vencido, Isento/Dispensado ou Não Possui (Irregular)', 'DESCRICAO': 'Status da licença/alvará sanitário.' },
    { 'CAMPO': 'NUMERO_ALVARA', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Texto', 'DESCRICAO': 'Número do alvará sanitário municipal.' },
    { 'CAMPO': 'VALIDADE_ALVARA', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'DD/MM/AAAA ou AAAA-MM-DD', 'DESCRICAO': 'Data de expiração da licença.' },
    { 'CAMPO': 'DATA_ULTIMA_INSPECAO_INICIO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'DD/MM/AAAA ou AAAA-MM-DD', 'DESCRICAO': 'Data do início da última vistoria sanitária.' },
    { 'CAMPO': 'DATA_ULTIMA_INSPECAO_FIM', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'DD/MM/AAAA ou AAAA-MM-DD', 'DESCRICAO': 'Data do término da última vistoria.' },
    { 'CAMPO': 'DATA_PROXIMA_INSPECAO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'DD/MM/AAAA ou AAAA-MM-DD', 'DESCRICAO': 'Previsão de retorno fiscalizatório.' },
    { 'CAMPO': 'COMPETENCIA_FISCALIZACAO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Municipal, Estadual ou Pactuado', 'DESCRICAO': 'Esfera responsável pela fiscalização.' },
    { 'CAMPO': 'PARECER_PROJETO_ARQUITETONICO', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Sim, Não ou Não Aplicável', 'DESCRICAO': 'Aprovação de projeto físico sanitário.' },
    { 'CAMPO': 'FISCAIS_RESPONSAVEIS', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Nomes separados por vírgula', 'DESCRICAO': 'Fiscais sanitários designados.' },
    { 'CAMPO': 'OBSERVACOES_BAIXA', 'OBRIGATORIO': 'Não', 'FORMATO_ACEITO': 'Texto', 'DESCRICAO': 'Motivo e data da baixa se a situação for Inativo.' }
  ];

  const wsModelo = XLSX.utils.json_to_sheet(dadosModelo);
  const wsInstrucoes = XLSX.utils.json_to_sheet(instrucoes);

  // Largura das colunas do modelo
  wsModelo['!cols'] = [
    { wch: 22 }, // CNPJ_OU_CPF
    { wch: 38 }, // RAZAO_SOCIAL
    { wch: 28 }, // NOME_FANTASIA
    { wch: 22 }, // IDENTIFICACAO_MUNICIPAL
    { wch: 14 }, // CNAE_CODIGO
    { wch: 50 }, // CNAE_DESCRICAO
    { wch: 45 }, // CNAES_SECUNDARIOS
    { wch: 14 }, // NIVEL_RISCO
    { wch: 25 }, // LOGRADOURO
    { wch: 10 }, // NUMERO
    { wch: 18 }, // BAIRRO
    { wch: 12 }, // CEP
    { wch: 16 }, // MUNICIPIO
    { wch: 18 }, // TELEFONE
    { wch: 30 }, // EMAIL
    { wch: 16 }, // SITUACAO_ESTABELECIMENTO
    { wch: 18 }, // SITUACAO_ALVARA
    { wch: 18 }, // NUMERO_ALVARA
    { wch: 18 }, // VALIDADE_ALVARA
    { wch: 24 }, // DATA_ULTIMA_INSPECAO_INICIO
    { wch: 22 }, // DATA_ULTIMA_INSPECAO_FIM
    { wch: 22 }, // DATA_PROXIMA_INSPECAO
    { wch: 22 }, // COMPETENCIA_FISCALIZACAO
    { wch: 24 }, // PARECER_PROJETO_ARQUITETONICO
    { wch: 30 }, // FISCAIS_RESPONSAVEIS
    { wch: 35 }  // OBSERVACOES_BAIXA
  ];

  wsInstrucoes['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 35 },
    { wch: 60 }
  ];

  XLSX.utils.book_append_sheet(wb, wsModelo, 'Estabelecimentos (Preencher)');
  XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções & Regras');

  XLSX.writeFile(wb, 'Modelo_Importacao_Estabelecimentos_VISA_Braunas.xlsx');
}

export interface ResultadoParsePlanilha {
  totalLinhas: number;
  validos: Estabelecimento[];
  erros: {
    linha: number;
    razaoSocial?: string;
    cnpj?: string;
    motivo: string;
  }[];
}

/**
 * Lê e valida um arquivo .xls ou .xlsx enviado pelo usuário
 */
export function parsearPlanilhaEstabelecimentos(buffer: ArrayBuffer | Uint8Array): ResultadoParsePlanilha {
  const wb = XLSX.read(buffer, { type: 'array' });
  const primeiraAba = wb.SheetNames[0];
  const ws = wb.Sheets[primeiraAba];
  
  if (!ws) {
    return {
      totalLinhas: 0,
      validos: [],
      erros: [{ linha: 0, motivo: 'Nenhuma planilha encontrada no arquivo enviado.' }]
    };
  }

  // Converte linhas em objetos brutos
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
  
  const validos: Estabelecimento[] = [];
  const erros: ResultadoParsePlanilha['erros'] = [];

  rawRows.forEach((row, index) => {
    const linhaNumero = index + 2; // Linha 1 é o cabeçalho no Excel

    // Normaliza as chaves do objeto para minúsculas sem pontuação
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      normalizedRow[cleanKey] = row[key];
    });

    // Extrai valores com fallbacks flexíveis
    const razaoSocial = String(
      normalizedRow['razaosocial'] || 
      normalizedRow['razao'] || 
      normalizedRow['nomeempresarial'] || 
      normalizedRow['empresa'] || ''
    ).trim();

    const cnpjCpfBruto = String(
      normalizedRow['cnpj'] || 
      normalizedRow['cnpjcpf'] || 
      normalizedRow['cnpjoucpf'] || 
      normalizedRow['cpf'] || 
      normalizedRow['documento'] || ''
    ).trim();

    const cnaeCodigo = String(
      normalizedRow['cnaecodigo'] || 
      normalizedRow['cnae'] || 
      normalizedRow['codigocnae'] || ''
    ).trim();

    const identificacaoMunicipal = String(
      normalizedRow['identificacaomunicipal'] || 
      normalizedRow['inscricaomunicipal'] || 
      normalizedRow['idmunicipal'] || 
      normalizedRow['im'] || ''
    ).trim();

    const cnaesSecundariosRaw = String(
      normalizedRow['cnaessecundarios'] || 
      normalizedRow['cnaesecundario'] || 
      normalizedRow['cnaessecundarias'] || 
      normalizedRow['atividadessecundarias'] || ''
    ).trim();
    const cnaesSecundarios = cnaesSecundariosRaw
      ? cnaesSecundariosRaw.split(/[\n;]/).map(c => c.trim()).filter(Boolean)
      : [];

    // Validação de campos obrigatórios
    if (!razaoSocial) {
      erros.push({
        linha: linhaNumero,
        cnpj: cnpjCpfBruto,
        motivo: 'Razão Social não informada ou vazia.'
      });
      return;
    }

    if (!cnaeCodigo && !cnpjCpfBruto) {
      erros.push({
        linha: linhaNumero,
        razaoSocial,
        motivo: 'CNAE e CNPJ/CPF não foram preenchidos.'
      });
      return;
    }

    // Normalização do Nível de Risco
    const riscoRaw = String(normalizedRow['nivelrisco'] || normalizedRow['risco'] || normalizedRow['grauderisco'] || '').toUpperCase();
    let nivelRisco: 'Risco I' | 'Risco II' | 'Risco III' = 'Risco I';
    if (riscoRaw.includes('III') || riscoRaw.includes('3') || riscoRaw.includes('ALTO')) {
      nivelRisco = 'Risco III';
    } else if (riscoRaw.includes('II') || riscoRaw.includes('2') || riscoRaw.includes('MEDIO')) {
      nivelRisco = 'Risco II';
    } else {
      nivelRisco = 'Risco I';
    }

    // Normalização da Situação Cadastral
    const sitRaw = String(normalizedRow['situacaoestabelecimento'] || normalizedRow['situacao'] || normalizedRow['status'] || '').toUpperCase();
    let situacaoEstabelecimento: SituacaoEstabelecimento = 'Ativo';
    if (sitRaw.includes('SUSPENS') || sitRaw.includes('INTERDIT')) {
      situacaoEstabelecimento = 'Suspenso';
    } else if (sitRaw.includes('INATIV') || sitRaw.includes('BAIXAD') || sitRaw.includes('ENCERR')) {
      situacaoEstabelecimento = 'Inativo';
    }

    // Normalização da Situação do Alvará
    const alvRaw = String(normalizedRow['situacaoalvara'] || normalizedRow['alvara'] || '').toUpperCase();
    let situacaoAlvara: SituacaoAlvara = 'Válido';
    if (alvRaw.includes('IRREGULAR') || alvRaw.includes('NÃO POSSUI') || alvRaw.includes('NAO POSSUI') || alvRaw.includes('SEM ALVARÁ') || alvRaw.includes('SEM ALVARA')) {
      situacaoAlvara = 'Não Possui (Irregular)';
    } else if (alvRaw.includes('VENCID')) {
      situacaoAlvara = 'Vencido';
    } else if (alvRaw.includes('ISENT') || alvRaw.includes('DISPENS')) {
      situacaoAlvara = 'Isento/Dispensado';
    }

    // Normalização de Competência
    const compRaw = String(normalizedRow['competenciafiscalizacao'] || normalizedRow['competencia'] || '').toUpperCase();
    let competenciaFiscalizacao: 'Municipal' | 'Estadual' | 'Pactuado' = 'Municipal';
    if (compRaw.includes('ESTADUAL')) {
      competenciaFiscalizacao = 'Estadual';
    } else if (compRaw.includes('PACTU')) {
      competenciaFiscalizacao = 'Pactuado';
    }

    // Normalização de Parecer Arquitetônico
    const parcRaw = String(normalizedRow['parecerprojetoarquitetonico'] || normalizedRow['parecer'] || '').toUpperCase();
    let parecerProjetoArquitetonico: 'Sim' | 'Não' | 'Não Aplicável' = 'Não Aplicável';
    if (parcRaw === 'SIM' || parcRaw === 'S') {
      parecerProjetoArquitetonico = 'Sim';
    } else if (parcRaw === 'NAO' || parcRaw === 'NÃO' || parcRaw === 'N') {
      parecerProjetoArquitetonico = 'Não';
    }

    // Fiscais
    const fiscaisRaw = String(normalizedRow['fiscaisresponsaveis'] || normalizedRow['fiscais'] || '').trim();
    const fiscaisUltimaInspecao = fiscaisRaw 
      ? fiscaisRaw.split(/[,;\/]/).map(f => f.trim()).filter(Boolean)
      : [FISCAIS_MUNICIPIO[0]];

    // CNPJ/CPF formatado
    const cnpjLimpo = cnpjCpfBruto.replace(/\D/g, '');
    const cnpjFormatado = cnpjLimpo ? aplicarMascaraCnpjCpf(cnpjLimpo) : `S/DOC-${Math.floor(1000 + Math.random() * 9000)}`;

    // Geração de ID consistente baseado no documento ou razão social
    const idSufixo = cnpjLimpo ? cnpjLimpo.slice(0, 14) : Math.random().toString(36).substring(2, 9);
    const id = `braunas-est-${idSufixo}`;

    // Construção do objeto Estabelecimento estritamente tipado
    const est: Estabelecimento = {
      id,
      razaoSocial,
      nomeFantasia: String(normalizedRow['nomefantasia'] || normalizedRow['fantasia'] || '').trim() || razaoSocial,
      identificacaoMunicipal: identificacaoMunicipal || undefined,
      cnpjCpf: cnpjFormatado,
      cnaeCodigo: cnaeCodigo || '4711-3/02',
      cnaeDescricao: String(normalizedRow['cnaedescricao'] || normalizedRow['atividade'] || 'Comércio em geral').trim(),
      cnaesSecundarios: cnaesSecundarios.length > 0 ? cnaesSecundarios : undefined,
      nivelRisco,
      endereco: {
        logradouro: String(normalizedRow['logradouro'] || normalizedRow['rua'] || normalizedRow['endereco'] || 'Zona Urbana').trim(),
        numero: String(normalizedRow['numero'] || normalizedRow['num'] || 'S/N').trim(),
        bairro: String(normalizedRow['bairro'] || 'Centro').trim(),
        cep: aplicarMascaraCep(String(normalizedRow['cep'] || '35189-000')),
        municipio: String(normalizedRow['municipio'] || 'Braúnas/MG').trim()
      },
      contato: {
        telefone: aplicarMascaraTelefone(String(normalizedRow['telefone'] || normalizedRow['tel'] || '(33) 3295-1200')),
        email: String(normalizedRow['email'] || '').trim()
      },
      situacaoEstabelecimento,
      situacaoAlvara,
      numeroAlvara: String(normalizedRow['numeroalvara'] || normalizedRow['numalvara'] || `ALV-2026/${linhaNumero.toString().padStart(3, '0')}`).trim(),
      dataValidadeAlvara: normalizarDataExcel(normalizedRow['validadealvara'] || normalizedRow['datavalidadealvara']) || '2026-12-31',
      dataUltimaInspecaoInicio: normalizarDataExcel(normalizedRow['dataultimainspecaoinicio'] || normalizedRow['ultimainspecaoinicio'] || normalizedRow['datainicioinspecao']),
      dataUltimaInspecaoFim: normalizarDataExcel(normalizedRow['dataultimainspecaofim'] || normalizedRow['ultimainspecaofim'] || normalizedRow['datafiminspecao']),
      dataProximaInspecao: normalizarDataExcel(normalizedRow['dataproximainspecao'] || normalizedRow['proximainspecao']),
      competenciaFiscalizacao,
      parecerProjetoArquitetonico,
      fiscaisUltimaInspecao,
      observacoesBaixa: String(normalizedRow['observacoesbaixa'] || normalizedRow['obs'] || '').trim()
    };

    validos.push(est);
  });

  return {
    totalLinhas: rawRows.length,
    validos,
    erros
  };
}

/**
 * Persiste um lote de estabelecimentos validados no Firestore com auditoria completa
 */
export async function importarEstabelecimentosEmLote(
  estabelecimentos: Estabelecimento[],
  usuarioEmail: string = 'eng.macieira@gmail.com'
): Promise<{ importados: number; atualizados: number; falhas: number }> {
  let importados = 0;
  let atualizados = 0;
  let falhas = 0;

  // Carrega lista existente para saber se é novo ou edição
  const backup = localStorage.getItem(LOCAL_STORAGE_EST_KEY);
  const listExistente: Estabelecimento[] = backup ? JSON.parse(backup) : [...SEED_ESTABELECIMENTOS];
  const mapaExistentes = new Map<string, Estabelecimento>();
  
  listExistente.forEach(item => {
    mapaExistentes.set(item.id, item);
    if (item.cnpjCpf) {
      mapaExistentes.set(item.cnpjCpf.replace(/\D/g, ''), item);
    }
  });

  for (const est of estabelecimentos) {
    try {
      const cnpjPuro = est.cnpjCpf.replace(/\D/g, '');
      const estExistente = mapaExistentes.get(est.id) || (cnpjPuro ? mapaExistentes.get(cnpjPuro) : undefined);
      const isUpdate = !!estExistente;
      
      const targetId = estExistente ? estExistente.id : est.id;
      const payload: Estabelecimento = {
        ...est,
        id: targetId
      };

      await saveEstabelecimento(payload, {
        usuario: usuarioEmail,
        fiscalResponsavel: est.fiscaisUltimaInspecao?.[0] || FISCAIS_MUNICIPIO[0],
        detalhesPersonalizados: isUpdate
          ? `Atualização cadastral em lote via planilha Excel (.xls/.xlsx). Risco: ${est.nivelRisco}.`
          : `Inclusão cadastral em lote via planilha Excel (.xls/.xlsx). Risco: ${est.nivelRisco}.`
      });

      if (isUpdate) {
        atualizados++;
      } else {
        importados++;
      }
    } catch (err) {
      console.error('Falha ao importar item:', est.razaoSocial, err);
      falhas++;
    }
  }

  return { importados, atualizados, falhas };
}

/**
 * Exporta dados de estabelecimentos para CSV, XLSX ou XLS com formatação completa,
 * suporte a delimitador customizado (;, ,), codificação UTF-8 com BOM e registro de auditoria.
 */
export async function exportarEstabelecimentosFormatados(
  todosEstabelecimentos: Estabelecimento[],
  opcoes: OpcoesExportacao
): Promise<ResultadoExportacao> {
  const {
    formato = 'xlsx',
    delimitadorCsv = ';',
    escopo = 'todos',
    estabelecimentosFiltrados = [],
    incluirMetadados = true,
    registrarAuditoria = true,
    usuarioEmail = 'eng.macieira@gmail.com',
    fiscalResponsavel = FISCAIS_MUNICIPIO[0]
  } = opcoes;

  // 1. Determina a lista alvo conforme o escopo selecionado
  let listaAlvo: Estabelecimento[] = [];
  let escopoDescricao = '';

  switch (escopo) {
    case 'ativos':
      listaAlvo = todosEstabelecimentos.filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso');
      escopoDescricao = 'Apenas Estabelecimentos Ativos (inclui Suspensos)';
      break;
    case 'baixados':
      listaAlvo = todosEstabelecimentos.filter(e => e.situacaoEstabelecimento === 'Inativo');
      escopoDescricao = 'Apenas Estabelecimentos Baixados / Histórico';
      break;
    case 'filtrados':
      listaAlvo = estabelecimentosFiltrados.length > 0 ? estabelecimentosFiltrados : todosEstabelecimentos;
      escopoDescricao = `Registros Filtrados na Tela (${listaAlvo.length} itens)`;
      break;
    case 'todos':
    default:
      listaAlvo = [...todosEstabelecimentos];
      escopoDescricao = 'Todos os Estabelecimentos (Base Completa)';
      break;
  }

  // Ordena alfabeticamente por Razão Social
  listaAlvo.sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial, 'pt-BR'));

  const dataHora = new Date();
  const dataIsoStr = dataHora.toISOString().split('T')[0];
  const horaStr = dataHora.toTimeString().split(' ')[0].replace(/:/g, '');
  const anoAtual = dataHora.getFullYear();

  // Nome padronizado do arquivo
  const prefixo = escopo === 'todos' ? 'Backup_Estabelecimentos' : `Exportacao_${escopo.toUpperCase()}`;
  const extensao = formato === 'csv' ? 'csv' : (formato === 'xls' ? 'xls' : 'xlsx');
  const nomeArquivo = `${prefixo}_VISA_Braunas_${dataIsoStr}_${horaStr}.${extensao}`;

  // Estruturação dos dados das colunas padronizadas
  const dadosFormatados = listaAlvo.map((e, index) => ({
    'Nº': index + 1,
    'ID Sistema': e.id,
    'CNPJ / CPF': e.cnpjCpf ? aplicarMascaraCnpjCpf(e.cnpjCpf) : '-',
    'Razão Social': e.razaoSocial || '-',
    'Nome Fantasia': e.nomeFantasia || '-',
    'Identificação Municipal': e.identificacaoMunicipal || '-',
    'CNAE Principal': e.cnaeCodigo || '-',
    'Descrição da Atividade': e.cnaeDescricao || '-',
    'CNAEs Secundários': (e.cnaesSecundarios && e.cnaesSecundarios.length > 0) ? e.cnaesSecundarios.join('; ') : '-',
    'Risco Sanitário': e.nivelRisco || '-',
    'Competência': e.competenciaFiscalizacao || 'Municipal',
    'Parecer Arquitetônico': e.parecerProjetoArquitetonico || 'Não Aplicável',
    'Situação Cadastral': e.situacaoEstabelecimento || 'Ativo',
    'Motivo Baixa': e.observacoesBaixa || '-',
    'Logradouro': e.endereco?.logradouro || '-',
    'Número': e.endereco?.numero || 'S/N',
    'Bairro': e.endereco?.bairro || '-',
    'CEP': e.endereco?.cep ? aplicarMascaraCep(e.endereco.cep) : '-',
    'Município': e.endereco?.municipio || 'Braúnas/MG',
    'UF': 'MG',
    'Telefone': e.contato?.telefone ? aplicarMascaraTelefone(e.contato.telefone) : '-',
    'E-mail': e.contato?.email || '-',
    'Situação do Alvará': e.situacaoAlvara || 'Sem Alvará',
    'Número do Alvará': e.numeroAlvara || '-',
    'Validade do Alvará': e.dataValidadeAlvara ? formatarDataBr(e.dataValidadeAlvara) : '-',
    'Data Início Última Inspeção': e.dataUltimaInspecaoInicio ? formatarDataBr(e.dataUltimaInspecaoInicio) : '-',
    'Data Fim Última Inspeção': e.dataUltimaInspecaoFim ? formatarDataBr(e.dataUltimaInspecaoFim) : '-',
    'Inspecionado no Ano Vigente': (e.dataUltimaInspecaoInicio?.startsWith(String(anoAtual)) || e.dataUltimaInspecaoFim?.startsWith(String(anoAtual))) ? 'SIM' : 'NÃO',
    'Próxima Inspeção Prevista': e.dataProximaInspecao ? formatarDataBr(e.dataProximaInspecao) : '-',
    'Fiscais Responsáveis': (e.fiscaisUltimaInspecao && e.fiscaisUltimaInspecao.length > 0) ? e.fiscaisUltimaInspecao.join('; ') : 'Equipe VISA Braúnas',
    'Data de Cadastro': e.createdAt ? new Date(e.createdAt).toLocaleString('pt-BR') : '-'
  }));

  if (formato === 'csv') {
    // Geração de CSV com UTF-8 BOM e delimitador selecionado (; ou ,)
    const cabecalhos = dadosFormatados.length > 0 
      ? Object.keys(dadosFormatados[0]) 
      : ['Nº', 'ID Sistema', 'CNPJ / CPF', 'Razão Social', 'Nome Fantasia', 'Identificação Municipal', 'CNAE Principal', 'Descrição da Atividade', 'CNAEs Secundários', 'Risco Sanitário', 'Competência', 'Parecer Arquitetônico', 'Situação Cadastral', 'Motivo Baixa', 'Logradouro', 'Número', 'Bairro', 'CEP', 'Município', 'UF', 'Telefone', 'E-mail', 'Situação do Alvará', 'Número do Alvará', 'Validade do Alvará', 'Data Início Última Inspeção', 'Data Fim Última Inspeção', 'Inspecionado no Ano Vigente', 'Próxima Inspeção Prevista', 'Fiscais Responsáveis', 'Data de Cadastro'];
    
    // Função para escapar valores CSV de acordo com RFC 4180
    const escaparCsv = (valor: any): string => {
      if (valor === null || valor === undefined) return '';
      const str = String(valor);
      if (str.includes(delimitadorCsv) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Prepend UTF-8 BOM (\uFEFF) para que o MS Excel abra caracteres acentuados corretamente
    let csvContent = '\uFEFF';
    csvContent += cabecalhos.map(escaparCsv).join(delimitadorCsv) + '\r\n';

    for (const linha of dadosFormatados) {
      const valores = cabecalhos.map(c => escaparCsv((linha as any)[c]));
      csvContent += valores.join(delimitadorCsv) + '\r\n';
    }

    // Cria Blob e dispara download no navegador
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Formato XLSX ou XLS usando SheetJS
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosFormatados);

    // Ajuste de largura das colunas
    ws['!cols'] = [
      { wch: 5 },  // Nº
      { wch: 20 }, // ID Sistema
      { wch: 20 }, // CNPJ/CPF
      { wch: 38 }, // Razão Social
      { wch: 30 }, // Nome Fantasia
      { wch: 22 }, // Identificação Municipal
      { wch: 14 }, // CNAE Principal
      { wch: 45 }, // CNAE Descrição
      { wch: 45 }, // CNAEs Secundários
      { wch: 15 }, // Risco Sanitário
      { wch: 15 }, // Competência
      { wch: 18 }, // Parecer
      { wch: 14 }, // Situação Cadastral
      { wch: 35 }, // Motivo Baixa
      { wch: 28 }, // Logradouro
      { wch: 8 },  // Número
      { wch: 18 }, // Bairro
      { wch: 12 }, // CEP
      { wch: 16 }, // Município
      { wch: 6 },  // UF
      { wch: 16 }, // Telefone
      { wch: 28 }, // E-mail
      { wch: 18 }, // Situação Alvará
      { wch: 18 }, // Número Alvará
      { wch: 16 }, // Validade Alvará
      { wch: 16 }, // Data Início Insp
      { wch: 16 }, // Data Fim Insp
      { wch: 14 }, // Inspecionado Ano
      { wch: 16 }, // Próxima Insp
      { wch: 30 }, // Fiscais
      { wch: 20 }, // Data Cadastro
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Estabelecimentos');

    if (incluirMetadados) {
      // Aba de Auditoria / Resumo Técnico da Exportação
      const dadosResumo = [
        { 'Parâmetro de Auditoria': 'Órgão Emissor', 'Informação': 'Vigilância Sanitária Municipal de Braúnas / MG' },
        { 'Parâmetro de Auditoria': 'Finalidade do Arquivo', 'Informação': 'Backup Externo & Análise Offline de Dados Cadastrais' },
        { 'Parâmetro de Auditoria': 'Data e Hora da Exportação', 'Informação': dataHora.toLocaleString('pt-BR') },
        { 'Parâmetro de Auditoria': 'Escopo Selecionado', 'Informação': escopoDescricao },
        { 'Parâmetro de Auditoria': 'Formato Gerado', 'Informação': formato.toUpperCase() },
        { 'Parâmetro de Auditoria': 'Total de Estabelecimentos Exportados', 'Informação': `${listaAlvo.length} registros` },
        { 'Parâmetro de Auditoria': 'Total Ativos (inclui Suspensos)', 'Informação': `${listaAlvo.filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso').length}` },
        { 'Parâmetro de Auditoria': 'Total Suspensos/Interditados', 'Informação': `${listaAlvo.filter(e => e.situacaoEstabelecimento === 'Suspenso').length}` },
        { 'Parâmetro de Auditoria': 'Total Baixados', 'Informação': `${listaAlvo.filter(e => e.situacaoEstabelecimento === 'Inativo').length}` },
        { 'Parâmetro de Auditoria': 'Risco I (Baixo Risco)', 'Informação': `${listaAlvo.filter(e => e.nivelRisco === 'Risco I').length}` },
        { 'Parâmetro de Auditoria': 'Risco II (Médio Risco)', 'Informação': `${listaAlvo.filter(e => e.nivelRisco === 'Risco II').length}` },
        { 'Parâmetro de Auditoria': 'Risco III (Alto Risco)', 'Informação': `${listaAlvo.filter(e => e.nivelRisco === 'Risco III').length}` },
        { 'Parâmetro de Auditoria': 'Operador Responsável', 'Informação': usuarioEmail },
        { 'Parâmetro de Auditoria': 'Fiscal Responsável', 'Informação': fiscalResponsavel }
      ];
      const wsResumo = XLSX.utils.json_to_sheet(dadosResumo);
      wsResumo['!cols'] = [{ wch: 35 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo do Backup');
    }

    if (formato === 'xls') {
      XLSX.writeFile(wb, nomeArquivo, { bookType: 'biff8' });
    } else {
      XLSX.writeFile(wb, nomeArquivo, { bookType: 'xlsx' });
    }
  }

  // Registra Log de Auditoria
  if (registrarAuditoria) {
    try {
      await registrarLogAuditoria({
        recursoId: `exp-${Date.now()}`,
        operacao: 'export',
        colecao: 'backups_exportados',
        usuario: usuarioEmail,
        identificadorEntidade: nomeArquivo,
        detalhes: `Exportação de dados concluída: ${listaAlvo.length} estabelecimentos no formato ${formato.toUpperCase()}${formato === 'csv' ? ` (delimitador: "${delimitadorCsv}")` : ''} - Escopo: ${escopoDescricao}.`,
        tipoRegistro: 'ExportacaoBackup',
        acao: 'Exportação',
        fiscalResponsavel: fiscalResponsavel,
        registroId: nomeArquivo
      });
    } catch (auditErr) {
      console.warn('Não foi possível persistir log de auditoria da exportação:', auditErr);
    }
  }

  return {
    sucesso: true,
    nomeArquivo,
    totalExportados: listaAlvo.length,
    formato,
    timestamp: dataHora.toISOString()
  };
}

export interface OpcoesLimpezaBanco {
  limparEstabelecimentos?: boolean;
  limparInspecoesVapt?: boolean;
  limparLogsAuditoria?: boolean;
  manterConfiguracoes?: boolean;
  fiscalResponsavel?: string;
  usuarioEmail?: string;
}

export async function limparBancoDeDados(opcoes?: OpcoesLimpezaBanco): Promise<{
  estabelecimentosRemovidos: number;
  vaptRemovidos: number;
  logsRemovidos: number;
}> {
  const opt: OpcoesLimpezaBanco = {
    limparEstabelecimentos: true,
    limparInspecoesVapt: true,
    limparLogsAuditoria: true,
    manterConfiguracoes: true,
    fiscalResponsavel: FISCAIS_MUNICIPIO[0],
    usuarioEmail: 'eng.macieira@gmail.com',
    ...opcoes
  };

  let estabelecimentosRemovidos = 0;
  let vaptRemovidos = 0;
  let logsRemovidos = 0;

  // 1. Limpar Estabelecimentos
  if (opt.limparEstabelecimentos) {
    try {
      const snapEst = await getDocs(collection(db, ESTABELECIMENTOS_COLLECTION));
      for (const d of snapEst.docs) {
        await deleteDoc(doc(db, ESTABELECIMENTOS_COLLECTION, d.id));
        estabelecimentosRemovidos++;
      }
    } catch (e) {
      console.error('Erro ao expurgar estabelecimentos:', e);
    }
    localStorage.removeItem(LOCAL_STORAGE_EST_KEY);
  }

  // 2. Limpar Inspeções VAPT
  if (opt.limparInspecoesVapt) {
    try {
      const snapVapt = await getDocs(collection(db, INSPECOES_VAPT_COLLECTION));
      for (const d of snapVapt.docs) {
        await deleteDoc(doc(db, INSPECOES_VAPT_COLLECTION, d.id));
        vaptRemovidos++;
      }
    } catch (e) {
      console.error('Erro ao expurgar vistorias VAPT:', e);
    }
    localStorage.removeItem(LOCAL_STORAGE_VAPT_KEY);
  }

  // 3. Limpar Logs de Auditoria
  if (opt.limparLogsAuditoria) {
    try {
      const snapLogs = await getDocs(collection(db, LOGS_AUDITORIA_COLLECTION));
      for (const d of snapLogs.docs) {
        await deleteDoc(doc(db, LOGS_AUDITORIA_COLLECTION, d.id));
        logsRemovidos++;
      }
    } catch (e) {
      console.error('Erro ao expurgar logs de auditoria:', e);
    }
    localStorage.removeItem(LOCAL_STORAGE_LOGS_KEY);
  }

  // 4. Marca o banco como inicializado (bancoInicializado: true) para evitar re-semeadura automática
  try {
    const configAtual = await fetchConfiguracaoSistema();
    const novaConfig: ConfiguracaoSistema = {
      ...configAtual,
      bancoInicializado: true,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'configuracoes_sistema', 'geral'), novaConfig);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(novaConfig));
  } catch (e) {
    console.error('Erro ao atualizar flag de banco inicializado:', e);
  }

  // 5. Registra novo log de auditoria documentando o expurgo total
  try {
    await registrarLogAuditoria({
      acao: 'Exclusão',
      operacao: 'delete',
      colecao: 'estabelecimentos',
      tipoRegistro: 'Estabelecimento',
      registroId: 'expurgo-geral',
      recursoId: `expurgo-${Date.now()}`,
      identificadorEntidade: `Expurgo Geral do Banco de Dados: ${estabelecimentosRemovidos} estabelecimentos, ${vaptRemovidos} VAPT, ${logsRemovidos} logs`,
      fiscalResponsavel: opt.fiscalResponsavel || FISCAIS_MUNICIPIO[0],
      usuario: opt.usuarioEmail || 'eng.macieira@gmail.com',
      detalhes: `Comando de limpeza total do banco de dados executado pelo operador. Coleções purgadas e base zerada pronta para inserção ou importação limpa.`
    });
  } catch (e) {
    console.warn('Log de auditoria após limpeza:', e);
  }

  return {
    estabelecimentosRemovidos,
    vaptRemovidos,
    logsRemovidos
  };
}

export async function restaurarDadosDemonstrativos(): Promise<void> {
  await seedInitialEstabelecimentos();
  await seedInitialVapt();
  const config = await fetchConfiguracaoSistema();
  const novaConfig: ConfiguracaoSistema = {
    ...config,
    bancoInicializado: false,
    updatedAt: new Date().toISOString()
  };
  await saveConfiguracaoSistema(novaConfig);
}

