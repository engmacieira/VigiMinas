import { Estabelecimento, InspecaoVapt, ConfiguracaoSistema } from '../types/vigiminas';

export const FISCAIS_MUNICIPIO = [
  'Lucas Silveira',
  'Matheus Oliveira',
  'Edmila Ferreira'
];

export const CNAE_LISTA_COMUM = [
  { codigo: '47.11-3/02', descricao: 'Comércio varejista de mercadorias em geral (Minimercados, mercearias e armazéns)', risco: 'Risco II' },
  { codigo: '47.71-7/01', descricao: 'Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas', risco: 'Risco II' },
  { codigo: '10.91-1/02', descricao: 'Fabricação de produtos de padaria e confeitaria com predominância de produção própria', risco: 'Risco II' },
  { codigo: '47.22-9/01', descricao: 'Comércio varejista de carnes - açougues', risco: 'Risco II' },
  { codigo: '56.11-2/03', descricao: 'Lanchonetes, casas de chá, de sucos e similares', risco: 'Risco I' },
  { codigo: '56.11-2/01', descricao: 'Restaurantes e similares', risco: 'Risco II' },
  { codigo: '86.30-5/04', descricao: 'Atividade odontológica com procedimentos cirúrgicos', risco: 'Risco III' },
  { codigo: '86.10-1/01', descricao: 'Atividades de atendimento hospitalar', risco: 'Risco III' },
  { codigo: '86.30-5/03', descricao: 'Atividade médica ambulatorial restrita a consultas', risco: 'Risco II' },
  { codigo: '96.02-5/01', descricao: 'Cabeleireiros, manicure e pedicure', risco: 'Risco I' },
  { codigo: '10.52-0/00', descricao: 'Fabricação de laticínios (Queijaria artesanal)', risco: 'Risco III' },
  { codigo: '47.31-8/00', descricao: 'Comércio varejista de combustíveis para veículos automotores', risco: 'Risco II' },
  { codigo: '47.29-6/99', descricao: 'Comércio varejista de produtos alimentícios em geral não especificados anteriormente', risco: 'Risco I' },
  { codigo: '96.03-3/04', descricao: 'Serviços de sepultamento e cemitério', risco: 'Risco II' },
  { codigo: '87.11-5/02', descricao: 'Instituições de longa permanência para idosos (ILPI)', risco: 'Risco III' }
];

