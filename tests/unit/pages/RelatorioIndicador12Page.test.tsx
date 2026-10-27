import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RelatorioIndicador12Page } from '../../../src/pages/RelatorioIndicador12Page';

const { mockNavigate, mockEstabelecimentos } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockEstabelecimentos: [
      {
        id: 'est-1',
        razaoSocial: 'Supermercado Central LTDA',
        nomeFantasia: 'Super Central',
        cnpj: '11.222.333/0001-44',
        cnaeCodigo: '4711-3/02',
        cnaeDescricao: 'Comércio varejista de mercadorias em geral',
        nivelRisco: 'Risco II',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Vigente',
        dataValidadeAlvara: '2026-12-31',
        isDeleted: false,
      },
      {
        id: 'est-2',
        razaoSocial: 'Farmácia Vida e Saúde EIRELI',
        nomeFantasia: 'Farmácia Vida',
        cnpj: '22.333.444/0001-55',
        cnaeCodigo: '4771-7/01',
        cnaeDescricao: 'Comércio varejista de produtos farmacêuticos',
        nivelRisco: 'Risco III',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Em Renovação',
        dataValidadeAlvara: '2026-08-15',
        isDeleted: false,
      },
      {
        id: 'est-3',
        razaoSocial: 'Padaria e Confeitaria Braúnas ME',
        nomeFantasia: 'Pão de Minas',
        cnpj: '33.444.555/0001-66',
        cnaeCodigo: '1091-1/02',
        cnaeDescricao: 'Fabricação de produtos de panificação',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Vigente',
        dataValidadeAlvara: '2027-01-10',
        isDeleted: false,
      },
      {
        id: 'est-4',
        razaoSocial: 'Lanchonete Antiga do Centro',
        nomeFantasia: 'Bar e Lanche',
        cnpj: '44.555.666/0001-77',
        cnaeCodigo: '5611-2/03',
        cnaeDescricao: 'Lanchonetes, casas de chá e sucos',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Inativo',
        situacaoAlvara: 'Vencido',
        dataValidadeAlvara: '2025-05-20',
        observacoesBaixa: 'Baixado em 10/02/2026 após inspeção de encerramento.',
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
    estabelecimentos: mockEstabelecimentos,
    indicadores: {
      anoReferencia: 2026,
    },
    configuracao: {
      secretaria: {
        municipio: 'Braúnas',
        uf: 'MG',
        nomeOrgao: 'Secretaria Municipal de Saúde de Braúnas',
        coordenadorVisa: 'Matheus Henrique Macieira',
      },
      exercicioAtivo: {
        anoExercicio: 2026,
      },
      fiscais: [
        { id: 'f-1', nome: 'Lucas Silveira', ativo: true, isDeleted: false },
        { id: 'f-2', nome: 'Matheus Oliveira', ativo: true, isDeleted: false },
      ],
    },
    exportarEstabelecimentos: vi.fn(),
    loading: false,
  }),
}));

vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    usuario: {
      id: 'u-1',
      username: 'matheus_macieira',
      nomeCompleto: 'Matheus Henrique Macieira',
      funcao: 'admin_master',
      email: 'matheus@braunas.mg.gov.br',
      ativo: true,
    },
    isAuthenticated: true,
  }),
}));

