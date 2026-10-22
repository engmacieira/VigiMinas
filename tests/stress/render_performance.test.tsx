import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  testConnection: vi.fn(),
  handleFirestoreError: vi.fn()
}));

vi.mock('@/src/services/vigiminasService', () => ({
  fetchEstabelecimentos: vi.fn(async () => []),
  fetchInspecoesVapt: vi.fn(async () => []),
  fetchLogsAuditoria: vi.fn(async () => []),
  fetchConfiguracaoSistema: vi.fn(async () => ({
    id: 'geral',
    secretaria: { nomeOrgao: 'SMS Braúnas' },
    fiscais: [{ id: 'f1', nome: 'Lucas Silveira', ativo: true }],
    exercicioAtivo: { anoExercicio: 2026, metaInd11Vapt: 2, metaInd13RiscoI: 15, metaInd14RiscoII: 90, metaInd15RiscoIII: 100 },
    exerciciosHistorico: [],
    bancoInicializado: true
  })),
  saveEstabelecimento: vi.fn(),
  deleteEstabelecimento: vi.fn(),
  restoreEstabelecimento: vi.fn(),
  saveInspecaoVapt: vi.fn(),
  deleteInspecaoVapt: vi.fn(),
  restoreInspecaoVapt: vi.fn(),
  saveConfiguracaoSistema: vi.fn(),
  calcularIndicadores: vi.fn().mockReturnValue({
    anoReferencia: 2026,
    ind12TotalCadastrados: 1000,
    ind12Ativos: 900,
    ind12Inativos: 100,
    ind13TotalRiscoI: 300,
    ind13InspecionadosAno: 150,
    ind13Percentual: 50,
    ind13MetaAtingida: true,
    ind14TotalRiscoII: 300,
    ind14InspecionadosAno: 270,
    ind14Percentual: 90,
    ind14MetaAtingida: true,
    ind15TotalRiscoIII: 300,
    ind15InspecionadosAno: 300,
    ind15Percentual: 100,
    ind15MetaAtingida: true,
    ind11TotalInspecoesAno: 50,
    ind11MetaAtingida: true
  }),
  calcularAlertasVapt: vi.fn().mockReturnValue({ totalAlertas: 0, totalVencidas: 0, totalProximasVencer: 0, alertas: [] }),
  exportarPlanilhaVigiMinas: vi.fn(),
  formatarDataBr: (d: string) => d || '-'
}));

import { VigiMinasProvider } from '@/src/contexts/VigiMinasContext';
import { EstabelecimentosList } from '@/src/components/EstabelecimentosList';
import { DashboardMetas } from '@/src/components/DashboardMetas';
import { Estabelecimento, VigiMinasIndicadores } from '@/src/types/vigiminas';

function gerarEstabelecimentosSinteticos(quantidade: number): Estabelecimento[] {
  const niveis: ('Risco I' | 'Risco II' | 'Risco III')[] = ['Risco I', 'Risco II', 'Risco III'];
  const lista: Estabelecimento[] = [];

  for (let i = 0; i < quantidade; i++) {
    lista.push({
      id: `est-stress-${i}`,
      razaoSocial: `Empresa Sintetica ${i} LTDA`,
      nomeFantasia: `Fantasia ${i}`,
      cnpjCpf: `${String(i).padStart(14, '0')}`,
      cnaeCodigo: '4711-3/02',
      cnaeDescricao: `Atividade Sintetica Comercial ${i}`,
      nivelRisco: niveis[i % 3],
      situacaoEstabelecimento: i % 10 === 0 ? 'Inativo' : 'Ativo',
      situacaoAlvara: 'Válido',
      dataUltimaInspecaoInicio: '2026-01-10',
      dataUltimaInspecaoFim: '2026-01-10',
      dataProximaInspecao: '2027-01-10',
      dataValidadeAlvara: '2026-12-31',
      numeroAlvara: `ALV-${i}`,
      observacoesBaixa: '',
      competenciaFiscalizacao: 'Municipal',
      parecerProjetoArquitetonico: 'Sim',
      endereco: {
        logradouro: `Rua Sintetica ${i}`,
        numero: `${i}`,
        bairro: `Bairro ${i % 10}`,
        cep: '35189-000',
        municipio: 'Braúnas/MG'
      },
      contato: {
        telefone: '(33) 3295-0000',
        email: `empresa${i}@test.com`
      }
    });
  }

  return lista;
}

describe('Testes de Estresse: Desempenho de Renderização com Carga Massiva', () => {
  it('renderiza EstabelecimentosList com 1.000 registros sinteticos sem falha', { timeout: 15000 }, () => {
    const dados1k = gerarEstabelecimentosSinteticos(1000);

    const inicio = performance.now();
    render(
      <VigiMinasProvider>
        <EstabelecimentosList
          estabelecimentos={dados1k}
          onNovoEstabelecimento={() => {}}
          onEditarEstabelecimento={() => {}}
          onExcluirEstabelecimento={() => {}}
          onRegistrarInspecaoRapida={() => {}}
          onCriarVaptVinculada={() => {}}
          onExportExcel={() => {}}
          onImportarPlanilha={() => {}}
        />
      </VigiMinasProvider>
    );
    const duracao = performance.now() - inicio;

    expect(duracao).toBeGreaterThan(0);
    expect(duracao).toBeLessThan(15000);
  });

  it('processa e renderiza DashboardMetas com 1.000 registros sinteticos', { timeout: 15000 }, () => {
    const dados1k = gerarEstabelecimentosSinteticos(1000);
    const indicadoresMock: VigiMinasIndicadores = {
      anoReferencia: 2026,
      ind12TotalCadastrados: 1000,
      ind12Ativos: 900,
      ind12Inativos: 100,
      ind13TotalRiscoI: 300,
      ind13InspecionadosAno: 150,
      ind13Percentual: 50,
      ind13MetaAtingida: true,
      ind14TotalRiscoII: 300,
      ind14InspecionadosAno: 270,
      ind14Percentual: 90,
      ind14MetaAtingida: true,
      ind15TotalRiscoIII: 300,
      ind15InspecionadosAno: 300,
      ind15Percentual: 100,
      ind15MetaAtingida: true,
      ind11TotalInspecoesAno: 50,
      ind11MetaAtingida: true
    };

    const inicio = performance.now();
    render(
      <VigiMinasProvider>
        <DashboardMetas
          indicadores={indicadoresMock}
          estabelecimentos={dados1k}
          onExportExcel={() => {}}
          onOpenQuickInspecao={() => {}}
          onGoToEstabelecimentos={() => {}}
          onGoToVapt={() => {}}
        />
      </VigiMinasProvider>
    );
    const duracao = performance.now() - inicio;

    expect(duracao).toBeGreaterThan(0);
    expect(duracao).toBeLessThan(15000);
  });
});
