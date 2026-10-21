import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { SaudeTrabalhadorVapt } from '../components/SaudeTrabalhadorVapt';
import { ConfirmarExclusaoModal } from '../components/ConfirmarExclusaoModal';
import { Estabelecimento } from '../types/vigiminas';

export const SaudeTrabalhadorPage: React.FC = () => {
  const location = useLocation();
  const { 
    inspecoesVapt, 
    estabelecimentos, 
    salvarVistoriaVapt, 
    removerVistoriaVapt,
    restaurarVistoriaVapt
  } = useVigiMinas();

  // Recebe estabelecimento inicial opcional via state de navegação
  const state = location.state as { estabelecimentoVinculado?: Estabelecimento } | null;
  const estabelecimentoInicial = state?.estabelecimentoVinculado || null;

  // Estado de confirmação de soft delete auditável
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [vaptParaExcluir, setVaptParaExcluir] = useState<{ id: string; termo: string; local: string } | null>(null);

  const handleSolicitarExcluir = async (id: string, termo: string) => {
    const vapt = inspecoesVapt.find(v => v.id === id);
    setVaptParaExcluir({
      id,
      termo,
      local: vapt?.nomeLocalTrabalho || termo
    });
    setModalExcluirAberto(true);
  };

  const handleConfirmarExclusao = async (motivo: string) => {
    if (!vaptParaExcluir) return;
    await removerVistoriaVapt(vaptParaExcluir.id, vaptParaExcluir.termo, motivo);
  };

  const handleRestaurar = async (id: string, termo: string) => {
    await restaurarVistoriaVapt(id, termo);
  };

  return (
    <div className="space-y-6">
      <SaudeTrabalhadorVapt
        inspecoesVapt={inspecoesVapt}
        estabelecimentos={estabelecimentos}
        onSalvarVapt={salvarVistoriaVapt}
        onExcluirVapt={handleSolicitarExcluir}
        onRestaurarVapt={handleRestaurar}
        vaptInicialParaCadastro={estabelecimentoInicial}
      />

      <ConfirmarExclusaoModal
        isOpen={modalExcluirAberto}
        onClose={() => {
          setModalExcluirAberto(false);
          setVaptParaExcluir(null);
        }}
        onConfirm={handleConfirmarExclusao}
        tipo="vapt"
        tituloEntidade={vaptParaExcluir?.local || ''}
        subtituloEntidade={vaptParaExcluir ? `Relatório / Termo: ${vaptParaExcluir.termo}` : undefined}
        identificador={vaptParaExcluir?.id}
      />
    </div>
  );
};
