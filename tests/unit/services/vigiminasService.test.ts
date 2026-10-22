import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firestore / Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_db, collectionName, id) => ({ collectionName, id })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ id: 'geral', exercicioAtivo: { anoExercicio: 2026 } })
  }),
  getDocs: vi.fn().mockResolvedValue({
    empty: false,
    docs: [],
    forEach: vi.fn()
  }),
  getFirestore: vi.fn()
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null }))
}));

vi.mock('@/src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  handleFirestoreError: vi.fn(),
  OperationType: { WRITE: 'write' }
}));

vi.mock('@/src/lib/firestoreAuditMiddleware', () => ({
  createWithAudit: vi.fn().mockResolvedValue(undefined),
  updateWithAudit: vi.fn().mockResolvedValue(undefined),
  softDeleteWithAudit: vi.fn().mockResolvedValue(undefined),
  restoreWithAudit: vi.fn().mockResolvedValue(undefined)
}));

import {
  calcularIndicadores,
  calcularAlertasVapt,
  formatarDataBr,
  aplicarMascaraCnpjCpf,
  aplicarMascaraCep,
  aplicarMascaraTelefone,
  parsearPlanilhaEstabelecimentos,
  exportarEstabelecimentosFormatados
} from '@/src/services/vigiminasService';
import { Estabelecimento, InspecaoVapt } from '@/src/types/vigiminas';
import * as XLSX from 'xlsx';

