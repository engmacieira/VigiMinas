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

    it('define as funções auxiliares de autenticação e validação de permissões', () => {
      expect(rulesContent).toContain("function isAuthenticated()");
      expect(rulesContent).toContain("function isValidId(id)");
      expect(rulesContent).toContain("function isAdminMaster()");
      expect(rulesContent).toContain("function isOwner(usuarioId)");
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
    it('garante a imutabilidade estrita e proibição de exclusão dos logs (append-only)', () => {
      expect(rulesContent).toContain("match /logs_auditoria/{logId}");
      expect(rulesContent).toContain("allow read: if isAuthenticated();");
      expect(rulesContent).toContain("request.resource.data.recursoId is string");
      expect(rulesContent).toContain("request.resource.data.operacao is string");
      expect(rulesContent).toContain("request.resource.data.colecao is string");
      expect(rulesContent).toContain("allow update: if false;");
      expect(rulesContent).toContain("allow delete: if false;");
    });

    it('valida se usuarioId no documento coincide com o UID autenticado', () => {
      expect(rulesContent).toContain("(!('usuarioId' in request.resource.data) || request.resource.data.usuarioId == request.auth.uid)");
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

  describe('Coleção de Usuários (/usuarios/{usuarioId}) - Proteção e RBAC', () => {
    it('restringe leitura a usuários autenticados (próprio usuário ou master)', () => {
      expect(rulesContent).toContain("match /usuarios/{usuarioId}");
      expect(rulesContent).toContain("allow read: if isAuthenticated() && (isOwner(usuarioId) || isAdminMaster());");
    });

    it('restringe criação e exclusão exclusivamente ao Administrador Master', () => {
      expect(rulesContent).toContain("allow create: if isAuthenticated() && isAdminMaster()");
      expect(rulesContent).toContain("allow delete: if isAuthenticated() && isAdminMaster() && isValidId(usuarioId);");
    });

    it('impede auto-atribuição de cargos ou privilégios master por usuários comuns em update', () => {
      expect(rulesContent).toContain("request.resource.data.funcao == resource.data.funcao");
      expect(rulesContent).toContain("request.resource.data.ativo == resource.data.ativo");
    });
  });
});
