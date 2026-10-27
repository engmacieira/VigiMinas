export type NivelRisco = 'Risco I' | 'Risco II' | 'Risco III';
export type SituacaoEstabelecimento = 'Ativo' | 'Inativo' | 'Suspenso';
export type SituacaoAlvara = 'Válido' | 'Vencido' | 'Isento/Dispensado' | 'Não Possui (Irregular)';
export type CompetenciaFiscalizacao = 'Municipal' | 'Estadual' | 'Pactuado';
export type ParecerProjeto = 'Sim' | 'Não' | 'Não Aplicável';
export type StatusInspecaoVapt = 'Concluída' | 'Em Acompanhamento';
export type StatusExercicio = 'Em Andamento' | 'Homologado' | 'Encerrado';

export type UserRole = 'admin_master' | 'fiscal_tecnico' | 'digitador';
export type FuncaoUsuario = UserRole;

export interface Endereco {
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  municipio: string; // Ex: "Braúnas/MG"
}

export interface Contato {
  telefone: string;
  email: string;
}

export interface Estabelecimento {
  id: string;
  cnpjCpf: string;
  cnpj?: string; // Alias para compatibilidade com relatórios e mocks
  identificacaoMunicipal?: string; // Identificação / Inscrição Municipal (alfanumérico, opcional)
  razaoSocial: string;
  nomeFantasia: string;
  endereco: Endereco;
  contato: Contato;
  cnaeCodigo: string; // CNAE Principal (obrigatório)
  cnaeDescricao: string; // Descrição da Atividade Principal
  cnaesSecundarios?: string[]; // CNAEs Secundários (opcional)
  nivelRisco: NivelRisco;
  dataUltimaInspecaoInicio: string; // YYYY-MM-DD
  dataUltimaInspecaoFim: string; // YYYY-MM-DD
  dataProximaInspecao: string; // YYYY-MM-DD
  situacaoEstabelecimento: SituacaoEstabelecimento;
  situacaoAlvara: SituacaoAlvara;
  dataValidadeAlvara: string; // YYYY-MM-DD
  numeroAlvara: string;
  observacoesBaixa: string; // Obrigatório se Inativo, ex: "Baixado em DD/MM/AAAA - Motivo..."
  competenciaFiscalizacao: CompetenciaFiscalizacao;
  parecerProjetoArquitetonico: ParecerProjeto;
  fiscaisUltimaInspecao?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Campos de Soft Delete / Arquivamento
  isDeleted?: boolean;
  isPermanentlyDeleted?: boolean; // Excluído da visão do usuário na aba de arquivados (preservado em banco para administradores)
  permanentlyDeletedAt?: string;
  permanentlyDeletedBy?: string;
  motivoExclusaoPermanente?: string;
  deletedAt?: string;
  deletedBy?: string;
  motivoExclusao?: string;
}

export interface InspecaoVapt {
  id: string;
  estabelecimentoId: string;
  nomeLocalTrabalho: string;
  dataInspecao: string; // YYYY-MM-DD
  numeroRelatorioTermo: string;
  fiscaisResponsaveis: string[]; // ex: ["Lucas", "Matheus", "Edmila"]
  principaisRiscosIdentificados: string;
  recomendacoesOrientacoes: string;
  statusInspecao: StatusInspecaoVapt;
  prazoAdequacaoDias?: number;
  dataRetornoPrevista?: string;
  createdAt?: string;
  updatedAt?: string;
  // Campos de Soft Delete
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  motivoExclusao?: string;
}

export interface FiscalSanitario {
  id: string;
  nome: string;
  matricula: string;
  cargo: string;
  email: string;
  telefone: string;
  ativo: boolean;
  dataAdmissao?: string;
  // Campos de Soft Delete
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  motivoExclusao?: string;
  // Soft Delete de 2º Nível (Remoção da visão do usuário na aba de arquivados)
  isPermanentlyDeleted?: boolean;
  permanentlyDeletedAt?: string;
  permanentlyDeletedBy?: string;
  motivoExclusaoPermanente?: string;
}

export interface DadosSecretaria {
  nomeOrgao: string;
  departamento: string;
  municipio: string;
  uf: string;
  codigoIbge: string;
  cnpj: string;
  secretarioSaude: string;
  coordenadorVisa: string;
  enderecoCompleto: string;
  telefoneOficial: string;
  emailOficial: string;
  horarioAtendimento: string;
  portariaRegulamentacao: string;
  textoRodapeOficial: string;
}

export interface ConfiguracaoExercicio {
  anoExercicio: number;
  metaInd11Vapt: number;
  metaInd13RiscoI: number;
  metaInd14RiscoII: number;
  metaInd15RiscoIII: number;
  dataInicioExercicio: string;
  dataTerminoExercicio: string;
  statusExercicio: StatusExercicio;
}

export interface ConfiguracaoSistema {
  id: string;
  secretaria: DadosSecretaria;
  exercicioAtivo: ConfiguracaoExercicio;
  exerciciosHistorico: ConfiguracaoExercicio[];
  fiscais: FiscalSanitario[];
  bancoInicializado?: boolean;
  updatedAt?: string;
}

