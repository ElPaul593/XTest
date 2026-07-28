import React, { useState, useEffect } from 'react';

/**
 * HoldTimer - Componente de cuenta regresiva para el hold de asiento
 * @param {string} expiresAt - ISO timestamp de expiración
 * @param {number} remainingMs - Milisegundos restantes (alternativo)
 * @param {function} onExpire - Callback cuando el timer llega a 0
 */
const HoldTimer = ({ expiresAt, remainingMs, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        let endTime;

        if (expiresAt) {
            endTime = new Date(expiresAt).getTime();
        } else if (remainingMs) {
            endTime = Date.now() + remainingMs;
        } else {
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, endTime - now);
            setTimeLeft(diff);

            if (diff <= 0 && onExpire) {
                onExpire();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, remainingMs, onExpire]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getColorClass = () => {
        if (timeLeft <= 30000) return 'timer-critical'; // < 30s
        if (timeLeft <= 60000) return 'timer-warning';  // < 1min
        return 'timer-normal';
    };

    return (
        <div className={`hold-timer ${getColorClass()}`}>
            <span className="timer-icon">⏱</span>
            <span className="timer-value">{formatTime(timeLeft)}</span>
        </div>
    );
};

// Estilos inline para el timer (o agregar a CSS)
const styles = `
.hold-timer {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: bold;
    font-family: monospace;
    font-size: 16px;
}

.timer-normal {
    background: #d4edda;
    color: #155724;
}

.timer-warning {
    background: #fff3cd;
    color: #856404;
}

.timer-critical {
    background: #f8d7da;
    color: #721c24;
    animation: blink 0.5s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.timer-icon {
    font-size: 18px;
}
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

export default HoldTimer;
