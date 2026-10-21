import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Fluxo 4 (Integração): Regras de Segurança Firestore (firestore.rules)', () => {
  let rulesContent: string;

  beforeAll(() => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    rulesContent = fs.readFileSync(rulesPath, 'utf8');
  });

  describe('Validação da Estrutura e Escopo Padrão', () => {
    it('carrega o arquivo firestore.rules e valida a versao do motor', () => {
      expect(rulesContent).toBeDefined();
      expect(rulesContent).toContain("rules_version = '2';");
      expect(rulesContent).toContain("service cloud.firestore");
    });

    it('aplica regra de negação padrão (deny all) para documentos não especificados', () => {
      expect(rulesContent).toContain("match /{document=**} {");
      expect(rulesContent).toContain("allow read, write: if false;");
    });

    it('define a função auxiliar de validação de ID (isValidId)', () => {
      expect(rulesContent).toContain("function isValidId(id)");
      expect(rulesContent).toContain("id is string && id.size() > 0 && id.size() <= 128");
    });
  });

  describe('Coleção de Estabelecimentos (/estabelecimentos/{estabelecimentoId})', () => {
    it('permite leitura pública e restringe criação/atualização com schema de risco', () => {
      expect(rulesContent).toContain("match /estabelecimentos/{estabelecimentoId}");
      expect(rulesContent).toContain("allow read: if true;");
      expect(rulesContent).toContain("allow create, update: if isValidId(estabelecimentoId)");
      expect(rulesContent).toContain("request.resource.data.razaoSocial is string");
      expect(rulesContent).toContain("request.resource.data.nivelRisco in ['Risco I', 'Risco II', 'Risco III']");
      expect(rulesContent).toContain("allow delete: if isValidId(estabelecimentoId);");
    });
  });

  describe('Coleção de Inspeções VAPT (/inspecoes_vapt/{inspecaoId})', () => {
    it('valida campos obrigatórios do relatório VAPT (estabelecimentoId e nomeLocalTrabalho)', () => {
      expect(rulesContent).toContain("match /inspecoes_vapt/{inspecaoId}");
      expect(rulesContent).toContain("allow read: if true;");
      expect(rulesContent).toContain("request.resource.data.estabelecimentoId is string");
      expect(rulesContent).toContain("request.resource.data.nomeLocalTrabalho is string");
    });
  });

  describe('Coleção de Logs de Auditoria (/logs_auditoria/{logId})', () => {
    it('garante a imutabilidade estrita dos logs de auditoria (allow update: if false)', () => {
      expect(rulesContent).toContain("match /logs_auditoria/{logId}");
      expect(rulesContent).toContain("allow read: if true;");
      expect(rulesContent).toContain("request.resource.data.recursoId is string");
      expect(rulesContent).toContain("request.resource.data.operacao is string");
      expect(rulesContent).toContain("request.resource.data.colecao is string");
      expect(rulesContent).toContain("allow update: if false;");
      expect(rulesContent).toContain("allow delete: if isValidId(logId);");
    });
  });

  describe('Coleção de Configurações Gerais (/configuracoes_sistema/{configId})', () => {
    it('impede a deleção de configurações gerais do sistema (allow delete: if false)', () => {
      expect(rulesContent).toContain("match /configuracoes_sistema/{configId}");
      expect(rulesContent).toContain("allow read: if true;");
      expect(rulesContent).toContain("request.resource.data.secretaria is map");
      expect(rulesContent).toContain("request.resource.data.exercicioAtivo is map");
      expect(rulesContent).toContain("allow delete: if false;");
    });
  });
});
