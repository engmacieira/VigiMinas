import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EstabelecimentoModal } from '@/src/components/EstabelecimentoModal';
import { Estabelecimento } from '@/src/types/vigiminas';

describe('EstabelecimentoModal - Unit Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnExcluir = vi.fn();

  const estMock: Estabelecimento = {
    id: 'est-edit-1',
    cnpjCpf: '12.345.678/0001-90',
    razaoSocial: 'Supermercado Central LTDA',
    nomeFantasia: 'Supermercado Central',
    cnaeCodigo: '4711-3/02',
    cnaeDescricao: 'Comércio de mercadorias em geral',
    nivelRisco: 'Risco II',
    situacaoEstabelecimento: 'Ativo',
    situacaoAlvara: 'Válido',
    dataUltimaInspecaoInicio: '2026-01-01',
    dataUltimaInspecaoFim: '2026-01-01',
    dataProximaInspecao: '2027-01-01',
    dataValidadeAlvara: '2026-12-31',
    numeroAlvara: 'ALV-123',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    endereco: {
      logradouro: 'Av. Brasil',
      numero: '100',
      bairro: 'Centro',
      cep: '35189-000',
      municipio: 'Braúnas/MG'
    },
    contato: {
      telefone: '(33) 3295-1000',
      email: 'contato@central.com'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nao renderiza nada se isOpen for false', () => {
    const { container } = render(
      <EstabelecimentoModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        estabelecimentoParaEditar={null}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe erros de validacao ao submeter formulario em branco', async () => {
    render(
      <EstabelecimentoModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        estabelecimentoParaEditar={null}
      />
    );

    const submitBtn = screen.getByText('Salvar Cadastro');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('CNPJ ou CPF é obrigatório.')).toBeInTheDocument();
      expect(screen.getByText('Razão Social é obrigatória.')).toBeInTheDocument();
      expect(screen.getByText('Logradouro é obrigatório.')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('exige regra da SES/MG de data de baixa quando situacao for Inativo', async () => {
    render(
      <EstabelecimentoModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        estabelecimentoParaEditar={estMock}
      />
    );

    const statusSelect = screen.getByDisplayValue(/Ativo \(Em funcionamento regular\)/i);
    fireEvent.change(statusSelect, { target: { value: 'Inativo' } });

    const submitBtn = screen.getByText('Salvar Cadastro');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Formato exigido pela SES\/MG/i)).toBeInTheDocument();
    });

    const hojeBtn = screen.getByText('Inserir data de hoje');
    fireEvent.click(hojeBtn);

    const textarea = screen.getByPlaceholderText(/Ex: Baixado em 14\/01\/2026/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Baixado em ');
  });

  it('envia dados com sucesso ao preencher formulario valido', async () => {
    render(
      <EstabelecimentoModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        estabelecimentoParaEditar={estMock}
      />
    );

    const submitBtn = screen.getByText('Salvar Cadastro');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        razaoSocial: 'Supermercado Central LTDA',
        cnpjCpf: '12.345.678/0001-90'
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('chama onExcluir ao clicar no botao de exclusao em modo de edicao', () => {
    render(
      <EstabelecimentoModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onExcluir={mockOnExcluir}
        estabelecimentoParaEditar={estMock}
      />
    );

    const deleteBtn = screen.getByText('Excluir (Soft Delete)');
    fireEvent.click(deleteBtn);

    expect(mockOnExcluir).toHaveBeenCalledWith(estMock.id, estMock.razaoSocial, estMock.cnpjCpf);
  });

  it('permite selecionar o CNAE padrao 47.12-01/00 de Risco I com um clique', () => {
    render(
      <EstabelecimentoModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        estabelecimentoParaEditar={estMock}
      />
    );

    // O estMock inicial tem CNAE 4711-3/02 e Risco II
    const cnaeInput = screen.getByDisplayValue('4711-3/02') as HTMLInputElement;
    expect(cnaeInput).toBeInTheDocument();

    // Clica no botão 47.12-01/00 na lista de atividades típicas
    const btnCnae = screen.getByText('47.12-01/00');
    fireEvent.click(btnCnae);

    // Verifica que o código foi atualizado para 47.12-01/00 e descrição para mercadorias em geral
    expect((screen.getByDisplayValue('47.12-01/00') as HTMLInputElement)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Comércio varejista de mercadorias em geral (Minimercados, mercearias e armazéns)')).toBeInTheDocument();
    
    // Verifica que o risco foi configurado para Risco I
    const riscoSelect = screen.getByDisplayValue(/Risco I - Baixo Risco/i) as HTMLSelectElement;
    expect(riscoSelect.value).toBe('Risco I');
  });

  it('permite selecionar a nova situacao de alvara "Não Possui (Irregular)" e exibe aviso de irregularidade', () => {
    render(
      <EstabelecimentoModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        estabelecimentoParaEditar={estMock}
      />
    );

    // Localiza o select de Situação do Alvará Sanitário
    const alvaraSelect = screen.getByLabelText(/Situação do Alvará Sanitário/i) || screen.getByDisplayValue('Válido');
    fireEvent.change(alvaraSelect, { target: { value: 'Não Possui (Irregular)' } });

    // Verifica que o texto de atenção para empresa irregular é exibido
    expect(screen.getByText(/A empresa deveria possuir alvará sanitário mas opera sem a devida licença/i)).toBeInTheDocument();
  });
});
