FROM node:20
WORKDIR /app

# 1) Manifiestos + Prisma antes de instalar deps
COPY package*.json ./
COPY prisma ./prisma/

# 2) Instala deps SIN ejecutar postinstall (evita que 'prisma generate' falle)
RUN npm ci --ignore-scripts

# 3) Genera Prisma Client (ya existe /prisma y node_modules)
RUN npx prisma generate

# 4) Copia el código fuente
COPY src ./src/

# 5) No fijes un puerto; Koyeb inyecta PORT
EXPOSE 3000

# 6) Aplica migraciones en cada arranque y levanta el server
CMD npx prisma migrate deploy && node src/server.js
