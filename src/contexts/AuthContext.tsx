import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario } from '../types/vigiminas';
import { 
  getUsuarios, 
  autenticarUsuario, 
  salvarSessaoUsuario, 
  getSessaoAtiva, 
  cadastrarNovoUsuario, 
  editarUsuario as editarUsuarioService, 
  redefinirSenhaUsuario as redefinirSenhaService,
  atualizarMeuPerfil as atualizarMeuPerfilService
} from '../services/authService';

export interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isAdminMaster: boolean;
  loading: boolean;
  erroLogin: string | null;
  login: (username: string, senha: string) => Promise<void>;
  logout: () => void;
  usuarios: Usuario[];
  carregarUsuarios: () => Promise<void>;
  cadastrarUsuario: (dados: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'ultimoAcesso'>) => Promise<void>;
  editarUsuario: (id: string, dados: Partial<Omit<Usuario, 'id' | 'createdAt'>>) => Promise<void>;
  redefinirSenhaUsuario: (id: string, novaSenha: string) => Promise<void>;
  toggleAtivoUsuario: (id: string) => Promise<void>;
  atualizarMeuPerfil: (dados: { nomeCompleto: string; email: string; cargo: string }, senhaAtual?: string, novaSenha?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getSessaoAtiva());
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  // Carrega lista de usuários e sincroniza sessão inicial
  const carregarUsuarios = useCallback(async () => {
    try {
      const lista = await getUsuarios();
      setUsuarios(lista);

      // Se temos sessão ativa, garante que os dados estejam sincronizados com a lista mais recente
      const sessaoAtual = getSessaoAtiva();
      if (sessaoAtual) {
        const atualizado = lista.find(u => u.id === sessaoAtual.id);
        if (atualizado) {
          if (!atualizado.ativo) {
            // Se o usuário foi desativado enquanto logado, encerra a sessão
            salvarSessaoUsuario(null);
            setUsuario(null);
          } else {
            setUsuario(atualizado);
            salvarSessaoUsuario(atualizado);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  // Login
  const login = useCallback(async (username: string, senha: string) => {
    setErroLogin(null);
    try {
      const userLogado = await autenticarUsuario(username, senha);
      setUsuario(userLogado);
      await carregarUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação. Verifique suas credenciais.';
      setErroLogin(msg);
      throw err;
    }
  }, [carregarUsuarios]);

  // Logout
  const logout = useCallback(() => {
    salvarSessaoUsuario(null);
    setUsuario(null);
  }, []);

  // Cadastrar Novo Usuário (Admin Master)
  const cadastrarUsuario = useCallback(async (
    dados: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'ultimoAcesso'>
  ) => {
    const novo = await cadastrarNovoUsuario(dados, {
      usuarioId: usuario?.id,
      nomeUsuario: usuario?.nomeCompleto || usuario?.username,
      cargo: usuario?.cargo
    });
    setUsuarios(prev => [...prev, novo]);
  }, [usuario]);

  // Editar Usuário (Admin Master)
  const editarUsuario = useCallback(async (
    id: string, 
    dados: Partial<Omit<Usuario, 'id' | 'createdAt'>>
  ) => {
    const atualizado = await editarUsuarioService(id, dados, {
      usuarioId: usuario?.id,
      nomeUsuario: usuario?.nomeCompleto || usuario?.username,
      cargo: usuario?.cargo
    });
    setUsuarios(prev => prev.map(u => u.id === id ? atualizado : u));
    if (usuario && usuario.id === id) {
      setUsuario(atualizado);
    }
  }, [usuario]);

  // Redefinir Senha de Usuário (Admin Master)
  const redefinirSenhaUsuario = useCallback(async (id: string, novaSenha: string) => {
    await redefinirSenhaService(id, novaSenha, {
      usuarioId: usuario?.id,
      nomeUsuario: usuario?.nomeCompleto || usuario?.username,
      cargo: usuario?.cargo
    });
    await carregarUsuarios();
  }, [usuario, carregarUsuarios]);

  // Ativar / Desativar Usuário (Admin Master)
  const toggleAtivoUsuario = useCallback(async (id: string) => {
    const alvo = usuarios.find(u => u.id === id);
    if (!alvo) return;
    await editarUsuario(id, { ativo: !alvo.ativo });
  }, [usuarios, editarUsuario]);

  // Atualizar Meu Perfil (Qualquer usuário logado)
  const atualizarMeuPerfil = useCallback(async (
    dados: { nomeCompleto: string; email: string; cargo: string },
    senhaAtual?: string,
    novaSenha?: string
  ) => {
    if (!usuario) throw new Error('Nenhum usuário autenticado.');
    const atualizado = await atualizarMeuPerfilService(usuario.id, dados, senhaAtual, novaSenha);
    setUsuario(atualizado);
    setUsuarios(prev => prev.map(u => u.id === atualizado.id ? atualizado : u));
  }, [usuario]);

  const value: AuthContextType = {
    usuario,
    isAuthenticated: !!usuario && usuario.ativo,
    isAdminMaster: usuario?.funcao === 'admin_master',
    loading,
    erroLogin,
    login,
    logout,
    usuarios,
    carregarUsuarios,
    cadastrarUsuario,
    editarUsuario,
    redefinirSenhaUsuario,
    toggleAtivoUsuario,
    atualizarMeuPerfil
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
