import { useState, useCallback } from 'react';
import { 
  createWithAudit, 
  updateWithAudit, 
  deleteWithAudit, 
  AuditContextInfo 
} from '../lib/firestoreAuditMiddleware';
import { ColecaoAuditada, OperacaoFirestore } from '../types/vigiminas';
import { DocumentData } from 'firebase/firestore';

export interface UseFirestoreWithAuditReturn {
  executarMutacaoAuditada: <T extends DocumentData>(
    colecao: ColecaoAuditada,
    operacao: OperacaoFirestore,
    docId: string,
    data?: T | Partial<T>,
    auditContext?: AuditContextInfo
  ) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook de Persistência no Firestore com Auditoria Automática
 * Captura operações create/update/delete nas coleções 'estabelecimentos' e 'inspecoes_vapt'
 * e registra automaticamente os eventos na coleção 'logs_auditoria'.
 */
export function useFirestoreWithAudit(): UseFirestoreWithAuditReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executarMutacaoAuditada = useCallback(async <T extends DocumentData>(
    colecao: ColecaoAuditada,
    operacao: OperacaoFirestore,
    docId: string,
    data?: T | Partial<T>,
    auditContext?: AuditContextInfo
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      switch (operacao) {
        case 'create':
          if (!data) throw new Error('Dados são obrigatórios para a operação de criação.');
          await createWithAudit(colecao, docId, data, auditContext);
          break;

        case 'update':
          if (!data) throw new Error('Dados são obrigatórios para a operação de atualização.');
          await updateWithAudit(colecao, docId, data, auditContext);
          break;

        case 'delete': {
          const record = data as Record<string, unknown> | undefined;
          const nomeEntidade = String(
            record?.razaoSocial || record?.numeroRelatorioTermo || record?.nomeLocalTrabalho || docId
          );
          await deleteWithAudit(colecao, docId, nomeEntidade, auditContext);
          break;
        }
      }
    } catch (err) {
      console.error(`Erro ao executar mutação auditada (${operacao}) em ${colecao}:`, err);
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    executarMutacaoAuditada,
    loading,
    error
  };
}
