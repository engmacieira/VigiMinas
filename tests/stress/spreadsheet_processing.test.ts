import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_db, collectionName, id) => ({ collectionName, id })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ razaoSocial: 'Estabelecimento Modelo' })
  }),
  getFirestore: vi.fn()
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null }))
}));

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  handleFirestoreError: vi.fn(),
  OperationType: { WRITE: 'write' }
}));

vi.mock('@/src/lib/firestoreAuditMiddleware', () => ({
  createWithAudit: vi.fn().mockResolvedValue(undefined),
  updateWithAudit: vi.fn().mockResolvedValue(undefined),
  softDeleteWithAudit: vi.fn().mockResolvedValue(undefined),
  restoreWithAudit: vi.fn().mockResolvedValue(undefined)
}));

import {
  parsearPlanilhaEstabelecimentos,
  importarEstabelecimentosEmLote
} from '@/src/services/vigiminasService';

function gerarBufferPlanilhaVolumosa(quantidadeLinhas: number): Uint8Array {
  const rows: any[] = [];
  for (let i = 0; i < quantidadeLinhas; i++) {
    rows.push({
      'CNPJ_OU_CPF': `${String(10000000000000 + i)}`,
      'RAZAO_SOCIAL': `Empresa Importacao Volumosa ${i} LTDA`,
      'NOME_FANTASIA': `Fantasia ${i}`,
      'CNAE_CODIGO': '4711-3/02',
      'CNAE_DESCRICAO': 'Comércio varejista em geral',
      'NIVEL_RISCO': i % 3 === 0 ? 'Risco I' : i % 3 === 1 ? 'Risco II' : 'Risco III',
      'LOGRADOURO': `Rua Volume ${i}`,
      'NUMERO': `${i}`,
      'BAIRRO': 'Centro',
      'CEP': '35189-000',
      'MUNICIPIO': 'Braúnas/MG'
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'VolumeTest');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

describe('Testes de Estresse: Processamento e Importação em Lote de Planilhas Volumosas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('parseia planilha volumosa com 1.000 linhas em menos de 2 segundos', () => {
    const buffer = gerarBufferPlanilhaVolumosa(1000);

    const inicio = performance.now();
    const resultado = parsearPlanilhaEstabelecimentos(buffer);
    const duracao = performance.now() - inicio;

    expect(resultado.totalLinhas).toBe(1000);
    expect(resultado.validos.length).toBe(1000);
    expect(duracao).toBeLessThan(2000);
  });

  it('persiste lote de estabelecimentos sem falha ou vazamento', async () => {
    const buffer = gerarBufferPlanilhaVolumosa(500);
    const parse = parsearPlanilhaEstabelecimentos(buffer);

    const inicio = performance.now();
    const resultadoImport = await importarEstabelecimentosEmLote(parse.validos, 'estresse@test.com');
    const duracao = performance.now() - inicio;

    expect(resultadoImport.importados + resultadoImport.atualizados).toBe(500);
    expect(duracao).toBeLessThan(15000);
  });
});
