import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EstabelecimentosList } from '../../../src/components/EstabelecimentosList';
import { Estabelecimento } from '../../../src/types/vigiminas';

const mockAtivo: Estabelecimento = {
  id: 'est-1',
  razaoSocial: 'Padaria Alfa Ltda',
  nomeFantasia: 'Padaria Alfa',
  cnpjCpf: '11.222.333/0001-44',
  cnaeCodigo: '1091-1/01',
  cnaeDescricao: 'Fabricação de produtos de panificação',
  nivelRisco: 'Risco I',
  situacaoAlvara: 'Válido',
  situacaoEstabelecimento: 'Ativo',
  dataUltimaInspecaoInicio: '2026-02-10',
  dataUltimaInspecaoFim: '2026-02-10',
  dataProximaInspecao: '2027-02-10',
  dataValidadeAlvara: '2027-02-10',
  numeroAlvara: 'ALV-2026-01',
  observacoesBaixa: '',
  competenciaFiscalizacao: 'Municipal',
  parecerProjetoArquitetonico: 'Não Aplicável',
  endereco: {
    logradouro: 'Rua Principal',
    numero: '100',
    bairro: 'Centro',
    municipio: 'Braúnas/MG',
    cep: '35169-000'
  },
  contato: {
    telefone: '(33) 99999-0001',
    email: 'alfa@email.com'
  },
  isDeleted: false
};

const mockArquivado: Estabelecimento = {
  id: 'est-2',
  razaoSocial: 'Açougue Beta Ltda',
  nomeFantasia: 'Açougue Beta',
  cnpjCpf: '22.333.444/0001-55',
  cnaeCodigo: '4722-9/01',
  cnaeDescricao: 'Comércio varejista de carnes - açougues',
  nivelRisco: 'Risco II',
  situacaoAlvara: 'Vencido',
  situacaoEstabelecimento: 'Inativo',
  dataUltimaInspecaoInicio: '2025-05-10',
  dataUltimaInspecaoFim: '2025-05-10',
  dataProximaInspecao: '2026-05-10',
  dataValidadeAlvara: '2025-05-10',
  numeroAlvara: 'ALV-2025-88',
  observacoesBaixa: 'Empresa encerrou as atividades',
  competenciaFiscalizacao: 'Municipal',
  parecerProjetoArquitetonico: 'Não Aplicável',
  endereco: {
    logradouro: 'Av Central',
    numero: '200',
    bairro: 'Vila Nova',
    municipio: 'Braúnas/MG',
    cep: '35169-000'
  },
  contato: {
    telefone: '(33) 99999-0002',
    email: 'beta@email.com'
  },
  isDeleted: true,
  motivoExclusao: 'Encerrou as atividades comerciais',
  deletedAt: '2026-03-10T14:00:00.000Z',
  deletedBy: 'Fiscal Carlos'
};

const mockPermanentementeExcluido: Estabelecimento = {
  id: 'est-3',
  razaoSocial: 'Farmácia Oculta Ltda',
  nomeFantasia: 'Farmácia Oculta',
  cnpjCpf: '33.444.555/0001-66',
  cnaeCodigo: '4771-7/01',
  cnaeDescricao: 'Comércio varejista de produtos farmacêuticos',
  nivelRisco: 'Risco III',
  situacaoAlvara: 'Não Possui (Irregular)',
  situacaoEstabelecimento: 'Inativo',
  dataUltimaInspecaoInicio: '2024-01-10',
  dataUltimaInspecaoFim: '2024-01-10',
  dataProximaInspecao: '2025-01-10',
  dataValidadeAlvara: '',
  numeroAlvara: '',
  observacoesBaixa: 'Fechamento definitivo',
  competenciaFiscalizacao: 'Municipal',
  parecerProjetoArquitetonico: 'Não Aplicável',
  endereco: {
    logradouro: 'Rua das Flores',
    numero: '300',
    bairro: 'Centro',
    municipio: 'Braúnas/MG',
    cep: '35169-000'
  },
  contato: {
    telefone: '(33) 99999-0003',
    email: 'farmacia@email.com'
  },
  isDeleted: true,
  isPermanentlyDeleted: true,
  motivoExclusao: 'Fechou definitivamente',
  motivoExclusaoPermanente: 'Removido da lista de arquivados pelo fiscal',
  deletedAt: '2026-01-10T10:00:00.000Z'
};

