FROM node:20
WORKDIR /app

# Evita copiar node_modules desde tu máquina
COPY package*.json ./
RUN npm ci

# Copia Prisma y código fuente JS
COPY prisma ./prisma/
COPY src ./src/

# Genera Prisma Client
RUN npx prisma generate

# Exponer puerto solo informativo (Koyeb inyecta PORT)
EXPOSE 3000

# Aplica migraciones al inicio y arranca tu servidor JS
# Cambia 'src/index.js' por tu archivo real (donde haces app.listen)
CMD npx prisma migrate deploy && node src/index.js
