import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdmin, isAgente, homePathForRole } from '../services/session';
import { logout } from '../services/auth';

/**
 * Barra de navegación.
 *
 * Los enlaces dependen del rol, y ya no aparece «Inicio» para quien tiene la
 * sesión iniciada: la portada pública no tiene nada que ofrecerle y además
 * mostraba rutas de ejemplo que no correspondían con las reales. El logotipo lleva
 * a la pantalla de inicio de cada rol.
 */
function enlacesPorRol({ admin, agente }) {
  if (agente && !admin) {
    return [{ to: '/agente', label: 'Verificar boletos', icon: '🎫' }];
  }

  const comunes = [
    { to: '/dashboard', label: 'Mis reservas', icon: '🧾' },
    { to: '/boletos', label: 'Comprar boletos', icon: '🎟️' },
    { to: '/rutas', label: 'Rutas', icon: '🗺️' },
    { to: '/lugares-turisticos', label: 'Lugares', icon: '📍' }
  ];

  if (admin) {
    return [
      { to: '/admin', label: 'Panel admin', icon: '⚙️' },
      { to: '/agente', label: 'Verificar boletos', icon: '🎫' },
      ...comunes
    ];
  }

  return comunes;
}

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conScroll, setConScroll] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const sesion = isAuthenticated();
  const admin = isAdmin();
  const agente = isAgente();

  // El menú móvil se cierra al cambiar de pantalla.
  useEffect(() => { setMenuAbierto(false); }, [location.pathname]);

  // La barra se vuelve más opaca al desplazarse, para que el contenido que pasa
  // por debajo no compita con los enlaces.
  useEffect(() => {
    const onScroll = () => setConScroll(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bloquear el scroll de fondo mientras el menú móvil está abierto.
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuAbierto]);

  const handleLogout = () => {
    logout();
    setMenuAbierto(false);
    navigate('/', { replace: true });
  };

  const enlaces = sesion ? enlacesPorRol({ admin, agente }) : [];
  const destinoLogo = sesion ? homePathForRole() : '/';

  return (
    <header className={`topbar ${conScroll ? 'topbar--scrolled' : ''}`}>
      <nav className="topbar-inner" aria-label="Navegación principal">
        <Link to={destinoLogo} className="brand" aria-label="CulturalTrip, ir al inicio">
          <span className="brand-mark" aria-hidden="true">CT</span>
          <span className="brand-name">Cultural<span>Trip</span></span>
        </Link>

        {/* Escritorio */}
        {sesion && (
          <ul className="topbar-links">
            {enlaces.map((e) => (
              <li key={e.to}>
                <NavLink to={e.to} className={({ isActive }) => `topbar-link ${isActive ? 'is-active' : ''}`}>
                  {e.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}

        <div className="topbar-actions">
          {sesion ? (
            <>
              {!(agente && !admin) && (
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `topbar-avatar ${isActive ? 'is-active' : ''}`}
                  aria-label="Mi perfil"
                  title="Mi perfil"
                >
                  👤
                </NavLink>
              )}
              <button type="button" className="btn btn-ghost btn-sm topbar-desktop" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-primary btn-sm topbar-desktop">Crear cuenta</Link>
            </>
          )}

          {sesion && (
            <button
              type="button"
              className={`topbar-burger ${menuAbierto ? 'is-open' : ''}`}
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
            >
              <span /><span /><span />
            </button>
          )}
        </div>
      </nav>

      {/* Móvil */}
      {sesion && menuAbierto && (
        <div className="topbar-drawer">
          <ul>
            {enlaces.map((e) => (
              <li key={e.to}>
                <NavLink to={e.to} className={({ isActive }) => `drawer-link ${isActive ? 'is-active' : ''}`}>
                  <span aria-hidden="true">{e.icon}</span>{e.label}
                </NavLink>
              </li>
            ))}
            {!(agente && !admin) && (
              <li>
                <NavLink to="/profile" className={({ isActive }) => `drawer-link ${isActive ? 'is-active' : ''}`}>
                  <span aria-hidden="true">👤</span>Mi perfil
                </NavLink>
              </li>
            )}
          </ul>
          <button type="button" className="btn btn-secondary btn-full" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