export type OperacaoFirestore = 'create' | 'update' | 'delete' | 'export';
export type ColecaoAuditada = 'estabelecimentos' | 'inspecoes_vapt' | 'configuracoes_sistema' | 'backups_exportados' | 'usuarios';
export type TipoRegistroAuditoria = 'Estabelecimento' | 'InspecaoVapt' | 'InspecaoSanitariaRapida' | 'ConfiguracaoSistema' | 'FiscalSanitario' | 'ExportacaoBackup' | 'Usuario';
export type AcaoAuditoria = 'Criação' | 'Edição' | 'Exclusão' | 'Inspeção Rápida' | 'Exportação';

export type FormatoExportacao = 'csv' | 'xlsx' | 'xls';
export type DelimitadorCsv = ';' | ',';
export type EscopoExportacao = 'todos' | 'ativos' | 'filtrados' | 'baixados';

export interface OpcoesExportacao {
  formato: FormatoExportacao;
  delimitadorCsv?: DelimitadorCsv;
  escopo: EscopoExportacao;
  estabelecimentosFiltrados?: Estabelecimento[];
  incluirMetadados?: boolean;
  registrarAuditoria?: boolean;
  usuarioEmail?: string;
  fiscalResponsavel?: string;
}

export interface ResultadoExportacao {
  sucesso: boolean;
  nomeArquivo: string;
  totalExportados: number;
  formato: FormatoExportacao;
  timestamp: string;
}

export interface Usuario {
  id: string;
  username: string; // Login único (ex: Matheus)
  nomeCompleto: string; // Ex: Matheus Henrique Macieira
  cargo: string; // Ex: Coordenador
  funcao: UserRole; // admin_master | fiscal_tecnico | digitador
  email: string; // Ex: matheus_macieira@hotmail.com
  senhaHash?: string; // Hash SHA-256 defensivo para autenticação
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
  ultimoAcesso?: string;
}

export interface Perfil {
  id: string;
  username: string;
  nomeCompleto: string;
  cargo: string;
  email: string;
  funcao: UserRole;
  ativo: boolean;
}

export interface Sessao {
  usuario: Perfil;
  autenticadoEm: string;
}

export interface AuditContextInfo {
  usuario?: string;
  usuarioId?: string;
  nomeUsuario?: string;
  cargo?: string;
  fiscalResponsavel?: string;
  detalhesPersonalizados?: string;
}

export const USUARIO_MASTER_SEED: Usuario = {
  id: 'usr-master-001',
  username: 'Matheus',
  nomeCompleto: 'Matheus Henrique Macieira',
  cargo: 'Coordenador',
  funcao: 'admin_master',
  email: 'matheus_macieira@hotmail.com',
  senhaHash: '5b36b95e75a6e08ba271392585852160ed3f2ae23c52f06b07c9a80e5da90052',
  ativo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

export interface LogAuditoria {
  id: string;
  recursoId: string;
  operacao: OperacaoFirestore;
  colecao: ColecaoAuditada;
  timestamp: string; // ISO String
  usuario: string; // email ou identificação do fiscal/usuário
  usuarioId?: string; // ID do usuário autenticado no sistema
  nomeUsuario?: string; // Username ou Nome Completo do usuário
  cargo?: string; // Cargo do usuário no momento da ação
  identificadorEntidade: string;
  detalhes: string;
  alteracoes?: string | string[]; // Detalhamento de campos alterados (before / after)
  // Campos auxiliares compatíveis
  tipoRegistro: TipoRegistroAuditoria;
  acao: AcaoAuditoria;
  fiscalResponsavel: string;
  registroId: string;
  createdAt?: string;
}

export interface VigiMinasIndicadores {
  anoReferencia: number;
  
  // Indicador 12: Total de Estabelecimentos Cadastrados
  ind12TotalCadastrados: number;
  ind12Ativos: number;
  ind12Inativos: number;
  
  // Indicador 13: % de Risco I inspecionados no ano (Meta >= 15%)
  ind13TotalRiscoI: number;
  ind13InspecionadosAno: number;
  ind13Percentual: number;
  ind13MetaAtingida: boolean;
  
  // Indicador 14: % de Risco II com alvará inspecionados no ano (Meta >= 90%)
  ind14TotalRiscoII: number;
  ind14InspecionadosAno: number;
  ind14Percentual: number;
  ind14MetaAtingida: boolean;

  // Indicador 15: % de Risco III inspecionados no ano (Meta 100%)
  ind15TotalRiscoIII: number;
  ind15InspecionadosAno: number;
  ind15Percentual: number;
  ind15MetaAtingida: boolean;

  // Indicador 11: Contador de inspeções em ambientes de trabalho (Meta >= 2)
  ind11TotalInspecoesAno: number;
  ind11MetaAtingida: boolean;
}

export interface AlertaInspecaoVaptInfo {
  inspecao: InspecaoVapt;
  estabelecimento?: Estabelecimento;
  tipoAlerta: 'vencida' | 'proxima';
  diasDiferenca: number; // negativo se vencida, 0 se hoje, 1-5 se próxima
  dataLimite: string; // YYYY-MM-DD
}

export interface AlertasInspecoesVapt {
  totalAlertas: number;
  totalVencidas: number;
  totalProximasVencer: number;
  alertas: AlertaInspecaoVaptInfo[];
}
