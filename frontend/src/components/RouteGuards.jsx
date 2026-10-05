import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, isAgente } from '../services/session';

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
