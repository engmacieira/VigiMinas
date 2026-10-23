import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  fetchEstabelecimentos, 
  fetchInspecoesVapt, 
  fetchLogsAuditoria,
  fetchConfiguracaoSistema,
  saveEstabelecimento, 
  deleteEstabelecimento, 
  deletePermanenteEstabelecimento,
  restoreEstabelecimento,
  saveInspecaoVapt, 
  deleteInspecaoVapt, 
  restoreInspecaoVapt,
  saveConfiguracaoSistema,
  calcularIndicadores, 
  calcularAlertasVapt,
  exportarPlanilhaVigiMinas,
  registrarLogAuditoria,
  gerarPlanilhaModeloEstabelecimentos,
  parsearPlanilhaEstabelecimentos,
  importarEstabelecimentosEmLote,
  exportarEstabelecimentosFormatados,
  limparBancoDeDados,
  restaurarDadosDemonstrativos,
  OpcoesLimpezaBanco,
  ResultadoParsePlanilha
} from '../services/vigiminasService';
import { testConnection } from '../lib/firebase';
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
  AlertasInspecoesVapt
} from '../types/vigiminas';
import { SEED_CONFIGURACAO_SISTEMA } from '../data/braunasInitialData';

interface InspecaoRapidaPayload {
  estabelecimentoId: string;
  dataInspecao: string;
  fiscais: string[];
  renovarAlvara: boolean;
  novoAlvaraNumero?: string;
  novaValidadeAlvara?: string;
}

interface VigiMinasContextType {
  estabelecimentos: Estabelecimento[];
  inspecoesVapt: InspecaoVapt[];
  logsAuditoria: LogAuditoria[];
  indicadores: VigiMinasIndicadores;
  alertasVapt: AlertasInspecoesVapt;
  configuracao: ConfiguracaoSistema;
  fiscaisAtivos: string[];
  loading: boolean;
  toastMessage: string | null;
  // Eventos modulados
  showToast: (msg: string) => void;
  recarregarDados: () => Promise<void>;
  salvarEstabelecimento: (est: Estabelecimento) => Promise<void>;
  removerEstabelecimento: (id: string, razao: string, motivoExclusao?: string) => Promise<void>;
  excluirPermanenteEstabelecimento: (id: string, razao: string, motivoExclusao?: string) => Promise<void>;
  restaurarEstabelecimento: (id: string, razao: string) => Promise<void>;
  executarInspecaoRapida: (payload: InspecaoRapidaPayload) => Promise<void>;
  salvarVistoriaVapt: (vapt: InspecaoVapt) => Promise<void>;
  removerVistoriaVapt: (id: string, termo: string, motivoExclusao?: string) => Promise<void>;
  restaurarVistoriaVapt: (id: string, termo: string) => Promise<void>;
  exportarPlanilha: () => void;
  exportarEstabelecimentos: (opcoes: OpcoesExportacao) => Promise<ResultadoExportacao>;
  // Importação e Geração de Planilha Modelo
  gerarModeloPlanilha: () => void;
  processarArquivoPlanilha: (buffer: ArrayBuffer | Uint8Array) => ResultadoParsePlanilha;
  importarLotePlanilha: (estabelecimentos: Estabelecimento[]) => Promise<{ importados: number; atualizados: number; falhas: number }>;
  // Eventos de configurações gerais
  salvarConfiguracaoGeral: (config: ConfiguracaoSistema) => Promise<void>;
  adicionarFiscal: (fiscal: Omit<FiscalSanitario, 'id'>) => Promise<void>;
  atualizarFiscal: (fiscal: FiscalSanitario) => Promise<void>;
  removerFiscal: (fiscalId: string, motivoExclusao?: string) => Promise<void>;
  excluirPermanenteFiscal: (fiscalId: string, motivoExclusao?: string) => Promise<void>;
  restaurarFiscal: (fiscalId: string) => Promise<void>;
  atualizarDadosSecretaria: (dados: DadosSecretaria) => Promise<void>;
  atualizarExercicioAtivo: (exercicio: ConfiguracaoExercicio) => Promise<void>;
  limparBanco: (opcoes?: OpcoesLimpezaBanco) => Promise<{ estabelecimentosRemovidos: number; vaptRemovidos: number; logsRemovidos: number }>;
  restaurarDemonstrativos: () => Promise<void>;
}

