import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Building2, 
  Save, 
  AlertCircle, 
  MapPin, 
  Phone, 
  FileText, 
  Calendar,
  AlertTriangle,
  Trash2,
  Plus,
  Tag,
  Layers,
  Check
} from 'lucide-react';
import { 
  Estabelecimento, 
  NivelRisco, 
  SituacaoEstabelecimento, 
  SituacaoAlvara, 
  CompetenciaFiscalizacao, 
  ParecerProjeto 
} from '../types/vigiminas';
import { 
  CNAE_LISTA_COMUM, 
  FISCAIS_MUNICIPIO 
} from '../data/braunasInitialData';
import { 
  aplicarMascaraCnpjCpf, 
  aplicarMascaraCep, 
  aplicarMascaraTelefone 
} from '../services/vigiminasService';

interface EstabelecimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (est: Estabelecimento) => Promise<void>;
  onExcluir?: (id: string, razao: string, cnpj?: string) => void;
  estabelecimentoParaEditar: Estabelecimento | null;
}

export const EstabelecimentoModal: React.FC<EstabelecimentoModalProps> = React.memo(({
  isOpen,
  onClose,
  onSave,
  onExcluir,
  estabelecimentoParaEditar
}) => {
  const [formData, setFormData] = useState<Estabelecimento>({
    id: '',
    cnpjCpf: '',
    identificacaoMunicipal: '',
    razaoSocial: '',
    nomeFantasia: '',
    endereco: {
      logradouro: '',
      numero: '',
      bairro: 'Centro',
      cep: '35189-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '',
      email: ''
    },
    cnaeCodigo: '47.12-01/00',
    cnaeDescricao: 'Comércio varejista de mercadorias em geral (Minimercados, mercearias e armazéns)',
    cnaesSecundarios: [],
    nivelRisco: 'Risco I',
    dataUltimaInspecaoInicio: '',
    dataUltimaInspecaoFim: '',
    dataProximaInspecao: '',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '',
    numeroAlvara: '',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Não Aplicável',
    fiscaisUltimaInspecao: [FISCAIS_MUNICIPIO[0]]
  });

  const [novoCnaeSecundarioCodigo, setNovoCnaeSecundarioCodigo] = useState('');
  const [novoCnaeSecundarioDescricao, setNovoCnaeSecundarioDescricao] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (estabelecimentoParaEditar) {
      setFormData({
        ...estabelecimentoParaEditar,
        identificacaoMunicipal: estabelecimentoParaEditar.identificacaoMunicipal || '',
        cnaesSecundarios: estabelecimentoParaEditar.cnaesSecundarios || []
      });
    } else {
      setFormData({
        id: `braunas-est-${Date.now()}`,
        cnpjCpf: '',
        identificacaoMunicipal: '',
        razaoSocial: '',
        nomeFantasia: '',
        endereco: {
          logradouro: '',
          numero: '',
          bairro: 'Centro',
          cep: '35189-000',
          municipio: 'Braúnas/MG'
        },
        contato: {
          telefone: '',
          email: ''
        },
        cnaeCodigo: '47.12-01/00',
        cnaeDescricao: 'Comércio varejista de mercadorias em geral (Minimercados, mercearias e armazéns)',
        cnaesSecundarios: [],
        nivelRisco: 'Risco I',
        dataUltimaInspecaoInicio: '',
        dataUltimaInspecaoFim: '',
        dataProximaInspecao: '',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
        dataValidadeAlvara: '',
        numeroAlvara: `ALV-2026/${Math.floor(Math.random() * 80 + 10)}`,
        observacoesBaixa: '',
        competenciaFiscalizacao: 'Municipal',
        parecerProjetoArquitetonico: 'Não Aplicável',
        fiscaisUltimaInspecao: [FISCAIS_MUNICIPIO[0]]
      });
    }
    setNovoCnaeSecundarioCodigo('');
    setNovoCnaeSecundarioDescricao('');
    setErrors({});
  }, [estabelecimentoParaEditar, isOpen]);

  // Tecla Escape para fechar modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  const handleCnaeSelect = useCallback((cnaeItem: typeof CNAE_LISTA_COMUM[0]) => {
    setFormData(prev => ({
      ...prev,
      cnaeCodigo: cnaeItem.codigo,
      cnaeDescricao: cnaeItem.descricao,
      nivelRisco: cnaeItem.risco as NivelRisco,
      parecerProjetoArquitetonico: cnaeItem.risco === 'Risco I' ? 'Não Aplicável' : prev.parecerProjetoArquitetonico
    }));
  }, []);

  const handleAdicionarCnaeSecundario = useCallback((codigoParam?: string, descricaoParam?: string) => {
    const cod = (codigoParam || novoCnaeSecundarioCodigo).trim();
    const desc = (descricaoParam || novoCnaeSecundarioDescricao).trim();
    if (!cod) return;

    const textoCompleto = desc ? `${cod} - ${desc}` : cod;

    setFormData(prev => {
      const listaAtual = prev.cnaesSecundarios || [];
      if (listaAtual.includes(textoCompleto) || listaAtual.some(item => item.startsWith(cod))) {
        return prev;
      }
      return {
        ...prev,
        cnaesSecundarios: [...listaAtual, textoCompleto]
      };
    });

    setNovoCnaeSecundarioCodigo('');
    setNovoCnaeSecundarioDescricao('');
  }, [novoCnaeSecundarioCodigo, novoCnaeSecundarioDescricao]);

  const handleRemoverCnaeSecundario = useCallback((indexParaRemover: number) => {
    setFormData(prev => ({
      ...prev,
      cnaesSecundarios: (prev.cnaesSecundarios || []).filter((_, i) => i !== indexParaRemover)
    }));
  }, []);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.cnpjCpf.trim()) {
      errs.cnpjCpf = 'CNPJ ou CPF é obrigatório.';
    } else if (formData.cnpjCpf.replace(/\D/g, '').length !== 11 && formData.cnpjCpf.replace(/\D/g, '').length !== 14) {
      errs.cnpjCpf = 'Documento deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).';
    }

    if (!formData.razaoSocial.trim()) {
      errs.razaoSocial = 'Razão Social é obrigatória.';
    }

    if (!formData.cnaeCodigo.trim()) {
      errs.cnaeCodigo = 'CNAE Principal é de preenchimento obrigatório.';
    }

    if (!formData.endereco.logradouro.trim()) {
      errs.logradouro = 'Logradouro é obrigatório.';
    }

    // Regra de Negócio VigiMinas (SES/MG)
    if (formData.situacaoEstabelecimento === 'Inativo') {
      if (!formData.observacoesBaixa.trim()) {
        errs.observacoesBaixa = 'Regra VigiMinas: Obrigatório informar data e motivo no formato "Baixado em DD/MM/AAAA".';
      } else if (!/Baixado em \d{2}\/\d{2}\/\d{4}/i.test(formData.observacoesBaixa)) {
        errs.observacoesBaixa = 'Formato exigido pela SES/MG: Deve conter "Baixado em DD/MM/AAAA" (ex: "Baixado em 14/01/2026 - Distrato social").';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar estabelecimento:', error);
    } finally {
      setSubmitting(false);
    }
  }, [validate, onSave, formData, onClose]);

  const handlePreencherDataBaixaHoje = useCallback(() => {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    setFormData(prev => ({
      ...prev,
      observacoesBaixa: `Baixado em ${dia}/${mes}/${ano} - `
    }));
  }, []);

  const handleExcluirClick = useCallback(() => {
    if (estabelecimentoParaEditar && onExcluir) {
      onExcluir(
        estabelecimentoParaEditar.id,
        estabelecimentoParaEditar.razaoSocial,
        estabelecimentoParaEditar.cnpjCpf
      );
    }
  }, [estabelecimentoParaEditar, onExcluir]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200/80 my-0 sm:my-8 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-estabelecimento-titulo"
      >
        
        {/* Cabeçalho Limpo */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="modal-estabelecimento-titulo" className="text-base font-bold text-white leading-tight">
                {estabelecimentoParaEditar ? 'Editar Estabelecimento' : 'Novo Cadastro Sanitário'}
              </h2>
              <span className="text-[11px] text-slate-400">Vigilância Sanitária Municipal • Braúnas/MG</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-11 h-11 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Seção 1: Identificação */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <FileText className="w-4 h-4 text-emerald-700" strokeWidth={2} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Identificação Jurídica
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="input-cnpjCpf" className="block text-xs font-semibold text-slate-700 mb-1">
                  CNPJ ou CPF *
                </label>
                <input
                  id="input-cnpjCpf"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpjCpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpjCpf: aplicarMascaraCnpjCpf(e.target.value) }))}
                  className={`w-full min-h-[44px] text-xs px-3 rounded-xl border ${
                    errors.cnpjCpf ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                  } transition-all outline-none font-mono text-slate-800`}
                />
                {errors.cnpjCpf && <p className="text-[11px] text-rose-600 mt-1">{errors.cnpjCpf}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="input-razaoSocial" className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social *
                </label>
                <input
                  id="input-razaoSocial"
                  type="text"
                  placeholder="Nome empresarial formal"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                  className={`w-full min-h-[44px] text-xs px-3 rounded-xl border ${
                    errors.razaoSocial ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                  } transition-all outline-none text-slate-800 font-semibold`}
                />
                {errors.razaoSocial && <p className="text-[11px] text-rose-600 mt-1">{errors.razaoSocial}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="input-nomeFantasia" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  id="input-nomeFantasia"
                  type="text"
                  placeholder="Nome comercial público"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="input-identificacaoMunicipal" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Identificação Municipal</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </label>
                <input
                  id="input-identificacaoMunicipal"
                  type="text"
                  placeholder="Ex: IM-1420 ou 8492-A"
                  value={formData.identificacaoMunicipal || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, identificacaoMunicipal: e.target.value }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800 font-mono"
                />
              </div>

              <div>
                <label htmlFor="select-competencia" className="block text-xs font-semibold text-slate-700 mb-1">
                  Competência Fiscalizatória
                </label>
                <select
                  id="select-competencia"
                  value={formData.competenciaFiscalizacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, competenciaFiscalizacao: e.target.value as CompetenciaFiscalizacao }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none bg-white text-slate-800"
                >
                  <option value="Municipal">Municipal (Braúnas/MG)</option>
                  <option value="Estadual">Estadual (SES/MG)</option>
                  <option value="Pactuado">Pactuado com Estado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Atividade Econômica e Risco */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <AlertTriangle className="w-4 h-4 text-emerald-700" strokeWidth={2} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Atividade Econômica (CNAE Principal e Secundários) e Risco Sanitário
              </h3>
            </div>

            {/* Bloco 2.1: CNAE Principal */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" />
                  CNAE Principal (Obrigatório)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Enquadramento Oficial
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Atividades Típicas em Braúnas/MG (Clique para preencher o CNAE Principal):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white rounded-lg border border-slate-200">
                  {CNAE_LISTA_COMUM.map((item) => (
                    <button
                      key={item.codigo}
                      type="button"
                      onClick={() => handleCnaeSelect(item)}
                      aria-label={`Selecionar CNAE ${item.codigo} - ${item.descricao}`}
                      className={`min-h-[34px] text-[11px] px-2.5 py-1 rounded border text-left transition cursor-pointer flex items-center gap-1 ${
                        formData.cnaeCodigo === item.codigo
                          ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-mono font-semibold">{item.codigo}</span>
                      <span className="truncate max-w-[200px]">{item.descricao}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                        formData.cnaeCodigo === item.codigo 
                          ? 'bg-emerald-800 text-emerald-100' 
                          : item.risco === 'Risco I' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : item.risco === 'Risco II' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.risco}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="input-cnaeCodigo" className="block text-xs font-semibold text-slate-700 mb-1">
                    Código CNAE Principal *
                  </label>
                  <input
                    id="input-cnaeCodigo"
                    type="text"
                    placeholder="Ex: 47.12-01/00"
                    value={formData.cnaeCodigo}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleanDigits = val.replace(/[^0-9]/g, '');
                      if (cleanDigits === '47120100' || cleanDigits === '4712100' || val.trim() === '47.12-01/00' || val.trim() === '47.12-1/00') {
                        setFormData(prev => ({
                          ...prev,
                          cnaeCodigo: val,
                          cnaeDescricao: 'Comércio varejista de mercadorias em geral (Minimercados, mercearias e armazéns)',
                          nivelRisco: 'Risco I',
                          parecerProjetoArquitetonico: 'Não Aplicável'
                        }));
                        return;
                      }
                      const matched = CNAE_LISTA_COMUM.find(c => c.codigo.toLowerCase() === val.trim().toLowerCase());
                      if (matched) {
                        setFormData(prev => ({
                          ...prev,
                          cnaeCodigo: val,
                          cnaeDescricao: matched.descricao,
                          nivelRisco: matched.risco as NivelRisco,
                          parecerProjetoArquitetonico: matched.risco === 'Risco I' ? 'Não Aplicável' : prev.parecerProjetoArquitetonico
                        }));
                      } else {
                        setFormData(prev => ({ ...prev, cnaeCodigo: val }));
                      }
                    }}
                    className={`w-full min-h-[44px] text-xs px-3 rounded-lg border ${
                      errors.cnaeCodigo ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 focus:border-emerald-600'
                    } outline-none font-mono text-slate-800 bg-white`}
                  />
                  {errors.cnaeCodigo && <p className="text-[11px] text-rose-600 mt-1">{errors.cnaeCodigo}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="input-cnaeDescricao" className="block text-xs font-semibold text-slate-700 mb-1">
                    Descrição da Atividade Principal *
                  </label>
                  <input
                    id="input-cnaeDescricao"
                    type="text"
                    placeholder="Descrição formal da atividade principal"
                    value={formData.cnaeDescricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnaeDescricao: e.target.value }))}
                    className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2.2: CNAEs Secundários */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    CNAEs Secundários (Atividades Adicionais)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Campo opcional para registrar outras atividades econômicas exercidas pelo mesmo estabelecimento.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {(formData.cnaesSecundarios || []).length} secundário(s)
                </span>
              </div>

              {/* Formulário de Adição de CNAE Secundário */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    id="input-novo-cnae-codigo"
                    aria-label="Código CNAE Secundário"
                    placeholder="Código (ex: 47.21-1/03)"
                    value={novoCnaeSecundarioCodigo}
                    onChange={(e) => setNovoCnaeSecundarioCodigo(e.target.value)}
                    className="w-full min-h-[40px] text-xs px-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none font-mono text-slate-800 bg-white"
                  />
                </div>
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    id="input-novo-cnae-descricao"
                    aria-label="Descrição CNAE Secundário"
                    placeholder="Descrição da atividade secundária"
                    value={novoCnaeSecundarioDescricao}
                    onChange={(e) => setNovoCnaeSecundarioDescricao(e.target.value)}
                    className="w-full min-h-[40px] text-xs px-3 rounded-lg border border-slate-300 focus:border-teal-600 outline-none text-slate-800 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => handleAdicionarCnaeSecundario()}
                    disabled={!novoCnaeSecundarioCodigo.trim()}
                    aria-label="Adicionar CNAE Secundário"
                    className="w-full min-h-[40px] px-3 rounded-lg bg-teal-700 hover:bg-teal-600 active:scale-97 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Atalhos Rápidos para Secundários */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600 pt-1">
                <span className="font-medium text-slate-500 text-[10px]">Atalhos para secundários:</span>
                {CNAE_LISTA_COMUM.slice(0, 6).map(item => (
                  <button
                    key={`sec-${item.codigo}`}
                    type="button"
                    onClick={() => handleAdicionarCnaeSecundario(item.codigo, item.descricao)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 transition cursor-pointer text-[10px] font-mono flex items-center gap-1"
                  >
                    <span>+ {item.codigo}</span>
                  </button>
                ))}
              </div>

              {/* Badges dos CNAEs Secundários */}
              <div className="pt-2">
                {(formData.cnaesSecundarios && formData.cnaesSecundarios.length > 0) ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.cnaesSecundarios.map((cnaeSec, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs shadow-2xs"
                      >
                        <span className="font-medium leading-tight">{cnaeSec}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoverCnaeSecundario(idx)}
                          aria-label={`Remover CNAE secundário ${cnaeSec}`}
                          title="Remover este CNAE secundário"
                          className="w-5 h-5 rounded-md hover:bg-rose-100 text-teal-700 hover:text-rose-700 flex items-center justify-center transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Nenhum CNAE secundário vinculado até o momento.
                  </p>
                )}
              </div>
            </div>

            {/* Risco Sanitário e Parecer Arquitetônico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="select-nivelRisco" className="block text-xs font-semibold text-slate-700 mb-1">
                  Grau de Risco Sanitário *
                </label>
                <select
                  id="select-nivelRisco"
                  value={formData.nivelRisco}
                  onChange={(e) => setFormData(prev => ({ ...prev, nivelRisco: e.target.value as NivelRisco }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none bg-white font-bold text-slate-800"
                >
                  <option value="Risco I">Risco I - Baixo Risco (Meta Ind. 13: &ge; 15%)</option>
                  <option value="Risco II">Risco II - Médio Risco (Meta Ind. 14: &ge; 90%)</option>
                  <option value="Risco III">Risco III - Alto Risco (Meta Ind. 15: 100%)</option>
                </select>
              </div>

              <div>
                <label htmlFor="select-parecerProjeto" className="block text-xs font-semibold text-slate-700 mb-1">
                  Parecer Projeto Arquitetônico
                </label>
                <select
                  id="select-parecerProjeto"
                  value={formData.parecerProjetoArquitetonico}
                  onChange={(e) => setFormData(prev => ({ ...prev, parecerProjetoArquitetonico: e.target.value as ParecerProjeto }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none bg-white text-slate-800"
                >
                  <option value="Sim">Sim (Aprovado)</option>
                  <option value="Não">Não (Pendente/Reprovado)</option>
                  <option value="Não Aplicável">Não Aplicável (Baixo Risco)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 3: Endereço & Contato */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-emerald-700" strokeWidth={2} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Endereço em Braúnas/MG e Contato
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="input-logradouro" className="block text-xs font-semibold text-slate-700 mb-1">
                  Logradouro *
                </label>
                <input
                  id="input-logradouro"
                  type="text"
                  placeholder="Praça Monsenhor Horta, Rua Antônio Dias, etc."
                  value={formData.endereco.logradouro}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, logradouro: e.target.value }
                  }))}
                  className={`w-full min-h-[44px] text-xs px-3 rounded-lg border ${
                    errors.logradouro ? 'border-rose-500' : 'border-slate-300'
                  } outline-none text-slate-800`}
                />
                {errors.logradouro && <p className="text-[11px] text-rose-600 mt-1">{errors.logradouro}</p>}
              </div>

              <div>
                <label htmlFor="input-numero" className="block text-xs font-semibold text-slate-700 mb-1">
                  Número
                </label>
                <input
                  id="input-numero"
                  type="text"
                  placeholder="120 ou S/N"
                  value={formData.endereco.numero}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, numero: e.target.value }
                  }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="input-bairro" className="block text-xs font-semibold text-slate-700 mb-1">
                  Bairro
                </label>
                <input
                  id="input-bairro"
                  type="text"
                  placeholder="Centro, Bela Vista, Zona Rural"
                  value={formData.endereco.bairro}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, bairro: e.target.value }
                  }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="input-cep" className="block text-xs font-semibold text-slate-700 mb-1">
                  CEP
                </label>
                <input
                  id="input-cep"
                  type="text"
                  placeholder="35189-000"
                  value={formData.endereco.cep}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, cep: aplicarMascaraCep(e.target.value) }
                  }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none font-mono text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="input-municipio" className="block text-xs font-semibold text-slate-700 mb-1">
                  Município / UF
                </label>
                <input
                  id="input-municipio"
                  type="text"
                  disabled
                  value={formData.endereco.municipio}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-telefone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone
                </label>
                <input
                  id="input-telefone"
                  type="text"
                  placeholder="(33) 3295-0000"
                  value={formData.contato.telefone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contato: { ...prev.contato, telefone: aplicarMascaraTelefone(e.target.value) }
                  }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="input-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  id="input-email"
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={formData.contato.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contato: { ...prev.contato, email: e.target.value }
                  }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Situação Cadastral e Alvará */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <Calendar className="w-4 h-4 text-emerald-700" strokeWidth={2} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Situação Cadastral e Alvará Sanitário
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="situacaoEstabelecimento" className="block text-xs font-semibold text-slate-700 mb-1">
                  Situação Cadastral *
                </label>
                <select
                  id="situacaoEstabelecimento"
                  value={formData.situacaoEstabelecimento}
                  onChange={(e) => {
                    const novoStatus = e.target.value as SituacaoEstabelecimento;
                    setFormData(prev => ({
                      ...prev,
                      situacaoEstabelecimento: novoStatus,
                      observacoesBaixa: novoStatus === 'Inativo' && !prev.observacoesBaixa ? 'Baixado em ' :
                                        novoStatus === 'Suspenso' && !prev.observacoesBaixa ? 'Suspenso/Interditado em ' :
                                        prev.observacoesBaixa
                    }));
                  }}
                  className={`w-full min-h-[44px] text-xs px-3 rounded-lg border outline-none font-bold ${
                    formData.situacaoEstabelecimento === 'Ativo'
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                      : formData.situacaoEstabelecimento === 'Suspenso'
                      ? 'border-amber-400 bg-amber-50 text-amber-950'
                      : 'border-slate-400 bg-slate-100 text-slate-900'
                  }`}
                >
                  <option value="Ativo">Ativo (Em funcionamento regular)</option>
                  <option value="Suspenso">Suspenso (Interditado / Suspensão Sanitária)</option>
                  <option value="Inativo">Inativo (Encerrado / Baixado)</option>
                </select>
              </div>

              <div>
                <label htmlFor="situacaoAlvara" className="block text-xs font-semibold text-slate-700 mb-1">
                  Situação do Alvará Sanitário
                </label>
                <select
                  id="situacaoAlvara"
                  value={formData.situacaoAlvara}
                  onChange={(e) => setFormData(prev => ({ ...prev, situacaoAlvara: e.target.value as SituacaoAlvara }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none bg-white text-slate-800"
                >
                  <option value="Válido">Válido</option>
                  <option value="Vencido">Vencido</option>
                  <option value="Isento/Dispensado">Isento / Dispensado</option>
                  <option value="Não Possui (Irregular)">Não Possui (Irregular)</option>
                </select>
                {formData.situacaoAlvara === 'Não Possui (Irregular)' && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                      <strong>Irregular:</strong> A empresa deveria possuir alvará sanitário mas opera sem a devida licença. Sujeita a notificação fiscal e regularização perante a VISA.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Alerta de Estabelecimento Suspenso / Interditado */}
            {formData.situacaoEstabelecimento === 'Suspenso' && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Interdição / Suspensão Sanitária (Contabilizado na Base Ativa)
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  O estabelecimento está suspenso ou interditado cautelarmente pela Vigilância Sanitária. Conforme as diretrizes, ele <strong>continua na contagem dos ativos</strong> para metas de fiscalização e monitoramento sanitário.
                </p>
                <div>
                  <label htmlFor="textarea-observacoes-suspenso" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Motivo / Auto de Infração / Termo de Interdição (Opcional):
                  </label>
                  <textarea
                    id="textarea-observacoes-suspenso"
                    rows={2}
                    placeholder="Ex: Suspenso/Interditado cautelarmente conforme Auto de Infração nº 08/2026 por inconformidades físico-sanitárias graves."
                    value={formData.observacoesBaixa}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoesBaixa: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white outline-none text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Regra VigiMinas para Baixa de Estabelecimento */}
            {formData.situacaoEstabelecimento === 'Inativo' && (
              <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="textarea-observacoes-baixa" className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    Regra VigiMinas (SES/MG): Registro Obrigatório da Data de Baixa
                  </label>
                  <button
                    type="button"
                    onClick={handlePreencherDataBaixaHoje}
                    className="text-[11px] font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                  >
                    Inserir data de hoje
                  </button>
                </div>
                <textarea
                  id="textarea-observacoes-baixa"
                  rows={2}
                  placeholder='Ex: Baixado em 14/01/2026 - Encerramento formal das atividades comerciais com distrato social.'
                  value={formData.observacoesBaixa}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoesBaixa: e.target.value }))}
                  className={`w-full text-xs p-3 rounded-lg border ${
                    errors.observacoesBaixa ? 'border-rose-500 bg-rose-50' : 'border-amber-300 bg-white'
                  } outline-none text-slate-800`}
                />
                {errors.observacoesBaixa && (
                  <p className="text-[11px] font-bold text-rose-700">{errors.observacoesBaixa}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-numeroAlvara" className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Alvará
                </label>
                <input
                  id="input-numeroAlvara"
                  type="text"
                  placeholder="Ex: ALV-2026/014"
                  value={formData.numeroAlvara}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroAlvara: e.target.value }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none font-mono text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="input-dataValidadeAlvara" className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Validade do Alvará
                </label>
                <input
                  id="input-dataValidadeAlvara"
                  type="date"
                  value={formData.dataValidadeAlvara}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataValidadeAlvara: e.target.value }))}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Datas de Inspeção */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Inspeção Sanitária (Alimenta Indicadores 13, 14 ou 15):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="input-dataUltimaInspecaoInicio" className="block text-[11px] text-slate-500 mb-1">Início da Inspeção</label>
                  <input
                    id="input-dataUltimaInspecaoInicio"
                    type="date"
                    value={formData.dataUltimaInspecaoInicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataUltimaInspecaoInicio: e.target.value }))}
                    className="w-full min-h-[40px] text-xs px-2.5 rounded border border-slate-300 bg-white text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-dataUltimaInspecaoFim" className="block text-[11px] text-slate-500 mb-1">Fim da Inspeção</label>
                  <input
                    id="input-dataUltimaInspecaoFim"
                    type="date"
                    value={formData.dataUltimaInspecaoFim}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataUltimaInspecaoFim: e.target.value }))}
                    className="w-full min-h-[40px] text-xs px-2.5 rounded border border-slate-300 bg-white text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-dataProximaInspecao" className="block text-[11px] text-slate-500 mb-1">Próxima Inspeção Prevista</label>
                  <input
                    id="input-dataProximaInspecao"
                    type="date"
                    value={formData.dataProximaInspecao}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataProximaInspecao: e.target.value }))}
                    className="w-full min-h-[40px] text-xs px-2.5 rounded border border-slate-300 bg-white text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 shrink-0">
            {estabelecimentoParaEditar && onExcluir ? (
              <button
                type="button"
                onClick={handleExcluirClick}
                disabled={submitting}
                className="min-h-[44px] px-3.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Excluir Estabelecimento</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Cadastro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

EstabelecimentoModal.displayName = 'EstabelecimentoModal';
