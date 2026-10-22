import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockGerarModeloPlanilha = vi.fn();
const mockProcessarArquivoPlanilha = vi.fn().mockReturnValue({
  totalLinhas: 1,
  validos: [
    {
      id: 'braunas-est-12345678',
      razaoSocial: 'Drogaria Importada',
      cnpjCpf: '12.345.678/0001-90',
      nivelRisco: 'Risco I',
      situacaoEstabelecimento: 'Ativo',
      situacaoAlvara: 'Válido',
      cnaeCodigo: '4771-7/01',
      cnaeDescricao: 'Drogaria',
      endereco: { logradouro: 'Av. Brasil', numero: '100', bairro: 'Centro', cep: '35189-000', municipio: 'Braúnas/MG' },
      contato: { telefone: '3332951000', email: 'contato@import.com' }
    }
  ],
  erros: []
});
const mockImportarLotePlanilha = vi.fn().mockResolvedValue({ importados: 1, atualizados: 0, falhas: 0 });

vi.mock('@/src/contexts/VigiMinasContext', () => ({
  useVigiMinas: () => ({
    gerarModeloPlanilha: mockGerarModeloPlanilha,
    processarArquivoPlanilha: mockProcessarArquivoPlanilha,
    importarLotePlanilha: mockImportarLotePlanilha,
    estabelecimentos: []
  })
}));

import { ImportarPlanilhaModal } from '@/src/components/ImportarPlanilhaModal';

describe('ImportarPlanilhaModal - Unit Tests', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nao renderiza quando isOpen e false', () => {
    const { container } = render(<ImportarPlanilhaModal isOpen={false} onClose={mockOnClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('dispara geracao de planilha modelo ao clicar no botao', () => {
    render(<ImportarPlanilhaModal isOpen={true} onClose={mockOnClose} />);

    const downloadBtn = screen.getByText('Baixar Modelo (.xlsx)');
    fireEvent.click(downloadBtn);

    expect(mockGerarModeloPlanilha).toHaveBeenCalled();
  });

  it('processa e exibe dados ao selecionar um arquivo .xlsx', async () => {
    render(<ImportarPlanilhaModal isOpen={true} onClose={mockOnClose} />);

    const file = new File(['dummy content'], 'estabelecimentos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockProcessarArquivoPlanilha).toHaveBeenCalled();
      expect(screen.getByText('Drogaria Importada')).toBeInTheDocument();
      expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
    });
  });

  it('confirma importacao em lote ao clicar no botao de confirmacao', async () => {
    render(<ImportarPlanilhaModal isOpen={true} onClose={mockOnClose} />);

    const file = new File(['dummy content'], 'estabelecimentos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Drogaria Importada')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Importação/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockImportarLotePlanilha).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ razaoSocial: 'Drogaria Importada' })
      ]));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
