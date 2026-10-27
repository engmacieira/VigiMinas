import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RelatorioIndicador15Page } from '../../../src/pages/RelatorioIndicador15Page';

const { mockNavigate, mockEstabelecimentos, mockExecutarInspecaoRapida } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockExecutarInspecaoRapida: vi.fn(),
    mockEstabelecimentos: [
      {
        id: 'est-r3-1',
        razaoSocial: 'Hospital e Maternidade São Geraldo',
        nomeFantasia: 'Hospital São Geraldo',
        cnpjCpf: '11.111.111/0001-11',
        cnaeCodigo: '8610-1/01',
        cnaeDescricao: 'Atividades de atendimento hospitalar, exceto pronto-socorro e unidades para atendimento a urgências',
        nivelRisco: 'Risco III',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
        dataUltimaInspecaoInicio: '2026-03-12',
        dataUltimaInspecaoFim: '2026-03-12',
        fiscaisUltimaInspecao: ['Lucas Silveira', 'Matheus Oliveira'],
        endereco: {
          logradouro: 'Rua da Saúde, 100',
          numero: '100',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-r3-2',
        razaoSocial: 'Farmácia Central de Manipulação LTDA',
        nomeFantasia: 'ManipulaFarma',
        cnpjCpf: '22.222.222/0001-22',
        cnaeCodigo: '4771-7/02',
        cnaeDescricao: 'Comércio varejista de produtos farmacêuticos, com manipulação de fórmulas',
        nivelRisco: 'Risco III',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Vencido',
        dataUltimaInspecaoInicio: '2025-06-15',
        dataUltimaInspecaoFim: '2025-06-15',
        endereco: {
          logradouro: 'Av. Brasil, 450',
          numero: '450',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-r3-3',
        razaoSocial: 'Laboratório de Análises Clínicas Braúnas ME',
        nomeFantasia: 'Lab Minas',
        cnpjCpf: '33.333.333/0001-33',
        cnaeCodigo: '8640-2/02',
        cnaeDescricao: 'Laboratórios de análises clínicas',
        nivelRisco: 'Risco III',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Não Possui (Irregular)',
        dataUltimaInspecaoInicio: '',
        dataUltimaInspecaoFim: '',
        endereco: {
          logradouro: 'Rua Coronel Silva, 88',
          numero: '88',
          bairro: 'São Geraldo',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-r1-outro',
        razaoSocial: 'Comércio de Roupas LTDA',
        cnpjCpf: '44.444.444/0001-44',
        cnaeCodigo: '4781-4/00',
        cnaeDescricao: 'Comércio varejista de artigos do vestuário e acessórios',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
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
    fiscaisAtivos: ['Lucas Silveira', 'Matheus Oliveira'],
    executarInspecaoRapida: mockExecutarInspecaoRapida,
    loading: false,
  }),
}));

vi.mock('../../../src/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/contexts/AuthContext')>();
  const mockVal = {
    usuario: {
      id: 'u-1',
      username: 'matheus_macieira',
      nomeCompleto: 'Matheus Henrique Macieira',
      funcao: 'admin_master' as const,
      email: 'matheus@braunas.mg.gov.br',
      ativo: true,
    },
    isAuthenticated: true,
    isAdminMaster: true,
    loading: false,
    erroLogin: null,
    login: vi.fn(),
    logout: vi.fn(),
    usuarios: [],
    carregarUsuarios: vi.fn(),
    cadastrarUsuario: vi.fn(),
    editarUsuario: vi.fn(),
    redefinirSenhaUsuario: vi.fn(),
    toggleAtivoUsuario: vi.fn(),
    atualizarMeuPerfil: vi.fn(),
    forcarResetMaster: vi.fn(),
  };
  return {
    ...actual,
    AuthContext: React.createContext(mockVal),
    useAuth: () => mockVal,
  };
});

