FROM node:20
WORKDIR /app

# 1) Instala deps con caché eficiente
COPY package*.json ./
RUN npm ci

# 2) Copia Prisma y código
COPY prisma ./prisma/
COPY src ./src/

# 3) Genera Prisma Client (NO necesita conectarse a la DB)
RUN npx prisma generate

# 4) Expón (informativo); Koyeb inyecta PORT
EXPOSE 3000

# 5) Arranque: aplica migraciones y levanta el server
#    (ajusta si tu entrypoint es distinto)
CMD npx prisma migrate deploy && node src/server.js
