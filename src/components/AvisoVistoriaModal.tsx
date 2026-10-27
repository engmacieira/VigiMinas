import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckSquare, 
  AlertTriangle,
  User,
  Layers,
  Phone,
  Mail,
  ChevronDown,
  BellRing
} from 'lucide-react';
import { Estabelecimento, NivelRisco } from '../types/vigiminas';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { safePrint } from '../utils/printHelper';

export interface AvisoVistoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  estabelecimento: Estabelecimento | null;
  estabelecimentos?: Estabelecimento[];
}

export const AvisoVistoriaModal: React.FC<AvisoVistoriaModalProps> = ({
  isOpen,
  onClose,
  estabelecimento,
  estabelecimentos = []
}) => {
  const { configuracao } = useVigiMinas();
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Estabelecimento | null>(() => {
    return estabelecimento || (estabelecimentos && estabelecimentos.length > 0 ? estabelecimentos[0] : null);
  });
  const [dataPrevisao, setDataPrevisao] = useState<string>('09 de novembro');
  const [nomeRecebedor, setNomeRecebedor] = useState<string>('');

  useEffect(() => {
    if (estabelecimento) {
      setEmpresaSelecionada(estabelecimento);
    } else if (estabelecimentos && estabelecimentos.length > 0) {
      setEmpresaSelecionada(prev => prev || estabelecimentos[0]);
    }
  }, [estabelecimento, estabelecimentos]);

  if (!isOpen) return null;

  const est = empresaSelecionada || estabelecimento || (estabelecimentos && estabelecimentos.length > 0 ? estabelecimentos[0] : null);

  const municipioNome = configuracao?.secretaria?.municipio || 'Braúnas';
  const ufSigla = configuracao?.secretaria?.uf || 'MG';
  const anoExercicio = configuracao?.exercicioAtivo?.anoExercicio || 2026;
  const hoje = new Date().toLocaleDateString('pt-BR');

  const handlePrint = () => {
    safePrint('aviso-vistoria-print');
  };

  const isAltoOuMedioRisco = est?.nivelRisco === 'Risco II' || est?.nivelRisco === 'Risco III';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-vistoria-titulo"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-auto text-slate-900 print:border-none print:shadow-none print:rounded-none print:m-0 print:max-w-none print:overflow-visible">
        
        {/* ============================================================== */}
        {/* BARRA DE CONTROLE SUPERIOR (OCULTA NA IMPRESSÃO)               */}
        {/* ============================================================== */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 id="aviso-vistoria-titulo" className="text-sm font-bold text-white">
                Aviso de Vistoria Sanitária Anual Programada
              </h2>
              <p className="text-[11px] text-slate-400">
                Comunicado oficial preparatório com checklist de documentação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[38px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal"
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BARRA DE EDIÇÃO RÁPIDA DE DADOS (OCULTA NA IMPRESSÃO)          */}
        {/* ============================================================== */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Seletor de Estabelecimento */}
            {estabelecimentos && estabelecimentos.length > 1 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Estabelecimento Notificado:
                </label>
                <div className="relative">
                  <select
                    value={est?.id || ''}
                    onChange={(e) => {
                      const novo = estabelecimentos.find(item => item.id === e.target.value);
                      if (novo) setEmpresaSelecionada(novo);
                    }}
                    className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    {estabelecimentos.filter(e => !e.isDeleted).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.razaoSocial} {item.nomeFantasia ? `(${item.nomeFantasia})` : ''} - {item.nivelRisco}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Data de Previsão */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Data Prevista para Início:
              </label>
              <input
                type="text"
                value={dataPrevisao}
                onChange={(e) => setDataPrevisao(e.target.value)}
                placeholder="Ex: 09 de novembro"
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            {/* Nome do Recebedor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Recebedor no Local (Opcional):
              </label>
              <input
                type="text"
                value={nomeRecebedor}
                onChange={(e) => setNomeRecebedor(e.target.value)}
                placeholder="Nome de quem recebeu o aviso"
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FOLHA DO DOCUMENTO OFICIAL A4 (#aviso-vistoria-print)          */}
        {/* ============================================================== */}
        <div 
          id="aviso-vistoria-print" 
          className="p-6 sm:p-10 font-sans text-slate-900 bg-white space-y-5 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:space-y-4"
        >
          {/* Cabeçalho Institucional do Documento */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 border border-slate-800">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    ESTADO DE MINAS GERAIS • PREFEITURA MUNICIPAL DE {municipioNome.toUpperCase()} / {ufSigla}
                  </p>
                  <h1 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight leading-tight">
                    Secretaria Municipal de Saúde • Setor de Vigilância Sanitária Municipal
                  </h1>
                  <p className="text-xs font-black text-blue-700 uppercase tracking-wide mt-0.5">
                    COMUNICADO OFICIAL: VISTORIA SANITÁRIA ANUAL PROGRAMADA
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono font-bold bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-800">
                  PROGRAMA VIGIMINAS {anoExercicio}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Emissão: {hoje}
                </p>
              </div>
            </div>
          </div>

          {/* Dados do Estabelecimento Notificado */}
          {est && (
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Dados do Estabelecimento Notificado
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                  est.nivelRisco === 'Risco I' 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : est.nivelRisco === 'Risco II'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {est.nivelRisco} {est.nivelRisco === 'Risco I' ? '(Baixo Risco)' : est.nivelRisco === 'Risco II' ? '(Médio Risco)' : '(Alto Risco)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Razão Social:</span>
                  <strong className="text-slate-900">{est.razaoSocial}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Nome Fantasia:</span>
                  <span className="text-slate-800">{est.nomeFantasia || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">CNPJ / CPF:</span>
                  <span className="font-mono font-bold text-slate-800">{est.cnpjCpf || est.cnpj || 'Não informado'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-500 font-semibold block">Endereço Completo:</span>
                  <span className="text-slate-800">
                    {est.endereco?.logradouro ? `${est.endereco.logradouro}, nº ${est.endereco.numero || 'S/N'}` : 'Logradouro não informado'}
                    {est.endereco?.bairro ? ` - Bairro ${est.endereco.bairro}` : ''}
                    {` - ${est.endereco?.municipio || `${municipioNome}/${ufSigla}`}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Atividade Econômica Principal (CNAE):</span>
                  <span className="font-mono font-semibold text-slate-900">{est.cnaeCodigo}</span>
                  <span className="text-[11px] text-slate-600 block line-clamp-1">{est.cnaeDescricao}</span>
                </div>
              </div>
            </div>
          )}

          {/* Texto Introdutório Formal */}
          <div className="text-xs space-y-2 leading-relaxed text-slate-800">
            <p className="font-bold text-slate-900">
              À Administração / Responsável Legal / Responsável Técnico:
            </p>
            <p className="text-justify">
              Vimos por meio deste notificar que este estabelecimento está incluído no cronograma da <strong>Vistoria Sanitária Anual Regular</strong>.
            </p>
            <p className="text-justify">
              Com o objetivo de conferir agilidade ao procedimento e evitar notificações por falta de documentação no ato da inspeção, solicitamos que os documentos pertinentes à sua atividade econômica (CNAE / Grau de Risco Sanitário) estejam <strong>previamente impressos ou organizados em pasta de fácil acesso</strong> na recepção ou setor administrativo.
            </p>
          </div>

          {/* CHECKLIST DE DOCUMENTAÇÃO OBRIGATÓRIA */}
          <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 space-y-3 text-xs">
            <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                CHECKLIST DE DOCUMENTAÇÃO OBRIGATÓRIA
              </h3>
              <span className="text-[10px] text-slate-500 italic">
                (Apresentar itens pertinentes ao porte e atividade)
              </span>
            </div>

            {/* 1. Documentos Gerais */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-slate-900 uppercase">
                1. Documentos Gerais (Todos os Estabelecimentos / Riscos I, II e III):
              </h4>
              <ul className="space-y-1 pl-1">
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Licença Sanitária / Alvará Sanitário anterior (ou protocolo oficial de renovação)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Alvará de Localização e Funcionamento municipal atualizado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Certificado de higienização do reservatório de água (caixa d'água) e controle de potabilidade (últimos 6 meses)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Comprovante de desinsetização e desratização (Controle Integrado de Pragas) realizado por empresa especializada/licenciada</span>
                </li>
              </ul>
            </div>

            {/* 2. Documentos Específicos para Alimentação, Saúde e Atividades com RT */}
            <div className={`space-y-1.5 pt-2 border-t border-slate-200 ${isAltoOuMedioRisco ? 'font-medium' : ''}`}>
              <h4 className="text-[11px] font-bold text-slate-900 uppercase">
                2. Documentos Específicos para Alimentação, Saúde e Atividades com RT (Médio e Alto Risco - II e III):
              </h4>
              <ul className="space-y-1 pl-1">
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Manual de Boas Práticas (MBP) e Procedimentos Operacionais Padronizados (POPs) atualizados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Comprovante de Capacitação em Boas Práticas dos manipuladores e colaboradores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Atestados de Saúde Ocupacional (ASO) dos funcionários em dia</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Certificado de Regularidade Técnica emitido pelo respectivo Conselho de Classe do Responsável Técnico (quando exigível)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Plano de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS) ou Plano de Resíduos Sólidos (se aplicável)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 rounded-xs inline-block mt-0.5 shrink-0" />
                  <span>Comprovante de calibração e manutenção preventiva de equipamentos e termômetros (se aplicável)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* PREVISÃO DE INSPEÇÃO E AGENDAMENTO */}
          <div className="border-l-4 border-amber-500 bg-amber-50/70 p-3 rounded-r-xl space-y-1.5 text-xs">
            <h4 className="font-bold text-amber-900 uppercase text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              PREVISÃO DE INSPEÇÃO E AGENDAMENTO
            </h4>
            <p className="text-slate-800">
              As inspeções serão realizadas a partir do dia <strong>{dataPrevisao || '09 de novembro'}</strong>.
            </p>
            <p className="text-[11px] text-amber-900 leading-snug">
              <strong>Atenção:</strong> A ausência dos documentos obrigatórios no momento da inspeção pode acarretar a lavratura de Auto de Infração, emissão de termo de notificação com prazo exíguo ou indeferimento da renovação da licença sanitária.
            </p>
          </div>

          {/* TERMO DE RECEBIMENTO E ASSINATURAS */}
          <div className="border-t-2 border-slate-800 pt-3 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold uppercase text-[11px] text-slate-900">
                TERMO DE RECEBIMENTO E ASSINATURAS
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Setor de Vigilância Sanitária Municipal • {municipioNome}/{ufSigla}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <p className="text-slate-700">
                Recebido por (Nome Legível): <strong className="text-slate-900">{nomeRecebedor || '________________________________________________'}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-3 text-center">
              <div>
                <div className="border-t border-slate-800 mx-auto w-4/5 pt-1.5" />
                <p className="font-bold text-[11px] text-slate-900">
                  Assinatura do Responsável no Local
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Data: _____ / _____ / {anoExercicio}
                </p>
              </div>

              <div>
                <div className="border-t border-slate-800 mx-auto w-4/5 pt-1.5" />
                <p className="font-bold text-[11px] text-slate-900">
                  Assinatura Vigilância Sanitária Braúnas
                </p>
              </div>
            </div>

            <div className="text-center pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
              Documento emitido eletronicamente pelo Sistema VigiMinas • Vigilância Sanitária Municipal de {municipioNome}/MG
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvisoVistoriaModal;
