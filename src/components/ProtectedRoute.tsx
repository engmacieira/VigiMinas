import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/vigiminas';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

interface ProtectedRouteProps {
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, requiredRoles }) => {
  const { isAuthenticated, loading, usuario } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">Verificando sessão de acesso...</p>
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // Validação de Role / RBAC
  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : undefined);
  if (allowedRoles && !allowedRoles.includes(usuario.funcao)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" strokeWidth={2.2} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-950 px-2.5 py-1 rounded border border-rose-800/60">
              Erro 403 • Acesso Negado
            </span>
            <h1 className="text-xl font-extrabold text-white pt-1">
              Permissão Insuficiente
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seu perfil de acesso atual (<strong className="text-slate-200">@{usuario.username}</strong> - <span className="capitalize">{usuario.funcao.replace('_', ' ')}</span>) não possui privilégios para acessar esta rota.
            </p>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left">
            <p className="font-semibold text-slate-300 mb-0.5">Perfil Requerido:</p>
            <p className="font-mono text-emerald-400">{allowedRoles.join(' ou ')}</p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <Home className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
