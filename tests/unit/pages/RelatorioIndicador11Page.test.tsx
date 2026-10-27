import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RelatorioIndicador11Page } from '../../../src/pages/RelatorioIndicador11Page';

const { mockNavigate, mockVaptInspecoes } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockVaptInspecoes: [
      {
        id: 'vapt-1',
        estabelecimentoId: 'est-1',
        nomeLocalTrabalho: 'Padaria Central',
        dataInspecao: '2026-03-10',
        numeroRelatorioTermo: 'TERMO-2026-001',
        fiscaisResponsaveis: ['Lucas Silveira'],
        principaisRiscosIdentificados: 'Físico (Calor excessivo) e Ergonômico',
        recomendacoesOrientacoes: 'Instalação de exaustor e adequação de bancadas.',
        statusInspecao: 'concluida',
        notificacaoSinan: '2026-SIN-001',
        relatorioTecnicoEmitido: true,
        enviadoFormularioSes: true,
        registradoSiaSus: true,
        isDeleted: false,
      },
      {
        id: 'vapt-2',
        estabelecimentoId: 'est-2',
        nomeLocalTrabalho: 'Serralheria Modelo',
        dataInspecao: '2026-04-15',
        numeroRelatorioTermo: 'TERMO-2026-002',
        fiscaisResponsaveis: ['Matheus Oliveira'],
        principaisRiscosIdentificados: 'Mecânico e Ruído',
        recomendacoesOrientacoes: 'Uso de protetor auricular tipo concha e proteção em policarbonato.',
        statusInspecao: 'concluida',
        notificacaoSinan: '',
        relatorioTecnicoEmitido: true,
        enviadoFormularioSes: true,
        registradoSiaSus: true,
        isDeleted: false,
      },
    ],
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../src/contexts/VigiMinasContext', () => ({
  useVigiMinas: () => ({
    inspecoesVapt: mockVaptInspecoes,
    estabelecimentos: [
      {
        id: 'est-1',
        nomeFantasia: 'Padaria Central',
        razaoSocial: 'Padaria Central LTDA',
        cnpj: '12.345.678/0001-90',
        cnaeCodigo: '1091-1/02',
        cnaeDescricao: 'Fabricação de produtos de panificação',
      },
      {
        id: 'est-2',
        nomeFantasia: 'Serralheria Modelo',
        razaoSocial: 'Serralheria Modelo ME',
        cnpj: '98.765.432/0001-10',
        cnaeCodigo: '2542-0/00',
        cnaeDescricao: 'Fabricação de artigos de metalurgia',
      },
    ],
    indicadores: {
      anoReferencia: 2026,
    },
    configuracao: {
      secretaria: {
        municipio: 'Braúnas',
        uf: 'MG',
        nomeOrgao: 'Secretaria Municipal de Saúde de Braúnas',
      },
      exercicioAtivo: {
        anoExercicio: 2026,
      },
      fiscais: [
        { id: 'f-1', nome: 'Lucas Silveira', ativo: true, isDeleted: false },
        { id: 'f-2', nome: 'Matheus Oliveira', ativo: true, isDeleted: false },
      ],
    },
    loading: false,
  }),
}));

describe('RelatorioIndicador11Page (US-02 - Relatório Indicador 11 VAPT)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho executivo com referências à Resolução SES/MG nº 10.917/2026', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador11Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/Relatório de Desempenho - Indicador 11 \(VAPT\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Resolução SES\/MG nº 10\.917\/2026/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Braúnas\/MG/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza os 4 cards de KPIs calculados com base nas inspeções do ano', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador11Page />
      </MemoryRouter>
    );

    // Card 1: Meta Prevista (Padrão de Braúnas = 2)
    expect(screen.getByText('Meta Prevista')).toBeInTheDocument();
    
    // Card 2: Inspeções Realizadas (mock tem 2)
    expect(screen.getByText('Inspeções Realizadas')).toBeInTheDocument();

    // Card 3: Percentual Atingido (2 de 2 = 100%)
    expect(screen.getByText('Percentual Atingido')).toBeInTheDocument();
    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);

    // Card 4: Projeção de Recurso
    expect(screen.getByText('Projeção de Recurso VigiMinas')).toBeInTheDocument();
    expect(screen.getByText(/100% do Recurso Garantido/i)).toBeInTheDocument();
  });

  it('renderiza o painel "O Que Falta para Bater a Meta" com checklist regulamentar', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador11Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/O Que Falta para Bater a Meta/i)).toBeInTheDocument();
    expect(screen.getByText(/Realização de inspeções presenciais com foco em fatores de risco/i)).toBeInTheDocument();
    expect(screen.getByText(/Emissão e arquivamento do Relatório Técnico de Inspeção VAPT em PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/Submissão dos dados no Formulário Unificado VigiMinas/i)).toBeInTheDocument();
    expect(screen.getByText(/Registro no SIA-SUS ou protocolo de justificativa/i)).toBeInTheDocument();
  });

  it('renderiza a tabela analítica com as vistorias VAPT registradas', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador11Page />
      </MemoryRouter>
    );

    expect(screen.getByText('Padaria Central LTDA')).toBeInTheDocument();
    expect(screen.getByText('Serralheria Modelo ME')).toBeInTheDocument();
    expect(screen.getByText('2026-SIN-001')).toBeInTheDocument();
  });

  it('aciona window.print ao clicar no botão de impressão', () => {
    const originalPrint = window.print;
    window.print = vi.fn();

    render(
      <MemoryRouter>
        <RelatorioIndicador11Page />
      </MemoryRouter>
    );

    const botaoImprimir = screen.getByRole('button', { name: /Imprimir \/ Salvar PDF/i });
    fireEvent.click(botaoImprimir);

    expect(window.print).toHaveBeenCalledTimes(1);
    window.print = originalPrint;
  });

  it('permite navegar de volta para /relatorios com o link Voltar para Relatórios', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador11Page />
      </MemoryRouter>
    );

    const linkVoltar = screen.getByRole('link', { name: /Voltar para Relatórios/i });
    expect(linkVoltar).toBeInTheDocument();
    expect(linkVoltar).toHaveAttribute('href', '/relatorios');
  });
});
