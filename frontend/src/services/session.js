/**
 * Manejo centralizado de la sesión y el rol del usuario.
 * El backend devuelve el rol en minúsculas ('admin' | 'user') tanto en el login
 * como dentro del JWT. Aquí se guarda y se expone de forma consistente.
 */

export function setSession({ token, role } = {}) {
  if (token) localStorage.setItem('token', token);
  if (role) localStorage.setItem('role', String(role).toLowerCase());
}

/**
 * #21BUG — Módulo pensado como "manejo centralizado de la sesión" que ningún
 * consumidor usa como tal. De los 8 exports, solo 3 se importan fuera de aquí
 * (`setSession`, `homePathForRole`, `isAuthenticated`/`isAdmin`/`isAgente`).
 * Quedan sin ninguna importación externa:
 *
 *   · `getToken`    — todos leen `localStorage.getItem('token')` a mano
 *                     (api.js, users.js, Profile.jsx, Dashboard.jsx…).
 *   · `getRole`     — solo lo usa este mismo archivo.
 *   · `getUserId`   — 0 usos; decodifica el JWT para sacar el id, cosa que
 *                     nadie necesita porque el backend resuelve `/users/me`.
 *   · `clearSession`— 0 usos, y además DUPLICA a `logout()` de `services/auth.js`,
 *                     que es el que sí se llama (Navbar, Profile). Las dos
 *                     funciones borran exactamente las mismas tres claves.
 *
 * El efecto práctico es que la centralización no existe: la clave `'token'` está
 * escrita literalmente en media docena de archivos, así que renombrarla exigiría
 * tocarlos todos pese a existir este módulo para evitarlo.
 *
 * Verificado: `grep -rn "getToken|getRole|getUserId|clearSession"` fuera de este
 * archivo no devuelve ninguna coincidencia.
 */
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
