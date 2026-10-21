import React from 'react';
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
  PlusCircle
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
}

export const DashboardMetas: React.FC<DashboardMetasProps> = ({
  indicadores,
  estabelecimentos,
  onExportExcel,
  onOpenQuickInspecao,
  onGoToEstabelecimentos,
  onGoToVapt
}) => {
  const { configuracao } = useVigiMinas();
  const anoStr = String(configuracao.exercicioAtivo.anoExercicio || indicadores.anoReferencia);
  const { metaInd11Vapt, metaInd13RiscoI, metaInd14RiscoII, metaInd15RiscoIII } = configuracao.exercicioAtivo;

  // Estabelecimentos que exigem ação prioritária para fechar metas do exercício ativo
  const pendentesRiscoIII = estabelecimentos.filter(e => 
    e.situacaoEstabelecimento === 'Ativo' && 
    e.nivelRisco === 'Risco III' &&
    (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr))
  );

  const pendentesRiscoII = estabelecimentos.filter(e => 
    e.situacaoEstabelecimento === 'Ativo' && 
    e.nivelRisco === 'Risco II' &&
    (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr))
  );

  const totalMetasConformes = [
    indicadores.ind11MetaAtingida,
    true, // Indicador 12 cadastro ativo
    indicadores.ind13MetaAtingida,
    indicadores.ind14MetaAtingida,
    indicadores.ind15MetaAtingida
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      
      {/* Faixa de Status Executivo do Município */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
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
            <strong className="text-emerald-400 ml-1">
              {totalMetasConformes === 5 
                ? 'Conformidade plena: 5 de 5 metas atingidas.' 
                : `${totalMetasConformes} de 5 metas em conformidade.`}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onExportExcel}
            className="min-h-[44px] px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition duration-150 ease-out flex items-center gap-2 cursor-pointer shadow-xs active:scale-97"
          >
            <FileSpreadsheet className="w-4 h-4" strokeWidth={2} />
            <span>Exportar Planilha Oficial (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Grid Operacional dos 5 Indicadores VigiMinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* INDICADOR 12 */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-slate-300 transition duration-150">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                  12
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Cadastro Geral VISA
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                Conforme
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-500 font-medium block">Total de Estabelecimentos</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {indicadores.ind12TotalCadastrados}
                </span>
                <span className="text-xs text-slate-500 font-medium">cadastros registrados</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Ativos Regulares</span>
                <span className="text-sm font-bold text-emerald-800 mt-0.5 block">
                  {indicadores.ind12Ativos} unidades
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Baixados / Histórico</span>
                <span className="text-sm font-bold text-slate-700 mt-0.5 block">
                  {indicadores.ind12Inativos} unidades
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Preservação obrigatória de baixas com data formatada para a série histórica da SES/MG.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={onGoToEstabelecimentos}
              className="w-full min-h-[44px] px-3 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
            >
              <span>Gerenciar estabelecimentos</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* INDICADOR 13: Risco I */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-slate-300 transition duration-150">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  13
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Risco I (Baixo Risco)
                </span>
              </div>
              {indicadores.ind13MetaAtingida ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Meta Atingida
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Pendente
                </span>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Inspecionados em {anoStr}</span>
                <span className="text-xs font-bold text-slate-700 font-mono">Meta SES: &ge; {metaInd13RiscoI}%</span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {indicadores.ind13Percentual.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({indicadores.ind13InspecionadosAno} de {indicadores.ind13TotalRiscoI} ativos)
                </span>
              </div>
            </div>

            {/* Barra de Progresso com Meta Visível */}
            <div className="mt-4 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    indicadores.ind13MetaAtingida ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(indicadores.ind13Percentual, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>0%</span>
                <span className="font-bold text-slate-700">{metaInd13RiscoI}% (Alvo)</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Atividades dispensadas de alvará prévio fiscalizadas por amostragem.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={onGoToEstabelecimentos}
              className="w-full min-h-[44px] px-3 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
            >
              <span>Filtrar unidades Risco I</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* INDICADOR 14: Risco II */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-slate-300 transition duration-150">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                  14
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Risco II (Médio Risco)
                </span>
              </div>
              {indicadores.ind14MetaAtingida ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Meta Atingida
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Pendente
                </span>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Inspecionados em {anoStr}</span>
                <span className="text-xs font-bold text-slate-700 font-mono">Meta SES: &ge; {metaInd14RiscoII}%</span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {indicadores.ind14Percentual.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({indicadores.ind14InspecionadosAno} de {indicadores.ind14TotalRiscoII} ativos)
                </span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mt-4 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    indicadores.ind14MetaAtingida ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(indicadores.ind14Percentual, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>0%</span>
                <span className="font-bold text-slate-700">{metaInd14RiscoII}% (Alvo)</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Farmácias, padarias, açougues e supermercados que exigem alvará regular.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={onGoToEstabelecimentos}
              className="w-full min-h-[44px] px-3 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
            >
              <span>Filtrar unidades Risco II</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* INDICADOR 15: Risco III */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-slate-300 transition duration-150">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-rose-50 text-rose-800 flex items-center justify-center font-bold text-xs">
                  15
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Risco III (Alto Risco)
                </span>
              </div>
              {indicadores.ind15MetaAtingida ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {metaInd15RiscoIII}% Atingido
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  {indicadores.ind15TotalRiscoIII - indicadores.ind15InspecionadosAno} Pendente(s)
                </span>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Inspecionados em {anoStr}</span>
                <span className="text-xs font-bold text-rose-700 font-mono">Meta SES: {metaInd15RiscoIII}%</span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {indicadores.ind15Percentual.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({indicadores.ind15InspecionadosAno} de {indicadores.ind15TotalRiscoIII} ativos)
                </span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mt-4 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    indicadores.ind15MetaAtingida ? 'bg-emerald-600' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(indicadores.ind15Percentual, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>0%</span>
                <span className="font-bold text-rose-700">100% (Obrigatória)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Clínicas odontológicas com cirurgia, queijarias industriais e ILPI/asilos.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={onGoToEstabelecimentos}
              className="w-full min-h-[44px] px-3 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
            >
              <span>Ver unidades de Alto Risco</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* INDICADOR 11: VAPT / Saúde do Trabalhador */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-slate-300 transition duration-150 md:col-span-2 lg:col-span-2">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  11
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Saúde do Trabalhador • VAPT
                </span>
              </div>
              {indicadores.ind11MetaAtingida ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Meta Cumprida (&ge; {metaInd11Vapt} vistorias)
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Falta {Math.max(0, metaInd11Vapt - indicadores.ind11TotalInspecoesAno)} vistoria(s)
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <span className="text-xs text-slate-500 font-medium">Vistorias em Ambientes e Processos de Trabalho</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {indicadores.ind11TotalInspecoesAno}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">inspeções formais registradas em {anoStr}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 self-start sm:self-auto">
                Meta Mínima: &ge; {metaInd11Vapt} vistorias
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Fiscalização de fatores de risco ocupacionais (físicos, químicos, biológicos, ergonômicos e mecânicos) com emissão formal do Termo Oficial de Notificação para os postos de trabalho de Braúnas/MG.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Equipe ativa: {configuracao.fiscais.filter(f => f.ativo).map(f => f.nome).join(', ')}
            </span>
            <button
              onClick={onGoToVapt}
              className="min-h-[44px] px-3.5 rounded-lg text-xs font-semibold text-teal-800 hover:text-teal-950 hover:bg-teal-50/80 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Acessar vistorias e termos</span>
              <ArrowRight className="w-4 h-4 text-teal-600" />
            </button>
          </div>
        </div>

      </div>

      {/* Tabela de Prioridades Sanitárias: Zero Card-ception, design tabular limpo */}
      {(pendentesRiscoIII.length > 0 || pendentesRiscoII.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
          
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-700" strokeWidth={2.2} />
              <h3 className="text-sm font-bold text-slate-900">
                Fila de Vistoria Prioritária para Metas de 2026
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500 font-mono">
              {pendentesRiscoIII.length + pendentesRiscoII.length} unidades pendentes
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Lista de Risco III pendentes */}
            {pendentesRiscoIII.map((est) => (
              <div 
                key={est.id} 
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-200 font-mono">
                      Risco III • Meta 100%
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {est.razaoSocial}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {est.cnaeDescricao} • {est.endereco.bairro}
                  </p>
                </div>

                <button
                  onClick={() => onOpenQuickInspecao(est)}
                  className="min-h-[44px] px-3.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition duration-150 ease-out flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-97 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" strokeWidth={2} />
                  <span>Registrar Inspeção</span>
                </button>
              </div>
            ))}

            {/* Lista de Risco II pendentes */}
            {pendentesRiscoII.slice(0, 4).map((est) => (
              <div 
                key={est.id} 
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-mono">
                      Risco II • Meta &ge; 90%
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {est.razaoSocial}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Alvará: <strong className="text-slate-700">{est.situacaoAlvara}</strong> • {est.endereco.bairro}
                  </p>
                </div>

                <button
                  onClick={() => onOpenQuickInspecao(est)}
                  className="min-h-[44px] px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition duration-150 ease-out flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" strokeWidth={2} />
                  <span>Registrar Inspeção</span>
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