describe('vigiminasService - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Utilitários de Formatação e Máscaras', () => {
    it('formatarDataBr converte data ISO YYYY-MM-DD para DD/MM/AAAA', () => {
      expect(formatarDataBr('2026-01-15')).toBe('15/01/2026');
      expect(formatarDataBr('')).toBe('-');
    });

    it('aplicarMascaraCnpjCpf formata CPF de 11 dígitos e CNPJ de 14 dígitos', () => {
      expect(aplicarMascaraCnpjCpf('12345678901')).toBe('123.456.789-01');
      expect(aplicarMascaraCnpjCpf('12345678000195')).toBe('12.345.678/0001-95');
    });

    it('aplicarMascaraCep formata CEP com 8 dígitos', () => {
      expect(aplicarMascaraCep('35189000')).toBe('35189-000');
    });

    it('aplicarMascaraTelefone formata telefone de 10 e 11 dígitos', () => {
      expect(aplicarMascaraTelefone('3332951200')).toBe('(33) 3295-1200');
      expect(aplicarMascaraTelefone('33998765432')).toBe('(33) 99876-5432');
    });
  });

  describe('Cálculo de Indicadores VigiMinas', () => {
    const estabelecimentosMock: Estabelecimento[] = [
      {
        id: 'est-1',
        razaoSocial: 'Padaria Alfa',
        nomeFantasia: 'Padaria Alfa',
        cnpjCpf: '11.111.111/0001-11',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Ativo',
        dataUltimaInspecaoInicio: '2026-02-10',
        dataUltimaInspecaoFim: '2026-02-10',
        dataProximaInspecao: '2027-02-10',
        dataValidadeAlvara: '2026-12-31',
        numeroAlvara: 'ALV-001',
        observacoesBaixa: '',
        competenciaFiscalizacao: 'Municipal',
        parecerProjetoArquitetonico: 'Sim',
        cnaeCodigo: '1091-1/01',
        cnaeDescricao: 'Fabricação de produtos de padaria',
        endereco: { logradouro: 'Rua A', numero: '1', bairro: 'Centro', cep: '35189-000', municipio: 'Braúnas/MG' },
        contato: { telefone: '3332950000', email: 'alfa@test.com' },
        situacaoAlvara: 'Válido'
      },
      {
        id: 'est-2',
        razaoSocial: 'Drogaria Beta',
        nomeFantasia: 'Drogaria Beta',
        cnpjCpf: '22.222.222/0001-22',
        nivelRisco: 'Risco II',
        situacaoEstabelecimento: 'Ativo',
        dataUltimaInspecaoInicio: '2025-11-20',
        dataUltimaInspecaoFim: '2025-11-20',
        dataProximaInspecao: '2026-11-20',
        dataValidadeAlvara: '2026-12-31',
        numeroAlvara: 'ALV-002',
        observacoesBaixa: '',
        competenciaFiscalizacao: 'Municipal',
        parecerProjetoArquitetonico: 'Sim',
        cnaeCodigo: '4771-7/01',
        cnaeDescricao: 'Drogaria',
        endereco: { logradouro: 'Rua B', numero: '2', bairro: 'Centro', cep: '35189-000', municipio: 'Braúnas/MG' },
        contato: { telefone: '3332950000', email: 'beta@test.com' },
        situacaoAlvara: 'Válido'
      },
      {
        id: 'est-3',
        razaoSocial: 'Clínica Gama',
        nomeFantasia: 'Clínica Gama',
        cnpjCpf: '33.333.333/0001-33',
        nivelRisco: 'Risco III',
        situacaoEstabelecimento: 'Ativo',
        dataUltimaInspecaoInicio: '2026-03-01',
        dataUltimaInspecaoFim: '2026-03-01',
        dataProximaInspecao: '2027-03-01',
        dataValidadeAlvara: '2026-12-31',
        numeroAlvara: 'ALV-003',
        observacoesBaixa: '',
        competenciaFiscalizacao: 'Municipal',
        parecerProjetoArquitetonico: 'Sim',
        cnaeCodigo: '8630-5/04',
        cnaeDescricao: 'Atividade odontológica',
        endereco: { logradouro: 'Rua C', numero: '3', bairro: 'Centro', cep: '35189-000', municipio: 'Braúnas/MG' },
        contato: { telefone: '3332950000', email: 'gama@test.com' },
        situacaoAlvara: 'Válido'
      },
      {
        id: 'est-4',
        razaoSocial: 'Mercado Delta (Inativo)',
        nomeFantasia: 'Mercado Delta',
        cnpjCpf: '44.444.444/0001-44',
        nivelRisco: 'Risco I',
        situacaoEstabelecimento: 'Inativo',
        dataUltimaInspecaoInicio: '',
        dataUltimaInspecaoFim: '',
        dataProximaInspecao: '',
        dataValidadeAlvara: '',
        numeroAlvara: '',
        observacoesBaixa: 'Baixado em 10/01/2026',
        competenciaFiscalizacao: 'Municipal',
        parecerProjetoArquitetonico: 'Não Aplicável',
        cnaeCodigo: '4711-3/02',
        cnaeDescricao: 'Mercado',
        endereco: { logradouro: 'Rua D', numero: '4', bairro: 'Centro', cep: '35189-000', municipio: 'Braúnas/MG' },
        contato: { telefone: '3332950000', email: 'delta@test.com' },
        situacaoAlvara: 'Vencido'
      }
    ];

    const vaptMock: InspecaoVapt[] = [
      {
        id: 'vapt-1',
        estabelecimentoId: 'est-1',
        nomeLocalTrabalho: 'Padaria Alfa',
        numeroRelatorioTermo: 'TERMO-2026/001',
        dataInspecao: '2026-02-15',
        fiscaisResponsaveis: ['Lucas Silveira'],
        principaisRiscosIdentificados: 'Nenhum',
        recomendacoesOrientacoes: 'Manter limpo',
        statusInspecao: 'Concluída'
      },
      {
        id: 'vapt-2',
        estabelecimentoId: 'est-2',
        nomeLocalTrabalho: 'Drogaria Beta',
        numeroRelatorioTermo: 'TERMO-2026/002',
        dataInspecao: '2026-03-10',
        fiscaisResponsaveis: ['Matheus Oliveira'],
        principaisRiscosIdentificados: 'Nenhum',
        recomendacoesOrientacoes: 'Ok',
        statusInspecao: 'Concluída'
      }
    ];

    it('calcula corretamente o total de cadastros e ativos/inativos', () => {
      const ind = calcularIndicadores(estabelecimentosMock, vaptMock, 2026);
      expect(ind.ind12TotalCadastrados).toBe(4);
      expect(ind.ind12Ativos).toBe(3);
      expect(ind.ind12Inativos).toBe(1);
    });

    it('calcula o percentual e metas para Risco I, II e III', () => {
      const ind = calcularIndicadores(estabelecimentosMock, vaptMock, 2026);
      expect(ind.ind13TotalRiscoI).toBe(1);
      expect(ind.ind13InspecionadosAno).toBe(1);
      expect(ind.ind13Percentual).toBe(100);
      expect(ind.ind13MetaAtingida).toBe(true);

      expect(ind.ind14TotalRiscoII).toBe(1);
      expect(ind.ind14InspecionadosAno).toBe(0);
      expect(ind.ind14Percentual).toBe(0);
      expect(ind.ind14MetaAtingida).toBe(false);

      expect(ind.ind15TotalRiscoIII).toBe(1);
      expect(ind.ind15InspecionadosAno).toBe(1);
      expect(ind.ind15Percentual).toBe(100);
      expect(ind.ind15MetaAtingida).toBe(true);
    });

    it('calcula o Indicador 11 de Saúde do Trabalhador (VAPT)', () => {
      const ind = calcularIndicadores(estabelecimentosMock, vaptMock, 2026);
      expect(ind.ind11TotalInspecoesAno).toBe(2);
      expect(ind.ind11MetaAtingida).toBe(true);
    });
  });

  describe('Cálculo de Alertas VAPT', () => {
    it('identifica vistorias vencidas e próximas de vencer', () => {
      const hoje = new Date('2026-04-10T00:00:00');
      const inspecoes: InspecaoVapt[] = [
        {
          id: 'vapt-vencida',
          estabelecimentoId: 'est-1',
          nomeLocalTrabalho: 'Local 1',
          dataInspecao: '2026-03-01',
          fiscaisResponsaveis: ['Lucas Silveira'],
          principaisRiscosIdentificados: 'Ruído',
          recomendacoesOrientacoes: 'Protetor auricular',
          numeroRelatorioTermo: 'TR-01',
          statusInspecao: 'Em Acompanhamento',
          dataRetornoPrevista: '2026-04-05'
        },
        {
          id: 'vapt-proxima',
          estabelecimentoId: 'est-2',
          nomeLocalTrabalho: 'Local 2',
          dataInspecao: '2026-03-12',
          fiscaisResponsaveis: ['Matheus Oliveira'],
          principaisRiscosIdentificados: 'Ergonomia',
          recomendacoesOrientacoes: 'Assentos adequados',
          numeroRelatorioTermo: 'TR-02',
          statusInspecao: 'Em Acompanhamento',
          dataRetornoPrevista: '2026-04-12'
        },
        {
          id: 'vapt-concluida',
          estabelecimentoId: 'est-3',
          nomeLocalTrabalho: 'Local 3',
          dataInspecao: '2026-03-01',
          fiscaisResponsaveis: ['Lucas Silveira'],
          principaisRiscosIdentificados: 'Nenhum',
          recomendacoesOrientacoes: 'Ok',
          numeroRelatorioTermo: 'TR-03',
          statusInspecao: 'Concluída',
          dataRetornoPrevista: '2026-04-01'
        }
      ];

      const alertas = calcularAlertasVapt(inspecoes, [], hoje);
      expect(alertas.totalAlertas).toBe(2);
      expect(alertas.totalVencidas).toBe(1);
      expect(alertas.totalProximasVencer).toBe(1);
      expect(alertas.alertas[0].tipoAlerta).toBe('vencida');
    });
  });

  describe('parsearPlanilhaEstabelecimentos', () => {
    it('converte linhas de uma planilha Excel em objetos Estabelecimento válidos', () => {
      const rawRows = [
        {
          'CNPJ_OU_CPF': '12.345.678/0001-90',
          'RAZAO_SOCIAL': 'Farmacia Teste',
          'CNAE_CODIGO': '4771-7/01',
          'NIVEL_RISCO': 'Risco I',
          'LOGRADOURO': 'Av. Principal',
          'NUMERO': '100'
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rawRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Test');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const res = parsearPlanilhaEstabelecimentos(buffer);
      expect(res.totalLinhas).toBe(1);
      expect(res.validos.length).toBe(1);
      expect(res.validos[0].razaoSocial).toBe('Farmacia Teste');
      expect(res.validos[0].cnpjCpf).toBe('12.345.678/0001-90');
    });

    it('normaliza situacao do alvara Não Possui (Irregular) a partir de planilha', () => {
      const rawRows = [
        {
          'CNPJ_OU_CPF': '99.888.777/0001-66',
          'RAZAO_SOCIAL': 'Oficina Irregular Sem Alvará',
          'CNAE_CODIGO': '4520-0/01',
          'NIVEL_RISCO': 'Risco II',
          'SITUACAO_ALVARA': 'Não Possui (Irregular)'
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rawRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Test');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const res = parsearPlanilhaEstabelecimentos(buffer);
      expect(res.validos.length).toBe(1);
      expect(res.validos[0].situacaoAlvara).toBe('Não Possui (Irregular)');
    });

    it('registra erros em linhas sem Razão Social ou documento', () => {
      const rawRows = [
        {
          'CNPJ_OU_CPF': '',
          'RAZAO_SOCIAL': '',
          'CNAE_CODIGO': ''
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rawRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Test');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const res = parsearPlanilhaEstabelecimentos(buffer);
      expect(res.validos.length).toBe(0);
      expect(res.erros.length).toBe(1);
      expect(res.erros[0].motivo).toContain('Razão Social');
    });
  });

  describe('exportarEstabelecimentosFormatados', () => {
    it('gera exportacao no formato CSV', async () => {
      const mockEsts: Estabelecimento[] = [
        {
          id: 'est-1',
          razaoSocial: 'Padaria Alfa',
          nomeFantasia: 'Padaria Alfa',
          cnpjCpf: '11.111.111/0001-11',
          nivelRisco: 'Risco I',
          situacaoEstabelecimento: 'Ativo',
          dataUltimaInspecaoInicio: '2026-01-01',
          dataUltimaInspecaoFim: '2026-01-01',
          dataProximaInspecao: '2027-01-01',
          dataValidadeAlvara: '2026-12-31',
          numeroAlvara: 'ALV-1',
          observacoesBaixa: '',
          competenciaFiscalizacao: 'Municipal',
          parecerProjetoArquitetonico: 'Sim',
          cnaeCodigo: '1091-1/01',
          cnaeDescricao: 'Padaria',
          endereco: { logradouro: 'Rua A', numero: '1', bairro: 'Centro', cep: '35189-000', municipio: 'Braúnas/MG' },
          contato: { telefone: '3332950000', email: 'alfa@test.com' },
          situacaoAlvara: 'Válido'
        }
      ];

      const clickMock = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: vi.fn(),
        style: {},
        click: clickMock
      } as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({}) as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({}) as any);

      const res = await exportarEstabelecimentosFormatados(mockEsts, {
        formato: 'csv',
        escopo: 'todos',
        registrarAuditoria: false
      });

      expect(res.sucesso).toBe(true);
      expect(res.totalExportados).toBe(1);
      expect(res.formato).toBe('csv');
    });
  });
});