export const SEED_ESTABELECIMENTOS: Estabelecimento[] = [
  {
    id: 'braunas-est-001',
    cnpjCpf: '18.423.901/0001-45',
    razaoSocial: 'DROGARIA E FARMACIA BRAUNAS LTDA',
    nomeFantasia: 'Farmácia Popular de Braúnas',
    endereco: {
      logradouro: 'Praça Monsenhor Horta',
      numero: '124',
      bairro: 'Centro',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1234',
      email: 'farmacia.braunas@gmail.com'
    },
    cnaeCodigo: '47.71-7/01',
    cnaeDescricao: 'Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas',
    nivelRisco: 'Risco II',
    dataUltimaInspecaoInicio: '2026-03-10',
    dataUltimaInspecaoFim: '2026-03-10',
    dataProximaInspecao: '2027-03-10',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '2027-03-10',
    numeroAlvara: 'ALV-2026/014',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira', 'Edmila Ferreira']
  },
  {
    id: 'braunas-est-002',
    cnpjCpf: '24.819.340/0001-92',
    razaoSocial: 'PANIFICADORA E CONFEITARIA CENTRAL DE BRAUNAS ME',
    nomeFantasia: 'Padaria Tradição Mineira',
    endereco: {
      logradouro: 'Rua Antônio Dias',
      numero: '88',
      bairro: 'Centro',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1440',
      email: 'padariatradicao.braunas@hotmail.com'
    },
    cnaeCodigo: '10.91-1/02',
    cnaeDescricao: 'Fabricação de produtos de padaria e confeitaria com predominância de produção própria',
    nivelRisco: 'Risco II',
    dataUltimaInspecaoInicio: '2026-02-18',
    dataUltimaInspecaoFim: '2026-02-18',
    dataProximaInspecao: '2027-02-18',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '2027-02-18',
    numeroAlvara: 'ALV-2026/008',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira', 'Matheus Oliveira']
  },
  {
    id: 'braunas-est-003',
    cnpjCpf: '31.554.890/0001-11',
    razaoSocial: 'SUPERMERCADO E ACOUGUE VALE DO GUANHAES LTDA',
    nomeFantasia: 'Supermercado Central',
    endereco: {
      logradouro: 'Rua Getúlio Vargas',
      numero: '210',
      bairro: 'São Sebastião',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1150',
      email: 'comercial@supervalebraunas.com.br'
    },
    cnaeCodigo: '47.11-3/02',
    cnaeDescricao: 'Comércio varejista de mercadorias em geral (Minimercados, mercearias e armazéns)',
    nivelRisco: 'Risco II',
    dataUltimaInspecaoInicio: '2026-04-05',
    dataUltimaInspecaoFim: '2026-04-05',
    dataProximaInspecao: '2027-04-05',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '2027-04-05',
    numeroAlvara: 'ALV-2026/022',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira', 'Edmila Ferreira']
  },
  {
    id: 'braunas-est-004',
    cnpjCpf: '09.845.221/0001-78',
    razaoSocial: 'CLINICA ODONTOLOGICA SORRISO DE BRAUNAS LTDA',
    nomeFantasia: 'OdontoBraúnas',
    endereco: {
      logradouro: 'Praça Monsenhor Horta',
      numero: '45',
      bairro: 'Centro',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1789',
      email: 'odontobraunas@gmail.com'
    },
    cnaeCodigo: '86.30-5/04',
    cnaeDescricao: 'Atividade odontológica com procedimentos cirúrgicos',
    nivelRisco: 'Risco III',
    dataUltimaInspecaoInicio: '2026-01-22',
    dataUltimaInspecaoFim: '2026-01-22',
    dataProximaInspecao: '2027-01-22',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '2027-01-22',
    numeroAlvara: 'ALV-2026/003',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira', 'Edmila Ferreira']
  },
  {
    id: 'braunas-est-005',
    cnpjCpf: '19.882.311/0001-56',
    razaoSocial: 'LATICINIOS E QUEIJOS SERRA NEGRA LTDA',
    nomeFantasia: 'Queijaria Serra Negra',
    endereco: {
      logradouro: 'Córrego do Macuco',
      numero: 'S/N',
      bairro: 'Zona Rural',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 99981-4455',
      email: 'queijoserranegra@gmail.com'
    },
    cnaeCodigo: '10.52-0/00',
    cnaeDescricao: 'Fabricação de laticínios (Queijaria artesanal)',
    nivelRisco: 'Risco III',
    dataUltimaInspecaoInicio: '2026-05-12',
    dataUltimaInspecaoFim: '2026-05-12',
    dataProximaInspecao: '2027-05-12',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '2027-05-12',
    numeroAlvara: 'ALV-2026/029',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Pactuado',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira', 'Matheus Oliveira']
  },
  {
    id: 'braunas-est-006',
    cnpjCpf: '45.120.988/0001-33',
    razaoSocial: 'LANCHONETE E ACAITERIA PONTO DE ENCONTRO',
    nomeFantasia: 'Lanchonete Ponto de Encontro',
    endereco: {
      logradouro: 'Rua São Sebastião',
      numero: '54',
      bairro: 'Centro',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 99877-2211',
      email: 'pontodeencontro@gmail.com'
    },
    cnaeCodigo: '56.11-2/03',
    cnaeDescricao: 'Lanchonetes, casas de chá, de sucos e similares',
    nivelRisco: 'Risco I',
    dataUltimaInspecaoInicio: '2026-03-25',
    dataUltimaInspecaoFim: '2026-03-25',
    dataProximaInspecao: '2027-03-25',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Isento/Dispensado',
    dataValidadeAlvara: '2027-03-25',
    numeroAlvara: 'DISP-2026/005',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Não Aplicável',
    fiscaisUltimaInspecao: ['Lucas Silveira']
  },
  {
    id: 'braunas-est-007',
    cnpjCpf: '12.339.400/0001-09',
    razaoSocial: 'ESPACO DA BELEZA E ESTETICA BRAUNENSE ME',
    nomeFantasia: 'Salão Requinte',
    endereco: {
      logradouro: 'Rua Antônio Dias',
      numero: '142',
      bairro: 'Centro',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 99912-3344',
      email: 'salaorequinte@gmail.com'
    },
    cnaeCodigo: '96.02-5/01',
    cnaeDescricao: 'Cabeleireiros, manicure e pedicure',
    nivelRisco: 'Risco I',
    dataUltimaInspecaoInicio: '',
    dataUltimaInspecaoFim: '',
    dataProximaInspecao: '2026-11-20',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Isento/Dispensado',
    dataValidadeAlvara: '2026-12-31',
    numeroAlvara: 'DISP-2025/018',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Não Aplicável',
    fiscaisUltimaInspecao: []
  },
  {
    id: 'braunas-est-008',
    cnpjCpf: '28.910.455/0001-70',
    razaoSocial: 'COMERCIO DE DOCES E QUITANDAS CASEIRAS ME',
    nomeFantasia: 'Quitandas Dona Maria',
    endereco: {
      logradouro: 'Rua Bela Vista',
      numero: '12',
      bairro: 'Bela Vista',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 99841-1122',
      email: 'quitandas.donamaria@gmail.com'
    },
    cnaeCodigo: '47.29-6/99',
    cnaeDescricao: 'Comércio varejista de produtos alimentícios em geral não especificados anteriormente',
    nivelRisco: 'Risco I',
    dataUltimaInspecaoInicio: '',
    dataUltimaInspecaoFim: '',
    dataProximaInspecao: '2026-10-15',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Isento/Dispensado',
    dataValidadeAlvara: '2026-12-31',
    numeroAlvara: 'DISP-2025/022',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Não Aplicável',
    fiscaisUltimaInspecao: []
  },
  {
    id: 'braunas-est-009',
    cnpjCpf: '17.332.110/0001-84',
    razaoSocial: 'AUTO POSTO BRAUNAS DERIVADOS DE PETROLEO LTDA',
    nomeFantasia: 'Posto Alvorada',
    endereco: {
      logradouro: 'Avenida Beira Rio',
      numero: '500',
      bairro: 'Centro',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1888',
      email: 'gerencia@postobraunas.com.br'
    },
    cnaeCodigo: '47.31-8/00',
    cnaeDescricao: 'Comércio varejista de combustíveis para veículos automotores',
    nivelRisco: 'Risco II',
    dataUltimaInspecaoInicio: '2026-06-14',
    dataUltimaInspecaoFim: '2026-06-14',
    dataProximaInspecao: '2027-06-14',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '2027-06-14',
    numeroAlvara: 'ALV-2026/033',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira', 'Matheus Oliveira']
  },
  {
    id: 'braunas-est-010',
    cnpjCpf: '08.771.229/0001-65',
    razaoSocial: 'ACOUGUE E CASA DE CARNES BOI GORDO ME',
    nomeFantasia: 'Açougue Boi Gordo',
    endereco: {
      logradouro: 'Rua Antônio Dias',
      numero: '33',
      bairro: 'Centro',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1555',
      email: 'acougueboigordo@yahoo.com'
    },
    cnaeCodigo: '47.22-9/01',
    cnaeDescricao: 'Comércio varejista de carnes - açougues',
    nivelRisco: 'Risco II',
    dataUltimaInspecaoInicio: '',
    dataUltimaInspecaoFim: '',
    dataProximaInspecao: '2026-08-30',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Vencido',
    dataValidadeAlvara: '2025-12-31',
    numeroAlvara: 'ALV-2025/019',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: []
  },
  {
    id: 'braunas-est-011',
    cnpjCpf: '21.094.887/0001-90',
    razaoSocial: 'LAR SAO VICENTE DE PAULO DE BRAUNAS',
    nomeFantasia: 'Asilo São Vicente de Paulo (ILPI)',
    endereco: {
      logradouro: 'Rua São Vicente',
      numero: '100',
      bairro: 'Bela Vista',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1612',
      email: 'larsvicente.braunas@gmail.com'
    },
    cnaeCodigo: '87.11-5/02',
    cnaeDescricao: 'Instituições de longa permanência para idosos (ILPI)',
    nivelRisco: 'Risco III',
    dataUltimaInspecaoInicio: '2026-02-10',
    dataUltimaInspecaoFim: '2026-02-10',
    dataProximaInspecao: '2027-02-10',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '2027-02-10',
    numeroAlvara: 'ALV-2026/007',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira', 'Edmila Ferreira', 'Matheus Oliveira']
  },
  {
    id: 'braunas-est-012',
    cnpjCpf: '07.441.902/0001-19',
    razaoSocial: 'MERCEARIA E QUITANDA DO ZECA LTDA',
    nomeFantasia: 'Mercearia do Zeca',
    endereco: {
      logradouro: 'Rua Bela Vista',
      numero: '78',
      bairro: 'Bela Vista',
      cep: '35169-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1990',
      email: 'merceariazeca@gmail.com'
    },
    cnaeCodigo: '47.11-3/02',
    cnaeDescricao: 'Comércio varejista de mercadorias em geral (Minimercados, mercearias e armazéns)',
    nivelRisco: 'Risco II',
    dataUltimaInspecaoInicio: '2024-11-10',
    dataUltimaInspecaoFim: '2024-11-10',
    dataProximaInspecao: '2025-11-10',
    situacaoEstabelecimento: 'Inativo',
    situacaoAlvara: 'Vencido',
    dataValidadeAlvara: '2025-11-10',
    numeroAlvara: 'ALV-2024/041',
    observacoesBaixa: 'Baixado em 14/01/2026 - Encerramento formal das atividades comerciais com distrato social registrado na JUCEMG.',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira']
  }
];

