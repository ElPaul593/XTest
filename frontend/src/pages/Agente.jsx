import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QrScanner from '../components/QrScanner';
import {
  getRutasAsignadas,
  getPasajeros,
  verificarBoleto,
  togglePasajero
} from '../services/agente';
import { AlertPopup } from '../components/Popup';
import Icon from '../components/Icon';

/**
 * Panel del Agente de Turismo.
 * - Lista las rutas asignadas con conteo de pasajeros / verificados / pendientes.
 * - Permite escanear el QR del boleto (cámara) o ingresar el código manualmente.
 * - Control de abordaje por nombre: ver quién subió y quién falta, con toggle manual.
 */
export default function Agente() {
  const [rutas, setRutas] = useState([]);
  const [fallback, setFallback] = useState(false);
  const [loadingRutas, setLoadingRutas] = useState(true);
  const [errorRutas, setErrorRutas] = useState(null);

  const [selectedRuta, setSelectedRuta] = useState(null);
  const [pasData, setPasData] = useState(null);
  const [loadingPas, setLoadingPas] = useState(false);
  const [search, setSearch] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

  const loadRutas = useCallback(async () => {
    try {
      setLoadingRutas(true);
      setErrorRutas(null);
      const data = await getRutasAsignadas();
      setRutas(data.rutas || []);
      setFallback(!!data.fallback);
    } catch (e) {
      setErrorRutas(e.message);
    } finally {
      setLoadingRutas(false);
    }
  }, []);

  useEffect(() => { loadRutas(); }, [loadRutas]);

  const openRuta = useCallback(async (rutaId) => {
    try {
      setSelectedRuta(rutaId);
      setLoadingPas(true);
      setSearch('');
      const data = await getPasajeros(rutaId);
      setPasData(data);
    } catch (e) {
      setPasData(null);
      /**
       * #33BUG — Avisos con el diálogo nativo del navegador en lugar de una ventana
       * emergente de la aplicación.
       *
       * Esta pantalla usa 2 llamadas nativas. Dos `alert` de error en la verificación de boletos por QR, justo cuando el agente tiene el móvil en la mano y necesita leer el motivo con claridad.
       *
       * Tres problemas concretos:
       *
       *  1. `alert()` y `confirm()` bloquean el hilo principal: mientras el diálogo
       *     está abierto, React no puede repintar ni se ejecutan los temporizadores.
       *     En las pantallas de asientos eso congela el contador del hold.
       *  2. El navegador los pinta con su propio estilo, ajeno al negro + amarillo del
       *     proyecto, y antepone el dominio ("localhost:3000 dice…").
       *  3. No admiten formato ni contenido enriquecido, así que los mensajes largos
       *     se apelmazan y los saltos de línea con `\n` se ven de forma distinta en
       *     cada navegador.
       *
       * Sustitución disponible: `components/Popup.jsx` (`AlertPopup` para avisar,
       * `ConfirmPopup` para confirmar) junto al hook `hooks/useFeedback.js`. Se
       * renderizan con `createPortal` sobre `document.body` y en la capa `--z-modal`,
       * por encima del navbar fijo. Ya están aplicados en `LoginForm`, `Profile`,
       * `Dashboard` y `admin/AdminUsers` y pueden servir de referencia.
       *
       * NO se corrige aquí por indicación expresa: solo se documenta.
       */
      setPopupMessage({ title: 'No se pudo cargar la ruta', message: e.message, variant: 'error' });
    } finally {
      setLoadingPas(false);
    }
  }, []);

  const refreshPasajeros = useCallback(async () => {
    if (!selectedRuta) return;
    try {
      const data = await getPasajeros(selectedRuta);
      setPasData(data);
    } catch (_) { /* noop */ }
  }, [selectedRuta]);

  const handleVerificar = useCallback(async (codigo) => {
    const value = String(codigo || '').trim();
    if (!value) return;
    try {
      setVerifying(true);
      const result = await verificarBoleto(value);
      setScanResult(result);
      setScannerOpen(false);
      setManualCode('');
      // Refrescar listas para reflejar el nuevo estado.
      await loadRutas();
      if (result.ruta && result.ruta.id === selectedRuta) {
        await refreshPasajeros();
      }
    } catch (e) {
      setScanResult({ estado: 'ERROR', mensaje: e.message });
    } finally {
      setVerifying(false);
    }
  }, [loadRutas, refreshPasajeros, selectedRuta]);

  const handleToggle = useCallback(async (reservaId, nextVerified) => {
    if (!selectedRuta) return;
    try {
      await togglePasajero(selectedRuta, reservaId, nextVerified);
      await refreshPasajeros();
      await loadRutas();
    } catch (e) {
      setPopupMessage({ title: 'No se pudo actualizar el abordaje', message: e.message, variant: 'error' });
    }
  }, [selectedRuta, refreshPasajeros, loadRutas]);

  const pasajerosFiltrados = useMemo(() => {
    if (!pasData) return [];
    const q = search.trim().toLowerCase();
    if (!q) return pasData.pasajeros;
    return pasData.pasajeros.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(q) ||
        (p.cedula || '').toLowerCase().includes(q) ||
        String(p.asientos || []).includes(q)
    );
  }, [pasData, search]);

  return (
    <main style={S.page}>
      <AlertPopup
        open={Boolean(popupMessage)}
        onClose={() => setPopupMessage(null)}
        title={popupMessage?.title}
        message={popupMessage?.message}
        variant={popupMessage?.variant}
      />
      <div style={S.header}>
        <h1 style={S.h1}><Icon name="qr" size={22} /> Verificación de Boletos</h1>
        <p style={S.subtitle}>Agente de Turismo · escanea el QR y controla el abordaje</p>
      </div>

      {/* ── Panel de escaneo ─────────────────────────────────────── */}
      <section style={S.card}>
        <h2 style={S.h2}>Escanear boleto (QR)</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button
            style={scannerOpen ? S.btnGhost : S.btnPrimary}
            onClick={() => setScannerOpen((v) => !v)}
          >
            {scannerOpen ? 'Detener cámara' : <><Icon name="camera" size={16} /> Abrir cámara</>}
          </button>
        </div>

        {scannerOpen && (
          <QrScanner active={scannerOpen} onScan={handleVerificar} />
        )}

        <div style={S.divider}><span style={S.dividerText}>o ingresa el código manualmente</span></div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            style={S.input}
            placeholder="Pega el contenido del QR o el código del boleto"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerificar(manualCode)}
          />
          <button
            style={S.btnPrimary}
            disabled={verifying || !manualCode.trim()}
            onClick={() => handleVerificar(manualCode)}
          >
            {verifying ? 'Verificando…' : 'Verificar'}
          </button>
        </div>
      </section>

      {/* ── Rutas asignadas ──────────────────────────────────────── */}
      <section style={S.card}>
        <h2 style={S.h2}>Mis rutas asignadas</h2>
        {fallback && (
          <div style={S.infoBox}>
            No tienes rutas asignadas todavía: se muestran todas las rutas para que puedas trabajar.
            Un administrador puede asignarte rutas específicas.
          </div>
        )}
        {loadingRutas ? (
          <p style={S.muted}>Cargando rutas…</p>
        ) : errorRutas ? (
          <div style={S.errorBox}>{errorRutas}</div>
        ) : rutas.length === 0 ? (
          <p style={S.muted}>No hay rutas disponibles.</p>
        ) : (
          <div style={S.rutaGrid}>
            {rutas.map((r) => (
              <button
                key={r.id}
                onClick={() => openRuta(r.id)}
                style={{ ...S.rutaCard, ...(selectedRuta === r.id ? S.rutaCardActive : {}) }}
              >
                <div style={S.rutaTitle}>{r.from} <Icon name="arrow-right" size={14} /> {r.to}</div>
                <div style={S.rutaMeta}>{r.duration || ''}</div>
                <div style={S.badges}>
                  <span style={S.badgeTotal}><Icon name="users" size={12} /> {r.totalPasajeros}</span>
                  <span style={S.badgeOk}><Icon name="check" size={12} /> {r.verificados}</span>
                  <span style={S.badgePend}><Icon name="hourglass" size={12} /> {r.pendientes}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Pasajeros de la ruta seleccionada ────────────────────── */}
      {selectedRuta && (
        <section style={S.card}>
          {loadingPas ? (
            <p style={S.muted}>Cargando pasajeros…</p>
          ) : !pasData ? (
            <p style={S.muted}>No se pudieron cargar los pasajeros.</p>
          ) : (
            <>
              <div style={S.pasHeader}>
                <h2 style={S.h2}>Control de abordaje · {pasData.ruta.from} → {pasData.ruta.to}</h2>
                <div style={S.resumen}>
                  <span style={S.badgeTotal}>Total {pasData.resumen.total}</span>
                  <span style={S.badgeOk}>Abordaron {pasData.resumen.verificados}</span>
                  <span style={S.badgePend}>Faltan {pasData.resumen.pendientes}</span>
                </div>
              </div>

              <input
                style={{ ...S.input, marginBottom: '12px', maxWidth: '320px' }}
                placeholder="Buscar por nombre, cédula o asiento…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {pasajerosFiltrados.length === 0 ? (
                <p style={S.muted}>No hay pasajeros que coincidan.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Pasajero</th>
                        <th style={S.th}>Cédula/Pasaporte</th>
                        <th style={S.th}>Asiento(s)</th>
                        <th style={S.th}>Estado</th>
                        <th style={S.th}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pasajerosFiltrados.map((p) => (
                        <tr key={p.reservaId} style={p.verificado ? S.rowOk : undefined}>
                          <td style={S.td}>{p.nombre}</td>
                          <td style={S.td}>{p.cedula || '—'}</td>
                          <td style={S.td}>{(p.asientos || []).join(', ') || '—'}</td>
                          <td style={S.td}>
                            {p.verificado
                              ? <span style={S.tagOk}><Icon name="check" size={14} /> Abordó</span>
                              : <span style={S.tagPend}><Icon name="hourglass" size={14} /> Falta</span>}
                          </td>
                          <td style={S.td}>
                            {p.verificado ? (
                              <button style={S.btnSmallGhost} onClick={() => handleToggle(p.reservaId, false)}>
                                Desmarcar
                              </button>
                            ) : (
                              <button style={S.btnSmall} onClick={() => handleToggle(p.reservaId, true)}>
                                Marcar abordó
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Resultado de verificación (modal) ────────────────────── */}
      {scanResult && (
        <div style={S.overlay} onClick={() => setScanResult(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', color: scanResult.estado === 'VERIFICADO' ? 'var(--success-ink)' : scanResult.estado === 'YA_VERIFICADO' ? 'var(--warning-ink)' : 'var(--error)' }}>
              <Icon
                size={52}
                name={scanResult.estado === 'VERIFICADO' ? 'check-circle'
                  : scanResult.estado === 'YA_VERIFICADO' ? 'alert'
                  : scanResult.estado === 'CANCELADO' ? 'ban'
                  : 'x-circle'}
              />
            </div>
            <h2 style={{ textAlign: 'center', margin: '8px 0 4px' }}>
              {scanResult.estado === 'VERIFICADO' ? 'Boleto verificado'
                : scanResult.estado === 'YA_VERIFICADO' ? 'Ya verificado'
                : scanResult.estado === 'CANCELADO' ? 'Boleto cancelado'
                : 'No válido'}
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 0 }}>{scanResult.mensaje}</p>

            {scanResult.pasajero && (
              <div style={S.modalInfo}>
                <div><strong>Pasajero:</strong> {scanResult.pasajero}</div>
                {scanResult.cedula && <div><strong>Cédula/Pasaporte:</strong> {scanResult.cedula}</div>}
                {scanResult.ruta && <div><strong>Ruta:</strong> {scanResult.ruta.from} → {scanResult.ruta.to}</div>}
                {scanResult.asientos && <div><strong>Asiento(s):</strong> {(scanResult.asientos || []).join(', ') || '—'}</div>}
                {scanResult.pertenece === false && scanResult.ruta && (
                  <div style={{ color: 'var(--warning-ink)', marginTop: '6px' }}>
                    <Icon name="alert" size={14} /> Esta ruta no está entre tus rutas asignadas.
                  </div>
                )}
              </div>
            )}

            <button style={{ ...S.btnPrimary, width: '100%', marginTop: '14px' }} onClick={() => setScanResult(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Estilos ─────────────────────────────────────────────────────────────────
const S = {
  page: { maxWidth: '900px', margin: '0 auto', padding: '20px 16px 60px' },
  header: { marginBottom: '18px' },
  h1: { margin: '0 0 4px', fontSize: '24px' },
  subtitle: { margin: 0, color: '#64748B', fontSize: '14px' },
  card: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', marginBottom: '18px', boxShadow: 'var(--glass-shadow)' },
  h2: { margin: '0 0 12px', fontSize: '17px' },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  input: { flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--glass-bg-soft)', color: 'var(--text)' },
  btnPrimary: { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  btnGhost: { padding: '10px 16px', background: 'var(--glass-bg-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  btnSmall: { padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
  btnSmallGhost: { padding: '6px 12px', background: 'var(--glass-bg-soft)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  divider: { textAlign: 'center', borderTop: '1px solid var(--border)', margin: '16px 0', position: 'relative' },
  dividerText: { position: 'relative', top: '-10px', background: 'var(--surface)', padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px' },
  infoBox: { background: 'rgba(14, 165, 233, 0.16)', border: '1px solid rgba(56, 189, 248, 0.5)', color: 'var(--info-ink)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '12px' },
  errorBox: { background: 'rgba(239, 68, 68, 0.16)', border: '1px solid rgba(248, 113, 113, 0.52)', color: 'var(--error-ink)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' },
  rutaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' },
  rutaCard: { textAlign: 'left', background: 'var(--glass-bg-soft)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', cursor: 'pointer', transition: 'all 0.15s' },
  rutaCardActive: { borderColor: 'var(--accent)', boxShadow: '0 0 0 2px var(--glass-accent)', background: 'var(--glass-accent)' },
  rutaTitle: { fontWeight: 700, fontSize: '15px', marginBottom: '2px' },
  rutaMeta: { color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' },
  badges: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  badgeTotal: { background: 'var(--glass-bg-hover)', color: 'var(--text)', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 },
  badgeOk: { background: 'rgba(34, 197, 94, 0.16)', color: 'var(--success-ink)', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 },
  badgePend: { background: 'rgba(255, 167, 38, 0.16)', color: 'var(--warning-ink)', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 },
  pasHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' },
  resumen: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' },
  td: { padding: '10px 8px', borderBottom: '1px solid var(--border)' },
  rowOk: { background: 'rgba(34, 197, 94, 0.1)' },
  tagOk: { color: 'var(--success-ink)', fontWeight: 600 },
  tagPend: { color: 'var(--warning-ink)', fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' },
  modal: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '100%' },
  modalInfo: { background: 'var(--glass-bg-soft)', borderRadius: '10px', padding: '12px', marginTop: '12px', fontSize: '14px', lineHeight: 1.7 }
};
