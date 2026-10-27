import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { FichaIndividualEmpresaPage } from '../../../src/pages/FichaIndividualEmpresaPage';
import { Estabelecimento, InspecaoVapt } from '../../../src/types/vigiminas';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockEstabelecimentos: Estabelecimento[] = [
  {
    id: 'est-001',
    cnpjCpf: '12.345.678/0001-90',
    cnpj: '12.345.678/0001-90',
    identificacaoMunicipal: 'IM-100234',
    razaoSocial: 'Padaria Central Braúnas LTDA',
    nomeFantasia: 'Padaria do Povo',
    endereco: {
      logradouro: 'Rua Principal',
      numero: '100',
      bairro: 'Centro',
      cep: '35189-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1111',
      email: 'contato@padariacentral.com'
    },
    cnaeCodigo: '10.91-1/02',
    cnaeDescricao: 'Fabricação de produtos de padaria e confeitaria',
    nivelRisco: 'Risco II',
    dataUltimaInspecaoInicio: '2026-02-15',
    dataUltimaInspecaoFim: '2026-02-15',
    dataProximaInspecao: '2027-02-15',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataValidadeAlvara: '2026-12-31',
    numeroAlvara: 'ALV-2026-0042',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    fiscaisUltimaInspecao: ['Lucas Silveira', 'Matheus Oliveira']
  },
  {
    id: 'est-002',
    cnpjCpf: '98.765.432/0001-10',
    cnpj: '98.765.432/0001-10',
    identificacaoMunicipal: 'IM-500890',
    razaoSocial: 'Hospital Regional e Maternidade',
    nomeFantasia: 'Hospital da Cidade',
    endereco: {
      logradouro: 'Av. Saúde Pública',
      numero: '500',
      bairro: 'Hospitalar',
      cep: '35189-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-2222',
      email: 'diretoria@hospitalregional.com.br'
    },
    cnaeCodigo: '86.10-1/01',
    cnaeDescricao: 'Atividades de atendimento hospitalar',
    nivelRisco: 'Risco III',
    dataUltimaInspecaoInicio: '',
    dataUltimaInspecaoFim: '',
    dataProximaInspecao: '',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Não Possui (Irregular)',
    dataValidadeAlvara: '',
    numeroAlvara: '',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim'
  }
];

const mockInspecoesVapt: InspecaoVapt[] = [
  {
    id: 'vapt-001',
    estabelecimentoId: 'est-001',
    nomeLocalTrabalho: 'Padaria Central - Setor de Fornos e Produção',
    dataInspecao: '2026-04-10',
    numeroRelatorioTermo: 'TERMO-VAPT-2026/01',
    fiscaisResponsaveis: ['Lucas Silveira'],
    principaisRiscosIdentificados: 'Calor excessivo e ruído de maquinário',
    recomendacoesOrientacoes: 'Instalação de exaustor industrial e protetores auriculares',
    statusInspecao: 'Concluída',
    prazoAdequacaoDias: 30
  }
];

const mockConfiguracao = {
  secretaria: {
    nomeOrgao: 'Secretaria Municipal de Saúde',
    departamento: 'Vigilância Sanitária',
    municipio: 'Braúnas',
    uf: 'MG',
    codigoIbge: '3109009',
    cnpj: '18.423.901/0001-45',
    secretarioSaude: 'Dr. Roberto Almeida',
    coordenadorVisa: 'Matheus Henrique Macieira',
    enderecoCompleto: 'Praça Central, nº 10, Centro, Braúnas/MG',
    telefoneOficial: '(33) 3295-1234',
    emailOficial: 'visa@braunas.mg.gov.br',
    horarioAtendimento: '08:00 às 17:00',
    portariaRegulamentacao: 'Portaria nº 014/2026',
    textoRodapeOficial: 'VigiMinas • Gestão Sanitária Municipal'
  },
  exercicioAtivo: {
    anoExercicio: 2026,
    metaInd11Vapt: 2,
    metaInd13RiscoI: 15,
    metaInd14RiscoII: 90,
    metaInd15RiscoIII: 100,
    dataInicioExercicio: '2026-01-01',
    dataTerminoExercicio: '2026-12-31',
    statusExercicio: 'Em Andamento' as const
  }
};

vi.mock('../../../src/contexts/VigiMinasContext', () => ({
  useVigiMinas: () => ({
    estabelecimentos: mockEstabelecimentos,
    inspecoesVapt: mockInspecoesVapt,
    logsAuditoria: [],
    indicadores: { anoReferencia: 2026 },
    configuracao: mockConfiguracao,
    loading: false
  }),
}));

