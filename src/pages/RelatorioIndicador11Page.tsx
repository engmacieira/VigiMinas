import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  PlusCircle, 
  Printer, 
  Activity, 
  Target, 
  TrendingUp, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Building2, 
  Calendar, 
  UserCheck, 
  Layers, 
  HelpCircle, 
  ExternalLink, 
  Clock, 
  X,
  FileCheck,
  Search,
  ChevronRight
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { InspecaoVapt, Estabelecimento } from '../types/vigiminas';
import { safePrint } from '../utils/printHelper';

interface PorteOpcao {
  id: string;
  label: string;
  faixaTexto: string;
  meta: number;
  cerest?: boolean;
}

const PORTES_DISPONIVEIS: PorteOpcao[] = [
  { id: 'ate_2000', label: 'Até 2.000 hab', faixaTexto: 'Até 2.000 habitantes', meta: 1 },
  { id: '2001_10000', label: '2.001 a 10.000 hab (Braúnas)', faixaTexto: '2.001 a 10.000 habitantes (Padrão Municipal)', meta: 2 },
  { id: '10001_30000', label: '10.001 a 30.000 hab', faixaTexto: '10.001 a 30.000 habitantes', meta: 3 },
  { id: '30001_50000', label: '30.001 a 50.000 hab', faixaTexto: '30.001 a 50.000 habitantes', meta: 4 },
  { id: '50001_100000', label: '50.001 a 100.000 hab', faixaTexto: '50.001 a 100.000 habitantes', meta: 6 },
  { id: 'mais_100000', label: 'Mais de 100.000 hab', faixaTexto: 'Mais de 100.000 habitantes', meta: 8 },
  { id: 'cerest', label: 'Sede de CEREST', faixaTexto: 'Município Sede de CEREST Regional', meta: 16, cerest: true },
];

