import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { EstabelecimentosList } from '../components/EstabelecimentosList';
import { EstabelecimentoModal } from '../components/EstabelecimentoModal';
import { RegistrarInspecaoModal } from '../components/RegistrarInspecaoModal';
import { ImportarPlanilhaModal } from '../components/ImportarPlanilhaModal';
import { ExportarEstabelecimentosModal } from '../components/ExportarEstabelecimentosModal';
import { CalendarioInspecoesView } from '../components/CalendarioInspecoesView';
import { ConfirmarExclusaoModal } from '../components/ConfirmarExclusaoModal';
import { AvisoVistoriaModal } from '../components/AvisoVistoriaModal';
import { Estabelecimento } from '../types/vigiminas';
import { Building2, CalendarDays } from 'lucide-react';

export const EstabelecimentosPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    estabelecimentos, 
    salvarEstabelecimento, 
    removerEstabelecimento, 
    restaurarEstabelecimento,
    excluirPermanenteEstabelecimento,
    executarInspecaoRapida, 
    exportarPlanilha 
  } = useVigiMinas();

  // Modo de visualização: Tabela Cadastral ou Calendário de Agendamento
  const [modoVisualizacao, setModoVisualizacao] = useState<'tabela' | 'calendario'>('tabela');

  // Modais locais da página
  const [modalEstAberto, setModalEstAberto] = useState(false);
  const [estParaEditar, setEstParaEditar] = useState<Estabelecimento | null>(null);

  const [modalInspecaoAberto, setModalInspecaoAberto] = useState(false);
  const [estParaInspecao, setEstParaInspecao] = useState<Estabelecimento | null>(null);

  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [estabelecimentosFiltrados, setEstabelecimentosFiltrados] = useState<Estabelecimento[]>([]);

  // Modal de Aviso de Vistoria Sanitária Anual Programada
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
  const [estParaAviso, setEstParaAviso] = useState<Estabelecimento | null>(null);

  // Estado para confirmação de soft delete auditável (arquivamento ou remoção da visão)
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [estParaExcluir, setEstParaExcluir] = useState<{ id: string; razao: string; cnpj: string; isPermanent?: boolean } | null>(null);

  // Total de estabelecimentos ativos aguardando agendamento (inclui Suspensos)
  const totalPendentesAgendamento = estabelecimentos.filter(
    e => !e.isDeleted && (e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso') && (!e.dataProximaInspecao || e.dataProximaInspecao < new Date().toISOString().split('T')[0])
  ).length;

  const handleNovo = () => {
    setEstParaEditar(null);
    setModalEstAberto(true);
  };

  const handleEditar = (est: Estabelecimento) => {
    setEstParaEditar(est);
    setModalEstAberto(true);
  };

  const handleSolicitarExcluir = (id: string, razao: string, cnpj?: string) => {
    const est = estabelecimentos.find(e => e.id === id);
    setEstParaExcluir({
      id,
      razao,
      cnpj: cnpj || est?.cnpjCpf || '',
      isPermanent: false
    });
    setModalExcluirAberto(true);
  };

  const handleSolicitarExcluirPermanente = (id: string, razao: string, cnpj?: string) => {
    const est = estabelecimentos.find(e => e.id === id);
    setEstParaExcluir({
      id,
      razao,
      cnpj: cnpj || est?.cnpjCpf || '',
      isPermanent: true
    });
    setModalExcluirAberto(true);
  };

  const handleConfirmarExclusao = async (motivo: string) => {
    if (!estParaExcluir) return;
    if (estParaExcluir.isPermanent) {
      await excluirPermanenteEstabelecimento(estParaExcluir.id, estParaExcluir.razao, motivo);
    } else {
      await removerEstabelecimento(estParaExcluir.id, estParaExcluir.razao, motivo);
    }
    if (modalEstAberto && estParaEditar?.id === estParaExcluir.id) {
      setModalEstAberto(false);
    }
  };

  const handleRestaurar = async (id: string, razao: string) => {
    await restaurarEstabelecimento(id, razao);
  };

  const handleAbrirInspecao = (est: Estabelecimento) => {
    setEstParaInspecao(est);
    setModalInspecaoAberto(true);
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
  };

  // Navega para a página de Saúde do Trabalhador passando o estabelecimento alvo
  const handleCriarVaptVinculada = (est: Estabelecimento) => {
    navigate('/saude-trabalhador', { state: { estabelecimentoVinculado: est } });
  };

  const handleAbrirAvisoVistoria = (est: Estabelecimento) => {
    setEstParaAviso(est);
    setModalAvisoAberto(true);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Alternância de Visualização (Tabela vs Calendário) */}
      <div className="flex items-center justify-between pb-1 flex-wrap gap-3">
        <div className="inline-flex bg-slate-200/90 p-1 rounded-xl border border-slate-300 shadow-2xs">
          <button
            type="button"
            onClick={() => setModoVisualizacao('tabela')}
            className={`min-h-[38px] px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              modoVisualizacao === 'tabela'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-700" strokeWidth={2.2} />
            <span>Tabela Cadastral</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold border border-slate-200">
              {estabelecimentos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModoVisualizacao('calendario')}
            className={`min-h-[38px] px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              modoVisualizacao === 'calendario'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-emerald-700" strokeWidth={2.2} />
            <span>Calendário de Inspeções (Arrastar & Soltar)</span>
            {totalPendentesAgendamento > 0 && (
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded-full border border-rose-200">
                {totalPendentesAgendamento} pendentes
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Exibição Condicional do Módulo */}
      {modoVisualizacao === 'tabela' ? (
        <EstabelecimentosList
          estabelecimentos={estabelecimentos}
          onNovoEstabelecimento={handleNovo}
          onEditarEstabelecimento={handleEditar}
          onExcluirEstabelecimento={handleSolicitarExcluir}
          onExcluirPermanente={handleSolicitarExcluirPermanente}
          onRestaurarEstabelecimento={handleRestaurar}
          onRegistrarInspecaoRapida={handleAbrirInspecao}
          onCriarVaptVinculada={handleCriarVaptVinculada}
          onExportExcel={exportarPlanilha}
          onImportarPlanilha={() => setModalImportarAberto(true)}
          onAbrirExportacao={(filtrados) => {
            setEstabelecimentosFiltrados(filtrados);
            setModalExportarAberto(true);
          }}
          onVerCalendario={() => setModoVisualizacao('calendario')}
          onAbrirAvisoVistoria={handleAbrirAvisoVistoria}
        />
      ) : (
        <CalendarioInspecoesView
          onRegistrarInspecaoRapida={handleAbrirInspecao}
          onEditarEstabelecimento={handleEditar}
          onNovoEstabelecimento={handleNovo}
        />
      )}

      <EstabelecimentoModal
        isOpen={modalEstAberto}
        onClose={() => setModalEstAberto(false)}
        onSave={salvarEstabelecimento}
        onExcluir={handleSolicitarExcluir}
        estabelecimentoParaEditar={estParaEditar}
      />

      <RegistrarInspecaoModal
        isOpen={modalInspecaoAberto}
        onClose={() => setModalInspecaoAberto(false)}
        estabelecimento={estParaInspecao}
        onConfirmInspecao={handleConfirmInspecao}
      />

      <ImportarPlanilhaModal
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
      />

      <ExportarEstabelecimentosModal
        isOpen={modalExportarAberto}
        onClose={() => setModalExportarAberto(false)}
        estabelecimentosFiltrados={estabelecimentosFiltrados}
      />

      {/* Modal de Confirmação de Soft Delete Auditável */}
      <ConfirmarExclusaoModal
        isOpen={modalExcluirAberto}
        onClose={() => {
          setModalExcluirAberto(false);
          setEstParaExcluir(null);
        }}
        onConfirm={handleConfirmarExclusao}
        tipo="estabelecimento"
        tituloEntidade={estParaExcluir?.razao || ''}
        subtituloEntidade={estParaExcluir?.cnpj ? `CNPJ/CPF: ${estParaExcluir.cnpj}` : undefined}
        identificador={estParaExcluir?.id}
        isPermanentAction={estParaExcluir?.isPermanent || false}
      />

      <AvisoVistoriaModal
        isOpen={modalAvisoAberto}
        onClose={() => {
          setModalAvisoAberto(false);
          setEstParaAviso(null);
        }}
        estabelecimento={estParaAviso}
        estabelecimentos={estabelecimentos}
      />
    </div>
  );
};
