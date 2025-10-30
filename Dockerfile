FROM node:20
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --ignore-scripts
RUN npx prisma generate

COPY src ./src/

EXPOSE 3000
CMD npx prisma migrate deploy && node src/server.js
