import React, { useState } from 'react';
import { validarCedula } from '../services/cedula';
import '../styles/components/cedula-validator.css';

export default function CedulaValidator() {
  const [cedula, setCedula] = useState('');
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCedula(value);
    setResultado(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cedula.length !== 10) {
      setError('La cédula debe tener 10 dígitos');
      setResultado(null);
      return;
    }

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const respuesta = await validarCedula(cedula);
      setResultado(respuesta);
    } catch (err) {
      setError(err.message);
      setResultado(null);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="cedula-validator">
      <h2>Validar Cédula Ecuatoriana</h2>
      
      <form onSubmit={handleSubmit} className="cedula-form">
        <div className="form-group">
          <label htmlFor="cedula">Número de Cédula:</label>
          <input
            type="text"
            id="cedula"
            value={cedula}
            onChange={handleChange}
            placeholder="Ingrese su cédula (10 dígitos)"
            maxLength="10"
            disabled={cargando}
            required
          />
        </div>

        <button type="submit" disabled={cargando || cedula.length !== 10}>
          {cargando ? 'Validando...' : 'Validar Cédula'}
        </button>
      </form>

      {resultado && (
        <div className={`resultado ${resultado.valida ? 'valida' : 'invalida'}`}>
          <p className="mensaje">{resultado.mensaje}</p>
          <p className="cedula-numero">Cédula: {resultado.cedula}</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