export const SEED_INSPECOES_VAPT: InspecaoVapt[] = [
  {
    id: 'braunas-vapt-001',
    estabelecimentoId: 'braunas-est-002',
    nomeLocalTrabalho: 'Panificadora e Confeitaria Central (Área de Produção e Forno)',
    dataInspecao: '2026-03-12',
    numeroRelatorioTermo: 'TV-VAPT/2026-001',
    fiscaisResponsaveis: ['Matheus Oliveira', 'Lucas Silveira'],
    principaisRiscosIdentificados: 'Risco Físico (Calor excessivo na frente do forno contínuo, ruído dos batedores industriais); Risco Ergonômico (Levantamento manual de sacos de farinha de 25kg sem suporte adequado); Risco de Acidentes (Falta de proteção mecânica na correia da masseira).',
    recomendacoesOrientacoes: '1. Instalar proteção física conforme NR-12 no sistema de transmissão da masseira. 2. Implementar exaustor forçado na área de fornos para conforto térmico. 3. Adotar carrinhos hidráulicos para movimentação de sacaria.',
    statusInspecao: 'Concluída',
    prazoAdequacaoDias: 30,
    dataRetornoPrevista: '2026-04-12'
  },
  {
    id: 'braunas-vapt-002',
    estabelecimentoId: 'braunas-est-009',
    nomeLocalTrabalho: 'Auto Posto Braúnas (Pista de Abastecimento e Troca de Óleo)',
    dataInspecao: '2026-06-20',
    numeroRelatorioTermo: 'TV-VAPT/2026-002',
    fiscaisResponsaveis: ['Matheus Oliveira', 'Edmila Ferreira'],
    principaisRiscosIdentificados: 'Risco Químico (Exposição ocupacional a vapores de benzeno e hidrocarbonetos aromáticos durante abastecimento; manipulação de óleos lubrificantes usados na vala de troca); Risco de Acidentes (Inflamabilidade e ausência de sinalização em rampa).',
    recomendacoesOrientacoes: '1. Fornecer e fiscalizar uso diário de luvas de nitrila e óculos de proteção ampla visão para frentistas e lubrificadores. 2. Realizar exames periódicos toxicológicos (ácido trans,trans-mucônico) conforme PCMSO/NR-7. 3. Manter bacias de contenção desobstruídas.',
    statusInspecao: 'Concluída',
    prazoAdequacaoDias: 45,
    dataRetornoPrevista: '2026-08-05'
  },
  {
    id: 'braunas-vapt-003',
    estabelecimentoId: 'braunas-est-005',
    nomeLocalTrabalho: 'Laticínios e Queijaria Serra Negra (Área de Cura e Salga de Queijo)',
    dataInspecao: '2026-08-15',
    numeroRelatorioTermo: 'TV-VAPT/2026-003',
    fiscaisResponsaveis: ['Matheus Oliveira', 'Lucas Silveira'],
    principaisRiscosIdentificados: 'Risco Biológico e de Acidentes (Piso constantemente úmido com resíduos de soro de leite com risco de escorregamento; umidade elevada nas câmaras frias).',
    recomendacoesOrientacoes: '1. Aplicação de revestimento antiderrapante e calhas de drenagem rápida. 2. Disponibilização de botas de PVC com solado especial e vestimenta térmica com CA válido.',
    statusInspecao: 'Em Acompanhamento',
    prazoAdequacaoDias: 60,
    dataRetornoPrevista: '2026-10-20'
  }
];

