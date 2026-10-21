import React from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  FileText,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';

export const RelatorioOficialPage: React.FC = () => {
  const { indicadores, estabelecimentos, exportarPlanilha } = useVigiMinas();

  return (
    <div className="space-y-6">
      
      {/* Topo do Relatório */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Prestação de Contas • SES/MG
            </span>
            <span className="text-xs text-slate-400 font-mono">Exercício 2026</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Quadro Demonstrativo Oficial do Programa VigiMinas
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Relatório gerencial consolidado para prestação de contas à Superintendência Regional de Saúde (SRS) e Secretaria de Estado de Saúde de Minas Gerais.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="min-h-[44px] px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Imprimir Relatório</span>
          </button>

          <button
            onClick={exportarPlanilha}
            className="min-h-[44px] px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-97"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Baixar Planilha (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tabela Oficial de Metas Pactuadas */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Apuração Consolidada dos Indicadores 11 a 15 (Resolução SES/MG)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Município: <strong>Braúnas/MG</strong> • Código IBGE: 3108909
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Ano 2026 Vigente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Indicador</th>
                <th className="py-3 px-4">Denominação Técnica</th>
                <th className="py-3 px-4">Meta Pactuada SES/MG</th>
                <th className="py-3 px-4 text-center">Numerador</th>
                <th className="py-3 px-4 text-center">Denominador</th>
                <th className="py-3 px-4 text-center">Resultado Alcançado</th>
                <th className="py-3 px-4 text-right">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* Indicador 11 */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                  Indicador 11
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  Inspeções em Ambientes e Processos de Trabalho (VAPT)
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-mono">
                  &ge; 2 vistorias no ano
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                  {indicadores.ind11TotalInspecoesAno} vistorias
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                  2 mínimas
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                  {indicadores.ind11TotalInspecoesAno}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {indicadores.ind11MetaAtingida ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CUMPRIDA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> EM ANDAMENTO
                    </span>
                  )}
                </td>
              </tr>

              {/* Indicador 12 */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-mono font-bold text-blue-800">
                  Indicador 12
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  Cadastro Municipal de Estabelecimentos Sujeitos à VISA
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-mono">
                  Cadastro Atualizado e Ativo
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                  {indicadores.ind12Ativos} ativos
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                  {indicadores.ind12TotalCadastrados} total
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                  100%
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" /> REGULAR
                  </span>
                </td>
              </tr>

              {/* Indicador 13 */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                  Indicador 13
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  Percentual de estabelecimentos de Risco I inspecionados
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-mono">
                  &ge; 15,0%
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                  {indicadores.ind13InspecionadosAno}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                  {indicadores.ind13TotalRiscoI} ativos
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                  {indicadores.ind13Percentual.toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right">
                  {indicadores.ind13MetaAtingida ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CUMPRIDA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> ABAIXO
                    </span>
                  )}
                </td>
              </tr>

              {/* Indicador 14 */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                  Indicador 14
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  Percentual de estabelecimentos de Risco II com alvará inspecionados
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-mono">
                  &ge; 90,0%
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                  {indicadores.ind14InspecionadosAno}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                  {indicadores.ind14TotalRiscoII} ativos
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                  {indicadores.ind14Percentual.toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right">
                  {indicadores.ind14MetaAtingida ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CUMPRIDA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> ABAIXO
                    </span>
                  )}
                </td>
              </tr>

              {/* Indicador 15 */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-mono font-bold text-rose-800">
                  Indicador 15
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  Percentual de estabelecimentos de Risco III inspecionados
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-mono">
                  100,0%
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                  {indicadores.ind15InspecionadosAno}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                  {indicadores.ind15TotalRiscoIII} ativos
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                  {indicadores.ind15Percentual.toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right">
                  {indicadores.ind15MetaAtingida ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CUMPRIDA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                      <AlertCircle className="w-3 h-3 text-rose-600" /> PENDENTE
                    </span>
                  )}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Observações Legais e Fiscais */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Notas Técnicas de Auditoria Sanitária:
        </h4>
        <p className="leading-relaxed">
          1. Os dados acima refletem fielmente o banco de dados oficial do município de Braúnas/MG, com sincronização em nuvem e integridade referencial.
        </p>
        <p className="leading-relaxed">
          2. Em cumprimento à determinação da Secretaria de Estado de Saúde (SES/MG), todos os cadastros baixados/inativos permanecem preservados no histórico da Vigilância Sanitária Municipal com as respectivas datas de baixa averbadas.
        </p>
        <p className="leading-relaxed font-semibold text-slate-800">
          Equipe Fiscalizadora Responsável: Lucas Silveira, Matheus Oliveira e Edmila Ferreira.
        </p>
      </div>

    </div>
  );
};
