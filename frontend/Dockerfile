# ---- Frontend SPA (React + Vite) servido por nginx ----

# 1) Build de produccion. VITE_API_URL se inyecta en build (Vite lo hornea en el bundle).
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_SEAT_API_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SEAT_API_URL=$VITE_SEAT_API_URL
RUN npm run build

# 2) Servir los estaticos con nginx (config con fallback SPA)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
