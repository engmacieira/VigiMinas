import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  DocumentData 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  ColecaoAuditada, 
  OperacaoFirestore, 
  LogAuditoria, 
  TipoRegistroAuditoria, 
  AcaoAuditoria 
} from '../types/vigiminas';

const LOGS_AUDITORIA_COLLECTION = 'logs_auditoria';
const LOCAL_STORAGE_LOGS_KEY = 'vigiminas_braunas_logs_backup';

export interface AuditContextInfo {
  usuario?: string;
  fiscalResponsavel?: string;
  detalhesPersonalizados?: string;
}

/**
 * Obtém o identificador do usuário ou fiscal ativo no momento da operação
 */
export function getActiveUserIdentifier(contextOverride?: AuditContextInfo, fallbackFiscal?: string): string {
  if (contextOverride?.usuario) {
    return contextOverride.usuario;
  }
  if (auth.currentUser?.email) {
    return auth.currentUser.email;
  }
  if (auth.currentUser?.displayName) {
    return auth.currentUser.displayName;
  }
  if (contextOverride?.fiscalResponsavel) {
    return contextOverride.fiscalResponsavel;
  }
  if (fallbackFiscal) {
    return fallbackFiscal;
  }
  return 'eng.macieira@gmail.com (Fiscal VISA)';
}

/**
 * Registra o log na coleção 'logs_auditoria' do Firestore
 */
async function persistAuditLog(log: LogAuditoria): Promise<void> {
  try {
    const logRef = doc(db, LOGS_AUDITORIA_COLLECTION, log.id);
    await setDoc(logRef, log);
  } catch (err) {
    console.warn('Middleware de auditoria: Falha ao persistir no Firestore, gravando no cache local.', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `${LOGS_AUDITORIA_COLLECTION}/${log.id}`);
    } catch {
      // continua para fallback
    }
  }

  // Backup e cache local
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    const list: LogAuditoria[] = backup ? JSON.parse(backup) : [];
    list.unshift(log);
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Middleware de auditoria: erro no cache local', e);
  }
}

/**
 * MIDDLEWARE DE PERSISTÊNCIA: Criação de Documento Auditado
 */
export async function createWithAudit<T extends DocumentData>(
  colecao: ColecaoAuditada,
  docId: string,
  data: T,
  auditContext?: AuditContextInfo
): Promise<void> {
  const timestamp = new Date().toISOString();
  const docRef = doc(db, colecao, docId);
  const dataComTimestamp = {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  // Executa operação de criação no Firestore
  await setDoc(docRef, dataComTimestamp);

  // Extração de dados da entidade para o log
  const identificador = (data as any)?.razaoSocial || 
    (data as any)?.numeroRelatorioTermo || 
    (data as any)?.nomeLocalTrabalho || 
    docId;

  const fiscal = auditContext?.fiscalResponsavel || 
    (data as any)?.fiscaisUltimaInspecao?.[0] || 
    (data as any)?.fiscaisResponsaveis?.[0] || 
    'Lucas Silveira';

  const usuario = getActiveUserIdentifier(auditContext, fiscal);

  const tipoRegistro: TipoRegistroAuditoria = colecao === 'estabelecimentos' 
    ? 'Estabelecimento' 
    : colecao === 'configuracoes_sistema'
      ? 'ConfiguracaoSistema'
      : 'InspecaoVapt';

  const logPayload: LogAuditoria = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    recursoId: docId,
    registroId: docId,
    operacao: 'create',
    acao: 'Criação',
    colecao,
    tipoRegistro,
    usuario,
    fiscalResponsavel: fiscal,
    identificadorEntidade: String(identificador),
    detalhes: auditContext?.detalhesPersonalizados || `Criação de registro em ${colecao} (ID: ${docId}).`,
    timestamp,
    createdAt: timestamp
  };

  // Grava automaticamente o log na coleção 'logs_auditoria'
  await persistAuditLog(logPayload);
}

/**
 * MIDDLEWARE DE PERSISTÊNCIA: Atualização de Documento Auditado
 */
