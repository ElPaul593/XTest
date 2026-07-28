import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/users';
import { getRutas } from '../services/rutas';
import BusSeatSelector from '../components/BusSeatSelector';
import './SeatBooking.css';

const SeatBooking = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [rutas, setRutas] = useState([]);
    const [selectedRuta, setSelectedRuta] = useState('');
    const [selectedFecha, setSelectedFecha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSelector, setShowSelector] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        loadRutas();
        loadUser();
    }, [token, navigate]);

    const loadUser = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
        } catch (e) {
            console.warn("User not logged in or error:", e);
        }
    };

    const loadRutas = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRutas();
            setRutas(Array.isArray(response) ? response : response.data || []);
        } catch (err) {
            setError('Error al cargar rutas: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    const handleReservarClick = () => {
        if (!selectedRuta || !selectedFecha) {
            alert('Por favor selecciona una ruta y fecha primero');
            return;
        }
        setShowSelector(true);
    };

    const handleReservationComplete = (result) => {
        console.log('Reserva completada:', result);
        setShowSelector(false);
        // Opcional: redirigir a mis reservas
        // navigate('/reservas');
    };

    if (!token) return null;

    return (
        <div className="seat-booking-page">
            <div className="booking-header">
                <h1>🚌 Reserva de Asientos</h1>
                <p>Selecciona tu ruta, fecha y asiento preferido</p>
            </div>

            <div className="booking-container">
                {!showSelector ? (
                    <>
                        <div className="booking-form">
                            <div className="form-group">
                                <label htmlFor="ruta">Ruta:</label>
                                <select
                                    id="ruta"
                                    value={selectedRuta}
                                    onChange={(e) => setSelectedRuta(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="">-- Selecciona una ruta --</option>
                                    {rutas.map((ruta) => (
                                        <option key={ruta._id || ruta.id} value={ruta._id || ruta.id}>
                                            {ruta.from} ➜ {ruta.to} (${ruta.price})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="fecha">Fecha de Viaje:</label>
                                <input
                                    type="date"
                                    id="fecha"
                                    value={selectedFecha}
                                    onChange={(e) => setSelectedFecha(e.target.value)}
                                    min={today}
                                />
                            </div>
                        </div>

                        {error && <div className="error-banner">{error}</div>}

                        <div className="action-section">
                            <button
                                className="btn-reservar-ahora"
                                onClick={handleReservarClick}
                                disabled={!selectedRuta || !selectedFecha || loading}
                            >
                                🎫 Reservar Ahora
                            </button>
                        </div>

                        {selectedRuta && selectedFecha && (
                            <div className="info-preview">
                                <p>
                                    <strong>Ruta seleccionada:</strong> {rutas.find(r => (r._id || r.id) === selectedRuta)?.from} ➜ {rutas.find(r => (r._id || r.id) === selectedRuta)?.to}
                                </p>
                                <p>
                                    <strong>Fecha:</strong> {selectedFecha}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="selector-modal">
                        <BusSeatSelector
                            rutaId={selectedRuta}
                            fecha={selectedFecha}
                            onClose={() => setShowSelector(false)}
                            onReservationComplete={handleReservationComplete}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeatBooking;
