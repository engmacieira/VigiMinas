import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  testConnection: vi.fn(),
  handleFirestoreError: vi.fn()
}));

let memoryEsts: any[] = [];
let memoryLogs: any[] = [];

vi.mock('@/src/services/vigiminasService', () => ({
  fetchEstabelecimentos: vi.fn(async () => [...memoryEsts]),
  fetchInspecoesVapt: vi.fn(async () => []),
  fetchLogsAuditoria: vi.fn(async () => [...memoryLogs]),
  fetchConfiguracaoSistema: vi.fn(async () => ({
    id: 'geral',
    secretaria: { nomeOrgao: 'Secretaria de Saude Braunas', municipio: 'Braunas', uf: 'MG' },
    fiscais: [{ id: 'f1', nome: 'Lucas Silveira', ativo: true, cargo: 'Fiscal' }],
    exercicioAtivo: { anoExercicio: 2026, metaInd11Vapt: 2, metaInd13RiscoI: 15, metaInd14RiscoII: 90, metaInd15RiscoIII: 100 },
    exerciciosHistorico: [],
    bancoInicializado: true
  })),
  saveEstabelecimento: vi.fn(async (est: any) => {
    const idx = memoryEsts.findIndex(item => item.id === est.id);
    if (idx >= 0) {
      memoryEsts[idx] = { ...est, updatedAt: new Date().toISOString() };
      memoryLogs.unshift({
        id: `log-${Date.now()}`,
        recursoId: est.id,
        operacao: 'update',
        acao: 'Edição',
        colecao: 'estabelecimentos',
        identificadorEntidade: est.razaoSocial,
        timestamp: new Date().toISOString()
      });
    } else {
      memoryEsts.unshift({ ...est, createdAt: new Date().toISOString() });
      memoryLogs.unshift({
        id: `log-${Date.now()}`,
        recursoId: est.id,
        operacao: 'create',
        acao: 'Criação',
        colecao: 'estabelecimentos',
        identificadorEntidade: est.razaoSocial,
        timestamp: new Date().toISOString()
      });
    }
  }),
  deleteEstabelecimento: vi.fn(async (id: string, motivo?: string) => {
    const est = memoryEsts.find(item => item.id === id);
    if (est) {
      est.isDeleted = true;
      memoryLogs.unshift({
        id: `log-${Date.now()}`,
        recursoId: id,
        operacao: 'delete',
        acao: 'Exclusão',
        colecao: 'estabelecimentos',
        identificadorEntidade: est.razaoSocial,
        timestamp: new Date().toISOString()
      });
    }
  }),
  restoreEstabelecimento: vi.fn(),
  saveInspecaoVapt: vi.fn(),
  deleteInspecaoVapt: vi.fn(),
  restoreInspecaoVapt: vi.fn(),
  saveConfiguracaoSistema: vi.fn(),
  calcularIndicadores: vi.fn().mockReturnValue({
    anoReferencia: 2026,
    ind12TotalCadastrados: 1,
    ind12Ativos: 1,
    ind12Inativos: 0,
    ind13TotalRiscoI: 1,
    ind13InspecionadosAno: 1,
    ind13Percentual: 100,
    ind13MetaAtingida: true,
    ind14TotalRiscoII: 0,
    ind14InspecionadosAno: 0,
    ind14Percentual: 100,
    ind14MetaAtingida: true,
    ind15TotalRiscoIII: 0,
    ind15InspecionadosAno: 0,
    ind15Percentual: 100,
    ind15MetaAtingida: true,
    ind11TotalInspecoesAno: 0,
    ind11MetaAtingida: false
  }),
  calcularAlertasVapt: vi.fn().mockReturnValue({
    totalAlertas: 0,
    totalVencidas: 0,
    totalProximasVencer: 0,
    alertas: []
  }),
  exportarPlanilhaVigiMinas: vi.fn(),
  registrarLogAuditoria: vi.fn()
}));

import { VigiMinasProvider, useVigiMinas } from '@/src/contexts/VigiMinasContext';
import { Estabelecimento } from '@/src/types/vigiminas';

describe('Fluxo 1 (Integração): Ciclo de Vida do Estabelecimento', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <VigiMinasProvider>{children}</VigiMinasProvider>
  );

  beforeEach(() => {
    memoryEsts = [];
    memoryLogs = [];
    vi.clearAllMocks();
  });

  it('executa fluxo completo: Criacao -> Edicao -> Verificacao nos logs de auditoria', async () => {
    const { result } = renderHook(() => useVigiMinas(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const novoEst: Estabelecimento = {
      id: 'est-integracao-1',
      razaoSocial: 'Padaria Braúnas LTDA',
      nomeFantasia: 'Padaria Braúnas',
      cnpjCpf: '12.345.678/0001-90',
      cnaeCodigo: '1091-1/01',
      cnaeDescricao: 'Fabricação de produtos de padaria',
      nivelRisco: 'Risco I',
      situacaoEstabelecimento: 'Ativo',
      situacaoAlvara: 'Válido',
      dataUltimaInspecaoInicio: '',
      dataUltimaInspecaoFim: '',
      dataProximaInspecao: '2027-01-01',
      dataValidadeAlvara: '2026-12-31',
      numeroAlvara: 'ALV-100',
      observacoesBaixa: '',
      competenciaFiscalizacao: 'Municipal',
      parecerProjetoArquitetonico: 'Sim',
      endereco: { logradouro: 'Rua Principal', numero: '10', bairro: 'Centro', cep: '35169-000', municipio: 'Braúnas/MG' },
      contato: { telefone: '3332951000', email: 'padaria@braunas.mg.gov.br' }
    };

    await act(async () => {
      await result.current.salvarEstabelecimento(novoEst);
    });

    expect(result.current.estabelecimentos.length).toBe(1);
    expect(result.current.estabelecimentos[0].razaoSocial).toBe('Padaria Braúnas LTDA');
    expect(result.current.logsAuditoria.length).toBe(1);
    expect(result.current.logsAuditoria[0].operacao).toBe('create');
    expect(result.current.logsAuditoria[0].identificadorEntidade).toBe('Padaria Braúnas LTDA');

    const estEditado = {
      ...result.current.estabelecimentos[0],
      razaoSocial: 'Padaria e Confeitaria Braúnas LTDA'
    };

    await act(async () => {
      await result.current.salvarEstabelecimento(estEditado);
    });

    expect(result.current.estabelecimentos[0].razaoSocial).toBe('Padaria e Confeitaria Braúnas LTDA');
    expect(result.current.logsAuditoria.length).toBe(2);
    expect(result.current.logsAuditoria[0].operacao).toBe('update');

    await act(async () => {
      await result.current.removerEstabelecimento('est-integracao-1', 'Padaria e Confeitaria Braúnas LTDA', 'Fechamento');
    });

    expect(result.current.logsAuditoria.length).toBe(3);
    expect(result.current.logsAuditoria[0].operacao).toBe('delete');
  });
});