export async function updateWithAudit<T extends DocumentData>(
  colecao: ColecaoAuditada,
  docId: string,
  data: Partial<T>,
  auditContext?: AuditContextInfo
): Promise<void> {
  const timestamp = new Date().toISOString();
  const docRef = doc(db, colecao, docId);
  
  // Tenta recuperar snapshot anterior para identificar campos modificados
  let snapshotAnterior: DocumentData | null = null;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      snapshotAnterior = snap.data();
    }
  } catch {
    // continua sem snapshot anterior
  }

  const dataComTimestamp = {
    ...snapshotAnterior,
    ...data,
    updatedAt: timestamp
  };

  // Executa atualização no Firestore
  await setDoc(docRef, dataComTimestamp);

  const identificador = (data as any)?.razaoSocial || 
    (snapshotAnterior as any)?.razaoSocial || 
    (data as any)?.numeroRelatorioTermo || 
    (snapshotAnterior as any)?.numeroRelatorioTermo || 
    docId;

  const fiscal = auditContext?.fiscalResponsavel || 
    (data as any)?.fiscaisUltimaInspecao?.[0] || 
    (snapshotAnterior as any)?.fiscaisUltimaInspecao?.[0] || 
    (data as any)?.fiscaisResponsaveis?.[0] || 
    'Lucas Silveira';

  const usuario = getActiveUserIdentifier(auditContext, fiscal);

  const tipoRegistro: TipoRegistroAuditoria = colecao === 'estabelecimentos' 
    ? 'Estabelecimento' 
    : colecao === 'configuracoes_sistema'
      ? 'ConfiguracaoSistema'
      : 'InspecaoVapt';

  // Monta resumo das alterações
  let detalhes = auditContext?.detalhesPersonalizados;
  if (!detalhes) {
    const chavesModificadas = Object.keys(data).filter(k => k !== 'updatedAt');
    detalhes = `Atualização de ${chavesModificadas.length} campo(s) em ${colecao} [${chavesModificadas.slice(0, 4).join(', ')}].`;
  }

  const logPayload: LogAuditoria = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    recursoId: docId,
    registroId: docId,
    operacao: 'update',
    acao: 'Edição',
    colecao,
    tipoRegistro,
    usuario,
    fiscalResponsavel: fiscal,
    identificadorEntidade: String(identificador),
    detalhes,
    timestamp,
    createdAt: timestamp
  };

  await persistAuditLog(logPayload);
}

/**
 * MIDDLEWARE DE PERSISTÊNCIA: Exclusão Lógica Auditada (Soft Delete)
 * Não remove fisicamente o documento; grava isDeleted: true, deletedAt, deletedBy e motivoExclusao.
 */
export async function softDeleteWithAudit(
  colecao: ColecaoAuditada,
  docId: string,
  identificadorEntidade?: string,
  auditContext?: AuditContextInfo,
  motivoExclusao?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const docRef = doc(db, colecao, docId);

  const fiscal = auditContext?.fiscalResponsavel || 'Lucas Silveira';
  const usuario = getActiveUserIdentifier(auditContext, fiscal);

  // Executa exclusão lógica com merge para preservar campos intactos
  await setDoc(docRef, {
    isDeleted: true,
    deletedAt: timestamp,
    deletedBy: usuario,
    motivoExclusao: motivoExclusao || auditContext?.detalhesPersonalizados || 'Exclusão lógica realizada via interface do sistema',
    updatedAt: timestamp
  }, { merge: true });

  const tipoRegistro: TipoRegistroAuditoria = colecao === 'estabelecimentos' 
    ? 'Estabelecimento' 
    : colecao === 'configuracoes_sistema'
      ? 'ConfiguracaoSistema'
      : 'InspecaoVapt';

  const logPayload: LogAuditoria = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    recursoId: docId,
    registroId: docId,
    operacao: 'delete',
    acao: 'Exclusão',
    colecao,
    tipoRegistro,
    usuario,
    fiscalResponsavel: fiscal,
    identificadorEntidade: identificadorEntidade || docId,
    detalhes: auditContext?.detalhesPersonalizados || 
      `Exclusão lógica (soft delete) de "${identificadorEntidade || docId}".${motivoExclusao ? ` Motivo: ${motivoExclusao}.` : ''}`,
    timestamp,
    createdAt: timestamp
  };

  await persistAuditLog(logPayload);
}

/**
 * MIDDLEWARE DE PERSISTÊNCIA: Restauração de Documento Excluído Logicamente (Undo Soft Delete)
 */
export async function restoreWithAudit(
  colecao: ColecaoAuditada,
  docId: string,
  identificadorEntidade?: string,
  auditContext?: AuditContextInfo
): Promise<void> {
  const timestamp = new Date().toISOString();
  const docRef = doc(db, colecao, docId);

  const fiscal = auditContext?.fiscalResponsavel || 'Lucas Silveira';
  const usuario = getActiveUserIdentifier(auditContext, fiscal);

  // Restaura o registro desmarcando isDeleted
  await setDoc(docRef, {
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    motivoExclusao: null,
    updatedAt: timestamp
  }, { merge: true });

  const tipoRegistro: TipoRegistroAuditoria = colecao === 'estabelecimentos' 
    ? 'Estabelecimento' 
    : colecao === 'configuracoes_sistema'
      ? 'ConfiguracaoSistema'
      : 'InspecaoVapt';

  const logPayload: LogAuditoria = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    recursoId: docId,
    registroId: docId,
    operacao: 'update',
    acao: 'Edição',
    colecao,
    tipoRegistro,
    usuario,
    fiscalResponsavel: fiscal,
    identificadorEntidade: identificadorEntidade || docId,
    detalhes: auditContext?.detalhesPersonalizados || 
      `Restauração de registro previamente arquivado/excluído logicamente de "${identificadorEntidade || docId}".`,
    timestamp,
    createdAt: timestamp
  };

  await persistAuditLog(logPayload);
}

// Alias de retrocompatibilidade
export const deleteWithAudit = softDeleteWithAudit;

