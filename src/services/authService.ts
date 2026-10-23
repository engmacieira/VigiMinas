import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Usuario, USUARIO_MASTER_SEED } from '../types/vigiminas';
import { createWithAudit, updateWithAudit, setActiveAuditUser } from '../lib/firestoreAuditMiddleware';
import { registrarLogAuditoria } from './vigiminasService';

const USUARIOS_COLLECTION = 'usuarios';
const LOCAL_STORAGE_USERS_KEY = 'vigiminas_braunas_usuarios_cache';
const LOCAL_STORAGE_SESSION_KEY = 'vigiminas_active_user';
const SALT = 'vigiminas_salt_braunas_2026';

/**
 * Calcula o hash SHA-256 defensivo com salt para proteção de senhas
 */
export async function hashPassword(senha: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${senha}:${SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Higieniza o objeto de usuário removendo senhas e hashes confidenciais do client state
 */
export function sanitizarUsuario(u: Usuario): Usuario {
  const copy = { ...u };
  delete copy.senhaHash;
  delete (copy as Record<string, unknown>).senha;
  return copy;
}

/**
 * Carrega a lista de usuários com persistência em Firestore e fallback em localStorage.
 * Garante a inicialização automática do Usuário Master caso a base esteja vazia.
 */
export async function getUsuarios(): Promise<Usuario[]> {
  let usuariosList: Usuario[] = [];

  try {
    const snap = await getDocs(collection(db, USUARIOS_COLLECTION));
    if (!snap.empty) {
      usuariosList = snap.docs.map(d => ({ ...(d.data() as Usuario), id: d.id }));
    }
  } catch (err) {
    console.warn('Erro ao consultar coleção usuarios no Firestore, usando cache local:', err);
    try {
      handleFirestoreError(err, OperationType.LIST, USUARIOS_COLLECTION);
    } catch {
      // continua para fallback
    }
  }

  // Mescla com cache local para garantir sincronização e persistência mesmo se offline
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (cached) {
      const localList: Usuario[] = JSON.parse(cached);
      const map = new Map<string, Usuario>();
      usuariosList.forEach(u => map.set(u.id, u));
      localList.forEach(u => {
        const existente = map.get(u.id);
        if (!existente || (u.updatedAt && (!existente.updatedAt || u.updatedAt >= existente.updatedAt))) {
          // Preserva senhaHash caso exista no documento do banco ou cache
          map.set(u.id, { ...existente, ...u, senhaHash: existente?.senhaHash || u.senhaHash });
        }
      });
      usuariosList = Array.from(map.values());
    }
  } catch (e) {
    console.error('Erro ao ler cache local de usuários:', e);
  }

  // SEED / PRIMEIRO ACESSO: Se ainda não existirem usuários, inicializa o Master
  if (usuariosList.length === 0) {
    usuariosList = [USUARIO_MASTER_SEED];
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usuariosList));
      // Tenta gravar o master no Firestore
      const masterDoc = doc(db, USUARIOS_COLLECTION, USUARIO_MASTER_SEED.id);
      await setDoc(masterDoc, USUARIO_MASTER_SEED);
    } catch (e) {
      console.error('Erro ao inicializar usuário master no Firestore:', e);
    }
  }

  return usuariosList;
}

/**
 * Salva a lista de usuários no cache local (sempre sanitizado sem senhas/hashes confidenciais)
 */
function salvarCacheUsuarios(usuarios: Usuario[]) {
  try {
    const sanitizados = usuarios.map(sanitizarUsuario);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(sanitizados));
  } catch (e) {
    console.error('Erro ao salvar cache de usuários:', e);
  }
}

/**
 * Realiza autenticação por Nome de Usuário e Senha
 */
