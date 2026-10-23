import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  HardHat, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Estabelecimento, VigiMinasIndicadores } from '../types/vigiminas';
import { useVigiMinas } from '../contexts/VigiMinasContext';

interface DashboardMetasProps {
  indicadores: VigiMinasIndicadores;
  estabelecimentos: Estabelecimento[];
  onExportExcel: () => void;
  onOpenQuickInspecao: (estabelecimento: Estabelecimento) => void;
  onGoToEstabelecimentos: () => void;
  onGoToVapt: () => void;
  onGoToMetas?: () => void;
}

export const DashboardMetas: React.FC<DashboardMetasProps> = React.memo(({
  indicadores,
  estabelecimentos,
  onExportExcel,
  onOpenQuickInspecao,
  onGoToEstabelecimentos,
  onGoToVapt,
  onGoToMetas
}) => {
  const navigate = useNavigate();
  const { configuracao } = useVigiMinas();
  const anoStr = String(configuracao.exercicioAtivo.anoExercicio || indicadores.anoReferencia);
  const { metaInd11Vapt, metaInd13RiscoI, metaInd14RiscoII, metaInd15RiscoIII } = configuracao.exercicioAtivo;

  // Estado para colapsar/expandir inline o Action Widget no Dashboard
  const [filaExpanded, setFilaExpanded] = useState(true);

  // Estabelecimentos pendentes de Risco III e II
  const pendentesRiscoIII = useMemo(() => {
    return estabelecimentos.filter(e =>
      (e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso') &&
      e.nivelRisco === 'Risco III' &&
      (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr))
    );
  }, [estabelecimentos, anoStr]);

  const pendentesRiscoII = useMemo(() => {
    return estabelecimentos.filter(e =>
      (e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso') &&
      e.nivelRisco === 'Risco II' &&
      (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr))
    );
  }, [estabelecimentos, anoStr]);

  // Lista unificada de pendências (Risco III em alta prioridade, depois Risco II)
  const todasPendencias = useMemo(() => {
    return [...pendentesRiscoIII, ...pendentesRiscoII];
  }, [pendentesRiscoIII, pendentesRiscoII]);

  // Top 4 Ações Recomendadas para o Action Widget Compacto
  const topPrioridades = useMemo(() => {
    return todasPendencias.slice(0, 4);
  }, [todasPendencias]);

  const totalMetasConformes = useMemo(() => {
    return [
      indicadores.ind11MetaAtingida,
      true, // Indicador 12 cadastro ativo
      indicadores.ind13MetaAtingida,
      indicadores.ind14MetaAtingida,
      indicadores.ind15MetaAtingida
    ].filter(Boolean).length;
  }, [indicadores]);

  // Equipe de fiscais ativos formatada
  const nomesFiscaisAtivos = useMemo(() => {
    return configuracao.fiscais.filter(f => f.ativo).map(f => f.nome).join(', ');
  }, [configuracao.fiscais]);

  const handleNavigateMetas = () => {
    if (onGoToMetas) {
      onGoToMetas();
    } else {
      navigate('/metas');
    }
  };

  // Cálculo de dias sem inspeção ou rótulo explicativo
  const getStatusInspecao = (est: Estabelecimento) => {
    if (!est.dataUltimaInspecaoInicio) {
      return 'Sem histórico de inspeção';
    }
    const dataUltima = new Date(est.dataUltimaInspecaoInicio);
    if (isNaN(dataUltima.getTime())) {
      return `Última: ${est.dataUltimaInspecaoInicio}`;
    }
    const diffTime = Math.abs(Date.now() - dataUltima.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} dias sem inspeção`;
  };

  return (
    <div className="space-y-6">
      
      {/* LINHA 1: Faixa de Status Executivo do Município & Resumo de Conformidade */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-6 text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.2} />
              Monitoramento Oficial • Resolução SES/MG
            </span>
            <span className="text-xs text-slate-400 font-mono">Braúnas • {anoStr}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Painel de Apuração das Metas VigiMinas
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Consolidação em tempo real dos 5 indicadores sanitários municipais e de saúde do trabalhador.
            <strong className="text-emerald-400 ml-1 font-semibold">
              {totalMetasConformes === 5 
                ? 'Conformidade plena: 5 de 5 metas atingidas.' 
                : `${totalMetasConformes} de 5 metas em conformidade.`}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            type="button"
            onClick={onExportExcel}
            aria-label="Exportar Planilha Oficial em Excel"
            className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-emerald-900/20 active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4" strokeWidth={2} />
            <span>Exportar Planilha Oficial (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* LINHA 2: Layout Distribuído em 2 Colunas no Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA (~60% / col-span-7): Progresso das Metas Sanitárias 2026 */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Indicadores das Metas Sanitárias ({anoStr})
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {totalMetasConformes}/5 Cumpridos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* INDICADOR 12 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                      <Building2 className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ind 12</span>
                      <span className="text-xs font-bold text-slate-800">Cadastro Geral VISA</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/80">
                    Conforme
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Cadastrados</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {indicadores.ind12TotalCadastrados}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">unidades</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Ativos</span>
                    <span className="text-xs font-bold text-emerald-800">{indicadores.ind12Ativos}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Inativos/Baixa</span>
                    <span className="text-xs font-bold text-slate-700">{indicadores.ind12Inativos}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onGoToEstabelecimentos}
                  aria-label="Gerenciar estabelecimentos"
                  className="w-full min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                >
                  <span>Gerenciar estabelecimentos</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* INDICADOR 13: Risco I */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                      <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ind 13</span>
                      <span className="text-xs font-bold text-slate-800">Risco I (Baixo Risco)</span>
                    </div>
                  </div>
                  {indicadores.ind13MetaAtingida ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Meta OK
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Pendente
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Atingido</span>
                    <span className="font-bold text-slate-700 font-mono">Meta: &ge;{metaInd13RiscoI}%</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {indicadores.ind13Percentual.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({indicadores.ind13InspecionadosAno}/{indicadores.ind13TotalRiscoI})
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        indicadores.ind13MetaAtingida ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(indicadores.ind13Percentual, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onGoToEstabelecimentos}
                  aria-label="Filtrar unidades Risco I"
                  className="w-full min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                >
                  <span>Filtrar unidades Risco I</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* INDICADOR 14: Risco II */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-50 text-amber-600 p-2 rounded-xl">
                      <TrendingUp className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ind 14</span>
                      <span className="text-xs font-bold text-slate-800">Risco II (Médio Risco)</span>
                    </div>
                  </div>
                  {indicadores.ind14MetaAtingida ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Meta OK
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Pendente
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Atingido</span>
                    <span className="font-bold text-slate-700 font-mono">Meta: &ge;{metaInd14RiscoII}%</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {indicadores.ind14Percentual.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({indicadores.ind14InspecionadosAno}/{indicadores.ind14TotalRiscoII})
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        indicadores.ind14MetaAtingida ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(indicadores.ind14Percentual, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onGoToEstabelecimentos}
                  aria-label="Filtrar unidades Risco II"
                  className="w-full min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                >
                  <span>Filtrar unidades Risco II</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* INDICADOR 15: Risco III */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                      <AlertTriangle className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ind 15</span>
                      <span className="text-xs font-bold text-slate-800">Risco III (Alto Risco)</span>
                    </div>
                  </div>
                  {indicadores.ind15MetaAtingida ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      100% OK
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      {indicadores.ind15TotalRiscoIII - indicadores.ind15InspecionadosAno} Pendente
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Atingido</span>
                    <span className="font-bold text-rose-700 font-mono">Meta: {metaInd15RiscoIII}%</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {indicadores.ind15Percentual.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({indicadores.ind15InspecionadosAno}/{indicadores.ind15TotalRiscoIII})
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        indicadores.ind15MetaAtingida ? 'bg-emerald-600' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(indicadores.ind15Percentual, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onGoToEstabelecimentos}
                  aria-label="Ver unidades de Alto Risco"
                  className="w-full min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                >
                  <span>Ver unidades de Alto Risco</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* INDICADOR 11: VAPT / Saúde do Trabalhador */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all md:col-span-2">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-teal-50 text-teal-600 p-2 rounded-xl">
                      <HardHat className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ind 11</span>
                      <span className="text-xs font-bold text-slate-800">Saúde do Trabalhador • VAPT</span>
                    </div>
                  </div>
                  {indicadores.ind11MetaAtingida ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Meta OK (&ge;{metaInd11Vapt})
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Falta {Math.max(0, metaInd11Vapt - indicadores.ind11TotalInspecoesAno)}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Vistorias VAPT no Ano</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {indicadores.ind11TotalInspecoesAno}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">inspeções registradas</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                    Meta: &ge;{metaInd11Vapt}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  Fiscais: {nomesFiscaisAtivos}
                </span>
                <button
                  type="button"
                  onClick={onGoToVapt}
                  aria-label="Acessar vistorias e termos VAPT"
                  className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-teal-800 hover:text-teal-950 hover:bg-teal-50 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Acessar VAPT</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* COLUNA DIREITA (~40% / col-span-5): Widget de Ação Rápida / Top Prioridades */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">

            {/* Cabeçalho do Card com Título Oficial, Contador e Botão Toggle */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <CalendarCheck className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                    Fila de Vistoria Prioritária para Metas de 2026
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Top 4 ações recomendadas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  {todasPendencias.length} pendentes
                </span>
                <button
                  type="button"
                  onClick={() => setFilaExpanded(!filaExpanded)}
                  aria-label={filaExpanded ? 'Recolher fila de prioridades' : 'Expandir fila de prioridades'}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  {filaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Conteúdo do Action Widget (Exibe os Top 4 quando expandido) */}
            {filaExpanded && (
              <div className="divide-y divide-slate-100">
                {topPrioridades.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Nenhuma pendência na fila!</p>
                    <p className="text-[11px] text-slate-500">Todos os estabelecimentos prioritários de Risco II e III foram vistoriados em {anoStr}.</p>
                  </div>
                ) : (
                  topPrioridades.map((est) => {
                    const isRisco3 = est.nivelRisco === 'Risco III';
                    return (
                      <div
                        key={est.id}
                        className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono border ${
                                isRisco3
                                  ? 'bg-rose-100 text-rose-900 border-rose-200'
                                  : 'bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              {est.nivelRisco}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate block max-w-[200px] sm:max-w-[240px]">
                              {est.nomeFantasia || est.razaoSocial}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                            <span className="truncate">{est.endereco.bairro}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-600">{getStatusInspecao(est)}</span>
                          </div>
                        </div>

                        {/* Botão sutil de Ação Rápida */}
                        <button
                          type="button"
                          onClick={() => onOpenQuickInspecao(est)}
                          aria-label={`Registrar Inspeção para ${est.razaoSocial}`}
                          className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs active:scale-97 ${
                            isRisco3
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
                          <span>Registrar Inspeção</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Rodapé do Action Widget: Navegação direcionada para a página dedicada */}
            <div className="p-3 bg-slate-50/80 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleNavigateMetas}
                aria-label={`Ver todas as vistorias prioritárias (${todasPendencias.length} pendentes)`}
                className="w-full min-h-[42px] px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 hover:text-slate-950 font-bold text-xs transition duration-150 flex items-center justify-between cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Ver todas as vistorias prioritárias ({todasPendencias.length} pendentes)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
});

DashboardMetas.displayName = 'DashboardMetas';
