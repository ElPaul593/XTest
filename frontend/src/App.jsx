import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ProtectedRoute, AdminRoute, AgenteRoute } from './components/RouteGuards';
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

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/demo" replace />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Administración (solo rol admin) */}
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

        {/* Agente de Turismo (verificación de boletos por QR) */}
        <Route path="/agente" element={<AgenteRoute><Agente /></AgenteRoute>} />

        {/* Usuario autenticado */}
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
      </Routes>
    </div>
  );
}