export async function autenticarUsuario(username: string, senha: string): Promise<Usuario> {
  const usuarios = await getUsuarios();
  const termo = username.trim().toLowerCase();

  const usuario = usuarios.find(u => u.username.toLowerCase() === termo);
  if (!usuario) {
    await registrarLogAuditoria({
      recursoId: `auth-fail-${Date.now()}`,
      operacao: 'update',
      colecao: 'usuarios',
      tipoRegistro: 'Usuario',
      acao: 'Edição',
      usuario: username,
      identificadorEntidade: username,
      detalhes: `Tentativa de login malsucedida: Nome de usuário "${username}" não encontrado.`,
      fiscalResponsavel: 'Sistema de Autenticação',
      registroId: username
    });
    throw new Error('Nome de usuário não encontrado.');
  }

  if (!usuario.ativo) {
    await registrarLogAuditoria({
      recursoId: `auth-blocked-${Date.now()}`,
      operacao: 'update',
      colecao: 'usuarios',
      tipoRegistro: 'Usuario',
      acao: 'Edição',
      usuario: usuario.username,
      usuarioId: usuario.id,
      nomeUsuario: usuario.nomeCompleto,
      cargo: usuario.cargo,
      identificadorEntidade: usuario.username,
      detalhes: `Tentativa de login bloqueada: Usuário "${usuario.nomeCompleto}" está desativado no sistema.`,
      fiscalResponsavel: 'Sistema de Autenticação',
      registroId: usuario.id
    });
    throw new Error('Acesso bloqueado: Este usuário está desativado pelo administrador.');
  }

  // Validação de senha usando hash SHA-256
  const senhaCalculadaHash = await hashPassword(senha);
  let senhaValida = false;

  if (usuario.senhaHash) {
    senhaValida = (usuario.senhaHash === senhaCalculadaHash);
  } else if ((usuario as unknown as Record<string, unknown>).senha) {
    // Suporte a migração legado caso exista
    senhaValida = ((usuario as unknown as Record<string, unknown>).senha === senha);
    if (senhaValida) {
      usuario.senhaHash = senhaCalculadaHash;
      delete (usuario as unknown as Record<string, unknown>).senha;
    }
  }

  if (!senhaValida) {
    await registrarLogAuditoria({
      recursoId: `auth-invalid-${Date.now()}`,
      operacao: 'update',
      colecao: 'usuarios',
      tipoRegistro: 'Usuario',
      acao: 'Edição',
      usuario: usuario.username,
      usuarioId: usuario.id,
      nomeUsuario: usuario.nomeCompleto,
      cargo: usuario.cargo,
      identificadorEntidade: usuario.username,
      detalhes: `Tentativa de login com senha incorreta para o usuário "${usuario.nomeCompleto}".`,
      fiscalResponsavel: 'Sistema de Autenticação',
      registroId: usuario.id
    });
    throw new Error('Senha incorreta. Verifique suas credenciais.');
  }

  // Atualiza último acesso
  const timestamp = new Date().toISOString();
  const usuarioLogado: Usuario = {
    ...usuario,
    ultimoAcesso: timestamp
  };

  const index = usuarios.findIndex(u => u.id === usuario.id);
  if (index >= 0) {
    usuarios[index] = usuarioLogado;
    salvarCacheUsuarios(usuarios);
  }

  const usuarioSessao = sanitizarUsuario(usuarioLogado);
  salvarSessaoUsuario(usuarioSessao);

  try {
    const userDoc = doc(db, USUARIOS_COLLECTION, usuario.id);
    await updateDoc(userDoc, {
      ultimoAcesso: timestamp,
      senhaHash: usuarioLogado.senhaHash
    });
  } catch {
    // ignora se falhar gravação de timestamp
  }

  // Log de auditoria para login bem-sucedido
  await registrarLogAuditoria({
    recursoId: `auth-success-${Date.now()}`,
    operacao: 'update',
    colecao: 'usuarios',
    tipoRegistro: 'Usuario',
    acao: 'Edição',
    usuario: usuario.username,
    usuarioId: usuario.id,
    nomeUsuario: usuario.nomeCompleto,
    cargo: usuario.cargo,
    identificadorEntidade: usuario.username,
    detalhes: `Autenticação realizada com sucesso para o usuário "${usuario.nomeCompleto}" (${usuario.cargo} - Perfil: ${usuario.funcao}).`,
    fiscalResponsavel: usuario.nomeCompleto,
    registroId: usuario.id
  });

  return usuarioSessao;
}

