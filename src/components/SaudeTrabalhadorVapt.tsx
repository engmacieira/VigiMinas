import React, { useState, useMemo } from 'react';
import { 
  HardHat, 
  Plus, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Users, 
  AlertTriangle, 
  X, 
  Save, 
  Trash2,
  FileCheck2,
  ArrowRight,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { Estabelecimento, InspecaoVapt, StatusInspecaoVapt } from '../types/vigiminas';
import { formatarDataBr } from '../services/vigiminasService';
import { useVigiMinas } from '../contexts/VigiMinasContext';

interface SaudeTrabalhadorVaptProps {
  inspecoesVapt: InspecaoVapt[];
  estabelecimentos: Estabelecimento[];
  onSalvarVapt: (vapt: InspecaoVapt) => Promise<void>;
  onExcluirVapt: (id: string, termo: string) => Promise<void>;
  onRestaurarVapt?: (id: string, termo: string) => Promise<void>;
  vaptInicialParaCadastro?: Estabelecimento | null;
  onClearVaptInicial?: () => void;
}

export const SaudeTrabalhadorVapt: React.FC<SaudeTrabalhadorVaptProps> = ({
  inspecoesVapt,
  estabelecimentos,
  onSalvarVapt,
  onExcluirVapt,
  onRestaurarVapt,
  vaptInicialParaCadastro,
  onClearVaptInicial
}) => {
  const { fiscaisAtivos, configuracao } = useVigiMinas();
  const [modalAberto, setModalAberto] = useState(false);
  const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false);
  const [vaptSelecionadaParaImpressao, setVaptSelecionadaParaImpressao] = useState<InspecaoVapt | null>(null);

  const [abaExibicao, setAbaExibicao] = useState<'ativas' | 'arquivadas'>('ativas');

  const [formData, setFormData] = useState<InspecaoVapt>({
    id: '',
    estabelecimentoId: '',
    nomeLocalTrabalho: '',
    dataInspecao: new Date().toISOString().split('T')[0],
    numeroRelatorioTermo: `TV-VAPT/${configuracao.exercicioAtivo.anoExercicio}-${String(inspecoesVapt.length + 1).padStart(3, '0')}`,
    fiscaisResponsaveis: [fiscaisAtivos[0] || 'Lucas Silveira'],
    principaisRiscosIdentificados: '',
    recomendacoesOrientacoes: '',
    statusInspecao: 'Concluída',
    prazoAdequacaoDias: 30
  });

  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  React.useEffect(() => {
    if (vaptInicialParaCadastro) {
      setFormData({
        id: `braunas-vapt-${Date.now()}`,
        estabelecimentoId: vaptInicialParaCadastro.id,
        nomeLocalTrabalho: `${vaptInicialParaCadastro.razaoSocial} (${vaptInicialParaCadastro.endereco.bairro})`,
        dataInspecao: new Date().toISOString().split('T')[0],
        numeroRelatorioTermo: `TV-VAPT/${configuracao.exercicioAtivo.anoExercicio}-${String(inspecoesVapt.length + 1).padStart(3, '0')}`,
        fiscaisResponsaveis: [fiscaisAtivos[0] || 'Lucas Silveira'],
        principaisRiscosIdentificados: '',
        recomendacoesOrientacoes: '',
        statusInspecao: 'Concluída',
        prazoAdequacaoDias: 30
      });
      setModalAberto(true);
      if (onClearVaptInicial) onClearVaptInicial();
    }
  }, [vaptInicialParaCadastro, onClearVaptInicial, inspecoesVapt.length, configuracao.exercicioAtivo.anoExercicio, fiscaisAtivos]);

  const abrirNovo = () => {
    setFormData({
      id: `braunas-vapt-${Date.now()}`,
      estabelecimentoId: estabelecimentos[0]?.id || '',
      nomeLocalTrabalho: estabelecimentos[0] ? `${estabelecimentos[0].razaoSocial} (Área de Produção)` : '',
      dataInspecao: new Date().toISOString().split('T')[0],
      numeroRelatorioTermo: `TV-VAPT/${configuracao.exercicioAtivo.anoExercicio}-${String(inspecoesVapt.length + 1).padStart(3, '0')}`,
      fiscaisResponsaveis: [fiscaisAtivos[0] || 'Lucas Silveira'],
      principaisRiscosIdentificados: 'Risco Ergonômico: Levantamento manual de peso sem apoio mecânico. Risco de Acidentes: Transmissão de força de maquinário sem barreira de proteção física.',
      recomendacoesOrientacoes: '1. Adequar proteções de máquinas conforme NR-12. 2. Implementar medidas preventivas e fornecer EPIs com Certificado de Aprovação (CA) regular.',
      statusInspecao: 'Concluída',
      prazoAdequacaoDias: 30
    });
    setModalAberto(true);
  };

  const handleEstabelecimentoChange = (estId: string) => {
    const est = estabelecimentos.find(e => e.id === estId);
    setFormData(prev => ({
      ...prev,
      estabelecimentoId: estId,
      nomeLocalTrabalho: est ? `${est.razaoSocial} (${est.endereco.bairro})` : prev.nomeLocalTrabalho
    }));
  };

  const toggleFiscal = (nome: string) => {
    if (formData.fiscaisResponsaveis.includes(nome)) {
      if (formData.fiscaisResponsaveis.length > 1) {
        setFormData(prev => ({
          ...prev,
          fiscaisResponsaveis: prev.fiscaisResponsaveis.filter(f => f !== nome)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        fiscaisResponsaveis: [...prev.fiscaisResponsaveis, nome]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeLocalTrabalho.trim() || !formData.numeroRelatorioTermo.trim()) return;

    setSalvando(true);
    try {
      await onSalvarVapt(formData);
      setModalAberto(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const abrirImpressao = (vapt: InspecaoVapt) => {
    setVaptSelecionadaParaImpressao(vapt);
    setModalImpressaoAberto(true);
  };

  const vaptAtivas = useMemo(() => inspecoesVapt.filter(v => !v.isDeleted), [inspecoesVapt]);
  const vaptArquivadas = useMemo(() => inspecoesVapt.filter(v => v.isDeleted), [inspecoesVapt]);

  const vaptAno2026 = vaptAtivas.filter(v => v.dataInspecao?.startsWith('2026')).length;
  const metaAtingida = vaptAno2026 >= 2;

  const vaptFiltradas = useMemo(() => {
    if (abaExibicao === 'arquivadas') {
      return vaptArquivadas;
    }
    return vaptAtivas.filter(v => {
      if (filtroStatus === 'todos') return true;
      return v.statusInspecao === filtroStatus;
    });
  }, [abaExibicao, vaptAtivas, vaptArquivadas, filtroStatus]);

  return (
    <div className="space-y-4">
      
      {/* Topo Institucional do Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
              Indicador 11 • VigiMinas SES/MG
            </span>
            <span className="text-xs text-slate-400">Saúde do Trabalhador</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HardHat className="w-5 h-5 text-teal-400" strokeWidth={2.2} />
            Vigilância em Ambientes e Processos de Trabalho (VAPT)
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Fiscalização técnica e notificação de riscos ocupacionais nos locais de trabalho do município de Braúnas/MG.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <span className="text-slate-400 block text-[10px] font-mono">Meta SES/MG 2026:</span>
            <span className="font-bold text-white text-sm">
              {vaptAno2026} de 2 vistorias {metaAtingida && '✓'}
            </span>
          </div>

          <button
            onClick={abrirNovo}
            className="min-h-[44px] px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-97"
          >
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            <span>Lançar Vistoria VAPT</span>
          </button>
        </div>
      </div>

      {/* Alternador de Abas: Ativas vs Lixeira / Soft Delete */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-xl shadow-2xs">
        <button
          type="button"
          onClick={() => setAbaExibicao('ativas')}
          className={`min-h-[44px] px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            abaExibicao === 'ativas'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>Vistorias VAPT Ativas</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            abaExibicao === 'ativas' ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {vaptAtivas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaExibicao('arquivadas')}
          className={`min-h-[44px] px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            abaExibicao === 'arquivadas'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Lixeira / Arquivadas (Soft Delete)</span>
          {vaptArquivadas.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              abaExibicao === 'arquivadas' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              {vaptArquivadas.length}
            </span>
          )}
        </button>
      </div>

      {/* Barra de Filtro de Status (apenas para ativas) */}
      {abaExibicao === 'ativas' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-700">Filtrar por Status:</span>
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`min-h-[36px] px-3 rounded-lg font-semibold transition cursor-pointer ${
                filtroStatus === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({vaptAtivas.length})
            </button>
            <button
              onClick={() => setFiltroStatus('Concluída')}
              className={`min-h-[36px] px-3 rounded-lg font-semibold transition cursor-pointer ${
                filtroStatus === 'Concluída' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Concluídas
            </button>
            <button
              onClick={() => setFiltroStatus('Em Acompanhamento')}
              className={`min-h-[36px] px-3 rounded-lg font-semibold transition cursor-pointer ${
                filtroStatus === 'Em Acompanhamento' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Em Acompanhamento
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Exercício: <strong>{configuracao.exercicioAtivo.anoExercicio}</strong>
          </span>
        </div>
      )}

      {/* Lista de Vistorias VAPT */}
      <div className="space-y-3">
        {vaptFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200/90 text-slate-500">
            <HardHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">
              {abaExibicao === 'ativas' ? 'Nenhuma inspeção VAPT ativa encontrada' : 'Nenhuma vistoria arquivada na lixeira'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {abaExibicao === 'ativas' ? 'Clique em "Lançar Vistoria VAPT" para registrar uma nova inspeção.' : 'Relatórios excluídos logicamente permanecerão aqui e poderão ser restaurados a qualquer momento.'}
            </p>
          </div>
        ) : (
          vaptFiltradas.map((vapt) => {
            const est = estabelecimentos.find(e => e.id === vapt.estabelecimentoId);

            if (abaExibicao === 'arquivadas') {
              return (
                <div 
                  key={vapt.id}
                  className="bg-white rounded-xl p-5 border border-rose-200 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-900 border border-rose-200">
                        {vapt.numeroRelatorioTermo}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <Trash2 className="w-3 h-3" />
                        Arquivado (Soft Delete)
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatarDataBr(vapt.dataInspecao)}
                      </span>
                    </div>

                    <button
                      onClick={() => onRestaurarVapt && onRestaurarVapt(vapt.id, vapt.numeroRelatorioTermo)}
                      className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs self-end sm:self-auto"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restaurar Vistoria</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {vapt.nomeLocalTrabalho}
                    </h3>
                    {est && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Empresa vinculada: <strong>{est.razaoSocial}</strong> (CNPJ: {est.cnpjCpf})
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-950 space-y-1">
                    <span className="font-bold text-[11px] uppercase block text-rose-800">
                      Motivo da Exclusão Lógica:
                    </span>
                    <p className="leading-relaxed">{vapt.motivoExclusao || 'Exclusão lógica realizada via sistema'}</p>
                    <div className="text-[10px] text-rose-700 pt-1.5 border-t border-rose-200/80 flex items-center justify-between">
                      <span>Arquivado em: {vapt.deletedAt ? formatarDataBr(vapt.deletedAt.split('T')[0]) : '-'}</span>
                      <span>Por: {vapt.deletedBy || 'Fiscal VISA'}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={vapt.id}
                className="bg-white rounded-xl p-5 border border-slate-200/90 hover:border-slate-300 transition shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
                      {vapt.numeroRelatorioTermo}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      vapt.statusInspecao === 'Concluída' 
                        ? 'bg-emerald-100 text-emerald-900' 
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {vapt.statusInspecao === 'Concluída' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" strokeWidth={2.5} />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-700" strokeWidth={2.5} />
                      )}
                      {vapt.statusInspecao}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatarDataBr(vapt.dataInspecao)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => abrirImpressao(vapt)}
                      className="min-h-[44px] px-3.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition border border-teal-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4 text-teal-700" />
                      <span>Imprimir Termo VAPT</span>
                    </button>

                    <button
                      onClick={() => onExcluirVapt(vapt.id, vapt.numeroRelatorioTermo)}
                      title="Excluir vistoria (Soft Delete)"
                      aria-label="Excluir vistoria"
                      className="min-w-[44px] min-h-[44px] rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {vapt.nomeLocalTrabalho}
                  </h3>
                  {est && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Empresa vinculada: <strong>{est.razaoSocial}</strong> (CNPJ: {est.cnpjCpf})
                    </p>
                  )}
                </div>

                {/* Bloco de Riscos Ocupacionais sem Card-ception */}
                <div className="p-3 bg-slate-50/90 rounded-lg border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Riscos Identificados no Posto de Trabalho:
                  </span>
                  <p className="text-slate-800 leading-relaxed">
                    {vapt.principaisRiscosIdentificados}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 flex-wrap gap-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Fiscais: <strong className="text-slate-700">{vapt.fiscaisResponsaveis.join(', ')}</strong>
                  </span>
                  {vapt.prazoAdequacaoDias && (
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Prazo Legal: {vapt.prazoAdequacaoDias} dias
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Cadastro de Nova VAPT */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200/90 flex flex-col max-h-[92vh]">
            
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-teal-400" />
                <h2 className="text-base font-bold">Relatório de Inspeção VAPT (Saúde do Trabalhador)</h2>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                aria-label="Fechar"
                className="w-11 h-11 rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vincular a Estabelecimento Cadastrado *
                </label>
                <select
                  value={formData.estabelecimentoId}
                  onChange={(e) => handleEstabelecimentoChange(e.target.value)}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none bg-white text-slate-800 font-medium"
                >
                  <option value="">Selecione um estabelecimento...</option>
                  {estabelecimentos.map(est => (
                    <option key={est.id} value={est.id}>
                      {est.razaoSocial} - {est.cnpjCpf} ({est.nivelRisco})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ambiente / Posto de Trabalho Inspecionado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Auto Posto Braúnas - Pista de Abastecimento e Vala de Troca de Óleo"
                  value={formData.nomeLocalTrabalho}
                  onChange={(e) => setFormData({ ...formData, nomeLocalTrabalho: e.target.value })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número do Termo / Relatório *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numeroRelatorioTermo}
                    onChange={(e) => setFormData({ ...formData, numeroRelatorioTermo: e.target.value })}
                    className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Vistoria (2026) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dataInspecao}
                    onChange={(e) => setFormData({ ...formData, dataInspecao: e.target.value })}
                    className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Fiscais */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fiscais Sanitários de Braúnas Presentes *
                </label>
                <div className="flex flex-wrap gap-2">
                  {fiscaisAtivos.map(fiscal => {
                    const ativo = formData.fiscaisResponsaveis.includes(fiscal);
                    return (
                      <button
                        key={fiscal}
                        type="button"
                        onClick={() => toggleFiscal(fiscal)}
                        className={`min-h-[44px] text-xs px-3.5 rounded-lg border transition cursor-pointer font-semibold flex items-center ${
                          ativo 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {fiscal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Riscos Ocupacionais */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Riscos Ocupacionais Mapeados no Posto de Trabalho *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva os riscos físicos, químicos, biológicos, ergonômicos ou de acidentes..."
                  value={formData.principaisRiscosIdentificados}
                  onChange={(e) => setFormData({ ...formData, principaisRiscosIdentificados: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none text-slate-800"
                />
              </div>

              {/* Determinações Sanitárias */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recomendações e Determinações Técnicas Sanitárias *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Orientações e exigências legais com base nas NRs e Código Sanitário de Minas Gerais..."
                  value={formData.recomendacoesOrientacoes}
                  onChange={(e) => setFormData({ ...formData, recomendacoesOrientacoes: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Vistoria
                  </label>
                  <select
                    value={formData.statusInspecao}
                    onChange={(e) => setFormData({ ...formData, statusInspecao: e.target.value as StatusInspecaoVapt })}
                    className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none bg-white font-semibold text-slate-800"
                  >
                    <option value="Concluída">Concluída (Termo Final)</option>
                    <option value="Em Acompanhamento">Em Acompanhamento (Com Prazo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prazo Legal para Adequação (dias)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formData.prazoAdequacaoDias || 30}
                    onChange={(e) => setFormData({ ...formData, prazoAdequacaoDias: Number(e.target.value) })}
                    className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                  className="min-h-[44px] px-4 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="min-h-[44px] px-5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{salvando ? 'Salvando...' : 'Registrar Vistoria (Ind. 11)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Impressão do Termo Oficial A4 */}
      {modalImpressaoAberto && vaptSelecionadaParaImpressao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-300 my-0 sm:my-4 text-slate-900">
            
            {/* Barra de Ações (Oculta na Impressão) */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-400" />
                Visualização do Termo Oficial de Vistoria Sanitária / VAPT (A4)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="min-h-[38px] px-3.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-97"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  onClick={() => setModalImpressaoAberto(false)}
                  aria-label="Fechar"
                  className="w-9 h-9 rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Documento A4 Formatado */}
            <div id="termo-oficial-print" className="p-8 sm:p-12 space-y-6 bg-white font-serif text-slate-950 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible">
              
              {/* Cabeçalho Oficial */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <p className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
                  ESTADO DE MINAS GERAIS • {configuracao.secretaria.nomeOrgao.toUpperCase()}
                </p>
                <h1 className="text-base sm:text-lg font-black uppercase font-sans tracking-wide text-slate-950">
                  {configuracao.secretaria.departamento.toUpperCase()}
                </h1>
                <p className="text-[11px] font-sans text-slate-600">
                  {configuracao.secretaria.enderecoCompleto} • Tel: {configuracao.secretaria.telefoneOficial} • E-mail: {configuracao.secretaria.emailOficial}
                </p>
                <div className="inline-block mt-2 px-3 py-1 rounded border border-slate-900 text-xs font-mono font-bold">
                  TERMO DE NOTIFICAÇÃO E VISTORIA EM SAÚDE DO TRABALHADOR • Nº {vaptSelecionadaParaImpressao.numeroRelatorioTermo}
                </div>
              </div>

              {/* 1. Identificação do Local */}
              <div className="text-xs space-y-2 border border-slate-300 p-4 rounded">
                <h3 className="font-sans font-bold uppercase text-[11px] text-slate-900 border-b border-slate-200 pb-1">
                  1. DADOS DO ESTABELECIMENTO / LOCAL INSPECIONADO
                </h3>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="font-semibold text-slate-600">Local / Razão Social: </span>
                    <span className="font-bold">{vaptSelecionadaParaImpressao.nomeLocalTrabalho}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Data da Vistoria: </span>
                    <span className="font-bold">{formatarDataBr(vaptSelecionadaParaImpressao.dataInspecao)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Município / UF: </span>
                    <span>Braúnas / MG</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Status da Vistoria: </span>
                    <span className="font-bold">{vaptSelecionadaParaImpressao.statusInspecao}</span>
                  </div>
                </div>
              </div>

              {/* 2. Equipe Fiscalizadora */}
              <div className="text-xs space-y-1 border border-slate-300 p-4 rounded">
                <h3 className="font-sans font-bold uppercase text-[11px] text-slate-900 border-b border-slate-200 pb-1">
                  2. EQUIPE FISCALIZADORA DE BRAÚNAS/MG
                </h3>
                <p className="pt-1">
                  <span className="font-semibold text-slate-600">Fiscais Responsáveis: </span>
                  <span className="font-bold">{vaptSelecionadaParaImpressao.fiscaisResponsaveis.join('; ')}</span>
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  Autoridade sanitária municipal outorgada pela Lei Estadual nº 13.317/1999 (Código de Saúde de Minas Gerais).
                </p>
              </div>

              {/* 3. Riscos Mapeados */}
              <div className="text-xs space-y-2 border border-slate-300 p-4 rounded">
                <h3 className="font-sans font-bold uppercase text-[11px] text-slate-900 border-b border-slate-200 pb-1">
                  3. RISCOS OCUPACIONAIS CONSTATADOS NO AMBIENTE DE TRABALHO
                </h3>
                <p className="pt-1 leading-relaxed text-slate-900 whitespace-pre-wrap">
                  {vaptSelecionadaParaImpressao.principaisRiscosIdentificados}
                </p>
              </div>

              {/* 4. Determinações e Recomendações */}
              <div className="text-xs space-y-2 border border-slate-300 p-4 rounded">
                <h3 className="font-sans font-bold uppercase text-[11px] text-slate-900 border-b border-slate-200 pb-1">
                  4. DETERMINAÇÕES TÉCNICAS E RECOMENDAÇÕES SANITÁRIAS
                </h3>
                <p className="pt-1 leading-relaxed text-slate-900 whitespace-pre-wrap">
                  {vaptSelecionadaParaImpressao.recomendacoesOrientacoes}
                </p>
                {vaptSelecionadaParaImpressao.prazoAdequacaoDias && (
                  <p className="font-sans font-bold text-slate-900 text-xs pt-2">
                    Prazo legal estabelecido para cumprimento e comprovação das medidas: {vaptSelecionadaParaImpressao.prazoAdequacaoDias} dias corridos.
                  </p>
                )}
              </div>

              {/* Assinaturas */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                <div className="space-y-1">
                  <div className="border-t border-slate-900 pt-1"></div>
                  <p className="font-bold text-slate-900">
                    {vaptSelecionadaParaImpressao.fiscaisResponsaveis[0] || 'Fiscal Sanitário'}
                  </p>
                  <p className="text-[11px] text-slate-600">Vigilância Sanitária e Saúde do Trabalhador</p>
                  <p className="text-[10px] text-slate-400">Prefeitura Municipal de Braúnas/MG</p>
                </div>

                <div className="space-y-1">
                  <div className="border-t border-slate-900 pt-1"></div>
                  <p className="font-bold text-slate-900">
                    Responsável pelo Estabelecimento / Posto de Trabalho
                  </p>
                  <p className="text-[11px] text-slate-600">Ciente da Notificação Sanitária</p>
                  <p className="text-[10px] text-slate-400">Data: _____/_____/{configuracao.exercicioAtivo.anoExercicio}</p>
                </div>
              </div>

              {/* Nota de Rodapé Oficial */}
              {configuracao.secretaria.textoRodapeOficial && (
                <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 font-sans leading-tight">
                  {configuracao.secretaria.textoRodapeOficial}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