const VigiMinasContext = createContext<VigiMinasContextType | null>(null);

export const VigiMinasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [inspecoesVapt, setInspecoesVapt] = useState<InspecaoVapt[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<LogAuditoria[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoSistema>(SEED_CONFIGURACAO_SISTEMA);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const recarregarDados = useCallback(async () => {
    setLoading(true);
    try {
      testConnection();
      const [estList, vaptList, logsList, configData] = await Promise.all([
        fetchEstabelecimentos(),
        fetchInspecoesVapt(),
        fetchLogsAuditoria(),
        fetchConfiguracaoSistema()
      ]);
      setEstabelecimentos(estList);
      setInspecoesVapt(vaptList);
      setLogsAuditoria(logsList);
      setConfiguracao(configData);
    } catch (error) {
      console.error('Erro na sincronização:', error);
      showToast('Erro ao sincronizar dados com o banco.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    recarregarDados();
  }, [recarregarDados]);

  // Lista dinâmica de fiscais ativos para preenchimento de formulários
  const fiscaisAtivos = useMemo(() => {
    const ativos = configuracao.fiscais
      .filter(f => f.ativo && !f.isDeleted)
      .map(f => f.nome);
    return ativos.length > 0 ? ativos : ['Lucas Silveira', 'Matheus Oliveira', 'Edmila Ferreira'];
  }, [configuracao.fiscais]);

  // Cálculo reativo dos 5 Indicadores baseado no exercício e metas configuradas
  const indicadores = useMemo(() => {
    return calcularIndicadores(
      estabelecimentos, 
      inspecoesVapt, 
      configuracao.exercicioAtivo.anoExercicio,
      configuracao.exercicioAtivo
    );
  }, [estabelecimentos, inspecoesVapt, configuracao.exercicioAtivo]);

  // Alertas de VAPT: vistorias vencidas ou a vencer em até 5 dias
  const alertasVapt = useMemo(() => {
    return calcularAlertasVapt(inspecoesVapt, estabelecimentos);
  }, [inspecoesVapt, estabelecimentos]);

  // Evento: Salvar/Atualizar Estabelecimento (com auditoria embutida no service)
  const salvarEstabelecimento = useCallback(async (est: Estabelecimento) => {
    await saveEstabelecimento(est);
    await recarregarDados();
    showToast(`Estabelecimento "${est.razaoSocial}" gravado com sucesso.`);
  }, [recarregarDados, showToast]);

  // Evento: Remover Estabelecimento (Arquivamento / Soft Delete com Motivo)
  const removerEstabelecimento = useCallback(async (id: string, razao: string, motivoExclusao?: string) => {
    await deleteEstabelecimento(id, motivoExclusao);
    await recarregarDados();
    showToast(`Estabelecimento "${razao}" arquivado.`);
  }, [recarregarDados, showToast]);

  // Evento: Excluir Definitivamente da Visão do Usuário (Soft Delete retido em banco para administradores)
  const excluirPermanenteEstabelecimento = useCallback(async (id: string, razao: string, motivoExclusao?: string) => {
    await deletePermanenteEstabelecimento(id, motivoExclusao);
    await recarregarDados();
    showToast(`Estabelecimento "${razao}" excluído com sucesso.`);
  }, [recarregarDados, showToast]);

  // Evento: Restaurar Estabelecimento (Undo Soft Delete)
  const restaurarEstabelecimento = useCallback(async (id: string, razao: string) => {
    await restoreEstabelecimento(id);
    await recarregarDados();
    showToast(`Cadastro de "${razao}" restaurado com sucesso.`);
  }, [recarregarDados, showToast]);

  // Evento: Registrar Inspeção Sanitária Rápida
  const executarInspecaoRapida = useCallback(async (payload: InspecaoRapidaPayload) => {
    const estOriginal = estabelecimentos.find(e => e.id === payload.estabelecimentoId);
    if (!estOriginal) return;

    const atualizado: Estabelecimento = {
      ...estOriginal,
      dataUltimaInspecaoInicio: payload.dataInspecao,
      dataUltimaInspecaoFim: payload.dataInspecao,
      dataProximaInspecao: payload.novaValidadeAlvara || estOriginal.dataProximaInspecao,
      fiscaisUltimaInspecao: payload.fiscais,
      ...(payload.renovarAlvara ? {
        situacaoAlvara: 'Válido',
        numeroAlvara: payload.novoAlvaraNumero || estOriginal.numeroAlvara,
        dataValidadeAlvara: payload.novaValidadeAlvara || estOriginal.dataValidadeAlvara
      } : {})
    };

    await saveEstabelecimento(atualizado);

    // Registra log explícito de Inspeção Rápida
    await registrarLogAuditoria({
      recursoId: atualizado.id,
      registroId: atualizado.id,
      operacao: 'update',
      colecao: 'estabelecimentos',
      usuario: payload.fiscais[0] ? `${payload.fiscais[0].toLowerCase().replace(/\s+/g, '.')}@braunas.mg.gov.br` : 'fiscal.visa@braunas.mg.gov.br',
      tipoRegistro: 'InspecaoSanitariaRapida',
      acao: 'Inspeção Rápida',
      identificadorEntidade: atualizado.razaoSocial,
      fiscalResponsavel: payload.fiscais.join(', '),
      detalhes: `Inspeção sanitária realizada em ${payload.dataInspecao}${payload.renovarAlvara ? ` com alvará renovado (${atualizado.numeroAlvara})` : ''}.`
    });

    await recarregarDados();
    showToast(`Inspeção concluída em "${atualizado.razaoSocial}". Metas recalculadas.`);
  }, [estabelecimentos, recarregarDados, showToast]);

  // Evento: Salvar Vistoria VAPT (Indicador 11)
  const salvarVistoriaVapt = useCallback(async (vapt: InspecaoVapt) => {
    await saveInspecaoVapt(vapt);
    await recarregarDados();
    showToast(`Vistoria VAPT (${vapt.numeroRelatorioTermo}) registrada com sucesso.`);
  }, [recarregarDados, showToast]);

  // Evento: Remover Vistoria VAPT (Soft Delete)
  const removerVistoriaVapt = useCallback(async (id: string, termo: string, motivoExclusao?: string) => {
    await deleteInspecaoVapt(id, motivoExclusao);
    await recarregarDados();
    showToast(`Vistoria "${termo}" arquivada (exclusão lógica).`);
  }, [recarregarDados, showToast]);

  // Evento: Restaurar Vistoria VAPT (Undo Soft Delete)
  const restaurarVistoriaVapt = useCallback(async (id: string, termo: string) => {
    await restoreInspecaoVapt(id);
    await recarregarDados();
    showToast(`Vistoria "${termo}" restaurada com sucesso.`);
  }, [recarregarDados, showToast]);

  // Evento: Exportar Planilha Oficial VigiMinas
  const exportarPlanilha = useCallback(() => {
    exportarPlanilhaVigiMinas(estabelecimentos, indicadores, configuracao.exercicioAtivo.anoExercicio);
    showToast('Planilha Oficial VigiMinas (SES/MG) baixada com sucesso.');
  }, [estabelecimentos, indicadores, configuracao.exercicioAtivo.anoExercicio, showToast]);

  // Evento: Exportação Flexível de Estabelecimentos (CSV, XLSX, XLS) para Backup e Análise
  const exportarEstabelecimentos = useCallback(async (opcoes: OpcoesExportacao): Promise<ResultadoExportacao> => {
    try {
      const res = await exportarEstabelecimentosFormatados(estabelecimentos, {
        ...opcoes,
        fiscalResponsavel: opcoes.fiscalResponsavel || fiscaisAtivos[0]
      });
      showToast(`Arquivo "${res.nomeArquivo}" exportado com sucesso (${res.totalExportados} estabelecimentos).`);
      // Atualiza logs de auditoria para refletir o evento
      try {
        const logsAtualizados = await fetchLogsAuditoria();
        setLogsAuditoria(logsAtualizados);
      } catch {
        // Ignora erro secundário
      }
      return res;
    } catch (err) {
      console.error('Falha ao exportar estabelecimentos:', err);
      showToast('Ocorreu um erro ao gerar a exportação dos dados.');
      throw err;
    }
  }, [estabelecimentos, fiscaisAtivos, showToast]);

  // Geração de Planilha Modelo para Fiscais
  const gerarModeloPlanilha = useCallback(() => {
    gerarPlanilhaModeloEstabelecimentos();
    showToast('Planilha modelo baixada. Preencha os estabelecimentos e realize a importação.');
  }, [showToast]);

  // Processamento e validação de arquivo .xls ou .xlsx
  const processarArquivoPlanilha = useCallback((buffer: ArrayBuffer | Uint8Array): ResultadoParsePlanilha => {
    return parsearPlanilhaEstabelecimentos(buffer);
  }, []);

  // Importação e persistência em lote com auditoria
  const importarLotePlanilha = useCallback(async (lista: Estabelecimento[]) => {
    setLoading(true);
    try {
      const res = await importarEstabelecimentosEmLote(lista, 'eng.macieira@gmail.com');
      await recarregarDados();
      showToast(`Importação concluída: ${res.importados} novos e ${res.atualizados} atualizados.`);
      return res;
    } catch (err) {
      console.error('Erro na importação em lote:', err);
      showToast('Ocorreu um erro durante a importação da planilha.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [recarregarDados, showToast]);

  // Eventos de Configuração Geral do Sistema
  const salvarConfiguracaoGeral = useCallback(async (novaConfig: ConfiguracaoSistema) => {
    await saveConfiguracaoSistema(novaConfig);
    setConfiguracao(novaConfig);
    await recarregarDados();
    showToast('Configurações gerais do sistema salvas com sucesso.');
  }, [recarregarDados, showToast]);

  const adicionarFiscal = useCallback(async (novoFiscal: Omit<FiscalSanitario, 'id'>) => {
    const fiscalComId: FiscalSanitario = {
      ...novoFiscal,
      id: `fiscal-${Date.now()}`
    };
    const novaConfig: ConfiguracaoSistema = {
      ...configuracao,
      fiscais: [...configuracao.fiscais, fiscalComId]
    };
    await saveConfiguracaoSistema(novaConfig, {
      detalhesPersonalizados: `Inclusão do fiscal sanitário "${fiscalComId.nome}" (Matrícula: ${fiscalComId.matricula}) no quadro oficial da VISA.`
    });
    setConfiguracao(novaConfig);
    await recarregarDados();
    showToast(`Fiscal "${fiscalComId.nome}" cadastrado com sucesso.`);
  }, [configuracao, recarregarDados, showToast]);

  const atualizarFiscal = useCallback(async (fiscalAtualizado: FiscalSanitario) => {
    const novaLista = configuracao.fiscais.map(f => f.id === fiscalAtualizado.id ? fiscalAtualizado : f);
    const novaConfig: ConfiguracaoSistema = {
      ...configuracao,
      fiscais: novaLista
    };
    await saveConfiguracaoSistema(novaConfig, {
      detalhesPersonalizados: `Atualização cadastral do fiscal sanitário "${fiscalAtualizado.nome}" (${fiscalAtualizado.cargo} - Status: ${fiscalAtualizado.ativo ? 'Ativo' : 'Inativo'}).`
    });
    setConfiguracao(novaConfig);
    await recarregarDados();
    showToast(`Fiscal "${fiscalAtualizado.nome}" atualizado.`);
  }, [configuracao, recarregarDados, showToast]);

  const removerFiscal = useCallback(async (fiscalId: string, motivoExclusao?: string) => {
    const fiscal = configuracao.fiscais.find(f => f.id === fiscalId);
    const timestamp = new Date().toISOString();
    const novaLista = configuracao.fiscais.map(f => {
      if (f.id === fiscalId) {
        return {
          ...f,
          ativo: false,
          isDeleted: true,
          isPermanentlyDeleted: false,
          deletedAt: timestamp,
          deletedBy: 'eng.macieira@gmail.com',
          motivoExclusao: motivoExclusao || 'Exclusão lógica do quadro sanitário municipal'
        };
      }
      return f;
    });
    const novaConfig: ConfiguracaoSistema = {
      ...configuracao,
      fiscais: novaLista
    };
    await saveConfiguracaoSistema(novaConfig, {
      detalhesPersonalizados: `Exclusão lógica (soft delete) do fiscal sanitário "${fiscal?.nome || fiscalId}" do quadro oficial da VISA de Braúnas/MG.${motivoExclusao ? ` Motivo: "${motivoExclusao}".` : ''}`
    });
    setConfiguracao(novaConfig);
    await recarregarDados();
    showToast(`Fiscal "${fiscal?.nome || ''}" arquivado com sucesso.`);
  }, [configuracao, recarregarDados, showToast]);

  const excluirPermanenteFiscal = useCallback(async (fiscalId: string, motivoExclusao?: string) => {
    const fiscal = configuracao.fiscais.find(f => f.id === fiscalId);
    const timestamp = new Date().toISOString();
    const novaLista = configuracao.fiscais.map(f => {
      if (f.id === fiscalId) {
        return {
          ...f,
          ativo: false,
          isDeleted: true,
          isPermanentlyDeleted: true,
          permanentlyDeletedAt: timestamp,
          permanentlyDeletedBy: 'eng.macieira@gmail.com',
          motivoExclusaoPermanente: motivoExclusao || 'Exclusão definitiva solicitada na aba de arquivados'
        };
      }
      return f;
    });
    const novaConfig: ConfiguracaoSistema = {
      ...configuracao,
      fiscais: novaLista
    };
    await saveConfiguracaoSistema(novaConfig, {
      detalhesPersonalizados: `Exclusão definitiva da visualização de arquivados do fiscal sanitário "${fiscal?.nome || fiscalId}" (preservado em banco para administradores).${motivoExclusao ? ` Motivo: "${motivoExclusao}".` : ''}`
    });
    setConfiguracao(novaConfig);
    await recarregarDados();
    showToast(`Fiscal "${fiscal?.nome || ''}" excluído com sucesso.`);
  }, [configuracao, recarregarDados, showToast]);

  const restaurarFiscal = useCallback(async (fiscalId: string) => {
    const fiscal = configuracao.fiscais.find(f => f.id === fiscalId);
    const novaLista = configuracao.fiscais.map(f => {
      if (f.id === fiscalId) {
        return {
          ...f,
          ativo: true,
          isDeleted: false,
          isPermanentlyDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          motivoExclusao: undefined,
          permanentlyDeletedAt: undefined,
          permanentlyDeletedBy: undefined,
          motivoExclusaoPermanente: undefined
        };
      }
      return f;
    });
    const novaConfig: ConfiguracaoSistema = {
      ...configuracao,
      fiscais: novaLista
    };
    await saveConfiguracaoSistema(novaConfig, {
      detalhesPersonalizados: `Restauração cadastral do fiscal sanitário "${fiscal?.nome || fiscalId}" ao quadro oficial ativo da VISA de Braúnas/MG.`
    });
    setConfiguracao(novaConfig);
    await recarregarDados();
    showToast(`Fiscal "${fiscal?.nome || ''}" restaurado ao quadro ativo.`);
  }, [configuracao, recarregarDados, showToast]);

  const atualizarDadosSecretaria = useCallback(async (dados: DadosSecretaria) => {
    const novaConfig: ConfiguracaoSistema = {
      ...configuracao,
      secretaria: dados
    };
    await saveConfiguracaoSistema(novaConfig, {
      detalhesPersonalizados: `Atualização dos dados institucionais da Secretaria Municipal de Saúde de Braúnas/MG.`
    });
    setConfiguracao(novaConfig);
    await recarregarDados();
    showToast('Dados institucionais da Secretaria de Saúde atualizados.');
  }, [configuracao, recarregarDados, showToast]);

  const atualizarExercicioAtivo = useCallback(async (exercicio: ConfiguracaoExercicio) => {
    const exercicioAnterior = configuracao.exercicioAtivo;
    const historicoAtualizado = [
      ...configuracao.exerciciosHistorico.filter(h => h.anoExercicio !== exercicioAnterior.anoExercicio),
      exercicioAnterior
    ];
    const novaConfig: ConfiguracaoSistema = {
      ...configuracao,
      exercicioAtivo: exercicio,
      exerciciosHistorico: historicoAtualizado
    };
    await saveConfiguracaoSistema(novaConfig, {
      detalhesPersonalizados: `Ajuste do exercício operacional para o ano ${exercicio.anoExercicio} (Meta VAPT: ${exercicio.metaInd11Vapt}, Risco I: ${exercicio.metaInd13RiscoI}%, Risco II: ${exercicio.metaInd14RiscoII}%, Risco III: ${exercicio.metaInd15RiscoIII}%).`
    });
    setConfiguracao(novaConfig);
    await recarregarDados();
    showToast(`Exercício ${exercicio.anoExercicio} e parâmetros de metas do VigiMinas atualizados.`);
  }, [configuracao, recarregarDados, showToast]);

  const limparBanco = useCallback(async (opcoes?: OpcoesLimpezaBanco) => {
    setLoading(true);
    try {
      const resultado = await limparBancoDeDados(opcoes);
      setEstabelecimentos([]);
      setInspecoesVapt([]);
      if (opcoes?.limparLogsAuditoria ?? true) {
        setLogsAuditoria([]);
      }
      await recarregarDados();
      showToast(`Banco de dados limpo com sucesso! (${resultado.estabelecimentosRemovidos} estabelecimentos e ${resultado.vaptRemovidos} vistorias removidas).`);
      return resultado;
    } catch (err) {
      console.error('Erro ao limpar banco de dados:', err);
      showToast('Erro ao executar limpeza do banco de dados.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [recarregarDados, showToast]);

  const restaurarDemonstrativos = useCallback(async () => {
    setLoading(true);
    try {
      await restaurarDadosDemonstrativos();
      await recarregarDados();
      showToast('Dados demonstrativos oficiais de Braúnas/MG restaurados com sucesso.');
    } catch (err) {
      console.error('Erro ao restaurar dados demonstrativos:', err);
      showToast('Erro ao restaurar dados demonstrativos.');
    } finally {
      setLoading(false);
    }
  }, [recarregarDados, showToast]);

  const value = useMemo(() => ({
    estabelecimentos,
    inspecoesVapt,
    logsAuditoria,
    indicadores,
    alertasVapt,
    configuracao,
    fiscaisAtivos,
    loading,
    toastMessage,
    showToast,
    recarregarDados,
    salvarEstabelecimento,
    removerEstabelecimento,
    excluirPermanenteEstabelecimento,
    restaurarEstabelecimento,
    executarInspecaoRapida,
    salvarVistoriaVapt,
    removerVistoriaVapt,
    restaurarVistoriaVapt,
    exportarPlanilha,
    exportarEstabelecimentos,
    gerarModeloPlanilha,
    processarArquivoPlanilha,
    importarLotePlanilha,
    salvarConfiguracaoGeral,
    adicionarFiscal,
    atualizarFiscal,
    removerFiscal,
    excluirPermanenteFiscal,
    restaurarFiscal,
    atualizarDadosSecretaria,
    atualizarExercicioAtivo,
    limparBanco,
    restaurarDemonstrativos
  }), [
    estabelecimentos,
    inspecoesVapt,
    logsAuditoria,
    indicadores,
    alertasVapt,
    configuracao,
    fiscaisAtivos,
    loading,
    toastMessage,
    showToast,
    recarregarDados,
    salvarEstabelecimento,
    removerEstabelecimento,
    excluirPermanenteEstabelecimento,
    restaurarEstabelecimento,
    executarInspecaoRapida,
    salvarVistoriaVapt,
    removerVistoriaVapt,
    restaurarVistoriaVapt,
    exportarPlanilha,
    exportarEstabelecimentos,
    gerarModeloPlanilha,
    processarArquivoPlanilha,
    importarLotePlanilha,
    salvarConfiguracaoGeral,
    adicionarFiscal,
    atualizarFiscal,
    removerFiscal,
    excluirPermanenteFiscal,
    restaurarFiscal,
    atualizarDadosSecretaria,
    atualizarExercicioAtivo,
    limparBanco,
    restaurarDemonstrativos
  ]);

  return (
    <VigiMinasContext.Provider value={value}>
      {children}
    </VigiMinasContext.Provider>
  );
};

export const useVigiMinas = (): VigiMinasContextType => {
  const context = useContext(VigiMinasContext);
  if (!context) {
    throw new Error('useVigiMinas deve ser utilizado dentro de um VigiMinasProvider');
  }
  return context;
};
