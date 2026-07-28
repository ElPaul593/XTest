import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdmin, isAgente } from '../services/session';
import { logout } from '../services/auth';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = isAuthenticated();
  const admin = isAdmin();
  const agente = isAgente();

  const handleLogout = () => {
    logout();
    navigate('/demo');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/demo" className="navbar-logo">
          <span className="logo-icon">🚌</span>
          BusReserva
        </Link>

        {/* Desktop Menu */}
        <div className="navbar-menu">
          <Link to="/demo" className={`navbar-link ${isActive('/demo')}`}>
            Inicio
          </Link>
          
          {token && agente && !admin ? (
            <>
              <Link to="/agente" className={`navbar-link ${isActive('/agente')}`}>
                🎫 Verificar Boletos
              </Link>
              <button onClick={handleLogout} className="navbar-btn logout">
                Cerrar Sesión
              </button>
            </>
          ) : token ? (
            <>
              {admin && (
                <Link to="/admin" className={`navbar-link ${isActive('/admin')}`}>
                  Panel Admin
                </Link>
              )}
              {admin && (
                <Link to="/agente" className={`navbar-link ${isActive('/agente')}`}>
                  Verificar Boletos
                </Link>
              )}
              <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/boletos" className={`navbar-link ${isActive('/boletos')}`}>
                Boletos
              </Link>
              <Link to="/rutas" className={`navbar-link ${isActive('/rutas')}`}>
                Rutas
              </Link>
              <Link to="/lugares-turisticos" className={`navbar-link ${isActive('/lugares-turisticos')}`}>
                Lugares Turísticos
              </Link>
              <Link to="/reservas" className={`navbar-link ${isActive('/reservas')}`}>
                Mis Reservas
              </Link>
              <Link to="/profile" className={`navbar-link ${isActive('/profile')}`}>
                Mi Perfil
              </Link>
              <button onClick={handleLogout} className="navbar-btn logout">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-btn login">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="navbar-btn register">
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <Link 
            to="/demo" 
            className={`mobile-link ${isActive('/demo')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Inicio
          </Link>
          
          {token && agente && !admin ? (
            <>
              <Link
                to="/agente"
                className={`mobile-link ${isActive('/agente')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                🎫 Verificar Boletos
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="mobile-btn logout"
              >
                Cerrar Sesión
              </button>
            </>
          ) : token ? (
            <>
              {admin && (
                <Link
                  to="/admin"
                  className={`mobile-link ${isActive('/admin')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Panel Admin
                </Link>
              )}
              {admin && (
                <Link
                  to="/agente"
                  className={`mobile-link ${isActive('/agente')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Verificar Boletos
                </Link>
              )}
              <Link
                to="/dashboard"
                className={`mobile-link ${isActive('/dashboard')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/boletos" 
                className={`mobile-link ${isActive('/boletos')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Boletos
              </Link>
              <Link 
                to="/rutas" 
                className={`mobile-link ${isActive('/rutas')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Rutas
              </Link>
              <Link 
                to="/lugares-turisticos" 
                className={`mobile-link ${isActive('/lugares-turisticos')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Lugares Turísticos
              </Link>
              <Link 
                to="/reservas" 
                className={`mobile-link ${isActive('/reservas')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Mis Reservas
              </Link>
              <Link 
                to="/profile" 
                className={`mobile-link ${isActive('/profile')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Mi Perfil
              </Link>
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }} 
                className="mobile-btn logout"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="mobile-btn login"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar Sesión
              </Link>
              <Link 
                to="/register" 
                className="mobile-btn register"
                onClick={() => setIsMenuOpen(false)}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}