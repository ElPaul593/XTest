import React from 'react';
import { Link } from 'react-router-dom';
import { isAdmin } from '../services/session';

export default function Dashboard() {
  return (
    <section className="dashboard-container">
      <div className="container dashboard-header">
        <h1>Inicio</h1>
        <p>Bienvenido a BusReserva.</p>
        {isAdmin() && (
          <Link className="btn btn-primary" to="/admin">Abrir panel de administracion</Link>
        )}
      </div>
    </section>
  );
}