import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  UserCheck, 
  FileCheck2, 
  Building2, 
  HardHat, 
  CheckCircle2, 
  AlertCircle,
  History,
  Tag,
  Database,
  Terminal,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sliders,
  Users as UsersIcon,
  FileText
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { LogAuditoria, AcaoAuditoria, OperacaoFirestore, ColecaoAuditada } from '../types/vigiminas';
import { FISCAIS_MUNICIPIO } from '../data/braunasInitialData';

// Formatação memorizável fora do render
const formatarDataHora = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return iso;
  }
};

const getOperacaoBadge = (operacao?: OperacaoFirestore, acao?: AcaoAuditoria) => {
  const op = operacao || (acao === 'Criação' ? 'create' : acao === 'Exclusão' ? 'delete' : acao === 'Exportação' ? 'export' : 'update');
  switch (op) {
    case 'create':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" strokeWidth={2.5} />
          CREATE
        </span>
      );
    case 'update':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-900 border border-blue-300">
          <Tag className="w-3 h-3 text-blue-700" strokeWidth={2.5} />
          UPDATE
        </span>
      );
    case 'delete':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-950 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-700" strokeWidth={2.5} />
          DELETE
        </span>
      );
    case 'export':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-purple-100 text-purple-900 border border-purple-300">
          <Database className="w-3 h-3 text-purple-700" strokeWidth={2.5} />
          EXPORT
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-900 border border-slate-300">
          LOG
        </span>
      );
  }
};

const getColecaoBadge = (colecao?: ColecaoAuditada, tipo?: string) => {
  const col = colecao || (tipo === 'InspecaoVapt' ? 'inspecoes_vapt' : tipo === 'ExportacaoBackup' ? 'backups_exportados' : 'estabelecimentos');
  if (col === 'estabelecimentos') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-300">
        <Building2 className="w-3 h-3 text-slate-600" />
        estabelecimentos
      </span>
    );
  }
  if (col === 'backups_exportados') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-900 border border-purple-200">
        <Database className="w-3 h-3 text-purple-700" />
        backups_exportados
      </span>
    );
  }
  if (col === 'configuracoes_sistema') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-300">
        <Sliders className="w-3 h-3 text-amber-700" />
        configuracoes_sistema
      </span>
    );
  }
  if (col === 'usuarios') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-900 border border-indigo-200">
        <UsersIcon className="w-3 h-3 text-indigo-700" />
        usuarios
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-900 border border-teal-200">
      <HardHat className="w-3 h-3 text-teal-700" />
      inspecoes_vapt
    </span>
  );
};

interface LogRowItemProps {
  log: LogAuditoria;
}

/**
 * Subcomponente Puro memorizado via React.memo para isolar a renderização das linhas de log
 */
