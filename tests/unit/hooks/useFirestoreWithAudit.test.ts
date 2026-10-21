import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/src/lib/firestoreAuditMiddleware', () => ({
  createWithAudit: vi.fn().mockResolvedValue(undefined),
  updateWithAudit: vi.fn().mockResolvedValue(undefined),
  deleteWithAudit: vi.fn().mockResolvedValue(undefined)
}));

import { useFirestoreWithAudit } from '@/src/hooks/useFirestoreWithAudit';
import { createWithAudit, updateWithAudit, deleteWithAudit } from '@/src/lib/firestoreAuditMiddleware';

describe('useFirestoreWithAudit - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia com estados padrao: loading=false, error=null', () => {
    const { result } = renderHook(() => useFirestoreWithAudit());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('executa operacao create chamando createWithAudit', async () => {
    const { result } = renderHook(() => useFirestoreWithAudit());
    const data = { razaoSocial: 'Estabelecimento Novo' };

    await act(async () => {
      await result.current.executarMutacaoAuditada('estabelecimentos', 'create', 'est-1', data);
    });

    expect(createWithAudit).toHaveBeenCalledWith('estabelecimentos', 'est-1', data, undefined);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('executa operacao update chamando updateWithAudit', async () => {
    const { result } = renderHook(() => useFirestoreWithAudit());
    const data = { razaoSocial: 'Estabelecimento Atualizado' };

    await act(async () => {
      await result.current.executarMutacaoAuditada('estabelecimentos', 'update', 'est-1', data);
    });

    expect(updateWithAudit).toHaveBeenCalledWith('estabelecimentos', 'est-1', data, undefined);
    expect(result.current.loading).toBe(false);
  });

  it('executa operacao delete chamando deleteWithAudit', async () => {
    const { result } = renderHook(() => useFirestoreWithAudit());
    const data = { razaoSocial: 'Estabelecimento Removido' };

    await act(async () => {
      await result.current.executarMutacaoAuditada('estabelecimentos', 'delete', 'est-1', data);
    });

    expect(deleteWithAudit).toHaveBeenCalledWith('estabelecimentos', 'est-1', 'Estabelecimento Removido', undefined);
    expect(result.current.loading).toBe(false);
  });

  it('captura erro e atualiza o estado error em caso de falha', async () => {
    vi.mocked(createWithAudit).mockRejectedValueOnce(new Error('Erro de conexao Firestore'));

    const { result } = renderHook(() => useFirestoreWithAudit());

    await act(async () => {
      try {
        await result.current.executarMutacaoAuditada('estabelecimentos', 'create', 'est-err', { razaoSocial: 'Erro' });
      } catch {
        // Ignora erro esperado no teste
      }
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Erro de conexao Firestore');
    expect(result.current.loading).toBe(false);
  });
});
