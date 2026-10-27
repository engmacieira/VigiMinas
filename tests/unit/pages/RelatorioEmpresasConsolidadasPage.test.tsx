import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RelatorioEmpresasConsolidadasPage } from '../../../src/pages/RelatorioEmpresasConsolidadasPage';

const { mockNavigate, mockEstabelecimentos } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockEstabelecimentos: [
      {
        id: 'est-1',
        razaoSocial: 'Padaria Central Braúnas LTDA',
        nomeFantasia: 'Pão de Minas',
        cnpjCpf: '11.111.111/0001-11',
        cnaeCodigo: '1091-1/02',
        cnaeDescricao: 'Fabricação de produtos de panificação',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
        dataValidadeAlvara: '2027-05-10',
        dataUltimaInspecaoInicio: '2026-02-15',
        dataUltimaInspecaoFim: '2026-02-15',
        endereco: {
          logradouro: 'Rua Principal, 100',
          numero: '100',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-2',
        razaoSocial: 'Supermercado Central ME',
        nomeFantasia: 'Super Braúnas',
        cnpjCpf: '22.222.222/0001-22',
        cnaeCodigo: '4711-3/02',
        cnaeDescricao: 'Supermercados',
        nivelRisco: 'Risco II',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Vencido',
        dataValidadeAlvara: '2025-11-20',
        dataUltimaInspecaoInicio: '2025-11-01',
        dataUltimaInspecaoFim: '2025-11-01',
        endereco: {
          logradouro: 'Av. Minas Gerais, 250',
          numero: '250',
          bairro: 'São Geraldo',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-3',
        razaoSocial: 'Hospital Regional e Maternidade',
        nomeFantasia: 'Hospital São Geraldo',
        cnpjCpf: '33.333.333/0001-33',
        cnaeCodigo: '8610-1/01',
        cnaeDescricao: 'Atividades hospitalares',
        nivelRisco: 'Risco III',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Não Possui (Irregular)',
        dataValidadeAlvara: '',
        dataUltimaInspecaoInicio: '',
        dataUltimaInspecaoFim: '',
        endereco: {
          logradouro: 'Praça da Matriz, 1',
          numero: '1',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-4',
        razaoSocial: 'Açougue Antigo Encerrado ME',
        nomeFantasia: 'Carnes Silva',
        cnpjCpf: '44.444.444/0001-44',
        cnaeCodigo: '4722-9/01',
        cnaeDescricao: 'Comércio varejista de carnes',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Inativo',
        situacaoAlvara: 'Vencido',
        dataValidadeAlvara: '2024-03-01',
        dataUltimaInspecaoInicio: '2024-03-01',
        endereco: {
          logradouro: 'Rua do Comércio, 55',
          numero: '55',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
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
      ],
    },
    fiscaisAtivos: ['Lucas Silveira'],
    loading: false,
  }),
}));

describe('RelatorioEmpresasConsolidadasPage (US-07 - Relatório Master)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho executivo institucional e dados de emissão', () => {
    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Relatório Consolidado de Empresas Cadastradas')).toBeInTheDocument();
    expect(screen.getByText(/Panorama Geral da Base Sanitária Municipal, Regularidade de Alvarás e Cobertura Fiscal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Braúnas \/ MG/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Exercício 2026/i)).toBeInTheDocument();
  });

  it('renderiza os 5 cards de KPIs com métricas calculadas', () => {
    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    // Card 1: Total de Estabelecimentos (4 no mock: 3 ativos, 1 inativo)
    expect(screen.getByText('Total de Estabelecimentos')).toBeInTheDocument();
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/3 Ativos/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Inativos/i)).toBeInTheDocument();

    // Card 2: Risco Sanitário I / II / III (2 R1, 1 R2, 1 R3)
    expect(screen.getByText('Risco Sanitário I / II / III')).toBeInTheDocument();
    expect(screen.getByText('R1: 2')).toBeInTheDocument();
    expect(screen.getByText('R2: 1')).toBeInTheDocument();
    expect(screen.getByText('R3: 1')).toBeInTheDocument();

    // Card 3: Alvarás Vigentes (1 vigente: Padaria Central)
    expect(screen.getAllByText('Alvarás Vigentes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/33\.3%/).length).toBeGreaterThanOrEqual(1);

    // Card 4: Alvarás Vencidos / Pendentes
    expect(screen.getByText('Alvarás Vencidos / Pendentes')).toBeInTheDocument();
    expect(screen.getAllByText(/vencidos/i).length).toBeGreaterThanOrEqual(1);

    // Card 5: Cobertura Fiscal 2026 (1 inspecionado em 2026: Padaria Central)
    expect(screen.getByText(/Cobertura Fiscal \(2026\)/i)).toBeInTheDocument();
  });

  it('renderiza os painéis de termômetros visuais de Risco e Situação de Alvarás', () => {
    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Distribuição por Nível de Risco Sanitário')).toBeInTheDocument();
    expect(screen.getByText('Situação dos Alvarás Sanitários')).toBeInTheDocument();
    expect(screen.getAllByText(/Risco I \(Baixo\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Risco II \(Médio\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Risco III \(Alto\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('filtra estabelecimentos pelo campo de busca textual', () => {
    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    const inputBusca = screen.getByPlaceholderText(/Razão, Fantasia, CNPJ ou Bairro.../i);
    fireEvent.change(inputBusca, { target: { value: 'Hospital' } });

    expect(screen.getByText('Hospital Regional e Maternidade')).toBeInTheDocument();
    expect(screen.queryByText('Padaria Central Braúnas LTDA')).not.toBeInTheDocument();
  });

  it('filtra estabelecimentos pelo dropdown de nível de risco', () => {
    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    const selectRisco = screen.getByDisplayValue('Todos os Riscos Sanitários');
    fireEvent.change(selectRisco, { target: { value: 'Risco III' } });

    expect(screen.getByText('Hospital Regional e Maternidade')).toBeInTheDocument();
    expect(screen.queryByText('Padaria Central Braúnas LTDA')).not.toBeInTheDocument();
    expect(screen.queryByText('Supermercado Central ME')).not.toBeInTheDocument();
  });

  it('filtra estabelecimentos pelo dropdown de alvará', () => {
    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    const selectAlvara = screen.getByDisplayValue('Todas as Situações de Alvará');
    fireEvent.change(selectAlvara, { target: { value: 'vigente' } });

    expect(screen.getByText('Padaria Central Braúnas LTDA')).toBeInTheDocument();
    expect(screen.queryByText('Supermercado Central ME')).not.toBeInTheDocument();
  });

  it('filtra estabelecimentos pelo dropdown de status cadastral', () => {
    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    const selectStatus = screen.getByDisplayValue('Todos os Status Cadastrais');
    fireEvent.change(selectStatus, { target: { value: 'inativo' } });

    expect(screen.getByText('Açougue Antigo Encerrado ME')).toBeInTheDocument();
    expect(screen.queryByText('Padaria Central Braúnas LTDA')).not.toBeInTheDocument();
  });

  it('aciona window.print ao clicar no botão de impressão oficial', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    const btnPrint = screen.getByRole('button', { name: /Imprimir Relatório Oficial/i });
    fireEvent.click(btnPrint);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('permite navegação de volta para a Central de Relatórios', () => {
    render(
      <MemoryRouter>
        <RelatorioEmpresasConsolidadasPage />
      </MemoryRouter>
    );

    const linkVoltar = screen.getByRole('link', { name: /Voltar para Relatórios/i });
    expect(linkVoltar).toHaveAttribute('href', '/relatorios');
  });
});
