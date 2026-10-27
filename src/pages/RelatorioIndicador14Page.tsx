import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  PlusCircle, 
  Printer, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Calendar, 
  Search, 
  FileCheck, 
  UserCheck, 
  X, 
  Clock, 
  Info,
  CalendarCheck,
  ChevronRight,
  ExternalLink,
  ClipboardList,
  DollarSign,
  Percent,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { Estabelecimento } from '../types/vigiminas';
import { RegistrarInspecaoModal } from '../components/RegistrarInspecaoModal';
import { safePrint } from '../utils/printHelper';

export const RelatorioIndicador14Page: React.FC = () => {
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

  // Base de Risco II ativa/válida (desconsiderando soft deletes)
  const baseRiscoII = useMemo(() => {
    return estabelecimentos
      .filter(e => !e.isDeleted)
      .filter(e => e.nivelRisco === 'Risco II')
      .filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso');
  }, [estabelecimentos]);

  // Total de Risco II cadastrados
  const totalCadastradosRiscoII = baseRiscoII.length;

  // Inspeções de Risco II realizadas no ano corrente de exercício
  const inspecionadosRiscoII = useMemo(() => {
    return baseRiscoII.filter(e => 
      (e.dataUltimaInspecaoInicio && e.dataUltimaInspecaoInicio.startsWith(anoStr)) ||
      (e.dataUltimaInspecaoFim && e.dataUltimaInspecaoFim.startsWith(anoStr))
    );
  }, [baseRiscoII, anoStr]);

  // Pendências de inspeção em Risco II
  const pendentesRiscoII = useMemo(() => {
    return baseRiscoII.filter(e => 
      (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr)) &&
      (!e.dataUltimaInspecaoFim || !e.dataUltimaInspecaoFim.startsWith(anoStr))
    );
  }, [baseRiscoII, anoStr]);

  const totalInspecionados = inspecionadosRiscoII.length;
  const totalPendentes = pendentesRiscoII.length;

  // Meta Oficial SES-MG: 90%
  const metaPercentual = 90;
  const metaMinimaAbsoluta = Math.ceil(totalCadastradosRiscoII * 0.9);
  const coberturaPercentual = totalCadastradosRiscoII > 0 
    ? (totalInspecionados / totalCadastradosRiscoII) * 100 
    : 100;
  
  const metaAtingida = coberturaPercentual >= metaPercentual;

  // Quantas inspeções ainda faltam para atingir 90% e 100%
  const faltamPara90 = Math.max(0, metaMinimaAbsoluta - totalInspecionados);
  const faltamPara100 = Math.max(0, totalCadastradosRiscoII - totalInspecionados);

  // Estimativa de ritmo mensal sugerido até dezembro de 2026
  const ritmoSugerido = useMemo(() => {
    if (faltamPara90 <= 0) return 0;
    const mesAtual = new Date().getMonth(); // 0 a 11
    const mesesRestantes = Math.max(1, 12 - mesAtual);
    return Math.max(1, Math.ceil(faltamPara90 / mesesRestantes));
  }, [faltamPara90]);

  // Regra de Repasse Financeiro por Faixas (Resolução SES/MG nº 10.917/2026)
  const repasseFinanceiro = useMemo(() => {
    if (totalCadastradosRiscoII === 0) {
      return {
        percentual: 100,
        faixaLabel: '100% do Recurso',
        subtitulo: 'Sem estabelecimentos de Risco II',
        status: 'integral' as const,
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        cardBorder: 'border-emerald-300',
        corte: 0,
        faixaIndice: 9
      };
    }

    if (coberturaPercentual >= 90) {
      return {
        percentual: 100,
        faixaLabel: '100% do Recurso Garantido',
        subtitulo: 'Meta Plena Atingida (≥ 90%)',
        status: 'integral' as const,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        cardBorder: 'border-emerald-400',
        corte: 0,
        faixaIndice: 9
      };
    }

    if (coberturaPercentual < 10) {
      return {
        percentual: 0,
        faixaLabel: '0% do Recurso (Perda Total)',
        subtitulo: 'Crítico: Cobertura < 10%',
        status: 'critico' as const,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        cardBorder: 'border-rose-400',
        corte: 100,
        faixaIndice: 0
      };
    }

    const faixa = Math.floor(coberturaPercentual / 10) * 10;
    const faixaIndice = Math.floor(coberturaPercentual / 10);
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
      faixaIndice
    };
  }, [coberturaPercentual, totalCadastradosRiscoII]);

  // Contagem de pendentes com alvará vencido ou sem alvará
  const pendentesAlvaraCritico = useMemo(() => {
    return pendentesRiscoII.filter(e => 
      e.situacaoAlvara === 'Vencido' || e.situacaoAlvara === 'Não Possui (Irregular)'
    ).length;
  }, [pendentesRiscoII]);

  // Filtragem da lista da aba ativa por busca
  const listaExibicao = useMemo(() => {
    const base = abaAtiva === 'inspecionados' ? inspecionadosRiscoII : pendentesRiscoII;
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
  }, [abaAtiva, inspecionadosRiscoII, pendentesRiscoII, searchTerm]);

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
              ESTADO DE MINAS GERAIS • SECRETARIA MUNICIPAL DE SAÚDE • VIGILÂNCIA SANITÁRIA
            </p>
            <h1 className="text-lg font-black uppercase text-slate-900">
              Prefeitura Municipal de {municipioNome} / {ufSigla}
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Relatório Executivo e Operacional - Indicador 14 (Fiscalização em Estabelecimentos de Risco II - Médio Risco)
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
          <span>Meta Estadual Pactuada: <strong>90% da Base de Risco II (Faixas de Repasse)</strong></span>
          <span>Regulamentação: <strong>Resolução SES/MG nº 10.917/2026</strong></span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CABEÇALHO EXECUTIVO INSTITUCIONAL                           */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm print:hidden">
        {/* Glows decorativos */}
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                VigiMinas • Fiscalização Médio Risco
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Exercício {anoExercicio}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium">
                Município: {municipioNome} / {ufSigla}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-[11px] font-semibold text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
                Porte 2 a 10 mil hab
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Target className="w-6 h-6 text-purple-400 shrink-0" strokeWidth={2.2} />
              Relatório de Fiscalização - Indicador 14 (Risco II)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Inspeções Sanitárias em Médio Risco | Meta Estadual: 90% com Impacto Financeiro (Resolução SES/MG nº 10.917/2026).
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-sm"
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
      {/* 2. BLOCO 1: KPIS E TERMÔMETRO DE IMPACTO FINANCEIRO             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Base de Risco II Cadastrada */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Base de Risco II</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalCadastradosRiscoII}
            </span>
            <span className="text-xs text-slate-500 font-medium">estabelecimentos</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Empresas ativas sujeitas a vistoria de Médio Risco.
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
              de {totalCadastradosRiscoII} ({totalPendentes} pendentes)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-2">
            <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Ano de Referência: <strong>{anoExercicio}</strong></span>
          </div>
        </div>

        {/* Card 3: Cobertura Atual com Termômetro */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Cobertura Atual (%)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${metaAtingida ? 'text-emerald-700' : 'text-amber-700'}`}>
              {coberturaPercentual.toFixed(1)}%
            </span>
            <span className="text-xs font-bold text-slate-500">Meta: 90%</span>
          </div>

          {/* Barra de Progresso com Marcador de 90% */}
          <div className="mt-2.5 relative">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  metaAtingida ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, coberturaPercentual))}%` }}
              />
            </div>
            {/* Marcador visual da meta de 90% */}
            <div 
              className="absolute -top-1 w-0.5 h-4 bg-slate-900" 
              style={{ left: '90%' }} 
              title="Meta Estadual Pactuada: 90%" 
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
            <span>0%</span>
            <span className="font-bold text-slate-700">Meta: 90%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Card 4: Previsão de Repasse Financeiro (Por Faixas) */}
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
              <span className="text-amber-800 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Risco de corte de {repasseFinanceiro.corte}% do recurso
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BLOCO 2: PAINEL "DIAGNÓSTICO OPERACIONAL: O QUE FALTA"       */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-purple-100 text-purple-700">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Diagnóstico Operacional: O Que Falta para Garantir 100% do Recurso
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Plano de ação municipal para blindagem orçamentária do VigiMinas (Resolução SES/MG nº 10.917/2026).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 shrink-0">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Prazo fatal de envio: 15/01/2027</span>
          </div>
        </div>

        {/* Card de Diagnóstico Dinâmico */}
        {metaAtingida ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-bold text-emerald-900">
                Parabéns! O município de {municipioNome} atingiu a meta estadual de 90% no Indicador 14.
              </p>
              <p className="text-emerald-800 leading-relaxed text-xs">
                Com <strong>{totalInspecionados} de {totalCadastradosRiscoII}</strong> estabelecimentos inspecionados ({coberturaPercentual.toFixed(1)}%), o município assegurou <strong>100% do repasse financeiro</strong> vinculado ao Médio Risco da VISA para o exercício subsequente.
                {faltamPara100 > 0 && (
                  <span className="block mt-1 text-emerald-700">
                    Sugestão de excelência: faltam apenas {faltamPara100} vistorias para alcançar 100% da base cadastrada!
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs sm:text-sm">
              <p className="font-bold text-amber-900">
                Atenção: O município de {municipioNome} está na faixa de {repasseFinanceiro.faixaLabel} ({coberturaPercentual.toFixed(1)}%).
              </p>
              <p className="text-amber-800 leading-relaxed text-xs">
                Faltam <strong>{faltamPara90} inspeção(ões)</strong> para alcançar o piso de 90% (total de {metaMinimaAbsoluta} vistorias) e evitar descontos no repasse de 2027.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-200/70 border border-amber-300 font-bold text-amber-900 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-800" />
                  Ritmo sugerido: {ritmoSugerido} inspeção(ões) por mês até 31/12/{anoExercicio}
                </span>
                {pendentesAlvaraCritico > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-100 border border-rose-300 font-bold text-rose-900 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                    {pendentesAlvaraCritico} pendência(s) com alvará vencido/irregular
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Régua Visual de Faixas de Repasse da SES-MG */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Régua Oficial de Repasse Financeiro por Faixas (Res. SES/MG nº 10.917/2026)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Faixa Atual: <strong>{repasseFinanceiro.faixaLabel}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 text-center text-[10px]">
            {[
              { faixa: '< 10%', repasse: '0%', indice: 0 },
              { faixa: '10-19%', repasse: '10%', indice: 1 },
              { faixa: '20-29%', repasse: '20%', indice: 2 },
              { faixa: '30-39%', repasse: '30%', indice: 3 },
              { faixa: '40-49%', repasse: '40%', indice: 4 },
              { faixa: '50-59%', repasse: '50%', indice: 5 },
              { faixa: '60-69%', repasse: '60%', indice: 6 },
              { faixa: '70-79%', repasse: '70%', indice: 7 },
              { faixa: '80-89%', repasse: '80%', indice: 8 },
              { faixa: '≥ 90%', repasse: '100%', indice: 9 },
            ].map(item => {
              const isActive = repasseFinanceiro.faixaIndice === item.indice;
              const isMetaPlena = item.indice === 9;
              return (
                <div 
                  key={item.faixa}
                  className={`p-2 rounded-lg border transition-all ${
                    isActive 
                      ? 'bg-purple-600 text-white border-purple-700 font-bold shadow-sm ring-2 ring-purple-300' 
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

        {/* Checklist de Obrigações do Município */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Checklist de Conformidade Regulatória (SES-MG)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Item 1: Cobertura 90% */}
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              metaAtingida 
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {metaAtingida ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">Atingir a cobertura de 90% em Risco II</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {metaAtingida 
                    ? `Atingido: ${coberturaPercentual.toFixed(1)}% realizado no exercício.`
                    : `Pendente: faltam ${faltamPara90} inspeção(ões) para blindar o repasse.`}
                </p>
              </div>
            </div>

            {/* Item 2: Priorizar Alvarás Vencidos */}
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
                <p className="font-bold">Priorizar estabelecimentos com Alvará Vencido / Irregular</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {pendentesAlvaraCritico === 0 
                    ? 'Nenhum estabelecimento de Risco II com alvará vencido pendente.'
                    : `${pendentesAlvaraCritico} estabelecimento(s) com alvará irregular aguardando renovação.`}
                </p>
              </div>
            </div>

            {/* Item 3: Planilha de Monitoramento */}
            <div className="p-3 rounded-xl border bg-emerald-50/60 border-emerald-200 text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gerar planilha de monitoramento de Risco II</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mapeamento analítico e exportação em conformidade com o layout oficial SES-MG.
                </p>
              </div>
            </div>

            {/* Item 4: Submissão no Formulário Unificado */}
            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Submeter no Formulário Unificado VigiMinas (prazo fatal: 15/01/2027)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Envio eletrônico dos quantitativos consolidados e documentos probatórios.
                </p>
              </div>
            </div>

            {/* Item 5: Validação NUVISA */}
            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 flex items-start gap-2.5 md:col-span-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Garantir validação técnica junto ao NUVISA da Regional de Saúde</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  A homologação do cumprimento da meta é avaliada e chancelada pelo Núcleo de Vigilância Sanitária Regional.
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
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Fila de Inspeções Pendentes (O Que Falta)
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                abaAtiva === 'pendentes' ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalPendentes}
              </span>
            </button>

            <button
              onClick={() => setAbaAtiva('inspecionados')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                abaAtiva === 'inspecionados'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Inspeções Realizadas (Risco II)
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                abaAtiva === 'inspecionados' ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 text-slate-700'
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
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-800"
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
                          ? 'Ainda não foram registradas inspeções de Risco II em 2026.' 
                          : 'Todas as empresas de Risco II já foram inspecionadas neste exercício!'}
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
                        <span className="font-mono font-semibold text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 transition-colors shadow-2xs"
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
            Total Cadastrado em Médio Risco: <strong>{totalCadastradosRiscoII}</strong>
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
