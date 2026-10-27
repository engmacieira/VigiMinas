import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RelatoriosPage } from '../../../src/pages/RelatoriosPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../src/contexts/VigiMinasContext', () => ({
  useVigiMinas: () => ({
    indicadores: {
      anoReferencia: 2026,
    },
    configuracao: {
      secretaria: {
        municipio: 'Braúnas',
        uf: 'MG',
        nomeOrgao: 'Secretaria Municipal de Saúde',
      },
      exercicioAtivo: {
        anoExercicio: 2026,
      },
    },
  }),
}));

describe('RelatoriosPage (Hub de Relatórios - US-01)', () => {
  it('renderiza o cabeçalho institucional do VigiMinas e título da página', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Central de Relatórios')).toBeInTheDocument();
    expect(screen.getByText(/VigiMinas • SES-MG/i)).toBeInTheDocument();
    expect(screen.getByText(/Exercício 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Braúnas\/MG/i)).toBeInTheDocument();
  });

  it('renderiza as três seções obrigatórias do catálogo', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Relatórios Oficiais e Consolidados')).toBeInTheDocument();
    expect(screen.getByText('Indicadores do Programa VigiMinas (SES-MG)')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Estabelecimentos e Cadastros')).toBeInTheDocument();
  });

  it('renderiza o Relatório Oficial VigiMinas como Disponível e navega para /relatorio-oficial ao clicar', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Relatório Oficial VigiMinas')).toBeInTheDocument();
    const botoesAcessar = screen.getAllByRole('button', { name: /Acessar Relatório/i });
    expect(botoesAcessar[0]).not.toBeDisabled();

    fireEvent.click(botoesAcessar[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/relatorio-oficial');
  });

  it('renderiza o Relatório do Indicador 11 (VAPT) como Disponível e navega para /relatorios/indicador-11', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Relatório Indicador 11/i)).toBeInTheDocument();
    const badgesDisponivel = screen.getAllByText('Disponível');
    expect(badgesDisponivel.length).toBe(8); // Oficial + Indicador 11 + 12 + 13 + 14 + 15 + Empresas Consolidadas + Ficha Individual

    const botoesAcessar = screen.getAllByRole('button', { name: /Acessar Relatório/i });
    expect(botoesAcessar.length).toBe(8);

    fireEvent.click(botoesAcessar[1]);
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios/indicador-11');
  });

  it('renderiza o Relatório do Indicador 12 (VISA) como Disponível e navega para /relatorios/indicador-12', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Relatório Indicador 12/i)).toBeInTheDocument();
    const badgesDisponivel = screen.getAllByText('Disponível');
    expect(badgesDisponivel.length).toBe(8);

    const botoesAcessar = screen.getAllByRole('button', { name: /Acessar Relatório/i });
    expect(botoesAcessar.length).toBe(8);

    fireEvent.click(botoesAcessar[2]);
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios/indicador-12');
  });

  it('renderiza o Relatório do Indicador 13 (Risco I) como Disponível e navega para /relatorios/indicador-13', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Relatório Indicador 13/i)).toBeInTheDocument();
    const badgesDisponivel = screen.getAllByText('Disponível');
    expect(badgesDisponivel.length).toBe(8);

    const botoesAcessar = screen.getAllByRole('button', { name: /Acessar Relatório/i });
    expect(botoesAcessar.length).toBe(8);

    fireEvent.click(botoesAcessar[3]);
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios/indicador-13');
  });

  it('renderiza o Relatório do Indicador 14 (Risco II) como Disponível e navega para /relatorios/indicador-14', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Relatório Indicador 14/i)).toBeInTheDocument();
    const badgesDisponivel = screen.getAllByText('Disponível');
    expect(badgesDisponivel.length).toBe(8);

    const botoesAcessar = screen.getAllByRole('button', { name: /Acessar Relatório/i });
    expect(botoesAcessar.length).toBe(8);

    fireEvent.click(botoesAcessar[4]);
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios/indicador-14');
  });

  it('renderiza o Relatório do Indicador 15 (Alto Risco III) como Disponível e navega para /relatorios/indicador-15', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Relatório Indicador 15/i)).toBeInTheDocument();
    const badgesDisponivel = screen.getAllByText('Disponível');
    expect(badgesDisponivel.length).toBe(8);

    const botoesAcessar = screen.getAllByRole('button', { name: /Acessar Relatório/i });
    expect(botoesAcessar.length).toBe(8);

    fireEvent.click(botoesAcessar[5]);
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios/indicador-15');
  });

  it('renderiza o Relatório de Empresas Cadastradas Consolidadas como Disponível e navega para /relatorios/empresas-consolidadas', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Empresas Cadastradas Consolidadas')).toBeInTheDocument();
    const badgesDisponivel = screen.getAllByText('Disponível');
    expect(badgesDisponivel.length).toBe(8);

    const botoesAcessar = screen.getAllByRole('button', { name: /Acessar Relatório/i });
    expect(botoesAcessar.length).toBe(8);

    fireEvent.click(botoesAcessar[6]);
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios/empresas-consolidadas');
  });

  it('renderiza o Relatório de Ficha Individual da Empresa como Disponível e navega para /relatorios/ficha-empresa', () => {
    render(
      <MemoryRouter>
        <RelatoriosPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Ficha Individual da Empresa')).toBeInTheDocument();
    const badgesDisponivel = screen.getAllByText('Disponível');
    expect(badgesDisponivel.length).toBe(8);

    const botoesAcessar = screen.getAllByRole('button', { name: /Acessar Relatório/i });
    expect(botoesAcessar.length).toBe(8);

    fireEvent.click(botoesAcessar[7]);
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios/ficha-empresa');

    // Verifica que todo o catálogo está 100% disponível (0 relatórios em desenvolvimento)
    expect(screen.queryByText('Em breve')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Em desenvolvimento/i })).not.toBeInTheDocument();
  });
});
