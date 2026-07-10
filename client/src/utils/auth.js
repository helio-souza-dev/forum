/**
 * Helper centralizado para extração do Token JWT do usuário (Single Source of Truth)
 * Retorna sempre a chave de sessão 'prismshare_current_user.token' limpa ou null
 */
export function getAuthToken(currentUser = null) {
  if (currentUser && currentUser.token) return currentUser.token;
  try {
    const storedUser = JSON.parse(localStorage.getItem('prismshare_current_user') || '{}');
    if (storedUser && storedUser.token) return storedUser.token;
  } catch (err) {
    console.error('Erro ao ler token do localStorage:', err);
  }
  return null;
}
