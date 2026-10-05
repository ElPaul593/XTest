import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearSession, isAdmin, isAuthenticated } from '../services/session';

export default function Navbar() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <nav className="navbar-container" aria-label="Navegacion principal">
        <NavLink className="navbar-logo" to="/login">
          <img className="logo-icon" src="/bus-logo.svg" alt="" />
          <span>BusReserva</span>
        </NavLink>

        <div className="navbar-menu">
          {authenticated ? (
            <>
              <NavLink className="navbar-link" to="/dashboard">Inicio</NavLink>
              {isAdmin() && <NavLink className="navbar-link" to="/admin">Panel Admin</NavLink>}
              <button className="navbar-btn login" type="button" onClick={handleLogout}>Cerrar Sesion</button>
            </>
          ) : (
            <>
              <NavLink className="navbar-link" to="/login">Inicio</NavLink>
              <NavLink className="navbar-btn login" to="/login">Iniciar Sesion</NavLink>
              <NavLink className="navbar-btn register" to="/register">Registrarse</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}