import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvisoVistoriaModal } from '../../../src/components/AvisoVistoriaModal';
import { Estabelecimento } from '../../../src/types/vigiminas';

const mockEstabelecimento: Estabelecimento = {
  id: 'est-001',
  cnpjCpf: '18.423.901/0001-45',
  cnpj: '18.423.901/0001-45',
  razaoSocial: 'DROGARIA E FARMACIA BRAUNAS LTDA',
  nomeFantasia: 'Farmácia Popular de Braúnas',
  endereco: {
    logradouro: 'Praça Monsenhor Horta',
    numero: '124',
    bairro: 'Centro',
    cep: '35189-000',
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
  numeroAlvara: 'ALV-2026-001',
  observacoesBaixa: '',
  competenciaFiscalizacao: 'Municipal',
  parecerProjetoArquitetonico: 'Sim'
};

const mockConfiguracao = {
  secretaria: {
    nomeOrgao: 'Secretaria Municipal de Saúde',
    departamento: 'Setor de Vigilância Sanitária Municipal',
    municipio: 'Braúnas',
    uf: 'MG',
    codigoIbge: '3108909',
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
    configuracao: mockConfiguracao,
    estabelecimentos: [mockEstabelecimento]
  })
}));

describe('AvisoVistoriaModal (US-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza nada quando isOpen é false', () => {
    const { container } = render(
      <AvisoVistoriaModal
        isOpen={false}
        onClose={vi.fn()}
        estabelecimento={mockEstabelecimento}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza o cabeçalho oficial e dados do estabelecimento quando aberto', () => {
    render(
      <AvisoVistoriaModal
        isOpen={true}
        onClose={vi.fn()}
        estabelecimento={mockEstabelecimento}
      />
    );

    // Cabeçalho institucional
    expect(screen.getByText(/ESTADO DE MINAS GERAIS • PREFEITURA MUNICIPAL DE BRAÚNAS \/ MG/i)).toBeInTheDocument();
    expect(screen.getByText(/COMUNICADO OFICIAL: VISTORIA SANITÁRIA ANUAL PROGRAMADA/i)).toBeInTheDocument();

    // Dados do estabelecimento
    expect(screen.getByText('DROGARIA E FARMACIA BRAUNAS LTDA')).toBeInTheDocument();
    expect(screen.getByText('Farmácia Popular de Braúnas')).toBeInTheDocument();
    expect(screen.getByText('18.423.901/0001-45')).toBeInTheDocument();
    expect(screen.getByText('47.71-7/01')).toBeInTheDocument();
    expect(screen.getAllByText(/Risco II/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza o checklist de documentação obrigatória geral e específica', () => {
    render(
      <AvisoVistoriaModal
        isOpen={true}
        onClose={vi.fn()}
        estabelecimento={mockEstabelecimento}
      />
    );

    expect(screen.getByText(/CHECKLIST DE DOCUMENTAÇÃO OBRIGATÓRIA/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Documentos Gerais \(Todos os Estabelecimentos \/ Riscos I, II e III\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Licença Sanitária \/ Alvará Sanitário anterior/i)).toBeInTheDocument();
    expect(screen.getByText(/Certificado de higienização do reservatório de água/i)).toBeInTheDocument();
    expect(screen.getByText(/Comprovante de desinsetização e desratização/i)).toBeInTheDocument();

    // Específicos
    expect(screen.getByText(/2\. Documentos Específicos para Alimentação, Saúde e Atividades com RT/i)).toBeInTheDocument();
    expect(screen.getByText(/Manual de Boas Práticas \(MBP\) e Procedimentos Operacionais Padronizados \(POPs\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Atestados de Saúde Ocupacional \(ASO\) dos funcionários em dia/i)).toBeInTheDocument();
  });

  it('permite alterar a data de previsão no input da barra superior', () => {
    render(
      <AvisoVistoriaModal
        isOpen={true}
        onClose={vi.fn()}
        estabelecimento={mockEstabelecimento}
      />
    );

    const inputPrevisao = screen.getByPlaceholderText(/Ex: 09 de novembro/i);
    expect(inputPrevisao).toHaveValue('09 de novembro');

    fireEvent.change(inputPrevisao, { target: { value: '25 de novembro' } });
    expect(inputPrevisao).toHaveValue('25 de novembro');
    expect(screen.getByText(/As inspeções serão realizadas a partir do dia/i)).toBeInTheDocument();
    expect(screen.getByText('25 de novembro')).toBeInTheDocument();
  });

  it('renderiza o termo de recebimento com assinaturas oficiais da VISA', () => {
    render(
      <AvisoVistoriaModal
        isOpen={true}
        onClose={vi.fn()}
        estabelecimento={mockEstabelecimento}
      />
    );

    expect(screen.getByText(/TERMO DE RECEBIMENTO E ASSINATURAS/i)).toBeInTheDocument();
    expect(screen.getByText(/Assinatura do Responsável no Local/i)).toBeInTheDocument();
    expect(screen.getByText('Assinatura Vigilância Sanitária Braúnas')).toBeInTheDocument();
    expect(screen.queryByText('Matheus Henrique Macieira')).not.toBeInTheDocument();
    expect(screen.queryByText(/Autoridade Sanitária \(Assinatura \/ Matrícula\)/i)).not.toBeInTheDocument();
  });

  it('aciona window.print ao clicar no botão Imprimir / Salvar PDF', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <AvisoVistoriaModal
        isOpen={true}
        onClose={vi.fn()}
        estabelecimento={mockEstabelecimento}
      />
    );

    const btnPrint = screen.getByRole('button', { name: /Imprimir \/ Salvar PDF/i });
    fireEvent.click(btnPrint);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('chama onClose ao clicar no botão de fechar', () => {
    const onCloseMock = vi.fn();

    render(
      <AvisoVistoriaModal
        isOpen={true}
        onClose={onCloseMock}
        estabelecimento={mockEstabelecimento}
      />
    );

    const btnClose = screen.getByLabelText(/Fechar modal/i);
    fireEvent.click(btnClose);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
