FROM node:20
WORKDIR /app

# 1) instalar deps (cache-friendly)
COPY package*.json ./
RUN npm ci

# 2) copiar prisma y el código
COPY prisma ./prisma/
COPY src ./src/

# 3) generar prisma client (no toca DB)
RUN npx prisma generate

# 4) puerto (informativo para ti, Koyeb inyecta PORT)
EXPOSE 3000

# 5) aplicar migraciones al inicio y arrancar
CMD npx prisma migrate deploy && node src/server.js