describe('EstabelecimentosList - Arquivados & Exclusão em 2 Níveis', () => {
  const mockOnNovo = vi.fn();
  const mockOnEditar = vi.fn();
  const mockOnExcluir = vi.fn();
  const mockOnExcluirPermanente = vi.fn();
  const mockOnRestaurar = vi.fn();
  const mockOnRegistrarInspecao = vi.fn();
  const mockOnCriarVapt = vi.fn();
  const mockOnExport = vi.fn();
  const mockOnImport = vi.fn();

  const defaultProps = {
    estabelecimentos: [mockAtivo, mockArquivado, mockPermanentementeExcluido],
    onNovoEstabelecimento: mockOnNovo,
    onEditarEstabelecimento: mockOnEditar,
    onExcluirEstabelecimento: mockOnExcluir,
    onExcluirPermanente: mockOnExcluirPermanente,
    onRestaurarEstabelecimento: mockOnRestaurar,
    onRegistrarInspecaoRapida: mockOnRegistrarInspecao,
    onCriarVaptVinculada: mockOnCriarVapt,
    onExportExcel: mockOnExport,
    onImportarPlanilha: mockOnImport
  };

  it('exibe a aba renomeada para "Arquivados" e conta apenas arquivados não excluídos permanentemente', () => {
    render(<EstabelecimentosList {...defaultProps} />);

    // Aba Cadastros Ativos deve contar 1
    expect(screen.getByText('Cadastros Ativos')).toBeInTheDocument();
    
    // Aba Arquivados deve existir (sem o texto Lixeira ou Soft Delete)
    const tabArquivados = screen.getByRole('button', { name: /Arquivados/i });
    expect(tabArquivados).toBeInTheDocument();
    expect(screen.queryByText(/Lixeira \/ Arquivados/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(Soft Delete\)/i)).not.toBeInTheDocument();

    // Na aba ativos, exibe Padaria Alfa e oculta Açougue Beta e Farmácia Oculta
    expect(screen.getAllByText('Padaria Alfa').length).toBeGreaterThan(0);
    expect(screen.queryByText('Açougue Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Farmácia Oculta')).not.toBeInTheDocument();
  });

  it('alterna para a aba Arquivados exibindo botões de Restaurar e Excluir', () => {
    render(<EstabelecimentosList {...defaultProps} />);

    const tabArquivados = screen.getByRole('button', { name: /Arquivados/i });
    fireEvent.click(tabArquivados);

    // Açougue Beta deve estar visível com o motivo
    expect(screen.getAllByText('Açougue Beta').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Encerrou as atividades comerciais/).length).toBeGreaterThan(0);

    // O estabelecimento com isPermanentlyDeleted: true NÃO deve estar visível
    expect(screen.queryByText('Farmácia Oculta')).not.toBeInTheDocument();

    // Botões de Restaurar e Excluir devem estar presentes
    const botoesRestaurar = screen.getAllByRole('button', { name: /Restaurar/i });
    expect(botoesRestaurar.length).toBeGreaterThan(0);

    const botoesExcluir = screen.getAllByRole('button', { name: /Excluir/i });
    expect(botoesExcluir.length).toBeGreaterThan(0);
  });

  it('chama onRestaurarEstabelecimento ao clicar em Restaurar', () => {
    render(<EstabelecimentosList {...defaultProps} />);

    const tabArquivados = screen.getByRole('button', { name: /Arquivados/i });
    fireEvent.click(tabArquivados);

    const btnRestaurar = screen.getAllByRole('button', { name: /Restaurar/i })[0];
    fireEvent.click(btnRestaurar);

    expect(mockOnRestaurar).toHaveBeenCalledWith(mockArquivado.id, mockArquivado.razaoSocial);
  });

  it('chama onExcluirPermanente ao clicar em Excluir na aba Arquivados', () => {
    render(<EstabelecimentosList {...defaultProps} />);

    const tabArquivados = screen.getByRole('button', { name: /Arquivados/i });
    fireEvent.click(tabArquivados);

    const btnExcluir = screen.getAllByRole('button', { name: /Excluir/i })[0];
    fireEvent.click(btnExcluir);

    expect(mockOnExcluirPermanente).toHaveBeenCalledWith(
      mockArquivado.id, 
      mockArquivado.razaoSocial, 
      mockArquivado.cnpjCpf
    );
  });
});
