import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Building2, 
  HeartHandshake, 
  FileText, 
  History, 
  Settings, 
  ChevronDown, 
  Database, 
  HelpCircle, 
  ExternalLink,
  Users,
  CheckCircle2,
  Calendar,
  X,
  UserCheck,
  Building,
  Layers,
  Sparkles,
  AlertTriangle,
  LogOut,
  UserCircle,
  KeyRound,
  Target,
  ClipboardList
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { 
    indicadores, 
    alertasVapt,
    logsAuditoria, 
    configuracao, 
    fiscaisAtivos,
    estabelecimentos,
    loading 
  } = useVigiMinas();
  const navigate = useNavigate();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const anoStr = String(configuracao.exercicioAtivo.anoExercicio || indicadores.anoReferencia);

  // Total de pendências prioritárias para o badge na Sidebar
  const totalPendenciasMetas = estabelecimentos.filter(e =>
    (e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso') &&
    (e.nivelRisco === 'Risco III' || e.nivelRisco === 'Risco II') &&
    (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr))
  ).length;

  // Link click handler (closes mobile drawer)
  const handleNavClick = () => {
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const { usuario, logout, isAdminMaster } = useAuth();

  const getIniciais = (nome?: string) => {
    if (!nome) return 'US';
    const partes = nome.trim().split(' ').filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return nome.slice(0, 2).toUpperCase();
  };

  const getFuncaoBadge = (funcao?: string) => {
    switch (funcao) {
      case 'admin_master':
        return 'Admin Master';
      case 'fiscal_tecnico':
        return 'Fiscal / Técnico';
      case 'digitador':
        return 'Digitador';
      default:
        return 'Usuário';
    }
  };

  return (
    <>
      {/* Backdrop para Mobile Drawer */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200 lg:hidden"
        />
      )}

      {/* Barra Lateral Esquerda Estruturada (Sidebar) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col justify-between transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:w-full lg:border-r-0 lg:translate-x-0 shrink-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* ============================================================== */}
        {/* 1. TOPO DA SIDEBAR: LOGO/MARCA + SELETOR DE WORKSPACE          */}
        {/* ============================================================== */}
        <div className="p-4 border-b border-slate-800/90 shrink-0">
          
          {/* Header Mobile com Botão Fechar */}
          <div className="flex items-center justify-between lg:hidden mb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Navegação Principal
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition duration-150"
              aria-label="Fechar navegação"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo & Marca Oficial */}
          <div 
            onClick={() => { navigate('/'); handleNavClick(); }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-600/30 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-xs group-hover:scale-102 group-hover:bg-emerald-500/35 transition duration-150">
              <ShieldCheck className="w-5 h-5 text-emerald-400" strokeWidth={2.4} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  VISA • {configuracao.secretaria.municipio || 'Braúnas'}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  SES/MG
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight truncate leading-tight mt-0.5 group-hover:text-emerald-300 transition duration-150">
                VigiMinas Braúnas
              </h2>
            </div>
          </div>

          {/* Seletor de Workspace / Contexto da Secretaria */}
          <div className="mt-3 relative">
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition duration-150 cursor-pointer active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Secretaria de Saúde
                </p>
                <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  Exercício {configuracao.exercicioAtivo.anoExercicio}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${workspaceMenuOpen ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {/* Dropdown do Workspace */}
            {workspaceMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl z-30 text-xs space-y-1">
                <div className="px-2 py-1.5 border-b border-slate-700/60">
                  <p className="font-semibold text-slate-200">{configuracao.secretaria.nomeOrgao}</p>
                  <p className="text-[10px] text-slate-400 truncate">{configuracao.secretaria.departamento}</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">CNPJ: {configuracao.secretaria.cnpj}</p>
                </div>

                <div 
                  onClick={() => {
                    navigate('/configuracoes');
                    setWorkspaceMenuOpen(false);
                    handleNavClick();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg cursor-pointer transition duration-150"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gerenciar Exercício 2026</span>
                </div>

                <div 
                  onClick={() => {
                    navigate('/configuracoes');
                    setWorkspaceMenuOpen(false);
                    handleNavClick();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg cursor-pointer transition duration-150"
                >
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  <span>Fiscais Ativos ({fiscaisAtivos.length})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. MEIO DA SIDEBAR: LINKS PRINCIPAIS AGRUPADOS POR CONTEXTO    */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
          
          {/* Grupo 1: Gestão & Fiscalização Sanitária */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
              <span>Gestão & Fiscalização</span>
            </p>
            <nav className="space-y-1">
              
              {/* Painel de Metas (Dashboard) */}
              <NavLink
                to="/"
                end
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-150 ease-out active:scale-[0.98] relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold shadow-xs border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                  <span className="truncate">Painel de Metas</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 shrink-0">
                  5 Metas
                </span>
              </NavLink>

              {/* Metas 2026 / Fila Prioritária */}
              <NavLink
                to="/metas"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-150 ease-out active:scale-[0.98] relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold shadow-xs border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Target className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                  <span className="truncate">Metas 2026</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80 shrink-0">
                  {totalPendenciasMetas} pendentes
                </span>
              </NavLink>

              {/* Estabelecimentos VISA */}
              <NavLink
                to="/estabelecimentos"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-150 ease-out active:scale-[0.98] relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold shadow-xs border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                  <span className="truncate">Estabelecimentos (VISA)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {indicadores.ind12TotalCadastrados}
                </span>
              </NavLink>

              {/* Saúde do Trabalhador VAPT */}
              <NavLink
                to="/saude-trabalhador"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-150 ease-out active:scale-[0.98] relative ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 font-bold shadow-xs border border-teal-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <HeartHandshake className="w-4 h-4 text-teal-400 shrink-0" strokeWidth={2} />
                  <span className="truncate">Saúde do Trabalhador</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {alertasVapt && alertasVapt.totalAlertas > 0 && (
                    <span 
                      title={`${alertasVapt.totalVencidas} inspeção(ões) VAPT vencida(s) e ${alertasVapt.totalProximasVencer} a vencer nos próximos 5 dias`}
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs ${
                        alertasVapt.totalVencidas > 0 
                          ? 'bg-rose-500 text-white animate-pulse' 
                          : 'bg-amber-400 text-amber-950 font-black'
                      }`}
                    >
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" strokeWidth={3} />
                      <span>{alertasVapt.totalAlertas}</span>
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/80">
                    {indicadores.ind11TotalInspecoesAno} vistorias
                  </span>
                </div>
              </NavLink>

            </nav>
          </div>

          {/* Grupo 2: Monitoramento & Auditoria */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
              <span>Auditoria & Prestação</span>
            </p>
            <nav className="space-y-1">
              
              {/* Central de Relatórios */}
              <NavLink
                to="/relatorios"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-150 ease-out active:scale-[0.98] relative ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 font-bold shadow-xs border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={2} />
                  <span className="truncate">Central de Relatórios</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80 shrink-0">
                  Hub
                </span>
              </NavLink>

              {/* Logs de Auditoria */}
              <NavLink
                to="/logs-auditoria"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-150 ease-out active:scale-[0.98] relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold shadow-xs border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <History className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                  <span className="truncate">Auditoria & Logs</span>
                </div>
                {logsAuditoria.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700 shrink-0">
                    {logsAuditoria.length}
                  </span>
                )}
              </NavLink>

            </nav>
          </div>

        </div>

        {/* ============================================================== */}
        {/* 3. BASE DA SIDEBAR: CONFIGURAÇÕES, STATUS & PERFIL DO USUÁRIO  */}
        {/* ============================================================== */}
        <div className="p-3 border-t border-slate-800/90 shrink-0 space-y-2 bg-slate-900/95">
          
          {/* Link para Configurações Gerais */}
          <NavLink
            to="/configuracoes"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-150 ease-out active:scale-[0.98] relative ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 font-bold shadow-xs border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Settings className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
              <span className="truncate">Configurações Gerais</span>
            </div>
            <span className="text-[10px] text-slate-400">Ajustes</span>
          </NavLink>

          {/* Botão de Suporte Normativo / Resoluções SES/MG */}
          <button
            onClick={() => setSupportModalOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-xs font-medium transition duration-150 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Suporte & Resoluções</span>
            </div>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Ajuda</span>
          </button>

          {/* Status do Sistema (Firestore & Conexão) */}
          <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-slate-300">
                {loading ? 'Sincronizando...' : 'Firestore Conectado'}
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              v1.5
            </span>
          </div>

          {/* Perfil do Usuário Autenticado (Avatar Dinâmico + Mini Menu + Logout) */}
          <div className="relative pt-1">
            <div 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 cursor-pointer transition duration-150 select-none active:scale-[0.99]"
            >
              {/* Avatar com Iniciais Dinâmicas */}
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                {getIniciais(usuario?.nomeCompleto || usuario?.username)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {usuario?.nomeCompleto || usuario?.username || 'Usuário'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-emerald-400 font-medium truncate">
                    {usuario?.cargo || 'Fiscal'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-semibold shrink-0">
                    {getFuncaoBadge(usuario?.funcao)}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Mini Menu do Perfil */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-30 text-xs space-y-1">
                <div className="px-2 py-1.5 border-b border-slate-700/60">
                  <p className="font-bold text-white truncate">{usuario?.nomeCompleto || usuario?.username}</p>
                  <p className="text-[10px] text-slate-400 truncate">{usuario?.email}</p>
                  <span className="inline-block text-[9px] font-mono text-emerald-400 mt-0.5">
                    Perfil: {getFuncaoBadge(usuario?.funcao)}
                  </span>
                </div>

                <div 
                  onClick={() => {
                    navigate('/configuracoes?aba=perfil');
                    setUserMenuOpen(false);
                    handleNavClick();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg cursor-pointer transition"
                >
                  <UserCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Meu Perfil & Senha</span>
                </div>

                {isAdminMaster && (
                  <div 
                    onClick={() => {
                      navigate('/configuracoes?aba=usuarios');
                      setUserMenuOpen(false);
                      handleNavClick();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg cursor-pointer transition"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>Gestão de Usuários</span>
                  </div>
                )}

                <div 
                  onClick={() => {
                    navigate('/logs-auditoria');
                    setUserMenuOpen(false);
                    handleNavClick();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg cursor-pointer transition"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Trilha de Auditoria</span>
                </div>

                <div className="pt-1 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 rounded-lg cursor-pointer transition font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sair do Sistema</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* Modal de Suporte Normativo & Resoluções */}
      {supportModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 transition duration-150"
          onClick={() => setSupportModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Base Normativa VigiMinas (SES/MG)
                </h3>
              </div>
              <button 
                onClick={() => setSupportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600 max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl space-y-1">
                <p className="font-bold text-emerald-950 text-xs">Resolução SES/MG nº 8.784/2023</p>
                <p className="text-slate-600">Regulamenta as diretrizes do Programa VigiMinas e os Indicadores 11 a 15 para municípios de pequeno porte.</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-xs">Indicadores Monitorados no Exercício {configuracao.exercicioAtivo.anoExercicio}:</p>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                  <li><strong>Ind 11:</strong> Vigilância em Ambientes e Processos de Trabalho (Meta: {configuracao.exercicioAtivo.metaInd11Vapt} inspeções/ano).</li>
                  <li><strong>Ind 12:</strong> Cadastro de Estabelecimentos de Baixo e Alto Risco (Meta: 100% dos sujeitos à VISA).</li>
                  <li><strong>Ind 13:</strong> Inspeções em Estabelecimentos de Alto Risco (Meta: {configuracao.exercicioAtivo.metaInd13RiscoI}% dos cadastrados).</li>
                  <li><strong>Ind 14:</strong> Resolução de Reclamações e Denúncias (Meta: {configuracao.exercicioAtivo.metaInd14RiscoII}% em até 15 dias).</li>
                  <li><strong>Ind 15:</strong> Alimentação Contínua dos Sistemas Oficiais de Informação Sanitária.</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500">
                  Órgão Regional: GRS Coronel Fabriciano / Superintendência Regional de Saúde do Vale do Aço.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSupportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition duration-150 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
