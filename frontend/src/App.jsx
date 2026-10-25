import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ProtectedRoute, AdminRoute, AgenteRoute, PublicOnlyRoute } from './components/RouteGuards';
import { isAuthenticated, homePathForRole } from './services/session';
import Demo from './pages/Demo';
import Login from './components/LoginForm';
import Register from './components/RegisterForm';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Boletos from './pages/Boletos';
import Rutas from './pages/Rutas';
import Profile from './pages/Profile';
import Destino from './pages/Destino';
import Recomendados from './pages/Recomendados';
import ValidarCedula from './pages/ValidarCedula';
import SeatBooking from './pages/SeatBooking';
import LugaresTuristicos from './pages/LugaresTuristicos';
import Agente from './pages/Agente';
import AccountRecovery from './pages/AccountRecovery';

/** Pantallas de acceso: llevan su propio fondo y no la cabecera de página. */
const RUTAS_DE_ACCESO = ['/login', '/register', '/recuperar-cuenta', '/recuperar-contrasena'];

/**
 * Destino para cualquier URL que no exista.
 * Con sesión, a su pantalla de inicio; sin ella, a la portada.
 */
function RutaDesconocida() {
  return <Navigate to={isAuthenticated() ? homePathForRole() : '/'} replace />;
}

export default function App() {
  const { pathname } = useLocation();
  const esAcceso = RUTAS_DE_ACCESO.includes(pathname);
  const esPortada = pathname === '/' || pathname === '/demo';

  return (
    <div className={`app-shell ${esAcceso ? 'app-shell--auth' : ''} ${esPortada ? 'app-shell--landing' : ''}`}>
      <Navbar />

      <main className="app-main">
        <Routes>
          {/* ---- Solo visitantes ----
              Con la sesión iniciada no se vuelve a la portada ni al login: se
              redirige a la pantalla de inicio de cada rol. */}
          <Route path="/" element={<PublicOnlyRoute><Demo /></PublicOnlyRoute>} />
          <Route path="/demo" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/recuperar-cuenta" element={<PublicOnlyRoute><AccountRecovery /></PublicOnlyRoute>} />
          <Route path="/recuperar-contrasena" element={<PublicOnlyRoute><AccountRecovery purpose="password" /></PublicOnlyRoute>} />

          {/* ---- Administración (solo rol admin) ---- */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

          {/* ---- Agente de Turismo (verificación de boletos por QR) ---- */}
          <Route path="/agente" element={<AgenteRoute><Agente /></AgenteRoute>} />

          {/* ---- Usuario autenticado ---- */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/reservas" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/boletos" element={<ProtectedRoute><Boletos /></ProtectedRoute>} />
          <Route path="/rutas" element={<ProtectedRoute><Rutas /></ProtectedRoute>} />
          <Route path="/lugares-turisticos" element={<ProtectedRoute><LugaresTuristicos /></ProtectedRoute>} />
          <Route path="/seat-booking" element={<ProtectedRoute><SeatBooking /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/destino" element={<ProtectedRoute><Destino /></ProtectedRoute>} />
          <Route path="/recomendados" element={<ProtectedRoute><Recomendados /></ProtectedRoute>} />
          <Route path="/validar-cedula" element={<ValidarCedula />} />

          <Route path="*" element={<RutaDesconocida />} />
        </Routes>
      </main>
    </div>
  );
}
