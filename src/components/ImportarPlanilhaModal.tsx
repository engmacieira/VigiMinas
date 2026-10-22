import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileText, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { Estabelecimento, NivelRisco } from '../types/vigiminas';
import { ResultadoParsePlanilha } from '../services/vigiminasService';

interface ImportarPlanilhaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportarPlanilhaModal: React.FC<ImportarPlanilhaModalProps> = ({ isOpen, onClose }) => {
  const { 
    gerarModeloPlanilha, 
    processarArquivoPlanilha, 
    importarLotePlanilha,
    estabelecimentos: listaExistente 
  } = useVigiMinas();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [tamanhoArquivo, setTamanhoArquivo] = useState<string | null>(null);
  const [resultadoParse, setResultadoParse] = useState<ResultadoParsePlanilha | null>(null);
  const [processandoLeitura, setProcessandoLeitura] = useState(false);
  const [importando, setImportando] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);

  if (!isOpen) return null;

  // Mapa rápido de CNPJ existentes para identificar se a linha é atualização ou novo cadastro
  const cnpjsCadastrados = new Set(
    listaExistente.map(e => e.cnpjCpf.replace(/\D/g, '')).filter(Boolean)
  );

  // Leitura do arquivo .xls ou .xlsx
  const handleArquivo = async (file: File) => {
    if (!file) return;

    const extensao = file.name.split('.').pop()?.toLowerCase();
    if (extensao !== 'xls' && extensao !== 'xlsx') {
      alert('Por favor, selecione um arquivo válido do Excel (.xls ou .xlsx).');
      return;
    }

    setNomeArquivo(file.name);
    setTamanhoArquivo(`${(file.size / 1024).toFixed(1)} KB`);
    setProcessandoLeitura(true);

    try {
      const buffer = await file.arrayBuffer();
      const resultado = processarArquivoPlanilha(buffer);
      setResultadoParse(resultado);
      setMostrarErros(resultado.erros.length > 0 && resultado.validos.length === 0);
    } catch (err) {
      console.error('Erro ao ler planilha:', err);
      alert('Não foi possível ler os dados do arquivo. Certifique-se de que a planilha não está corrompida.');
    } finally {
      setProcessandoLeitura(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleArquivo(e.target.files[0]);
    }
  };

  const handleConfirmarImportacao = async () => {
    if (!resultadoParse || resultadoParse.validos.length === 0) return;

    setImportando(true);
    try {
      await importarLotePlanilha(resultadoParse.validos);
      handleLimpar();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setImportando(false);
    }
  };

  const handleLimpar = () => {
    setNomeArquivo(null);
    setTamanhoArquivo(null);
    setResultadoParse(null);
    setMostrarErros(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRiscoBadge = (risco: NivelRisco) => {
    switch (risco) {
      case 'Risco I':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Risco I</span>;
      case 'Risco II':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Risco II</span>;
      case 'Risco III':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-950 border border-rose-300">Risco III</span>;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh] transition duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Importar Estabelecimentos via Planilha (.xls / .xlsx)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Alimente a base de dados da Vigilância Sanitária em lote com validação e auditoria automática.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer transition duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal com Scroll Interno */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Passo 1: Download do Modelo Oficial */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                  Passo 1
                </span>
                <span className="font-bold text-emerald-950 text-xs">
                  Baixe a Planilha Modelo Oficial (Preenchimento Padronizado)
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed max-w-xl">
                O arquivo modelo já vem com todas as 24 colunas oficiais do VigiMinas, exemplos de drogarias, supermercados e laboratórios, e aba explicativa de regras de preenchimento.
              </p>
            </div>

            <button
              onClick={gerarModeloPlanilha}
              className="h-10 px-4 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 shadow-2xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-emerald-700" strokeWidth={2.2} />
              <span>Baixar Modelo (.xlsx)</span>
            </button>
          </div>

          {/* Passo 2: Zona de Upload / Arrastar Arquivo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  Passo 2
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  Selecione ou Arraste a Planilha Preenchida (.xls ou .xlsx)
                </span>
              </div>
              {nomeArquivo && (
                <button
                  onClick={handleLimpar}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Trocar arquivo
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />

            {!nomeArquivo ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition duration-150 flex flex-col items-center justify-center gap-3 ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <Upload className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Clique para selecionar ou arraste o arquivo aqui
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formatos suportados: Microsoft Excel (.xlsx) e Excel 97-2003 (.xls)
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{nomeArquivo}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{tamanhoArquivo}</p>
                  </div>
                </div>

                {processandoLeitura ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Lendo planilha...</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Arquivo Carregado
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Passo 3: Relatório de Análise e Pré-Visualização */}
          {resultadoParse && (
            <div className="space-y-4 pt-2">
              
              {/* Badges de Status da Leitura */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total de Linhas Analisadas</p>
                  <p className="text-lg font-extrabold text-slate-800 mt-0.5">{resultadoParse.totalLinhas}</p>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-emerald-800">Prontos para Importar</p>
                  <p className="text-lg font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    {resultadoParse.validos.length} estabelecimentos
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${
                  resultadoParse.erros.length > 0 
                    ? 'bg-amber-50/80 border-amber-200' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Linhas Inconsistentes</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-lg font-extrabold ${resultadoParse.erros.length > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                      {resultadoParse.erros.length}
                    </p>
                    {resultadoParse.erros.length > 0 && (
                      <button
                        onClick={() => setMostrarErros(!mostrarErros)}
                        className="text-[11px] font-bold text-amber-900 underline cursor-pointer"
                      >
                        {mostrarErros ? 'Ocultar detalhes' : 'Ver inconsistências'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabela de Inconsistências (se houver) */}
              {mostrarErros && resultadoParse.erros.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Inconsistências encontradas (estas linhas serão ignoradas):
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {resultadoParse.erros.map((err, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-amber-200/80 flex items-center justify-between gap-2 text-[11px]">
                        <div>
                          <strong className="text-amber-950">Linha {err.linha}:</strong>{' '}
                          <span className="text-slate-600">{err.razaoSocial || err.cnpj || 'Sem identificação'}</span>
                        </div>
                        <span className="text-rose-700 font-medium shrink-0">{err.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabela de Pré-Visualização dos Válidos */}
              {resultadoParse.validos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      Pré-visualização dos Registros Válidos ({resultadoParse.validos.length})
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Mostrando os primeiros {Math.min(resultadoParse.validos.length, 10)} registros
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Razão Social / Fantasia</th>
                          <th className="p-2.5">CNPJ / CPF</th>
                          <th className="p-2.5">Risco</th>
                          <th className="p-2.5">CNAE</th>
                          <th className="p-2.5">Bairro</th>
                          <th className="p-2.5">Alvará</th>
                          <th className="p-2.5 text-center">Operação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resultadoParse.validos.slice(0, 10).map((est, idx) => {
                          const cnpjPuro = est.cnpjCpf.replace(/\D/g, '');
                          const isAtualizacao = cnpjsCadastrados.has(cnpjPuro);

                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition duration-150">
                              <td className="p-2.5 font-bold text-slate-900 max-w-[200px] truncate">
                                {est.razaoSocial}
                                {est.nomeFantasia && est.nomeFantasia !== est.razaoSocial && (
                                  <span className="block text-[10px] text-slate-500 font-normal truncate">
                                    {est.nomeFantasia}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-mono text-slate-600">{est.cnpjCpf}</td>
                              <td className="p-2.5">{getRiscoBadge(est.nivelRisco)}</td>
                              <td className="p-2.5 font-mono text-slate-600">{est.cnaeCodigo}</td>
                              <td className="p-2.5 text-slate-600 truncate">{est.endereco.bairro}</td>
                              <td className="p-2.5 text-slate-600">
                                <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                  est.situacaoAlvara === 'Válido' ? 'bg-emerald-100 text-emerald-800' :
                                  est.situacaoAlvara === 'Isento/Dispensado' ? 'bg-sky-100 text-sky-800' :
                                  est.situacaoAlvara === 'Não Possui (Irregular)' ? 'bg-amber-100 text-amber-950 border border-amber-300' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {est.situacaoAlvara}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                {isAtualizacao ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    Atualização
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    Novo
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {resultadoParse.validos.length > 10 && (
                    <p className="text-[11px] text-slate-400 text-right">
                      ... e mais {resultadoParse.validos.length - 10} estabelecimentos prontos para importação.
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé com Ações */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={() => { handleLimpar(); onClose(); }}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 font-semibold text-xs transition duration-150 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmarImportacao}
            disabled={!resultadoParse || resultadoParse.validos.length === 0 || importando}
            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition duration-150 flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            {importando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importando e auditando no Firestore...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Confirmar Importação ({resultadoParse ? resultadoParse.validos.length : 0})
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
