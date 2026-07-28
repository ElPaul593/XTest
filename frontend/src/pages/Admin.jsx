import React, { useState } from 'react';
import AdminUsers from './admin/AdminUsers';
import AdminRutas from './admin/AdminRutas';
import AdminBoletos from './admin/AdminBoletos';
import AdminStats from './admin/AdminStats';

const TABS = [
  { key: 'usuarios', label: '👥 Usuarios', Comp: AdminUsers },
  { key: 'rutas', label: '🛣️ Rutas', Comp: AdminRutas },
  { key: 'boletos', label: '🎫 Boletos', Comp: AdminBoletos },
  { key: 'stats', label: '📊 Estadísticas', Comp: AdminStats },
];

export default function Admin() {
  const [active, setActive] = useState('usuarios');
  const Active = TABS.find(t => t.key === active)?.Comp || AdminUsers;

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1>Panel de Administración</h1>
          <p>Gestión de usuarios, rutas, boletos y estadísticas</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`btn ${active === t.key ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Active />
      </div>
    </div>
  );
}
