# Usa Node 20 (versión estable y liviana)
FROM node:20-alpine

# Crea y usa la carpeta de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala dependencias
RUN npm ci

# Copia la carpeta prisma y genera cliente
COPY prisma ./prisma
RUN npx prisma generate

# Copia todo el código restante (server.js, src/, etc.)
COPY . .

# Expone el puerto (importante para Koyeb)
ENV PORT=4000
EXPOSE 4000

# Comando que se ejecuta al arrancar el contenedor
CMD ["npm", "start"]