describe('FichaIndividualEmpresaPage (US-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho oficial do documento sanitário', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/ESTADO DE MINAS GERAIS • SECRETARIA MUNICIPAL DE SAÚDE/i)).toBeInTheDocument();
    expect(screen.getByText(/Superintendência de Vigilância Sanitária • Município de Braúnas \/ MG/i)).toBeInTheDocument();
    expect(screen.getByText(/FICHA CADASTRAL E HISTÓRICO SANITÁRIO DO ESTABELECIMENTO/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PROGRAMA VIGIMINAS 2026/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza a identificação cadastral completa do primeiro estabelecimento por padrão', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Razão Social & Fantasia
    expect(screen.getAllByText('Padaria Central Braúnas LTDA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Padaria do Povo/i).length).toBeGreaterThanOrEqual(1);

    // CNPJ e Inscrição Municipal
    expect(screen.getAllByText('12.345.678/0001-90').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('IM-100234')).toBeInTheDocument();

    // Endereço e Contato
    expect(screen.getByText(/Rua Principal, nº 100/i)).toBeInTheDocument();
    expect(screen.getByText('(33) 3295-1111')).toBeInTheDocument();
    expect(screen.getByText('contato@padariacentral.com')).toBeInTheDocument();
  });

  it('renderiza o enquadramento sanitário e regularidade do alvará', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Nível de Risco Sanitário
    expect(screen.getByText('2. Enquadramento Sanitário e Regularidade de Alvará')).toBeInTheDocument();
    expect(screen.getAllByText('Risco II').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Médio Risco')).toBeInTheDocument();

    // CNAE Principal
    expect(screen.getByText('10.91-1/02')).toBeInTheDocument();
    expect(screen.getByText(/Fabricação de produtos de padaria e confeitaria/i)).toBeInTheDocument();

    // Alvará e Validade
    expect(screen.getAllByText(/Vigente \/ Regular/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('31/12/2026')).toBeInTheDocument();
    expect(screen.getByText(/Nº Licença: ALV-2026-0042/i)).toBeInTheDocument();
  });

  it('renderiza o histórico cronológico cruzado de fiscalizações e vistorias VAPT', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('3. Histórico Cronológico de Fiscalizações e Inspeções Sanitárias')).toBeInTheDocument();
    
    // Inspeção VAPT
    expect(screen.getByText('Vistoria VAPT (Saúde do Trabalhador)')).toBeInTheDocument();
    expect(screen.getByText('TERMO-VAPT-2026/01')).toBeInTheDocument();
    expect(screen.getByText(/Calor excessivo e ruído de maquinário/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Lucas Silveira/i).length).toBeGreaterThanOrEqual(1);

    // Inspeção Periódica do Cadastro
    expect(screen.getByText('Inspeção Sanitária Periódica / Licenciamento')).toBeInTheDocument();
    expect(screen.getByText('15/02/2026')).toBeInTheDocument();
  });

  it('renderiza o termo de responsabilidade e as duas linhas de assinatura', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/4\. Termo de Responsabilidade e Fé Pública/i)).toBeInTheDocument();
    expect(screen.getByText(/Atestamos para os devidos fins a veracidade das informações cadastrais e sanitárias acima descritas/i)).toBeInTheDocument();

    // Assinatura Autoridade Sanitária (Coordenador VISA)
    expect(screen.getByText('Matheus Henrique Macieira')).toBeInTheDocument();
    expect(screen.getByText(/Autoridade Sanitária \/ Fiscal Responsável/i)).toBeInTheDocument();

    // Assinatura Responsável pelo Estabelecimento
    expect(screen.getByText('Responsável pelo Estabelecimento')).toBeInTheDocument();
    expect(screen.getByText(/Nome Legível e Assinatura/i)).toBeInTheDocument();
  });

  it('carrega estabelecimento específico quando id é passado via rota /relatorios/ficha-empresa/:id', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa/est-002']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa/:id" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Deve carregar o Hospital Regional e Maternidade
    expect(screen.getAllByText('Hospital Regional e Maternidade').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('98.765.432/0001-10').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Risco III').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Alto Risco')).toBeInTheDocument();

    // Não deve carregar os dados da Padaria
    expect(screen.queryByText('Padaria Central Braúnas LTDA')).not.toBeInTheDocument();
  });

  it('exibe mensagem formal quando a empresa não possui histórico de inspeções', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa/est-002']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa/:id" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Nenhum histórico de inspeção sanitária registrado para este estabelecimento até a presente data\./i)).toBeInTheDocument();
  });

  it('permite buscar e selecionar outra empresa na barra de controle', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
          <Route path="/relatorios/ficha-empresa/:id" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    const inputBusca = screen.getByPlaceholderText(/Trocar empresa: busque por Razão Social, Fantasia ou CNPJ\.\.\./i);
    fireEvent.focus(inputBusca);
    fireEvent.change(inputBusca, { target: { value: 'Hospital' } });

    // Clica no item sugerido do Hospital
    const itemHospital = screen.getByText('Hospital Regional e Maternidade');
    fireEvent.click(itemHospital);

    expect(mockNavigate).toHaveBeenCalledWith('/relatorios/ficha-empresa/est-002', { replace: true });
  });

  it('aciona window.print ao clicar no botão de impressão', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    const btnPrint = screen.getByRole('button', { name: /Imprimir Ficha \/ Salvar PDF/i });
    fireEvent.click(btnPrint);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('permite retornar à Central de Relatórios pelo link de voltar', () => {
    render(
      <MemoryRouter initialEntries={['/relatorios/ficha-empresa']}>
        <Routes>
          <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
        </Routes>
      </MemoryRouter>
    );

    const linkVoltar = screen.getByRole('link', { name: /Voltar para Relatórios/i });
    expect(linkVoltar).toHaveAttribute('href', '/relatorios');
  });
});
