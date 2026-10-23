import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Usuario, USUARIO_MASTER_SEED } from '../types/vigiminas';
import { createWithAudit, updateWithAudit, setActiveAuditUser } from '../lib/firestoreAuditMiddleware';

const USUARIOS_COLLECTION = 'usuarios';
const LOCAL_STORAGE_USERS_KEY = 'vigiminas_braunas_usuarios_cache';
const LOCAL_STORAGE_SESSION_KEY = 'vigiminas_active_user';

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
          map.set(u.id, u);
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
 * Salva a lista de usuários no cache local
 */
function salvarCacheUsuarios(usuarios: Usuario[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usuarios));
  } catch (e) {
    console.error('Erro ao salvar cache de usuários:', e);
  }
}

/**
 * Realiza autenticação por Nome de Usuário e Senha
 */
export async function autenticarUsuario(username: string, senha: string):Promise<Usuario> {
  const usuarios = await getUsuarios();
  const termo = username.trim().toLowerCase();

  const usuario = usuarios.find(u => u.username.toLowerCase() === termo);
  if (!usuario) {
    throw new Error('Nome de usuário não encontrado.');
  }

  if (!usuario.ativo) {
    throw new Error('Acesso bloqueado: Este usuário está desativado pelo administrador.');
  }

  // Validação de senha
  if (usuario.senha && usuario.senha !== senha) {
    throw new Error('Senha incorreta. Verifique suas credenciais.');
  }

  // Atualiza último acesso
  const timestamp = new Date().toISOString();
  const usuarioLogado: Usuario = {
    ...usuario,
    ultimoAcesso: timestamp
  };

  // Atualiza lista em banco e cache local com senha preservada
  const index = usuarios.findIndex(u => u.id === usuario.id);
  if (index >= 0) {
    usuarios[index] = usuarioLogado;
    salvarCacheUsuarios(usuarios);
  }

  // Sessão não armazena a senha
  const { senha: _, ...usuarioSessao } = usuarioLogado;
  salvarSessaoUsuario(usuarioSessao as Usuario);

  try {
    const userDoc = doc(db, USUARIOS_COLLECTION, usuario.id);
    await updateDoc(userDoc, { ultimoAcesso: timestamp });
  } catch {
    // ignora se falhar
  }

  return usuarioSessao as Usuario;
}

/**
 * Salva o usuário logado na sessão ativa
 */
export function salvarSessaoUsuario(usuario: Usuario | null) {
  if (usuario) {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(usuario));
    setActiveAuditUser({
      id: usuario.id,
      username: usuario.username,
      nomeCompleto: usuario.nomeCompleto,
      cargo: usuario.cargo,
      email: usuario.email
    });
  } else {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    setActiveAuditUser(null);
  }
}

/**
 * Obtém a sessão ativa do usuário
 */
