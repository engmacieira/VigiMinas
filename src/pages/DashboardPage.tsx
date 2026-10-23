import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { DashboardMetas } from '../components/DashboardMetas';
import { RegistrarInspecaoModal } from '../components/RegistrarInspecaoModal';
import { Estabelecimento } from '../types/vigiminas';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    indicadores, 
    estabelecimentos, 
    exportarPlanilha, 
    executarInspecaoRapida 
  } = useVigiMinas();

  const [estParaInspecao, setEstParaInspecao] = useState<Estabelecimento | null>(null);
  const [modalInspecaoAberto, setModalInspecaoAberto] = useState(false);

  const handleOpenQuickInspecao = (est: Estabelecimento) => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-2">
      <DashboardMetas
        indicadores={indicadores}
        estabelecimentos={estabelecimentos}
        onExportExcel={exportarPlanilha}
        onOpenQuickInspecao={handleOpenQuickInspecao}
        onGoToEstabelecimentos={() => navigate('/estabelecimentos')}
        onGoToVapt={() => navigate('/saude-trabalhador')}
        onGoToMetas={() => navigate('/metas')}
      />

      {/* Modal de Inspeção Rápida disparado pelo painel de prioridades */}
      <RegistrarInspecaoModal
        isOpen={modalInspecaoAberto}
        onClose={() => setModalInspecaoAberto(false)}
        estabelecimento={estParaInspecao}
        onConfirmInspecao={handleConfirmInspecao}
      />
    </div>
  );
};
