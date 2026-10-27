import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Edit3, 
  HardHat, 
  Trash2, 
  ClipboardCheck, 
  MapPin, 
  Filter,
  FileSpreadsheet,
  Upload,
  Download,
  CalendarDays,
  X,
  RotateCcw,
  Archive,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BellRing
} from 'lucide-react';
import { 
  Estabelecimento, 
  NivelRisco, 
  SituacaoAlvara 
} from '../types/vigiminas';
import { formatarDataBr } from '../services/vigiminasService';

interface EstabelecimentosListProps {
  estabelecimentos: Estabelecimento[];
  onNovoEstabelecimento: () => void;
  onEditarEstabelecimento: (est: Estabelecimento) => void;
  onExcluirEstabelecimento: (id: string, razao: string) => void;
  onExcluirPermanente?: (id: string, razao: string, cnpj?: string) => void;
  onRestaurarEstabelecimento?: (id: string, razao: string) => void;
  onRegistrarInspecaoRapida: (est: Estabelecimento) => void;
  onCriarVaptVinculada: (est: Estabelecimento) => void;
  onExportExcel: () => void;
  onImportarPlanilha: () => void;
  onBaixarModelo?: () => void;
  onAbrirExportacao?: (filtrados: Estabelecimento[]) => void;
  onVerCalendario?: () => void;
  onAbrirAvisoVistoria?: (est: Estabelecimento) => void;
}

const RiscoBadge = React.memo<{ risco: NivelRisco }>(({ risco }) => {
  switch (risco) {
    case 'Risco I':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">Risco I</span>;
    case 'Risco II':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80">Risco II</span>;
    case 'Risco III':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/80">Risco III</span>;
  }
});
RiscoBadge.displayName = 'RiscoBadge';

const AlvaraBadge = React.memo<{ alvara: SituacaoAlvara }>(({ alvara }) => {
  switch (alvara) {
    case 'Válido':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
          Válido
        </span>
      );
    case 'Vencido':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/80">
          <XCircle className="w-3 h-3 text-rose-600" strokeWidth={2.5} />
          Vencido
        </span>
      );
    case 'Isento/Dispensado':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200/80">
          <CheckCircle2 className="w-3 h-3 text-sky-600" strokeWidth={2.5} />
          Dispensado
        </span>
      );
    case 'Não Possui (Irregular)':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" strokeWidth={2.5} />
          Não Possui (Irregular)
        </span>
      );
  }
});
AlvaraBadge.displayName = 'AlvaraBadge';

// Subcomponente Puro memorizado para linha de estabelecimento arquivado
interface EstabelecimentoArchivedTableRowProps {
  est: Estabelecimento;
  onRestaurarEstabelecimento?: (id: string, razao: string) => void;
  onExcluirPermanente?: (id: string, razao: string, cnpj?: string) => void;
}

