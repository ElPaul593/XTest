import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Login from './components/LoginForm';
import Navbar from './components/Navbar';
import Register from './components/RegisterForm';
import { AdminRoute, ProtectedRoute } from './components/RouteGuards';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </main>
    </>
  );
}