import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/src/contexts/VigiMinasContext', () => ({
  useVigiMinas: () => ({
    fiscaisAtivos: ['Lucas Silveira', 'Matheus Oliveira'],
    configuracao: {
      exercicioAtivo: { anoExercicio: 2026 }
    }
  })
}));

import { RegistrarInspecaoModal } from '@/src/components/RegistrarInspecaoModal';
import { Estabelecimento } from '@/src/types/vigiminas';

describe('RegistrarInspecaoModal - Unit Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirmInspecao = vi.fn().mockResolvedValue(undefined);

  const estMock: Estabelecimento = {
    id: 'est-1',
    razaoSocial: 'Drogaria Sao Paulo',
    nomeFantasia: 'Drogaria Sao Paulo',
    cnpjCpf: '11.222.333/0001-44',
    nivelRisco: 'Risco II',
    situacaoEstabelecimento: 'Ativo',
    dataUltimaInspecaoInicio: '',
    dataUltimaInspecaoFim: '',
    dataProximaInspecao: '2026-10-10',
    dataValidadeAlvara: '2026-12-31',
    numeroAlvara: 'ALV-10',
    observacoesBaixa: '',
    competenciaFiscalizacao: 'Municipal',
    parecerProjetoArquitetonico: 'Sim',
    cnaeCodigo: '4771-7/01',
    cnaeDescricao: 'Comércio varejista de produtos farmacêuticos',
    endereco: { logradouro: 'Rua Principal', numero: '10', bairro: 'Centro', cep: '35169-000', municipio: 'Braúnas/MG' },
    contato: { telefone: '3332950000', email: 'drogaria@test.com' },
    situacaoAlvara: 'Válido'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nao renderiza quando isOpen e false ou estabelecimento e null', () => {
    const { container } = render(
      <RegistrarInspecaoModal
        isOpen={false}
        onClose={mockOnClose}
        estabelecimento={estMock}
        onConfirmInspecao={mockOnConfirmInspecao}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe informacoes do estabelecimento e indicador afetado', () => {
    render(
      <RegistrarInspecaoModal
        isOpen={true}
        onClose={mockOnClose}
        estabelecimento={estMock}
        onConfirmInspecao={mockOnConfirmInspecao}
      />
    );

    expect(screen.getByText('Drogaria Sao Paulo')).toBeInTheDocument();
    expect(screen.getByText(/11\.222\.333\/0001-44/)).toBeInTheDocument();
    expect(screen.getByText(/Indicador 14/)).toBeInTheDocument();
  });

  it('alterna fiscais selecionados ao clicar', async () => {
    render(
      <RegistrarInspecaoModal
        isOpen={true}
        onClose={mockOnClose}
        estabelecimento={estMock}
        onConfirmInspecao={mockOnConfirmInspecao}
      />
    );

    const fiscal2Btn = screen.getByText('Matheus Oliveira');
    fireEvent.click(fiscal2Btn);

    const confirmBtn = screen.getByText('Confirmar e Atualizar Meta');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnConfirmInspecao).toHaveBeenCalledWith(
        expect.objectContaining({
          fiscaisUltimaInspecao: ['Lucas Silveira', 'Matheus Oliveira']
        }),
        expect.anything()
      );
    });
  });

  it('submete inspecao renovando alvara', async () => {
    render(
      <RegistrarInspecaoModal
        isOpen={true}
        onClose={mockOnClose}
        estabelecimento={estMock}
        onConfirmInspecao={mockOnConfirmInspecao}
      />
    );

    const confirmBtn = screen.getByText('Confirmar e Atualizar Meta');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnConfirmInspecao).toHaveBeenCalledWith(
        expect.objectContaining({
          situacaoAlvara: 'Válido'
        }),
        expect.objectContaining({
          fiscais: ['Lucas Silveira'],
          renovarAlvara: true
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
