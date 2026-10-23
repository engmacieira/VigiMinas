import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/src/contexts/VigiMinasContext', () => ({
  useVigiMinas: () => ({
    configuracao: {
      exercicioAtivo: {
        anoExercicio: 2026,
        metaInd11Vapt: 2,
        metaInd13RiscoI: 15,
        metaInd14RiscoII: 90,
        metaInd15RiscoIII: 100
      },
      fiscais: [{ nome: 'Lucas Silveira', ativo: true }]
    }
  })
}));

import { DashboardMetas } from '@/src/components/DashboardMetas';
import { VigiMinasIndicadores, Estabelecimento } from '@/src/types/vigiminas';

describe('DashboardMetas - Unit Tests', () => {
  const mockIndicadores: VigiMinasIndicadores = {
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
  };

  const mockEstabelecimentos: Estabelecimento[] = [
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
  ];

  const mockOnExportExcel = vi.fn();
  const mockOnOpenQuickInspecao = vi.fn();
  const mockOnGoToEstabelecimentos = vi.fn();
  const mockOnGoToVapt = vi.fn();
  const mockOnGoToMetas = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os cards com resumo executivo e 5 indicadores', () => {
    render(
      <MemoryRouter>
        <DashboardMetas
          indicadores={mockIndicadores}
          estabelecimentos={mockEstabelecimentos}
          onExportExcel={mockOnExportExcel}
          onOpenQuickInspecao={mockOnOpenQuickInspecao}
          onGoToEstabelecimentos={mockOnGoToEstabelecimentos}
          onGoToVapt={mockOnGoToVapt}
          onGoToMetas={mockOnGoToMetas}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Painel de Apuração das Metas VigiMinas')).toBeInTheDocument();
    expect(screen.getByText('Cadastro Geral VISA')).toBeInTheDocument();
    expect(screen.getByText('Risco I (Baixo Risco)')).toBeInTheDocument();
    expect(screen.getByText('Risco II (Médio Risco)')).toBeInTheDocument();
    expect(screen.getByText('Risco III (Alto Risco)')).toBeInTheDocument();
    expect(screen.getByText('Saúde do Trabalhador • VAPT')).toBeInTheDocument();
  });

  it('dispara acao de exportar planilha ao clicar no botao', () => {
    render(
      <MemoryRouter>
        <DashboardMetas
          indicadores={mockIndicadores}
          estabelecimentos={mockEstabelecimentos}
          onExportExcel={mockOnExportExcel}
          onOpenQuickInspecao={mockOnOpenQuickInspecao}
          onGoToEstabelecimentos={mockOnGoToEstabelecimentos}
          onGoToVapt={mockOnGoToVapt}
          onGoToMetas={mockOnGoToMetas}
        />
      </MemoryRouter>
    );

    const exportBtn = screen.getByText('Exportar Planilha Oficial (.xlsx)');
    fireEvent.click(exportBtn);

    expect(mockOnExportExcel).toHaveBeenCalled();
  });

  it('exibe fila de vistoria prioritaria para estabelecimentos pendentes e navega para /metas via rodapé', () => {
    render(
      <MemoryRouter>
        <DashboardMetas
          indicadores={mockIndicadores}
          estabelecimentos={mockEstabelecimentos}
          onExportExcel={mockOnExportExcel}
          onOpenQuickInspecao={mockOnOpenQuickInspecao}
          onGoToEstabelecimentos={mockOnGoToEstabelecimentos}
          onGoToVapt={mockOnGoToVapt}
          onGoToMetas={mockOnGoToMetas}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Fila de Vistoria Prioritária para Metas de 2026')).toBeInTheDocument();
    expect(screen.getByText('Hospital Santa Rita')).toBeInTheDocument();

    const inspecionarBtn = screen.getByText('Registrar Inspeção');
    fireEvent.click(inspecionarBtn);

    expect(mockOnOpenQuickInspecao).toHaveBeenCalledWith(mockEstabelecimentos[0]);

    const linkRodape = screen.getByText('Ver todas as vistorias prioritárias (1 pendentes)');
    fireEvent.click(linkRodape);

    expect(mockOnGoToMetas).toHaveBeenCalled();
  });
});
