import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  RefreshCw, 
  FileSpreadsheet, 
  ChevronRight, 
  ShieldCheck, 
  Building2, 
  HeartHandshake, 
  FileText, 
  History, 
  Settings,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  ExternalLink,
  Download,
  ChevronDown
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { useAuth } from '../contexts/AuthContext';
import { CommandPalette } from './CommandPalette';
import { ExportarEstabelecimentosModal } from './ExportarEstabelecimentosModal';
import { User, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { 
    logsAuditoria, 
    loading, 
    recarregarDados, 
    exportarPlanilha,
    indicadores,
    configuracao
  } = useVigiMinas();
  const { usuario, logout } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();

  // Estados
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);

  // Atalho global Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mapeamento dinâmico de Breadcrumbs e Título por Rota
  const getRouteInfo = () => {
    switch (location.pathname) {
      case '/estabelecimentos':
        return {
          section: 'Estabelecimentos VISA',
          title: 'Cadastro, CNAE e Risco Sanitário',
          icon: Building2
        };
      case '/saude-trabalhador':
        return {
          section: 'Saúde do Trabalhador',
          title: 'Inspeções e Ambientes de Trabalho (VAPT)',
          icon: HeartHandshake
        };
      case '/relatorio-oficial':
        return {
          section: 'Prestação de Contas',
          title: 'Relatório Oficial VigiMinas (SES/MG)',
          icon: FileText
        };
      case '/logs-auditoria':
        return {
          section: 'Auditoria & Segurança',
          title: 'Trilha de Auditoria e Mutações Firestore',
          icon: History
        };
      case '/configuracoes':
        return {
          section: 'Administração Geral',
          title: 'Configurações de Fiscais, Exercício e Secretaria',
          icon: Settings
        };
      case '/':
      default:
        return {
          section: 'Gestão Sanitária',
          title: 'Painel de Metas & Indicadores 11 a 15',
          icon: ShieldCheck
        };
    }
  };

  const routeInfo = getRouteInfo();
  const IconComponent = routeInfo.icon;

  // Notificações recentes (últimos eventos de auditoria)
  const recentLogs = logsAuditoria.slice(0, 5);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-30 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            
            {/* ============================================================== */}
            {/* LADO ESQUERDO: HAMBURGER (MOBILE) + BREADCRUMBS & TÍTULO       */}
            {/* ============================================================== */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Botão de Menu para Dispositivos Móveis */}
              <button
                onClick={onOpenMobileSidebar}
                aria-label="Abrir menu de navegação"
                className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition duration-150 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumbs e Título da Tela */}
              <div className="min-w-0">
                {/* Breadcrumbs sutis */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <span 
                    onClick={() => navigate('/')} 
                    className="hover:text-emerald-800 cursor-pointer transition duration-150"
                  >
                    VigiMinas
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" strokeWidth={2.5} />
                  <span className="text-slate-800 font-bold truncate">
                    {routeInfo.section}
                  </span>
                  <span className="hidden md:inline-block text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded border border-slate-200 ml-1">
                    {configuracao.exercicioAtivo.anoExercicio}
                  </span>
                </nav>

                {/* Título Principal da Tela Atual */}
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate flex items-center gap-1.5">
                  <IconComponent className="w-4 h-4 text-emerald-600 shrink-0 hidden sm:inline-block" strokeWidth={2.2} />
                  <span className="truncate">{routeInfo.title}</span>
                </h1>
              </div>
            </div>

            {/* ============================================================== */}
            {/* CENTRO: BARRA DE BUSCA RÁPIDA (Cmd+K)                          */}
            {/* ============================================================== */}
            <div className="flex-1 max-w-md mx-2 hidden sm:block">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 text-left text-xs text-slate-500 hover:text-slate-700 flex items-center justify-between gap-2 shadow-2xs transition-all duration-150 ease-out cursor-pointer active:scale-[0.99] focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
                  <span className="truncate">Buscar estabelecimentos, CNPJ, vistorias...</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <kbd className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                    ⌘K
                  </kbd>
                </div>
              </button>
            </div>

            {/* ============================================================== */}
            {/* LADO DIREITO: NOTIFICAÇÕES, ATUALIZAÇÃO & EXPORTAÇÃO           */}
            {/* ============================================================== */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Botão de Busca Mobile (apenas em telas pequenas) */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Abrir busca rápida"
                className="sm:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition duration-150 cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Central de Notificações / Alertas */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  aria-label="Notificações e auditoria recente"
                  className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition duration-150 cursor-pointer active:scale-[0.97]"
                >
                  <Bell className="w-4 h-4" strokeWidth={2} />
                  {logsAuditoria.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </button>

                {/* Popover de Notificações */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 z-50 p-3 space-y-2 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">Atividades & Notificações</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {logsAuditoria.length} registros
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {recentLogs.length === 0 ? (
                        <p className="py-6 text-center text-slate-400">Nenhum evento registrado ainda.</p>
                      ) : (
                        recentLogs.map(log => (
                          <div key={log.id} className="py-2 px-1 hover:bg-slate-50 rounded-lg transition duration-150">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-800 truncate">
                                {log.identificadorEntidade || log.recursoId}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {log.detalhes || `${log.operacao.toUpperCase()} em ${log.colecao}`}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1">
                      <button
                        onClick={() => {
                          navigate('/logs-auditoria');
                          setNotificationsOpen(false);
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1"
                      >
                        Ver todos os logs de auditoria
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[11px] text-slate-600 hover:text-slate-800 cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de Atualização do Banco */}
              <button
                type="button"
                onClick={() => recarregarDados()}
                disabled={loading}
                title="Recarregar dados do Firestore"
                aria-label="Recarregar dados do Firestore"
                className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition duration-150 cursor-pointer active:scale-[0.97] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} strokeWidth={2} />
              </button>

              {/* Menu de Exportação (CSV / XLS / VigiMinas) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuExportarAberto(prev => !prev)}
                  className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition duration-150 ease-out flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                  title="Opções de exportação de dados"
                >
                  <Download className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span className="hidden md:inline">Exportar Dados</span>
                  <span className="md:hidden">Exportar</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80 shrink-0 ml-0.5" />
                </button>

                {menuExportarAberto && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 z-50 p-2 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuExportarAberto(false);
                        setModalExportarAberto(true);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 transition flex items-start gap-2.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" strokeWidth={2.2} />
                      <div>
                        <div className="font-bold">Backup Externo (CSV / XLS)</div>
                        <div className="text-[11px] text-slate-500">28 colunas, filtros e formato customizável</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuExportarAberto(false);
                        exportarPlanilha();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 transition flex items-start gap-2.5 cursor-pointer border-t border-slate-100"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" strokeWidth={2.2} />
                      <div>
                        <div className="font-bold">Planilha Oficial SES/MG (.xlsx)</div>
                        <div className="text-[11px] text-slate-500">Relatório consolidado com metas 11 a 15</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Informações do Usuário Autenticado & Logout */}
              {usuario && (
                <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate('/configuracoes?aba=perfil')}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition duration-150 cursor-pointer text-left group"
                    title="Acessar Meu Perfil"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-1 ring-emerald-800 shadow-2xs group-hover:bg-emerald-800 transition">
                      {usuario.nomeCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="hidden xl:block min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-emerald-700">
                        {usuario.nomeCompleto}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate leading-tight">
                        {usuario.cargo}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => logout()}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition duration-150 cursor-pointer flex items-center gap-1.5 active:scale-[0.97]"
                    title="Sair do sistema (Logout)"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2} />
                    <span className="hidden sm:inline text-xs font-semibold">Sair</span>
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      </header>

      {/* Modal Command Palette (Cmd+K) */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Modal de Exportação de Dados */}
      <ExportarEstabelecimentosModal
        isOpen={modalExportarAberto}
        onClose={() => setModalExportarAberto(false)}
      />
    </>
  );
};