export const SEED_LOGS_AUDITORIA: import('../types/vigiminas').LogAuditoria[] = [
  {
    id: 'braunas-log-001',
    recursoId: 'braunas-est-001',
    registroId: 'braunas-est-001',
    operacao: 'create',
    colecao: 'estabelecimentos',
    usuario: 'lucas.silveira@braunas.mg.gov.br',
    tipoRegistro: 'Estabelecimento',
    acao: 'Criação',
    identificadorEntidade: 'DROGARIA E FARMACIA BRAUNAS LTDA',
    fiscalResponsavel: 'Lucas Silveira',
    detalhes: 'Cadastro inicial do estabelecimento classificado como Risco II com alvará emitido (ALV-2026/014).',
    timestamp: '2026-03-10T09:30:00.000Z'
  },
  {
    id: 'braunas-log-002',
    recursoId: 'braunas-est-002',
    registroId: 'braunas-est-002',
    operacao: 'update',
    colecao: 'estabelecimentos',
    usuario: 'matheus.oliveira@braunas.mg.gov.br',
    tipoRegistro: 'InspecaoSanitariaRapida',
    acao: 'Inspeção Rápida',
    identificadorEntidade: 'PANIFICADORA E CONFEITARIA CENTRAL DE BRAUNAS ME',
    fiscalResponsavel: 'Matheus Oliveira',
    detalhes: 'Realizada vistoria sanitária de rotina com renovação do alvará até 18/02/2027.',
    timestamp: '2026-02-18T14:15:00.000Z'
  },
  {
    id: 'braunas-log-003',
    recursoId: 'braunas-vapt-001',
    registroId: 'braunas-vapt-001',
    operacao: 'create',
    colecao: 'inspecoes_vapt',
    usuario: 'matheus.oliveira@braunas.mg.gov.br',
    tipoRegistro: 'InspecaoVapt',
    acao: 'Criação',
    identificadorEntidade: 'TV-VAPT/2026-001 (Panificadora Central)',
    fiscalResponsavel: 'Matheus Oliveira',
    detalhes: 'Lavrado Termo Oficial VAPT apontando necessidade de adequação na NR-12 com prazo de 30 dias.',
    timestamp: '2026-03-12T11:00:00.000Z'
  },
  {
    id: 'braunas-log-004',
    recursoId: 'braunas-est-012',
    registroId: 'braunas-est-012',
    operacao: 'update',
    colecao: 'estabelecimentos',
    usuario: 'lucas.silveira@braunas.mg.gov.br',
    tipoRegistro: 'Estabelecimento',
    acao: 'Edição',
    identificadorEntidade: 'MERCEARIA E QUITANDA DO ZECA LTDA',
    fiscalResponsavel: 'Lucas Silveira',
    detalhes: 'Averbação de baixa cadastral: Baixado em 14/01/2026 - Distrato social registrado.',
    timestamp: '2026-01-14T16:45:00.000Z'
  }
];

