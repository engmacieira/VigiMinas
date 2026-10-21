import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Firestore e Firebase App
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_db, collectionName, id) => ({ collectionName, id })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ razaoSocial: 'Estabelecimento Existente', nivelRisco: 'Risco I' })
  }),
  getFirestore: vi.fn()
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { email: 'fiscal.test@braunas.mg.gov.br' } }))
}));

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { email: 'fiscal.test@braunas.mg.gov.br' } },
  handleFirestoreError: vi.fn(),
  OperationType: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    WRITE: 'write'
  }
}));

import { setDoc, getDoc } from 'firebase/firestore';
import { auth } from '@/src/lib/firebase';
import {
  createWithAudit,
  updateWithAudit,
  softDeleteWithAudit,
  restoreWithAudit,
  getActiveUserIdentifier
} from '@/src/lib/firestoreAuditMiddleware';

describe('firestoreAuditMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (auth as any).currentUser = { email: 'fiscal.test@braunas.mg.gov.br' };
  });

  describe('getActiveUserIdentifier', () => {
    it('retorna usuario do contextOverride se fornecido', () => {
      const user = getActiveUserIdentifier({ usuario: 'custom@user.com' });
      expect(user).toBe('custom@user.com');
    });

    it('retorna auth.currentUser.email se usuario nao fornecido no contextOverride', () => {
      const user = getActiveUserIdentifier({});
      expect(user).toBe('fiscal.test@braunas.mg.gov.br');
    });

    it('retorna fiscalResponsavel do contextOverride quando nao ha auth.currentUser', () => {
      (auth as any).currentUser = null;
      const user = getActiveUserIdentifier({ fiscalResponsavel: 'Fiscal Joao' });
      expect(user).toBe('Fiscal Joao');
    });

    it('retorna fallback fiscal quando nao ha auth.currentUser e nem contextOverride', () => {
      (auth as any).currentUser = null;
      const user = getActiveUserIdentifier(undefined, 'Fiscal Maria');
      expect(user).toBe('Fiscal Maria');
    });
  });

  describe('createWithAudit', () => {
    it('cria documento e gera log de auditoria no Firestore e localStorage', async () => {
      const mockData = {
        razaoSocial: 'Supermercado Teste',
        cnpjCpf: '12.345.678/0001-90',
        nivelRisco: 'Risco II'
      };

      await createWithAudit('estabelecimentos', 'est-123', mockData, {
        fiscalResponsavel: 'Lucas Silveira',
        detalhesPersonalizados: 'Criação de teste'
      });

      expect(setDoc).toHaveBeenCalledTimes(2);

      const backupLogs = JSON.parse(localStorage.getItem('vigiminas_braunas_logs_backup') || '[]');
      expect(backupLogs.length).toBe(1);
      expect(backupLogs[0].recursoId).toBe('est-123');
      expect(backupLogs[0].operacao).toBe('create');
      expect(backupLogs[0].identificadorEntidade).toBe('Supermercado Teste');
    });
  });

  describe('updateWithAudit', () => {
    it('atualiza documento e gera log de auditoria com alteracoes', async () => {
      const updateData = {
        razaoSocial: 'Supermercado Editado'
      };

      await updateWithAudit('estabelecimentos', 'est-123', updateData, {
        fiscalResponsavel: 'Lucas Silveira'
      });

      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledTimes(2);

      const backupLogs = JSON.parse(localStorage.getItem('vigiminas_braunas_logs_backup') || '[]');
      expect(backupLogs[0].operacao).toBe('update');
      expect(backupLogs[0].acao).toBe('Edição');
    });
  });

  describe('softDeleteWithAudit', () => {
    it('marca isDeleted true no documento e registra log de exclusao logica', async () => {
      await softDeleteWithAudit('estabelecimentos', 'est-123', 'Supermercado Teste', {
        fiscalResponsavel: 'Matheus Oliveira'
      }, 'Fechamento comercial');

      expect(setDoc).toHaveBeenCalledTimes(2);

      const backupLogs = JSON.parse(localStorage.getItem('vigiminas_braunas_logs_backup') || '[]');
      expect(backupLogs[0].operacao).toBe('delete');
      expect(backupLogs[0].acao).toBe('Exclusão');
      expect(backupLogs[0].detalhes).toContain('Fechamento comercial');
    });
  });

  describe('restoreWithAudit', () => {
    it('desmarca isDeleted para false e registra log de restauracao', async () => {
      await restoreWithAudit('estabelecimentos', 'est-123', 'Supermercado Teste', {
        fiscalResponsavel: 'Lucas Silveira'
      });

      expect(setDoc).toHaveBeenCalledTimes(2);

      const backupLogs = JSON.parse(localStorage.getItem('vigiminas_braunas_logs_backup') || '[]');
      expect(backupLogs[0].operacao).toBe('update');
      expect(backupLogs[0].detalhes).toContain('Restauração');
    });
  });
});
