import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  X, 
  ShieldAlert, 
  RotateCcw, 
  Building2, 
  HardHat, 
  UserCheck, 
  AlertCircle,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

export type TipoEntidadeExclusao = 'estabelecimento' | 'vapt' | 'fiscal';

interface ConfirmarExclusaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  tipo: TipoEntidadeExclusao;
  tituloEntidade: string;
  subtituloEntidade?: string;
  identificador?: string;
  isPermanentAction?: boolean;
}

const MOTIVOS_SUGERIDOS: Record<TipoEntidadeExclusao, string[]> = {
  estabelecimento: [
    'Encerramento definitivo de atividades',
    'Transferência de endereço para outro município',
    'Empresa extinta / baixada na Receita Federal',
    'Cadastro duplicado / erro de digitação',
    'Atividade econômica não sujeita ao controle sanitário'
  ],
  vapt: [
    'Relatório / Termo de vistoria reemitido',
    'Lançamento duplicado no sistema',
    'Erro de digitação nos fiscais ou na data da inspeção',
    'Vistoria cancelada e reprogramada para nova data',
    'Inspeção arquivada por despacho administrativo'
  ],
  fiscal: [
    'Exoneração / Desligamento do quadro de servidores',
    'Aposentadoria de servidor público municipal',
    'Transferência para outra secretaria municipal',
    'Término de contrato temporário de fiscalização',
    'Remoção de cadastro de teste / homologação'
  ]
};

export const ConfirmarExclusaoModal: React.FC<ConfirmarExclusaoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tipo,
  tituloEntidade,
  subtituloEntidade,
  identificador,
  isPermanentAction = false
}) => {
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>('');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState<string>('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMotivoSelecionado(MOTIVOS_SUGERIDOS[tipo][0] || '');
      setMotivoPersonalizado('');
      setProcessando(false);
    }
  }, [isOpen, tipo]);

  if (!isOpen) return null;

  const handleConfirmar = async () => {
    const motivoFinal = motivoPersonalizado.trim() 
      ? `${motivoSelecionado}: ${motivoPersonalizado.trim()}`
      : (motivoSelecionado || (isPermanentAction ? 'Exclusão definitiva solicitada na aba de arquivados' : 'Arquivamento realizado via interface'));

    setProcessando(true);
    try {
      await onConfirm(motivoFinal);
      onClose();
    } catch (err) {
      console.error('Erro ao executar exclusão:', err);
    } finally {
      setProcessando(false);
    }
  };

  const getTipoIcon = () => {
    switch (tipo) {
      case 'estabelecimento':
        return <Building2 className="w-5 h-5 text-rose-600" />;
      case 'vapt':
        return <HardHat className="w-5 h-5 text-rose-600" />;
      case 'fiscal':
        return <UserCheck className="w-5 h-5 text-rose-600" />;
    }
  };

  const getTipoLabel = () => {
    switch (tipo) {
      case 'estabelecimento':
        return 'Estabelecimento Comercial / Sanitário';
      case 'vapt':
        return 'Relatório de Inspeção VAPT (Saúde do Trabalhador)';
      case 'fiscal':
        return 'Fiscal Sanitário Municipal';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-exclusao-titulo"
      >
        {/* Cabeçalho */}
        <div className="bg-rose-50 border-b border-rose-100 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-700" strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="modal-exclusao-titulo" className="text-base font-bold text-rose-950">
                {isPermanentAction ? 'Confirmar Exclusão' : 'Confirmar Arquivamento'}
              </h2>
              <span className="text-xs text-rose-700 font-medium flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-rose-600" />
                {isPermanentAction ? 'Remoção da visualização de arquivados' : 'Movido para a aba Arquivados (recuperável)'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={processando}
            aria-label="Fechar"
            className="w-10 h-10 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100/60 transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Card da Entidade a ser Excluída */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {getTipoIcon()}
              <span>{getTipoLabel()}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              {tituloEntidade}
            </h3>
            {subtituloEntidade && (
              <p className="text-xs text-slate-600 font-medium">
                {subtituloEntidade}
              </p>
            )}
            {identificador && (
              <p className="text-[11px] font-mono text-slate-400 pt-0.5">
                ID / Matrícula: {identificador}
              </p>
            )}
          </div>

          {/* Destaque Explicativo do Soft Delete */}
          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/90 text-xs text-teal-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-teal-950">
              <ShieldAlert className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Garantia de Integridade e Histórico da VISA</span>
            </div>
            <p className="text-[11px] leading-relaxed text-teal-800">
              O registro <strong>não será apagado fisicamente</strong> do banco de dados. Ele sairá das listagens e contadores ativos, mas seu histórico permanecerá arquivado com a data, fiscal e justificativa sanitária, podendo ser <strong>restaurado a qualquer momento</strong>.
            </p>
          </div>

          {/* Seleção do Motivo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Justificativa Sanitária / Motivo da Exclusão *
            </label>
            <div className="space-y-1.5">
              {MOTIVOS_SUGERIDOS[tipo].map((motivo) => {
                const isSelected = motivoSelecionado === motivo;
                return (
                  <label
                    key={motivo}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected 
                        ? 'bg-rose-50/70 border-rose-300 text-rose-950 font-semibold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="motivo-exclusao"
                      value={motivo}
                      checked={isSelected}
                      onChange={() => setMotivoSelecionado(motivo)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                    />
                    <span className="leading-snug">{motivo}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Observações Adicionais Opcionais */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Complemento da Justificativa (opcional)
            </label>
            <textarea
              rows={2}
              value={motivoPersonalizado}
              onChange={(e) => setMotivoPersonalizado(e.target.value)}
              placeholder="Ex: Conforme processo administrativo nº 12/2026 da VISA de Braúnas/MG..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Rodapé com Botões de Ação de 44px */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={processando}
            className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/80 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={processando}
            className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{processando ? 'Arquivando...' : 'Confirmar Exclusão Lógica'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
