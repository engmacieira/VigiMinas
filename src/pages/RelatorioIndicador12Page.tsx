import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Building2, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Layers, 
  FileText, 
  Calendar, 
  Search, 
  Filter, 
  UserCheck, 
  ExternalLink, 
  PlusCircle, 
  X,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Info,
  Clock,
  Building
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { Estabelecimento, NivelRisco } from '../types/vigiminas';
import { ExportarEstabelecimentosModal } from '../components/ExportarEstabelecimentosModal';
import { safePrint } from '../utils/printHelper';

export const RelatorioIndicador12Page: React.FC = () => {
  const { 
    estabelecimentos = [], 
    configuracao, 
    indicadores,
    loading 
  } = useVigiMinas();

  // Estados de controle de filtros e modais
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRisco, setFiltroRisco] = useState<string>('todos');
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [detalheModal, setDetalheModal] = useState<Estabelecimento | null>(null);

  const anoExercicio = configuracao?.exercicioAtivo?.anoExercicio || indicadores?.anoReferencia || 2026;
  const municipioNome = configuracao?.secretaria?.municipio || 'Braúnas';
  const ufSigla = configuracao?.secretaria?.uf || 'MG';

  // Base filtrada de estabelecimentos não excluídos permanentemente
  const baseValida = useMemo(() => {
    return estabelecimentos.filter(e => !e.isDeleted);
  }, [estabelecimentos]);

  // Contagens dinâmicas para os KPIs
  const totalCadastrado = baseValida.length;
  const totalAtivos = baseValida.filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso').length;
  const totalInativos = baseValida.filter(e => e.situacaoEstabelecimento === 'Inativo').length;

  const totalRiscoI = baseValida.filter(e => e.nivelRisco === 'Risco I').length;
  const totalRiscoII = baseValida.filter(e => e.nivelRisco === 'Risco II').length;
  const totalRiscoIII = baseValida.filter(e => e.nivelRisco === 'Risco III').length;

  const percRiscoI = totalCadastrado > 0 ? (totalRiscoI / totalCadastrado) * 100 : 0;
  const percRiscoII = totalCadastrado > 0 ? (totalRiscoII / totalCadastrado) * 100 : 0;
  const percRiscoIII = totalCadastrado > 0 ? (totalRiscoIII / totalCadastrado) * 100 : 0;

  // Meta do Indicador: 1 Envio Homologado da base municipal
  const metaAtingida = totalCadastrado > 0;

  // Verificações de sanidade cadastral para o checklist
  const semRiscoDefinido = baseValida.filter(e => !e.nivelRisco || !['Risco I', 'Risco II', 'Risco III'].includes(e.nivelRisco)).length;
  const alvarasVencidos = baseValida.filter(e => e.situacaoAlvara === 'Vencido').length;
  const baixadosComObservacao = baseValida.filter(e => e.situacaoEstabelecimento === 'Inativo' && (e.observacoesBaixa || '').trim().length > 0).length;

  // Filtragem da tabela
  const estabelecimentosFiltrados = useMemo(() => {
    return baseValida.filter(est => {
      const matchSearch = 
        est.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (est.nomeFantasia && est.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (est.cnpj && est.cnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (est.cnpjCpf && est.cnpjCpf.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (est.cnaeCodigo && est.cnaeCodigo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRisco = filtroRisco === 'todos' || est.nivelRisco === filtroRisco;
      const matchSituacao = filtroSituacao === 'todos' || 
        (filtroSituacao === 'ativo' ? (est.situacaoEstabelecimento === 'Ativo' || est.situacaoEstabelecimento === 'Suspenso') : est.situacaoEstabelecimento === 'Inativo');

      return matchSearch && matchRisco && matchSituacao;
    });
  }, [baseValida, searchTerm, filtroRisco, filtroSituacao]);

  // Paginação simples
  const totalPaginas = Math.max(1, Math.ceil(estabelecimentosFiltrados.length / itensPorPagina));
  const dadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return estabelecimentosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [estabelecimentosFiltrados, paginaAtual, itensPorPagina]);

  const handleImprimir = () => {
    safePrint();
  };

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return 'Não informada';
    try {
      const [ano, mes, dia] = dataIso.split('-');
      if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
      return dataIso;
    } catch {
      return dataIso;
    }
  };

  const getRiscoBadge = (risco: NivelRisco) => {
    switch (risco) {
      case 'Risco I':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Risco I (Baixo)
          </span>
        );
      case 'Risco II':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Risco II (Médio)
          </span>
        );
      case 'Risco III':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Risco III (Alto)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Não Definido
          </span>
        );
    }
  };

  const getAlvaraBadge = (situacao: string) => {
    switch (situacao) {
      case 'Vigente':
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Vigente</span>;
      case 'Vencido':
        return <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Vencido</span>;
      case 'Em Renovação':
        return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Em Renovação</span>;
      case 'Isento':
        return <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Isento</span>;
      default:
        return <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{situacao || 'Sem Alvará'}</span>;
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
              Secretaria Municipal de Saúde • Departamento de Vigilância Sanitária
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
          <span>Relatório de Situação Cadastral: <strong>Indicador 12 (VISA)</strong></span>
          <span>Regulamentação: <strong>Resolução SES/MG nº 10.917/2026</strong></span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CABEÇALHO EXECUTIVO (TELA)                                  */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm print:hidden">
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {/* Tag Institucional e Município */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                VigiMinas • Controle Sanitário
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Exercício {anoExercicio}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium">
                Município: {municipioNome} / {ufSigla}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-400 shrink-0" strokeWidth={2.2} />
              Relatório de Situação Cadastral - Indicador 12 (VISA)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Cadastro Municipal de Estabelecimentos Sujeitos ao Controle Sanitário | Resolução SES/MG nº 10.917/2026 e Instrutivo VigiMinas 2026.
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

            <Link
              to="/estabelecimentos"
              className="min-h-[40px] px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Gerenciar Estabelecimentos</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="min-h-[40px] px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Planilha Oficial</span>
            </button>

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
      {/* BLOCO 1: KPIS DO CADASTRO E TOTAIS OFICIAIS (FORMULÁRIO SES-MG)*/}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Meta do Indicador */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Meta do Indicador
              </span>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                1 Envio
              </span>
              <span className="text-xs text-slate-500 font-medium">
                homologado
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Base Unificada SES-MG
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              metaAtingida ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {metaAtingida ? 'Conforme' : 'Em Andamento'}
            </span>
          </div>
        </div>

        {/* Card 2: Total Cadastrado */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Total Cadastrado
              </span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                {totalCadastrado}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                empresas
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              {totalAtivos} ativas • {totalInativos} baixadas
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-500">
            <span>Base Municipal</span>
            <span className="font-semibold text-slate-700">100% Auditada</span>
          </div>
        </div>

        {/* Card 3: Risco I (Baixo) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Risco I (Baixo)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 font-mono tabular-nums">
                {totalRiscoI}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({percRiscoI.toFixed(0)}%)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Atividades de baixo risco
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Formulário SES-MG</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
              Campo 12.1
            </span>
          </div>
        </div>

        {/* Card 4: Risco II (Médio) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Risco II (Médio)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-700 font-mono tabular-nums">
                {totalRiscoII}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({percRiscoII.toFixed(0)}%)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Atividades de médio risco
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Formulário SES-MG</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
              Campo 12.2
            </span>
          </div>
        </div>

        {/* Card 5: Risco III (Alto) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Risco III (Alto)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-700 font-mono tabular-nums">
                {totalRiscoIII}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({percRiscoIII.toFixed(0)}%)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Atividades de alto risco
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Formulário SES-MG</span>
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
              Campo 12.3
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 2: PAINEL STATUS REGULATÓRIO E O QUE FALTA               */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Status Regulatório e O Que Falta
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Instrutivo SES/MG nº 10.917/2026
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Card: Diagnóstico de Envio */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-950">
                  Diagnóstico de Envio: Base Municipal Pronta
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  A base cadastral de {municipioNome} possui <strong>{totalCadastrado} estabelecimentos registrados</strong> e categorizados para envio. O cadastro atualizado é pré-requisito obrigatório para o cálculo e validação dos <strong>Indicadores 13, 14 e 15</strong>.
                </p>
              </div>
            </div>

            <div className="bg-white/80 rounded-lg p-3.5 border border-emerald-200 text-xs space-y-2 text-slate-700">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Prazos Oficiais da SES-MG:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Envio periódico no Formulário Unificado até o fim da primeira quinzena do mês subsequente ao fechamento.
                <strong> Prazo final improrrogável de homologação: 15/01/2027.</strong>
              </p>
              <div className="pt-2 border-t border-emerald-100 flex items-center gap-1.5 text-[11px] text-slate-600">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>A validação e auditoria serão efetuadas pela equipe técnica do NUVISA / Unidade Regional de Saúde (URS).</span>
              </div>
            </div>
          </div>

          {/* Card: Checklist de Sanidade Cadastral */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 print:border-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Checklist de Sanidade Cadastral
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Auditoria</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Item 1: Classificação por Nível de Risco */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="mt-0.5 shrink-0">
                  {semRiscoDefinido === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">Classificação por Nível de Risco</strong>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      semRiscoDefinido === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {semRiscoDefinido === 0 ? 'Concluído (100%)' : `${semRiscoDefinido} pendente(s)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Todos os estabelecimentos devem possuir classificação expressa em Risco I, II ou III para preenchimento dos campos 12.1, 12.2 e 12.3 do Formulário SES-MG.
                  </p>
                </div>
              </div>

              {/* Item 2: Regra de Baixa Sanitária */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">Regra de Ouro da Baixa Sanitária (SES-MG)</strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Regra Ativa
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Fechados <strong>antes da inspeção</strong> devem ser excluídos da planilha; fechados <strong>após a inspeção</strong> permanecem na planilha com status Inativo e a anotação obrigatória "Baixado em DD/MM/AAAA".
                  </p>
                </div>
              </div>

              {/* Item 3: Data de Validade de Alvará */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="mt-0.5 shrink-0">
                  {alvarasVencidos === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">Validade do Alvará Sanitário</strong>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      alvarasVencidos === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alvarasVencidos === 0 ? 'Sem vencidos' : `${alvarasVencidos} vencido(s)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    O acompanhamento da validade é essencial para a emissão e encerramento de alvarás de fiscalização sanitária nos prazos legais.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 3: TABELA RESUMO DA BASE CADASTRAL                       */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs print:border-slate-300 space-y-0">
        
        {/* Cabeçalho da Tabela e Barra de Ferramentas de Busca / Filtros */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Base de Estabelecimentos Catalogados ({estabelecimentosFiltrados.length} de {totalCadastrado})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Listagem analítica de controle sanitário municipal segundo CNAE e nível de risco.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Input de Busca */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Buscar por Razão Social ou CNPJ..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro por Risco */}
            <select
              value={filtroRisco}
              onChange={(e) => {
                setFiltroRisco(e.target.value);
                setPaginaAtual(1);
              }}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="todos">Todos os Riscos</option>
              <option value="Risco I">Risco I (Baixo)</option>
              <option value="Risco II">Risco II (Médio)</option>
              <option value="Risco III">Risco III (Alto)</option>
            </select>

            {/* Filtro por Situação */}
            <select
              value={filtroSituacao}
              onChange={(e) => {
                setFiltroSituacao(e.target.value);
                setPaginaAtual(1);
              }}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="todos">Todas as Situações</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos / Baixados</option>
            </select>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          {dadosPaginados.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Razão Social / Nome Fantasia</th>
                  <th className="py-3 px-4">CNPJ / CPF</th>
                  <th className="py-3 px-4">Nível de Risco</th>
                  <th className="py-3 px-4">CNAE Principal</th>
                  <th className="py-3 px-4">Status do Alvará</th>
                  <th className="py-3 px-4 text-center">Situação</th>
                  <th className="py-3 px-4 text-center print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dadosPaginados.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Razão Social / Nome Fantasia */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {est.razaoSocial}
                      </div>
                      {est.nomeFantasia && est.nomeFantasia !== est.razaoSocial && (
                        <div className="text-[11px] text-slate-500">
                          {est.nomeFantasia}
                        </div>
                      )}
                    </td>

                    {/* CNPJ / CPF */}
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {est.cnpj || est.cnpjCpf || 'Não informado'}
                    </td>

                    {/* Nível de Risco */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getRiscoBadge(est.nivelRisco)}
                    </td>

                    {/* CNAE Principal */}
                    <td className="py-3 px-4 max-w-xs text-slate-600">
                      <div className="font-mono font-medium text-slate-800">
                        {est.cnaeCodigo}
                      </div>
                      <div className="line-clamp-1 text-[11px] text-slate-500" title={est.cnaeDescricao}>
                        {est.cnaeDescricao}
                      </div>
                    </td>

                    {/* Status do Alvará Sanitário */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getAlvaraBadge(est.situacaoAlvara)}
                        {est.dataValidadeAlvara && (
                          <span className="text-[10px] font-mono text-slate-400" title={`Validade: ${formatarData(est.dataValidadeAlvara)}`}>
                            {formatarData(est.dataValidadeAlvara)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Situação (Ativo / Inativo) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {est.situacaoEstabelecimento === 'Inativo' ? (
                        <span 
                          title={est.observacoesBaixa || 'Estabelecimento Baixado'}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          Inativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Ativo
                        </span>
                      )}
                    </td>

                    {/* Ações (Tela) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap print:hidden">
                      <button
                        type="button"
                        onClick={() => setDetalheModal(est)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                        title="Ver Ficha Rápida do Estabelecimento"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Nenhum estabelecimento encontrado
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchTerm || filtroRisco !== 'todos' || filtroSituacao !== 'todos'
                  ? 'Nenhum resultado corresponde aos filtros aplicados. Tente ajustar os termos de busca.'
                  : 'Nenhum estabelecimento cadastrado na base municipal. Registre as empresas para homologação do Indicador 12.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/estabelecimentos"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Novo Estabelecimento</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé da Tabela com Paginação */}
        {estabelecimentosFiltrados.length > itensPorPagina && (
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600 print:hidden">
            <span>
              Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong> ({estabelecimentosFiltrados.length} registros)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={paginaAtual >= totalPaginas}
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* NOTAS TÉCNICAS E RODAPÉ INSTITUCIONAL                          */}
      {/* ============================================================== */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2 print:border-slate-300">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-600" />
          Notas Técnicas & Auditoria do Indicador 12
        </h4>
        <p className="leading-relaxed">
          1. <strong>Composição dos Dados:</strong> Os quantitativos de Risco I, II e III acima apurados correspondem aos campos 12.1, 12.2 e 12.3 a serem transcritos no Formulário Unificado VigiMinas da SES-MG.
        </p>
        <p className="leading-relaxed">
          2. <strong>Pré-requisito para Inspeções:</strong> Conforme determina a Resolução SES/MG nº 10.917/2026, os Indicadores 13 (Risco I), 14 (Risco II) e 15 (Risco III) utilizam este cadastro como denominador municipal oficial.
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
              Fiscal Sanitário Responsável (VISA)
            </div>
            <div className="text-[11px] text-slate-600">
              {configuracao?.fiscais?.find(f => f.ativo)?.nome || 'Lucas Silveira'} (Matrícula VISA)
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Comissão de Controle e Cadastro Sanitário
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL DE FICHA RÁPIDA DO ESTABELECIMENTO                       */}
      {/* ============================================================== */}
      {detalheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Dossiê Cadastral
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {detalheModal.razaoSocial}
                </h3>
                {detalheModal.nomeFantasia && (
                  <p className="text-xs text-slate-500">{detalheModal.nomeFantasia}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetalheModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">CNPJ / CPF</span>
                  <span className="font-bold text-slate-800">{detalheModal.cnpj || detalheModal.cnpjCpf}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Nível de Risco</span>
                  <div className="mt-0.5">{getRiscoBadge(detalheModal.nivelRisco)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Alvará Sanitário</span>
                  <div className="mt-0.5">{getAlvaraBadge(detalheModal.situacaoAlvara)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Validade Alvará</span>
                  <span className="font-bold text-slate-800">{formatarData(detalheModal.dataValidadeAlvara)}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block text-[11px] mb-1">CNAE Principal:</span>
                <p className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px]">
                  <strong>{detalheModal.cnaeCodigo}</strong> - {detalheModal.cnaeDescricao}
                </p>
              </div>

              {detalheModal.situacaoEstabelecimento === 'Inativo' && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-amber-900">
                  <span className="font-bold block text-[11px]">Observações de Baixa Sanitária:</span>
                  <p className="text-[11px] mt-0.5">{detalheModal.observacoesBaixa || 'Baixado sem observações adicionais.'}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/estabelecimentos"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Editar no Módulo Completo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setDetalheModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportação da Planilha Oficial */}
      <ExportarEstabelecimentosModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        estabelecimentosFiltrados={estabelecimentosFiltrados}
      />

    </div>
  );
};
