import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RelatorioIndicador14Page } from '../../../src/pages/RelatorioIndicador14Page';

const { mockNavigate, mockEstabelecimentos, mockExecutarInspecaoRapida } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockExecutarInspecaoRapida: vi.fn(),
    mockEstabelecimentos: [
      {
        id: 'est-r2-1',
        razaoSocial: 'Supermercado Central Braúnas LTDA',
        nomeFantasia: 'Super Central',
        cnpjCpf: '11.222.333/0001-44',
        cnaeCodigo: '4711-3/02',
        cnaeDescricao: 'Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - supermercados',
        nivelRisco: 'Risco II',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
        dataUltimaInspecaoInicio: '2026-02-20',
        dataUltimaInspecaoFim: '2026-02-20',
        fiscaisUltimaInspecao: ['Lucas Silveira'],
        endereco: {
          logradouro: 'Av. Minas Gerais, 500',
          numero: '500',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-r2-2',
        razaoSocial: 'Restaurante Sabor de Minas ME',
        nomeFantasia: 'Fogão de Lenha',
        cnpjCpf: '22.333.444/0001-55',
        cnaeCodigo: '5611-2/01',
        cnaeDescricao: 'Restaurantes e similares',
        nivelRisco: 'Risco II',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Vencido',
        dataUltimaInspecaoInicio: '2025-05-10',
        dataUltimaInspecaoFim: '2025-05-10',
        endereco: {
          logradouro: 'Rua das Flores, 120',
          numero: '120',
          bairro: 'São Geraldo',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-r2-3',
        razaoSocial: 'Lanchonete e Pastelaria Braúnas',
        nomeFantasia: 'Pastel & Cia',
        cnpjCpf: '33.444.555/0001-66',
        cnaeCodigo: '5611-2/03',
        cnaeDescricao: 'Lanchonetes, casas de chá, de sucos e similares',
        nivelRisco: 'Risco II',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Não Possui (Irregular)',
        dataUltimaInspecaoInicio: '',
        dataUltimaInspecaoFim: '',
        endereco: {
          logradouro: 'Praça da Matriz, 15',
          numero: '15',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG',
        },
        isDeleted: false,
      },
      {
        id: 'est-r1-other',
        razaoSocial: 'Outra Empresa Risco I',
        cnpjCpf: '99.888.777/0001-11',
        cnaeCodigo: '4722-9/01',
        cnaeDescricao: 'Açougue',
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

describe('RelatorioIndicador14Page (US-05 - Indicador 14 Risco II)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho executivo com referências à Resolução SES/MG nº 10.917/2026', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador14Page />
      </MemoryRouter>
    );

    expect(screen.getByText('Relatório de Fiscalização - Indicador 14 (Risco II)')).toBeInTheDocument();
    expect(screen.getByText(/Inspeções Sanitárias em Médio Risco \| Meta Estadual: 90% com Impacto Financeiro/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Braúnas \/ MG/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Porte 2 a 10 mil hab/i)).toBeInTheDocument();
  });

  it('renderiza os 4 cards de KPIs com base, inspeções, cobertura e previsão de repasse', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador14Page />
      </MemoryRouter>
    );

    // Card 1: Base de Risco II Cadastrada (3 empresas de Risco II no mock)
    expect(screen.getByText('Base de Risco II')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);

    // Card 2: Inspeções Realizadas no Exercício (1 realizada em 2026: Super Central)
    expect(screen.getByText('Inspeções Realizadas')).toBeInTheDocument();
    expect(screen.getByText(/2 pendentes/i)).toBeInTheDocument();

    // Card 3: Cobertura Atual (%) (1 de 3 = 33.3%)
    expect(screen.getByText('Cobertura Atual (%)')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
    expect(screen.getAllByText('Meta: 90%').length).toBeGreaterThanOrEqual(1);

    // Card 4: Previsão de Repasse Financeiro (33.3% está na faixa de 30% a 39.9% -> 30% do Recurso)
    expect(screen.getByText('Previsão de Repasse Financeiro')).toBeInTheDocument();
    expect(screen.getAllByText(/30% do Recurso/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Risco de corte de 70% do recurso/i)).toBeInTheDocument();
  });

  it('renderiza o painel "Diagnóstico Operacional: O Que Falta para Garantir 100% do Recurso" e checklist regulatório', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador14Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/Diagnóstico Operacional: O Que Falta para Garantir 100% do Recurso/i)).toBeInTheDocument();
    // Meta de 90% de 3 empresas = Math.ceil(3 * 0.9) = 3 inspeções. Como tem 1 realizada, faltam 2 inspeções.
    expect(screen.getByText(/para alcançar o piso de 90%/i)).toBeInTheDocument();
    expect(screen.getByText(/Ritmo sugerido:/i)).toBeInTheDocument();

    // Checklist
    expect(screen.getByText('Atingir a cobertura de 90% em Risco II')).toBeInTheDocument();
    expect(screen.getByText('Priorizar estabelecimentos com Alvará Vencido / Irregular')).toBeInTheDocument();
    expect(screen.getByText('Gerar planilha de monitoramento de Risco II')).toBeInTheDocument();
    expect(screen.getByText(/Submeter no Formulário Unificado VigiMinas \(prazo fatal: 15\/01\/2027\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Garantir validação técnica junto ao NUVISA da Regional de Saúde/i)).toBeInTheDocument();
  });

  it('renderiza a régua oficial de repasse financeiro por faixas', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador14Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/Régua Oficial de Repasse Financeiro por Faixas/i)).toBeInTheDocument();
    expect(screen.getByText('< 10%')).toBeInTheDocument();
    expect(screen.getByText('10-19%')).toBeInTheDocument();
    expect(screen.getByText('30-39%')).toBeInTheDocument();
    expect(screen.getByText('≥ 90%')).toBeInTheDocument();
  });

  it('permite alternar entre a fila de pendências e inspeções realizadas', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador14Page />
      </MemoryRouter>
    );

    // Aba inicial: Pendentes
    expect(screen.getByText('Fila de Inspeções Pendentes (O Que Falta)')).toBeInTheDocument();
    expect(screen.getByText('Restaurante Sabor de Minas ME')).toBeInTheDocument();
    expect(screen.getByText('Lanchonete e Pastelaria Braúnas')).toBeInTheDocument();
    expect(screen.queryByText('Supermercado Central Braúnas LTDA')).not.toBeInTheDocument();

    // Troca para Aba: Inspeções Realizadas
    const abaInspecionados = screen.getByRole('button', { name: /Inspeções Realizadas \(Risco II\)/i });
    fireEvent.click(abaInspecionados);

    expect(screen.getByText('Supermercado Central Braúnas LTDA')).toBeInTheDocument();
    expect(screen.getByText('Lucas Silveira')).toBeInTheDocument();
    expect(screen.queryByText('Restaurante Sabor de Minas ME')).not.toBeInTheDocument();
  });

  it('filtra estabelecimentos pelo campo de busca', () => {
    render(
      <MemoryRouter>
        <RelatorioIndicador14Page />
      </MemoryRouter>
    );

    const inputBusca = screen.getByPlaceholderText(/Buscar por Razão, CNPJ ou Bairro.../i);
    fireEvent.change(inputBusca, { target: { value: 'Pastel' } });

    expect(screen.getByText('Lanchonete e Pastelaria Braúnas')).toBeInTheDocument();
    expect(screen.queryByText('Restaurante Sabor de Minas ME')).not.toBeInTheDocument();
  });

  it('aciona window.print ao clicar no botão de impressão', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <RelatorioIndicador14Page />
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
        <RelatorioIndicador14Page />
      </MemoryRouter>
    );

    const linkVoltar = screen.getByRole('link', { name: /Voltar para Relatórios/i });
    expect(linkVoltar).toHaveAttribute('href', '/relatorios');
  });
});
