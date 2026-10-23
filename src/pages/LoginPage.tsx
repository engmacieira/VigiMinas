import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, erroLogin, usuarios, carregarUsuarios } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  // Garante que a lista de usuários esteja atualizada
  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  // Filtra apenas usuários ativos para o select
  const usuariosAtivos = useMemo(() => {
    return usuarios.filter(u => u.ativo);
  }, [usuarios]);

  // Se houver apenas 1 usuário cadastrado e nenhum selecionado, pré-seleciona
  useEffect(() => {
    if (usuariosAtivos.length === 1 && !username) {
      setUsername(usuariosAtivos[0].username);
    }
  }, [usuariosAtivos, username]);

  // Usuário atualmente selecionado
  const usuarioSelecionado = useMemo(() => {
    return usuariosAtivos.find(u => u.username === username);
  }, [usuariosAtivos, username]);

  const toggleMostrarSenha = useCallback(() => {
    setMostrarSenha(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLocal(null);

    const userTrim = username.trim();
    if (!userTrim) {
      setErroLocal('Selecione seu usuário cadastrado para continuar.');
      return;
    }
    if (!senha) {
      setErroLocal('Informe sua senha de acesso.');
      return;
    }

    setSubmitting(true);
    try {
      await login(userTrim, senha);
      navigate('/', { replace: true });
    } catch (err: any) {
      setErroLocal(err?.message || 'Falha na autenticação. Verifique sua senha.');
    } finally {
      setSubmitting(false);
    }
  }, [username, senha, login, navigate]);

  // Se já estiver autenticado, redireciona
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Cabeçalho Institucional */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-xl shadow-emerald-950/50 mb-1">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400" strokeWidth={2.4} />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 font-mono">
                VISA • BRAÚNAS/MG
              </span>
              <span className="text-[10px] font-medium text-slate-400">SES/MG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              VigiMinas
            </h1>
            <p className="text-xs text-slate-400">
              Sistema Integrado de Gestão Sanitária e Monitoramento de Metas
            </p>
          </div>
        </div>

        {/* Card do Formulário de Login */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5">
          
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200">
              Acesso ao Sistema
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione seu usuário e digite sua senha para entrar.
            </p>
          </div>

          {/* Mensagem de Erro Visual e para leitores de tela */}
          {(erroLocal || erroLogin) && (
            <div 
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{erroLocal || erroLogin}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo: Selecionar Usuário Cadastrado */}
            <div className="space-y-1.5">
              <label htmlFor="select-usuario" className="block text-xs font-semibold text-slate-300">
                Selecione o Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                
                <select
                  id="select-usuario"
                  aria-label="Selecione o Usuário"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErroLocal(null);
                  }}
                  disabled={submitting}
                  className="w-full h-11 pl-10 pr-10 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-150 cursor-pointer appearance-none"
                >
                  <option value="" disabled className="text-slate-500 bg-slate-900">
                    {usuariosAtivos.length === 0 ? 'Carregando usuários cadastrados...' : 'Selecione seu usuário...'}
                  </option>
                  {usuariosAtivos.map(u => (
                    <option key={u.id} value={u.username} className="text-white bg-slate-900 py-2">
                      {u.nomeCompleto} (@{u.username})
                    </option>
                  ))}
                </select>

                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Informações Resumidas do Usuário Selecionado */}
              {usuarioSelecionado && (
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs animate-in fade-in duration-150 mt-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-300 font-bold flex items-center justify-center text-[11px] border border-emerald-500/30 shrink-0">
                      {usuarioSelecionado.nomeCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-200 text-xs leading-tight truncate">
                        {usuarioSelecionado.nomeCompleto}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight truncate">
                        {usuarioSelecionado.cargo}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    usuarioSelecionado.funcao === 'admin_master'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                      : usuarioSelecionado.funcao === 'fiscal_tecnico'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      : 'bg-sky-950/80 text-sky-300 border-sky-800/60'
                  }`}>
                    {usuarioSelecionado.funcao === 'admin_master' ? 'Admin Master' : usuarioSelecionado.funcao === 'fiscal_tecnico' ? 'Fiscal VISA' : 'Digitador'}
                  </span>
                </div>
              )}
            </div>

            {/* Campo: Senha */}
            <div className="space-y-1.5">
              <label htmlFor="input-senha" className="block text-xs font-semibold text-slate-300">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  id="input-senha"
                  aria-label="Senha de Acesso"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus={!!username}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErroLocal(null);
                  }}
                  disabled={submitting}
                  className="w-full h-11 pl-10 pr-11 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-150"
                />
                <button
                  type="button"
                  onClick={toggleMostrarSenha}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer transition"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={submitting || !username}
              aria-busy={submitting}
              className="w-full min-h-[44px] mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando Senha...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Rodapé da Tela de Login */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            Prefeitura Municipal de Braúnas/MG • Secretaria Municipal de Saúde
          </p>
          <p className="text-[10px] text-slate-600">
            Controle de Acesso Baseado em Perfis (RBAC) e Trilha de Auditoria Ativa
          </p>
        </div>

      </div>
    </div>
  );
};
