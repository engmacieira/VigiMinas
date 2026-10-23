import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../../src/pages/LoginPage';
import { useAuth } from '../../../src/contexts/AuthContext';

vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

const mockUsuarios = [
  {
    id: 'u-1',
    username: 'Matheus',
    nomeCompleto: 'Matheus Henrique Macieira',
    cargo: 'Coordenador',
    funcao: 'admin_master',
    email: 'matheus@email.com',
    ativo: true
  },
  {
    id: 'u-2',
    username: 'lucas_fiscal',
    nomeCompleto: 'Lucas Silveira',
    cargo: 'Fiscal Sanitário',
    funcao: 'fiscal_tecnico',
    email: 'lucas@email.com',
    ativo: true
  }
];

describe('LoginPage - Seleção de Usuário e Autenticação', () => {
  const mockLogin = vi.fn();
  const mockCarregarUsuarios = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      usuario: null,
      isAuthenticated: false,
      isAdminMaster: false,
      loading: false,
      erroLogin: null,
      login: mockLogin,
      logout: vi.fn(),
      usuarios: mockUsuarios,
      carregarUsuarios: mockCarregarUsuarios,
      cadastrarUsuario: vi.fn(),
      editarUsuario: vi.fn(),
      redefinirSenhaUsuario: vi.fn(),
      toggleAtivoUsuario: vi.fn(),
      atualizarMeuPerfil: vi.fn()
    });
  });

  it('renderiza o select com os usuários ativos cadastrados', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const select = screen.getByLabelText(/Selecione o Usuário/i);
    expect(select).toBeInTheDocument();

    expect(screen.getByText(/Matheus Henrique Macieira \(@Matheus\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Lucas Silveira \(@lucas_fiscal\)/i)).toBeInTheDocument();
  });

  it('NÃO exibe os dados e credenciais em texto aberto na tela de login', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Primeiro Acesso \/ Administrador Master/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/22061993/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Preencher/i })).not.toBeInTheDocument();
  });

  it('permite selecionar o usuário, digitar a senha e submeter o login', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const select = screen.getByLabelText(/Selecione o Usuário/i);
    fireEvent.change(select, { target: { value: 'lucas_fiscal' } });

    const inputSenha = screen.getByPlaceholderText(/Digite sua senha/i);
    fireEvent.change(inputSenha, { target: { value: 'minhaSenha123' } });

    const btnEntrar = screen.getByRole('button', { name: /Entrar no Sistema/i });
    fireEvent.click(btnEntrar);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('lucas_fiscal', 'minhaSenha123');
    });
  });
});
