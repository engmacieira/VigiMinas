import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  testConnection: vi.fn(),
  handleFirestoreError: vi.fn()
}));

vi.mock('@/src/services/vigiminasService', () => ({
  fetchEstabelecimentos: vi.fn().mockResolvedValue([
    {
      id: 'est-100',
      razaoSocial: 'Padaria Central',
      cnpjCpf: '11.222.333/0001-44',
      nivelRisco: 'Risco I',
      situacaoEstabelecimento: 'Ativo',
      cnaeCodigo: '1091-1/01',
      cnaeDescricao: 'Padaria',
      endereco: { logradouro: 'Rua Principal', numero: '10', bairro: 'Centro', cep: '35169-000', municipio: 'Braúnas/MG' },
      contato: { telefone: '3332950000', email: 'alfa@test.com' },
      situacaoAlvara: 'Válido'
    }
  ]),
  fetchInspecoesVapt: vi.fn().mockResolvedValue([]),
  fetchLogsAuditoria: vi.fn().mockResolvedValue([]),
  fetchConfiguracaoSistema: vi.fn().mockResolvedValue({
    id: 'geral',
    secretaria: { nomeOrgao: 'Secretaria Municipal de Saúde', municipio: 'Braúnas', uf: 'MG' },
    fiscais: [
      { id: 'f-1', nome: 'Lucas Silveira', cargo: 'Fiscal Sanitário', ativo: true, matricula: '001' }
    ],
    exercicioAtivo: { anoExercicio: 2026, metaInd11Vapt: 2, metaInd13RiscoI: 15, metaInd14RiscoII: 90, metaInd15RiscoIII: 100 },
    exerciciosHistorico: [],
    bancoInicializado: true
  }),
  saveEstabelecimento: vi.fn().mockResolvedValue(undefined),
  deleteEstabelecimento: vi.fn().mockResolvedValue(undefined),
  restoreEstabelecimento: vi.fn().mockResolvedValue(undefined),
  saveInspecaoVapt: vi.fn().mockResolvedValue(undefined),
  deleteInspecaoVapt: vi.fn().mockResolvedValue(undefined),
  restoreInspecaoVapt: vi.fn().mockResolvedValue(undefined),
  saveConfiguracaoSistema: vi.fn().mockResolvedValue(undefined),
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
  registrarLogAuditoria: vi.fn().mockResolvedValue(undefined),
  importarEstabelecimentosEmLote: vi.fn().mockResolvedValue({ importados: 1, atualizados: 0, falhas: 0 }),
  limparBancoDeDados: vi.fn().mockResolvedValue({ estabelecimentosRemovidos: 1, vaptRemovidos: 0, logsRemovidos: 0 }),
  restaurarDadosDemonstrativos: vi.fn().mockResolvedValue(undefined)
}));

import { VigiMinasProvider, useVigiMinas } from '@/src/contexts/VigiMinasContext';
import {
  fetchEstabelecimentos,
  saveEstabelecimento,
  deleteEstabelecimento,
  restoreEstabelecimento,
  limparBancoDeDados
} from '@/src/services/vigiminasService';

describe('VigiMinasContext - Unit Tests', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <VigiMinasProvider>{children}</VigiMinasProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega dados iniciais e disponibiliza estado no contexto', async () => {
    const { result } = renderHook(() => useVigiMinas(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.estabelecimentos.length).toBe(1);
    expect(result.current.estabelecimentos[0].razaoSocial).toBe('Padaria Central');
    expect(result.current.fiscaisAtivos).toEqual(['Lucas Silveira']);
  });

  it('salva estabelecimento e recarrega dados', async () => {
    const { result } = renderHook(() => useVigiMinas(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const novoEst = { ...result.current.estabelecimentos[0], razaoSocial: 'Padaria Central Editada' };

    await act(async () => {
      await result.current.salvarEstabelecimento(novoEst);
    });

    expect(saveEstabelecimento).toHaveBeenCalledWith(novoEst);
    expect(result.current.toastMessage).toContain('gravado com sucesso');
  });

  it('remove (soft delete) estabelecimento e atualiza mensagem', async () => {
    const { result } = renderHook(() => useVigiMinas(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removerEstabelecimento('est-100', 'Padaria Central', 'Inatividade');
    });

    expect(deleteEstabelecimento).toHaveBeenCalledWith('est-100', 'Inatividade');
    expect(result.current.toastMessage).toContain('arquivado');
  });

  it('restaura estabelecimento previamente arquivado', async () => {
    const { result } = renderHook(() => useVigiMinas(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.restaurarEstabelecimento('est-100', 'Padaria Central');
    });

    expect(restoreEstabelecimento).toHaveBeenCalledWith('est-100');
    expect(result.current.toastMessage).toContain('restaurado com sucesso');
  });

  it('executa inspecao rapida atualizando o estabelecimento', async () => {
    const { result } = renderHook(() => useVigiMinas(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.executarInspecaoRapida({
        estabelecimentoId: 'est-100',
        dataInspecao: '2026-04-01',
        fiscais: ['Lucas Silveira'],
        renovarAlvara: true,
        novoAlvaraNumero: 'ALV-2026/099',
        novaValidadeAlvara: '2027-04-01'
      });
    });

    expect(saveEstabelecimento).toHaveBeenCalled();
    expect(result.current.toastMessage).toContain('Inspeção concluída');
  });

  it('limpa o banco de dados atraves do contexto', async () => {
    vi.mocked(fetchEstabelecimentos).mockResolvedValueOnce([] as any);

    const { result } = renderHook(() => useVigiMinas(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(fetchEstabelecimentos).mockResolvedValueOnce([] as any);

    await act(async () => {
      await result.current.limparBanco();
    });

    expect(limparBancoDeDados).toHaveBeenCalled();
    expect(result.current.estabelecimentos).toEqual([]);
    expect(result.current.toastMessage).toContain('limpo com sucesso');
  });
});