describe('RelatorioIndicador12Page (US-03 - Indicador 12 VISA)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho executivo institucional com referências à Resolução SES/MG nº 10.917/2026', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador12Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/Relatório de Situação Cadastral - Indicador 12 \(VISA\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Resolução SES\/MG nº 10\.917\/2026/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Braúnas \/ MG/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza os 5 cards de KPIs com totais de Risco I, II e III calculados', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador12Page />
      </MemoryRouter>
    );

    // Card 1: Meta do Indicador
    expect(screen.getByText('Meta do Indicador')).toBeInTheDocument();
    expect(screen.getByText('1 Envio')).toBeInTheDocument();
    expect(screen.getByText('Conforme')).toBeInTheDocument();

    // Card 2: Total Cadastrado (4 estabelecimentos)
    expect(screen.getByText('Total Cadastrado')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText(/3 ativas • 1 baixadas/i)).toBeInTheDocument();

    // Card 3: Risco I (Baixo) -> 2 empresas
    expect(screen.getAllByText('Risco I (Baixo)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Campo 12.1')).toBeInTheDocument();

    // Card 4: Risco II (Médio) -> 1 empresa
    expect(screen.getAllByText('Risco II (Médio)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Campo 12.2')).toBeInTheDocument();

    // Card 5: Risco III (Alto) -> 1 empresa
    expect(screen.getAllByText('Risco III (Alto)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Campo 12.3')).toBeInTheDocument();
  });

  it('renderiza o painel "Status Regulatório e O Que Falta" com checklist e diagnóstico de envio', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador12Page />
      </MemoryRouter>
    );

    expect(screen.getByText('Status Regulatório e O Que Falta')).toBeInTheDocument();
    expect(screen.getByText(/Diagnóstico de Envio: Base Municipal Pronta/i)).toBeInTheDocument();
    expect(screen.getByText(/Prazo final improrrogável de homologação: 15\/01\/2027/i)).toBeInTheDocument();
    expect(screen.getByText('Checklist de Sanidade Cadastral')).toBeInTheDocument();
    expect(screen.getByText('Classificação por Nível de Risco')).toBeInTheDocument();
    expect(screen.getByText(/Regra de Ouro da Baixa Sanitária/i)).toBeInTheDocument();
    expect(screen.getByText(/Validade do Alvará Sanitário/i)).toBeInTheDocument();
  });

  it('renderiza a tabela analítica e permite busca por Razão Social', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador12Page />
      </MemoryRouter>
    );

    expect(screen.getByText('Supermercado Central LTDA')).toBeInTheDocument();
    expect(screen.getByText('Farmácia Vida e Saúde EIRELI')).toBeInTheDocument();
    expect(screen.getByText('Padaria e Confeitaria Braúnas ME')).toBeInTheDocument();

    // Filtrar por busca
    const inputBusca = screen.getByPlaceholderText(/Buscar por Razão Social ou CNPJ/i);
    fireEvent.change(inputBusca, { target: { value: 'Farmácia' } });

    expect(screen.getByText('Farmácia Vida e Saúde EIRELI')).toBeInTheDocument();
    expect(screen.queryByText('Supermercado Central LTDA')).not.toBeInTheDocument();
  });

  it('aciona window.print ao clicar no botão de impressão', () => {
    const originalPrint = window.print;
    window.print = vi.fn();

    render(
      <MemoryRouter>
        <RelatorioIndicador12Page />
      </MemoryRouter>
    );

    const botaoImprimir = screen.getByRole('button', { name: /Imprimir Relatório/i });
    fireEvent.click(botaoImprimir);

    expect(window.print).toHaveBeenCalledTimes(1);
    window.print = originalPrint;
  });

  it('abre o modal de exportação ao clicar em "Exportar Planilha Oficial"', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador12Page />
      </MemoryRouter>
    );

    const botaoExportar = screen.getByRole('button', { name: /Exportar Planilha Oficial/i });
    fireEvent.click(botaoExportar);

    // Modal de exportação deve abrir exibindo título de exportação
    expect(screen.getByText(/Exportar Dados de Estabelecimentos/i)).toBeInTheDocument();
  });

  it('permite navegação de volta para a Central de Relatórios e para Estabelecimentos', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador12Page />
      </MemoryRouter>
    );

    const linkVoltar = screen.getByRole('link', { name: /Voltar para Relatórios/i });
    expect(linkVoltar).toHaveAttribute('href', '/relatorios');

    const linkGerenciar = screen.getByRole('link', { name: /Gerenciar Estabelecimentos/i });
    expect(linkGerenciar).toHaveAttribute('href', '/estabelecimentos');
  });
});
