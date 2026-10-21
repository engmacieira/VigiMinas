import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Calendar, 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Save, 
  ShieldCheck, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  X, 
  UserCheck, 
  Tag, 
  RotateCcw,
  Sliders,
  Database,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { FiscalSanitario, DadosSecretaria, ConfiguracaoExercicio } from '../types/vigiminas';
import { ConfirmarExclusaoModal } from '../components/ConfirmarExclusaoModal';

type TabType = 'fiscais' | 'exercicio' | 'secretaria' | 'banco';

export const ConfiguracoesPage: React.FC = () => {
  const { 
    configuracao, 
    adicionarFiscal, 
    atualizarFiscal, 
    removerFiscal, 
    restaurarFiscal,
    atualizarDadosSecretaria, 
    atualizarExercicioAtivo,
    limparBanco,
    restaurarDemonstrativos,
    recarregarDados,
    estabelecimentos,
    inspecoesVapt,
    logsAuditoria,
    loading 
  } = useVigiMinas();

  const [activeTab, setActiveTab] = useState<TabType>('fiscais');
  const [abaFiscais, setAbaFiscais] = useState<'ativos' | 'arquivados'>('ativos');

  // Estado para confirmação de soft delete de fiscal
  const [modalExcluirFiscalAberto, setModalExcluirFiscalAberto] = useState(false);
  const [fiscalParaExcluir, setFiscalParaExcluir] = useState<FiscalSanitario | null>(null);

  // Estados locais para formulário da Secretaria
  const [dadosSecretaria, setDadosSecretaria] = useState<DadosSecretaria>({ ...configuracao.secretaria });
  const [salvandoSecretaria, setSalvandoSecretaria] = useState(false);

  // Estados locais para formulário do Exercício
  const [dadosExercicio, setDadosExercicio] = useState<ConfiguracaoExercicio>({ ...configuracao.exercicioAtivo });
  const [salvandoExercicio, setSalvandoExercicio] = useState(false);

  // Estados para Modal de Fiscal
  const [modalFiscalAberto, setModalFiscalAberto] = useState(false);
  const [fiscalEmEdicao, setFiscalEmEdicao] = useState<FiscalSanitario | null>(null);
  const [fiscalForm, setFiscalForm] = useState<Omit<FiscalSanitario, 'id'>>({
    nome: '',
    matricula: '',
    cargo: 'Fiscal Sanitário Municipal',
    email: '',
    telefone: '',
    ativo: true,
    dataAdmissao: new Date().toISOString().split('T')[0]
  });
  const [erroFiscal, setErroFiscal] = useState<string | null>(null);

  // Sincroniza se a configuração externa for atualizada
  React.useEffect(() => {
    setDadosSecretaria({ ...configuracao.secretaria });
    setDadosExercicio({ ...configuracao.exercicioAtivo });
  }, [configuracao]);

  // Estados para Gestão e Limpeza de Banco de Dados
  const [modalConfirmarLimpeza, setModalConfirmarLimpeza] = useState(false);
  const [limpandoBanco, setLimpandoBanco] = useState(false);
  const [limparLogsOption, setLimparLogsOption] = useState(true);
  const [restaurandoDemo, setRestaurandoDemo] = useState(false);

  const handleExecutarLimpezaBanco = async () => {
    setLimpandoBanco(true);
    try {
      await limparBanco({
        limparEstabelecimentos: true,
        limparInspecoesVapt: true,
        limparLogsAuditoria: limparLogsOption
      });
      setModalConfirmarLimpeza(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLimpandoBanco(false);
    }
  };

  const handleRestaurarDemonstrativos = async () => {
    setRestaurandoDemo(true);
    try {
      await restaurarDemonstrativos();
    } catch (err) {
      console.error(err);
    } finally {
      setRestaurandoDemo(false);
    }
  };

  // Abertura do modal para novo fiscal
  const handleNovoFiscal = () => {
    setFiscalEmEdicao(null);
    setFiscalForm({
      nome: '',
      matricula: `BR-${Math.floor(4000 + Math.random() * 900)}`,
      cargo: 'Fiscal Sanitário Municipal',
      email: '',
      telefone: '(33) 9',
      ativo: true,
      dataAdmissao: new Date().toISOString().split('T')[0]
    });
    setErroFiscal(null);
    setModalFiscalAberto(true);
  };

  // Abertura do modal para editar fiscal
  const handleEditarFiscal = (fiscal: FiscalSanitario) => {
    setFiscalEmEdicao(fiscal);
    setFiscalForm({
      nome: fiscal.nome,
      matricula: fiscal.matricula,
      cargo: fiscal.cargo,
      email: fiscal.email,
      telefone: fiscal.telefone,
      ativo: fiscal.ativo,
      dataAdmissao: fiscal.dataAdmissao || ''
    });
    setErroFiscal(null);
    setModalFiscalAberto(true);
  };

  // Salvar Fiscal
  const handleSalvarFiscal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiscalForm.nome.trim()) {
      setErroFiscal('O nome do fiscal é obrigatório.');
      return;
    }
    if (!fiscalForm.matricula.trim()) {
      setErroFiscal('A matrícula funcional é obrigatória.');
      return;
    }

    try {
      if (fiscalEmEdicao) {
        await atualizarFiscal({
          ...fiscalForm,
          id: fiscalEmEdicao.id
        });
      } else {
        await adicionarFiscal(fiscalForm);
      }
      setModalFiscalAberto(false);
    } catch (err) {
      console.error(err);
      setErroFiscal('Erro ao salvar dados do fiscal.');
    }
  };

  // Alternar Status Ativo do Fiscal
  const handleToggleStatusFiscal = async (fiscal: FiscalSanitario) => {
    await atualizarFiscal({
      ...fiscal,
      ativo: !fiscal.ativo
    });
  };

  const fiscaisRegulares = configuracao.fiscais.filter(f => !f.isDeleted);
  const fiscaisArquivados = configuracao.fiscais.filter(f => f.isDeleted);
  const fiscaisAtivosCount = fiscaisRegulares.filter(f => f.ativo).length;

  // Remover Fiscal (Soft Delete Auditável)
  const handleRemoverFiscal = (fiscal: FiscalSanitario) => {
    setFiscalParaExcluir(fiscal);
    setModalExcluirFiscalAberto(true);
  };

  const handleConfirmarExclusaoFiscal = async (motivo: string) => {
    if (!fiscalParaExcluir) return;
    await removerFiscal(fiscalParaExcluir.id, motivo);
  };

  const handleRestaurarFiscal = async (fiscal: FiscalSanitario) => {
    await restaurarFiscal(fiscal.id);
  };

  // Salvar Secretaria
  const handleSalvarSecretaria = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoSecretaria(true);
    try {
      await atualizarDadosSecretaria(dadosSecretaria);
    } finally {
      setSalvandoSecretaria(false);
    }
  };

  // Salvar Exercício
  const handleSalvarExercicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoExercicio(true);
    try {
      await atualizarExercicioAtivo(dadosExercicio);
    } finally {
      setSalvandoExercicio(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Superior Institucional */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Settings className="w-3 h-3 text-emerald-400" />
              Parâmetros Institucionais
            </span>
            <span className="text-xs text-slate-400 font-mono">Braúnas/MG • SES/MG</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" strokeWidth={2.2} />
            Configurações Gerais do Sistema e Secretaria
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Gestão do corpo técnico de fiscais sanitários, definição do ano de exercício com as metas do Programa VigiMinas e dados cadastrais da Secretaria de Saúde.
          </p>
        </div>

        {/* Resumo Rápido */}
        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-lg border border-slate-700/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Exercício Corrente</span>
            <span className="text-sm font-bold text-emerald-400">{configuracao.exercicioAtivo.anoExercicio}</span>
          </div>
          <div className="w-px h-7 bg-slate-700" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fiscais Habilitados</span>
            <span className="text-sm font-bold text-slate-200">{fiscaisAtivosCount} de {fiscaisRegulares.length}</span>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas de Configuração */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-3 pt-2 gap-2 shadow-2xs overflow-x-auto no-scrollbar">
        
        <button
          onClick={() => setActiveTab('fiscais')}
          className={`min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'fiscais'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Fiscais Sanitários</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {fiscaisRegulares.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('exercicio')}
          className={`min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'exercicio'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>Exercício & Metas VigiMinas</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
            {configuracao.exercicioAtivo.anoExercicio}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('secretaria')}
          className={`min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'secretaria'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-sky-600" />
          <span>Dados da Secretaria & Órgão</span>
        </button>

        <button
          onClick={() => setActiveTab('banco')}
          className={`min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'banco'
              ? 'border-rose-600 text-rose-800 bg-rose-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-rose-600" />
          <span>Base de Dados & Limpeza</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            estabelecimentos.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
          }`}>
            {estabelecimentos.length === 0 ? 'Base Limpa' : `${estabelecimentos.length} reg.`}
          </span>
        </button>

      </div>

      {/* CONTEÚDO DA ABA 1: FISCAIS SANITÁRIOS */}
      {activeTab === 'fiscais' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Quadro de Fiscais Sanitários Municipais
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Os fiscais cadastrados ficam disponíveis nos módulos de inspeção rápida da VISA e nas vistorias VAPT.
              </p>
            </div>

            <button
              onClick={handleNovoFiscal}
              className="min-h-[44px] px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition duration-150 ease-out flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-97"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fiscal Sanitário</span>
            </button>
          </div>

          {/* Sub-abas de Fiscais: Ativos vs Arquivados */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setAbaFiscais('ativos')}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                abaFiscais === 'ativos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Quadro Oficial Ativo</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                abaFiscais === 'ativos' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {fiscaisRegulares.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAbaFiscais('arquivados')}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                abaFiscais === 'arquivados'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Lixeira / Arquivados (Soft Delete)</span>
              {fiscaisArquivados.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  abaFiscais === 'arquivados' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
                }`}>
                  {fiscaisArquivados.length}
                </span>
              )}
            </button>
          </div>

          {/* Grid de Fiscais Ativos */}
          {abaFiscais === 'ativos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fiscaisRegulares.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                  <p className="font-semibold text-slate-700">Nenhum fiscal sanitário cadastrado</p>
                  <p className="text-xs text-slate-400 mt-1">Clique em "Novo Fiscal Sanitário" para iniciar.</p>
                </div>
              ) : (
                fiscaisRegulares.map(fiscal => (
                  <div 
                    key={fiscal.id}
                    className={`bg-white rounded-xl border p-4 transition shadow-2xs flex flex-col justify-between ${
                      fiscal.ativo ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/60 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            fiscal.ativo ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {fiscal.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {fiscal.nome}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Matrícula: {fiscal.matricula}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleStatusFiscal(fiscal)}
                          title={fiscal.ativo ? 'Clique para inativar' : 'Clique para ativar'}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase transition cursor-pointer border ${
                            fiscal.ativo 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {fiscal.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </div>

                      {/* Informações Funcionais */}
                      <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{fiscal.cargo}</span>
                        </div>

                        {fiscal.email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-mono text-[11px] text-slate-600">{fiscal.email}</span>
                          </div>
                        )}

                        {fiscal.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{fiscal.telefone}</span>
                          </div>
                        )}

                        {fiscal.dataAdmissao && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Admissão: {new Date(fiscal.dataAdmissao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleEditarFiscal(fiscal)}
                        className="min-h-[38px] px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleRemoverFiscal(fiscal)}
                        title="Excluir fiscal (Soft Delete)"
                        aria-label="Excluir fiscal"
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 transition flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

          {/* Grid de Fiscais Arquivados / Soft Delete */}
          {abaFiscais === 'arquivados' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fiscaisArquivados.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                  <p className="font-semibold text-slate-700">Nenhum fiscal na lixeira / arquivado</p>
                  <p className="text-xs text-slate-400 mt-1">Fiscais excluídos logicamente permanecerão aqui para fins de histórico e poderão ser restaurados.</p>
                </div>
              ) : (
                fiscaisArquivados.map(fiscal => (
                  <div 
                    key={fiscal.id}
                    className="bg-white rounded-xl border border-rose-200 p-4 transition shadow-2xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 mb-1">
                            <Trash2 className="w-3 h-3" />
                            Arquivado (Soft Delete)
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {fiscal.nome}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Matrícula: {fiscal.matricula} • {fiscal.cargo}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1 mt-2">
                        <span className="font-bold block text-rose-900 text-[11px]">Justificativa do Desligamento:</span>
                        <p>{fiscal.motivoExclusao || 'Exclusão lógica do quadro oficial'}</p>
                        <div className="text-[10px] text-rose-700 pt-1.5 border-t border-rose-100 flex items-center justify-between">
                          <span>Arquivado em: {fiscal.deletedAt ? new Date(fiscal.deletedAt).toLocaleDateString('pt-BR') : '-'}</span>
                          <span className="truncate max-w-[120px]">Por: {fiscal.deletedBy || 'Administrador'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestaurarFiscal(fiscal)}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-97 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restaurar ao Quadro Ativo</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

      {/* CONTEÚDO DA ABA 2: EXERCÍCIO & METAS VIGIMINAS */}
      {activeTab === 'exercicio' && (
        <form onSubmit={handleSalvarExercicio} className="space-y-5">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Exercício Operacional do VigiMinas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define o ano vigente e o período de apuração de todas as metas fiscais e sanitárias.
                </p>
              </div>

              <span className="px-3 py-1 rounded text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
                Exercício Ativo: {dadosExercicio.anoExercicio}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ano do Exercício (VigiMinas) *
                </label>
                <input
                  type="number"
                  required
                  min={2020}
                  max={2035}
                  value={dadosExercicio.anoExercicio}
                  onChange={(e) => setDadosExercicio({ ...dadosExercicio, anoExercicio: parseInt(e.target.value) || 2026 })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 2026</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Início do Período *
                </label>
                <input
                  type="date"
                  required
                  value={dadosExercicio.dataInicioExercicio}
                  onChange={(e) => setDadosExercicio({ ...dadosExercicio, dataInicioExercicio: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Término do Período *
                </label>
                <input
                  type="date"
                  required
                  value={dadosExercicio.dataTerminoExercicio}
                  onChange={(e) => setDadosExercicio({ ...dadosExercicio, dataTerminoExercicio: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Operacional do Exercício
              </label>
              <select
                value={dadosExercicio.statusExercicio}
                onChange={(e) => setDadosExercicio({ ...dadosExercicio, statusExercicio: e.target.value as any })}
                className="w-full sm:w-64 h-11 px-3 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Em Andamento">Em Andamento (Aberto para apuração)</option>
                <option value="Homologado">Homologado (Validado pela SES/MG)</option>
                <option value="Encerrado">Encerrado (Arquivado)</option>
              </select>
            </div>

          </div>

          {/* Painel de Metas Oficiais por Indicador */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Parâmetros e Metas Oficiais do Programa VigiMinas (SES/MG)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Valores pactuados utilizados nos cálculos dinâmicos do painel executivo e nos relatórios de prestação de contas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Meta Indicador 11 */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-[11px] font-bold text-teal-800 uppercase block tracking-wider">
                  Indicador 11 (VAPT)
                </span>
                <span className="text-xs text-slate-600 block leading-snug">
                  Meta mínima de vistorias em ambientes de trabalho no ano:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={dadosExercicio.metaInd11Vapt}
                    onChange={(e) => setDadosExercicio({ ...dadosExercicio, metaInd11Vapt: parseInt(e.target.value) || 2 })}
                    className="w-20 h-10 px-2.5 text-sm font-black text-slate-900 rounded border border-slate-300 bg-white text-center"
                  />
                  <span className="text-xs font-semibold text-slate-500">inspeções</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Padrão SES/MG: ≥ 2</span>
              </div>

              {/* Meta Indicador 13 */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block tracking-wider">
                  Indicador 13 (Risco I)
                </span>
                <span className="text-xs text-slate-600 block leading-snug">
                  % mínimo de Risco I inspecionados no ano:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={dadosExercicio.metaInd13RiscoI}
                    onChange={(e) => setDadosExercicio({ ...dadosExercicio, metaInd13RiscoI: parseFloat(e.target.value) || 15 })}
                    className="w-20 h-10 px-2.5 text-sm font-black text-slate-900 rounded border border-slate-300 bg-white text-center"
                  />
                  <span className="text-xs font-semibold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Padrão SES/MG: ≥ 15%</span>
              </div>

              {/* Meta Indicador 14 */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-[11px] font-bold text-blue-800 uppercase block tracking-wider">
                  Indicador 14 (Risco II)
                </span>
                <span className="text-xs text-slate-600 block leading-snug">
                  % de Risco II com alvará inspecionados no ano:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={dadosExercicio.metaInd14RiscoII}
                    onChange={(e) => setDadosExercicio({ ...dadosExercicio, metaInd14RiscoII: parseFloat(e.target.value) || 90 })}
                    className="w-20 h-10 px-2.5 text-sm font-black text-slate-900 rounded border border-slate-300 bg-white text-center"
                  />
                  <span className="text-xs font-semibold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Padrão SES/MG: ≥ 90%</span>
              </div>

              {/* Meta Indicador 15 */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-[11px] font-bold text-amber-800 uppercase block tracking-wider">
                  Indicador 15 (Risco III)
                </span>
                <span className="text-xs text-slate-600 block leading-snug">
                  % de Risco III inspecionados no ano:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={dadosExercicio.metaInd15RiscoIII}
                    onChange={(e) => setDadosExercicio({ ...dadosExercicio, metaInd15RiscoIII: parseFloat(e.target.value) || 100 })}
                    className="w-20 h-10 px-2.5 text-sm font-black text-slate-900 rounded border border-slate-300 bg-white text-center"
                  />
                  <span className="text-xs font-semibold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Padrão SES/MG: 100%</span>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={salvandoExercicio}
                className="min-h-[44px] px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition duration-150 ease-out flex items-center gap-2 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{salvandoExercicio ? 'Salvando Parâmetros...' : 'Salvar Exercício e Metas'}</span>
              </button>
            </div>

          </div>

          {/* Histórico de Exercícios */}
          {configuracao.exerciciosHistorico.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Histórico de Exercícios Anteriores
              </h4>
              <div className="divide-y divide-slate-100">
                {configuracao.exerciciosHistorico.map(hist => (
                  <div key={hist.anoExercicio} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-800">Exercício {hist.anoExercicio}</span>
                      <span className="text-slate-400">({hist.dataInicioExercicio} a {hist.dataTerminoExercicio})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {hist.statusExercicio}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </form>
      )}

      {/* CONTEÚDO DA ABA 3: DADOS DA SECRETARIA & ÓRGÃO */}
      {activeTab === 'secretaria' && (
        <form onSubmit={handleSalvarSecretaria} className="space-y-5">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Dados Cadastrais da Secretaria e Órgão de Saúde
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Essas informações constam nos timbres de termos oficiais, alvarás, notificações e na planilha SES/MG.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Órgão / Ente Federativo *
                </label>
                <input
                  type="text"
                  required
                  value={dadosSecretaria.nomeOrgao}
                  onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, nomeOrgao: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secretaria / Departamento *
                </label>
                <input
                  type="text"
                  required
                  value={dadosSecretaria.departamento}
                  onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, departamento: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secretário(a) Municipal de Saúde *
                </label>
                <input
                  type="text"
                  required
                  value={dadosSecretaria.secretarioSaude}
                  onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, secretarioSaude: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coordenador(a) da Vigilância Sanitária *
                </label>
                <input
                  type="text"
                  required
                  value={dadosSecretaria.coordenadorVisa}
                  onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, coordenadorVisa: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CNPJ Institucional / Fundo de Saúde *
                </label>
                <input
                  type="text"
                  required
                  value={dadosSecretaria.cnpj}
                  onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, cnpj: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Município / UF
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${dadosSecretaria.municipio}/${dadosSecretaria.uf}`}
                    className="w-full h-11 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código IBGE
                  </label>
                  <input
                    type="text"
                    disabled
                    value={dadosSecretaria.codigoIbge}
                    className="w-full h-11 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-mono"
                  />
                </div>
              </div>

            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Endereço Completo da Sede da VISA *
              </label>
              <input
                type="text"
                required
                value={dadosSecretaria.enderecoCompleto}
                onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, enderecoCompleto: e.target.value })}
                className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone Oficial de Contato *
                </label>
                <input
                  type="text"
                  required
                  value={dadosSecretaria.telefoneOficial}
                  onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, telefoneOficial: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Oficial da VISA *
                </label>
                <input
                  type="email"
                  required
                  value={dadosSecretaria.emailOficial}
                  onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, emailOficial: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Horário de Atendimento ao Público
                </label>
                <input
                  type="text"
                  value={dadosSecretaria.horarioAtendimento}
                  onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, horarioAtendimento: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ato Legal / Portaria de Regulamentação da VISA Municipal
              </label>
              <input
                type="text"
                value={dadosSecretaria.portariaRegulamentacao}
                onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, portariaRegulamentacao: e.target.value })}
                className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Texto de Rodapé Oficial para Documentos Emitidos
              </label>
              <textarea
                rows={2}
                value={dadosSecretaria.textoRodapeOficial}
                onChange={(e) => setDadosSecretaria({ ...dadosSecretaria, textoRodapeOficial: e.target.value })}
                className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={salvandoSecretaria}
                className="min-h-[44px] px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition duration-150 ease-out flex items-center gap-2 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{salvandoSecretaria ? 'Salvando...' : 'Salvar Dados da Secretaria'}</span>
              </button>
            </div>

          </div>

        </form>
      )}

      {/* CONTEÚDO DA ABA 4: GESTÃO & LIMPEZA DO BANCO DE DADOS */}
      {activeTab === 'banco' && (
        <div className="space-y-6">

          {/* Cartão de Status e Diagnóstico do Banco */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-rose-600" />
                  Status da Base de Dados Firestore
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoramento em tempo real dos documentos persistidos no banco de dados do município.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => recarregarDados()}
                  disabled={loading}
                  className="min-h-[40px] px-3.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-97 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
                  <span>Sincronizar Agora</span>
                </button>
              </div>
            </div>

            {/* Painel de Indicadores de Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Estabelecimentos</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">{estabelecimentos.length}</span>
                  <span className="text-[11px] text-slate-500">docs</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Coleção: estabelecimentos</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Vistorias VAPT</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">{inspecoesVapt.length}</span>
                  <span className="text-[11px] text-slate-500">docs</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Coleção: inspecoes_vapt</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Logs de Auditoria</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">{logsAuditoria.length}</span>
                  <span className="text-[11px] text-slate-500">docs</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Coleção: logs_auditoria</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Estado Atual</span>
                <div className="mt-2">
                  {estabelecimentos.length === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      Base Zerada e Limpa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                      <Database className="w-3.5 h-3.5 text-blue-700" />
                      Base Ativa ({estabelecimentos.length} reg.)
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  {estabelecimentos.length === 0 
                    ? 'Pronta para importação de planilha (.xlsx/.csv)' 
                    : 'Pronta para inspeções e consultas'}
                </span>
              </div>

            </div>
          </div>

          {/* Zona de Gerenciamento e Limpeza (Zona Administrativa) */}
          <div className="bg-white p-5 rounded-xl border border-rose-200/90 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Zona de Gerenciamento da Base de Dados
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Execute a limpeza completa dos registros para deixar o sistema vazio antes de importar uma nova planilha cadastral, ou restaure a semente oficial de demonstração de Braúnas/MG quando necessário.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Card 1: Limpar / Zerar Banco */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    Limpar Todo o Registro do Banco de Dados
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Exclui todos os documentos de estabelecimentos e vistorias VAPT do banco Firestore e limpa caches locais, desativando a re-semeadura automática.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalConfirmarLimpeza(true)}
                  disabled={limpandoBanco || loading}
                  className="min-h-[44px] w-full px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition duration-150 ease-out flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{limpandoBanco ? 'Limpando Base...' : 'Limpar Todo o Banco de Dados'}</span>
                </button>
              </div>

              {/* Card 2: Restaurar Semente Demonstrativa */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Restaurar Dados Demonstrativos (Braúnas/MG)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Carrega os 12 estabelecimentos comerciais e 3 vistorias VAPT do conjunto inicial de teste do município de Braúnas/MG para fins de demonstração e simulação de metas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRestaurarDemonstrativos}
                  disabled={restaurandoDemo || loading}
                  className="min-h-[44px] w-full px-4 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs transition duration-150 ease-out flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{restaurandoDemo ? 'Restaurando...' : 'Restaurar Dados Demonstrativos'}</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE LIMPEZA DO BANCO */}
      {modalConfirmarLimpeza && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm sm:text-base">
                  Confirmar Limpeza Total do Banco
                </h3>
              </div>
              <button
                onClick={() => setModalConfirmarLimpeza(false)}
                className="text-rose-300 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-2">
                <p className="font-bold text-rose-900">
                  Atenção: Esta ação é definitiva e removerá todos os registros do Firestore!
                </p>
                <p className="leading-relaxed text-slate-700">
                  Serão excluídos os documentos das seguintes coleções:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-800 font-mono text-[11px]">
                  <li>Coleção <strong>estabelecimentos</strong> ({estabelecimentos.length} registros)</li>
                  <li>Coleção <strong>inspecoes_vapt</strong> ({inspecoesVapt.length} registros)</li>
                </ul>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={limparLogsOption}
                  onChange={(e) => setLimparLogsOption(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span>Limpar também o histórico de <strong>logs de auditoria</strong> ({logsAuditoria.length} registros)</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalConfirmarLimpeza(false)}
                  disabled={limpandoBanco}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecutarLimpezaBanco}
                  disabled={limpandoBanco}
                  className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-97 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{limpandoBanco ? 'Limpando...' : 'Sim, Limpar Banco de Dados'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE FISCAL */}
      {modalFiscalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  {fiscalEmEdicao ? 'Editar Fiscal Sanitário' : 'Novo Fiscal Sanitário'}
                </h3>
              </div>
              <button
                onClick={() => setModalFiscalAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarFiscal} className="p-5 space-y-4">
              
              {erroFiscal && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{erroFiscal}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Fiscal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Edmila Ferreira"
                  value={fiscalForm.nome}
                  onChange={(e) => setFiscalForm({ ...fiscalForm, nome: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Matrícula Funcional *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BR-4309"
                    value={fiscalForm.matricula}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, matricula: e.target.value })}
                    className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    value={fiscalForm.dataAdmissao}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, dataAdmissao: e.target.value })}
                    className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Função Oficial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fiscal Sanitário Municipal"
                  value={fiscalForm.cargo}
                  onChange={(e) => setFiscalForm({ ...fiscalForm, cargo: e.target.value })}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    placeholder="fiscal@braunas.mg.gov.br"
                    value={fiscalForm.email}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, email: e.target.value })}
                    className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    placeholder="(33) 99999-9999"
                    value={fiscalForm.telefone}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, telefone: e.target.value })}
                    className="w-full h-11 px-3 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fiscalForm.ativo}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, ativo: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Fiscal Ativo no Sistema (disponível para inspeções e termos)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalFiscalAberto(false)}
                  className="min-h-[44px] px-4 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-97"
                >
                  <Save className="w-4 h-4" />
                  <span>{fiscalEmEdicao ? 'Atualizar Fiscal' : 'Cadastrar Fiscal'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal de Confirmação de Soft Delete de Fiscal */}
      <ConfirmarExclusaoModal
        isOpen={modalExcluirFiscalAberto}
        onClose={() => {
          setModalExcluirFiscalAberto(false);
          setFiscalParaExcluir(null);
        }}
        onConfirm={handleConfirmarExclusaoFiscal}
        tipo="fiscal"
        tituloEntidade={fiscalParaExcluir?.nome || ''}
        subtituloEntidade={fiscalParaExcluir ? `${fiscalParaExcluir.cargo} (Matrícula: ${fiscalParaExcluir.matricula})` : undefined}
        identificador={fiscalParaExcluir?.matricula || fiscalParaExcluir?.id}
      />

    </div>
  );
};
