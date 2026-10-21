import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_db, collectionName, id) => ({ collectionName, id })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ razaoSocial: 'Estabelecimento Concorrente' })
  }),
  getFirestore: vi.fn()
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { email: 'concorrencia@test.com' } }))
}));

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { email: 'concorrencia@test.com' } },
  handleFirestoreError: vi.fn(),
  OperationType: { WRITE: 'write' }
}));

import {
  createWithAudit,
  updateWithAudit,
  softDeleteWithAudit
} from '@/src/lib/firestoreAuditMiddleware';

describe('Testes de Estresse: Concorrência e Integridade do Audit Log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('suporta 500 mutacoes simultaneas sem perda de logs de auditoria ou race conditions', async () => {
    const TOTAL_OPERATES = 500;
    const promessas: Promise<void>[] = [];

    const inicio = performance.now();

    for (let i = 0; i < TOTAL_OPERATES; i++) {
      if (i % 3 === 0) {
        promessas.push(createWithAudit('estabelecimentos', `conc-${i}`, {
          razaoSocial: `Empresa Concorrente ${i}`,
          cnpjCpf: '00.000.000/0001-00'
        }, { fiscalResponsavel: 'Lucas Silveira' }));
      } else if (i % 3 === 1) {
        promessas.push(updateWithAudit('estabelecimentos', `conc-${i}`, {
          razaoSocial: `Empresa Editada ${i}`
        }, { fiscalResponsavel: 'Matheus Oliveira' }));
      } else {
        promessas.push(softDeleteWithAudit('estabelecimentos', `conc-${i}`, `Empresa ${i}`, {
          fiscalResponsavel: 'Edmila Ferreira'
        }, 'Teste de Carga'));
      }
    }

    await Promise.all(promessas);

    const duracao = performance.now() - inicio;

    // Recupera logs gravados no cache local
    const logsBackup = JSON.parse(localStorage.getItem('vigiminas_braunas_logs_backup') || '[]');

    expect(logsBackup.length).toBe(TOTAL_OPERATES);
    expect(duracao).toBeLessThan(3000); // 500 operacoes simultaneas completadas em < 3 segundos
  });
});
