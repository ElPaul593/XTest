# ---- Backend API (Express + Mongoose) ----
# Imagen Debian slim (glibc) para que bcrypt use binarios precompilados sin fallar.

# 1) Instalar solo dependencias de produccion
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# 2) Imagen final
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
# Render/host define PORT en runtime; 5000 es solo el valor por defecto local.
ENV PORT=5000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ejecutar como usuario sin privilegios
USER node

EXPOSE 5000

# Healthcheck: el endpoint /health responde { ok: true }
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
