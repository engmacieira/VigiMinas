import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  X, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  Building2,
  Table,
  Sliders,
  Calendar,
  Lock,
  Layers
} from 'lucide-react';
import { 
  Estabelecimento, 
  FormatoExportacao, 
  DelimitadorCsv, 
  EscopoExportacao,
  OpcoesExportacao 
} from '../types/vigiminas';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { useAuth } from '../contexts/AuthContext';

interface ExportarEstabelecimentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  estabelecimentosFiltrados?: Estabelecimento[];
}

export const ExportarEstabelecimentosModal: React.FC<ExportarEstabelecimentosModalProps> = ({
  isOpen,
  onClose,
  estabelecimentosFiltrados = []
}) => {
  const { estabelecimentos, exportarEstabelecimentos, configuracao } = useVigiMinas();
  const { usuario } = useAuth();

  const [formato, setFormato] = useState<FormatoExportacao>('xlsx');
  const [delimitadorCsv, setDelimitadorCsv] = useState<DelimitadorCsv>(';');
  const [escopo, setEscopo] = useState<EscopoExportacao>('todos');
  const [incluirMetadados, setIncluirMetadados] = useState<boolean>(true);
  const [registrarAuditoria, setRegistrarAuditoria] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Cálculos dinâmicos dos escopos
  const totalGeral = estabelecimentos.length;
  const totalAtivos = estabelecimentos.filter(e => e.situacaoEstabelecimento === 'Ativo' || e.situacaoEstabelecimento === 'Suspenso').length;
  const totalBaixados = estabelecimentos.filter(e => e.situacaoEstabelecimento === 'Inativo').length;
  const totalFiltrados = estabelecimentosFiltrados.length;

  let totalSelecionado = totalGeral;
  if (escopo === 'ativos') totalSelecionado = totalAtivos;
  else if (escopo === 'baixados') totalSelecionado = totalBaixados;
  else if (escopo === 'filtrados') totalSelecionado = totalFiltrados;

  const dataAtual = new Date().toISOString().split('T')[0];
  const extensao = formato === 'csv' ? 'csv' : (formato === 'xls' ? 'xls' : 'xlsx');
  const previewNomeArquivo = `Backup_Estabelecimentos_VISA_Braunas_${escopo.toUpperCase()}_${dataAtual}.${extensao}`;

  const handleExecutarExportacao = async () => {
    setIsExporting(true);
    try {
      const opcoes: OpcoesExportacao = {
        formato,
        delimitadorCsv,
        escopo,
        estabelecimentosFiltrados,
        incluirMetadados,
        registrarAuditoria,
        usuarioEmail: usuario?.email || usuario?.username || 'usuario_sistema',
        fiscalResponsavel: usuario?.nomeCompleto || configuracao.fiscais.find(f => f.ativo)?.nome || 'Equipe VISA Braúnas'
      };

      await exportarEstabelecimentos(opcoes);
      onClose();
    } catch (err) {
      console.error('Erro na exportação:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-800 border border-emerald-200">
              <Download className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                Exportar Dados de Estabelecimentos
              </h3>
              <p className="text-xs text-slate-500">
                Gere cópias de segurança (backup) ou arquivos estruturados para análise externa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition duration-150 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* 1. Seleção de Formato de Arquivo */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              1. Selecione o Formato do Arquivo
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opção XLSX */}
              <button
                type="button"
                onClick={() => setFormato('xlsx')}
                className={`p-3.5 rounded-xl border text-left transition duration-150 cursor-pointer flex flex-col justify-between ${
                  formato === 'xlsx'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      Excel (.xlsx)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Pasta de Trabalho moderna com formatação, 28 colunas e aba de metadados.
                  </p>
                </div>
              </button>

              {/* Opção CSV */}
              <button
                type="button"
                onClick={() => setFormato('csv')}
                className={`p-3.5 rounded-xl border text-left transition duration-150 cursor-pointer flex flex-col justify-between ${
                  formato === 'csv'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-700" />
                      Texto CSV (.csv)
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                      Universal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Dados puros delimitados com UTF-8 BOM. Compatível com Excel, PowerBI e Python.
                  </p>
                </div>
              </button>

              {/* Opção XLS Legado */}
              <button
                type="button"
                onClick={() => setFormato('xls')}
                className={`p-3.5 rounded-xl border text-left transition duration-150 cursor-pointer flex flex-col justify-between ${
                  formato === 'xls'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-amber-700" />
                      Excel 97 (.xls)
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                      Legado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Compatibilidade máxima com versões antigas e sistemas legados da SES/MG.
                  </p>
                </div>
              </button>
            </div>

            {/* Ajustes específicos de CSV */}
            {formato === 'csv' && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Separador de Campos do CSV:</span>
                  <span className="text-[11px] text-slate-500">
                    O ponto e vírgula evita que números decimais e textos em português sejam agrupados incorretamente.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDelimitadorCsv(';')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                      delimitadorCsv === ';' 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Ponto e vírgula (;) - Padrão Brasil
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelimitadorCsv(',')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                      delimitadorCsv === ',' 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Vírgula (,) - Internacional
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Seleção do Escopo dos Dados */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-600" />
              2. Escopo dos Dados a Exportar
            </label>

            <div className="space-y-2">
              {/* Todos */}
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition duration-150 ${
                escopo === 'todos'
                  ? 'border-emerald-600 bg-emerald-50/40 text-slate-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="escopo"
                    checked={escopo === 'todos'}
                    onChange={() => setEscopo('todos')}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold">Todos os Estabelecimentos Cadastrados</span>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Cópia completa de segurança de toda a base municipal (ativos e baixados).
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full font-bold border border-slate-200">
                  {totalGeral} registros
                </span>
              </label>

              {/* Apenas Ativos */}
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition duration-150 ${
                escopo === 'ativos'
                  ? 'border-emerald-600 bg-emerald-50/40 text-slate-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="escopo"
                    checked={escopo === 'ativos'}
                    onChange={() => setEscopo('ativos')}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold">Apenas Estabelecimentos Ativos</span>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Empresas em operação regular para fiscalização sanitária rotineira.
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                  {totalAtivos} ativos
                </span>
              </label>

              {/* Registros Filtrados na Tela Atual */}
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition duration-150 ${
                escopo === 'filtrados'
                  ? 'border-emerald-600 bg-emerald-50/40 text-slate-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="escopo"
                    checked={escopo === 'filtrados'}
                    onChange={() => setEscopo('filtrados')}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold">Registros Filtrados na Tabela</span>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Exporta exatamente o que está visível com seus filtros de busca atuais.
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full font-bold border border-blue-200">
                  {totalFiltrados} filtrados
                </span>
              </label>

              {/* Apenas Baixados */}
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition duration-150 ${
                escopo === 'baixados'
                  ? 'border-emerald-600 bg-emerald-50/40 text-slate-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="escopo"
                    checked={escopo === 'baixados'}
                    onChange={() => setEscopo('baixados')}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold">Apenas Estabelecimentos Baixados (Histórico)</span>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Empresas com encerramento de atividades ou baixa de alvará.
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold border border-slate-200">
                  {totalBaixados} baixados
                </span>
              </label>
            </div>
          </div>

          {/* 3. Opções Complementares e Auditoria */}
          <div className="space-y-3 pt-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              3. Opções Complementares & Governança
            </label>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 space-y-3">
              {formato !== 'csv' && (
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800 font-medium">
                  <input
                    type="checkbox"
                    checked={incluirMetadados}
                    onChange={(e) => setIncluirMetadados(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Incluir aba secundária com resumo estatístico e metadados de emissão</span>
                </label>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800 font-medium">
                <input
                  type="checkbox"
                  checked={registrarAuditoria}
                  onChange={(e) => setRegistrarAuditoria(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Registrar este evento de exportação no Livro Oficial de Auditoria do Sistema</span>
              </label>
            </div>
          </div>

          {/* Card Resumo do Arquivo a Gerar */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                Arquivo de Saída:
              </span>
              <p className="font-mono text-emerald-950 font-bold break-all mt-0.5">
                {previewNomeArquivo}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Total de <strong>{totalSelecionado}</strong> estabelecimentos com <strong>28 colunas</strong> cadastrais e fiscais completas.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-800">Pronto para Download</span>
            </div>
          </div>

        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-300 transition duration-150 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExecutarExportacao}
            disabled={isExporting || totalSelecionado === 0}
            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold transition duration-150 ease-out flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} strokeWidth={2.2} />
            <span>{isExporting ? 'Exportando dados...' : `Baixar Arquivo (${formato.toUpperCase()})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
