import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RelatorioIndicador13Page } from '../../../src/pages/RelatorioIndicador13Page';

const { mockNavigate, mockEstabelecimentos, mockExecutarInspecaoRapida } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockExecutarInspecaoRapida: vi.fn(),
    mockEstabelecimentos: [
      {
        id: 'est-1',
        razaoSocial: 'Padaria e Confeitaria Braúnas ME',
        nomeFantasia: 'Pão de Minas',
        cnpj: '33.444.555/0001-66',
        cnaeCodigo: '1091-1/02',
        cnaeDescricao: 'Fabricação de produtos de panificação',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
        dataUltimaInspecaoInicio: '2026-03-10',
        dataUltimaInspecaoFim: '2026-03-10',
        fiscaisUltimaInspecao: ['Lucas Silveira'],
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
        razaoSocial: 'Mercearia Santa Rita LTDA',
        nomeFantasia: 'Mercadinho Rita',
        cnpj: '44.555.666/0001-77',
        cnaeCodigo: '4712-1/00',
        cnaeDescricao: 'Comércio varejista de mercadorias em geral',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Vencido',
        dataUltimaInspecaoInicio: '2025-04-10',
        dataUltimaInspecaoFim: '2025-04-10',
        endereco: {
          logradouro: 'Av. Brasil, 250',
          numero: '250',
          bairro: 'São Geraldo',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-3',
        razaoSocial: 'Açougue do Zé ME',
        nomeFantasia: 'Casa de Carnes Central',
        cnpj: '55.666.777/0001-88',
        cnaeCodigo: '4722-9/01',
        cnaeDescricao: 'Comércio varejista de carnes - açougues',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
        dataUltimaInspecaoInicio: '',
        dataUltimaInspecaoFim: '',
        endereco: {
          logradouro: 'Rua do Mercado, 45',
          numero: '45',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-4',
        razaoSocial: 'Drogaria Esperança',
        nomeFantasia: 'Farmácia Esperança',
        cnpj: '66.777.888/0001-99',
        cnaeCodigo: '4771-7/01',
        cnaeDescricao: 'Comércio varejista de produtos farmacêuticos',
        nivelRisco: 'Risco III',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
        dataUltimaInspecaoInicio: '2026-02-15',
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

describe('RelatorioIndicador13Page (US-04 - Indicador 13 Risco I)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho executivo com referências à Resolução SES/MG nº 10.917/2026', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador13Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/Relatório de Fiscalização - Indicador 13 \(Risco I\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Resolução SES\/MG nº 10\.917\/2026/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Braúnas \/ MG/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Porte 2 a 10 mil hab/i)).toBeInTheDocument();
  });

  it('renderiza os 4 cards de KPIs calculados com a meta mínima de 15%', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador13Page />
      </MemoryRouter>
    );

    // Card 1: Base de Risco I Cadastrada (3 empresas de Risco I)
    expect(screen.getByText('Base de Risco I Cadastrada')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Card 2: Meta Mínima (15% de 3 = Math.ceil(0.45) = 1)
    expect(screen.getByText('Meta Mínima (15%)')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);

    // Card 3: Inspeções Realizadas (1 inspecionada em 2026: Padaria)
    expect(screen.getByText('Inspeções Realizadas')).toBeInTheDocument();
    expect(screen.getByText(/2 pendentes/i)).toBeInTheDocument();

    // Card 4: Cobertura Atual (1 de 3 = 33.3% >= 15%)
    expect(screen.getByText('Cobertura Atual (%)')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
    expect(screen.getByText('Meta Atingida')).toBeInTheDocument();
  });

  it('renderiza o painel "Diagnóstico Operacional: O Que Falta?" e checklist regulatório', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador13Page />
      </MemoryRouter>
    );

    expect(screen.getByText('Diagnóstico Operacional: O Que Falta?')).toBeInTheDocument();
    expect(screen.getByText(/Parabéns! O município de Braúnas atingiu a meta da SES-MG/i)).toBeInTheDocument();
    expect(screen.getByText(/Atingir a cota mínima de 15% de inspeções na base de Risco I/i)).toBeInTheDocument();
    expect(screen.getByText(/Gerar e validar a Planilha de Fiscalização de Risco I da VISA/i)).toBeInTheDocument();
    expect(screen.getByText(/Submeter dados e anexos no Formulário Unificado VigiMinas/i)).toBeInTheDocument();
    expect(screen.getByText(/Certificar que estabelecimentos baixados pós-inspeção tenham observação/i)).toBeInTheDocument();
  });

  it('permite alternar entre as abas de pendências e inspeções realizadas', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador13Page />
      </MemoryRouter>
    );

    // Inicialmente na aba de pendências (2 pendentes: Mercearia Santa Rita e Açougue do Zé)
    expect(screen.getByText('Mercearia Santa Rita LTDA')).toBeInTheDocument();
    expect(screen.getByText('Açougue do Zé ME')).toBeInTheDocument();
    expect(screen.queryByText('Padaria e Confeitaria Braúnas ME')).not.toBeInTheDocument();

    // Alternar para aba de Inspeções Realizadas
    const botaoAbaInspecionados = screen.getByRole('button', { name: /Inspeções Realizadas em Risco I/i });
    fireEvent.click(botaoAbaInspecionados);

    expect(screen.getByText('Padaria e Confeitaria Braúnas ME')).toBeInTheDocument();
    expect(screen.queryByText('Mercearia Santa Rita LTDA')).not.toBeInTheDocument();
  });

  it('filtra estabelecimentos pelo campo de busca', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador13Page />
      </MemoryRouter>
    );

    const inputBusca = screen.getByPlaceholderText(/Buscar por Razão Social, Fantasia ou Bairro/i);
    fireEvent.change(inputBusca, { target: { value: 'Açougue' } });

    expect(screen.getByText('Açougue do Zé ME')).toBeInTheDocument();
    expect(screen.queryByText('Mercearia Santa Rita LTDA')).not.toBeInTheDocument();
  });

  it('aciona window.print ao clicar no botão de impressão', () => {
    const originalPrint = window.print;
    window.print = vi.fn();

    render(
      <MemoryRouter>
        <RelatorioIndicador13Page />
      </MemoryRouter>
    );

    const botaoImprimir = screen.getByRole('button', { name: /Imprimir Relatório/i });
    fireEvent.click(botaoImprimir);

    expect(window.print).toHaveBeenCalledTimes(1);
    window.print = originalPrint;
  });

  it('permite navegação de volta para a Central de Relatórios', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador13Page />
      </MemoryRouter>
    );

    const linkVoltar = screen.getByRole('link', { name: /Voltar para Relatórios/i });
    expect(linkVoltar).toHaveAttribute('href', '/relatorios');
  });
});
