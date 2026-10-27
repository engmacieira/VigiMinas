import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  ArrowLeft, 
  PlusCircle, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Calendar, 
  Search, 
  Clock, 
  CalendarCheck, 
  DollarSign, 
  Percent, 
  AlertCircle, 
  Flame, 
  X,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { Estabelecimento } from '../types/vigiminas';
import { RegistrarInspecaoModal } from '../components/RegistrarInspecaoModal';
import { safePrint } from '../utils/printHelper';

export const RelatorioIndicador15Page: React.FC = () => {
  const navigate = useNavigate();
  const { 
    estabelecimentos = [], 
    configuracao, 
    indicadores,
    executarInspecaoRapida 
  } = useVigiMinas();

  // Estados locais
  const [abaAtiva, setAbaAtiva] = useState<'inspecionados' | 'pendentes'>('pendentes');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalInspecaoOpen, setModalInspecaoOpen] = useState(false);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<Estabelecimento | null>(null);

  const anoExercicio = configuracao?.exercicioAtivo?.anoExercicio || indicadores?.anoReferencia || 2026;
  const anoStr = String(anoExercicio);
  const municipioNome = configuracao?.secretaria?.municipio || 'Braúnas';
  const ufSigla = configuracao?.secretaria?.uf || 'MG';
  const coordenadorVisa = configuracao?.secretaria?.coordenadorVisa || 'Matheus Henrique Macieira';

  // Base de Risco III ativa/válida (desconsiderando soft deletes)
  const baseRiscoIII = useMemo(() => {
    return estabelecimentos
      .filter(e => !e.isDeleted)
      .filter(e => e.nivelRisco === 'Risco III')
      .filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso');
  }, [estabelecimentos]);

  // Total de Risco III cadastrados
  const totalCadastradosRiscoIII = baseRiscoIII.length;

  // Inspeções de Risco III realizadas no ano corrente de exercício
  const inspecionadosRiscoIII = useMemo(() => {
    return baseRiscoIII.filter(e => 
      (e.dataUltimaInspecaoInicio && e.dataUltimaInspecaoInicio.startsWith(anoStr)) ||
      (e.dataUltimaInspecaoFim && e.dataUltimaInspecaoFim.startsWith(anoStr))
    );
  }, [baseRiscoIII, anoStr]);

  // Pendências de inspeção em Risco III
  const pendentesRiscoIII = useMemo(() => {
    return baseRiscoIII.filter(e => 
      (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr)) &&
      (!e.dataUltimaInspecaoFim || !e.dataUltimaInspecaoFim.startsWith(anoStr))
    );
  }, [baseRiscoIII, anoStr]);

  const totalInspecionados = inspecionadosRiscoIII.length;
  const totalPendentes = pendentesRiscoIII.length;

  // Meta Oficial SES-MG: 100% Mandatória
  const metaPercentual = 100;
  const coberturaPercentual = totalCadastradosRiscoIII > 0 
    ? (totalInspecionados / totalCadastradosRiscoIII) * 100 
    : 100;
  
  const metaAtingida = coberturaPercentual >= 100;

  // Quantas inspeções ainda faltam para atingir 100%
  const totalFaltante = Math.max(0, totalCadastradosRiscoIII - totalInspecionados);

  // Estimativa de ritmo mensal sugerido até dezembro de 2026
  const ritmoSugerido = useMemo(() => {
    if (totalFaltante <= 0) return 0;
    const mesAtual = new Date().getMonth(); // 0 a 11
    const mesesRestantes = Math.max(1, 12 - mesAtual);
    return Math.max(1, Math.ceil(totalFaltante / mesesRestantes));
  }, [totalFaltante]);

  // Tabela Estrita de Repasse SES-MG para Alto Risco (Resolução SES/MG nº 10.917/2026)
  // < 20%: 0% do recurso (corte total abaixo de 20%)
  // >= 20% e < 30%: 20%
  // ...
  // >= 90% e < 100%: 90%
  // = 100%: 100% do recurso garantido
  const repasseFinanceiro = useMemo(() => {
    if (totalCadastradosRiscoIII === 0) {
      return {
        percentual: 100,
        faixaLabel: '100% do Recurso Garantido',
        subtitulo: 'Sem estabelecimentos de Risco III',
        status: 'integral' as const,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        cardBorder: 'border-emerald-400',
        corte: 0,
      };
    }

    if (coberturaPercentual >= 100) {
      return {
        percentual: 100,
        faixaLabel: '100% do Recurso Garantido',
        subtitulo: 'Meta Plena Atingida (100%)',
        status: 'integral' as const,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        cardBorder: 'border-emerald-400',
        corte: 0,
      };
    }

    if (coberturaPercentual < 20) {
      return {
        percentual: 0,
        faixaLabel: '0% do Recurso (Perda Total)',
        subtitulo: 'Crítico: Cobertura < 20%',
        status: 'critico' as const,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        cardBorder: 'border-rose-400',
        corte: 100,
      };
    }

    const faixa = Math.floor(coberturaPercentual / 10) * 10;
    const corte = 100 - faixa;
    const isAlerta = faixa >= 70;

    return {
      percentual: faixa,
      faixaLabel: `${faixa}% do Recurso`,
      subtitulo: `Faixa de ${faixa}% a ${faixa + 9.9}%`,
      status: isAlerta ? ('alerta' as const) : ('critico' as const),
      badgeClass: isAlerta 
        ? 'bg-amber-100 text-amber-900 border-amber-300' 
        : 'bg-orange-100 text-orange-900 border-orange-300',
      cardBorder: isAlerta ? 'border-amber-400' : 'border-orange-400',
      corte,
    };
  }, [coberturaPercentual, totalCadastradosRiscoIII]);

  // Contagem de pendentes com alvará vencido ou sem alvará
  const pendentesAlvaraCritico = useMemo(() => {
    return pendentesRiscoIII.filter(e => 
      e.situacaoAlvara === 'Vencido' || e.situacaoAlvara === 'Não Possui (Irregular)'
    ).length;
  }, [pendentesRiscoIII]);

  // Filtragem da lista da aba ativa por busca
  const listaExibicao = useMemo(() => {
    const base = abaAtiva === 'inspecionados' ? inspecionadosRiscoIII : pendentesRiscoIII;
    if (!searchTerm.trim()) return base;
    const termo = searchTerm.toLowerCase();
    return base.filter(est => 
      est.razaoSocial.toLowerCase().includes(termo) ||
      (est.nomeFantasia && est.nomeFantasia.toLowerCase().includes(termo)) ||
      (est.cnpj && est.cnpj.toLowerCase().includes(termo)) ||
      (est.cnpjCpf && est.cnpjCpf.toLowerCase().includes(termo)) ||
      (est.endereco?.bairro && est.endereco.bairro.toLowerCase().includes(termo)) ||
      (est.endereco?.logradouro && est.endereco.logradouro.toLowerCase().includes(termo)) ||
      (est.cnaeCodigo && est.cnaeCodigo.toLowerCase().includes(termo))
    );
  }, [abaAtiva, inspecionadosRiscoIII, pendentesRiscoIII, searchTerm]);

  const handleOpenRegistrar = (est: Estabelecimento) => {
    setEstabelecimentoSelecionado(est);
    setModalInspecaoOpen(true);
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
    setModalInspecaoOpen(false);
  };

  const handleImprimir = () => {
    safePrint();
  };

  // Helper para badge de alvará
  const getBadgeAlvara = (situacao: string) => {
    switch (situacao) {
      case 'Válido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Válido
          </span>
        );
      case 'Vencido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Vencido
          </span>
        );
      case 'Isento/Dispensado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Isento
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Irregular
          </span>
        );
    }
  };

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return 'Não realizada';
    const [ano, mes, dia] = dataStr.split('-');
    if (ano && mes && dia) {
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* ============================================================== */}
      {/* CABEÇALHO OFICIAL DE IMPRESSÃO (Visível apenas em print)        */}
      {/* ============================================================== */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              ESTADO DE MINAS GERAIS • SECRETARIA MUNICIPAL DE SAÚDE • SETOR DE VIGILÂNCIA SANITÁRIA
            </p>
            <h1 className="text-lg font-black uppercase text-slate-900">
              Prefeitura Municipal de {municipioNome} / {ufSigla}
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Relatório Executivo e Operacional - Indicador 15 (Fiscalização em Estabelecimentos de Risco III - Alto Risco)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-300 px-2 py-1 rounded">
              PROGRAMA VIGIMINAS {anoExercicio}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-700 font-mono">
          <span>Meta Estadual Mandatória: <strong>100% da Base de Alto Risco III</strong></span>
          <span>Regulamentação: <strong>Resolução SES/MG nº 10.917/2026</strong></span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CABEÇALHO EXECUTIVO INSTITUCIONAL                           */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm print:hidden">
        {/* Glows decorativos */}
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800/80">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                VigiMinas • Fiscalização Alto Risco
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Exercício {anoExercicio}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium">
                Município: {municipioNome} / {ufSigla}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-[11px] font-semibold text-rose-300 bg-rose-900/40 px-2 py-0.5 rounded border border-rose-700/50">
                Porte 2 a 10 mil hab
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Flame className="w-6 h-6 text-rose-400 shrink-0" strokeWidth={2.2} />
              Relatório de Fiscalização - Indicador 15 (Alto Risco III)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Inspeções Sanitárias em Estabelecimentos de Risco Crítico | Meta Estadual: 100% (Resolução SES/MG nº 10.917/2026).
            </p>
          </div>

          {/* Barra de Ações Rápidas no Topo */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              to="/relatorios"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Relatórios
            </Link>

            <Link
              to="/estabelecimentos"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Nova Inspeção
            </Link>

            <button
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Imprimir ou Salvar PDF oficial"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BLOCO 1: KPIS E TERMÔMETRO DE 100% DA META                   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Base de Alto Risco (III) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Base de Alto Risco (III)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalCadastradosRiscoIII}
            </span>
            <span className="text-xs text-slate-500 font-medium">estabelecimentos</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Empresas sob controle sanitário de Risco Crítico.
          </p>
        </div>

        {/* Card 2: Inspeções Realizadas no Exercício */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Inspeções Realizadas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              {totalInspecionados}
            </span>
            <span className="text-xs font-medium text-slate-500">
              de {totalCadastradosRiscoIII} ({totalPendentes} pendentes)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-2">
            <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Ano de Referência: <strong>{anoExercicio}</strong></span>
          </div>
        </div>

        {/* Card 3: Cobertura Sanitária (%) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Cobertura Sanitária (%)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${metaAtingida ? 'text-emerald-700' : 'text-rose-700'}`}>
              {coberturaPercentual.toFixed(1)}%
            </span>
            <span className="text-xs font-bold text-slate-500">Meta: 100%</span>
          </div>

          {/* Barra de Progresso com Meta de 100% */}
          <div className="mt-2.5 relative">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  metaAtingida ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, coberturaPercentual))}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
            <span>0%</span>
            <span className="font-bold text-slate-700">Meta Mandatória: 100%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Card 4: Previsão de Repasse Financeiro (Tabela Estrita) */}
        <div className={`bg-white border-2 ${repasseFinanceiro.cardBorder} rounded-xl p-5 shadow-sm`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Previsão de Repasse Financeiro</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-black border ${repasseFinanceiro.badgeClass}`}>
              {repasseFinanceiro.faixaLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium">
            {metaAtingida ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% do recurso garantido para 2027
              </span>
            ) : (
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Risco de corte de {repasseFinanceiro.corte}% do recurso
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BLOCO 2: PAINEL "DIAGNÓSTICO DE ALTO RISCO: O QUE FALTA"     */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-rose-100 text-rose-700">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Diagnóstico de Alto Risco: O Que Falta para a Meta 100%
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Plano de ação municipal para blindagem sanitária e garantia do repasse estadual (Resolução SES/MG nº 10.917/2026).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 shrink-0">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Prazo fatal de envio: 15/01/2027</span>
          </div>
        </div>

        {/* Card Dinâmico de Criticidade */}
        {metaAtingida ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-bold text-emerald-900">
                Parabéns! 100% dos estabelecimentos de Risco III foram inspecionados. Risco sanitário controlado e repasse integral assegurado.
              </p>
              <p className="text-emerald-800 leading-relaxed text-xs">
                O município de {municipioNome} completou todas as <strong>{totalInspecionados} de {totalCadastradosRiscoIII}</strong> inspeções previstas para o exercício de {anoExercicio}, garantindo conformidade sanitária plena perante o Estado.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs sm:text-sm">
              <p className="font-bold text-rose-900">
                Atenção Crítica: Restam {totalFaltante} estabelecimento(s) de Alto Risco para alcançar a meta de 100%. Cada vistoria pendente reduz a segurança sanitária e impacta o repasse financeiro de 2027.
              </p>
              <p className="text-rose-800 leading-relaxed text-xs">
                O município realizou <strong>{totalInspecionados} de {totalCadastradosRiscoIII}</strong> vistorias de Risco III ({coberturaPercentual.toFixed(1)}%). Na regra estrita da SES-MG, qualquer pendência em Alto Risco gera penalidade orçamentária progressiva (corte total se cobertura &lt; 20%).
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-200/70 border border-rose-300 font-bold text-rose-900 text-xs">
                  <Clock className="w-3.5 h-3.5 text-rose-800" />
                  Ritmo sugerido: {ritmoSugerido} inspeção(ões) por mês até 31/12/{anoExercicio}
                </span>
                {pendentesAlvaraCritico > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 border border-amber-300 font-bold text-amber-900 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    {pendentesAlvaraCritico} pendência(s) com alvará vencido/irregular
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Régua Visual de Faixas Estritas de Repasse SES-MG */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Tabela Estrita de Repasse SES-MG para Alto Risco (Res. SES/MG nº 10.917/2026)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Faixa Atual: <strong>{repasseFinanceiro.faixaLabel}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 text-center text-[10px]">
            {[
              { faixa: '< 20%', repasse: '0%', min: 0, max: 19.99 },
              { faixa: '20-29%', repasse: '20%', min: 20, max: 29.99 },
              { faixa: '30-39%', repasse: '30%', min: 30, max: 39.99 },
              { faixa: '40-49%', repasse: '40%', min: 40, max: 49.99 },
              { faixa: '50-59%', repasse: '50%', min: 50, max: 59.99 },
              { faixa: '60-69%', repasse: '60%', min: 60, max: 69.99 },
              { faixa: '70-79%', repasse: '70%', min: 70, max: 79.99 },
              { faixa: '80-89%', repasse: '80%', min: 80, max: 89.99 },
              { faixa: '90-99%', repasse: '90%', min: 90, max: 99.99 },
              { faixa: '100%', repasse: '100%', min: 100, max: 100 },
            ].map(item => {
              const isActive = (item.min === 0 && coberturaPercentual < 20) ||
                               (item.min === 100 && coberturaPercentual >= 100) ||
                               (coberturaPercentual >= item.min && coberturaPercentual <= item.max);
              const isMetaPlena = item.faixa === '100%';
              return (
                <div 
                  key={item.faixa}
                  className={`p-2 rounded-lg border transition-all ${
                    isActive 
                      ? 'bg-rose-600 text-white border-rose-700 font-bold shadow-sm ring-2 ring-rose-300' 
                      : isMetaPlena
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <p className="font-mono text-[9px] opacity-80">{item.faixa}</p>
                  <p className="text-xs font-black mt-0.5">{item.repasse}</p>
                  {isActive && (
                    <span className="block mt-1 text-[8px] uppercase tracking-wider bg-white/20 rounded py-0.5 font-bold">
                      Atual
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Checklist Regulatório */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Checklist Regulatório do Município (SES-MG)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Item 1: Inspecionar 100% */}
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              metaAtingida 
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50/50 border-rose-200 text-rose-950'
            }`}>
              {metaAtingida ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">Inspecionar 100% dos estabelecimentos municipais de Risco III</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {metaAtingida 
                    ? 'Cumprido com êxito: 100% de vistorias concluídas.' 
                    : `Pendente: faltam ${totalFaltante} vistoria(s) para meta total.`}
                </p>
              </div>
            </div>

            {/* Item 2: Auditar Alvarás */}
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              pendentesAlvaraCritico === 0 
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {pendentesAlvaraCritico === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">Auditar estabelecimentos com Alvará Sanitário vencendo no período</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {pendentesAlvaraCritico === 0 
                    ? 'Sem alvarás vencidos pendentes em Alto Risco.' 
                    : `${pendentesAlvaraCritico} empresa(s) com alvará vencido/irregular a regularizar.`}
                </p>
              </div>
            </div>

            {/* Item 3: Planilha de Risco III */}
            <div className="p-3 rounded-xl border bg-emerald-50/60 border-emerald-200 text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gerar planilha de fiscalização de Risco III</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Relatório e planilhas analíticas gerados com histórico e números de termo.
                </p>
              </div>
            </div>

            {/* Item 4: Submeter no Formulário Unificado */}
            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Submeter no Formulário Unificado VigiMinas até 15/01/2027</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Protocolo obrigatório no sistema da Secretaria de Estado de Saúde.
                </p>
              </div>
            </div>

            {/* Item 5: Validação NUVISA */}
            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 flex items-start gap-2.5 md:col-span-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Validar documentação junto ao NUVISA da Regional de Saúde</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Conferência documental de termos de inspeção, autos e relatórios conclusivos emitidos pelos fiscais municipais.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. BLOCO 3: SEÇÃO ANALÍTICA DE ESTABELECIMENTOS (ABAS)          */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Barra superior de controle das Abas e Busca */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Abas */}
          <div className="flex items-center gap-2 border-b sm:border-b-0 border-slate-200 pb-2 sm:pb-0">
            <button
              onClick={() => setAbaAtiva('pendentes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                abaAtiva === 'pendentes'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Fila Crítica de Pendências (A Inspecionar)
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                abaAtiva === 'pendentes' ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalPendentes}
              </span>
            </button>

            <button
              onClick={() => setAbaAtiva('inspecionados')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                abaAtiva === 'inspecionados'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Inspeções Concluídas (Risco III)
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                abaAtiva === 'inspecionados' ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalInspecionados}
              </span>
            </button>
          </div>

          {/* Campo de Busca Textual */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por Razão, CNPJ ou Bairro..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Estabelecimentos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Estabelecimento / Razão Social</th>
                <th className="py-3 px-4">CNPJ / CPF</th>
                <th className="py-3 px-4">Endereço / Bairro</th>
                <th className="py-3 px-4">CNAE Principal</th>
                <th className="py-3 px-4">Situação Alvará</th>
                {abaAtiva === 'inspecionados' ? (
                  <>
                    <th className="py-3 px-4">Data Inspeção</th>
                    <th className="py-3 px-4">Responsável / Fiscais</th>
                  </>
                ) : (
                  <th className="py-3 px-4 text-right print:hidden">Ação Rápida</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listaExibicao.length === 0 ? (
                <tr>
                  <td colSpan={abaAtiva === 'inspecionados' ? 7 : 6} className="py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum estabelecimento encontrado nesta visão</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm 
                        ? 'Tente ajustar os termos de busca digitados.' 
                        : abaAtiva === 'inspecionados' 
                          ? 'Ainda não foram registradas inspeções de Risco III em 2026.' 
                          : 'Parabéns! Não há pendências de fiscalização em Alto Risco neste exercício.'}
                    </p>
                  </td>
                </tr>
              ) : (
                listaExibicao.map(est => {
                  const dataInspecao = est.dataUltimaInspecaoInicio || est.dataUltimaInspecaoFim;
                  return (
                    <tr 
                      key={est.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Razão Social e Fantasia */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {est.razaoSocial}
                        </div>
                        {est.nomeFantasia && (
                          <div className="text-[11px] text-slate-500">
                            {est.nomeFantasia}
                          </div>
                        )}
                      </td>

                      {/* CNPJ / CPF */}
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {est.cnpj || est.cnpjCpf || 'Não informado'}
                      </td>

                      {/* Endereço / Bairro */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <span className="line-clamp-1" title={`${est.endereco?.logradouro || ''}, ${est.endereco?.bairro || ''}`}>
                          {est.endereco?.logradouro ? `${est.endereco.logradouro}, ${est.endereco.bairro || ''}` : 'Centro, Braúnas/MG'}
                        </span>
                      </td>

                      {/* CNAE Principal */}
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-mono font-semibold text-rose-900 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {est.cnaeCodigo}
                        </span>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 max-w-xs">
                          {est.cnaeDescricao}
                        </p>
                      </td>

                      {/* Situação Alvará */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getBadgeAlvara(est.situacaoAlvara)}
                      </td>

                      {/* Campos da Aba Inspecionados */}
                      {abaAtiva === 'inspecionados' ? (
                        <>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-800 font-bold">
                            {formatarData(dataInspecao)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px]">
                            {est.fiscaisUltimaInspecao && est.fiscaisUltimaInspecao.length > 0 
                              ? est.fiscaisUltimaInspecao.join(', ')
                              : 'Fiscal Técnico Designado'}
                          </td>
                        </>
                      ) : (
                        /* Ação Rápida da Aba Pendentes */
                        <td className="py-3 px-4 text-right print:hidden whitespace-nowrap">
                          <button
                            onClick={() => handleOpenRegistrar(est)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 transition-colors shadow-2xs"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Registrar Inspeção
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela com totais */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2 font-mono">
          <span>
            Mostrando <strong>{listaExibicao.length}</strong> de <strong>{abaAtiva === 'inspecionados' ? totalInspecionados : totalPendentes}</strong> registros da visualização.
          </span>
          <span>
            Total Cadastrado em Alto Risco (III): <strong>{totalCadastradosRiscoIII}</strong>
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. RODAPÉ INSTITUCIONAL COM ASSINATURAS (Para Impressão)       */}
      {/* ============================================================== */}
      <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1 print:pt-8 print:text-black">
        <p className="font-semibold text-slate-600 print:text-slate-800">
          VigiMinas • Sistema Integrado de Gestão da Vigilância Sanitária Municipal
        </p>
        <p className="text-[11px]">
          Em conformidade com a Resolução SES/MG nº 10.917/2026 e Instrutivo do Programa VigiMinas.
        </p>

        {/* Bloco de Assinaturas (Visível somente na impressão física) */}
        <div className="hidden print:grid grid-cols-2 gap-12 mt-16 pt-8 text-center text-slate-800">
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-xs">{coordenadorVisa}</p>
            <p className="text-[10px] text-slate-600">Coordenador Municipal de Vigilância Sanitária</p>
            <p className="text-[9px] text-slate-500 font-mono">Portaria de Nomeação Municipal</p>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-xs">Fiscal Sanitário Responsável</p>
            <p className="text-[10px] text-slate-600">Equipe Técnica de Fiscalização - VISA</p>
            <p className="text-[9px] text-slate-500 font-mono">Matrícula / Registro Profissional</p>
          </div>
        </div>
      </div>

      {/* Modal de Registro Rápido de Inspeção */}
      <RegistrarInspecaoModal
        isOpen={modalInspecaoOpen}
        onClose={() => setModalInspecaoOpen(false)}
        estabelecimento={estabelecimentoSelecionado}
        onConfirmInspecao={handleConfirmInspecao}
      />
    </div>
  );
};
