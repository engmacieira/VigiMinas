import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  ExternalLink
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { toastMessage, loading, estabelecimentos, configuracao } = useVigiMinas();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Notification Flutuante com microinteração suave */}
      {toastMessage && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/80 flex items-center gap-3 transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
          <p className="text-xs font-semibold text-slate-100">{toastMessage}</p>
        </div>
      )}

      {/* 1. NAVEGAÇÃO LATERAL OBRIGATÓRIA (SIDEBAR / DRAWER) */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onCloseMobile={() => setMobileSidebarOpen(false)} 
      />

      {/* 2. CONTEÚDO PRINCIPAL (HEADER SECUNDÁRIO + TELAS) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Header Secundário: Breadcrumbs/Título, Busca Cmd+K, Notificações */}
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        {/* Área de Visualização das Páginas */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading && estabelecimentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-500">
              <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3.5" />
              <p className="text-xs font-bold text-slate-700 tracking-tight">Carregando dados da Vigilância Sanitária de Braúnas/MG...</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sincronizando com Firestore e regras de auditoria</p>
            </div>
          ) : (
            <div className="transition duration-150 ease-out">
              <Outlet />
            </div>
          )}
        </main>

        {/* Rodapé Oficial Governamental */}
        <footer className="bg-white border-t border-slate-200/90 text-slate-500 text-xs py-4 px-4 sm:px-6 lg:px-8 print:hidden mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
              <p className="text-slate-600 text-[11px] font-medium">
                <strong className="text-slate-800">{configuracao.secretaria.nomeOrgao}</strong> • {configuracao.secretaria.departamento}
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-700 font-sans font-medium">
                <Database className="w-3 h-3 text-emerald-600" />
                Firestore Ativo
              </span>
              <span>•</span>
              <span className="text-slate-600">Exercício {configuracao.exercicioAtivo.anoExercicio}</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};
