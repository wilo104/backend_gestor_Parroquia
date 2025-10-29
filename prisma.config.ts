import { defineConfig, env } from "prisma/config";
import * as dotenv from "dotenv";
import path from "path";

// ✅ Cargar el .env desde la raíz del backend
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// 🔍 Mostrar valor para verificar
console.log("🌍 DATABASE_URL actual:", process.env.DATABASE_URL);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Prisma leerá desde la variable ya cargada
    url: env("DATABASE_URL"),
  },
});
