import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  Printer, 
  Search, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Layers, 
  Check, 
  X, 
  FolderSearch,
  ExternalLink,
  ChevronDown,
  Building,
  Stamp,
  Activity
} from 'lucide-react';
import { useVigiMinas } from '../contexts/VigiMinasContext';
import { Estabelecimento, NivelRisco, SituacaoAlvara } from '../types/vigiminas';
import { safePrint } from '../utils/printHelper';

interface HistoricoItem {
  id: string;
  data: string;
  tipo: string;
  numeroTermo: string;
  fiscais: string;
  parecer: string;
  parecerTipo: 'conforme' | 'exigencias' | 'interdicao';
  observacoes: string;
}

export const FichaIndividualEmpresaPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { estabelecimentos, inspecoesVapt, configuracao, logsAuditoria, loading } = useVigiMinas();

  // Estabelecimentos não excluídos
  const listaAtiva = useMemo(() => {
    return (estabelecimentos || []).filter(e => !e.isDeleted && !e.isPermanentlyDeleted);
  }, [estabelecimentos]);

  // Empresa selecionada por parâmetro da URL ou primeira da lista
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    if (listaAtiva.length === 0) return;

    if (id) {
      const encontrada = listaAtiva.find(e => e.id === id || e.cnpjCpf === id || e.cnpj === id);
      if (encontrada) {
        setSelectedId(encontrada.id);
        return;
      }
    }

    // Se não há ID na URL ou não encontrou, seleciona a primeira da lista
    if (!selectedId || !listaAtiva.some(e => e.id === selectedId)) {
      setSelectedId(listaAtiva[0].id);
    }
  }, [id, listaAtiva, selectedId]);

  const empresaSelecionada: Estabelecimento | null = useMemo(() => {
    if (!selectedId) return listaAtiva[0] || null;
    return listaAtiva.find(e => e.id === selectedId) || listaAtiva[0] || null;
  }, [selectedId, listaAtiva]);

  // Tratamento da troca de empresa
  const handleSelecionarEmpresa = (novaEmpresaId: string) => {
    setSelectedId(novaEmpresaId);
    setIsSearchOpen(false);
    setSearchTerm('');
    navigate(`/relatorios/ficha-empresa/${novaEmpresaId}`, { replace: true });
  };

  // Filtro de autocomplete na busca
  const empresasSugeridas = useMemo(() => {
    if (!searchTerm.trim()) return listaAtiva.slice(0, 8);
    const termo = searchTerm.toLowerCase().trim();
    return listaAtiva.filter(e => 
      e.razaoSocial.toLowerCase().includes(termo) ||
      (e.nomeFantasia && e.nomeFantasia.toLowerCase().includes(termo)) ||
      (e.cnpjCpf && e.cnpjCpf.toLowerCase().includes(termo)) ||
      (e.cnpj && e.cnpj.toLowerCase().includes(termo)) ||
      (e.cnaeCodigo && e.cnaeCodigo.toLowerCase().includes(termo))
    ).slice(0, 10);
  }, [searchTerm, listaAtiva]);

  // Auditoria e montagem do histórico de inspeções cruzado
  const historicoInspecoes = useMemo<HistoricoItem[]>(() => {
    if (!empresaSelecionada) return [];

    const itens: HistoricoItem[] = [];

    // 1. Inspeções VAPT (Saúde do Trabalhador)
    const vapts = (inspecoesVapt || []).filter(v => v.estabelecimentoId === empresaSelecionada.id && !v.isDeleted);
    vapts.forEach(v => {
      itens.push({
        id: `vapt-${v.id}`,
        data: v.dataInspecao || '',
        tipo: 'Vistoria VAPT (Saúde do Trabalhador)',
        numeroTermo: v.numeroRelatorioTermo || 'Termo VAPT',
        fiscais: (v.fiscaisResponsaveis && v.fiscaisResponsaveis.length > 0)
          ? v.fiscaisResponsaveis.join(', ')
          : 'Fiscal Técnico Designado',
        parecer: v.statusInspecao === 'Concluída' ? 'Conforme' : 'Com Exigências / Em Acompanhamento',
        parecerTipo: v.statusInspecao === 'Concluída' ? 'conforme' : 'exigencias',
        observacoes: [
          v.principaisRiscosIdentificados ? `Riscos Identificados: ${v.principaisRiscosIdentificados}` : '',
          v.recomendacoesOrientacoes ? `Recomendações: ${v.recomendacoesOrientacoes}` : '',
          v.prazoAdequacaoDias ? `Prazo para Adequação: ${v.prazoAdequacaoDias} dias` : ''
        ].filter(Boolean).join(' • ') || 'Inspeção em ambiente de trabalho realizada conforme resolução.'
      });
    });

    // 2. Logs de Auditoria de Inspeção Rápida ou Atualizações Fiscais
    const logs = (logsAuditoria || []).filter(l => 
      l.recursoId === empresaSelecionada.id && 
      (l.acao === 'Inspeção Rápida' || l.tipoRegistro === 'InspecaoSanitariaRapida')
    );
    logs.forEach(l => {
      const dataFormatada = l.timestamp ? l.timestamp.split('T')[0] : '';
      itens.push({
        id: `log-${l.id}`,
        data: dataFormatada,
        tipo: 'Inspeção Sanitária Rápida / Renovação',
        numeroTermo: 'Termo de Vistoria Rápida',
        fiscais: l.fiscalResponsavel || l.usuario || 'Fiscal Sanitário',
        parecer: 'Conforme',
        parecerTipo: 'conforme',
        observacoes: l.detalhes || 'Vistoria sanitária realizada com emissão/renovação de alvará.'
      });
    });

    // 3. Inspeção registrada no cadastro base do estabelecimento (se houver)
    const dataCadastroInspecao = empresaSelecionada.dataUltimaInspecaoInicio || empresaSelecionada.dataUltimaInspecaoFim;
    if (dataCadastroInspecao) {
      // Verifica se já não inserimos um item na mesma data
      const jaExisteMesmaData = itens.some(i => i.data === dataCadastroInspecao);
      if (!jaExisteMesmaData) {
        itens.push({
          id: `cad-${empresaSelecionada.id}`,
          data: dataCadastroInspecao,
          tipo: 'Inspeção Sanitária Periódica / Licenciamento',
          numeroTermo: empresaSelecionada.numeroAlvara 
            ? `Auto/Licença nº ${empresaSelecionada.numeroAlvara}` 
            : 'Termo de Inspeção Sanitária Regular',
          fiscais: (empresaSelecionada.fiscaisUltimaInspecao && empresaSelecionada.fiscaisUltimaInspecao.length > 0)
            ? empresaSelecionada.fiscaisUltimaInspecao.join(', ')
            : 'Equipe Municipal de Vigilância Sanitária',
          parecer: 'Conforme (Apto para Funcionamento)',
          parecerTipo: 'conforme',
          observacoes: `Inspeção sanitária periódica. Alvará sanitário nº ${empresaSelecionada.numeroAlvara || 'S/N'} com validade até ${empresaSelecionada.dataValidadeAlvara || 'não informada'}.`
        });
      }
    }

    // Ordenação cronológica decrescente (mais recente primeiro)
    return itens.sort((a, b) => {
      if (!a.data) return 1;
      if (!b.data) return -1;
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });
  }, [empresaSelecionada, inspecoesVapt, logsAuditoria]);

  // Classificação do Alvará Sanitário
  const infoAlvara = useMemo(() => {
    if (!empresaSelecionada) {
      return { status: 'sem_alvara', label: 'Não Possui Alvará', cor: 'slate' };
    }

    const { situacaoAlvara, dataValidadeAlvara } = empresaSelecionada;

    if (situacaoAlvara === 'Isento/Dispensado') {
      return { status: 'isento', label: 'Isento / Dispensado', cor: 'blue' };
    }

    if (!dataValidadeAlvara) {
      return { status: 'pendente', label: 'Pendente / Sem Registro', cor: 'amber' };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidadeAlvara + 'T00:00:00');

    if (validade >= hoje) {
      return { status: 'vigente', label: 'Vigente / Regular', cor: 'emerald' };
    } else {
      return { status: 'vencido', label: 'Vencido / Irregular', cor: 'rose' };
    }
  }, [empresaSelecionada]);

  // Formatação de data brasileira (DD/MM/AAAA)
  const formatarData = (dataStr?: string) => {
    if (!dataStr) return 'Não informada';
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  const handleImprimir = () => {
    safePrint();
  };

  const hoje = new Date();
  const municipioNome = configuracao?.secretaria?.municipio || 'Braúnas';
  const ufSigla = configuracao?.secretaria?.uf || 'MG';
  const coordenadorVisa = configuracao?.secretaria?.coordenadorVisa || 'Matheus Henrique Macieira';
  const anoExercicio = configuracao?.exercicioAtivo?.anoExercicio || 2026;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="mt-3 text-sm font-semibold text-slate-600">Carregando dossiê do estabelecimento...</p>
      </div>
    );
  }

  if (!empresaSelecionada) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Nenhum estabelecimento cadastrado</h2>
        <p className="text-xs text-slate-500 mt-1">
          Não há estabelecimentos disponíveis na base municipal para emissão de ficha sanitária.
        </p>
        <Link
          to="/estabelecimentos"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          Cadastrar Novo Estabelecimento
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4 print:pb-0">
      {/* ============================================================== */}
      {/* 1. BARRA DE CONTROLE E AÇÕES RÁPIDAS (print:hidden)            */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              to="/relatorios"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Relatórios</span>
            </Link>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline">•</span>

            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
              Ficha Sanitária Individual
            </span>
          </div>

          {/* Autocomplete / Seletor de Estabelecimento */}
          <div className="flex flex-1 max-w-xl items-center gap-2 relative">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Trocar empresa: busque por Razão Social, Fantasia ou CNPJ..."
                value={searchTerm}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dropdown de Resultados da Busca */}
              {isSearchOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                    <span>Selecione um estabelecimento ({empresasSugeridas.length} de {listaAtiva.length})</span>
                    <button 
                      onClick={() => setIsSearchOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-normal underline"
                    >
                      Fechar
                    </button>
                  </div>
                  {empresasSugeridas.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Nenhuma empresa encontrada para "{searchTerm}"
                    </div>
                  ) : (
                    empresasSugeridas.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelecionarEmpresa(emp.id)}
                        className={`w-full text-left p-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between text-xs ${emp.id === empresaSelecionada.id ? 'bg-blue-50/70 font-semibold' : ''}`}
                      >
                        <div className="truncate pr-2">
                          <p className="text-slate-900 truncate font-medium">{emp.razaoSocial}</p>
                          <p className="text-[11px] text-slate-500 truncate font-mono">
                            {emp.nomeFantasia ? `${emp.nomeFantasia} • ` : ''}CNPJ: {emp.cnpjCpf || emp.cnpj || 'S/N'}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          emp.nivelRisco === 'Risco I' ? 'bg-emerald-100 text-emerald-800' :
                          emp.nivelRisco === 'Risco II' ? 'bg-purple-100 text-purple-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {emp.nivelRisco}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Botão de Impressão */}
            <button
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shrink-0 shadow-sm"
              title="Imprimir Ficha ou Salvar como PDF oficial"
            >
              <Printer className="w-4 h-4 text-slate-200" />
              <span>Imprimir Ficha / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CABEÇALHO INSTITUCIONAL OFICIAL (Tela e Impressão)          */}
      {/* ============================================================== */}
      <div className="bg-white border-2 border-slate-800 rounded-2xl p-6 print:border-b-2 print:border-x-0 print:border-t-0 print:rounded-none print:p-0 print:pb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 print:border print:border-slate-800">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-wider uppercase text-slate-500">
                ESTADO DE MINAS GERAIS • SECRETARIA MUNICIPAL DE SAÚDE
              </p>
              <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 leading-tight">
                Superintendência de Vigilância Sanitária • Município de {municipioNome} / {ufSigla}
              </h1>
              <p className="text-xs font-bold text-blue-700 print:text-black mt-0.5">
                FICHA CADASTRAL E HISTÓRICO SANITÁRIO DO ESTABELECIMENTO
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-md text-slate-800">
              <Activity className="w-3.5 h-3.5 text-blue-600 print:hidden" />
              PROGRAMA VIGIMINAS {anoExercicio}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Emissão: {hoje.toLocaleDateString('pt-BR')} às {hoje.toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Resumo Rápido no Topo da Folha */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">
              {empresaSelecionada.razaoSocial}
            </span>
            {empresaSelecionada.nomeFantasia && (
              <span className="text-slate-500 italic">
                ({empresaSelecionada.nomeFantasia})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              CNPJ: {empresaSelecionada.cnpjCpf || empresaSelecionada.cnpj || 'Não Informado'}
            </span>
            <span className={`px-2 py-0.5 rounded font-bold border ${
              empresaSelecionada.situacaoEstabelecimento === 'Ativo' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              empresaSelecionada.situacaoEstabelecimento === 'Inativo' ? 'bg-rose-50 text-rose-800 border-rose-200' :
              'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {empresaSelecionada.situacaoEstabelecimento || 'Ativo'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BLOCO 1: IDENTIFICAÇÃO CADASTRAL DO ESTABELECIMENTO         */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:border print:border-slate-300 print:rounded-lg print:p-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Building className="w-4 h-4 text-blue-600 print:text-black" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            1. Identificação Cadastral do Estabelecimento
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Razão Social */}
          <div className="lg:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Razão Social
            </span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              {empresaSelecionada.razaoSocial}
            </p>
          </div>

          {/* Nome Fantasia */}
          <div className="lg:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nome Fantasia
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {empresaSelecionada.nomeFantasia || 'Não informado'}
            </p>
          </div>

          {/* CNPJ / CPF */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CNPJ / CPF
            </span>
            <p className="font-mono font-semibold text-slate-900 mt-0.5">
              {empresaSelecionada.cnpjCpf || empresaSelecionada.cnpj || 'Não informado'}
            </p>
          </div>

          {/* Inscrição Municipal */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Inscrição / Identificação Municipal
            </span>
            <p className="font-mono font-semibold text-slate-800 mt-0.5">
              {empresaSelecionada.identificacaoMunicipal || 'Isento / Não Consta'}
            </p>
          </div>

          {/* Telefone de Contato */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              Telefone
            </span>
            <p className="font-mono text-slate-800 mt-0.5">
              {empresaSelecionada.contato?.telefone || 'Não informado'}
            </p>
          </div>

          {/* E-mail de Contato */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              E-mail
            </span>
            <p className="font-mono text-slate-800 mt-0.5 truncate" title={empresaSelecionada.contato?.email}>
              {empresaSelecionada.contato?.email || 'Não informado'}
            </p>
          </div>

          {/* Endereço Completo */}
          <div className="lg:col-span-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              Endereço Completo
            </span>
            <p className="text-slate-800 mt-0.5">
              {empresaSelecionada.endereco?.logradouro 
                ? `${empresaSelecionada.endereco.logradouro}, nº ${empresaSelecionada.endereco.numero || 'S/N'}` 
                : 'Logradouro não informado'}
              {empresaSelecionada.endereco?.bairro ? ` - Bairro ${empresaSelecionada.endereco.bairro}` : ''}
              {` - ${empresaSelecionada.endereco?.municipio || `${municipioNome}/${ufSigla}`}`}
            </p>
          </div>

          {/* CEP */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CEP
            </span>
            <p className="font-mono text-slate-800 mt-0.5">
              {empresaSelecionada.endereco?.cep || '35189-000'}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. BLOCO 2: ENQUADRAMENTO SANITÁRIO E REGULARIDADE DE ALVARÁ   */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:border print:border-slate-300 print:rounded-lg print:p-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Layers className="w-4 h-4 text-purple-600 print:text-black" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            2. Enquadramento Sanitário e Regularidade de Alvará
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Nível de Risco Sanitário */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Classificação de Risco Sanitário
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black border ${
                empresaSelecionada.nivelRisco === 'Risco I' 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : empresaSelecionada.nivelRisco === 'Risco II'
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                {empresaSelecionada.nivelRisco}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {empresaSelecionada.nivelRisco === 'Risco I' ? 'Baixo Risco' :
                 empresaSelecionada.nivelRisco === 'Risco II' ? 'Médio Risco' : 'Alto Risco'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Resolução SES/MG nº 10.917/2026
            </p>
          </div>

          {/* Situação Cadastral Sanitária */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Situação Cadastral
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                empresaSelecionada.situacaoEstabelecimento === 'Ativo' ? 'text-emerald-700' :
                empresaSelecionada.situacaoEstabelecimento === 'Inativo' ? 'text-rose-700' :
                'text-amber-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  empresaSelecionada.situacaoEstabelecimento === 'Ativo' ? 'bg-emerald-500' :
                  empresaSelecionada.situacaoEstabelecimento === 'Inativo' ? 'bg-rose-500' :
                  'bg-amber-500'
                }`} />
                {empresaSelecionada.situacaoEstabelecimento || 'Ativo'}
              </span>
            </div>
            {empresaSelecionada.observacoesBaixa && (
              <p className="text-[10px] text-rose-700 mt-1 line-clamp-2" title={empresaSelecionada.observacoesBaixa}>
                {empresaSelecionada.observacoesBaixa}
              </p>
            )}
          </div>

          {/* Situação do Alvará Sanitário */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Situação do Alvará Sanitário
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                infoAlvara.cor === 'emerald' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                infoAlvara.cor === 'rose' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                infoAlvara.cor === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {infoAlvara.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {empresaSelecionada.numeroAlvara ? `Nº Licença: ${empresaSelecionada.numeroAlvara}` : 'Sem número registrado'}
            </p>
          </div>

          {/* Validade do Alvará */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Data de Validade do Alvará
            </span>
            <p className="font-mono font-bold text-slate-900 text-sm mt-1">
              {formatarData(empresaSelecionada.dataValidadeAlvara)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Competência: {empresaSelecionada.competenciaFiscalizacao || 'Municipal'}
            </p>
          </div>

          {/* CNAE Principal com Descrição */}
          <div className="lg:col-span-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Atividade Econômica Principal (CNAE)
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs bg-slate-200 text-slate-900 px-2 py-0.5 rounded border border-slate-300">
                {empresaSelecionada.cnaeCodigo}
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {empresaSelecionada.cnaeDescricao}
              </span>
            </div>
            {empresaSelecionada.cnaesSecundarios && empresaSelecionada.cnaesSecundarios.length > 0 && (
              <div className="pt-2 text-[11px] text-slate-600">
                <span className="font-bold text-slate-700">CNAEs Secundários: </span>
                {empresaSelecionada.cnaesSecundarios.join(' • ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. BLOCO 3: HISTÓRICO CRONOLÓGICO DE FISCALIZAÇÕES E INSPEÇÕES */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:border print:border-slate-300 print:rounded-lg print:p-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 print:text-black" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              3. Histórico Cronológico de Fiscalizações e Inspeções Sanitárias
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {historicoInspecoes.length} registro(s)
          </span>
        </div>

        {historicoInspecoes.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">
              Nenhum histórico de inspeção sanitária registrado para este estabelecimento até a presente data.
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              As ações de fiscalização sanitária, vistorias de rotina ou auditorias VAPT aparecerão aqui conforme forem cadastradas no sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Tipo / Motivo da Ação</th>
                  <th className="py-2.5 px-3">Nº Auto / Termo</th>
                  <th className="py-2.5 px-3">Fiscal Responsável</th>
                  <th className="py-2.5 px-3">Parecer Sanitário</th>
                  <th className="py-2.5 px-3">Resumo das Exigências / Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historicoInspecoes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {formatarData(item.data)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {item.tipo}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {item.numeroTermo}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {item.fiscais}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.parecerTipo === 'conforme' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : item.parecerTipo === 'exigencias'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {item.parecer}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                      {item.observacoes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. BLOCO 4: TERMO DE RESPONSABILIDADE E ASSINATURAS            */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 print:border print:border-slate-300 print:rounded-lg print:p-4 print:mt-6 print:space-y-8">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
            4. Termo de Responsabilidade e Fé Pública
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-3 italic text-justify">
            "Atestamos para os devidos fins a veracidade das informações cadastrais e sanitárias acima descritas, sujeitas a conferência e fiscalização contínua nos termos da legislação sanitária vigente."
          </p>
        </div>

        {/* Linhas de Assinatura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
          {/* Assinatura 1: Autoridade Sanitária */}
          <div className="text-center space-y-1">
            <div className="border-t-2 border-slate-800 mx-auto w-4/5 pt-2" />
            <p className="font-bold text-xs text-slate-900 uppercase">
              {coordenadorVisa}
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              Autoridade Sanitária / Fiscal Responsável
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Coordenadoria Municipal de Vigilância Sanitária
            </p>
          </div>

          {/* Assinatura 2: Responsável pelo Estabelecimento */}
          <div className="text-center space-y-1">
            <div className="border-t-2 border-slate-800 mx-auto w-4/5 pt-2" />
            <p className="font-bold text-xs text-slate-900 uppercase">
              Responsável pelo Estabelecimento
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              Nome Legível e Assinatura
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Representante Legal / Responsável Técnico
            </p>
          </div>
        </div>

        <div className="pt-2 text-center text-[10px] text-slate-400 font-mono print:text-slate-600 border-t border-slate-100">
          Documento emitido eletronicamente pelo Sistema VigiMinas • Código de Auditoria: {empresaSelecionada.id}
        </div>
      </div>
    </div>
  );
};

export default FichaIndividualEmpresaPage;
