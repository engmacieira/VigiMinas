import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockExportarPlanilha = vi.fn();
const mockExecutarInspecaoRapida = vi.fn();

vi.mock('@/src/contexts/VigiMinasContext', () => ({
  useVigiMinas: () => ({
    indicadores: {
      anoReferencia: 2026,
      ind12TotalCadastrados: 10,
      ind12Ativos: 8,
      ind12Inativos: 2,
      ind13TotalRiscoI: 3,
      ind13InspecionadosAno: 1,
      ind13Percentual: 33.3,
      ind13MetaAtingida: true,
      ind14TotalRiscoII: 4,
      ind14InspecionadosAno: 4,
      ind14Percentual: 100,
      ind14MetaAtingida: true,
      ind15TotalRiscoIII: 1,
      ind15InspecionadosAno: 0,
      ind15Percentual: 0,
      ind15MetaAtingida: false,
      ind11TotalInspecoesAno: 3,
      ind11MetaAtingida: true
    },
    estabelecimentos: [
      {
        id: 'est-risco3',
        razaoSocial: 'Hospital Santa Rita',
        nomeFantasia: 'Hospital Santa Rita',
        cnpjCpf: '99.999.999/0001-99',
        nivelRisco: 'Risco III',
        situacaoEstabelecimento: 'Ativo',
        dataUltimaInspecaoInicio: '',
        dataUltimaInspecaoFim: '',
        dataProximaInspecao: '2026-10-10',
        dataValidadeAlvara: '2026-12-31',
        numeroAlvara: 'ALV-99',
        observacoesBaixa: '',
        competenciaFiscalizacao: 'Municipal',
        parecerProjetoArquitetonico: 'Sim',
        cnaeCodigo: '8610-1/01',
        cnaeDescricao: 'Atendimento hospitalar',
        endereco: { logradouro: 'Rua H', numero: '1', bairro: 'Centro', cep: '35189-000', municipio: 'Braúnas/MG' },
        contato: { telefone: '3332950000', email: 'hosp@test.com' },
        situacaoAlvara: 'Válido'
      }
    ],
    configuracao: {
      exercicioAtivo: {
        anoExercicio: 2026,
        metaInd11Vapt: 2,
        metaInd13RiscoI: 15,
        metaInd14RiscoII: 90,
        metaInd15RiscoIII: 100
      },
      fiscais: [{ nome: 'Lucas Silveira', ativo: true }]
    },
    exportarPlanilha: mockExportarPlanilha,
    executarInspecaoRapida: mockExecutarInspecaoRapida
  })
}));

import { FilaMetasPage } from '@/src/pages/FilaMetasPage';

describe('FilaMetasPage - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza a pagina dedicada da fila de metas com metricas e lista de estabelecimentos', () => {
    render(
      <MemoryRouter>
        <FilaMetasPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Metas 2026 • Fila Prioritária de Vistorias')).toBeInTheDocument();
    expect(screen.getByText('Hospital Santa Rita')).toBeInTheDocument();
    expect(screen.getByText('Risco III')).toBeInTheDocument();
  });

  it('filtra estabelecimentos pelo campo de busca', () => {
    render(
      <MemoryRouter>
        <FilaMetasPage />
      </MemoryRouter>
    );

    const inputBusca = screen.getByPlaceholderText('Buscar por razão social, nome fantasia, CNPJ ou bairro...');
    fireEvent.change(inputBusca, { target: { value: 'Inexistente' } });

    expect(screen.getByText('Nenhum estabelecimento encontrado')).toBeInTheDocument();
  });
});
