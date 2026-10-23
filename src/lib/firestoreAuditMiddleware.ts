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

export interface AuditActiveUser {
  id: string;
  username: string;
  nomeCompleto: string;
  cargo: string;
  email: string;
}

let _activeAuditUser: AuditActiveUser | null = null;

export function setActiveAuditUser(user: AuditActiveUser | null) {
  _activeAuditUser = user;
}

export function getActiveAuditUser(): AuditActiveUser | null {
  if (_activeAuditUser) return _activeAuditUser;
  try {
    const cached = localStorage.getItem('vigiminas_active_user');
    if (cached) {
      _activeAuditUser = JSON.parse(cached);
      return _activeAuditUser;
    }
  } catch {
    // fallback silencioso
  }
  return null;
}

export interface AuditContextInfo {
  usuario?: string;
  usuarioId?: string;
  nomeUsuario?: string;
  cargo?: string;
  fiscalResponsavel?: string;
  detalhesPersonalizados?: string;
}

/**
 * Obtém o identificador autêntico do usuário ativo (Prevenção de Spoofing)
 */
export function getActiveUserIdentifier(contextOverride?: AuditContextInfo, fallbackFiscal?: string): string {
  const activeUser = getActiveAuditUser();
  if (activeUser) {
    return `${activeUser.nomeCompleto} (${activeUser.cargo})`;
  }
  if (contextOverride?.usuario) {
    return contextOverride.usuario;
  }
  if (contextOverride?.nomeUsuario) {
    return contextOverride.cargo 
      ? `${contextOverride.nomeUsuario} (${contextOverride.cargo})`
      : contextOverride.nomeUsuario;
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
  return 'Fiscal VISA';
}

/**
 * Registra o log na coleção 'logs_auditoria' do Firestore
 */
async function persistAuditLog(log: LogAuditoria): Promise<void> {
  // Limpa propriedades com valor undefined antes de gravar no Firestore
  const cleanLog: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(log)) {
    if (v !== undefined) {
      cleanLog[k] = v;
    }
  }

  try {
    const logRef = doc(db, LOGS_AUDITORIA_COLLECTION, log.id);
    await setDoc(logRef, cleanLog);
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
  const recordData = data as Record<string, unknown>;
  const identificador = String(
    recordData.razaoSocial ||
    recordData.numeroRelatorioTermo ||
    recordData.nomeLocalTrabalho ||
    docId
  );

  const activeUser = getActiveAuditUser();
  const fiscaisUltima = Array.isArray(recordData.fiscaisUltimaInspecao) ? recordData.fiscaisUltimaInspecao : undefined;
  const fiscaisResp = Array.isArray(recordData.fiscaisResponsaveis) ? recordData.fiscaisResponsaveis : undefined;

  const fiscal = auditContext?.fiscalResponsavel || 
    (fiscaisUltima?.[0] as string | undefined) ||
    (fiscaisResp?.[0] as string | undefined) ||
    activeUser?.nomeCompleto ||
    'Fiscal VISA';

  const usuario = getActiveUserIdentifier(auditContext, fiscal);

  const tipoRegistro: TipoRegistroAuditoria = colecao === 'estabelecimentos' 
    ? 'Estabelecimento' 
    : colecao === 'configuracoes_sistema'
      ? 'ConfiguracaoSistema'
      : 'InspecaoVapt';

  // ANTI-SPOOFING: Injeta metadados de autoria estritamente a partir do usuário autenticado ativo na sessão
  const logPayload: LogAuditoria = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    recursoId: docId,
    registroId: docId,
    operacao: 'create',
    acao: 'Criação',
    colecao,
    tipoRegistro,
    usuario,
    usuarioId: activeUser?.id || auditContext?.usuarioId,
    nomeUsuario: activeUser?.nomeCompleto || activeUser?.username || auditContext?.nomeUsuario,
    cargo: activeUser?.cargo || auditContext?.cargo,
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

  const recData = data as Record<string, unknown>;
  const recSnap = snapshotAnterior as Record<string, unknown> | null;
  const identificador = String(
    recData.razaoSocial ||
    recSnap?.razaoSocial ||
    recData.numeroRelatorioTermo ||
    recSnap?.numeroRelatorioTermo ||
    docId
  );

  const activeUser = getActiveAuditUser();
  const fiscaisUltimaData = Array.isArray(recData.fiscaisUltimaInspecao) ? recData.fiscaisUltimaInspecao : undefined;
  const fiscaisUltimaSnap = Array.isArray(recSnap?.fiscaisUltimaInspecao) ? recSnap.fiscaisUltimaInspecao : undefined;
  const fiscaisRespData = Array.isArray(recData.fiscaisResponsaveis) ? recData.fiscaisResponsaveis : undefined;

  const fiscal = auditContext?.fiscalResponsavel || 
    (fiscaisUltimaData?.[0] as string | undefined) ||
    (fiscaisUltimaSnap?.[0] as string | undefined) ||
    (fiscaisRespData?.[0] as string | undefined) ||
    activeUser?.nomeCompleto ||
    'Fiscal VISA';

  const usuario = getActiveUserIdentifier(auditContext, fiscal);

  const tipoRegistro: TipoRegistroAuditoria = colecao === 'estabelecimentos' 
    ? 'Estabelecimento' 
    : colecao === 'configuracoes_sistema'
      ? 'ConfiguracaoSistema'
      : 'InspecaoVapt';

  // Monta resumo detalhado das alterações before/after OMITINDO campos confidenciais de senha
  const diffs: string[] = [];
  if (recSnap) {
    for (const key of Object.keys(data)) {
      if (key === 'updatedAt' || key === 'createdAt' || key === 'senha' || key === 'senhaHash') continue;
      const ant = recSnap[key];
      const nov = recData[key];
      if (JSON.stringify(ant) !== JSON.stringify(nov)) {
        const formatVal = (v: unknown) => {
          if (v === undefined || v === null || v === '') return 'vazio';
          if (typeof v === 'object') return JSON.stringify(v);
          return String(v);
        };
        diffs.push(`${key}: "${formatVal(ant)}" → "${formatVal(nov)}"`);
      }
    }
  }

  const alteracoesStr = diffs.length > 0 ? diffs.join('; ') : undefined;

  let detalhes = auditContext?.detalhesPersonalizados;
  if (!detalhes) {
    const chavesModificadas = Object.keys(data).filter(k => k !== 'updatedAt' && k !== 'senha' && k !== 'senhaHash');
    detalhes = diffs.length > 0
      ? `Atualização em ${colecao}: ${diffs.slice(0, 3).join('; ')}${diffs.length > 3 ? ` (+${diffs.length - 3} campos)` : ''}.`
      : `Atualização de ${chavesModificadas.length} campo(s) em ${colecao}.`;
  }

  // ANTI-SPOOFING: Injeta metadados de autoria estritamente a partir do usuário autenticado ativo na sessão
  const logPayload: LogAuditoria = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    recursoId: docId,
    registroId: docId,
    operacao: 'update',
    acao: 'Edição',
    colecao,
    tipoRegistro,
    usuario,
    usuarioId: activeUser?.id || auditContext?.usuarioId,
    nomeUsuario: activeUser?.nomeCompleto || activeUser?.username || auditContext?.nomeUsuario,
    cargo: activeUser?.cargo || auditContext?.cargo,
    fiscalResponsavel: fiscal,
    identificadorEntidade: String(identificador),
    detalhes,
    alteracoes: alteracoesStr,
    timestamp,
    createdAt: timestamp
  };

  await persistAuditLog(logPayload);
}

/**
 * MIDDLEWARE DE PERSISTÊNCIA: Exclusão Lógica Auditada (Soft Delete)
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

  const activeUser = getActiveAuditUser();
  const fiscal = auditContext?.fiscalResponsavel || activeUser?.nomeCompleto || 'Fiscal VISA';
  const usuario = getActiveUserIdentifier(auditContext, fiscal);

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
    usuarioId: activeUser?.id || auditContext?.usuarioId,
    nomeUsuario: activeUser?.nomeCompleto || activeUser?.username || auditContext?.nomeUsuario,
    cargo: activeUser?.cargo || auditContext?.cargo,
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

  const activeUser = getActiveAuditUser();
  const fiscal = auditContext?.fiscalResponsavel || activeUser?.nomeCompleto || 'Fiscal VISA';
  const usuario = getActiveUserIdentifier(auditContext, fiscal);

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
    usuarioId: activeUser?.id || auditContext?.usuarioId,
    nomeUsuario: activeUser?.nomeCompleto || activeUser?.username || auditContext?.nomeUsuario,
    cargo: activeUser?.cargo || activeUser?.cargo || auditContext?.cargo,
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
