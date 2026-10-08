import React, { useState } from 'react';
import AdminUsers from './admin/AdminUsers';
import AdminRutas from './admin/AdminRutas';
import AdminLugares from './admin/AdminLugares';

export default function Admin() {
  const [active, setActive] = useState('usuarios');

  return (
    <section className="dashboard-container">
      <div className="container">
        <header className="dashboard-header">
          <h1>Panel de Administracion</h1>
          <p>Gestion de usuarios, rutas, lugares turisticos, boletos y estadisticas</p>
        </header>
        <div className="admin-tabs" role="tablist" aria-label="Secciones administrativas">
          <button className={`btn ${active === 'usuarios' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setActive('usuarios')}><span aria-hidden="true">👥</span> Usuarios</button>
          <button className={`btn ${active === 'rutas' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setActive('rutas')}><span aria-hidden="true">🗺️</span> Rutas</button>
          <button className={`btn ${active === 'lugares' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setActive('lugares')}><span aria-hidden="true">🏞️</span> Lugares</button>
          <button className="btn btn-secondary" type="button" disabled><span aria-hidden="true">🎫</span> Boletos</button>
          <button className="btn btn-secondary" type="button" disabled><span aria-hidden="true">📊</span> Estadisticas</button>
        </div>
        {active === 'usuarios' && <AdminUsers />}
        {active === 'rutas' && <AdminRutas />}
        {active === 'lugares' && <AdminLugares />}
      </div>
    </section>
  );
}