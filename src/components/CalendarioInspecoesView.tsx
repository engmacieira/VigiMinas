import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  HardHat, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  GripVertical, 
  Plus, 
  CalendarDays, 
  Filter, 
  X, 
  ClipboardCheck, 
  ArrowRight,
  Eye,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { 
  Estabelecimento, 
  NivelRisco 
} from '../types/vigiminas';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { formatarDataBr } from '../services/vigiminasService';

interface CalendarioInspecoesViewProps {
  onRegistrarInspecaoRapida: (est: Estabelecimento) => void;
  onEditarEstabelecimento: (est: Estabelecimento) => void;
  onNovoEstabelecimento: () => void;
}

const getRiscoEstilo = (risco: NivelRisco) => {
  switch (risco) {
    case 'Risco I':
      return {
        bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
        dot: 'bg-emerald-600',
        badge: 'bg-emerald-100 text-emerald-800'
      };
    case 'Risco II':
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-300',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-900'
      };
    case 'Risco III':
      return {
        bg: 'bg-rose-50 text-rose-950 border-rose-300',
        dot: 'bg-rose-600',
        badge: 'bg-rose-100 text-rose-900'
      };
  }
};

export const CalendarioInspecoesView: React.FC<CalendarioInspecoesViewProps> = React.memo(({
  onRegistrarInspecaoRapida,
  onEditarEstabelecimento,
  onNovoEstabelecimento
}) => {
  const { estabelecimentos, salvarEstabelecimento, showToast } = useVigiMinas();

  // Data atual de navegação do calendário (mês/ano)
  const [dataNavegacao, setDataNavegacao] = useState<Date>(() => new Date());
  const [busca, setBusca] = useState('');
  const [filtroRisco, setFiltroRisco] = useState<string>('todos');
  const [diaHover, setDiaHover] = useState<string | null>(null);
  const [itemArrastando, setItemArrastando] = useState<string | null>(null);

  // Modal de detalhes ou agendamento manual
  const [estSelecionado, setEstSelecionado] = useState<Estabelecimento | null>(null);
  const [modalManualAberto, setModalManualAberto] = useState(false);
  const [dataManualInput, setDataManualInput] = useState('');

  // Nomes dos dias da semana e meses em português (constantes memorizadas)
  const diasSemana = useMemo(() => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], []);
  const meses = useMemo(() => [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ], []);

  const anoAtual = dataNavegacao.getFullYear();
  const mesAtual = dataNavegacao.getMonth();

  // Handlers de Navegação do Mês
  const handleMesAnterior = useCallback(() => {
    setDataNavegacao(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleMesSeguinte = useCallback(() => {
    setDataNavegacao(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleHoje = useCallback(() => {
    setDataNavegacao(new Date());
  }, []);

  // Atalho de Teclado (Escape para fechar o modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalManualAberto) {
        setModalManualAberto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalManualAberto]);

  // Cálculo da grade mensal de dias
  const diasDoMes = useMemo(() => {
    const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
    const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0);

    const diaSemanaInicio = primeiroDiaMes.getDay(); // 0 (Dom) a 6 (Sáb)
    const totalDiasMes = ultimoDiaMes.getDate();

    const dias: {
      data: Date;
      dataIso: string;
      diaNumero: number;
      isMesAtual: boolean;
      isHoje: boolean;
    }[] = [];

    const hojeStr = new Date().toISOString().split('T')[0];

    // Dias do mês anterior para preencher a primeira semana
    const ultimoDiaMesAnterior = new Date(anoAtual, mesAtual, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtual - 1, ultimoDiaMesAnterior - i);
      const iso = d.toISOString().split('T')[0];
      dias.push({
        data: d,
        dataIso: iso,
        diaNumero: d.getDate(),
        isMesAtual: false,
        isHoje: iso === hojeStr
      });
    }

    // Dias do mês atual
    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const iso = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      dias.push({
        data: new Date(anoAtual, mesAtual, dia),
        dataIso: iso,
        diaNumero: dia,
        isMesAtual: true,
        isHoje: iso === hojeStr
      });
    }

    // Dias do mês seguinte para completar as 5 ou 6 semanas (múltiplo de 7)
    const restante = (7 - (dias.length % 7)) % 7;
    for (let dia = 1; dia <= restante; dia++) {
      const d = new Date(anoAtual, mesAtual + 1, dia);
      const iso = d.toISOString().split('T')[0];
      dias.push({
        data: d,
        dataIso: iso,
        diaNumero: dia,
        isMesAtual: false,
        isHoje: iso === hojeStr
      });
    }

    return dias;
  }, [anoAtual, mesAtual]);

  // Agrupamento de estabelecimentos por data de inspeção
  const estabelecimentosPorData = useMemo(() => {
    const mapa = new Map<string, Estabelecimento[]>();

    for (let i = 0; i < estabelecimentos.length; i++) {
      const est = estabelecimentos[i];
      if (!est.isDeleted && est.dataProximaInspecao) {
        const dataKey = est.dataProximaInspecao.split('T')[0];
        const lista = mapa.get(dataKey) || [];
        lista.push(est);
        mapa.set(dataKey, lista);
      }
    }

    return mapa;
  }, [estabelecimentos]);

  // Estabelecimentos Pendentes (Sem inspeção agendada para o futuro ou sem data definida)
  const pendentes = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const termoLimpo = termo.replace(/\D/g, '');
    const hojeStr = new Date().toISOString().split('T')[0];

    const prioridade: Record<NivelRisco, number> = {
      'Risco III': 3,
      'Risco II': 2,
      'Risco I': 1
    };

    return estabelecimentos
      .filter(est => {
        if (est.isDeleted) return false;

        const matchBusca = !termo ||
          est.razaoSocial.toLowerCase().includes(termo) ||
          (est.nomeFantasia && est.nomeFantasia.toLowerCase().includes(termo)) ||
          (termoLimpo && est.cnpjCpf.replace(/\D/g, '').includes(termoLimpo)) ||
          (est.endereco?.bairro && est.endereco.bairro.toLowerCase().includes(termo));

        const matchRisco = filtroRisco === 'todos' || est.nivelRisco === filtroRisco;

        const semDataFutura = !est.dataProximaInspecao || est.dataProximaInspecao < hojeStr;

        return (est.situacaoEstabelecimento === 'Ativo' || est.situacaoEstabelecimento === 'Suspenso') && semDataFutura && matchBusca && matchRisco;
      })
      .sort((a, b) => prioridade[b.nivelRisco] - prioridade[a.nivelRisco]);
  }, [estabelecimentos, busca, filtroRisco]);

  // Estatísticas do Mês
  const estatisticasMes = useMemo(() => {
    const prefixoMes = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}`;
    let totalAgendadasMes = 0;
    let riscoIII = 0;
    let riscoII = 0;
    let riscoI = 0;

    for (let i = 0; i < estabelecimentos.length; i++) {
      const est = estabelecimentos[i];
      if (!est.isDeleted && est.dataProximaInspecao && est.dataProximaInspecao.startsWith(prefixoMes)) {
        totalAgendadasMes++;
        if (est.nivelRisco === 'Risco III') riscoIII++;
        else if (est.nivelRisco === 'Risco II') riscoII++;
        else if (est.nivelRisco === 'Risco I') riscoI++;
      }
    }

    return { totalAgendadasMes, riscoIII, riscoII, riscoI };
  }, [estabelecimentos, anoAtual, mesAtual]);

  // Função central para reagendar / agendar para uma data específica
  const handleAgendarParaData = useCallback(async (estId: string, dataIso: string) => {
    const est = estabelecimentos.find(e => e.id === estId);
    if (!est) return;

    const dataFormatada = formatarDataBr(dataIso);

    try {
      const estAtualizado: Estabelecimento = {
        ...est,
        dataProximaInspecao: dataIso,
        updatedAt: new Date().toISOString()
      };

      await salvarEstabelecimento(estAtualizado);
      showToast(`Inspeção de "${est.razaoSocial}" agendada para ${dataFormatada}!`);
    } catch (err) {
      console.error('Falha ao agendar inspeção:', err);
      showToast('Erro ao atualizar agendamento no banco de dados.');
    } finally {
      setDiaHover(null);
      setItemArrastando(null);
    }
  }, [estabelecimentos, salvarEstabelecimento, showToast]);

  // Desagendar / remover data
  const handleDesagendar = useCallback(async (est: Estabelecimento) => {
    try {
      const estAtualizado: Estabelecimento = {
        ...est,
        dataProximaInspecao: '',
        updatedAt: new Date().toISOString()
      };
      await salvarEstabelecimento(estAtualizado);
      showToast(`Inspeção de "${est.razaoSocial}" removida do calendário (retornou para pendentes).`);
      setEstSelecionado(null);
    } catch (err) {
      console.error('Falha ao desagendar:', err);
      showToast('Erro ao remover agendamento.');
    }
  }, [salvarEstabelecimento, showToast]);

  // Handlers de Drag and Drop Nativo Memorizados
  const handleDragStart = useCallback((e: React.DragEvent, estId: string) => {
    e.dataTransfer.setData('text/plain', estId);
    e.dataTransfer.effectAllowed = 'move';
    setItemArrastando(estId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dataIso: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDiaHover(prev => (prev !== dataIso ? dataIso : prev));
  }, []);

  const handleDragLeave = useCallback((dataIso: string) => {
    setDiaHover(prev => (prev === dataIso ? null : prev));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dataIso: string) => {
    e.preventDefault();
    const estId = e.dataTransfer.getData('text/plain') || itemArrastando;
    if (estId) {
      await handleAgendarParaData(estId, dataIso);
    }
    setDiaHover(null);
    setItemArrastando(null);
  }, [itemArrastando, handleAgendarParaData]);

  const handleAbrirAgendamentoManual = useCallback((est: Estabelecimento) => {
    setEstSelecionado(est);
    setDataManualInput(est.dataProximaInspecao || new Date().toISOString().split('T')[0]);
    setModalManualAberto(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra Superior do Módulo de Calendário */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CalendarDays className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Calendário e Agendamento de Inspeções Sanitárias
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Arraste os estabelecimentos pendentes para qualquer dia do mês ou reagende vistorias existentes
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Navegação de Mês */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleHoje}
            aria-label="Ir para o mês atual"
            className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-300 cursor-pointer active:scale-[0.98]"
          >
            Mês Atual
          </button>

          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={handleMesAnterior}
              aria-label="Mês anterior"
              className="p-2 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-3 min-w-[130px] text-center">
              {meses[mesAtual]} de {anoAtual}
            </span>
            <button
              type="button"
              onClick={handleMesSeguinte}
              aria-label="Mês seguinte"
              className="p-2 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onNovoEstabelecimento}
            aria-label="Cadastrar Novo Estabelecimento"
            className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Cadastro</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo & Estatísticas de Agendamento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
            Agendadas em {meses[mesAtual]}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{estatisticasMes.totalAgendadasMes}</span>
            <span className="text-[11px] text-slate-500">vistorias</span>
          </div>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Risco III (Alto Risco)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-rose-950">{estatisticasMes.riscoIII}</span>
            <span className="text-[11px] text-rose-700">meta 100%</span>
          </div>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Risco II (Médio)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-950">{estatisticasMes.riscoII}</span>
            <span className="text-[11px] text-amber-700">agendadas</span>
          </div>
        </div>

        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide block flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            Pendentes de Data
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-blue-950">{pendentes.length}</span>
            <span className="text-[11px] text-blue-700">estabelecimentos</span>
          </div>
        </div>
      </div>

      {/* Grade Principal: Coluna de Pendentes (Drag Source) + Calendário Mensal (Drop Target) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLUNA ESQUERDA: ESTABELECIMENTOS PENDENTES */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col h-[750px]">
          
          <div className="pb-3 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Inspeções Pendentes
                </h3>
                <p className="text-[11px] text-slate-500">
                  Arraste qualquer cartão para o dia desejado no calendário
                </p>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {pendentes.length}
              </span>
            </div>

            {/* Campo de Busca de Pendentes */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-busca-pendentes"
                aria-label="Buscar estabelecimentos pendentes"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por nome, CNPJ ou bairro..."
                className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-slate-800"
              />
            </div>

            {/* Filtro Rápido de Risco */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {['todos', 'Risco III', 'Risco II', 'Risco I'].map(risco => (
                <button
                  key={risco}
                  type="button"
                  onClick={() => setFiltroRisco(risco)}
                  className={`px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer whitespace-nowrap ${
                    filtroRisco === risco
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {risco === 'todos' ? 'Todos os Riscos' : risco}
                </button>
              ))}
            </div>
          </div>

          {/* Lista com Scroll de Pendentes */}
          <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
            {pendentes.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Tudo em dia!</p>
                <p className="text-[11px] text-slate-400">
                  Nenhum estabelecimento ativo aguardando agendamento com os filtros selecionados.
                </p>
              </div>
            ) : (
              pendentes.map(est => {
                const estilo = getRiscoEstilo(est.nivelRisco);
                const isSelected = estSelecionado?.id === est.id;

                return (
                  <div
                    key={est.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, est.id)}
                    className={`p-3 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-md select-none group bg-white ${
                      isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${estilo.badge}`}>
                            {est.nivelRisco}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">
                            {est.endereco?.bairro || 'Braúnas'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition">
                          {est.razaoSocial}
                        </h4>
                        {est.nomeFantasia && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {est.nomeFantasia}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 truncate mt-1">
                          CNAE: {est.cnaeCodigo} • {est.cnaeDescricao}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span title="Arraste para uma data no calendário" className="p-1.5 text-slate-300 group-hover:text-emerald-600 transition">
                          <GripVertical className="w-4 h-4" />
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAbrirAgendamentoManual(est)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition cursor-pointer"
                        >
                          Agendar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Dica: segure e arraste o card para o calendário</span>
            <span className="font-mono text-[10px] text-slate-400">HTML5 D&D</span>
          </div>
        </div>

        {/* COLUNA DIREITA: GRADE DO CALENDÁRIO MENSAL */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col">
          
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {diasSemana.map((dia, idx) => (
              <div 
                key={dia} 
                className={`text-center py-2 text-xs font-bold uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-700'
                }`}
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Grade dos Dias do Mês */}
          <div className="grid grid-cols-7 gap-2 flex-1">
            {diasDoMes.map(diaInfo => {
              const estDoDia = estabelecimentosPorData.get(diaInfo.dataIso) || [];
              const isDropTarget = diaHover === diaInfo.dataIso;

              return (
                <div
                  key={diaInfo.dataIso}
                  onDragOver={(e) => handleDragOver(e, diaInfo.dataIso)}
                  onDragLeave={() => handleDragLeave(diaInfo.dataIso)}
                  onDrop={(e) => handleDrop(e, diaInfo.dataIso)}
                  className={`min-h-[110px] p-2 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                    isDropTarget
                      ? 'bg-emerald-100/70 border-emerald-500 border-2 border-dashed shadow-inner scale-[1.02]'
                      : diaInfo.isMesAtual
                        ? 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/90'
                        : 'bg-slate-100/30 text-slate-300 border-slate-100'
                  }`}
                >
                  {/* Topo do Dia */}
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        diaInfo.isHoje
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : diaInfo.isMesAtual
                            ? 'text-slate-800'
                            : 'text-slate-400'
                      }`}
                    >
                      {diaInfo.diaNumero}
                    </span>

                    {estDoDia.length > 0 && (
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                        {estDoDia.length}
                      </span>
                    )}
                  </div>

                  {/* Lista de Vistorias Agendadas para o Dia */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
                    {estDoDia.map(est => {
                      const estilo = getRiscoEstilo(est.nivelRisco);

                      return (
                        <div
                          key={est.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, est.id)}
                          onClick={() => handleAbrirAgendamentoManual(est)}
                          title={`Inspeção prevista: ${est.razaoSocial} (${est.nivelRisco})\nClique para detalhes ou arraste para outro dia`}
                          className={`p-1.5 rounded-lg border text-[11px] font-semibold cursor-grab active:cursor-grabbing hover:shadow-xs transition duration-150 flex items-center justify-between gap-1 group ${estilo.bg}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estilo.dot}`} />
                            <span className="truncate">{est.razaoSocial}</span>
                          </div>
                          <span className="text-[9px] uppercase px-1 rounded bg-white/80 shrink-0 font-bold opacity-80 group-hover:opacity-100">
                            {est.nivelRisco.replace('Risco ', 'R')}
                          </span>
                        </div>
                      );
                    })}

                    {isDropTarget && (
                      <div className="p-1 rounded-lg border border-dashed border-emerald-500 bg-emerald-50 text-[10px] text-center text-emerald-800 font-bold animate-pulse">
                        Soltar para agendar
                      </div>
                    )}
                  </div>

                  {/* Indicador de Ação Rápida no hover do dia vazio */}
                  {estDoDia.length === 0 && !isDropTarget && diaInfo.isMesAtual && (
                    <div className="text-[10px] text-slate-300 text-center opacity-0 hover:opacity-100 transition">
                      Arraste aqui
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legenda do Calendário */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-slate-500 font-semibold">Legenda de Risco:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span className="text-slate-700">Risco III (Alto)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-700">Risco II (Médio)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-700">Risco I (Baixo)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Clique no card agendado para registrar inspeção ou reagendar</span>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL DE DETALHES / REAGENDAMENTO */}
      {modalManualAberto && estSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-agendamento-titulo"
          >
            {/* Topo do Modal */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CalendarDays className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 id="modal-agendamento-titulo" className="text-base font-bold text-slate-900">
                    Agendamento de Inspeção
                  </h3>
                  <p className="text-xs text-slate-500">
                    {estSelecionado.razaoSocial}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalManualAberto(false)}
                aria-label="Fechar modal"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Informações Resumidas do Estabelecimento */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    {estSelecionado.nomeFantasia || estSelecionado.razaoSocial}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    estSelecionado.nivelRisco === 'Risco III'
                      ? 'bg-rose-100 text-rose-900 border border-rose-200'
                      : estSelecionado.nivelRisco === 'Risco II'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}>
                    {estSelecionado.nivelRisco}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1">
                  <div>
                    <span className="font-semibold block text-slate-400">CNPJ / CPF:</span>
                    <span className="font-mono text-slate-700">{estSelecionado.cnpjCpf}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400">Situação do Alvará:</span>
                    <span className="font-bold text-slate-800">{estSelecionado.situacaoAlvara}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400">Bairro:</span>
                    <span className="text-slate-700">{estSelecionado.endereco?.bairro || 'Braúnas/MG'}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400">Última Inspeção:</span>
                    <span className="text-slate-700">
                      {estSelecionado.dataUltimaInspecaoFim 
                        ? formatarDataBr(estSelecionado.dataUltimaInspecaoFim) 
                        : 'Nunca inspecionado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seletor Manual de Data */}
              <div className="space-y-1.5">
                <label htmlFor="input-data-manual-inspecao" className="text-xs font-bold text-slate-700 block">
                  Data Prevista para a Inspeção Sanitária:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="input-data-manual-inspecao"
                    value={dataManualInput}
                    onChange={(e) => setDataManualInput(e.target.value)}
                    className="w-full h-11 px-3 text-xs rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Ao salvar, o agendamento será exibido automaticamente no dia selecionado do calendário.
                </p>
              </div>

              {/* Botão de Ação Rápida: Registrar Inspeção Já Realizada */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Já realizou esta vistoria?</span>
                  <span className="text-[11px] text-slate-500">
                    Registre a inspeção concluída e atualize o alvará sanitário
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalManualAberto(false);
                    onRegistrarInspecaoRapida(estSelecionado);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                  <span>Concluir Inspeção</span>
                </button>
              </div>

            </div>

            {/* Rodapé de Ações do Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {estSelecionado.dataProximaInspecao ? (
                <button
                  type="button"
                  onClick={() => handleDesagendar(estSelecionado)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Desagendar / Remover data
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalManualAberto(false)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/70 border border-slate-300 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={!dataManualInput}
                  onClick={async () => {
                    await handleAgendarParaData(estSelecionado.id, dataManualInput);
                    setModalManualAberto(false);
                  }}
                  className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
});

CalendarioInspecoesView.displayName = 'CalendarioInspecoesView';
