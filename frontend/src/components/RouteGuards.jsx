import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, isAgente, homePathForRole } from '../services/session';

/**
 * Pantallas solo para visitantes: portada, inicio de sesión, registro y
 * recuperación.
 *
 * Antes, un usuario con la sesión iniciada podía volver a la portada pública
 * (desde el enlace «Inicio» o escribiendo la URL) y ver otra vez el «Reserva tu
 * viaje» con rutas de ejemplo, como si no hubiera entrado. Ahora se le lleva
 * directamente a su pantalla de inicio según su rol: panel de administración,
 * verificación de boletos o sus reservas.
 */
export function PublicOnlyRoute({ children }) {
  return isAuthenticated()
    ? <Navigate to={homePathForRole()} replace />
    : children;
}

/**
 * Requiere sesión iniciada. Si no hay token, redirige a /login.
 */
export function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

/**
 * Requiere rol admin. Sin sesión -> /login; con sesión no-admin -> /dashboard.
 */
export function AdminRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * Requiere rol agente (o admin). Sin sesión -> /login; con sesión sin permiso -> /dashboard.
 */
export function AgenteRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isAgente() && !isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}
