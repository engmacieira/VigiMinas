import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  FileSpreadsheet, 
  ShieldCheck, 
  Building2, 
  Clock, 
  AlertTriangle, 
  Apple, 
  Building, 
  FolderSearch, 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Target,
  ShieldAlert
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';

interface ReportCardProps {
  title: string;
  description: string;
  badge: 'disponivel' | 'em_breve';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  badge,
  icon: Icon,
  iconColor,
  iconBg,
  onAction,
  actionLabel = 'Acessar Relatório',
  actionDisabled = false,
}) => {
  const isAvailable = badge === 'disponivel';

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border transition-all duration-200 p-5 ${
        isAvailable
          ? 'bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-md'
          : 'bg-slate-50/70 border-slate-200/80 opacity-90'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
          </div>
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Disponível
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
              <Clock className="w-3 h-3 text-amber-600" />
              Em breve
            </span>
          )}
        </div>

        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
          {title}
        </h4>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end">
        {isAvailable ? (
          <button
            type="button"
            onClick={onAction}
            className="w-full sm:w-auto min-h-[38px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full sm:w-auto min-h-[38px] px-3.5 py-2 rounded-lg bg-slate-200/80 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Em desenvolvimento</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const RelatoriosPage: React.FC = () => {
  const navigate = useNavigate();
  const { configuracao, indicadores } = useVigiMinas();

  const anoExercicio = configuracao?.exercicioAtivo?.anoExercicio || indicadores?.anoReferencia || 2026;
  const municipio = configuracao?.secretaria?.municipio 
    ? `${configuracao.secretaria.municipio}/${configuracao.secretaria.uf || 'MG'}`
    : 'Braúnas/MG';

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* 1. CABEÇALHO INSTITUCIONAL VIGIMINAS                           */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
        {/* Efeito sutil de background decorativo */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {/* Indicador Institucional VigiMinas */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                VigiMinas • SES-MG
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Exercício {anoExercicio}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 hidden sm:inline">
                {municipio}
              </span>
            </div>

            <h2 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
              <ClipboardList className="w-7 h-7 text-emerald-400 shrink-0" strokeWidth={2.2} />
              Central de Relatórios
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Catálogo unificado de emissão e auditoria dos relatórios sanitários oficiais,
              indicadores de pactuação da Resolução SES/MG e dossiês de estabelecimentos municipais.
            </p>
          </div>

          {/* Card Resumo do Módulo */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status do Catálogo</p>
              <p className="text-xs font-bold text-slate-200">8 Disponíveis • Catálogo Completo</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SEÇÃO A: RELATÓRIOS OFICIAIS E CONSOLIDADOS                 */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Relatórios Oficiais e Consolidados
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">1 Relatório disponível</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            title="Relatório Oficial VigiMinas"
            description="Resumo executivo completo com indicadores pactuados, metas de fiscalização alcançadas e situação geral da Vigilância Sanitária municipal para envio à SES-MG."
            badge="disponivel"
            icon={FileSpreadsheet}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            onAction={() => navigate('/relatorio-oficial')}
            actionLabel="Acessar Relatório"
          />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SEÇÃO B: INDICADORES DO PROGRAMA VIGIMINAS (SES-MG)         */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Indicadores do Programa VigiMinas (SES-MG)
            </h3>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70 font-medium">
            5 Disponíveis • 100% dos Indicadores Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card Indicador 11 */}
          <ReportCard
            title="Relatório Indicador 11 (VAPT)"
            description="Inspeções em Ambientes e Processos de Trabalho. Metas de Saúde do Trabalhador, projeção de repasse financeiro e acompanhamento de auditoria (Res. SES/MG nº 10.917/2026)."
            badge="disponivel"
            icon={Activity}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
            onAction={() => navigate('/relatorios/indicador-11')}
            actionLabel="Acessar Relatório"
          />

          {/* Card Indicador 12 */}
          <ReportCard
            title="Relatório Indicador 12 (VISA)"
            description="Cadastro municipal de estabelecimentos sujeitos ao controle sanitário atualizado. Totais de Risco I, II e III para o Formulário Unificado SES-MG."
            badge="disponivel"
            icon={Building2}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            onAction={() => navigate('/relatorios/indicador-12')}
            actionLabel="Acessar Relatório"
          />

          {/* Card Indicador 13 */}
          <ReportCard
            title="Relatório Indicador 13 (Risco I)"
            description="Inspeção em estabelecimentos de Risco I (Baixo Risco). Meta estadual de 15% de cobertura e acompanhamento da fila de fiscalização (Res. SES/MG nº 10.917/2026)."
            badge="disponivel"
            icon={Building2}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            onAction={() => navigate('/relatorios/indicador-13')}
            actionLabel="Acessar Relatório"
          />

          {/* Card Indicador 14 */}
          <ReportCard
            title="Relatório Indicador 14 (Risco II)"
            description="Inspeções Sanitárias em Médio Risco. Meta estadual de 90% com impacto financeiro por faixas de cumprimento (Res. SES/MG nº 10.917/2026)."
            badge="disponivel"
            icon={Target}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            onAction={() => navigate('/relatorios/indicador-14')}
            actionLabel="Acessar Relatório"
          />

          {/* Card Indicador 15 */}
          <ReportCard
            title="Relatório Indicador 15 (Alto Risco III)"
            description="Inspeções Sanitárias em Estabelecimentos de Risco Crítico. Meta estadual mandatória de 100% de cobertura e impacto financeiro estrito (Res. SES/MG nº 10.917/2026)."
            badge="disponivel"
            icon={ShieldAlert}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
            onAction={() => navigate('/relatorios/indicador-15')}
            actionLabel="Acessar Relatório"
          />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SEÇÃO C: GESTÃO DE ESTABELECIMENTOS E CADASTROS            */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Gestão de Estabelecimentos e Cadastros
            </h3>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70 font-medium">
            2 Disponíveis • Concluído
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card Empresas Cadastradas Consolidadas */}
          <ReportCard
            title="Empresas Cadastradas Consolidadas"
            description="Listagem analítica da base municipal sujeita a controle sanitário, com filtros por CNAE, porte, responsável técnico e situação de alvará."
            badge="disponivel"
            icon={Building}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            onAction={() => navigate('/relatorios/empresas-consolidadas')}
            actionLabel="Acessar Relatório"
          />

          {/* Card Ficha Individual da Empresa */}
          <ReportCard
            title="Ficha Individual da Empresa"
            description="Dossiê completo da empresa com histórico de inspeções, autos de infração, termos de notificação e pronto para impressão ou exportação."
            badge="disponivel"
            icon={FolderSearch}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            onAction={() => navigate('/relatorios/ficha-empresa')}
            actionLabel="Acessar Relatório"
          />
        </div>
      </section>
    </div>
  );
};

export default RelatoriosPage;