export function getSessaoAtiva(): Usuario | null {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (!cached) return null;
    const user: Usuario = JSON.parse(cached);
    setActiveAuditUser({
      id: user.id,
      username: user.username,
      nomeCompleto: user.nomeCompleto,
      cargo: user.cargo,
      email: user.email
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Cadastra um novo usuário no sistema (Exclusivo Administrador Master)
 */
export async function cadastrarNovoUsuario(
  dados: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'ultimoAcesso'>,
  auditContext?: { usuarioId?: string; nomeUsuario?: string; cargo?: string }
): Promise<Usuario> {
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

  const novoUsuario: Usuario = {
    ...dados,
    id,
    username: dados.username.trim(),
    nomeCompleto: dados.nomeCompleto.trim(),
    email: dados.email.trim().toLowerCase(),
    cargo: dados.cargo.trim(),
    senha: dados.senha || '22061993',
    ativo: dados.ativo !== undefined ? dados.ativo : true,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  // Salva no Firestore e cria log de auditoria
  try {
    await createWithAudit('configuracoes_sistema', id, novoUsuario, {
      usuarioId: auditContext?.usuarioId,
      nomeUsuario: auditContext?.nomeUsuario,
      cargo: auditContext?.cargo,
      detalhesPersonalizados: `Criação do usuário "${novoUsuario.nomeCompleto}" (${novoUsuario.username} - Função: ${novoUsuario.funcao}).`
    });
    // Grava também na coleção dedicada 'usuarios'
    const userRef = doc(db, USUARIOS_COLLECTION, id);
    await setDoc(userRef, novoUsuario);
  } catch (err) {
    console.warn('Erro ao salvar novo usuário no Firestore:', err);
  }

  // Atualiza cache local
  usuarios.push(novoUsuario);
  salvarCacheUsuarios(usuarios);

  return novoUsuario;
}

/**
 * Edita dados de um usuário existente (Exclusivo Administrador Master)
 */
export async function editarUsuario(
  id: string,
  dados: Partial<Omit<Usuario, 'id' | 'createdAt'>>,
  auditContext?: { usuarioId?: string; nomeUsuario?: string; cargo?: string }
): Promise<Usuario> {
  const usuarios = await getUsuarios();
  const index = usuarios.findIndex(u => u.id === id);
  if (index < 0) {
    throw new Error('Usuário não encontrado para edição.');
  }

  const usuarioAtual = usuarios[index];
  const timestamp = new Date().toISOString();

  // Verifica unicidade de username se alterado
  if (dados.username && dados.username.toLowerCase() !== usuarioAtual.username.toLowerCase()) {
    const existe = usuarios.some(u => u.id !== id && u.username.toLowerCase() === dados.username!.toLowerCase());
    if (existe) {
      throw new Error(`O nome de usuário "${dados.username}" já está em uso.`);
    }
  }

  // Não permite desativar o Administrador Master se for o único ativo
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

  try {
    await updateWithAudit('configuracoes_sistema', id, usuarioAtualizado, {
      usuarioId: auditContext?.usuarioId,
      nomeUsuario: auditContext?.nomeUsuario,
      cargo: auditContext?.cargo,
      detalhesPersonalizados: `Edição cadastral do usuário "${usuarioAtualizado.nomeCompleto}" (${usuarioAtualizado.username}).`
    });
    const userRef = doc(db, USUARIOS_COLLECTION, id);
    await setDoc(userRef, usuarioAtualizado);
  } catch (err) {
    console.warn('Erro ao atualizar usuário no Firestore:', err);
  }

  usuarios[index] = usuarioAtualizado;
  salvarCacheUsuarios(usuarios);

  // Se o usuário editado for o mesmo logado na sessão ativa, sincroniza
  const sessao = getSessaoAtiva();
  if (sessao && sessao.id === id) {
    salvarSessaoUsuario(usuarioAtualizado);
  }

  return usuarioAtualizado;
}

/**
 * Redefine a senha de um usuário (Exclusivo Administrador Master)
 */
export async function redefinirSenhaUsuario(
  id: string,
  novaSenha: string,
  auditContext?: { usuarioId?: string; nomeUsuario?: string; cargo?: string }
): Promise<void> {
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

  usuario.senha = novaSenha.trim();
  usuario.updatedAt = timestamp;

  try {
    await updateWithAudit('configuracoes_sistema', id, { senha: usuario.senha, updatedAt: timestamp }, {
      usuarioId: auditContext?.usuarioId,
      nomeUsuario: auditContext?.nomeUsuario,
      cargo: auditContext?.cargo,
      detalhesPersonalizados: `Redefinição de senha do usuário "${usuario.nomeCompleto}" (${usuario.username}) realizada pelo Administrador Master.`
    });
    const userRef = doc(db, USUARIOS_COLLECTION, id);
    await updateDoc(userRef, { senha: usuario.senha, updatedAt: timestamp });
  } catch (err) {
    console.warn('Erro ao salvar redefinição de senha no Firestore:', err);
  }

  usuarios[index] = usuario;
  salvarCacheUsuarios(usuarios);

  // Sincroniza sessão se for o mesmo
  const sessao = getSessaoAtiva();
  if (sessao && sessao.id === id) {
    salvarSessaoUsuario(usuario);
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
    if (usuario.senha && usuario.senha !== senhaAtual) {
      throw new Error('Senha atual incorreta.');
    }
    if (novaSenha.trim().length < 4) {
      throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
    }
    usuario.senha = novaSenha.trim();
  }

  usuario.nomeCompleto = dados.nomeCompleto.trim();
  usuario.email = dados.email.trim().toLowerCase();
  usuario.cargo = dados.cargo.trim();
  usuario.updatedAt = timestamp;

  try {
    await updateWithAudit('configuracoes_sistema', usuarioId, usuario, {
      usuarioId: usuario.id,
      nomeUsuario: usuario.nomeCompleto,
      cargo: usuario.cargo,
      detalhesPersonalizados: `Atualização de perfil próprio realizada pelo usuário "${usuario.nomeCompleto}".`
    });
    const userRef = doc(db, USUARIOS_COLLECTION, usuarioId);
    await setDoc(userRef, usuario);
  } catch (err) {
    console.warn('Erro ao atualizar Meu Perfil no Firestore:', err);
  }

  usuarios[index] = usuario;
  salvarCacheUsuarios(usuarios);
  salvarSessaoUsuario(usuario);

  return usuario;
}
