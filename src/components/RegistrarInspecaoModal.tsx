import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  Users, 
  ShieldCheck, 
  FileCheck
} from 'lucide-react';
import { Estabelecimento } from '../types/vigiminas';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

interface RegistrarInspecaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  estabelecimento: Estabelecimento | null;
  onConfirmInspecao: (
    estabelecimentoAtualizado: Estabelecimento,
    detalhes: {
      dataInspecao: string;
      fiscais: string[];
      renovarAlvara: boolean;
      novoAlvaraNumero?: string;
      novaValidadeAlvara?: string;
    }
  ) => Promise<void>;
}

export const RegistrarInspecaoModal: React.FC<RegistrarInspecaoModalProps> = ({
  isOpen,
  onClose,
  estabelecimento,
  onConfirmInspecao
}) => {
  const { fiscaisAtivos, configuracao } = useVigiMinas();
  const auth = useContext(AuthContext);
  const usuario = auth?.usuario;
  if (!isOpen || !estabelecimento) return null;

  const hoje = new Date().toISOString().split('T')[0];
  const proximoAno = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

  const defaultFiscal = usuario?.nomeCompleto || fiscaisAtivos[0] || 'Fiscal Sanitário';

  const [dataInspecao, setDataInspecao] = useState(hoje);
  const [fiscaisSelecionados, setFiscaisSelecionados] = useState<string[]>([defaultFiscal]);
  const [renovarAlvara, setRenovarAlvara] = useState(true);
  const [novoAlvaraNumero, setNovoAlvaraNumero] = useState(`ALV-${configuracao.exercicioAtivo.anoExercicio}/${Math.floor(Math.random() * 90 + 10)}`);
  const [novaValidadeAlvara, setNovaValidadeAlvara] = useState(proximoAno);
  const [salvando, setSalvando] = useState(false);

  const toggleFiscal = (nome: string) => {
    if (fiscaisSelecionados.includes(nome)) {
      if (fiscaisSelecionados.length > 1) {
        setFiscaisSelecionados(fiscaisSelecionados.filter(f => f !== nome));
      }
    } else {
      setFiscaisSelecionados([...fiscaisSelecionados, nome]);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const atualizado: Estabelecimento = {
      ...estabelecimento,
      dataUltimaInspecaoInicio: dataInspecao,
      dataUltimaInspecaoFim: dataInspecao,
      dataProximaInspecao: novaValidadeAlvara,
      fiscaisUltimaInspecao: fiscaisSelecionados,
      ...(renovarAlvara ? {
        situacaoAlvara: 'Válido',
        numeroAlvara: novoAlvaraNumero,
        dataValidadeAlvara: novaValidadeAlvara
      } : {})
    };

    try {
      await onConfirmInspecao(atualizado, {
        dataInspecao,
        fiscais: fiscaisSelecionados,
        renovarAlvara,
        novoAlvaraNumero,
        novaValidadeAlvara
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const indicadorAfetado = estabelecimento.nivelRisco === 'Risco I' 
    ? 'Indicador 13 (Meta &ge; 15%)'
    : estabelecimento.nivelRisco === 'Risco II'
      ? 'Indicador 14 (Meta &ge; 90%)'
      : 'Indicador 15 (Meta 100%)';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/90">
        
        {/* Cabeçalho */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Registrar Inspeção Sanitária</h2>
              <span className="text-[11px] text-slate-400">Atualização de datas e metas VigiMinas</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-11 h-11 rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="p-5 sm:p-6 space-y-4">
          
          {/* Identificação do Estabelecimento */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Estabelecimento Alvo
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {estabelecimento.razaoSocial}
            </h3>
            <p className="text-xs text-slate-600">
              CNPJ: <span className="font-mono text-slate-700">{estabelecimento.cnpjCpf}</span> • {estabelecimento.cnaeDescricao}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {estabelecimento.nivelRisco}
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Alimenta o {indicadorAfetado}
              </span>
            </div>
          </div>

          {/* Data da Inspeção */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" strokeWidth={2} />
              Data da Vistoria Sanitária (2026) *
            </label>
            <input
              type="date"
              required
              value={dataInspecao}
              onChange={(e) => setDataInspecao(e.target.value)}
              className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none font-semibold text-slate-800"
            />
          </div>

          {/* Fiscais Participantes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" strokeWidth={2} />
              Fiscais Sanitários Presentes *
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {fiscaisAtivos.map(fiscal => {
                const checked = fiscaisSelecionados.includes(fiscal);
                return (
                  <button
                    key={fiscal}
                    type="button"
                    onClick={() => toggleFiscal(fiscal)}
                    className={`min-h-[44px] text-xs px-3.5 rounded-lg border transition cursor-pointer font-semibold flex items-center ${
                      checked
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

          {/* Renovação do Alvará */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={renovarAlvara}
                onChange={(e) => setRenovarAlvara(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-700" strokeWidth={2} />
                Emitir / Renovar Alvará Sanitário Válido
              </span>
            </label>

            {renovarAlvara && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Número do Alvará
                  </label>
                  <input
                    type="text"
                    value={novoAlvaraNumero}
                    onChange={(e) => setNovoAlvaraNumero(e.target.value)}
                    className="w-full min-h-[40px] text-xs px-2.5 rounded border border-slate-300 bg-white outline-none font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Validade
                  </label>
                  <input
                    type="date"
                    value={novaValidadeAlvara}
                    onChange={(e) => setNovaValidadeAlvara(e.target.value)}
                    className="w-full min-h-[40px] text-xs px-2.5 rounded border border-slate-300 bg-white outline-none text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botões com 44px min-height */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="min-h-[44px] px-4 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="min-h-[44px] px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Confirmar e Atualizar Meta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