/**
 * Salva o usuário logado na sessão ativa (sanitizando sem senhas/hashes confidenciais)
 */
export function salvarSessaoUsuario(usuario: Usuario | null) {
  if (usuario) {
    const usuarioSessao = sanitizarUsuario(usuario);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(usuarioSessao));
    setActiveAuditUser({
      id: usuarioSessao.id,
      username: usuarioSessao.username,
      nomeCompleto: usuarioSessao.nomeCompleto,
      cargo: usuarioSessao.cargo,
      email: usuarioSessao.email
    });
  } else {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    setActiveAuditUser(null);
  }
}

/**
 * Obtém a sessão ativa do usuário (sanitizada)
 */
export function getSessaoAtiva(): Usuario | null {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (!cached) return null;
    const user: Usuario = JSON.parse(cached);
    const usuarioSessao = sanitizarUsuario(user);
    setActiveAuditUser({
      id: usuarioSessao.id,
      username: usuarioSessao.username,
      nomeCompleto: usuarioSessao.nomeCompleto,
      cargo: usuarioSessao.cargo,
      email: usuarioSessao.email
    });
    return usuarioSessao;
  } catch {
    return null;
  }
}

/**
 * Valida se o usuário ativo possui perfil de Administrador Master (Defesa em Nível de Serviço)
 */
export function validarPermissaoMaster(): void {
  const sessao = getSessaoAtiva();
  if (sessao && sessao.funcao !== 'admin_master') {
    throw new Error('Acesso negado: Apenas o Administrador Master tem permissão para realizar esta ação.');
  }
}

/**
 * Cadastra um novo usuário no sistema (Exclusivo Administrador Master)
 */
