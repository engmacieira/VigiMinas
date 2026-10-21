import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Building2, 
  ShieldCheck, 
  HeartHandshake, 
  FileText, 
  History, 
  Settings, 
  Plus, 
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CalendarDays,
  CornerDownLeft
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { estabelecimentos, exportarPlanilha, gerarModeloPlanilha, exportarEstabelecimentos } = useVigiMinas();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static navigation routes
  const navigationItems = [
    {
      id: 'nav-dashboard',
      title: 'Painel de Metas VigiMinas',
      subtitle: 'Indicadores oficiais 11 a 15 (SES/MG)',
      icon: ShieldCheck,
      path: '/',
      category: 'Páginas do Sistema'
    },
    {
      id: 'nav-estabelecimentos',
      title: 'Estabelecimentos Sanitários (VISA)',
      subtitle: 'Cadastro, CNAE, Risco Sanitário e Vistorias',
      icon: Building2,
      path: '/estabelecimentos',
      category: 'Páginas do Sistema'
    },
    {
      id: 'nav-saude-trabalhador',
      title: 'Saúde do Trabalhador (VAPT)',
      subtitle: 'Roteiros de inspeção em ambientes e processos',
      icon: HeartHandshake,
      path: '/saude-trabalhador',
      category: 'Páginas do Sistema'
    },
    {
      id: 'nav-relatorio',
      title: 'Relatório Oficial VigiMinas',
      subtitle: 'Prestação de contas e metas quadrimestrais',
      icon: FileText,
      path: '/relatorio-oficial',
      category: 'Páginas do Sistema'
    },
    {
      id: 'nav-auditoria',
      title: 'Auditoria & Logs de Persistência',
      subtitle: 'Rastreabilidade de mutações em Firestore',
      icon: History,
      path: '/logs-auditoria',
      category: 'Páginas do Sistema'
    },
    {
      id: 'nav-configuracoes',
      title: 'Configurações Gerais do Sistema',
      subtitle: 'Fiscais, Exercício 2026, Secretaria e Metas',
      icon: Settings,
      path: '/configuracoes',
      category: 'Páginas do Sistema'
    }
  ];

  // Quick Action items
  const actionItems = [
    {
      id: 'act-novo-est',
      title: 'Cadastrar Novo Estabelecimento',
      subtitle: 'Adicionar empresa, CNAE e risco na VISA',
      icon: Plus,
      action: () => {
        navigate('/estabelecimentos');
      },
      category: 'Ações Rápidas'
    },
    {
      id: 'act-nova-inspecao',
      title: 'Registrar Nova Inspeção VAPT',
      subtitle: 'Avaliar saúde do trabalhador e ambiente laboral',
      icon: HeartHandshake,
      action: () => {
        navigate('/saude-trabalhador');
      },
      category: 'Ações Rápidas'
    },
    {
      id: 'act-importar-planilha',
      title: 'Importar Estabelecimentos via Planilha (.xls/.xlsx)',
      subtitle: 'Alimentar banco de dados em lote com validação de CNAE e Risco',
      icon: Upload,
      action: () => {
        navigate('/estabelecimentos');
      },
      category: 'Ações Rápidas'
    },
    {
      id: 'act-modelo-planilha',
      title: 'Baixar Planilha Modelo Oficial (.xlsx)',
      subtitle: 'Modelo pré-formatado com 24 colunas para preenchimento',
      icon: Download,
      action: () => {
        gerarModeloPlanilha();
      },
      category: 'Ações Rápidas'
    },
    {
      id: 'act-calendario-inspecoes',
      title: 'Calendário de Agendamento de Inspeções',
      subtitle: 'Visualizar mês e agendar vistorias sanitárias por arrastar e soltar',
      icon: CalendarDays,
      action: () => {
        navigate('/estabelecimentos');
      },
      category: 'Ações Rápidas'
    },
    {
      id: 'act-exportar-csv',
      title: 'Exportar Estabelecimentos em CSV (.csv)',
      subtitle: 'Backup de dados delimitado em formato universal com UTF-8',
      icon: FileText,
      action: () => {
        exportarEstabelecimentos({
          formato: 'csv',
          delimitadorCsv: ';',
          escopo: 'todos',
          registrarAuditoria: true
        });
      },
      category: 'Ações Rápidas'
    },
    {
      id: 'act-exportar-excel-backup',
      title: 'Exportar Backup Completo em Excel (.xlsx)',
      subtitle: 'Arquivo com todas as 28 colunas cadastrais e aba de auditoria',
      icon: Download,
      action: () => {
        exportarEstabelecimentos({
          formato: 'xlsx',
          escopo: 'todos',
          incluirMetadados: true,
          registrarAuditoria: true
        });
      },
      category: 'Ações Rápidas'
    },
    {
      id: 'act-exportar-planilha',
      title: 'Exportar Planilha Oficial SES/MG (.xlsx)',
      subtitle: 'Relatório do VigiMinas com metas e indicadores pactuados',
      icon: FileSpreadsheet,
      action: () => {
        exportarPlanilha();
      },
      category: 'Ações Rápidas'
    }
  ];

  // Matching establishments
  const matchingEstabelecimentos = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return estabelecimentos
      .filter(e => 
        !e.isDeleted && (
          e.razaoSocial.toLowerCase().includes(q) ||
          (e.nomeFantasia && e.nomeFantasia.toLowerCase().includes(q)) ||
          (e.cnpjCpf && e.cnpjCpf.includes(q)) ||
          (e.cnaeCodigo && e.cnaeCodigo.includes(q)) ||
          (e.endereco?.bairro && e.endereco.bairro.toLowerCase().includes(q))
        )
      )
      .slice(0, 5)
      .map(e => ({
        id: `est-${e.id}`,
        title: e.razaoSocial,
        subtitle: `${e.cnpjCpf || 'Sem CNPJ'} • ${e.cnaeCodigo || ''} - ${e.cnaeDescricao || 'Atividade'} (${e.endereco?.bairro || 'Braúnas'})`,
        icon: Building2,
        badge: e.nivelRisco,
        path: `/estabelecimentos`,
        category: 'Estabelecimentos'
      }));
  }, [query, estabelecimentos]);

  // Combined Results
  const filteredNav = navigationItems.filter(item => 
    !query || item.title.toLowerCase().includes(query.toLowerCase()) || item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = actionItems.filter(item => 
    !query || item.title.toLowerCase().includes(query.toLowerCase()) || item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const allResults = [
    ...filteredActions,
    ...matchingEstabelecimentos,
    ...filteredNav
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allResults]);

  const handleSelect = (item: any) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 transition duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] transition duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar páginas, estabelecimentos, CNPJ, vistorias ou ações..."
            className="flex-1 bg-transparent border-0 text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-0"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300/50">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100/80">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-slate-700">Nenhum resultado encontrado</p>
              <p className="text-xs text-slate-400 mt-0.5">Tente buscar por nome de empresa, CNPJ, CNAE ou ação do sistema.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {allResults.map((item: any, idx: number) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left cursor-pointer transition duration-150 ${
                      isSelected 
                        ? 'bg-emerald-50/80 text-emerald-950 border border-emerald-200/70 shadow-xs' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition duration-150 ${
                        isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {item.title}
                          </p>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navegue com <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-700">↑</kbd> <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-700">↓</kbd></span>
            <span>Acesse com <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-700">Enter</kbd></span>
          </div>
          <span className="text-slate-400 font-medium">VISA Braúnas / MG</span>
        </div>
      </div>
    </div>
  );
};
