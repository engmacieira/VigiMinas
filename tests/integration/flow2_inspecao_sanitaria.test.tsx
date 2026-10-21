import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  testConnection: vi.fn(),
  handleFirestoreError: vi.fn()
}));

let mockEsts: any[] = [];

vi.mock('@/src/services/vigiminasService', () => ({
  fetchEstabelecimentos: vi.fn(async () => [...mockEsts]),
  fetchInspecoesVapt: vi.fn(async () => []),
  fetchLogsAuditoria: vi.fn(async () => []),
  fetchConfiguracaoSistema: vi.fn(async () => ({
    id: 'geral',
    secretaria: { nomeOrgao: 'Secretaria de Saude Braunas', municipio: 'Braunas', uf: 'MG' },
    fiscais: [{ id: 'f1', nome: 'Lucas Silveira', ativo: true, cargo: 'Fiscal' }],
    exercicioAtivo: { anoExercicio: 2026, metaInd11Vapt: 2, metaInd13RiscoI: 15, metaInd14RiscoII: 90, metaInd15RiscoIII: 100 },
    exerciciosHistorico: [],
    bancoInicializado: true
  })),
  saveEstabelecimento: vi.fn(async (est: any) => {
    const idx = mockEsts.findIndex(e => e.id === est.id);
    if (idx >= 0) mockEsts[idx] = est;
    else mockEsts.push(est);
  }),
  deleteEstabelecimento: vi.fn(),
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
  registrarLogAuditoria: vi.fn().mockResolvedValue(undefined),
  formatarDataBr: (dataIso: string) => dataIso ? `${dataIso.split('-')[2]}/${dataIso.split('-')[1]}/${dataIso.split('-')[0]}` : '-'
}));

import { VigiMinasProvider, useVigiMinas } from '@/src/contexts/VigiMinasContext';
import { CalendarioInspecoesView } from '@/src/components/CalendarioInspecoesView';

const TestComponent = () => {
  const { executarInspecaoRapida } = useVigiMinas();

  return (
    <div>
      <button
        onClick={() => {
          executarInspecaoRapida({
            estabelecimentoId: 'est-200',
            dataInspecao: '2026-04-15',
            fiscais: ['Lucas Silveira'],
            renovarAlvara: true,
            novoAlvaraNumero: 'ALV-2026/500',
            novaValidadeAlvara: '2027-04-15'
          });
        }}
      >
        Executar Vistoria
      </button>

      <CalendarioInspecoesView
        onRegistrarInspecaoRapida={() => {}}
        onEditarEstabelecimento={() => {}}
        onNovoEstabelecimento={() => {}}
      />
    </div>
  );
};

describe('Fluxo 2 (Integração): Inspeção Sanitária e Atualização do Calendário', () => {
  beforeEach(() => {
    mockEsts = [
      {
        id: 'est-200',
        razaoSocial: 'Drogaria VigiMinas',
        nomeFantasia: 'Drogaria Central VigiMinas',
        cnpjCpf: '22.333.444/0001-55',
        nivelRisco: 'Risco II',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Vencido',
        dataProximaInspecao: '2026-04-15',
        cnaeCodigo: '4771-7/01',
        cnaeDescricao: 'Drogaria',
        endereco: { logradouro: 'Av. Principal', numero: '200', bairro: 'Centro', cep: '35169-000', municipio: 'Braúnas/MG' },
        contato: { telefone: '3332952000', email: 'vapt@drogaria.com' }
      }
    ];
    vi.clearAllMocks();
  });

  it('registra nova inspecao e verifica atualizacao no calendario e estado', async () => {
    render(
      <VigiMinasProvider>
        <TestComponent />
      </VigiMinasProvider>
    );

    // Espera inicializar e renderizar
    await waitFor(() => {
      expect(screen.getByText('Drogaria VigiMinas')).toBeInTheDocument();
    });

    const btn = screen.getByText('Executar Vistoria');

    await act(async () => {
      btn.click();
    });

    await waitFor(() => {
      expect(mockEsts[0].situacaoAlvara).toBe('Válido');
      expect(mockEsts[0].numeroAlvara).toBe('ALV-2026/500');
      expect(mockEsts[0].dataUltimaInspecaoInicio).toBe('2026-04-15');
    });
  });
});
