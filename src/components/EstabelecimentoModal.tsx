import React, { useState, useEffect } from 'react';
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
  Trash2
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

export const EstabelecimentoModal: React.FC<EstabelecimentoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onExcluir,
  estabelecimentoParaEditar
}) => {
  const [formData, setFormData] = useState<Estabelecimento>({
    id: '',
    cnpjCpf: '',
    razaoSocial: '',
    nomeFantasia: '',
    endereco: {
      logradouro: '',
      numero: '',
      bairro: 'Centro',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '',
      email: ''
    },
    cnaeCodigo: '',
    cnaeDescricao: '',
    nivelRisco: 'Risco II',
    dataUltimaInspecaoInicio: '',
    dataUltimaInspecaoFim: '',
    dataProximaInspecao: '',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '',
    numeroAlvara: '',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: [FISCAIS_MUNICIPIO[0]]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (estabelecimentoParaEditar) {
      setFormData(estabelecimentoParaEditar);
    } else {
      setFormData({
        id: `braunas-est-${Date.now()}`,
        cnpjCpf: '',
        razaoSocial: '',
        nomeFantasia: '',
        endereco: {
          logradouro: '',
          numero: '',
          bairro: 'Centro',
          cep: '35169-000',
          municipio: 'Braúnas/MG'
        },
        contato: {
          telefone: '',
          email: ''
        },
        cnaeCodigo: '47.11-3/02',
        cnaeDescricao: 'Comércio varejista de mercadorias em geral (Minimercados, mercearias e armazéns)',
        nivelRisco: 'Risco II',
        dataUltimaInspecaoInicio: '',
        dataUltimaInspecaoFim: '',
        dataProximaInspecao: '',
        situacaoEstabelecimento: 'Ativo',
        situacaoAlvara: 'Válido',
        dataValidadeAlvara: '',
        numeroAlvara: `ALV-2026/${Math.floor(Math.random() * 80 + 10)}`,
        observacoesBaixa: '',
        competenciaFiscalizacao: 'Municipal',
        parecerProjetoArquitetonico: 'Sim',
        fiscaisUltimaInspecao: [FISCAIS_MUNICIPIO[0]]
      });
    }
    setErrors({});
  }, [estabelecimentoParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleCnaeSelect = (cnaeItem: typeof CNAE_LISTA_COMUM[0]) => {
    setFormData(prev => ({
      ...prev,
      cnaeCodigo: cnaeItem.codigo,
      cnaeDescricao: cnaeItem.descricao,
      nivelRisco: cnaeItem.risco as NivelRisco
    }));
  };

  const validate = (): boolean => {
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
      errs.cnaeCodigo = 'Código CNAE é obrigatório.';
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handlePreencherDataBaixaHoje = () => {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    setFormData(prev => ({
      ...prev,
      observacoesBaixa: `Baixado em ${dia}/${mes}/${ano} - `
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200/90 my-0 sm:my-8 flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho Limpo */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {estabelecimentoParaEditar ? 'Editar Estabelecimento' : 'Novo Cadastro Sanitário'}
              </h2>
              <span className="text-[11px] text-slate-400">Vigilância Sanitária Municipal • Braúnas/MG</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-11 h-11 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário com Scroll Vertical Seguro */}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CNPJ ou CPF *
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpjCpf}
                  onChange={(e) => setFormData({ ...formData, cnpjCpf: aplicarMascaraCnpjCpf(e.target.value) })}
                  className={`w-full min-h-[44px] text-xs px-3 rounded-lg border ${
                    errors.cnpjCpf ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 focus:border-emerald-600'
                  } outline-none font-mono text-slate-800`}
                />
                {errors.cnpjCpf && <p className="text-[11px] text-rose-600 mt-1">{errors.cnpjCpf}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  placeholder="Nome empresarial formal"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                  className={`w-full min-h-[44px] text-xs px-3 rounded-lg border ${
                    errors.razaoSocial ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 focus:border-emerald-600'
                  } outline-none text-slate-800 font-semibold`}
                />
                {errors.razaoSocial && <p className="text-[11px] text-rose-600 mt-1">{errors.razaoSocial}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  placeholder="Nome comercial público"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Competência Fiscalizatória
                </label>
                <select
                  value={formData.competenciaFiscalizacao}
                  onChange={(e) => setFormData({ ...formData, competenciaFiscalizacao: e.target.value as CompetenciaFiscalizacao })}
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <AlertTriangle className="w-4 h-4 text-emerald-700" strokeWidth={2} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Atividade Econômica (CNAE) e Nível de Risco Sanitário
              </h3>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-1">
                Atividades Típicas em Braúnas/MG:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                {CNAE_LISTA_COMUM.map((item) => (
                  <button
                    key={item.codigo}
                    type="button"
                    onClick={() => handleCnaeSelect(item)}
                    className={`min-h-[36px] text-[11px] px-2.5 py-1 rounded border text-left transition cursor-pointer flex items-center ${
                      formData.cnaeCodigo === item.codigo
                        ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono mr-1">{item.codigo}</span>
                    <span>{item.descricao.slice(0, 30)}...</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código CNAE *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 47.11-3/02"
                  value={formData.cnaeCodigo}
                  onChange={(e) => setFormData({ ...formData, cnaeCodigo: e.target.value })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none font-mono text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição CNAE
                </label>
                <input
                  type="text"
                  placeholder="Descrição da atividade econômica"
                  value={formData.cnaeDescricao}
                  onChange={(e) => setFormData({ ...formData, cnaeDescricao: e.target.value })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grau de Risco Sanitário *
                </label>
                <select
                  value={formData.nivelRisco}
                  onChange={(e) => setFormData({ ...formData, nivelRisco: e.target.value as NivelRisco })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none bg-white font-bold text-slate-800"
                >
                  <option value="Risco I">Risco I - Baixo Risco (Meta Ind. 13: &ge; 15%)</option>
                  <option value="Risco II">Risco II - Médio Risco (Meta Ind. 14: &ge; 90%)</option>
                  <option value="Risco III">Risco III - Alto Risco (Meta Ind. 15: 100%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parecer Projeto Arquitetônico
                </label>
                <select
                  value={formData.parecerProjetoArquitetonico}
                  onChange={(e) => setFormData({ ...formData, parecerProjetoArquitetonico: e.target.value as ParecerProjeto })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logradouro *
                </label>
                <input
                  type="text"
                  placeholder="Praça Monsenhor Horta, Rua Antônio Dias, etc."
                  value={formData.endereco.logradouro}
                  onChange={(e) => setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, logradouro: e.target.value }
                  })}
                  className={`w-full min-h-[44px] text-xs px-3 rounded-lg border ${
                    errors.logradouro ? 'border-rose-500' : 'border-slate-300'
                  } outline-none text-slate-800`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  placeholder="120 ou S/N"
                  value={formData.endereco.numero}
                  onChange={(e) => setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, numero: e.target.value }
                  })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  placeholder="Centro, Bela Vista, Zona Rural"
                  value={formData.endereco.bairro}
                  onChange={(e) => setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, bairro: e.target.value }
                  })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  placeholder="35169-000"
                  value={formData.endereco.cep}
                  onChange={(e) => setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, cep: aplicarMascaraCep(e.target.value) }
                  })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Município / UF
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.endereco.municipio}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  placeholder="(33) 3295-0000"
                  value={formData.contato.telefone}
                  onChange={(e) => setFormData({
                    ...formData,
                    contato: { ...formData.contato, telefone: aplicarMascaraTelefone(e.target.value) }
                  })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={formData.contato.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contato: { ...formData.contato, email: e.target.value }
                  })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Situação Cadastral *
                </label>
                <select
                  value={formData.situacaoEstabelecimento}
                  onChange={(e) => {
                    const novoStatus = e.target.value as SituacaoEstabelecimento;
                    setFormData(prev => ({
                      ...prev,
                      situacaoEstabelecimento: novoStatus,
                      observacoesBaixa: novoStatus === 'Inativo' && !prev.observacoesBaixa ? 'Baixado em ' : prev.observacoesBaixa
                    }));
                  }}
                  className={`w-full min-h-[44px] text-xs px-3 rounded-lg border outline-none font-bold ${
                    formData.situacaoEstabelecimento === 'Ativo'
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                      : 'border-slate-400 bg-slate-100 text-slate-900'
                  }`}
                >
                  <option value="Ativo">Ativo (Em funcionamento regular)</option>
                  <option value="Inativo">Inativo (Encerrado / Baixado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Situação do Alvará Sanitário
                </label>
                <select
                  value={formData.situacaoAlvara}
                  onChange={(e) => setFormData({ ...formData, situacaoAlvara: e.target.value as SituacaoAlvara })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none bg-white text-slate-800"
                >
                  <option value="Válido">Válido</option>
                  <option value="Vencido">Vencido</option>
                  <option value="Isento/Dispensado">Isento / Dispensado</option>
                </select>
              </div>
            </div>

            {/* Regra VigiMinas para Baixa de Estabelecimento */}
            {formData.situacaoEstabelecimento === 'Inativo' && (
              <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    Regra VigiMinas (SES/MG): Registro Obrigatório da Data de Baixa
                  </span>
                  <button
                    type="button"
                    onClick={handlePreencherDataBaixaHoje}
                    className="text-[11px] font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                  >
                    Inserir data de hoje
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder='Ex: Baixado em 14/01/2026 - Encerramento formal das atividades comerciais com distrato social.'
                  value={formData.observacoesBaixa}
                  onChange={(e) => setFormData({ ...formData, observacoesBaixa: e.target.value })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Alvará
                </label>
                <input
                  type="text"
                  placeholder="Ex: ALV-2026/014"
                  value={formData.numeroAlvara}
                  onChange={(e) => setFormData({ ...formData, numeroAlvara: e.target.value })}
                  className="w-full min-h-[44px] text-xs px-3 rounded-lg border border-slate-300 outline-none font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Validade do Alvará
                </label>
                <input
                  type="date"
                  value={formData.dataValidadeAlvara}
                  onChange={(e) => setFormData({ ...formData, dataValidadeAlvara: e.target.value })}
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
                  <label className="block text-[11px] text-slate-500 mb-1">Início da Inspeção</label>
                  <input
                    type="date"
                    value={formData.dataUltimaInspecaoInicio}
                    onChange={(e) => setFormData({ ...formData, dataUltimaInspecaoInicio: e.target.value })}
                    className="w-full min-h-[40px] text-xs px-2.5 rounded border border-slate-300 bg-white text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Fim da Inspeção</label>
                  <input
                    type="date"
                    value={formData.dataUltimaInspecaoFim}
                    onChange={(e) => setFormData({ ...formData, dataUltimaInspecaoFim: e.target.value })}
                    className="w-full min-h-[40px] text-xs px-2.5 rounded border border-slate-300 bg-white text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Próxima Inspeção Prevista</label>
                  <input
                    type="date"
                    value={formData.dataProximaInspecao}
                    onChange={(e) => setFormData({ ...formData, dataProximaInspecao: e.target.value })}
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
                onClick={() => {
                  onExcluir(
                    estabelecimentoParaEditar.id, 
                    estabelecimentoParaEditar.razaoSocial, 
                    estabelecimentoParaEditar.cnpjCpf
                  );
                }}
                disabled={submitting}
                className="min-h-[44px] px-3.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Excluir (Soft Delete)</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Salvando...' : 'Salvar Cadastro'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