export async function cadastrarNovoUsuario(
  dados: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'ultimoAcesso'>,
  auditContext?: { usuarioId?: string; nomeUsuario?: string; cargo?: string }
): Promise<Usuario> {
  validarPermissaoMaster();

  const usuarios = await getUsuarios();

  // Verifica unicidade de username e email
  const usernameExistente = usuarios.some(
    u => u.username.toLowerCase() === dados.username.trim().toLowerCase()
  );
  if (usernameExistente) {
    throw new Error(`O nome de usuário "${dados.username}" já está em uso.`);
  }

  const emailExistente = usuarios.some(
    u => u.email.toLowerCase() === dados.email.trim().toLowerCase()
  );
  if (emailExistente) {
    throw new Error(`O e-mail "${dados.email}" já está cadastrado para outro usuário.`);
  }

  const timestamp = new Date().toISOString();
  const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const rawSenha = (dados as { senha?: string }).senha || '22061993';
  const senhaHash = await hashPassword(rawSenha);

  const dadosLimpos = { ...dados };
  delete (dadosLimpos as { senha?: string }).senha;

  const novoUsuario: Usuario = {
    ...dadosLimpos,
    id,
    username: dados.username.trim(),
    nomeCompleto: dados.nomeCompleto.trim(),
    email: dados.email.trim().toLowerCase(),
    cargo: dados.cargo.trim(),
    senhaHash,
    ativo: dados.ativo !== undefined ? dados.ativo : true,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const usuarioSanitizado = sanitizarUsuario(novoUsuario);

  try {
    // Grava usuário no Firestore
    const userRef = doc(db, USUARIOS_COLLECTION, id);
    await setDoc(userRef, novoUsuario);

    await registrarLogAuditoria({
      recursoId: id,
      operacao: 'create',
      colecao: 'usuarios',
      tipoRegistro: 'Usuario',
      acao: 'Criação',
      usuario: auditContext?.nomeUsuario || 'Admin Master',
      usuarioId: auditContext?.usuarioId,
      nomeUsuario: auditContext?.nomeUsuario,
      cargo: auditContext?.cargo,
      identificadorEntidade: novoUsuario.username,
      detalhes: `Criação de novo usuário "${novoUsuario.nomeCompleto}" (${novoUsuario.username} - Função: ${novoUsuario.funcao}) efetuada pelo Administrador Master.`,
      fiscalResponsavel: auditContext?.nomeUsuario || 'Admin Master',
      registroId: id
    });
  } catch (err) {
    console.warn('Erro ao salvar novo usuário no Firestore:', err);
  }

  usuarios.push(novoUsuario);
  salvarCacheUsuarios(usuarios);

  return usuarioSanitizado;
}

/**
 * Edita dados de um usuário existente (Exclusivo Administrador Master)
 */
export async function editarUsuario(
  id: string,
  dados: Partial<Omit<Usuario, 'id' | 'createdAt'>>,
  auditContext?: { usuarioId?: string; nomeUsuario?: string; cargo?: string }
): Promise<Usuario> {
  validarPermissaoMaster();

  const usuarios = await getUsuarios();
  const index = usuarios.findIndex(u => u.id === id);
  if (index < 0) {
    throw new Error('Usuário não encontrado para edição.');
  }

  const usuarioAtual = usuarios[index];
  const timestamp = new Date().toISOString();

  if (dados.username && dados.username.toLowerCase() !== usuarioAtual.username.toLowerCase()) {
    const existe = usuarios.some(u => u.id !== id && u.username.toLowerCase() === dados.username!.toLowerCase());
    if (existe) {
      throw new Error(`O nome de usuário "${dados.username}" já está em uso.`);
    }
  }

  if (dados.ativo === false && usuarioAtual.funcao === 'admin_master') {
    const outrosMastersAtivos = usuarios.filter(u => u.id !== id && u.funcao === 'admin_master' && u.ativo);
    if (outrosMastersAtivos.length === 0) {
      throw new Error('Não é permitido desativar o único Administrador Master ativo do sistema.');
    }
  }

  const usuarioAtualizado: Usuario = {
    ...usuarioAtual,
    ...dados,
    updatedAt: timestamp
  };

  const usuarioSanitizado = sanitizarUsuario(usuarioAtualizado);

  try {
    const userRef = doc(db, USUARIOS_COLLECTION, id);
    await setDoc(userRef, usuarioAtualizado);

    await registrarLogAuditoria({
      recursoId: id,
      operacao: 'update',
      colecao: 'usuarios',
      tipoRegistro: 'Usuario',
      acao: 'Edição',
      usuario: auditContext?.nomeUsuario || 'Admin Master',
      usuarioId: auditContext?.usuarioId,
      nomeUsuario: auditContext?.nomeUsuario,
      cargo: auditContext?.cargo,
      identificadorEntidade: usuarioAtualizado.username,
      detalhes: `Edição cadastral / alteração de permissões do usuário "${usuarioAtualizado.nomeCompleto}" (${usuarioAtualizado.username} - Função: ${usuarioAtualizado.funcao}, Ativo: ${usuarioAtualizado.ativo}).`,
      fiscalResponsavel: auditContext?.nomeUsuario || 'Admin Master',
      registroId: id
    });
  } catch (err) {
    console.warn('Erro ao atualizar usuário no Firestore:', err);
  }

  usuarios[index] = usuarioAtualizado;
  salvarCacheUsuarios(usuarios);

  const sessao = getSessaoAtiva();
  if (sessao && sessao.id === id) {
    salvarSessaoUsuario(usuarioSanitizado);
  }

  return usuarioSanitizado;
}

/**
 * Redefine a senha de um usuário (Exclusivo Administrador Master)
 */
export async function redefinirSenhaUsuario(
  id: string,
  novaSenha: string,
  auditContext?: { usuarioId?: string; nomeUsuario?: string; cargo?: string }
): Promise<void> {
  validarPermissaoMaster();

  if (!novaSenha || novaSenha.trim().length < 4) {
    throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
  }

  const usuarios = await getUsuarios();
  const index = usuarios.findIndex(u => u.id === id);
  if (index < 0) {
    throw new Error('Usuário não encontrado.');
  }

  const usuario = usuarios[index];
  const timestamp = new Date().toISOString();

  const novaSenhaHash = await hashPassword(novaSenha.trim());
  usuario.senhaHash = novaSenhaHash;
  delete (usuario as unknown as Record<string, unknown>).senha;
  usuario.updatedAt = timestamp;

  try {
    const userRef = doc(db, USUARIOS_COLLECTION, id);
    await updateDoc(userRef, { senhaHash: novaSenhaHash, updatedAt: timestamp });

    await registrarLogAuditoria({
      recursoId: id,
      operacao: 'update',
      colecao: 'usuarios',
      tipoRegistro: 'Usuario',
      acao: 'Edição',
      usuario: auditContext?.nomeUsuario || 'Admin Master',
      usuarioId: auditContext?.usuarioId,
      nomeUsuario: auditContext?.nomeUsuario,
      cargo: auditContext?.cargo,
      identificadorEntidade: usuario.username,
      detalhes: `Redefinição de senha do usuário "${usuario.nomeCompleto}" (@${usuario.username}) realizada com sucesso pelo Administrador Master.`,
      fiscalResponsavel: auditContext?.nomeUsuario || 'Admin Master',
      registroId: id
    });
  } catch (err) {
    console.warn('Erro ao salvar redefinição de senha no Firestore:', err);
  }

  usuarios[index] = usuario;
  salvarCacheUsuarios(usuarios);

  const sessao = getSessaoAtiva();
  if (sessao && sessao.id === id) {
    salvarSessaoUsuario(sanitizarUsuario(usuario));
  }
}

/**
 * Atualiza o perfil próprio do usuário logado (Meu Perfil)
 */
export async function atualizarMeuPerfil(
  usuarioId: string,
  dados: { nomeCompleto: string; email: string; cargo: string },
  senhaAtual?: string,
  novaSenha?: string
): Promise<Usuario> {
  const usuarios = await getUsuarios();
  const index = usuarios.findIndex(u => u.id === usuarioId);
  if (index < 0) {
    throw new Error('Usuário da sessão não localizado.');
  }

  const usuario = usuarios[index];
  const timestamp = new Date().toISOString();

  // Se solicitou alteração de senha, valida a senha atual
  if (novaSenha && novaSenha.trim()) {
    if (!senhaAtual) {
      throw new Error('Para alterar a senha, informe sua senha atual.');
    }
    const hashAtualCalculado = await hashPassword(senhaAtual);
    let senhaValida = false;
    if (usuario.senhaHash) {
      senhaValida = (usuario.senhaHash === hashAtualCalculado);
    } else if ((usuario as unknown as Record<string, unknown>).senha) {
      senhaValida = ((usuario as unknown as Record<string, unknown>).senha === senhaAtual);
    }

    if (!senhaValida) {
      throw new Error('Senha atual incorreta.');
    }
    if (novaSenha.trim().length < 4) {
      throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
    }

    usuario.senhaHash = await hashPassword(novaSenha.trim());
    delete (usuario as unknown as Record<string, unknown>).senha;
  }

  usuario.nomeCompleto = dados.nomeCompleto.trim();
  usuario.email = dados.email.trim().toLowerCase();
  usuario.cargo = dados.cargo.trim();
  usuario.updatedAt = timestamp;

  const usuarioSanitizado = sanitizarUsuario(usuario);

  try {
    const userRef = doc(db, USUARIOS_COLLECTION, usuarioId);
    await setDoc(userRef, usuario);

    await registrarLogAuditoria({
      recursoId: usuarioId,
      operacao: 'update',
      colecao: 'usuarios',
      tipoRegistro: 'Usuario',
      acao: 'Edição',
      usuario: usuario.username,
      usuarioId: usuario.id,
      nomeUsuario: usuario.nomeCompleto,
      cargo: usuario.cargo,
      identificadorEntidade: usuario.username,
      detalhes: `Atualização de perfil próprio ${novaSenha ? 'com alteração de senha ' : ''}realizada pelo usuário "${usuario.nomeCompleto}".`,
      fiscalResponsavel: usuario.nomeCompleto,
      registroId: usuarioId
    });
  } catch (err) {
    console.warn('Erro ao atualizar Meu Perfil no Firestore:', err);
  }

  usuarios[index] = usuario;
  salvarCacheUsuarios(usuarios);
  salvarSessaoUsuario(usuarioSanitizado);

  return usuarioSanitizado;
}
