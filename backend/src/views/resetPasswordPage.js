/**
 * Página de restablecimiento de contraseña servida por el backend.
 *
 * El enlace del correo apunta al backend (`/api/auth/reset-password/:token`), así
 * que el token se valida en el servidor ANTES de renderizar el formulario: un
 * enlace caducado nunca llega a mostrar la pantalla de cambio de contraseña.
 *
 * La página es autocontenida (CSS y JS inline, sin CDN) para que funcione aunque
 * el frontend esté caído o se despliegue en otro dominio. Mantiene la identidad
 * visual del proyecto: negro + amarillo con glassmorphism.
 */

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BASE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --bg: #0a0a0a;
    --text: #ffffff;
    --text-muted: #cfcfcf;
    --accent: #ffd700;
    --accent-hover: #e6c200;
    --error: #ff4444;
    --success: #28a745;
    --glass-bg: rgba(26, 26, 26, 0.55);
    --glass-border: rgba(255, 255, 255, 0.12);
    --glass-blur: 18px;
  }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: var(--bg);
    color: var(--text);
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    position: relative;
    overflow-x: hidden;
  }
  /* Manchas de color de fondo: sin ellas el desenfoque del cristal no se percibe. */
  body::before, body::after {
    content: "";
    position: fixed;
    border-radius: 50%;
    filter: blur(90px);
    z-index: 0;
    pointer-events: none;
  }
  body::before {
    width: 420px; height: 420px;
    background: rgba(255, 215, 0, 0.18);
    top: -140px; left: -120px;
  }
  body::after {
    width: 380px; height: 380px;
    background: rgba(255, 215, 0, 0.1);
    bottom: -160px; right: -120px;
  }
  .glass-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 440px;
    padding: 32px;
    border-radius: 16px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(150%);
    backdrop-filter: blur(var(--glass-blur)) saturate(150%);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  .brand {
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  h1 { margin: 0 0 8px; font-size: 22px; font-weight: 700; }
  p.lead { margin: 0 0 24px; color: var(--text-muted); font-size: 14px; line-height: 21px; }
  label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; }
  input[type="password"] {
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 16px;
    font-size: 14px;
    color: var(--text);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }
  input[type="password"]:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.18);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 13px 18px;
    font-size: 15px;
    font-weight: 700;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    background: var(--accent);
    color: var(--bg);
    transition: background-color .2s, opacity .2s, transform .15s;
  }
  .btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
  .btn:disabled { opacity: .55; cursor: not-allowed; }
  .alert {
    padding: 12px 14px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 20px;
    margin-bottom: 18px;
    border: 1px solid var(--glass-border);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }
  .alert-error { background: rgba(255, 68, 68, 0.14); border-color: rgba(255, 68, 68, 0.4); color: #ffd4d4; }
  .alert-ok { background: rgba(40, 167, 69, 0.14); border-color: rgba(40, 167, 69, 0.4); color: #ccf3d6; }
  .hint { color: #8a8a8a; font-size: 12px; line-height: 19px; margin-top: 18px; }
  .hint a { color: var(--accent); }
  @media (max-width: 420px) { .glass-card { padding: 24px 20px; } }
`.trim();

/**
 * El `nonce` lo genera el middleware de CSP de la ruta y se propaga a las
 * etiquetas `<style>` y `<script>` inline. Sin él, la CSP de la página las
 * bloquearía (ver `#15BUG` y el middleware en `routes/authRoutes.js`).
 */
function layout({ title, body, nonce }) {
  const attrNonce = nonce ? ` nonce="${escapeHtml(nonce)}"` : '';

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<style${attrNonce}>${BASE_STYLES}</style>
</head>
<body>
<main class="glass-card">
${body}
</main>
</body>
</html>`;
}

/**
 * Formulario de nueva contraseña. El token va en un campo oculto y se envía por
 * POST, nunca en la URL del submit, para que no acabe en el historial ni en los
 * logs del proxy.
 */
exports.renderResetForm = ({ token, nombre, appName, minutosValidez, frontendUrl, nonce }) => {
  const attrNonce = nonce ? ` nonce="${escapeHtml(nonce)}"` : '';
  const saludo = nombre
    ? `Hola ${escapeHtml(nombre)}, elige tu nueva contraseña.`
    : 'Elige tu nueva contraseña.';

  const body = `
<div class="brand">${escapeHtml(appName)}</div>
<h1>Restablecer contraseña</h1>
<p class="lead">${saludo} El enlace caduca ${escapeHtml(String(minutosValidez))} minutos después de haberlo solicitado y solo puede usarse una vez.</p>

<div id="feedback" class="alert alert-error" style="display:none" role="alert"></div>

<form id="reset-form" novalidate>
  <input type="hidden" id="token" value="${escapeHtml(token)}" />

  <label for="password">Nueva contraseña</label>
  <input type="password" id="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" required />

  <label for="confirm">Repetir contraseña</label>
  <input type="password" id="confirm" autocomplete="new-password" placeholder="Vuelve a escribirla" required />

  <button class="btn" type="submit" id="submit-btn">Guardar contraseña</button>
</form>

<p class="hint">¿Terminaste? Vuelve a <a href="${escapeHtml(frontendUrl)}/login">iniciar sesión</a>.</p>

<script${attrNonce}>
(function () {
  var form = document.getElementById('reset-form');
  var feedback = document.getElementById('feedback');
  var btn = document.getElementById('submit-btn');

  function show(message, ok) {
    feedback.textContent = message;
    feedback.className = 'alert ' + (ok ? 'alert-ok' : 'alert-error');
    feedback.style.display = 'block';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var password = document.getElementById('password').value;
    var confirm = document.getElementById('confirm').value;

    if (password.length < 6) {
      show('La contraseña debe tener al menos 6 caracteres.', false);
      return;
    }
    if (password !== confirm) {
      show('Las dos contraseñas no coinciden.', false);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Guardando…';

    fetch(window.location.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ password: password })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { status: res.status, data: data }; });
      })
      .then(function (result) {
        if (result.status >= 200 && result.status < 300) {
          form.style.display = 'none';
          show(result.data.message || 'Contraseña actualizada correctamente.', true);
          return;
        }
        show(result.data.message || result.data.error || 'No se pudo actualizar la contraseña.', false);
        btn.disabled = false;
        btn.textContent = 'Guardar contraseña';
      })
      .catch(function () {
        show('No se pudo contactar con el servidor. Inténtalo de nuevo.', false);
        btn.disabled = false;
        btn.textContent = 'Guardar contraseña';
      });
  });
})();
</script>`.trim();

  return layout({ title: `${appName} · Restablecer contraseña`, body, nonce });
};

/** Pantalla para un enlace caducado, ya usado o manipulado. */
exports.renderInvalidToken = ({ appName, frontendUrl, nonce }) => {
  const body = `
<div class="brand">${escapeHtml(appName)}</div>
<h1>Enlace no válido</h1>
<div class="alert alert-error" role="alert">
  Este enlace de recuperación ya caducó, fue utilizado o no es correcto.
</div>
<p class="lead">Por seguridad cada enlace sirve una sola vez y durante un tiempo limitado. Solicita uno nuevo desde la pantalla de inicio de sesión.</p>
<a class="btn" href="${escapeHtml(frontendUrl)}/login" style="text-decoration:none">Ir a iniciar sesión</a>`.trim();

  return layout({ title: `${appName} · Enlace no válido`, body, nonce });
};
