import React, { useState, useMemo } from 'react';
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
  Layers
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { AcaoAuditoria, OperacaoFirestore, ColecaoAuditada } from '../types/vigiminas';
import { FISCAIS_MUNICIPIO } from '../data/braunasInitialData';

export const LogsAuditoriaPage: React.FC = () => {
  const { logsAuditoria, recarregarDados, loading } = useVigiMinas();
  const [busca, setBusca] = useState('');
  const [filtroOperacao, setFiltroOperacao] = useState<string>('todas');
  const [filtroColecao, setFiltroColecao] = useState<string>('todas');
  const [filtroFiscal, setFiltroFiscal] = useState<string>('todos');

  const logsFiltrados = useMemo(() => {
    return logsAuditoria.filter(log => {
      const termo = busca.toLowerCase().trim();
      const matchBusca = !termo ||
        log.identificadorEntidade.toLowerCase().includes(termo) ||
        log.detalhes.toLowerCase().includes(termo) ||
        log.fiscalResponsavel.toLowerCase().includes(termo) ||
        (log.usuario && log.usuario.toLowerCase().includes(termo)) ||
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
        (log.usuario && log.usuario.toLowerCase().includes(filtroFiscal.toLowerCase()));

      return matchBusca && matchOperacao && matchColecao && matchFiscal;
    });
  }, [logsAuditoria, busca, filtroOperacao, filtroColecao, filtroFiscal]);

  const totalCreates = logsAuditoria.filter(l => l.operacao === 'create' || l.acao === 'Criação').length;
  const totalUpdates = logsAuditoria.filter(l => l.operacao === 'update' || l.acao === 'Edição' || l.acao === 'Inspeção Rápida').length;
  const totalDeletes = logsAuditoria.filter(l => l.operacao === 'delete' || l.acao === 'Exclusão').length;

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
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-900 border border-teal-200">
        <HardHat className="w-3 h-3 text-teal-700" />
        inspecoes_vapt
      </span>
    );
  };

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
            Todas as operações (create/update/delete) executadas nas coleções <strong>estabelecimentos</strong> e <strong>inspecoes_vapt</strong> são capturadas automaticamente pelo middleware e gravadas de forma imutável com timestamp, ID do recurso, operação e usuário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => recarregarDados()}
            disabled={loading}
            className="min-h-[44px] px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Atualizar Logs</span>
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
          <span className="text-[10px] text-slate-400 block mt-0.5">exclusões definitivas</span>
        </div>
      </div>

      {/* Filtros da Trilha de Auditoria */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ID do recurso, razão social, termo VAPT, usuário ou fiscal..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-11 pl-9 pr-4 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filtroOperacao}
              onChange={(e) => setFiltroOperacao(e.target.value)}
              className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
            >
              <option value="todas">Todas Operações (create/update/delete)</option>
              <option value="create">Operação CREATE (Inclusão)</option>
              <option value="update">Operação UPDATE (Edição/Inspeção)</option>
              <option value="delete">Operação DELETE (Exclusão)</option>
            </select>

            <select
              value={filtroColecao}
              onChange={(e) => setFiltroColecao(e.target.value)}
              className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
            >
              <option value="todas">Todas as Coleções</option>
              <option value="estabelecimentos">estabelecimentos</option>
              <option value="inspecoes_vapt">inspecoes_vapt</option>
            </select>

            <select
              value={filtroFiscal}
              onChange={(e) => setFiltroFiscal(e.target.value)}
              className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
            >
              <option value="todos">Todos Fiscais / Usuários</option>
              {FISCAIS_MUNICIPIO.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Exibindo <strong>{logsFiltrados.length}</strong> de <strong>{logsAuditoria.length}</strong> eventos registrados
          </span>
          {(busca || filtroOperacao !== 'todas' || filtroColecao !== 'todas' || filtroFiscal !== 'todos') && (
            <button
              onClick={() => {
                setBusca('');
                setFiltroOperacao('todas');
                setFiltroColecao('todas');
                setFiltroFiscal('todos');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline text-[11px]"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Logs de Auditoria */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp (UTC/Local)</th>
                <th className="py-3 px-4">Operação & Coleção</th>
                <th className="py-3 px-4">Recurso Afetado (ID / Entidade)</th>
                <th className="py-3 px-4">Usuário / Fiscal</th>
                <th className="py-3 px-4">Detalhamento da Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum evento de auditoria localizado</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de pesquisa.</p>
                  </td>
                </tr>
              ) : (
                logsFiltrados.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatarDataHora(log.timestamp)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                        Log: {log.id}
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
                          <span className="text-[10px] uppercase font-bold text-slate-400">ID Recurso:</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold border border-slate-200">
                            {log.recursoId || log.registroId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Usuário / Fiscal */}
                    <td className="py-3 px-4 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                          <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{log.fiscalResponsavel || log.usuario}</span>
                        </div>
                        {log.usuario && (
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {log.usuario}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Detalhamento */}
                    <td className="py-3 px-4 max-w-md align-top">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {log.detalhes}
                      </p>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