export const SEED_CONFIGURACAO_SISTEMA: ConfiguracaoSistema = {
  id: 'geral',
  secretaria: {
    nomeOrgao: 'Prefeitura Municipal de Braúnas / MG',
    departamento: 'Secretaria Municipal de Saúde - Vigilância Sanitária e Saúde do Trabalhador (VISA)',
    municipio: 'Braúnas',
    uf: 'MG',
    codigoIbge: '3108805',
    cnpj: '18.315.241/0001-30',
    secretarioSaude: 'Dra. Maria Aparecida Ribeiro',
    coordenadorVisa: 'Lucas Silveira',
    enderecoCompleto: 'Praça Embaixador Amaral, nº 12, Centro - Braúnas/MG, CEP 35169-000',
    telefoneOficial: '(33) 3745-1212',
    emailOficial: 'vigilancia.sanitaria@braunas.mg.gov.br',
    horarioAtendimento: 'Segunda a Sexta-feira, das 07:00 às 16:00',
    portariaRegulamentacao: 'Portaria SMS nº 028/2022 - Regulamento Operacional da VISA Municipal de Braúnas/MG',
    textoRodapeOficial: 'Vigilância Sanitária Municipal de Braúnas/MG • Em conformidade com a Lei Federal nº 8.080/1990, Lei Estadual nº 13.317/1999 e Resolução SES/MG nº 8.432/2022.'
  },
  exercicioAtivo: {
    anoExercicio: 2026,
    metaInd11Vapt: 2,
    metaInd13RiscoI: 15,
    metaInd14RiscoII: 90,
    metaInd15RiscoIII: 100,
    dataInicioExercicio: '2026-01-01',
    dataTerminoExercicio: '2026-12-31',
    statusExercicio: 'Em Andamento'
  },
  exerciciosHistorico: [
    {
      anoExercicio: 2025,
      metaInd11Vapt: 2,
      metaInd13RiscoI: 15,
      metaInd14RiscoII: 90,
      metaInd15RiscoIII: 100,
      dataInicioExercicio: '2025-01-01',
      dataTerminoExercicio: '2025-12-31',
      statusExercicio: 'Homologado'
    }
  ],
  fiscais: [
    {
      id: 'fiscal-001',
      nome: 'Lucas Silveira',
      matricula: 'BR-4091',
      cargo: 'Fiscal Sanitário Municipal / Coordenador VISA',
      email: 'lucas.silveira@braunas.mg.gov.br',
      telefone: '(33) 99874-2101',
      ativo: true,
      dataAdmissao: '2021-03-15'
    },
    {
      id: 'fiscal-002',
      nome: 'Matheus Oliveira',
      matricula: 'BR-4182',
      cargo: 'Fiscal Sanitário e de Saúde do Trabalhador',
      email: 'matheus.oliveira@braunas.mg.gov.br',
      telefone: '(33) 99823-5544',
      ativo: true,
      dataAdmissao: '2022-07-01'
    },
    {
      id: 'fiscal-003',
      nome: 'Edmila Ferreira',
      matricula: 'BR-4309',
      cargo: 'Fiscal de Vigilância em Saúde',
      email: 'edmila.ferreira@braunas.mg.gov.br',
      telefone: '(33) 99912-8877',
      ativo: true,
      dataAdmissao: '2023-02-10'
    }
  ]
};

