import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QrScanner from '../components/QrScanner';
import {
  getRutasAsignadas,
  getPasajeros,
  verificarBoleto,
  togglePasajero
} from '../services/agente';

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
      alert(e.message);
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
      alert(e.message);
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
      <div style={S.header}>
        <h1 style={S.h1}>🎫 Verificación de Boletos</h1>
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
            {scannerOpen ? 'Detener cámara' : '📷 Abrir cámara'}
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
                <div style={S.rutaTitle}>{r.from} ➜ {r.to}</div>
                <div style={S.rutaMeta}>{r.duration || ''}</div>
                <div style={S.badges}>
                  <span style={S.badgeTotal}>👤 {r.totalPasajeros}</span>
                  <span style={S.badgeOk}>✓ {r.verificados}</span>
                  <span style={S.badgePend}>⏳ {r.pendientes}</span>
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
                <h2 style={S.h2}>Control de abordaje · {pasData.ruta.from} ➜ {pasData.ruta.to}</h2>
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
                              ? <span style={S.tagOk}>✓ Abordó</span>
                              : <span style={S.tagPend}>⏳ Falta</span>}
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
            <div style={{ fontSize: '46px', textAlign: 'center' }}>
              {scanResult.estado === 'VERIFICADO' ? '✅'
                : scanResult.estado === 'YA_VERIFICADO' ? '⚠️'
                : scanResult.estado === 'CANCELADO' ? '⛔'
                : '❌'}
            </div>
            <h2 style={{ textAlign: 'center', margin: '8px 0 4px' }}>
              {scanResult.estado === 'VERIFICADO' ? 'Boleto verificado'
                : scanResult.estado === 'YA_VERIFICADO' ? 'Ya verificado'
                : scanResult.estado === 'CANCELADO' ? 'Boleto cancelado'
                : 'No válido'}
            </h2>
            <p style={{ textAlign: 'center', color: '#555', marginTop: 0 }}>{scanResult.mensaje}</p>

            {scanResult.pasajero && (
              <div style={S.modalInfo}>
                <div><strong>Pasajero:</strong> {scanResult.pasajero}</div>
                {scanResult.cedula && <div><strong>Cédula/Pasaporte:</strong> {scanResult.cedula}</div>}
                {scanResult.ruta && <div><strong>Ruta:</strong> {scanResult.ruta.from} ➜ {scanResult.ruta.to}</div>}
                {scanResult.asientos && <div><strong>Asiento(s):</strong> {(scanResult.asientos || []).join(', ') || '—'}</div>}
                {scanResult.pertenece === false && scanResult.ruta && (
                  <div style={{ color: '#b45309', marginTop: '6px' }}>
                    ⚠️ Esta ruta no está entre tus rutas asignadas.
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
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', marginBottom: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  h2: { margin: '0 0 12px', fontSize: '17px' },
  muted: { color: '#94a3b8', fontSize: '14px' },
  input: { flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' },
  btnPrimary: { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  btnGhost: { padding: '10px 16px', background: '#fff', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  btnSmall: { padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
  btnSmallGhost: { padding: '6px 12px', background: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  divider: { textAlign: 'center', borderTop: '1px solid #e2e8f0', margin: '16px 0', position: 'relative' },
  dividerText: { position: 'relative', top: '-10px', background: '#fff', padding: '0 10px', color: '#94a3b8', fontSize: '12px' },
  infoBox: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '12px' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' },
  rutaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' },
  rutaCard: { textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', cursor: 'pointer', transition: 'all 0.15s' },
  rutaCardActive: { borderColor: '#2563eb', boxShadow: '0 0 0 2px rgba(37,99,235,0.2)', background: '#eff6ff' },
  rutaTitle: { fontWeight: 700, fontSize: '15px', marginBottom: '2px' },
  rutaMeta: { color: '#94a3b8', fontSize: '12px', marginBottom: '10px' },
  badges: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  badgeTotal: { background: '#e2e8f0', color: '#334155', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 },
  badgeOk: { background: '#dcfce7', color: '#15803d', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 },
  badgePend: { background: '#fef9c3', color: '#a16207', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 },
  pasHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' },
  resumen: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px' },
  td: { padding: '10px 8px', borderBottom: '1px solid #f1f5f9' },
  rowOk: { background: '#f0fdf4' },
  tagOk: { color: '#15803d', fontWeight: 600 },
  tagPend: { color: '#a16207', fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' },
  modal: { background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '100%' },
  modalInfo: { background: '#f8fafc', borderRadius: '10px', padding: '12px', marginTop: '12px', fontSize: '14px', lineHeight: 1.7 }
};
