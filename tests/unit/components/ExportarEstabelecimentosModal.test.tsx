import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockExportarEstabelecimentos = vi.fn().mockResolvedValue({
  sucesso: true,
  nomeArquivo: 'Backup.xlsx',
  totalExportados: 1,
  formato: 'xlsx',
  timestamp: new Date().toISOString()
});

vi.mock('@/src/contexts/VigiMinasContext', () => ({
  useVigiMinas: () => ({
    estabelecimentos: [
      {
        id: 'est-1',
        razaoSocial: 'Padaria Alfa',
        cnpjCpf: '11.111.111/0001-11',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Ativo'
      }
    ],
    exportarEstabelecimentos: mockExportarEstabelecimentos,
    configuracao: {
      fiscais: [{ id: 'f-1', nome: 'Lucas Silveira', ativo: true }]
    }
  })
}));

import { ExportarEstabelecimentosModal } from '@/src/components/ExportarEstabelecimentosModal';

describe('ExportarEstabelecimentosModal - Unit Tests', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nao renderiza se isOpen for false', () => {
    const { container } = render(<ExportarEstabelecimentosModal isOpen={false} onClose={mockOnClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe opcoes de formato e permite selecionar CSV', () => {
    render(<ExportarEstabelecimentosModal isOpen={true} onClose={mockOnClose} />);

    const csvOption = screen.getByText('Texto CSV (.csv)');
    fireEvent.click(csvOption);

    expect(screen.getByText(/Separador de Campos do CSV:/i)).toBeInTheDocument();
  });

  it('dispara exportacao ao clicar no botao de baixar arquivo', async () => {
    render(<ExportarEstabelecimentosModal isOpen={true} onClose={mockOnClose} />);

    const downloadBtn = screen.getByRole('button', { name: /Baixar Arquivo/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(mockExportarEstabelecimentos).toHaveBeenCalledWith(
        expect.objectContaining({
          formato: 'xlsx',
          escopo: 'todos',
          incluirMetadados: true,
          registrarAuditoria: true
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
