import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  testConnection: vi.fn(),
  handleFirestoreError: vi.fn()
}));

let mockEstsDB: any[] = [];

vi.mock('@/src/services/vigiminasService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/services/vigiminasService')>();
  return {
    ...actual,
    fetchEstabelecimentos: vi.fn(async () => [...mockEstsDB]),
    fetchInspecoesVapt: vi.fn(async () => []),
    fetchLogsAuditoria: vi.fn(async () => []),
    fetchConfiguracaoSistema: vi.fn(async () => ({
      id: 'geral',
      secretaria: { nomeOrgao: 'Secretaria de Saude Braunas', municipio: 'Braunas', uf: 'MG' },
      fiscais: [{ id: 'f1', nome: 'Lucas Silveira', ativo: true, cargo: 'Fiscal' }],
      exercicioAtivo: { anoExercicio: 2026, metaInd11Vapt: 2, metaInd13RiscoI: 15, metaInd14RiscoII: 90, metaInd15RiscoIII: 100 },
      exerciciosHistorico: [],
      bancoInicializado: true
    })),
    saveEstabelecimento: vi.fn(async (est: any) => {
      const idx = mockEstsDB.findIndex(e => e.id === est.id);
      if (idx >= 0) mockEstsDB[idx] = est;
      else mockEstsDB.push(est);
    }),
    importarEstabelecimentosEmLote: vi.fn(async (lista: any[]) => {
      let importados = 0;
      for (const item of lista) {
        mockEstsDB.push(item);
        importados++;
      }
      return { importados, atualizados: 0, falhas: 0 };
    })
  };
});

import { VigiMinasProvider } from '@/src/contexts/VigiMinasContext';
import { ImportarPlanilhaModal } from '@/src/components/ImportarPlanilhaModal';
import { EstabelecimentosList } from '@/src/components/EstabelecimentosList';
import { useVigiMinas } from '@/src/contexts/VigiMinasContext';

const TestComponent = () => {
  const { estabelecimentos } = useVigiMinas();

  return (
    <div>
      <ImportarPlanilhaModal isOpen={true} onClose={() => {}} />
      <EstabelecimentosList
        estabelecimentos={estabelecimentos}
        onNovoEstabelecimento={() => {}}
        onEditarEstabelecimento={() => {}}
        onExcluirEstabelecimento={() => {}}
        onRegistrarInspecaoRapida={() => {}}
        onCriarVaptVinculada={() => {}}
        onExportExcel={() => {}}
        onImportarPlanilha={() => {}}
      />
    </div>
  );
};

describe('Fluxo 3 (Integração): Importação em Lote via Planilha e Listagem Atualizada', () => {
  beforeEach(() => {
    mockEstsDB = [];
    vi.clearAllMocks();
  });

  it('processa planilha excel, realiza importacao em lote e atualiza EstabelecimentosList', async () => {
    render(
      <VigiMinasProvider>
        <TestComponent />
      </VigiMinasProvider>
    );

    // Cria planilha mock em memoria com 2 estabelecimentos de teste
    const rawRows = [
      {
        'CNPJ_OU_CPF': '55.666.777/0001-88',
        'RAZAO_SOCIAL': 'Supermercado Lote 1 LTDA',
        'CNAE_CODIGO': '4711-3/02',
        'NIVEL_RISCO': 'Risco II',
        'LOGRADOURO': 'Rua Lote 1'
      },
      {
        'CNPJ_OU_CPF': '99.888.777/0001-11',
        'RAZAO_SOCIAL': 'Laboratorio Lote 2 LTDA',
        'CNAE_CODIGO': '8640-2/02',
        'NIVEL_RISCO': 'Risco III',
        'LOGRADOURO': 'Rua Lote 2'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rawRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Planilha1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const file = new File([buffer], 'lote.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Simula selecao do arquivo no input
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByText('Supermercado Lote 1 LTDA')).toBeInTheDocument();
      expect(screen.getByText('Laboratorio Lote 2 LTDA')).toBeInTheDocument();
    });

    // Clica no botao de confirmar importacao em lote
    const confirmBtn = screen.getByRole('button', { name: /Confirmar Importação/i });
    confirmBtn.click();

    await waitFor(() => {
      expect(screen.getByText('Supermercado Lote 1 LTDA')).toBeInTheDocument();
      expect(screen.getByText('Laboratorio Lote 2 LTDA')).toBeInTheDocument();
      expect(screen.getByText('55.666.777/0001-88')).toBeInTheDocument();
    });
  });
});