const EstabelecimentoArchivedTableRow: React.FC<EstabelecimentoArchivedTableRowProps> = React.memo(({
  est,
  onRestaurarEstabelecimento,
  onExcluirPermanente
}) => {
  const handleRestaurar = useCallback(() => {
    if (onRestaurarEstabelecimento) {
      onRestaurarEstabelecimento(est.id, est.razaoSocial);
    }
  }, [onRestaurarEstabelecimento, est.id, est.razaoSocial]);

  const handleExcluirPermanente = useCallback(() => {
    if (onExcluirPermanente) {
      onExcluirPermanente(est.id, est.razaoSocial, est.cnpjCpf);
    }
  }, [onExcluirPermanente, est.id, est.razaoSocial, est.cnpjCpf]);

  return (
    <tr className="hover:bg-amber-50/40 bg-amber-50/20 text-slate-700 transition-colors">
      {/* Identificação com Nome Fantasia em destaque e Razão Social abaixo */}
      <td className="py-3.5 px-4">
        <span className="font-bold text-slate-900 text-xs block">
          {est.nomeFantasia || est.razaoSocial}
        </span>
        {est.nomeFantasia && est.nomeFantasia !== est.razaoSocial ? (
          <span className="text-[11px] text-slate-500 block truncate max-w-xs" title={est.razaoSocial}>
            {est.razaoSocial}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 italic block truncate max-w-xs" title="Razão Social">
            Razão: {est.razaoSocial}
          </span>
        )}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
          <span className="font-mono bg-white px-1 py-0.2 rounded border border-amber-200 text-amber-900">
            {est.cnpjCpf}
          </span>
          {est.identificacaoMunicipal && (
            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 text-[10px]" title="Identificação Municipal">
              IM: {est.identificacaoMunicipal}
            </span>
          )}
          <span>• {est.endereco.bairro}</span>
        </div>
      </td>

      {/* CNAE */}
      <td className="py-3 px-4 max-w-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-semibold text-slate-700 text-[11px]">
            {est.cnaeCodigo}
          </span>
          {est.cnaesSecundarios && est.cnaesSecundarios.length > 0 && (
            <span
              className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200"
              title={`CNAEs Secundários:\n${est.cnaesSecundarios.join('\n')}`}
            >
              +{est.cnaesSecundarios.length} sec.
            </span>
          )}
        </div>
        <span className="text-slate-600 text-[11px] line-clamp-2" title={est.cnaeDescricao}>
          {est.cnaeDescricao}
        </span>
      </td>

      {/* Risco */}
      <td className="py-3 px-4">
        <RiscoBadge risco={est.nivelRisco} />
      </td>

      {/* Justificativa do Arquivamento */}
      <td className="py-3 px-4 max-w-xs">
        <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px]">
          <span className="font-bold text-[10px] uppercase block text-amber-800">Motivo:</span>
          <p className="line-clamp-2 mt-0.5">{est.motivoExclusao || 'Encerramento de atividades / Arquivado'}</p>
        </div>
      </td>

      {/* Data e Operador */}
      <td className="py-3 px-4 text-xs text-slate-600">
        <span className="font-bold text-slate-800 block text-[11px]">
          {est.deletedAt ? formatarDataBr(est.deletedAt.split('T')[0]) : '-'}
        </span>
        <span className="text-[10px] text-slate-500 block truncate max-w-[140px]" title={est.deletedBy}>
          Por: {est.deletedBy || 'Fiscal VISA'}
        </span>
      </td>

      {/* Ações: Restaurar e Excluir */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleRestaurar}
            title="Restaurar cadastro para a base ativa"
            className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar</span>
          </button>

          {onExcluirPermanente && (
            <button
              type="button"
              onClick={handleExcluirPermanente}
              title="Excluir estabelecimento"
              className="min-h-[44px] px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Excluir</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});
EstabelecimentoArchivedTableRow.displayName = 'EstabelecimentoArchivedTableRow';

// Subcomponente Puro memorizado para linha de estabelecimento ativo em Tabela
interface EstabelecimentoTableRowProps {
  est: Estabelecimento;
  onEditarEstabelecimento: (est: Estabelecimento) => void;
  onExcluirEstabelecimento: (id: string, razao: string) => void;
  onRegistrarInspecaoRapida: (est: Estabelecimento) => void;
  onCriarVaptVinculada: (est: Estabelecimento) => void;
  onAbrirAvisoVistoria?: (est: Estabelecimento) => void;
}

const EstabelecimentoTableRow: React.FC<EstabelecimentoTableRowProps> = React.memo(({
  est,
  onEditarEstabelecimento,
  onExcluirEstabelecimento,
  onRegistrarInspecaoRapida,
  onCriarVaptVinculada,
  onAbrirAvisoVistoria
}) => {
  const isInspecionado2026 = useMemo(() => {
    return (est.dataUltimaInspecaoInicio && est.dataUltimaInspecaoInicio.startsWith('2026')) ||
      (est.dataUltimaInspecaoFim && est.dataUltimaInspecaoFim.startsWith('2026'));
  }, [est.dataUltimaInspecaoInicio, est.dataUltimaInspecaoFim]);

  const handleRegistrarInspecao = useCallback(() => {
    onRegistrarInspecaoRapida(est);
  }, [onRegistrarInspecaoRapida, est]);

  const handleCriarVapt = useCallback(() => {
    onCriarVaptVinculada(est);
  }, [onCriarVaptVinculada, est]);

  const handleEditar = useCallback(() => {
    onEditarEstabelecimento(est);
  }, [onEditarEstabelecimento, est]);

  const handleExcluir = useCallback(() => {
    onExcluirEstabelecimento(est.id, est.razaoSocial);
  }, [onExcluirEstabelecimento, est.id, est.razaoSocial]);

  return (
    <tr className={`hover:bg-slate-50/60 transition-colors ${
      est.situacaoEstabelecimento === 'Inativo' ? 'bg-slate-50/40 text-slate-500' : ''
    }`}>
      {/* Identificação com Nome Fantasia em destaque e Razão Social abaixo */}
      <td className="py-3.5 px-4">
        <span className="font-bold text-slate-900 text-xs block">
          {est.nomeFantasia || est.razaoSocial}
        </span>
        {est.nomeFantasia && est.nomeFantasia !== est.razaoSocial ? (
          <span className="text-[11px] text-slate-500 block truncate max-w-xs" title={est.razaoSocial}>
            {est.razaoSocial}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 italic block truncate max-w-xs" title="Razão Social">
            Razão: {est.razaoSocial}
          </span>
        )}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-700">
            {est.cnpjCpf}
          </span>
          {est.identificacaoMunicipal && (
            <span className="font-mono bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200 text-[10px] font-semibold" title="Identificação Municipal">
              IM: {est.identificacaoMunicipal}
            </span>
          )}
          <span>• {est.endereco.bairro}</span>
        </div>
      </td>

      {/* CNAE */}
      <td className="py-3 px-4 max-w-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-semibold text-slate-700 text-[11px]">
            {est.cnaeCodigo}
          </span>
          {est.cnaesSecundarios && est.cnaesSecundarios.length > 0 && (
            <span
              className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              title={`CNAEs Secundários:\n${est.cnaesSecundarios.join('\n')}`}
            >
              +{est.cnaesSecundarios.length} sec.
            </span>
          )}
        </div>
        <span className="text-slate-600 text-[11px] line-clamp-2" title={est.cnaeDescricao}>
          {est.cnaeDescricao}
        </span>
      </td>

      {/* Risco */}
      <td className="py-3 px-4">
        <div className="space-y-1">
          <div><RiscoBadge risco={est.nivelRisco} /></div>
          <div><AlvaraBadge alvara={est.situacaoAlvara} /></div>
        </div>
      </td>

      {/* Inspeção */}
      <td className="py-3 px-4">
        <div className="space-y-0.5">
          <span className="font-medium text-slate-800 text-[11px] block">
            {est.dataUltimaInspecaoInicio ? formatarDataBr(est.dataUltimaInspecaoInicio) : 'Não inspecionado'}
          </span>
          {isInspecionado2026 ? (
            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Exercício 2026
            </span>
          ) : (
            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
              Pendente 2026
            </span>
          )}
        </div>
      </td>

      {/* Situação */}
      <td className="py-3 px-4">
        {est.situacaoEstabelecimento === 'Ativo' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Ativo
          </span>
        ) : est.situacaoEstabelecimento === 'Suspenso' ? (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
              <AlertTriangle className="w-3 h-3 text-amber-700" />
              Suspenso (Interditado)
            </span>
            {est.observacoesBaixa && (
              <p className="text-[10px] text-amber-800 italic max-w-[170px] line-clamp-2" title={est.observacoesBaixa}>
                {est.observacoesBaixa}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-800 border border-slate-300">
              Inativo (Baixado)
            </span>
            {est.observacoesBaixa && (
              <p className="text-[10px] text-slate-500 italic max-w-[170px] line-clamp-2" title={est.observacoesBaixa}>
                {est.observacoesBaixa}
              </p>
            )}
          </div>
        )}
      </td>

      {/* Ações com Touch Targets de 44x44px */}
      <td className="py-3 px-4 text-right">
        <div className="inline-flex items-center gap-1 justify-end">

          <button
            type="button"
            onClick={handleRegistrarInspecao}
            title="Registrar Inspeção Sanitária (Alimenta Indicadores 13, 14 ou 15)"
            aria-label="Registrar Inspeção Sanitária"
            className="min-w-[44px] min-h-[44px] rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition flex items-center justify-center cursor-pointer border border-emerald-200/80 active:scale-95"
          >
            <ClipboardCheck className="w-4 h-4" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={handleCriarVapt}
            title="Lançar Vistoria VAPT (Indicador 11)"
            aria-label="Lançar Vistoria VAPT"
            className="min-w-[44px] min-h-[44px] rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition flex items-center justify-center cursor-pointer border border-teal-200/80 active:scale-95"
          >
            <HardHat className="w-4 h-4" strokeWidth={2} />
          </button>

          {onAbrirAvisoVistoria && (
            <button
              type="button"
              onClick={() => onAbrirAvisoVistoria(est)}
              title="Emitir Aviso de Vistoria Anual"
              aria-label="Emitir Aviso de Vistoria Anual"
              className="min-w-[44px] min-h-[44px] rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition flex items-center justify-center cursor-pointer border border-blue-200/80 active:scale-95"
            >
              <BellRing className="w-4 h-4" strokeWidth={2} />
            </button>
          )}

          <button
            type="button"
            onClick={handleEditar}
            title="Editar Dados Cadastrais"
            aria-label="Editar Dados Cadastrais"
            className="min-w-[44px] min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Edit3 className="w-4 h-4" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={handleExcluir}
            title="Excluir Registro (Soft Delete)"
            aria-label="Excluir Registro"
            className="min-w-[44px] min-h-[44px] rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>

        </div>
      </td>
    </tr>
  );
});
EstabelecimentoTableRow.displayName = 'EstabelecimentoTableRow';

export const EstabelecimentosList: React.FC<EstabelecimentosListProps> = ({
  estabelecimentos,
  onNovoEstabelecimento,
  onEditarEstabelecimento,
  onExcluirEstabelecimento,
  onExcluirPermanente,
  onRestaurarEstabelecimento,
  onRegistrarInspecaoRapida,
  onCriarVaptVinculada,
  onExportExcel,
  onImportarPlanilha,
  onBaixarModelo,
  onAbrirExportacao,
  onVerCalendario,
  onAbrirAvisoVistoria
}) => {
  const [abaExibicao, setAbaExibicao] = useState<'ativos' | 'arquivados'>('ativos');
  const [busca, setBusca] = useState('');
  const [filtroRisco, setFiltroRisco] = useState<string>('todos');
  const [filtroAlvara, setFiltroAlvara] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroInspecionado2026, setFiltroInspecionado2026] = useState<string>('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  const totalAtivos = useMemo(() => estabelecimentos.filter(e => !e.isDeleted).length, [estabelecimentos]);
  const totalArquivados = useMemo(() => estabelecimentos.filter(e => e.isDeleted && !e.isPermanentlyDeleted).length, [estabelecimentos]);

  // Filtragem Memorizada
  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const termoLimpo = termo.replace(/\D/g, '');

    return estabelecimentos.filter((est) => {
      // Separação estrita entre ativos e arquivados
      if (abaExibicao === 'ativos' && est.isDeleted) return false;
      if (abaExibicao === 'arquivados' && (!est.isDeleted || est.isPermanentlyDeleted)) return false;

      const matchBusca = !termo || 
        est.razaoSocial.toLowerCase().includes(termo) ||
        (est.nomeFantasia && est.nomeFantasia.toLowerCase().includes(termo)) ||
        (est.identificacaoMunicipal && est.identificacaoMunicipal.toLowerCase().includes(termo)) ||
        (termoLimpo && est.cnpjCpf.replace(/\D/g, '').includes(termoLimpo)) ||
        est.cnaeCodigo.toLowerCase().includes(termo) ||
        est.cnaeDescricao.toLowerCase().includes(termo) ||
        (est.cnaesSecundarios && est.cnaesSecundarios.some(c => c.toLowerCase().includes(termo))) ||
        (est.motivoExclusao && est.motivoExclusao.toLowerCase().includes(termo)) ||
        (est.deletedBy && est.deletedBy.toLowerCase().includes(termo)) ||
        (est.endereco?.bairro && est.endereco.bairro.toLowerCase().includes(termo));

      if (abaExibicao === 'arquivados') {
        return matchBusca;
      }

      const matchRisco = filtroRisco === 'todos' || est.nivelRisco === filtroRisco;
      const matchAlvara = filtroAlvara === 'todos' || est.situacaoAlvara === filtroAlvara;
      const matchStatus = filtroStatus === 'todos' || est.situacaoEstabelecimento === filtroStatus;

      const isInspecionado2026 = 
        (est.dataUltimaInspecaoInicio && est.dataUltimaInspecaoInicio.startsWith('2026')) ||
        (est.dataUltimaInspecaoFim && est.dataUltimaInspecaoFim.startsWith('2026'));

      const matchInspecionado = filtroInspecionado2026 === 'todos' ||
        (filtroInspecionado2026 === 'sim' && isInspecionado2026) ||
        (filtroInspecionado2026 === 'nao' && !isInspecionado2026);

      return matchBusca && matchRisco && matchAlvara && matchStatus && matchInspecionado;
    });
  }, [estabelecimentos, abaExibicao, busca, filtroRisco, filtroAlvara, filtroStatus, filtroInspecionado2026]);

  // Reseta para a página 1 ao alterar qualquer filtro, busca ou aba
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroRisco, filtroAlvara, filtroStatus, filtroInspecionado2026, abaExibicao]);

  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
  }, [filtrados.length, ITENS_POR_PAGINA]);

  const paginaAjustada = useMemo(() => {
    return Math.min(Math.max(1, paginaAtual), totalPaginas);
  }, [paginaAtual, totalPaginas]);

  const indiceInicio = useMemo(() => {
    return (paginaAjustada - 1) * ITENS_POR_PAGINA;
  }, [paginaAjustada, ITENS_POR_PAGINA]);

  const indiceFim = useMemo(() => {
    return Math.min(indiceInicio + ITENS_POR_PAGINA, filtrados.length);
  }, [indiceInicio, ITENS_POR_PAGINA, filtrados.length]);

  const estabelecimentosPaginados = useMemo(() => {
    return filtrados.slice(indiceInicio, indiceFim);
  }, [filtrados, indiceInicio, indiceFim]);

  // Handlers Memorizados
  const handleLimparFiltros = useCallback(() => {
    setBusca('');
    setFiltroRisco('todos');
    setFiltroAlvara('todos');
    setFiltroStatus('todos');
    setFiltroInspecionado2026('todos');
  }, []);

  const handleIrParaPrimeiraPagina = useCallback(() => {
    setPaginaAtual(1);
  }, []);

  const handleIrParaPaginaAnterior = useCallback(() => {
    setPaginaAtual(prev => Math.max(1, prev - 1));
  }, []);

  const handleIrParaProximaPagina = useCallback(() => {
    setPaginaAtual(prev => Math.min(totalPaginas, prev + 1));
  }, [totalPaginas]);

  const handleIrParaUltimaPagina = useCallback(() => {
    setPaginaAtual(totalPaginas);
  }, [totalPaginas]);

  const handleIrParaPagina = useCallback((num: number) => {
    setPaginaAtual(num);
  }, []);

  return (
    <div className="space-y-4">
      
      {/* Barra de Título do Módulo */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" strokeWidth={2.2} />
            Cadastro de Estabelecimentos (VISA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Base oficial do município de Braúnas/MG para apuração dos Indicadores 12, 13, 14 e 15.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onImportarPlanilha}
            className="min-h-[44px] px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-300 shadow-2xs active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-emerald-700" strokeWidth={2.2} />
            <span>Importar Planilha (.xls)</span>
          </button>

          {onVerCalendario && (
            <button
              type="button"
              onClick={onVerCalendario}
              className="min-h-[44px] px-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-teal-300 shadow-2xs active:scale-[0.98]"
              title="Visualizar calendário de inspeções e agendar por arrastar e soltar"
            >
              <CalendarDays className="w-4 h-4 text-teal-700" strokeWidth={2.2} />
              <span>Calendário de Inspeções</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onAbrirExportacao ? onAbrirExportacao(filtrados) : onExportExcel()}
            className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-300 active:scale-[0.98]"
            title="Exportar dados para CSV, XLSX ou XLS para backup e análise offline"
          >
            <Download className="w-4 h-4 text-emerald-700" strokeWidth={2.2} />
            <span>Exportar (CSV / XLS)</span>
          </button>

          {onAbrirAvisoVistoria && (
            <button
              type="button"
              onClick={() => onAbrirAvisoVistoria(filtrados[0] || estabelecimentos[0] || null)}
              className="min-h-[44px] px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-300 shadow-2xs active:scale-[0.98]"
              title="Emitir Comunicado Oficial de Vistoria Sanitária Anual Programada"
            >
              <BellRing className="w-4 h-4 text-blue-700" strokeWidth={2.2} />
              <span>Emitir Aviso de Vistoria</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNovoEstabelecimento}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            <span>Novo Estabelecimento</span>
          </button>
        </div>
      </div>

      {/* Alternador de Abas: Cadastros Regulares vs Lixeira / Soft Delete */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-xl shadow-2xs">
        <button
          type="button"
          onClick={() => setAbaExibicao('ativos')}
          aria-label="Ver Cadastros Ativos"
          className={`min-h-[44px] px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            abaExibicao === 'ativos'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cadastros Ativos</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            abaExibicao === 'ativos' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {totalAtivos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaExibicao('arquivados')}
          aria-label="Ver Cadastros Arquivados"
          className={`min-h-[44px] px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            abaExibicao === 'arquivados'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Arquivados</span>
          {totalArquivados > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              abaExibicao === 'arquivados' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {totalArquivados}
            </span>
          )}
        </button>
      </div>

      {/* Controles de Busca e Filtros - Altura mínima de 44px para toque */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-busca-estabelecimentos"
              aria-label="Buscar estabelecimentos"
              placeholder={abaExibicao === 'ativos' 
                ? "Buscar por Razão Social, Fantasia, CNPJ/CPF, CNAE ou Bairro..." 
                : "Buscar em arquivados por Razão Social, CNPJ, motivo ou fiscal..."}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-11 pl-9 pr-8 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-slate-800"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                className="w-8 h-8 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Menus Dropdown (apenas para ativos) */}
          {abaExibicao === 'ativos' && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                id="select-filtro-risco"
                aria-label="Filtrar por nível de risco"
                value={filtroRisco}
                onChange={(e) => setFiltroRisco(e.target.value)}
                className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
              >
                <option value="todos">Todos os Riscos</option>
                <option value="Risco I">Risco I (Baixo)</option>
                <option value="Risco II">Risco II (Médio)</option>
                <option value="Risco III">Risco III (Alto)</option>
              </select>

              <select
                id="select-filtro-alvara"
                aria-label="Filtrar por situação do alvará"
                value={filtroAlvara}
                onChange={(e) => setFiltroAlvara(e.target.value)}
                className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
              >
                <option value="todos">Todos os Alvarás</option>
                <option value="Válido">Válido</option>
                <option value="Vencido">Vencido</option>
                <option value="Isento/Dispensado">Isento/Dispensado</option>
                <option value="Não Possui (Irregular)">Não Possui (Irregular)</option>
              </select>

              <select
                id="select-filtro-status"
                aria-label="Filtrar por situação cadastral"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="Ativo">Ativos (Regulares)</option>
                <option value="Suspenso">Suspensos (Interditados)</option>
                <option value="Inativo">Inativos (Baixados)</option>
              </select>

              <select
                id="select-filtro-inspecionado-2026"
                aria-label="Filtrar por status de inspeção em 2026"
                value={filtroInspecionado2026}
                onChange={(e) => setFiltroInspecionado2026(e.target.value)}
                className="h-11 text-xs px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none font-medium cursor-pointer"
              >
                <option value="todos">Inspeção 2026: Todos</option>
                <option value="sim">Inspecionados em 2026</option>
                <option value="nao">Não Inspecionados em 2026</option>
              </select>
            </div>
          )}
        </div>

        {/* Resumo da Contagem */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <span>
            Exibindo <strong>{filtrados.length > 0 ? `${indiceInicio + 1} a ${indiceFim}` : '0'}</strong> de <strong>{filtrados.length}</strong> {abaExibicao === 'ativos' ? `cadastros ativos` : `estabelecimentos arquivados`}
            {totalPaginas > 1 && (
              <span className="text-slate-400 font-medium ml-1.5">
                (Página {paginaAjustada} de {totalPaginas} • 10 por página)
              </span>
            )}
          </span>
          {(busca || filtroRisco !== 'todos' || filtroAlvara !== 'todos' || filtroStatus !== 'todos' || filtroInspecionado2026 !== 'todos') && (
            <button
              type="button"
              onClick={handleLimparFiltros}
              className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline text-[11px]"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Visualização Desktop: Tabela de Alta Densidade */}
      <div className="hidden md:block bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4">Nome Fantasia / Razão Social</th>
                <th className="py-3.5 px-4">Atividade (CNAE)</th>
                <th className="py-3.5 px-4">Risco</th>
                {abaExibicao === 'ativos' ? (
                  <>
                    <th className="py-3.5 px-4">Inspeção Sanitária</th>
                    <th className="py-3.5 px-4">Status / Alvará</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </>
                ) : (
                  <>
                    <th className="py-3.5 px-4">Motivo do Arquivamento / Baixa</th>
                    <th className="py-3.5 px-4">Data & Responsável</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Building2 className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                      <div className="max-w-xs text-center">
                        <p className="text-sm font-semibold text-slate-800">
                          {abaExibicao === 'ativos' ? 'Nenhum estabelecimento ativo encontrado' : 'Nenhum estabelecimento arquivado'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {abaExibicao === 'ativos' ? 'Ajuste os termos de busca ou filtros selecionados acima.' : 'Empresas encerradas ou arquivadas aparecerão nesta aba.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                estabelecimentosPaginados.map((est) => {
                  if (abaExibicao === 'arquivados') {
                    return (
                      <EstabelecimentoArchivedTableRow
                        key={est.id}
                        est={est}
                        onRestaurarEstabelecimento={onRestaurarEstabelecimento}
                        onExcluirPermanente={onExcluirPermanente}
                      />
                    );
                  }

                  return (
                    <EstabelecimentoTableRow
                      key={est.id}
                      est={est}
                      onEditarEstabelecimento={onEditarEstabelecimento}
                      onExcluirEstabelecimento={onExcluirEstabelecimento}
                      onRegistrarInspecaoRapida={onRegistrarInspecaoRapida}
                      onCriarVaptVinculada={onCriarVaptVinculada}
                      onAbrirAvisoVistoria={onAbrirAvisoVistoria}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualização Mobile: Cards Ergonomicamente Espaçados */}
      <div className="md:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500">
            <p className="font-semibold text-slate-700">
              {abaExibicao === 'ativos' ? 'Nenhum estabelecimento ativo encontrado' : 'Nenhum registro arquivado'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros ou crie um cadastro.</p>
          </div>
        ) : (
          estabelecimentosPaginados.map((est) => {
            if (abaExibicao === 'arquivados') {
              return (
                <div 
                  key={est.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-1">
                        <Archive className="w-3 h-3 text-amber-600" />
                        <span>Arquivado</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {est.nomeFantasia || est.razaoSocial}
                      </h3>
                      {est.nomeFantasia && est.nomeFantasia !== est.razaoSocial ? (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {est.razaoSocial}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-0.5">
                          Razão: {est.razaoSocial}
                        </p>
                      )}
                      <div className="text-xs text-slate-500 mt-0.5 font-mono flex items-center gap-1.5 flex-wrap">
                        <span>{est.cnpjCpf}</span>
                        {est.identificacaoMunicipal && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            IM: {est.identificacaoMunicipal}
                          </span>
                        )}
                        <span>• {est.endereco.bairro}</span>
                      </div>
                    </div>
                    <RiscoBadge risco={est.nivelRisco} />
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                    <span className="font-bold block text-amber-900 text-[11px]">Motivo do Arquivamento:</span>
                    <p className="leading-snug">{est.motivoExclusao || 'Encerramento de atividades / Arquivado'}</p>
                    <div className="text-[10px] text-amber-800 pt-1.5 border-t border-amber-200/60 flex items-center justify-between">
                      <span>Data: {est.deletedAt ? formatarDataBr(est.deletedAt.split('T')[0]) : '-'}</span>
                      <span className="truncate max-w-[130px]">Por: {est.deletedBy || 'Fiscal VISA'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onRestaurarEstabelecimento && onRestaurarEstabelecimento(est.id, est.razaoSocial)}
                      className="min-h-[44px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-97 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restaurar</span>
                    </button>
                    {onExcluirPermanente && (
                      <button
                        type="button"
                        onClick={() => onExcluirPermanente(est.id, est.razaoSocial, est.cnpjCpf)}
                        className="min-h-[44px] px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-97 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            const isInspecionado2026 = 
              (est.dataUltimaInspecaoInicio && est.dataUltimaInspecaoInicio.startsWith('2026')) ||
              (est.dataUltimaInspecaoFim && est.dataUltimaInspecaoFim.startsWith('2026'));

            return (
              <div 
                key={est.id}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      {est.nomeFantasia || est.razaoSocial}
                    </h3>
                    {est.nomeFantasia && est.nomeFantasia !== est.razaoSocial ? (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {est.razaoSocial}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-0.5">
                        Razão: {est.razaoSocial}
                      </p>
                    )}
                    <div className="text-xs text-slate-500 mt-0.5 font-mono flex items-center gap-1.5 flex-wrap">
                      <span>{est.cnpjCpf}</span>
                      {est.identificacaoMunicipal && (
                        <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                          IM: {est.identificacaoMunicipal}
                        </span>
                      )}
                      <span>• {est.endereco.bairro}</span>
                    </div>
                  </div>
                  <RiscoBadge risco={est.nivelRisco} />
                </div>

                <div className="text-xs text-slate-600 border-t border-slate-100 pt-2 space-y-1.5">
                  <p className="line-clamp-2">
                    <strong className="text-slate-800">CNAE Principal:</strong> {est.cnaeCodigo} - {est.cnaeDescricao}
                  </p>
                  {est.cnaesSecundarios && est.cnaesSecundarios.length > 0 && (
                    <div className="pt-0.5">
                      <span className="text-[11px] text-slate-700 font-semibold block mb-1">
                        CNAEs Secundários ({est.cnaesSecundarios.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {est.cnaesSecundarios.map((sec, idx) => (
                          <span 
                            key={idx} 
                            className="inline-block text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                            title={sec}
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <AlvaraBadge alvara={est.situacaoAlvara} />
                    {isInspecionado2026 ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Inspecionado 2026
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Pendente 2026
                      </span>
                    )}
                  </div>
                </div>

                {est.situacaoEstabelecimento === 'Suspenso' && (
                  <div className="p-2 rounded bg-amber-50 text-[11px] text-amber-900 border border-amber-200">
                    <span className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      Interdição / Suspensão Sanitária:
                    </span>
                    {est.observacoesBaixa || 'Estabelecimento com atividades suspensas temporariamente pela VISA.'}
                  </div>
                )}

                {est.situacaoEstabelecimento === 'Inativo' && est.observacoesBaixa && (
                  <div className="p-2 rounded bg-slate-50 text-[11px] text-slate-600 border border-slate-200 italic">
                    {est.observacoesBaixa}
                  </div>
                )}

                {/* Grid de Botões de Ação para Celular com altura 44px */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  {onAbrirAvisoVistoria && (
                    <button
                      type="button"
                      onClick={() => onAbrirAvisoVistoria(est)}
                      className="col-span-2 min-h-[44px] px-3 rounded-lg bg-blue-50 text-blue-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 border border-blue-200"
                    >
                      <BellRing className="w-4 h-4 text-blue-600" />
                      <span>Emitir Comunicado de Vistoria Anual</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onRegistrarInspecaoRapida(est)}
                    className="min-h-[44px] px-3 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-97"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Inspecionar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCriarVaptVinculada(est)}
                    className="min-h-[44px] px-3 rounded-lg bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-97"
                  >
                    <HardHat className="w-4 h-4" />
                    <span>Vistoria VAPT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditarEstabelecimento(est)}
                    className="min-h-[44px] px-3 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 border border-slate-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onExcluirEstabelecimento(est.id, est.razaoSocial)}
                    className="min-h-[44px] px-3 rounded-lg bg-rose-50 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Controles de Paginação (10 estabelecimentos por página) */}
      {filtrados.length > 0 && (
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 text-center sm:text-left">
            Mostrando <strong>{indiceInicio + 1}</strong> a <strong>{indiceFim}</strong> de <strong>{filtrados.length}</strong> {abaExibicao === 'ativos' ? 'estabelecimentos ativos' : 'arquivados'}
            {totalPaginas > 1 && (
              <span className="text-slate-400 font-medium ml-1.5">
                (Página {paginaAjustada} de {totalPaginas})
              </span>
            )}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center gap-1 flex-wrap justify-center" role="navigation" aria-label="Navegação de Páginas">
              <button
                type="button"
                onClick={handleIrParaPrimeiraPagina}
                disabled={paginaAjustada === 1}
                aria-label="Primeira Página"
                title="Primeira Página"
                className="min-w-[40px] min-h-[40px] px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer text-xs"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleIrParaPaginaAnterior}
                disabled={paginaAjustada === 1}
                aria-label="Página Anterior"
                title="Página Anterior"
                className="min-w-[40px] min-h-[40px] px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1 cursor-pointer text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Botões Numéricos de Página */}
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(num => {
                  if (num === 1 || num === totalPaginas) return true;
                  return Math.abs(num - paginaAjustada) <= 1;
                })
                .map((num, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && num - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={num}>
                      {showEllipsisBefore && (
                        <span className="px-1 text-slate-400 text-xs">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleIrParaPagina(num)}
                        aria-label={`Página ${num}`}
                        aria-current={paginaAjustada === num ? 'page' : undefined}
                        className={`min-w-[40px] min-h-[40px] px-3 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                          paginaAjustada === num
                            ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={handleIrParaProximaPagina}
                disabled={paginaAjustada === totalPaginas}
                aria-label="Próxima Página"
                title="Próxima Página"
                className="min-w-[40px] min-h-[40px] px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1 cursor-pointer text-xs font-semibold"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleIrParaUltimaPagina}
                disabled={paginaAjustada === totalPaginas}
                aria-label="Última Página"
                title="Última Página"
                className="min-w-[40px] min-h-[40px] px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer text-xs"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
