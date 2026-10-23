import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfiguracoesPage } from '../../../src/pages/ConfiguracoesPage';
import { useVigiMinas } from '../../../src/contexts/VigiMinasContext';

vi.mock('../../../src/contexts/VigiMinasContext', () => ({
  useVigiMinas: vi.fn()
}));

const mockAuthUser = {
  id: 'usr-master-001',
  username: 'Matheus',
  nomeCompleto: 'Matheus Henrique Macieira',
  cargo: 'Coordenador',
  funcao: 'admin_master' as const,
  email: 'matheus_macieira@hotmail.com',
  ativo: true
};

const mockAuthValue = {
  usuario: mockAuthUser,
  isAuthenticated: true,
  isAdminMaster: true,
  loading: false,
  erroLogin: null,
  login: vi.fn(),
  logout: vi.fn(),
  usuarios: [mockAuthUser],
  carregarUsuarios: vi.fn(),
  cadastrarUsuario: vi.fn(),
  editarUsuario: vi.fn(),
  redefinirSenhaUsuario: vi.fn(),
  toggleAtivoUsuario: vi.fn(),
  atualizarMeuPerfil: vi.fn()
};

vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => mockAuthValue)
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

const mockFiscalAtivo = {
  id: 'f-1',
  nome: 'Lucas Silveira',
  matricula: 'MAT-001',
  cargo: 'Fiscal Sanitário Municipal',
  email: 'lucas@braunas.mg.gov.br',
  telefone: '(33) 99999-1111',
  ativo: true,
  dataAdmissao: '2023-01-15',
  isDeleted: false
};

const mockFiscalArquivado = {
  id: 'f-2',
  nome: 'Renata Souza',
  matricula: 'MAT-002',
  cargo: 'Fiscal Sanitária',
  email: 'renata@braunas.mg.gov.br',
  telefone: '(33) 99999-2222',
  ativo: false,
  dataAdmissao: '2022-06-01',
  isDeleted: true,
  motivoExclusao: 'Exoneração a pedido',
  deletedAt: '2026-02-15T10:00:00.000Z',
  deletedBy: 'Administrador'
};

const mockFiscalPermanenteExcluido = {
  id: 'f-3',
  nome: 'Marcos Invalido',
  matricula: 'MAT-003',
  cargo: 'Fiscal',
  email: 'marcos@test.com',
  telefone: '(33) 99999-3333',
  ativo: false,
  isDeleted: true,
  isPermanentlyDeleted: true,
  motivoExclusao: 'Cadastro de teste',
  motivoExclusaoPermanente: 'Remoção definitiva solicitada',
  deletedAt: '2025-12-01T10:00:00.000Z'
};

