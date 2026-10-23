import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Building2,
  PlusCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { Estabelecimento } from '../types/vigiminas';
import { RegistrarInspecaoModal } from '../components/RegistrarInspecaoModal';

export const FilaMetasPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    indicadores,
    estabelecimentos,
    configuracao,
    exportarPlanilha,
    executarInspecaoRapida
  } = useVigiMinas();

  const anoStr = String(configuracao.exercicioAtivo.anoExercicio || indicadores.anoReferencia);

  // Estados locais para busca, filtro por risco, filtro por status e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRisco, setFiltroRisco] = useState<'Todos' | 'Risco III' | 'Risco II' | 'Risco I'>('Todos');
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Pendentes' | 'Vistoriados'>('Pendentes');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Modal de inspeção rápida
  const [estParaInspecao, setEstParaInspecao] = useState<Estabelecimento | null>(null);
  const [modalInspecaoAberto, setModalInspecaoAberto] = useState(false);

  const handleOpenQuickInspecao = (est: Estabelecimento) => {
    setEstParaInspecao(est);
    setModalInspecaoAberto(true);
  };

  const handleConfirmInspecao = async (
    estAtualizado: Estabelecimento,
    detalhes: {
      dataInspecao: string;
      fiscais: string[];
      renovarAlvara: boolean;
      novoAlvaraNumero?: string;
      novaValidadeAlvara?: string;
    }
  ) => {
    await executarInspecaoRapida({
      estabelecimentoId: estAtualizado.id,
      dataInspecao: detalhes.dataInspecao,
      fiscais: detalhes.fiscais,
      renovarAlvara: detalhes.renovarAlvara,
      novoAlvaraNumero: detalhes.novoAlvaraNumero,
      novaValidadeAlvara: detalhes.novaValidadeAlvara
    });
  };

  // Filtragem completa dos estabelecimentos
  const estabelecimentosFiltrados = useMemo(() => {
    return estabelecimentos.filter((est) => {
      // Regra de busca
      const termo = searchTerm.toLowerCase();
      const bateBusca =
        !searchTerm ||
        est.razaoSocial.toLowerCase().includes(termo) ||
        (est.nomeFantasia && est.nomeFantasia.toLowerCase().includes(termo)) ||
        est.cnpjCpf.includes(termo) ||
        est.endereco.bairro.toLowerCase().includes(termo) ||
        est.cnaeDescricao.toLowerCase().includes(termo);

      if (!bateBusca) return false;

      // Filtro de Nível de Risco
      if (filtroRisco !== 'Todos' && est.nivelRisco !== filtroRisco) {
        return false;
      }

      // Filtro de Pendência no Ano Exercício
      const vistoriadoNoAno = Boolean(
        est.dataUltimaInspecaoInicio && est.dataUltimaInspecaoInicio.startsWith(anoStr)
      );

      if (filtroStatus === 'Pendentes' && vistoriadoNoAno) {
        return false;
      }
      if (filtroStatus === 'Vistoriados' && !vistoriadoNoAno) {
        return false;
      }

      return true;
    });
  }, [estabelecimentos, searchTerm, filtroRisco, filtroStatus, anoStr]);

  // Paginação
  const totalPaginas = Math.ceil(estabelecimentosFiltrados.length / itensPorPagina) || 1;
  const estabelecimentosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return estabelecimentosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [estabelecimentosFiltrados, paginaAtual]);

  // Totais das metas para os cards informativos superiores
  const totalPendentesRiscoIII = useMemo(() => {
    return estabelecimentos.filter(e =>
      (e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso') &&
      e.nivelRisco === 'Risco III' &&
      (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr))
    ).length;
  }, [estabelecimentos, anoStr]);

  const totalPendentesRiscoII = useMemo(() => {
    return estabelecimentos.filter(e =>
      (e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso') &&
      e.nivelRisco === 'Risco II' &&
      (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr))
    ).length;
  }, [estabelecimentos, anoStr]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-2">

      {/* Botão de Retorno e Cabeçalho Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Dashboard</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Target className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Metas 2026 • Fila Prioritária de Vistorias
              </h1>
              <p className="text-xs text-slate-500">
                Gestão completa de fiscalizações sanitárias obrigatórias para cumprimento das metas estaduais SES/MG.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={exportarPlanilha}
          className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm shrink-0 active:scale-98"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Planilha Oficial</span>
        </button>
      </div>

      {/* Panorama Geral dos Indicadores / Métricas Sintéticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
              Risco III (Alto Risco)
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {totalPendentesRiscoIII} <span className="text-xs text-slate-500 font-normal">pendentes</span>
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Meta 100% (SES/MG)
            </span>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
              Risco II (Médio Risco)
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {totalPendentesRiscoII} <span className="text-xs text-slate-500 font-normal">pendentes</span>
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Meta &ge; {configuracao.exercicioAtivo.metaInd14RiscoII}%
            </span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Total em Fila Filtrada
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {estabelecimentosFiltrados.length} <span className="text-xs text-slate-500 font-normal">unidades</span>
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Exercício Ativo {anoStr}
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">

        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por razão social, nome fantasia, CNPJ ou bairro..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPaginaAtual(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        {/* Filtros Combinados */}
        <div className="flex items-center gap-2.5 flex-wrap">

          {/* Filtro por Risco */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-semibold">Risco:</span>
            <select
              value={filtroRisco}
              onChange={(e) => { setFiltroRisco(e.target.value as any); setPaginaAtual(1); }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Risco III">Risco III (Alto)</option>
              <option value="Risco II">Risco II (Médio)</option>
              <option value="Risco I">Risco I (Baixo)</option>
            </select>
          </div>

          {/* Filtro por Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={filtroStatus}
              onChange={(e) => { setFiltroStatus(e.target.value as any); setPaginaAtual(1); }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Pendentes">Pendentes {anoStr}</option>
              <option value="Vistoriados">Vistoriados {anoStr}</option>
              <option value="Todos">Todos os Registros</option>
            </select>
          </div>

        </div>

      </div>

      {/* Tabela Completa de Estabelecimentos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Estabelecimento / Razão Social</th>
                <th className="px-5 py-3.5">Nível de Risco</th>
                <th className="px-5 py-3.5">Localização</th>
                <th className="px-5 py-3.5">Última Inspeção</th>
                <th className="px-5 py-3.5 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {estabelecimentosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 space-y-1">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">Nenhum estabelecimento encontrado</p>
                    <p className="text-[11px]">Tente alterar o termo de busca ou os filtros aplicados acima.</p>
                  </td>
                </tr>
              ) : (
                estabelecimentosPaginados.map((est) => {
                  const vistoriado = Boolean(
                    est.dataUltimaInspecaoInicio && est.dataUltimaInspecaoInicio.startsWith(anoStr)
                  );
                  const isRisco3 = est.nivelRisco === 'Risco III';

                  return (
                    <tr key={est.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{est.nomeFantasia || est.razaoSocial}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {est.razaoSocial} • CNPJ: {est.cnpjCpf}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                          {est.cnaeDescricao}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono border ${
                            isRisco3
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : est.nivelRisco === 'Risco II'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {est.nivelRisco}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{est.endereco.bairro}</div>
                        <div className="text-[11px] text-slate-500">{est.endereco.logradouro}, {est.endereco.numero}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        {vistoriado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {est.dataUltimaInspecaoInicio}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Pendente em {anoStr}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenQuickInspecao(est)}
                          className="min-h-[38px] px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-97"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Registrar Vistoria</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé com Paginação */}
        {totalPaginas > 1 && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Mostrando página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-100 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Inspeção Rápida */}
      <RegistrarInspecaoModal
        isOpen={modalInspecaoAberto}
        onClose={() => setModalInspecaoAberto(false)}
        estabelecimento={estParaInspecao}
        onConfirmInspecao={handleConfirmInspecao}
      />

    </div>
  );
};
