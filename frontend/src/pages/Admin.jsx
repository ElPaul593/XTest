import React from 'react';
import AdminUsers from './admin/AdminUsers';

export default function Admin() {
  return (
    <section className="dashboard-container">
      <div className="container">
        <header className="dashboard-header">
          <h1>Panel de Administracion</h1>
          <p>Gestion de usuarios, rutas, lugares turisticos, boletos y estadisticas</p>
        </header>
        <div className="admin-tabs" role="tablist" aria-label="Secciones administrativas">
          <button className="btn btn-primary" type="button"><span aria-hidden="true">👥</span> Usuarios</button>
          <button className="btn btn-secondary" type="button" disabled><span aria-hidden="true">🗺️</span> Rutas</button>
          <button className="btn btn-secondary" type="button" disabled><span aria-hidden="true">🏞️</span> Lugares</button>
          <button className="btn btn-secondary" type="button" disabled><span aria-hidden="true">🎫</span> Boletos</button>
          <button className="btn btn-secondary" type="button" disabled><span aria-hidden="true">📊</span> Estadisticas</button>
        </div>
        <AdminUsers />
      </div>
    </section>
  );
}