describe('ConfiguracoesPage - Quadro de Fiscais Sanitários (Arquivados & Exclusão em 2 Níveis)', () => {
  const mockRemoverFiscal = vi.fn();
  const mockExcluirPermanenteFiscal = vi.fn();
  const mockRestaurarFiscal = vi.fn();
  const mockAdicionarFiscal = vi.fn();
  const mockAtualizarFiscal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useVigiMinas).mockReturnValue({
      configuracao: {
        id: 'geral',
        secretaria: {
          nomeOrgao: 'Secretaria Municipal de Saúde',
          departamento: 'Vigilância Sanitária',
          municipio: 'Braúnas',
          uf: 'MG',
          codigoIbge: '3108909',
          cnpj: '18.312.345/0001-67',
          secretarioSaude: 'Dr. Secretário',
          coordenadorVisa: 'Coordenador VISA',
          enderecoCompleto: 'Rua Principal, 100',
          telefoneOficial: '(33) 3295-1234',
          emailOficial: 'visa@braunas.mg.gov.br',
          horarioAtendimento: '07h às 16h',
          portariaRegulamentacao: 'Portaria nº 001/2026',
          textoRodapeOficial: 'Prefeitura Municipal de Braúnas'
        },
        exercicioAtivo: {
          anoExercicio: 2026,
          metaInd11Vapt: 2,
          metaInd13RiscoI: 15,
          metaInd14RiscoII: 90,
          metaInd15RiscoIII: 100,
          dataInicioExercicio: '2026-01-01',
          dataTerminoExercicio: '2026-12-31',
          statusExercicio: 'Em Andamento'
        },
        exerciciosHistorico: [],
        fiscais: [mockFiscalAtivo, mockFiscalArquivado, mockFiscalPermanenteExcluido]
      },
      adicionarFiscal: mockAdicionarFiscal,
      atualizarFiscal: mockAtualizarFiscal,
      removerFiscal: mockRemoverFiscal,
      excluirPermanenteFiscal: mockExcluirPermanenteFiscal,
      restaurarFiscal: mockRestaurarFiscal,
      atualizarDadosSecretaria: vi.fn(),
      atualizarExercicioAtivo: vi.fn(),
      limparBanco: vi.fn(),
      restaurarDemonstrativos: vi.fn(),
      recarregarDados: vi.fn(),
      estabelecimentos: [],
      inspecoesVapt: [],
      logsAuditoria: [],
      loading: false
    } as any);
  });

  it('renderiza a aba "Arquivados" em vez de "Lixeira / Arquivados (Soft Delete)"', () => {
    renderWithRouter(<ConfiguracoesPage />);

    // Aba de Arquivados deve existir sem termos de soft delete
    const btnArquivados = screen.getByRole('button', { name: /Arquivados/i });
    expect(btnArquivados).toBeInTheDocument();
    expect(screen.queryByText(/Lixeira \/ Arquivados/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(Soft Delete\)/i)).not.toBeInTheDocument();

    // Contador da aba deve ser 1 (apenas mockFiscalArquivado, ignorando mockFiscalPermanenteExcluido)
    expect(btnArquivados).toHaveTextContent('1');
  });

  it('exibe o fiscal arquivado com botões de Restaurar e Excluir ao alternar para a aba Arquivados', () => {
    renderWithRouter(<ConfiguracoesPage />);

    const btnArquivados = screen.getByRole('button', { name: /Arquivados/i });
    fireEvent.click(btnArquivados);

    // Deve exibir Renata Souza com motivo
    expect(screen.getByText('Renata Souza')).toBeInTheDocument();
    expect(screen.getByText(/Exoneração a pedido/i)).toBeInTheDocument();

    // NÃO deve exibir o fiscal com isPermanentlyDeleted: true
    expect(screen.queryByText('Marcos Invalido')).not.toBeInTheDocument();

    // Deve exibir botões Restaurar e Excluir
    expect(screen.getByRole('button', { name: /Restaurar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excluir/i })).toBeInTheDocument();
  });

  it('chama restaurarFiscal ao clicar em Restaurar', async () => {
    renderWithRouter(<ConfiguracoesPage />);

    const btnArquivados = screen.getByRole('button', { name: /Arquivados/i });
    fireEvent.click(btnArquivados);

    const btnRestaurar = screen.getByRole('button', { name: /Restaurar/i });
    fireEvent.click(btnRestaurar);

    expect(mockRestaurarFiscal).toHaveBeenCalledWith('f-2');
  });

  it('abre o modal de confirmação ao clicar em Excluir na aba Arquivados e chama excluirPermanenteFiscal', async () => {
    renderWithRouter(<ConfiguracoesPage />);

    const btnArquivados = screen.getByRole('button', { name: /Arquivados/i });
    fireEvent.click(btnArquivados);

    const btnExcluir = screen.getByRole('button', { name: /Excluir/i });
    fireEvent.click(btnExcluir);

    // Modal de confirmação abre
    expect(screen.getByRole('heading', { name: /Confirmar Exclusão/i })).toBeInTheDocument();

    // Clica no botão de confirmar exclusão
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Exclusão/i });
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(mockExcluirPermanenteFiscal).toHaveBeenCalledWith(
        'f-2',
        expect.any(String)
      );
    });
  });
});
