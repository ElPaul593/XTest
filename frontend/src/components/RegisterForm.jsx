import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login } from '../services/auth';
import { validarCedula } from '../services/cedula';
import { PAISES } from '../constants/paises';
import { getCodigoTelefonico } from '../constants/codigosTelefonicos';

export default function RegisterForm() {
  const [activeTab, setActiveTab] = useState('nacional'); // 'nacional' o 'extranjero'
  
  // Campos comunes
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // Campos para nacionales
  const [cedula, setCedula] = useState('');
  const [validandoCedula, setValidandoCedula] = useState(false);
  const [cedulaValida, setCedulaValida] = useState(null);
  
  // Campos para extranjeros
  const [pasaporte, setPasaporte] = useState('');
  const [paisOrigen, setPaisOrigen] = useState('');
  const [codigoTelefonico, setCodigoTelefonico] = useState('+593'); // Por defecto Ecuador
  
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  const cedulaDigits = cedula.replace(/\D/g, '');

  // Validar cédula ecuatoriana automáticamente (solo para nacionales)
  useEffect(() => {
    if (activeTab !== 'nacional') {
      setCedulaValida(null);
      setValidandoCedula(false);
      return;
    }

    const validarCedulaEcuatoriana = async () => {
      const cedulaLimpia = cedulaDigits;
      
      // Solo validar si la cédula tiene exactamente 10 dígitos
      if (cedulaLimpia.length === 10 && /^\d{10}$/.test(cedulaLimpia)) {
        setValidandoCedula(true);
        try {
          const resultado = await validarCedula(cedulaLimpia);
          setCedulaValida(resultado.valida);
          if (!resultado.valida) {
            setError('La cédula ecuatoriana no es válida. Por favor, verifique el número.');
          } else {
            setError(null);
          }
        } catch (err) {
          setCedulaValida(false);
          setError(err.message || 'Error al validar la cédula');
        } finally {
          setValidandoCedula(false);
        }
      } else {
        if (cedulaLimpia.length !== 10) {
          setCedulaValida(null);
        }
      }
    };

    const timeoutId = setTimeout(validarCedulaEcuatoriana, 500);
    return () => clearTimeout(timeoutId);
  }, [cedulaDigits, activeTab]);

  // Validaciones para nacionales
  const cedulaError = useMemo(() => {
    if (activeTab !== 'nacional') return null;
    if (!touched.cedula) return null;
    const cedulaLimpia = cedulaDigits;
    
    if (cedulaLimpia.length === 0) return 'La cédula es requerida';
    if (!/^\d+$/.test(cedulaLimpia)) return 'La cédula debe contener solo dígitos';
    if (cedulaLimpia.length > 10) return 'Máximo 10 dígitos';
    if (cedulaLimpia.length < 6) return 'La cédula es muy corta';
    
    if (cedulaLimpia.length === 10) {
      if (validandoCedula) return 'Validando cédula ecuatoriana...';
      if (cedulaValida === false) return 'La cédula ecuatoriana no es válida';
      if (cedulaValida === true) return null;
    }
    
    return null;
  }, [cedulaDigits, touched.cedula, cedulaValida, validandoCedula, activeTab]);

  // Validaciones para extranjeros
  const pasaporteError = useMemo(() => {
    if (activeTab !== 'extranjero') return null;
    if (!touched.pasaporte) return null;
    const pasaporteLimpio = pasaporte.trim();
    
    if (pasaporteLimpio.length === 0) return 'El pasaporte es requerido';
    if (pasaporteLimpio.length < 6) return 'El pasaporte debe tener al menos 6 caracteres';
    if (pasaporteLimpio.length > 20) return 'El pasaporte no puede tener más de 20 caracteres';
    
    return null;
  }, [pasaporte, touched.pasaporte, activeTab]);

  const paisOrigenError = useMemo(() => {
    if (activeTab !== 'extranjero') return null;
    if (!touched.paisOrigen) return null;
    if (!paisOrigen.trim()) return 'El país de origen es requerido';
    if (paisOrigen.trim() === 'Ecuador') return 'Seleccione un país diferente a Ecuador';
    return null;
  }, [paisOrigen, touched.paisOrigen, activeTab]);

  // Validaciones comunes
  const nombreError = useMemo(() => {
    if (!touched.nombre) return null;
    if (!nombre.trim()) return 'El nombre es requerido';
    return null;
  }, [nombre, touched.nombre]);

  const apellidoError = useMemo(() => {
    if (!touched.apellido) return null;
    if (!apellido.trim()) return 'El apellido es requerido';
    return null;
  }, [apellido, touched.apellido]);

  const passwordError = useMemo(() => {
    if (!touched.password) return null;
    if (password.length === 0) return 'La contraseña es requerida';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  }, [password, touched.password]);

  const telefonoError = useMemo(() => {
    if (!touched.telefono) return null;
    // Si es extranjero y no hay país seleccionado, no validar teléfono aún
    if (activeTab === 'extranjero' && !paisOrigen) return null;
    if (!telefono.trim()) return 'El teléfono es requerido';
    if (!/^\d+$/.test(telefono.trim())) return 'El teléfono debe contener solo dígitos';
    return null;
  }, [telefono, touched.telefono, activeTab, paisOrigen]);

  // Validación del formulario según la pestaña activa
  const isFormValid = useMemo(() => {
    // Para extranjeros, el teléfono solo es requerido si hay país seleccionado
    const telefonoValido = activeTab === 'extranjero' && !paisOrigen 
      ? true 
      : (!telefonoError && telefono.trim());
    
    const camposComunes = !nombreError && !apellidoError && !passwordError && telefonoValido &&
      nombre && apellido && password && (activeTab === 'extranjero' && !paisOrigen ? true : telefono);
    
    if (activeTab === 'nacional') {
      return camposComunes && !cedulaError && cedulaDigits &&
        (cedulaDigits.length === 10 && cedulaValida === true);
    } else {
      return camposComunes && !pasaporteError && !paisOrigenError &&
        pasaporte.trim() && paisOrigen.trim() && paisOrigen.trim() !== 'Ecuador';
    }
  }, [activeTab, nombreError, apellidoError, passwordError, telefonoError, cedulaError, pasaporteError, paisOrigenError,
      nombre, apellido, password, telefono, cedulaDigits, cedulaValida, pasaporte, paisOrigen]);

  const handleCedulaChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setCedula(digitsOnly.slice(0, 10));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados
    if (activeTab === 'nacional') {
      setTouched({ cedula: true, nombre: true, apellido: true, password: true, telefono: true });
    } else {
      setTouched({ pasaporte: true, paisOrigen: true, nombre: true, apellido: true, password: true, telefono: true });
    }
    
    setError(null);
    
    if (activeTab === 'nacional') {
      // Validaciones para nacionales
      if (cedulaDigits.length !== 10) {
        setError('La cédula ecuatoriana debe tener exactamente 10 dígitos.');
        return;
      }
      
      if (validandoCedula) {
        setError('Por favor, espere a que se valide la cédula ecuatoriana.');
        return;
      }
      
      if (cedulaValida === null) {
        setError('Por favor, espere a que se valide la cédula ecuatoriana.');
        return;
      }
      
      if (cedulaValida === false) {
        setError('La cédula ecuatoriana no es válida. Por favor, verifique el número según el algoritmo de validación.');
        return;
      }
      
      if (!isFormValid) {
        setError('Por favor, complete todos los campos correctamente.');
        return;
      }
      
      try {
        // Combinar código telefónico con el número (Ecuador 593, sin el +)
        const codigoSinMas = '593'; // Ecuador sin el +
        const telefonoCompleto = codigoSinMas + telefono.trim();
        await register({
          cedula: cedulaDigits,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefonoCompleto,
          paisOrigen: 'Ecuador',
          password
        });
        const data = await login({ cedula: cedulaDigits, password });
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Error al registrar');
      }
    } else {
      // Validaciones para extranjeros
      if (!pasaporte.trim()) {
        setError('El pasaporte es requerido.');
        return;
      }
      
      if (!paisOrigen.trim() || paisOrigen.trim() === 'Ecuador') {
        setError('Debe seleccionar un país de origen válido (diferente a Ecuador).');
        return;
      }
      
      if (!isFormValid) {
        setError('Por favor, complete todos los campos correctamente.');
        return;
      }
      
      try {
        // Combinar código telefónico con el número (solo dígitos, sin el +)
        const codigoSinMas = codigoTelefonico.replace('+', ''); // Quitar el símbolo +
        const telefonoCompleto = codigoSinMas + telefono.trim();
        await register({
          pasaporte: pasaporte.trim(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefonoCompleto,
          paisOrigen: paisOrigen.trim(),
          password
        });
        const data = await login({ pasaporte: pasaporte.trim(), password });
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Error al registrar');
      }
    }
  };

  // Actualizar código telefónico cuando cambie el país de origen
  useEffect(() => {
    if (activeTab === 'extranjero' && paisOrigen) {
      const codigo = getCodigoTelefonico(paisOrigen);
      setCodigoTelefonico(codigo);
    } else if (activeTab === 'nacional') {
      setCodigoTelefonico('+593'); // Ecuador
    }
  }, [paisOrigen, activeTab]);

  // Limpiar campos al cambiar de pestaña
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'nacional') {
      setPasaporte('');
      setPaisOrigen('');
      setCodigoTelefonico('+593'); // Ecuador
      setTouched((t) => ({ ...t, pasaporte: false, paisOrigen: false }));
    } else {
      setCedula('');
      setCedulaValida(null);
      setValidandoCedula(false);
      setTouched((t) => ({ ...t, cedula: false }));
    }
  };

  // Filtrar países para extranjeros (excluir Ecuador)
  const paisesExtranjeros = PAISES.filter(p => p !== 'Ecuador');

  return (
    <main className="center-screen">
      <div className="card" role="dialog" aria-labelledby="reg-title" style={{maxWidth: 760}}>
        <h2 id="reg-title">Registro de usuario</h2>
        
        {/* Pestañas */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e0e0e0' }}>
          <button
            type="button"
            onClick={() => handleTabChange('nacional')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'nacional' ? '3px solid #007bff' : '3px solid transparent',
              color: activeTab === 'nacional' ? '#007bff' : '#666',
              fontWeight: activeTab === 'nacional' ? '600' : '400',
              transition: 'color 0.2s, border-color 0.2s'
            }}
          >
            Usuarios Nacionales (Ecuador)
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('extranjero')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'extranjero' ? '3px solid #007bff' : '3px solid transparent',
              color: activeTab === 'extranjero' ? '#007bff' : '#666',
              fontWeight: activeTab === 'extranjero' ? '600' : '400',
              transition: 'color 0.2s, border-color 0.2s'
            }}
          >
            Extranjeros
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="form-grid" style={{gridTemplateColumns:'1fr', gap: 14}}>
          {activeTab === 'nacional' ? (
            <>
              {/* Formulario para Nacionales */}
              <div className="field">
                <label htmlFor="cedula">
                  Cédula
                  {cedulaDigits.length === 10 && (
                    <span style={{marginLeft: '8px', fontSize: '0.85em'}}>
                      {validandoCedula && '⏳ Validando...'}
                      {!validandoCedula && cedulaValida === true && '✓ Válida'}
                      {!validandoCedula && cedulaValida === false && '✗ Inválida'}
                    </span>
                  )}
                </label>
                <input
                  id="cedula"
                  className="input"
                  inputMode="numeric"
                  pattern="\\d*"
                  value={cedula}
                  onChange={handleCedulaChange}
                  onBlur={() => setTouched((t) => ({ ...t, cedula: true }))}
                  maxLength={10}
                  placeholder="1723456789"
                  required
                  style={{
                    borderColor: cedulaDigits.length === 10
                      ? (cedulaValida === true ? '#28a745' : cedulaValida === false ? '#dc3545' : undefined)
                      : undefined
                  }}
                />
                {cedulaError && <div className="error">{cedulaError}</div>}
                {cedulaDigits.length === 10 && !cedulaError && cedulaValida === true && (
                  <div style={{color: '#28a745', fontSize: '0.85em', marginTop: '4px'}}>
                    ✓ Cédula ecuatoriana válida
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Formulario para Extranjeros */}
              <div className="row-between" style={{gap:14, flexWrap:'wrap'}}>
                <div className="field" style={{flex:'1 1 240px'}}>
                  <label htmlFor="pasaporte">Pasaporte</label>
                  <input
                    id="pasaporte"
                    className="input"
                    value={pasaporte}
                    onChange={(e) => setPasaporte(e.target.value.slice(0, 20))}
                    onBlur={() => setTouched((t) => ({ ...t, pasaporte: true }))}
                    placeholder="AB123456"
                    required
                  />
                  {pasaporteError && <div className="error">{pasaporteError}</div>}
                </div>

                <div className="field" style={{flex:'1 1 240px'}}>
                  <label htmlFor="paisOrigen">País de Origen</label>
                  <select
                    id="paisOrigen"
                    className="input"
                    value={paisOrigen}
                    onChange={(e) => setPaisOrigen(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, paisOrigen: true }))}
                    required
                  >
                    <option value="">Seleccione un país</option>
                    {paisesExtranjeros.map((pais) => (
                      <option key={pais} value={pais}>{pais}</option>
                    ))}
                  </select>
                  {paisOrigenError && <div className="error">{paisOrigenError}</div>}
                </div>
              </div>
            </>
          )}

          {/* Campos comunes */}
          <div className="row-between" style={{gap:14, flexWrap:'wrap'}}>
            <div className="field" style={{flex:'1 1 240px'}}>
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                className="input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
                placeholder="Pablo"
                required
              />
              {nombreError && <div className="error">{nombreError}</div>}
            </div>

            <div className="field" style={{flex:'1 1 240px'}}>
              <label htmlFor="apellido">Apellido</label>
              <input
                id="apellido"
                className="input"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, apellido: true }))}
                placeholder="Criollo"
                required
              />
              {apellidoError && <div className="error">{apellidoError}</div>}
            </div>
          </div>

          <div className="row-between" style={{gap:14, flexWrap:'wrap'}}>
            <div className="field" style={{flex:'1 1 240px'}}>
              <label htmlFor="telefono">Teléfono</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                {activeTab === 'extranjero' && paisOrigen ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    borderTopRightRadius: '0',
                    borderBottomRightRadius: '0',
                    borderRight: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    minWidth: '60px',
                    justifyContent: 'center'
                  }}>
                    {codigoTelefonico}
                  </div>
                ) : activeTab === 'nacional' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    borderTopRightRadius: '0',
                    borderBottomRightRadius: '0',
                    borderRight: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    minWidth: '60px',
                    justifyContent: 'center'
                  }}>
                    +593
                  </div>
                ) : null}
                <input
                  id="telefono"
                  className="input"
                  inputMode="numeric"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  onBlur={() => setTouched((t) => ({ ...t, telefono: true }))}
                  placeholder={activeTab === 'extranjero' ? (paisOrigen ? "1234567890" : "Seleccione país primero") : "0999999999"}
                  required
                  disabled={activeTab === 'extranjero' && !paisOrigen}
                  style={{
                    flex: 1,
                    borderTopLeftRadius: (activeTab === 'extranjero' && paisOrigen) || activeTab === 'nacional' ? '0' : '4px',
                    borderBottomLeftRadius: (activeTab === 'extranjero' && paisOrigen) || activeTab === 'nacional' ? '0' : '4px',
                    borderLeft: (activeTab === 'extranjero' && paisOrigen) || activeTab === 'nacional' ? 'none' : '1px solid #ddd',
                    opacity: activeTab === 'extranjero' && !paisOrigen ? 0.6 : 1,
                    cursor: activeTab === 'extranjero' && !paisOrigen ? 'not-allowed' : 'text'
                  }}
                />
              </div>
              {activeTab === 'extranjero' && !paisOrigen && (
                <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                  ⓘ Seleccione un país de origen para habilitar el campo de teléfono
                </div>
              )}
              {telefonoError && <div className="error">{telefonoError}</div>}
            </div>

            <div className="field" style={{flex:'1 1 240px'}}>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="••••••"
                required
              />
              {passwordError && <div className="error">{passwordError}</div>}
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={
              !isFormValid || 
              (activeTab === 'nacional' && (cedulaDigits.length !== 10 || cedulaValida !== true || validandoCedula))
            }
          >
            {activeTab === 'nacional' && validandoCedula ? 'Validando cédula...' : 'Crear cuenta'}
          </button>

          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </main>
  );
}