describe('RelatorioIndicador15Page (US-06 - Indicador 15 Alto Risco III)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho executivo com referências à Resolução SES/MG nº 10.917/2026', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador15Page />
      </MemoryRouter>
    );

    expect(screen.getByText('Relatório de Fiscalização - Indicador 15 (Alto Risco III)')).toBeInTheDocument();
    expect(screen.getByText(/Inspeções Sanitárias em Estabelecimentos de Risco Crítico \| Meta Estadual: 100%/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Braúnas \/ MG/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Porte 2 a 10 mil hab/i)).toBeInTheDocument();
  });

  it('renderiza os 4 cards de KPIs calculados com a meta mandatória de 100%', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador15Page />
      </MemoryRouter>
    );

    // Card 1: Base de Alto Risco (III) (3 empresas no mock)
    expect(screen.getByText('Base de Alto Risco (III)')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);

    // Card 2: Inspeções Realizadas no Exercício (1 inspecionada em 2026: Hospital)
    expect(screen.getByText('Inspeções Realizadas')).toBeInTheDocument();
    expect(screen.getByText(/2 pendentes/i)).toBeInTheDocument();

    // Card 3: Cobertura Sanitária (%) (1 de 3 = 33.3%)
    expect(screen.getByText('Cobertura Sanitária (%)')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
    expect(screen.getAllByText('Meta: 100%').length).toBeGreaterThanOrEqual(1);

    // Card 4: Previsão de Repasse Financeiro (33.3% está na faixa de 30% a 39.9% -> 30% do Recurso)
    expect(screen.getByText('Previsão de Repasse Financeiro')).toBeInTheDocument();
    expect(screen.getAllByText(/30% do Recurso/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Risco de corte de 70% do recurso/i)).toBeInTheDocument();
  });

  it('renderiza o painel "Diagnóstico de Alto Risco: O Que Falta para a Meta 100%" e checklist regulatório', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador15Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/Diagnóstico de Alto Risco: O Que Falta para a Meta 100%/i)).toBeInTheDocument();
    // Faltam 2 estabelecimentos
    expect(screen.getByText(/Restam 2 estabelecimento\(s\) de Alto Risco para alcançar a meta de 100%/i)).toBeInTheDocument();
    expect(screen.getByText(/Ritmo sugerido:/i)).toBeInTheDocument();

    // Checklist Regulatório
    expect(screen.getByText('Inspecionar 100% dos estabelecimentos municipais de Risco III')).toBeInTheDocument();
    expect(screen.getByText('Auditar estabelecimentos com Alvará Sanitário vencendo no período')).toBeInTheDocument();
    expect(screen.getByText('Gerar planilha de fiscalização de Risco III')).toBeInTheDocument();
    expect(screen.getByText(/Submeter no Formulário Unificado VigiMinas até 15\/01\/2027/i)).toBeInTheDocument();
    expect(screen.getByText(/Validar documentação junto ao NUVISA da Regional de Saúde/i)).toBeInTheDocument();
  });

  it('renderiza a tabela estrita de repasse financeiro SES-MG para Alto Risco', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador15Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/Tabela Estrita de Repasse SES-MG para Alto Risco/i)).toBeInTheDocument();
    expect(screen.getByText('< 20%')).toBeInTheDocument();
    expect(screen.getByText('20-29%')).toBeInTheDocument();
    expect(screen.getByText('30-39%')).toBeInTheDocument();
    expect(screen.getByText('90-99%')).toBeInTheDocument();
    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
  });

  it('permite alternar entre a fila crítica de pendências e inspeções concluídas', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador15Page />
      </MemoryRouter>
    );

    // Aba inicial: Pendentes
    expect(screen.getByText('Fila Crítica de Pendências (A Inspecionar)')).toBeInTheDocument();
    expect(screen.getByText('Farmácia Central de Manipulação LTDA')).toBeInTheDocument();
    expect(screen.getByText('Laboratório de Análises Clínicas Braúnas ME')).toBeInTheDocument();
    expect(screen.queryByText('Hospital e Maternidade São Geraldo')).not.toBeInTheDocument();

    // Troca para Aba: Inspeções Concluídas
    const abaConcluidas = screen.getByRole('button', { name: /Inspeções Concluídas \(Risco III\)/i });
    fireEvent.click(abaConcluidas);

    expect(screen.getByText('Hospital e Maternidade São Geraldo')).toBeInTheDocument();
    expect(screen.getByText('Lucas Silveira, Matheus Oliveira')).toBeInTheDocument();
    expect(screen.queryByText('Farmácia Central de Manipulação LTDA')).not.toBeInTheDocument();
  });

  it('filtra estabelecimentos pelo campo de busca', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador15Page />
      </MemoryRouter>
    );

    const inputBusca = screen.getByPlaceholderText(/Buscar por Razão, CNPJ ou Bairro.../i);
    fireEvent.change(inputBusca, { target: { value: 'ManipulaFarma' } });

    expect(screen.getByText('Farmácia Central de Manipulação LTDA')).toBeInTheDocument();
    expect(screen.queryByText('Laboratório de Análises Clínicas Braúnas ME')).not.toBeInTheDocument();
  });

  it('aciona window.print ao clicar no botão de impressão', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <RelatorioIndicador15Page />
      </MemoryRouter>
    );

    const btnPrint = screen.getByRole('button', { name: /Imprimir Relatório/i });
    fireEvent.click(btnPrint);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('permite navegação de volta para a Central de Relatórios', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador15Page />
      </MemoryRouter>
    );

    const linkVoltar = screen.getByRole('link', { name: /Voltar para Relatórios/i });
    expect(linkVoltar).toHaveAttribute('href', '/relatorios');
  });
});
