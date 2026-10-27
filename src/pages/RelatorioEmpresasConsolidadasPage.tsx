import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, 
  Building2, 
  ShieldCheck, 
  ArrowLeft, 
  PlusCircle, 
  Printer, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Percent, 
  BarChart3, 
  FileSpreadsheet, 
  Filter, 
  X,
  Layers,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { Estabelecimento, NivelRisco } from '../types/vigiminas';

export const RelatorioEmpresasConsolidadasPage: React.FC = () => {
  const { 
    estabelecimentos = [], 
    configuracao, 
    indicadores 
  } = useVigiMinas();

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRisco, setFiltroRisco] = useState<'todos' | NivelRisco>('todos');
  const [filtroAlvara, setFiltroAlvara] = useState<'todos' | 'vigente' | 'vencido' | 'sem_alvara'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const hoje = new Date();
  const hojeISO = hoje.toISOString().split('T')[0];
  const anoExercicio = configuracao?.exercicioAtivo?.anoExercicio || indicadores?.anoReferencia || 2026;
  const anoStr = String(anoExercicio);
  const municipioNome = configuracao?.secretaria?.municipio || 'Braúnas';
  const ufSigla = configuracao?.secretaria?.uf || 'MG';
  const coordenadorVisa = configuracao?.secretaria?.coordenadorVisa || 'Matheus Henrique Macieira';

  // Base completa sem registros excluídos
  const baseGeral = useMemo(() => {
    return estabelecimentos.filter(e => !e.isDeleted);
  }, [estabelecimentos]);

  // Formatação de data DD/MM/AAAA
  const formatarData = (dataStr?: string) => {
    if (!dataStr) return 'Não registrada';
    const [ano, mes, dia] = dataStr.split('-');
    if (ano && mes && dia) {
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  };

  // Classificação do alvará para cada estabelecimento
  const classificarAlvara = (est: Estabelecimento) => {
    if (est.situacaoAlvara === 'Isento/Dispensado') {
      return { 
        tipo: 'isento' as const, 
        label: 'Isento / Dispensado', 
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' 
      };
    }
    if (est.dataValidadeAlvara) {
      if (est.dataValidadeAlvara >= hojeISO) {
        return { 
          tipo: 'vigente' as const, 
          label: `Vigente até ${formatarData(est.dataValidadeAlvara)}`, 
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium' 
        };
      }
      return { 
        tipo: 'vencido' as const, 
        label: `Vencido em ${formatarData(est.dataValidadeAlvara)}`, 
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 font-bold' 
      };
    }
    if (est.situacaoAlvara === 'Válido') {
      return { 
        tipo: 'vigente' as const, 
        label: 'Alvará Válido', 
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium' 
      };
    }
    if (est.situacaoAlvara === 'Vencido') {
      return { 
        tipo: 'vencido' as const, 
        label: 'Alvará Vencido', 
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 font-bold' 
      };
    }
    return { 
      tipo: 'sem_alvara' as const, 
      label: 'Pendente / Sem Alvará', 
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-medium' 
    };
  };

  // Cálculos de KPIs Estratégicos
  const totalGeral = baseGeral.length;
  const totalAtivos = baseGeral.filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso').length;
  const totalInativos = baseGeral.filter(e => e.situacaoEstabelecimento === 'Inativo').length;

  const totalRisco1 = baseGeral.filter(e => e.nivelRisco === 'Risco I').length;
  const totalRisco2 = baseGeral.filter(e => e.nivelRisco === 'Risco II').length;
  const totalRisco3 = baseGeral.filter(e => e.nivelRisco === 'Risco III').length;

  const pctRisco1 = totalGeral > 0 ? (totalRisco1 / totalGeral) * 100 : 0;
  const pctRisco2 = totalGeral > 0 ? (totalRisco2 / totalGeral) * 100 : 0;
  const pctRisco3 = totalGeral > 0 ? (totalRisco3 / totalGeral) * 100 : 0;

  const alvarasVigentes = baseGeral.filter(e => {
    const s = classificarAlvara(e);
    return s.tipo === 'vigente';
  }).length;

  const alvarasVencidos = baseGeral.filter(e => {
    const s = classificarAlvara(e);
    return s.tipo === 'vencido';
  }).length;

  const alvarasSemAlvara = baseGeral.filter(e => {
    const s = classificarAlvara(e);
    return s.tipo === 'sem_alvara' || s.tipo === 'isento';
  }).length;

  const pctAlvaraVigente = totalAtivos > 0 ? (alvarasVigentes / totalAtivos) * 100 : 0;
  const pctAlvaraVencido = totalAtivos > 0 ? (alvarasVencidos / totalAtivos) * 100 : 0;
  const pctAlvaraSemAlvara = totalAtivos > 0 ? (alvarasSemAlvara / totalAtivos) * 100 : 0;

  // Cobertura de Fiscalização 2026
  const inspecionados2026 = baseGeral.filter(e => 
    (e.dataUltimaInspecaoInicio && e.dataUltimaInspecaoInicio.startsWith(anoStr)) ||
    (e.dataUltimaInspecaoFim && e.dataUltimaInspecaoFim.startsWith(anoStr))
  ).length;

  const pctCobertura2026 = totalAtivos > 0 ? (inspecionados2026 / totalAtivos) * 100 : 0;

  // Filtragem da tabela
  const estabelecimentosFiltrados = useMemo(() => {
    return baseGeral.filter(est => {
      // Busca livre
      const termo = searchTerm.toLowerCase().trim();
      const matchSearch = !termo || 
        est.razaoSocial.toLowerCase().includes(termo) ||
        (est.nomeFantasia && est.nomeFantasia.toLowerCase().includes(termo)) ||
        (est.cnpj && est.cnpj.toLowerCase().includes(termo)) ||
        (est.cnpjCpf && est.cnpjCpf.toLowerCase().includes(termo)) ||
        (est.cnaeCodigo && est.cnaeCodigo.toLowerCase().includes(termo)) ||
        (est.cnaeDescricao && est.cnaeDescricao.toLowerCase().includes(termo)) ||
        (est.endereco?.bairro && est.endereco.bairro.toLowerCase().includes(termo));

      // Filtro de Risco
      const matchRisco = filtroRisco === 'todos' || est.nivelRisco === filtroRisco;

      // Filtro de Alvará
      const alvaraInfo = classificarAlvara(est);
      const matchAlvara = filtroAlvara === 'todos' || 
        (filtroAlvara === 'vigente' && alvaraInfo.tipo === 'vigente') ||
        (filtroAlvara === 'vencido' && alvaraInfo.tipo === 'vencido') ||
        (filtroAlvara === 'sem_alvara' && (alvaraInfo.tipo === 'sem_alvara' || alvaraInfo.tipo === 'isento'));

      // Filtro de Status
      const isAtivo = est.situacaoEstabelecimento === 'Ativo' || est.situacaoEstabelecimento === 'Suspenso';
      const matchStatus = filtroStatus === 'todos' || 
        (filtroStatus === 'ativo' && isAtivo) ||
        (filtroStatus === 'inativo' && !isAtivo);

      return matchSearch && matchRisco && matchAlvara && matchStatus;
    });
  }, [baseGeral, searchTerm, filtroRisco, filtroAlvara, filtroStatus, hojeISO]);

  const handleImprimir = () => {
    window.print();
  };

  const limparFiltros = () => {
    setSearchTerm('');
    setFiltroRisco('todos');
    setFiltroAlvara('todos');
    setFiltroStatus('todos');
  };

  const temFiltroAtivo = searchTerm !== '' || filtroRisco !== 'todos' || filtroAlvara !== 'todos' || filtroStatus !== 'todos';

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
              RELATÓRIO CONSOLIDADO DO CADASTRO DE ESTABELECIMENTOS
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-300 px-2 py-1 rounded">
              PROGRAMA VIGIMINAS {anoExercicio}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Emissão: {hoje.toLocaleDateString('pt-BR')} às {hoje.toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-700 font-mono">
          <span>Total de Empresas Cadastradas: <strong>{totalGeral} ({totalAtivos} ativas, {totalInativos} baixadas)</strong></span>
          <span>Cobertura Fiscal {anoExercicio}: <strong>{pctCobertura2026.toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CABEÇALHO EXECUTIVO INSTITUCIONAL                           */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm print:hidden">
        {/* Glow decorativo */}
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800/80">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                VigiMinas • Gestão Cadastral Master
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Exercício {anoExercicio}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium">
                Município: {municipioNome} / {ufSigla}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 font-mono">
                Emissão: {hoje.toLocaleDateString('pt-BR')}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-blue-400 shrink-0" strokeWidth={2.2} />
              Relatório Consolidado de Empresas Cadastradas
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Panorama Geral da Base Sanitária Municipal, Regularidade de Alvarás e Cobertura Fiscal.
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Novo Estabelecimento
            </Link>

            <button
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Imprimir ou Salvar PDF oficial"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório Oficial
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BLOCO 1: KPIS ESTRATÉGICOS (5 CARDS NO TOPO)                 */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total de Estabelecimentos */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total de Estabelecimentos</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalGeral}</span>
              <span className="text-xs text-slate-500 font-medium">cadastros</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {totalAtivos} Ativos
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {totalInativos} Inativos
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Risco Sanitário I / II / III */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Risco Sanitário I / II / III</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black text-base text-slate-900">
              <span className="text-emerald-700">{totalRisco1}</span>
              <span className="text-slate-300">/</span>
              <span className="text-purple-700">{totalRisco2}</span>
              <span className="text-slate-300">/</span>
              <span className="text-rose-700">{totalRisco3}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">R1: {totalRisco1}</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">R2: {totalRisco2}</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">R3: {totalRisco3}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Alvarás Sanitários Vigentes */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Alvarás Vigentes</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">{alvarasVigentes}</span>
              <span className="text-xs text-slate-500 font-medium">regulares</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 font-medium">
              <strong>{pctAlvaraVigente.toFixed(1)}%</strong> da base ativa regularizada.
            </p>
          </div>
        </div>

        {/* Card 4: Alvarás Vencidos / Pendentes */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Alvarás Vencidos / Pendentes</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-black ${alvarasVencidos + alvarasSemAlvara > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {alvarasVencidos + alvarasSemAlvara}
              </span>
              <span className="text-xs text-slate-500 font-medium">pendências</span>
            </div>
            <div className="mt-2 text-[10px] text-rose-700 font-medium flex items-center gap-1">
              <span>{alvarasVencidos} vencidos • {alvarasSemAlvara} sem alvará</span>
            </div>
          </div>
        </div>

        {/* Card 5: Cobertura de Inspeção 2026 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Cobertura Fiscal ({anoExercicio})</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-teal-700">
                {pctCobertura2026.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">cobertos</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 font-medium">
              {inspecionados2026} de {totalAtivos} ativas vistoriadas no ano.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BLOCO 2: TERMÔMETROS VISUAIS DE REGULARIDADE E PERFIL        */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Painel A: Distribuição por Nível de Risco */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Distribuição por Nível de Risco Sanitário
                </h3>
                <p className="text-[11px] text-slate-500">
                  Classificação da base municipal conforme Resolução SES/MG nº 10.917/2026
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              {totalGeral} empresas
            </span>
          </div>

          {/* Barra empilhada colorida */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${pctRisco1}%` }}
                title={`Risco I (Baixo): ${totalRisco1} (${pctRisco1.toFixed(1)}%)`}
              />
              <div 
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${pctRisco2}%` }}
                title={`Risco II (Médio): ${totalRisco2} (${pctRisco2.toFixed(1)}%)`}
              />
              <div 
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${pctRisco3}%` }}
                title={`Risco III (Alto): ${totalRisco3} (${pctRisco3.toFixed(1)}%)`}
              />
            </div>
          </div>

          {/* Legenda detalhada */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Risco I (Baixo)
              </div>
              <p className="text-base font-black text-emerald-900 mt-1">{totalRisco1}</p>
              <p className="text-[10px] text-emerald-700 font-mono">{pctRisco1.toFixed(1)}% da base</p>
            </div>

            <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200/80">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-800">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Risco II (Médio)
              </div>
              <p className="text-base font-black text-purple-900 mt-1">{totalRisco2}</p>
              <p className="text-[10px] text-purple-700 font-mono">{pctRisco2.toFixed(1)}% da base</p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-800">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Risco III (Alto)
              </div>
              <p className="text-base font-black text-rose-900 mt-1">{totalRisco3}</p>
              <p className="text-[10px] text-rose-700 font-mono">{pctRisco3.toFixed(1)}% da base</p>
            </div>
          </div>
        </div>

        {/* Painel B: Situação dos Alvarás Sanitários */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Situação dos Alvarás Sanitários
                </h3>
                <p className="text-[11px] text-slate-500">
                  Auditoria de validade documental da base econômica ativa
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              {totalAtivos} ativas
            </span>
          </div>

          {/* Barra empilhada colorida */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${pctAlvaraVigente}%` }}
                title={`Vigentes: ${alvarasVigentes} (${pctAlvaraVigente.toFixed(1)}%)`}
              />
              <div 
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${pctAlvaraVencido}%` }}
                title={`Vencidos: ${alvarasVencidos} (${pctAlvaraVencido.toFixed(1)}%)`}
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${pctAlvaraSemAlvara}%` }}
                title={`Sem Alvará / Pendentes: ${alvarasSemAlvara} (${pctAlvaraSemAlvara.toFixed(1)}%)`}
              />
            </div>
          </div>

          {/* Legenda detalhada */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Vigentes
              </div>
              <p className="text-base font-black text-emerald-900 mt-1">{alvarasVigentes}</p>
              <p className="text-[10px] text-emerald-700 font-mono">{pctAlvaraVigente.toFixed(1)}% ativas</p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-800">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Vencidos
              </div>
              <p className="text-base font-black text-rose-900 mt-1">{alvarasVencidos}</p>
              <p className="text-[10px] text-rose-700 font-mono">{pctAlvaraVencido.toFixed(1)}% ativas</p>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Sem Alvará / Pendente
              </div>
              <p className="text-base font-black text-amber-900 mt-1">{alvarasSemAlvara}</p>
              <p className="text-[10px] text-amber-700 font-mono">{pctAlvaraSemAlvara.toFixed(1)}% ativas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. BLOCO 3: BARRA DE FILTROS OPERACIONAIS (print:hidden)        */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm print:hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Filtros de Pesquisa e Segmentação
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600">
              Exibindo <strong>{estabelecimentosFiltrados.length}</strong> de <strong>{totalGeral}</strong> estabelecimentos
            </span>
            {temFiltroAtivo && (
              <button
                onClick={limparFiltros}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline ml-2 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Busca Textual */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Razão, Fantasia, CNPJ ou Bairro..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>

          {/* Dropdown Risco */}
          <div>
            <select
              value={filtroRisco}
              onChange={e => setFiltroRisco(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
            >
              <option value="todos">Todos os Riscos Sanitários</option>
              <option value="Risco I">Risco I (Baixo Risco)</option>
              <option value="Risco II">Risco II (Médio Risco)</option>
              <option value="Risco III">Risco III (Alto Risco)</option>
            </select>
          </div>

          {/* Dropdown Situação Alvará */}
          <div>
            <select
              value={filtroAlvara}
              onChange={e => setFiltroAlvara(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
            >
              <option value="todos">Todas as Situações de Alvará</option>
              <option value="vigente">Alvarás Vigentes</option>
              <option value="vencido">Alvarás Vencidos</option>
              <option value="sem_alvara">Sem Alvará / Pendentes</option>
            </select>
          </div>

          {/* Dropdown Status Cadastral */}
          <div>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
            >
              <option value="todos">Todos os Status Cadastrais</option>
              <option value="ativo">Apenas Ativos</option>
              <option value="inativo">Apenas Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. BLOCO 4: TABELA ANALÍTICA COMPLETA                           */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Estabelecimento / Razão Social</th>
                <th className="py-3 px-4">CNPJ / CPF</th>
                <th className="py-3 px-4">Risco Sanitário</th>
                <th className="py-3 px-4">CNAE Principal</th>
                <th className="py-3 px-4">Situação</th>
                <th className="py-3 px-4">Validade do Alvará</th>
                <th className="py-3 px-4">Última Inspeção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estabelecimentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum estabelecimento encontrado com os filtros selecionados</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tente alterar os termos de busca ou redefinir os parâmetros de filtragem.
                    </p>
                    {temFiltroAtivo && (
                      <button
                        onClick={limparFiltros}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        Limpar Todos os Filtros
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                estabelecimentosFiltrados.map(est => {
                  const alvara = classificarAlvara(est);
                  const isAtivo = est.situacaoEstabelecimento === 'Ativo' || est.situacaoEstabelecimento === 'Suspenso';
                  const dataUltimaInspecao = est.dataUltimaInspecaoInicio || est.dataUltimaInspecaoFim;

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
                        {est.endereco?.bairro && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {est.endereco.bairro} - {est.endereco.municipio || 'Braúnas/MG'}
                          </div>
                        )}
                      </td>

                      {/* CNPJ / CPF */}
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {est.cnpj || est.cnpjCpf || 'Não informado'}
                      </td>

                      {/* Nível de Risco */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {est.nivelRisco === 'Risco I' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Risco I
                          </span>
                        )}
                        {est.nivelRisco === 'Risco II' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                            Risco II
                          </span>
                        )}
                        {est.nivelRisco === 'Risco III' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Risco III
                          </span>
                        )}
                      </td>

                      {/* CNAE Principal */}
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {est.cnaeCodigo}
                        </span>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={est.cnaeDescricao}>
                          {est.cnaeDescricao}
                        </p>
                      </td>

                      {/* Situação Cadastral */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAtivo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {est.situacaoEstabelecimento || 'Ativo'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Validade do Alvará */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${alvara.badgeClass}`}>
                          {alvara.label}
                        </span>
                      </td>

                      {/* Última Inspeção */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-mono">
                        {dataUltimaInspecao ? (
                          <span className="font-semibold text-slate-900">
                            {formatarData(dataUltimaInspecao)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            Nunca inspecionado
                          </span>
                        )}
                      </td>
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
            Exibindo <strong>{estabelecimentosFiltrados.length}</strong> de <strong>{totalGeral}</strong> estabelecimentos cadastrados.
          </span>
          <span>
            Base Ativa: <strong>{totalAtivos}</strong> • Baixadas: <strong>{totalInativos}</strong>
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. RODAPÉ INSTITUCIONAL COM ASSINATURAS (Para Impressão)       */}
      {/* ============================================================== */}
      <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1 print:pt-8 print:text-black">
        <p className="font-semibold text-slate-600 print:text-slate-800">
          VigiMinas • Sistema Integrado de Gestão da Vigilância Sanitária Municipal
        </p>
        <p className="text-[11px]">
          Base cadastral municipal consolidada em conformidade com as diretrizes do Programa VigiMinas.
        </p>

        {/* Bloco de Assinaturas (Visível somente na impressão física) */}
        <div className="hidden print:grid grid-cols-2 gap-12 mt-16 pt-8 text-center text-slate-800">
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-xs">{coordenadorVisa}</p>
            <p className="text-[10px] text-slate-600">Coordenador Municipal de Vigilância Sanitária</p>
            <p className="text-[9px] text-slate-500 font-mono">Portaria de Nomeação Municipal</p>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-xs">Responsável pelo Cadastro Sanitário</p>
            <p className="text-[10px] text-slate-600">Setor de Regulação e Fiscalização Sanitária</p>
            <p className="text-[9px] text-slate-500 font-mono">Matrícula / Registro Profissional</p>
          </div>
        </div>
      </div>
    </div>
  );
};
