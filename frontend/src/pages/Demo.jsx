import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRutas } from '../services/rutas';

/**
 * Portada pública. Solo la ven los visitantes: con la sesión iniciada,
 * `PublicOnlyRoute` redirige a la pantalla de inicio de cada rol.
 *
 * Las «Rutas populares» ya no son datos de ejemplo. Antes salían de
 * `constants/demo.js`: tres rutas fijas con precios inventados ($12.50, $15.00…)
 * que no coincidían con las que existían en el sistema ni con sus precios. Ahora
 * se piden al backend (`GET /api/rutas`, público). Si no hay rutas o el backend no
 * responde, la sección simplemente no se muestra: es preferible a enseñar datos
 * falsos.
 */

const VENTAJAS = [
  {
    icono: '💺',
    titulo: 'Elige tu asiento',
    texto: 'Mapa del bus en tiempo real. El asiento queda reservado para ti mientras completas la compra.'
  },
  {
    icono: '📲',
    titulo: 'Boleto con QR',
    texto: 'Recíbelo en tu correo y preséntalo desde el móvil al abordar. Sin papeles.'
  },
  {
    icono: '🧭',
    titulo: 'Recomendaciones locales',
    texto: 'Lugares del destino valorados por viajeros de tu misma provincia.'
  },
  {
    icono: '🔐',
    titulo: 'Cuenta protegida',
    texto: 'Verificación de correo, recuperación segura y acceso con Google.'
  }
];

const PASOS = [
  { n: '01', titulo: 'Crea tu cuenta', texto: 'Con tu cédula o pasaporte. Tarda menos de un minuto.' },
  { n: '02', titulo: 'Elige ruta y asiento', texto: 'Compara horarios y selecciona tu sitio en el mapa del bus.' },
  { n: '03', titulo: 'Viaja', texto: 'Tu boleto llega al correo con el código QR listo para abordar.' }
];

const formatoPrecio = (valor) =>
  typeof valor === 'number'
    ? valor.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
    : null;

export default function Demo() {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    getRutas()
      .then((r) => {
        if (cancelado) return;
        const lista = Array.isArray(r) ? r : (r?.data || []);
        setRutas(lista.slice(0, 6));
      })
      .catch(() => { if (!cancelado) setRutas([]); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="landing">
      {/* ---------------- Hero ---------------- */}
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="eyebrow">Buses interprovinciales · Ecuador</span>
          <h1 className="landing-title">
            Viaja por Ecuador,<br />
            <span className="text-accent">sin filas ni papeles.</span>
          </h1>
          <p className="landing-lead">
            Reserva tu asiento, recibe el boleto en tu correo y descubre qué visitar
            en tu destino según viajeros de tu provincia.
          </p>
          <div className="landing-cta">
            <Link to="/register" className="btn btn-primary btn-lg">Crear cuenta gratis</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Ya tengo cuenta</Link>
          </div>
        </div>

        {/* Tarjeta ilustrativa del boleto: decorativa, sin datos reales. */}
        <div className="landing-hero-visual" aria-hidden="true">
          <div className="ticket-preview glass-strong">
            <div className="ticket-preview-top">
              <span className="ticket-chip">Boleto electrónico</span>
              <span className="ticket-qr">▦</span>
            </div>
            <div className="ticket-preview-route">
              <div>
                <small>Origen</small>
                <strong>Quito</strong>
              </div>
              <span className="ticket-arrow">→</span>
              <div>
                <small>Destino</small>
                <strong>Cuenca</strong>
              </div>
            </div>
            <div className="ticket-preview-meta">
              <div><small>Asiento</small><strong>12</strong></div>
              <div><small>Salida</small><strong>08:30</strong></div>
              <div><small>Estado</small><strong className="text-success">Confirmado</strong></div>
            </div>
          </div>
          <div className="hero-glow" />
        </div>
      </section>

      {/* ---------------- Ventajas ---------------- */}
      <section className="landing-section">
        <header className="section-head">
          <span className="eyebrow">Por qué CulturalTrip</span>
          <h2>Todo tu viaje en un solo lugar</h2>
        </header>
        <div className="feature-grid">
          {VENTAJAS.map((v) => (
            <article key={v.titulo} className="feature glass">
              <span className="feature-icon" aria-hidden="true">{v.icono}</span>
              <h3>{v.titulo}</h3>
              <p>{v.texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- Rutas reales ---------------- */}
      {(cargando || rutas.length > 0) && (
        <section className="landing-section">
          <header className="section-head">
            <span className="eyebrow">Disponibles ahora</span>
            <h2>Rutas en servicio</h2>
          </header>

          <div className="route-grid">
            {cargando
              ? Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="route-tile glass skeleton" aria-hidden="true" />
                ))
              : rutas.map((r) => (
                  <article key={r._id || r.id || `${r.from}-${r.to}`} className="route-tile glass">
                    <div className="route-tile-cities">
                      <span>{r.from}</span>
                      <span className="route-tile-line" aria-hidden="true" />
                      <span>{r.to}</span>
                    </div>
                    <div className="route-tile-meta">
                      {r.duration && <span>⏱ {r.duration}</span>}
                      {r.horaSalida && <span>🕗 {r.horaSalida}</span>}
                    </div>
                    {formatoPrecio(r.price) && (
                      <div className="route-tile-price">
                        <small>desde</small>
                        <strong>{formatoPrecio(r.price)}</strong>
                      </div>
                    )}
                  </article>
                ))}
          </div>
        </section>
      )}

      {/* ---------------- Cómo funciona ---------------- */}
      <section className="landing-section">
        <header className="section-head">
          <span className="eyebrow">Cómo funciona</span>
          <h2>Tres pasos y listo</h2>
        </header>
        <ol className="steps-grid">
          {PASOS.map((p) => (
            <li key={p.n} className="step glass">
              <span className="step-n">{p.n}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- Llamada final ---------------- */}
      <section className="landing-section">
        <div className="cta-banner glass-strong">
          <div>
            <h2>¿Listo para tu próximo viaje?</h2>
            <p>Crea tu cuenta y reserva en minutos.</p>
          </div>
          <Link to="/register" className="btn btn-primary btn-lg">Empezar ahora</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} CulturalTrip</span>
        <span>Proyecto académico · Ecuador</span>
      </footer>
    </div>
  );
}