const LogRowItem: React.FC<LogRowItemProps> = React.memo(({ log }) => {
  const alteracoesLista = useMemo(() => {
    if (!log.alteracoes) return [];
    if (Array.isArray(log.alteracoes)) return log.alteracoes;
    if (typeof log.alteracoes === 'string') return [log.alteracoes];
    return [];
  }, [log.alteracoes]);

  return (
    <tr className="hover:bg-slate-50/80 transition">
      {/* Timestamp */}
      <td className="py-3 px-4 whitespace-nowrap align-top">
        <div className="flex items-center gap-1.5 font-mono text-slate-700 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{formatarDataHora(log.timestamp)}</span>
        </div>
        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
          Log: {log.id.slice(0, 16)}...
        </span>
      </td>

      {/* Operação e Coleção */}
      <td className="py-3 px-4 whitespace-nowrap align-top">
        <div className="flex flex-col gap-1.5">
          <div>{getOperacaoBadge(log.operacao, log.acao)}</div>
          <div>{getColecaoBadge(log.colecao, log.tipoRegistro)}</div>
        </div>
      </td>

      {/* Recurso ID e Entidade */}
      <td className="py-3 px-4 align-top">
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block leading-tight">
            {log.identificadorEntidade}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
            <span className="text-[10px] uppercase font-bold text-slate-400">ID:</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold border border-slate-200">
              {log.recursoId || log.registroId}
            </span>
          </div>
        </div>
      </td>

      {/* Usuário / Responsável */}
      <td className="py-3 px-4 align-top">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>{log.nomeUsuario || log.fiscalResponsavel || log.usuario}</span>
          </div>
          {log.cargo && (
            <span className="text-[11px] text-slate-500 font-medium block">
              {log.cargo}
            </span>
          )}
          {log.usuario && log.usuario !== log.nomeUsuario && (
            <span className="text-[10px] text-slate-400 font-mono block">
              {log.usuario}
            </span>
          )}
        </div>
      </td>

      {/* Detalhamento e Modificações */}
      <td className="py-3 px-4 max-w-md align-top">
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {log.detalhes}
        </p>

        {alteracoesLista.length > 0 && (
          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
            <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wide">
              Campos Alterados:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 font-mono text-[10px]">
              {alteracoesLista.map((alt, idx) => (
                <li key={idx} className="truncate">
                  {alt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </td>
    </tr>
  );
});

LogRowItem.displayName = 'LogRowItem';

export const LogsAuditoriaPage: React.FC = () => {
  const { logsAuditoria, recarregarDados, loading } = useVigiMinas();
  const [busca, setBusca] = useState('');
  const [filtroOperacao, setFiltroOperacao] = useState<string>('todas');
  const [filtroColecao, setFiltroColecao] = useState<string>('todas');
  const [filtroFiscal, setFiltroFiscal] = useState<string>('todos');

  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState<number>(10);

  // Memorização da filtragem dos logs
  const logsFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const filtroFiscalLower = filtroFiscal.toLowerCase();

    return logsAuditoria.filter(log => {
      const matchBusca = !termo ||
        log.identificadorEntidade.toLowerCase().includes(termo) ||
        log.detalhes.toLowerCase().includes(termo) ||
        log.fiscalResponsavel.toLowerCase().includes(termo) ||
        (log.usuario && log.usuario.toLowerCase().includes(termo)) ||
        (log.nomeUsuario && log.nomeUsuario.toLowerCase().includes(termo)) ||
        (log.cargo && log.cargo.toLowerCase().includes(termo)) ||
        log.recursoId.toLowerCase().includes(termo) ||
        (log.registroId && log.registroId.toLowerCase().includes(termo));

      const matchOperacao = filtroOperacao === 'todas' || 
        log.operacao === filtroOperacao ||
        (filtroOperacao === 'create' && log.acao === 'Criação') ||
        (filtroOperacao === 'update' && (log.acao === 'Edição' || log.acao === 'Inspeção Rápida')) ||
        (filtroOperacao === 'delete' && log.acao === 'Exclusão');

      const matchColecao = filtroColecao === 'todas' || 
        log.colecao === filtroColecao ||
        (filtroColecao === 'estabelecimentos' && log.tipoRegistro === 'Estabelecimento') ||
        (filtroColecao === 'inspecoes_vapt' && log.tipoRegistro === 'InspecaoVapt');

      const matchFiscal = filtroFiscal === 'todos' || 
        log.fiscalResponsavel.includes(filtroFiscal) ||
        (log.nomeUsuario && log.nomeUsuario.toLowerCase().includes(filtroFiscalLower)) ||
        (log.usuario && log.usuario.toLowerCase().includes(filtroFiscalLower));

      return matchBusca && matchOperacao && matchColecao && matchFiscal;
    });
  }, [logsAuditoria, busca, filtroOperacao, filtroColecao, filtroFiscal]);

  // Reiniciar a paginação para a página 1 ao alterar filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroOperacao, filtroColecao, filtroFiscal, itensPorPagina]);

  // Cálculos de Paginação Memorizados
  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(logsFiltrados.length / itensPorPagina));
  }, [logsFiltrados.length, itensPorPagina]);

  const indiceInicio = useMemo(() => {
    return (paginaAtual - 1) * itensPorPagina;
  }, [paginaAtual, itensPorPagina]);

  const indiceFim = useMemo(() => {
    return Math.min(indiceInicio + itensPorPagina, logsFiltrados.length);
  }, [indiceInicio, itensPorPagina, logsFiltrados.length]);

  const logsPaginados = useMemo(() => {
    return logsFiltrados.slice(indiceInicio, indiceFim);
  }, [logsFiltrados, indiceInicio, indiceFim]);

  // Contadores globais das operações auditadas
  const { totalCreates, totalUpdates, totalDeletes } = useMemo(() => {
    let creates = 0;
    let updates = 0;
    let deletes = 0;

    for (let i = 0; i < logsAuditoria.length; i++) {
      const l = logsAuditoria[i];
      if (l.operacao === 'create' || l.acao === 'Criação') creates++;
      else if (l.operacao === 'update' || l.acao === 'Edição' || l.acao === 'Inspeção Rápida') updates++;
      else if (l.operacao === 'delete' || l.acao === 'Exclusão') deletes++;
    }

    return { totalCreates: creates, totalUpdates: updates, totalDeletes: deletes };
  }, [logsAuditoria]);

  // Handlers Memorizados via useCallback
  const handleBuscaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBusca(e.target.value);
  }, []);

  const handleOperacaoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroOperacao(e.target.value);
  }, []);

  const handleColecaoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroColecao(e.target.value);
  }, []);

  const handleFiscalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroFiscal(e.target.value);
  }, []);

  const handleItensPorPaginaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setItensPorPagina(Number(e.target.value));
  }, []);

  const handleLimparFiltros = useCallback(() => {
    setBusca('');
    setFiltroOperacao('todas');
    setFiltroColecao('todas');
    setFiltroFiscal('todos');
  }, []);

  const handlePrimeiraPagina = useCallback(() => {
    setPaginaAtual(1);
  }, []);

  const handlePaginaAnterior = useCallback(() => {
    setPaginaAtual(prev => Math.max(1, prev - 1));
  }, []);

  const handleProximaPagina = useCallback(() => {
    setPaginaAtual(prev => Math.min(totalPaginas, prev + 1));
  }, [totalPaginas]);

  const handleUltimaPagina = useCallback(() => {
    setPaginaAtual(totalPaginas);
  }, [totalPaginas]);

  const handleIrParaPagina = useCallback((num: number) => {
    setPaginaAtual(num);
  }, []);

  // Geração de números de página com janela deslizante
  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    const pages: number[] = [];
    let start = Math.max(1, paginaAtual - Math.floor(maxVisible / 2));
    let end = Math.min(totalPaginas, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [paginaAtual, totalPaginas]);

  return (
    <div className="space-y-6">
      
      {/* Banner Superior */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Database className="w-3 h-3" />
              Coleção Firestore • logs_auditoria
            </span>
            <span className="text-xs text-slate-400 font-mono">Middleware de Persistência</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" strokeWidth={2.2} />
            Trilha de Auditoria & Middleware de Persistência
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Todas as operações executadas nas coleções do sistema são capturadas automaticamente pelo middleware e gravadas de forma imutável com timestamp, ID do recurso, operação, identificação do usuário autenticado e histórico de alterações (diff).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => recarregarDados()}
            disabled={loading}
            aria-busy={loading}
            aria-label="Atualizar Logs de Auditoria"
            className="min-h-[44px] px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-2 cursor-pointer border border-slate-700 disabled:opacity-50"
          >
            <Clock className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Atualizando...' : 'Atualizar Logs'}</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas de Auditoria */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total de Eventos Auditados</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {logsAuditoria.length}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">coleção logs_auditoria</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Operações CREATE</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {totalCreates}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">inclusões registradas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Operações UPDATE</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {totalUpdates}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">alterações e vistorias</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Operações DELETE</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">
            {totalDeletes}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">exclusões lógicas</span>
        </div>
      </div>

      {/* Filtros da Trilha de Auditoria */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-busca-logs"
              aria-label="Buscar eventos de auditoria"
              placeholder="Buscar por ID, razão social, termo VAPT, usuário ou fiscal..."
              value={busca}
              onChange={handleBuscaChange}
              className="w-full h-11 pl-9 pr-4 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              id="select-filtro-operacao"
              aria-label="Filtrar por operação"
              value={filtroOperacao}
              onChange={handleOperacaoChange}
              className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
            >
              <option value="todas">Todas Operações (create/update/delete)</option>
              <option value="create">Operação CREATE (Inclusão)</option>
              <option value="update">Operação UPDATE (Edição/Inspeção)</option>
              <option value="delete">Operação DELETE (Exclusão)</option>
            </select>

            <select
              id="select-filtro-colecao"
              aria-label="Filtrar por coleção"
              value={filtroColecao}
              onChange={handleColecaoChange}
              className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
            >
              <option value="todas">Todas as Coleções</option>
              <option value="estabelecimentos">estabelecimentos</option>
              <option value="inspecoes_vapt">inspecoes_vapt</option>
              <option value="configuracoes_sistema">configuracoes_sistema</option>
              <option value="usuarios">usuarios</option>
            </select>

            <select
              id="select-filtro-fiscal"
              aria-label="Filtrar por fiscal ou usuário"
              value={filtroFiscal}
              onChange={handleFiscalChange}
              className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
            >
              <option value="todos">Todos Fiscais / Usuários</option>
              {FISCAIS_MUNICIPIO.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong>{logsFiltrados.length === 0 ? 0 : indiceInicio + 1} a {indiceFim}</strong> de <strong>{logsFiltrados.length}</strong> eventos filtrados ({logsAuditoria.length} no total)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-itens-por-pagina" className="text-[11px] text-slate-600 font-medium">Registros por página:</label>
              <select
                id="select-itens-por-pagina"
                aria-label="Registros por página"
                value={itensPorPagina}
                onChange={handleItensPorPaginaChange}
                className="h-8 px-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold cursor-pointer outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {(busca || filtroOperacao !== 'todas' || filtroColecao !== 'todas' || filtroFiscal !== 'todos') && (
              <button
                type="button"
                onClick={handleLimparFiltros}
                className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline text-[11px]"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Logs de Auditoria */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp (Local)</th>
                <th className="py-3 px-4">Operação & Coleção</th>
                <th className="py-3 px-4">Recurso Afetado (ID / Entidade)</th>
                <th className="py-3 px-4">Usuário / Responsável</th>
                <th className="py-3 px-4">Detalhamento & Modificações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logsPaginados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum evento de auditoria localizado</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de pesquisa ou limpe a busca.</p>
                  </td>
                </tr>
              ) : (
                logsPaginados.map(log => (
                  <LogRowItem key={log.id} log={log} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Paginação */}
        {logsFiltrados.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-600">
              Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong> (Total: {logsFiltrados.length} registros)
            </span>

            <div className="flex items-center gap-1" role="navigation" aria-label="Navegação de Páginas">
              {/* Botão Primeira Página */}
              <button
                type="button"
                onClick={handlePrimeiraPagina}
                disabled={paginaAtual === 1}
                aria-label="Primeira Página"
                title="Primeira Página"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Botão Página Anterior */}
              <button
                type="button"
                onClick={handlePaginaAnterior}
                disabled={paginaAtual === 1}
                aria-label="Página Anterior"
                title="Página Anterior"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Números de Página */}
              <div className="flex items-center gap-1 mx-1">
                {pageNumbers.map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleIrParaPagina(num)}
                    aria-label={`Página ${num}`}
                    aria-current={paginaAtual === num ? 'page' : undefined}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      paginaAtual === num
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Botão Próxima Página */}
              <button
                type="button"
                onClick={handleProximaPagina}
                disabled={paginaAtual === totalPaginas}
                aria-label="Próxima Página"
                title="Próxima Página"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Botão Última Página */}
              <button
                type="button"
                onClick={handleUltimaPagina}
                disabled={paginaAtual === totalPaginas}
                aria-label="Última Página"
                title="Última Página"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
