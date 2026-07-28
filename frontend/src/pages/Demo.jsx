import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HERO_CONTENT, FEATURES, RUTAS_POPULARES, CTA_CONTENT } from '../constants/demo';

export default function Demo() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleGetStarted = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="demo-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            {HERO_CONTENT.title}
            <span className="hero-subtitle">{HERO_CONTENT.subtitle}</span>
          </h1>
          <p className="hero-description">
            {HERO_CONTENT.description}
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={handleGetStarted}>
              {token ? 'Ir al Dashboard' : 'Iniciar Sesión'}
            </button>
            <button className="btn-secondary" onClick={() => navigate('/boletos')}>
              Ver Boletos
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="bus-illustration">
            🚌
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">¿Por qué elegirnos?</h2>
          <div className="features-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="routes-section">
        <div className="container">
          <h2 className="section-title">Rutas Populares</h2>
          <div className="routes-grid">
            {RUTAS_POPULARES.map((ruta) => (
              <div key={`${ruta.origen}-${ruta.destino}`} className="route-card">
                <div className="route-info">
                  <h4>{ruta.origen} ➜ {ruta.destino}</h4>
                  <p>Desde <span className="price">{ruta.precio}</span></p>
                  <span className="duration">{ruta.duracion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>{CTA_CONTENT.title}</h2>
            <p>{CTA_CONTENT.description}</p>
            <button className="btn-primary" onClick={handleGetStarted}>
              {token ? 'Ver mis Reservas' : 'Registrarse Gratis'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