export const RelatorioIndicador11Page: React.FC = () => {
  const navigate = useNavigate();
  const { 
    inspecoesVapt, 
    estabelecimentos, 
    configuracao, 
    indicadores,
    loading 
  } = useVigiMinas();

  // Porte selecionado para visualização/simulação (padrão de Braúnas: 2.001 a 10.000 hab = 2 inspeções)
  const [porteSelecionadoId, setPorteSelecionadoId] = useState<string>('2001_10000');
  const [termoSelecionadoModal, setTermoSelecionadoModal] = useState<{
    vapt: InspecaoVapt;
    estabelecimento?: Estabelecimento;
  } | null>(null);

  const anoExercicio = configuracao?.exercicioAtivo?.anoExercicio || indicadores?.anoReferencia || 2026;
  const municipioNome = configuracao?.secretaria?.municipio || 'Braúnas';
  const ufSigla = configuracao?.secretaria?.uf || 'MG';

  const porteAtivo = useMemo(() => {
    return PORTES_DISPONIVEIS.find(p => p.id === porteSelecionadoId) || PORTES_DISPONIVEIS[1];
  }, [porteSelecionadoId]);

  // Vistorias VAPT válidas (não deletadas) e filtradas pelo ano de exercício corrente
  const vaptValidasAno = useMemo(() => {
    const anoStr = String(anoExercicio);
    return inspecoesVapt
      .filter(v => !v.isDeleted)
      .filter(v => !v.dataInspecao || v.dataInspecao.startsWith(anoStr))
      .sort((a, b) => (b.dataInspecao || '').localeCompare(a.dataInspecao || ''));
  }, [inspecoesVapt, anoExercicio]);

  // Mapa rápido de estabelecimentos por ID
  const estabelecimentosMap = useMemo(() => {
    const map = new Map<string, Estabelecimento>();
    estabelecimentos.forEach(e => map.set(e.id, e));
    return map;
  }, [estabelecimentos]);

  // Cálculos de Indicador 11
  const metaPrevista = porteAtivo.meta;
  const inspecoesRealizadas = vaptValidasAno.length;
  const percentualAtingido = metaPrevista > 0 ? (inspecoesRealizadas / metaPrevista) * 100 : 0;
  const metaCumprida = percentualAtingido >= 90; // Meta estadual de 90%

  // Projeção de Recurso Financeiro VigiMinas (SES-MG)
  // < 50%: Crítico (40% do recurso) | 50-89%: Alerta/Parcial (80% do recurso) | >= 90%: Meta Atingida (100% garantido)
  const projecaoRecurso = useMemo(() => {
    if (percentualAtingido >= 90) {
      return {
        percentual: 100,
        label: '100% do Recurso Garantido',
        badge: 'Meta Atingida',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barColor: 'bg-emerald-500'
      };
    }
    if (percentualAtingido >= 50) {
      return {
        percentual: 80,
        label: '80% do Recurso (Parcial)',
        badge: 'Faixa de Alerta',
        colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
        barColor: 'bg-amber-500'
      };
    }
    return {
      percentual: inspecoesRealizadas > 0 ? 40 : 0,
      label: inspecoesRealizadas > 0 ? '40% do Recurso (Penalidade)' : '0% - Risco de Perda',
      badge: 'Faixa Crítica',
      colorClass: 'text-rose-800 bg-rose-50 border-rose-200',
      barColor: 'bg-rose-500'
    };
  }, [percentualAtingido, inspecoesRealizadas]);

  // Cálculo de inspeções faltantes para bater a meta mínima de 90%
  const faltamParaMetaMinima = useMemo(() => {
    const minimoObrigatorio = Math.ceil(metaPrevista * 0.9);
    const diferenca = minimoObrigatorio - inspecoesRealizadas;
    return diferenca > 0 ? diferenca : 0;
  }, [metaPrevista, inspecoesRealizadas]);

  const faltamParaMetaIntegral = Math.max(0, metaPrevista - inspecoesRealizadas);

  // Status das obrigações municipais
  const checklistObrigacoes = useMemo(() => {
    return [
      {
        id: 'inspecoes_presenciais',
        titulo: 'Realização de inspeções presenciais com foco em fatores de risco',
        descricao: 'Avaliação in loco de riscos físicos, químicos, biológicos, ergonômicos e mecânicos nos postos de trabalho.',
        status: inspecoesRealizadas >= metaPrevista 
          ? 'concluido' 
          : (inspecoesRealizadas > 0 ? 'em_andamento' : 'pendente'),
        statusTexto: inspecoesRealizadas >= metaPrevista 
          ? `Concluído (${inspecoesRealizadas}/${metaPrevista})` 
          : (inspecoesRealizadas > 0 ? `Em andamento (${inspecoesRealizadas}/${metaPrevista})` : 'Pendente'),
      },
      {
        id: 'relatorios_tecnicos',
        titulo: 'Emissão e arquivamento do Relatório Técnico de Inspeção VAPT em PDF',
        descricao: 'Todos os termos de vistoria lavrados com identificação de riscos, assinaturas dos fiscais e prazos de retorno.',
        status: inspecoesRealizadas > 0 ? 'concluido' : 'pendente',
        statusTexto: inspecoesRealizadas > 0 ? 'Concluído (100% arquivado)' : 'Pendente de emissão',
      },
      {
        id: 'submissao_formulario',
        titulo: 'Submissão dos dados no Formulário Unificado VigiMinas (SES-MG)',
        descricao: 'Prazo final improrrogável fixado pela SES-MG para homologação: 15/01/2027.',
        status: 'em_andamento',
        statusTexto: 'Prazo: 15/01/2027 (Aberto)',
      },
      {
        id: 'sia_sus_dispensa',
        titulo: 'Registro no SIA-SUS ou protocolo de justificativa de dispensa à URS',
        descricao: 'Município de Braúnas não é sede de CEREST; dispensa amparada por ofício à Unidade Regional de Saúde.',
        status: 'concluido',
        statusTexto: 'Concluído (Dispensa GRS/URS)',
      },
    ];
  }, [inspecoesRealizadas, metaPrevista]);

  const handlePrint = () => {
    safePrint();
  };

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return '-';
    try {
      const [ano, mes, dia] = dataIso.split('-');
      if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
      return dataIso;
    } catch {
      return dataIso;
    }
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      
      {/* ============================================================== */}
      {/* CABEÇALHO OFICIAL DE IMPRESSÃO (VISÍVEL APENAS NA IMPRESSÃO)   */}
      {/* ============================================================== */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Estado de Minas Gerais • Secretaria de Estado de Saúde (SES-MG)
            </p>
            <h1 className="text-lg font-black uppercase text-slate-900">
              Prefeitura Municipal de {municipioNome} / {ufSigla}
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Secretaria Municipal de Saúde • Departamento de Vigilância Sanitária e Ambiental
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-300 px-2 py-1 rounded">
              PROGRAMA VIGIMINAS {anoExercicio}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Emissão: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-700 font-mono">
          <span>Relatório de Desempenho e Auditoria: <strong>Indicador 11 (VAPT)</strong></span>
          <span>Regulamentação: <strong>Resolução SES/MG nº 10.917/2026</strong></span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CABEÇALHO EXECUTIVO (TELA)                                  */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm print:hidden">
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {/* Tag Institucional e Porte */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                VigiMinas • Saúde do Trabalhador
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Exercício {anoExercicio}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium">
                {municipioNome}/{ufSigla}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-teal-400 shrink-0" strokeWidth={2.2} />
              Relatório de Desempenho - Indicador 11 (VAPT)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Vigilância em Ambientes e Processos de Trabalho | Resolução SES/MG nº 10.917/2026 e Instrutivo Oficial do VigiMinas.
            </p>

            {/* Porte Informativo Interativo */}
            <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px]">Enquadramento Municipal:</span>
              <div className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-lg">
                <span className="font-semibold text-teal-300">{porteAtivo.faixaTexto}</span>
                <span className="text-slate-500">|</span>
                <span className="font-mono text-slate-200">Meta: <strong>{porteAtivo.meta} {porteAtivo.meta === 1 ? 'inspeção' : 'inspeções'}</strong></span>
              </div>

              {/* Seletor de Simulação de Porte */}
              <select
                value={porteSelecionadoId}
                onChange={(e) => setPorteSelecionadoId(e.target.value)}
                className="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-teal-500 cursor-pointer"
                title="Simular enquadramento em outro porte populacional"
              >
                {PORTES_DISPONIVEIS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    Simular: {p.label} (Meta: {p.meta})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões de Ação no Topo */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              to="/relatorios"
              className="min-h-[40px] px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Voltar para Relatórios</span>
            </Link>

            <Link
              to="/saude-trabalhador"
              className="min-h-[40px] px-3.5 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Nova Inspeção</span>
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[40px] px-3.5 rounded-lg bg-slate-100 hover:bg-white active:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 1: CARDS DE INDICADORES E TERMÔMETRO DE METAS (KPIS)     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Meta Prevista */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Meta Prevista
              </span>
              <Target className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                {metaPrevista}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {metaPrevista === 1 ? 'inspeção anual' : 'inspeções anuais'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>População: {porteAtivo.label}</span>
            <span className="font-semibold text-teal-700">Res. 10.917</span>
          </div>
        </div>

        {/* Card 2: Inspeções Realizadas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Inspeções Realizadas
              </span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                {inspecoesRealizadas}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {inspecoesRealizadas === 1 ? 'vistoria válida' : 'vistorias válidas'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Ano Base {anoExercicio}</span>
            <span className={inspecoesRealizadas >= metaPrevista ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
              {inspecoesRealizadas >= metaPrevista ? 'Meta Alcançada' : `Faltam ${faltamParaMetaIntegral}`}
            </span>
          </div>
        </div>

        {/* Card 3: Percentual Atingido */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Percentual Atingido
              </span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                {percentualAtingido.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                da pactuação
              </span>
            </div>
            {/* Barra de Progresso Colorida */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden border border-slate-200">
              <div 
                className={`h-full transition-all duration-500 ${
                  percentualAtingido >= 90 
                    ? 'bg-emerald-500' 
                    : (percentualAtingido >= 50 ? 'bg-amber-500' : 'bg-rose-500')
                }`}
                style={{ width: `${Math.min(100, percentualAtingido)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Mínimo SES: 90%</span>
            <span className={`font-bold ${
              percentualAtingido >= 90 ? 'text-emerald-700' : (percentualAtingido >= 50 ? 'text-amber-700' : 'text-rose-700')
            }`}>
              {percentualAtingido >= 90 ? 'Aprovado' : (percentualAtingido >= 50 ? 'Parcial' : 'Crítico')}
            </span>
          </div>
        </div>

        {/* Card 4: Projeção de Recurso */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Projeção de Recurso VigiMinas
              </span>
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                {projecaoRecurso.percentual}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                do repasse
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              {projecaoRecurso.label}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Incentivo VigiMinas</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${projecaoRecurso.colorClass}`}>
              {projecaoRecurso.badge}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 2: PAINEL INFORMATIVO "O QUE FALTA PARA BATER A META"     */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              O Que Falta para Bater a Meta
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Instrutivo SES/MG nº 10.917/2026
          </span>
        </div>

        {/* Banner de Alerta / Sucesso em Destaque */}
        {metaCumprida ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 flex items-start gap-3.5 text-emerald-900 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-950">
                Parabéns! O município já atingiu a meta regulamentar do Indicador 11.
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Foram concluídas <strong>{inspecoesRealizadas} de {metaPrevista}</strong> inspeções previstas para o porte populacional de {municipioNome} ({percentualAtingido.toFixed(0)}% da pactuação), garantindo a projeção de <strong>100% dos recursos de custeio</strong> do programa para a Saúde do Trabalhador.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 flex items-start gap-3.5 text-amber-950 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950">
                Atenção: Faltam {faltamParaMetaMinima} {faltamParaMetaMinima === 1 ? 'inspeção' : 'inspeções'} para atingir a meta mínima de 90% da SES-MG até 31/12/{anoExercicio}.
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                O município realizou <strong>{inspecoesRealizadas} de {metaPrevista}</strong> inspeções pactuadas ({percentualAtingido.toFixed(0)}%). Para atingir o mínimo estadual de 90% e assegurar a totalidade dos repasses financeiros, é necessário concluir e relatar ao menos mais <strong>{faltamParaMetaMinima} {faltamParaMetaMinima === 1 ? 'inspeção' : 'inspeções'}</strong> em ambientes com riscos ocupacionais identificados.
              </p>
            </div>
          </div>
        )}

        {/* Checklist de Obrigações do Município */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs print:border-slate-300">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                Checklist de Obrigações do Município (Resolução SES/MG nº 10.917/2026)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Auditoria de Conformidade
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {checklistObrigacoes.map((item, index) => {
              const isConcluido = item.status === 'concluido';
              const isAndamento = item.status === 'em_andamento';

              return (
                <div key={item.id} className="p-4 sm:px-5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                        {item.titulo}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {item.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isConcluido && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {item.statusTexto}
                      </span>
                    )}
                    {isAndamento && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {item.statusTexto}
                      </span>
                    )}
                    {!isConcluido && !isAndamento && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        {item.statusTexto}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 3: TABELA ANALÍTICA DE AÇÕES DE VAPT REALIZADAS          */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs print:border-slate-300">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Tabela Analítica de Ações de VAPT Realizadas ({vaptValidasAno.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Relação de termos técnicos lavrados em ambientes e processos de trabalho em {anoExercicio}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <span className="text-xs text-slate-500 font-mono">
              Total Válidas: <strong>{vaptValidasAno.length}</strong>
            </span>
          </div>
        </div>

        {vaptValidasAno.length === 0 ? (
          /* Empty State Amigável com Botão Direto para Registrar */
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center mx-auto">
              <Activity className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                Nenhuma inspeção de VAPT registrada em {anoExercicio}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Para cumprir o Indicador 11 da Resolução SES/MG nº 10.917/2026, realize e cadastre vistorias em empresas com ambientes de trabalho expostos a fatores de risco.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/saude-trabalhador"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registrar Primeira Inspeção</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Estabelecimento / Razão Social</th>
                  <th className="py-3 px-4">CNAE / Atividade</th>
                  <th className="py-3 px-4">Riscos Ocupacionais Identificados</th>
                  <th className="py-3 px-4 text-center">SINAN</th>
                  <th className="py-3 px-4 text-center">Relatório Técnico</th>
                  <th className="py-3 px-4 text-right">Status de Envio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vaptValidasAno.map((vapt) => {
                  const est = estabelecimentosMap.get(vapt.estabelecimentoId);
                  const razaoSocial = est?.razaoSocial || vapt.nomeLocalTrabalho;
                  const cnae = est?.cnaeCodigo 
                    ? `${est.cnaeCodigo} - ${est.cnaeDescricao || ''}` 
                    : 'Atividade cadastrada na ficha do estabelecimento';
                  
                  // Detecção de vínculo SINAN (número de notificação, menção ou não houve)
                  const sinanProp = (vapt as unknown as Record<string, unknown>).notificacaoSinan || 
                                    (vapt as unknown as Record<string, unknown>).numeroNotificacaoSinan;
                  const sinanTexto = typeof sinanProp === 'string' && sinanProp.trim()
                    ? sinanProp.trim()
                    : (vapt.principaisRiscosIdentificados?.toLowerCase().includes('sinan') ? 'Vinculada' : 'Não houve');

                  return (
                    <tr key={vapt.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Data da Inspeção */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {formatarData(vapt.dataInspecao)}
                      </td>

                      {/* Estabelecimento / Razão Social */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {razaoSocial}
                        </div>
                        {est?.nomeFantasia && (
                          <div className="text-[11px] text-slate-500 font-normal">
                            {est.nomeFantasia}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {vapt.nomeLocalTrabalho}
                        </div>
                      </td>

                      {/* CNAE / Ramo de Atividade */}
                      <td className="py-3 px-4 max-w-xs text-slate-600">
                        <span className="line-clamp-2 text-xs" title={cnae}>
                          {cnae}
                        </span>
                      </td>

                      {/* Riscos Ocupacionais Identificados */}
                      <td className="py-3 px-4 max-w-sm text-slate-700">
                        <p className="line-clamp-2 text-xs leading-relaxed" title={vapt.principaisRiscosIdentificados}>
                          {vapt.principaisRiscosIdentificados || 'Fatores físicos e de segurança avaliados'}
                        </p>
                        {vapt.fiscaisResponsaveis?.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            Fiscais: {vapt.fiscaisResponsaveis.join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Notificação SINAN Vinculada */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {sinanTexto}
                        </span>
                      </td>

                      {/* Relatório Técnico */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setTermoSelecionadoModal({ vapt, estabelecimento: est })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                          title="Visualizar Termo de Notificação e Inspeção VAPT"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>{vapt.numeroRelatorioTermo}</span>
                        </button>
                      </td>

                      {/* Status de Envio (SES-MG e SIA-SUS) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Formulário SES-MG
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            SIA-SUS: Dispensa URS
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. NOTAS TÉCNICAS E RODAPÉ DE AUDITORIA                        */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2.5 print:border-slate-300">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          Notas Técnicas de Auditoria Sanitária (Indicador 11):
        </h4>
        <p className="leading-relaxed">
          1. <strong>Regra de Pactuação:</strong> Em conformidade com a Resolução SES/MG nº 10.917/2026, municípios de porte 2.001 a 10.000 habitantes devem realizar no mínimo <strong>2 inspeções anuais</strong> em ambientes de trabalho (VAPT). O atingimento de 90% ou mais da meta assegura 100% do repasse financeiro estadual.
        </p>
        <p className="leading-relaxed">
          2. <strong>Fatores de Risco Investigados:</strong> Todas as vistorias catalogadas abrangem investigação ativa dos cinco grupos de riscos ocupacionais (físicos, químicos, biológicos, ergonômicos e mecânicos/acidentes).
        </p>
        <p className="leading-relaxed">
          3. <strong>SIA-SUS e CEREST:</strong> Por não ser sede de Centro de Referência em Saúde do Trabalhador (CEREST), o município cumpre a obrigação administrativa mediante envio de ofício técnico à respectiva Unidade Regional de Saúde (GRS/SRS).
        </p>
        
        {/* Rodapé Institucional */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2 font-mono">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            Corpo Fiscal: {configuracao?.fiscais?.filter(f => f.ativo && !f.isDeleted).map(f => f.nome).join(', ') || 'Lucas Silveira, Matheus Oliveira, Edmila Ferreira'}
          </span>
          <span>
            VigiMinas • Exercício {anoExercicio} • {new Date().toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CAMPO DE ASSINATURA NA FOLHA DE IMPRESSÃO                      */}
      {/* ============================================================== */}
      <div className="hidden print:block pt-12 mt-8 border-t border-slate-400">
        <div className="grid grid-cols-2 gap-12 text-center text-xs text-slate-800">
          <div>
            <div className="border-t border-slate-800 pt-1.5 font-bold">
              Coordenação de Vigilância Sanitária
            </div>
            <div className="text-[11px] text-slate-600">
              {configuracao?.secretaria?.coordenadorVisa || 'Matheus Henrique Macieira'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Secretaria Municipal de Saúde de {municipioNome}/{ufSigla}
            </div>
          </div>
          <div>
            <div className="border-t border-slate-800 pt-1.5 font-bold">
              Fiscal Sanitário Responsável (VAPT)
            </div>
            <div className="text-[11px] text-slate-600">
              {configuracao?.fiscais?.find(f => f.ativo)?.nome || 'Lucas Silveira'} (Matrícula VISA)
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Comissão de Saúde do Trabalhador
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL DE DETALHES DO TERMO DE INSPEÇÃO VAPT                     */}
      {/* ============================================================== */}
      {termoSelecionadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Dossiê da Inspeção - {termoSelecionadoModal.vapt.numeroRelatorioTermo}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Data da Realização: {formatarData(termoSelecionadoModal.vapt.dataInspecao)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTermoSelecionadoModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Identificação do Local */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Estabelecimento / Local de Trabalho
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {termoSelecionadoModal.estabelecimento?.razaoSocial || termoSelecionadoModal.vapt.nomeLocalTrabalho}
                </p>
                {termoSelecionadoModal.estabelecimento && (
                  <p className="text-xs text-slate-600">
                    CNPJ: <span className="font-mono">{termoSelecionadoModal.estabelecimento.cnpjCpf}</span> • CNAE: {termoSelecionadoModal.estabelecimento.cnaeCodigo} - {termoSelecionadoModal.estabelecimento.cnaeDescricao}
                  </p>
                )}
                <p className="text-xs text-slate-500 font-mono">
                  Setor vistoriado: {termoSelecionadoModal.vapt.nomeLocalTrabalho}
                </p>
              </div>

              {/* Riscos Ocupacionais */}
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-900 tracking-wide block mb-1">
                  Principais Fatores de Risco Identificados
                </span>
                <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/80 text-rose-950 leading-relaxed">
                  {termoSelecionadoModal.vapt.principaisRiscosIdentificados || 'Nenhum risco crítico anotado.'}
                </div>
              </div>

              {/* Recomendações e Orientações Técnicas */}
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-900 tracking-wide block mb-1">
                  Recomendações e Medidas de Proteção Notificadas
                </span>
                <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-200/80 text-teal-950 leading-relaxed whitespace-pre-line">
                  {termoSelecionadoModal.vapt.recomendacoesOrientacoes || 'Orientações sanitárias verbais prestadas no ato.'}
                </div>
              </div>

              {/* Equipe Fiscal e Prazo */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Fiscais Responsáveis:</span>
                  <span className="font-semibold text-slate-900">
                    {termoSelecionadoModal.vapt.fiscaisResponsaveis?.join(', ') || 'Fiscal Técnico'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Prazo de Adequação Legal:</span>
                  <span className="font-semibold text-slate-900">
                    {termoSelecionadoModal.vapt.prazoAdequacaoDias ? `${termoSelecionadoModal.vapt.prazoAdequacaoDias} dias corridos` : 'Imediato / Não aplicável'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Status: <strong>{termoSelecionadoModal.vapt.statusInspecao}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTermoSelecionadoModal(null);
                    safePrint();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTermoSelecionadoModal(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RelatorioIndicador11Page;
