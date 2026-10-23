import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getUsuarios, 
  autenticarUsuario, 
  cadastrarNovoUsuario, 
  editarUsuario, 
  redefinirSenhaUsuario, 
  atualizarMeuPerfil 
} from '../../../src/services/authService';
import { USUARIO_MASTER_SEED } from '../../../src/types/vigiminas';

describe('authService - Autenticação e Gestão de Usuários', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('semeia automaticamente o usuário master se a base estiver vazia', async () => {
    const lista = await getUsuarios();
    expect(lista.length).toBeGreaterThanOrEqual(1);

    const master = lista.find(u => u.username === 'Matheus');
    expect(master).toBeDefined();
    expect(master?.nomeCompleto).toBe('Matheus Henrique Macieira');
    expect(master?.cargo).toBe('Coordenador');
    expect(master?.funcao).toBe('admin_master');
    expect(master?.email).toBe('matheus_macieira@hotmail.com');
    expect(master?.ativo).toBe(true);
  });

  it('autentica com sucesso com as credenciais do usuário master (22061993)', async () => {
    const usuarioLogado = await autenticarUsuario('Matheus', '22061993');
    expect(usuarioLogado).toBeDefined();
    expect(usuarioLogado.username).toBe('Matheus');
    expect(usuarioLogado.funcao).toBe('admin_master');
    expect(usuarioLogado.senha).toBeUndefined(); // Senha não deve ser exposta na sessão
  });

  it('rejeita autenticação com senha incorreta', async () => {
    await expect(autenticarUsuario('Matheus', 'senhaErrada123')).rejects.toThrow(
      'Senha incorreta.'
    );
  });

  it('rejeita autenticação com usuário inexistente', async () => {
    await expect(autenticarUsuario('usuarioInexistente99', 'qualquerSenha')).rejects.toThrow(
      'Nome de usuário não encontrado.'
    );
  });

  it('permite cadastrar um novo usuário e autenticar com ele', async () => {
    const novo = await cadastrarNovoUsuario({
      username: 'lucas_fiscal',
      nomeCompleto: 'Lucas Silveira',
      cargo: 'Fiscal Sanitário Municipal',
      funcao: 'fiscal_tecnico',
      email: 'lucas@braunas.mg.gov.br',
      senha: 'minhaSenhaSegura',
      ativo: true
    });

    expect(novo.id).toBeDefined();
    expect(novo.username).toBe('lucas_fiscal');

    const logado = await autenticarUsuario('lucas_fiscal', 'minhaSenhaSegura');
    expect(logado.nomeCompleto).toBe('Lucas Silveira');
    expect(logado.funcao).toBe('fiscal_tecnico');
  });

  it('impede cadastrar usuários com o mesmo username duplicado', async () => {
    await expect(cadastrarNovoUsuario({
      username: 'Matheus',
      nomeCompleto: 'Outro Matheus',
      cargo: 'Auxiliar',
      funcao: 'digitador',
      email: 'outro@braunas.mg.gov.br',
      senha: 'senha123456',
      ativo: true
    })).rejects.toThrow('já está em uso');
  });

  it('permite ao Administrador Master redefinir a senha de outro usuário', async () => {
    const novo = await cadastrarNovoUsuario({
      username: 'fiscal_teste',
      nomeCompleto: 'Fiscal Teste',
      cargo: 'Fiscal Sanitário',
      funcao: 'fiscal_tecnico',
      email: 'fiscal@braunas.mg.gov.br',
      senha: 'senhaAntiga123',
      ativo: true
    });

    await redefinirSenhaUsuario(novo.id, 'senhaNova456789');

    // A senha antiga não funciona mais
    await expect(autenticarUsuario('fiscal_teste', 'senhaAntiga123')).rejects.toThrow();

    // A nova senha funciona
    const logado = await autenticarUsuario('fiscal_teste', 'senhaNova456789');
    expect(logado.username).toBe('fiscal_teste');
  });

  it('permite atualizar dados do usuário em edição', async () => {
    const master = (await getUsuarios()).find(u => u.username === 'Matheus')!;
    const atualizado = await editarUsuario(master.id, {
      cargo: 'Coordenador Geral da VISA'
    });

    expect(atualizado.cargo).toBe('Coordenador Geral da VISA');
  });

  it('permite atualizar dados do próprio perfil e alterar a senha mediante senha atual', async () => {
    const master = (await getUsuarios()).find(u => u.username === 'Matheus')!;
    
    // Atualização com senha atual incorreta deve falhar
    await expect(atualizarMeuPerfil(master.id, {
      nomeCompleto: 'Matheus H. Macieira',
      email: 'matheus_macieira@hotmail.com',
      cargo: 'Coordenador Master'
    }, 'senhaErrada', 'novaSenha999')).rejects.toThrow('Senha atual incorreta.');

    // Atualização com senha atual correta
    const atualizado = await atualizarMeuPerfil(master.id, {
      nomeCompleto: 'Matheus H. Macieira',
      email: 'matheus_macieira@hotmail.com',
      cargo: 'Coordenador Master'
    }, '22061993', 'novaSenha2026');

    expect(atualizado.nomeCompleto).toBe('Matheus H. Macieira');

    // Agora autentica com a nova senha
    const logado = await autenticarUsuario('Matheus', 'novaSenha2026');
    expect(logado).toBeDefined();
  });
});
