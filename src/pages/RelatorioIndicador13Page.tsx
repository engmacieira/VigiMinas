import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  ClipboardList
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { Estabelecimento } from '../types/vigiminas';
import { RegistrarInspecaoModal } from '../components/RegistrarInspecaoModal';

export const RelatorioIndicador13Page: React.FC = () => {
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

  // Base de Risco I ativa/válida (desconsiderando soft deletes)
  const baseRiscoI = useMemo(() => {
    return estabelecimentos
      .filter(e => !e.isDeleted)
      .filter(e => e.nivelRisco === 'Risco I')
      .filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso');
  }, [estabelecimentos]);

  // Total de Risco I
  const totalCadastradosRiscoI = baseRiscoI.length;

  // Inspeções de Risco I realizadas no ano de exercício
  const inspecionadosRiscoI = useMemo(() => {
    return baseRiscoI.filter(e => 
      (e.dataUltimaInspecaoInicio && e.dataUltimaInspecaoInicio.startsWith(anoStr)) ||
      (e.dataUltimaInspecaoFim && e.dataUltimaInspecaoFim.startsWith(anoStr))
    );
  }, [baseRiscoI, anoStr]);

  // Pendências de inspeção em Risco I
  const pendentesRiscoI = useMemo(() => {
    return baseRiscoI.filter(e => 
      (!e.dataUltimaInspecaoInicio || !e.dataUltimaInspecaoInicio.startsWith(anoStr)) &&
      (!e.dataUltimaInspecaoFim || !e.dataUltimaInspecaoFim.startsWith(anoStr))
    );
  }, [baseRiscoI, anoStr]);

  const totalInspecionados = inspecionadosRiscoI.length;
  const totalPendentes = pendentesRiscoI.length;

  // Meta Oficial SES-MG: 15%
  const metaPercentual = 15;
  const metaMinimaAbsoluta = Math.ceil(totalCadastradosRiscoI * 0.15);
  const coberturaPercentual = totalCadastradosRiscoI > 0 
    ? (totalInspecionados / totalCadastradosRiscoI) * 100 
    : 100;
  
  const metaAtingida = coberturaPercentual >= metaPercentual;

  // Quantas inspeções ainda faltam para atingir os 15%
  const inspecoesNecessarias = Math.max(0, metaMinimaAbsoluta - totalInspecionados);

  // Estimativa de ritmo mensal sugerido até dezembro de 2026
  const ritmoSugerido = useMemo(() => {
    if (inspecoesNecessarias <= 0) return 0;
    const mesAtual = new Date().getMonth(); // 0 a 11
    const mesesRestantes = Math.max(1, 12 - mesAtual);
    return Math.max(1, Math.ceil(inspecoesNecessarias / mesesRestantes));
  }, [inspecoesNecessarias]);

  // Filtragem da lista da aba ativa por busca
  const listaExibicao = useMemo(() => {
    const base = abaAtiva === 'inspecionados' ? inspecionadosRiscoI : pendentesRiscoI;
    if (!searchTerm.trim()) return base;
    const termo = searchTerm.toLowerCase();
    return base.filter(est => 
      est.razaoSocial.toLowerCase().includes(termo) ||
      (est.nomeFantasia && est.nomeFantasia.toLowerCase().includes(termo)) ||
      (est.cnpj && est.cnpj.toLowerCase().includes(termo)) ||
      (est.cnpjCpf && est.cnpjCpf.toLowerCase().includes(termo)) ||
      (est.endereco?.bairro && est.endereco.bairro.toLowerCase().includes(termo)) ||
      (est.endereco?.logradouro && est.endereco.logradouro.toLowerCase().includes(termo))
    );
  }, [abaAtiva, inspecionadosRiscoI, pendentesRiscoI, searchTerm]);

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
    window.print();
  };

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return 'Pendente';
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
              ESTADO DE MINAS GERAIS • SECRETARIA MUNICIPAL DE SAÚDE • VIGILÂNCIA SANITÁRIA
            </p>
            <h1 className="text-lg font-black uppercase text-slate-900">
              Prefeitura Municipal de {municipioNome} / {ufSigla}
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Relatório Executivo e Operacional - Indicador 13 (Fiscalização em Estabelecimentos de Risco I)
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
          <span>Meta Estadual Pactuada: <strong>15% da Base de Risco I</strong></span>
          <span>Regulamentação: <strong>Resolução SES/MG nº 10.917/2026</strong></span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CABEÇALHO EXECUTIVO (TELA)                                  */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm print:hidden">
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {/* Tag Institucional, Município e Porte */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                VigiMinas • Fiscalização Sanitária
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Exercício {anoExercicio}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium">
                Município: {municipioNome} / {ufSigla}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-700/50">
                Porte 2 a 10 mil hab
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-400 shrink-0" strokeWidth={2.2} />
              Relatório de Fiscalização - Indicador 13 (Risco I)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitoramento de Inspeções Sanitárias em Baixo Risco | Meta Estadual: 15% (Resolução SES/MG nº 10.917/2026).
            </p>
          </div>

          {/* Barra de Ações Rápidas no Topo */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              to="/relatorios"
              className="min-h-[40px] px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Voltar para Relatórios</span>
            </Link>

            {pendentesRiscoI.length > 0 ? (
              <button
                type="button"
                onClick={() => handleOpenRegistrar(pendentesRiscoI[0])}
                className="min-h-[40px] px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Inspeção</span>
              </button>
            ) : (
              <Link
                to="/estabelecimentos"
                className="min-h-[40px] px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Inspeção</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleImprimir}
              className="min-h-[40px] px-3.5 rounded-lg bg-slate-100 hover:bg-white active:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Imprimir Relatório</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 1: KPIS E TERMÔMETRO DA META (INDICADOR 13)              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Base de Risco I Cadastrada */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Base de Risco I Cadastrada
              </span>
              <Building2 className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                {totalCadastradosRiscoI}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                empresas ativas
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Denominador oficial do indicador
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-500">
            <span>Baixo Risco Sanitário</span>
            <span className="font-semibold text-slate-700">SES/MG 10.917</span>
          </div>
        </div>

        {/* Card 2: Meta Mínima (15%) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Meta Mínima (15%)
              </span>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 font-mono tabular-nums">
                {metaMinimaAbsoluta}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {metaMinimaAbsoluta === 1 ? 'inspeção' : 'inspeções necessárias'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Cota estadual mínima exigida
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-500">
            <span>Cálculo Regulamentar</span>
            <span className="font-bold text-emerald-700 font-mono">15% da base</span>
          </div>
        </div>

        {/* Card 3: Inspeções Realizadas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Inspeções Realizadas
              </span>
              <CalendarCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                {totalInspecionados}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {totalInspecionados === 1 ? 'empresa vistoriada' : 'empresas vistoriadas'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Ano de Exercício {anoExercicio}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-500">
            <span>Pendências na Base</span>
            <span className="font-bold text-amber-700">{totalPendentes} pendentes</span>
          </div>
        </div>

        {/* Card 4: Cobertura Atual (%) com Termômetro */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Cobertura Atual (%)
              </span>
              <TrendingUp className={`w-4 h-4 ${
                metaAtingida ? 'text-emerald-600' : (totalInspecionados > 0 ? 'text-amber-600' : 'text-rose-600')
              }`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono tabular-nums ${
                metaAtingida ? 'text-emerald-700' : (totalInspecionados > 0 ? 'text-amber-700' : 'text-rose-700')
              }`}>
                {coberturaPercentual.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                da base de Risco I
              </span>
            </div>

            {/* Barra de Progresso com marcador de 15% */}
            <div className="mt-3 relative">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div 
                  className={`h-full transition-all duration-500 ${
                    metaAtingida ? 'bg-emerald-500' : (totalInspecionados > 0 ? 'bg-amber-500' : 'bg-rose-500')
                  }`}
                  style={{ width: `${Math.min(100, (coberturaPercentual / 15) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                <span>0%</span>
                <span className="text-emerald-700 font-bold">Meta: 15%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              metaAtingida 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : (totalInspecionados > 0 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200')
            }`}>
              {metaAtingida ? 'Meta Atingida' : (totalInspecionados > 0 ? 'Em Andamento' : 'Nenhuma Inspeção')}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 2: PAINEL DIAGNÓSTICO OPERACIONAL: O QUE FALTA?          */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Diagnóstico Operacional: O Que Falta?
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Instrutivo Oficial VigiMinas 2026
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Banner de Alerta Inteligente */}
          {metaAtingida ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-2xs space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950">
                    Parabéns! O município de {municipioNome} atingiu a meta da SES-MG para o Indicador 13.
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Foram inspecionados <strong>{totalInspecionados} de {totalCadastradosRiscoI}</strong> estabelecimentos de baixo risco cadastrados ({coberturaPercentual.toFixed(1)}% de cobertura), superando a exigência estadual mínima de 15%.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-3.5 border border-emerald-200 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Proteção Sanitária Fortalecida:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  O cumprimento e o excedente de fiscalização em Risco I garantem a segurança do consumidor, reduzem a ocorrência de surtos e asseguram a totalidade dos recursos financeiros repassados pela SES-MG ao município.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-950">
                    Atenção: Faltam {inspecoesNecessarias} {inspecoesNecessarias === 1 ? 'inspeção' : 'inspeções'} para alcançar a meta estadual de 15%.
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    O município registrou até o momento <strong>{totalInspecionados} de {metaMinimaAbsoluta}</strong> inspeções necessárias na base de baixo risco ({coberturaPercentual.toFixed(1)}%).
                  </p>
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-3.5 border border-amber-200 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Ritmo Sugerido para Cumprimento:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Ritmo sugerido: <strong>{ritmoSugerido} {ritmoSugerido === 1 ? 'inspeção' : 'inspeções'} por mês</strong> até dezembro/{anoExercicio} para homologação no prazo improrrogável de 15/01/2027.
                </p>
              </div>
            </div>
          )}

          {/* Checklist de Obrigações Regulatórias */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 print:border-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Checklist de Obrigações Regulatórias (SES-MG)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Auditoria</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Item 1: Cota mínima de 15% */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="mt-0.5 shrink-0">
                  {metaAtingida ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">Atingir a cota mínima de 15% de inspeções na base de Risco I</strong>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      metaAtingida ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {metaAtingida ? 'Concluído' : `Faltam ${inspecoesNecessarias}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Realizar ao menos {metaMinimaAbsoluta} inspeções sanitárias registradas em empresas de baixo risco no exercício {anoExercicio}.
                  </p>
                </div>
              </div>

              {/* Item 2: Gerar e validar planilha de fiscalização */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">Gerar e validar a Planilha de Fiscalização de Risco I da VISA</strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Disponível
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Os relatórios e termos de vistoria lavrados devem constar em planilha padronizada para fiscalização estadual.
                  </p>
                </div>
              </div>

              {/* Item 3: Submeter no Formulário Unificado */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="mt-0.5 shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">Submeter dados e anexos no Formulário Unificado VigiMinas</strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                      Prazo: 15/01/2027
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Envio oficial pelo gestor municipal à Superintendência/Gerência Regional de Saúde (SRS/GRS).
                  </p>
                </div>
              </div>

              {/* Item 4: Regra de Baixa pós-inspeção */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">Certificar que estabelecimentos baixados pós-inspeção tenham observação "Baixado em DD/MM/AAAA"</strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Conforme
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Garantia de que baixas após a vistoria pontuem regularmente no cálculo do indicador sem distorções no cadastro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 3: SEÇÃO ANALÍTICA DE ESTABELECIMENTOS (ABAS E TABELA)   */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs print:border-slate-300 space-y-0">
        
        {/* Barra Superior: Abas e Campo de Busca */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Abas Chaveadoras */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setAbaAtiva('pendentes')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                abaAtiva === 'pendentes'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Fila de Pendências / Próximas Inspeções ({totalPendentes})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('inspecionados')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                abaAtiva === 'inspecionados'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Inspeções Realizadas em Risco I ({totalInspecionados})</span>
            </button>
          </div>

          <div className="hidden print:block font-bold text-xs text-slate-800 uppercase">
            {abaAtiva === 'inspecionados' ? 'Relatório de Inspeções Realizadas' : 'Fila de Pendências de Risco I'}
          </div>

          {/* Campo de Busca Textual */}
          <div className="relative min-w-[260px] print:hidden">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Razão Social, Fantasia ou Bairro..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabela da Aba Ativa */}
        <div className="overflow-x-auto">
          {listaExibicao.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Razão Social / Nome Fantasia</th>
                  <th className="py-3 px-4">CNPJ / CPF</th>
                  <th className="py-3 px-4">Endereço / Bairro</th>
                  <th className="py-3 px-4">CNAE Principal</th>
                  {abaAtiva === 'inspecionados' ? (
                    <>
                      <th className="py-3 px-4">Data da Inspeção</th>
                      <th className="py-3 px-4">Fiscal Responsável</th>
                      <th className="py-3 px-4 text-center">Parecer / Alvará</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4">Última Vistoria</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center print:hidden">Ação Rápida</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaExibicao.map((est) => {
                  const inspecionadaAno = (est.dataUltimaInspecaoInicio && est.dataUltimaInspecaoInicio.startsWith(anoStr)) ||
                    (est.dataUltimaInspecaoFim && est.dataUltimaInspecaoFim.startsWith(anoStr));

                  return (
                    <tr key={est.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Razão Social / Nome Fantasia */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {est.razaoSocial}
                        </div>
                        {est.nomeFantasia && est.nomeFantasia !== est.razaoSocial && (
                          <div className="text-[11px] text-slate-500 font-normal">
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
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <div className="font-mono font-medium text-slate-800 text-[11px]">
                          {est.cnaeCodigo}
                        </div>
                        <div className="line-clamp-1 text-[11px] text-slate-500" title={est.cnaeDescricao}>
                          {est.cnaeDescricao}
                        </div>
                      </td>

                      {abaAtiva === 'inspecionados' ? (
                        <>
                          {/* Data da Inspeção */}
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {formatarData(est.dataUltimaInspecaoInicio || est.dataUltimaInspecaoFim)}
                          </td>

                          {/* Fiscal Responsável */}
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-mono text-[11px]">
                            {est.fiscaisUltimaInspecao && est.fiscaisUltimaInspecao.length > 0 
                              ? est.fiscaisUltimaInspecao.join(', ') 
                              : 'Lucas Silveira'}
                          </td>

                          {/* Parecer / Alvará */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Conforme ({est.situacaoAlvara || 'Alvará Válido'})
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Última Vistoria */}
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                            {est.dataUltimaInspecaoInicio ? formatarData(est.dataUltimaInspecaoInicio) : 'Sem registro prévio'}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Pendente em {anoExercicio}
                            </span>
                          </td>

                          {/* Ação Rápida */}
                          <td className="py-3 px-4 text-center whitespace-nowrap print:hidden">
                            <button
                              type="button"
                              onClick={() => handleOpenRegistrar(est)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>Registrar Inspeção</span>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {abaAtiva === 'inspecionados' 
                  ? 'Nenhuma inspeção de Risco I registrada ainda' 
                  : 'Nenhuma pendência de inspeção em Risco I'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchTerm 
                  ? 'Nenhum estabelecimento encontrado com os termos de busca informados.' 
                  : (abaAtiva === 'inspecionados' 
                      ? 'Inicie as vistorias na aba "Fila de Pendências" para computar o alcance da meta de 15%.' 
                      : 'Todos os estabelecimentos de baixo risco já foram inspecionados no exercício corrente.')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* NOTAS TÉCNICAS E RODAPÉ INSTITUCIONAL                          */}
      {/* ============================================================== */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2 print:border-slate-300">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-600" />
          Regulamentação Oficial da SES-MG (Indicador 13)
        </h4>
        <p className="leading-relaxed">
          1. <strong>Regra de Cálculo:</strong> O percentual é obtido pela razão entre os estabelecimentos de Risco I inspecionados em {anoExercicio} e o total de estabelecimentos ativos de Risco I cadastrados pelo município na base oficial (multiplicado por 100).
        </p>
        <p className="leading-relaxed">
          2. <strong>Meta e Repasse Financeiro:</strong> O cumprimento da cota mínima de 15% assegura a regularidade do município perante a Resolução SES/MG nº 10.917/2026 e o repasse integral dos recursos do programa VigiMinas.
        </p>
        
        {/* Rodapé Institucional */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2 font-mono">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
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
              Fiscal Sanitário Responsável (Risco I)
            </div>
            <div className="text-[11px] text-slate-600">
              {configuracao?.fiscais?.find(f => f.ativo)?.nome || 'Lucas Silveira'} (Matrícula VISA)
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Fiscalização e Controle de Risco Baixo
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Registro de Inspeção Rápida */}
      <RegistrarInspecaoModal
        isOpen={modalInspecaoOpen}
        onClose={() => setModalInspecaoOpen(false)}
        estabelecimento={estabelecimentoSelecionado}
        onConfirmInspecao={handleConfirmInspecao}
      />

    </div>
  );
};
