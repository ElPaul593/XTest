/**
 * Manejo centralizado de la sesión y el rol del usuario.
 * El backend devuelve el rol en minúsculas ('admin' | 'user') tanto en el login
 * como dentro del JWT. Aquí se guarda y se expone de forma consistente.
 */

export function setSession({ token, role } = {}) {
  if (token) localStorage.setItem('token', token);
  if (role) localStorage.setItem('role', String(role).toLowerCase());
}

export function getToken() {
  return localStorage.getItem('token');
}

function decodeRoleFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ? String(payload.role).toLowerCase() : null;
  } catch {
    return null;
  }
}

export function getRole() {
  const stored = localStorage.getItem('role');
  if (stored) return String(stored).toLowerCase();
  return decodeRoleFromToken();
}

export function getUserId() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || payload.userId || null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function isAdmin() {
  return getRole() === 'admin';
}

export function isAgente() {
  return getRole() === 'agente';
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
}

/** Ruta de inicio según el rol. */
export function homePathForRole(role = getRole()) {
  if (role === 'admin') return '/admin';
  if (role === 'agente') return '/agente';
  return '/dashboard';
}
