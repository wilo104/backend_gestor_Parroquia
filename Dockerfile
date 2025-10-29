FROM node:20

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src/

RUN npm install
RUN npx prisma generate

ENV PORT=8000
EXPOSE 8000

CMD ["npm", "start"]
