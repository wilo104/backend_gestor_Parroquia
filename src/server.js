// --------------------
// 📦 DEPENDENCIAS
// --------------------
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

// --------------------
// ⚙️ CONFIGURACIÓN BASE
// --------------------
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
const prisma = new PrismaClient();

// --------------------
// 🌐 CORS (whitelist)
//    Puedes sobrescribir orígenes con la env FRONTEND_ORIGINS
//    ej: FRONTEND_ORIGINS="http://localhost:4200,https://frontend-gestor-parroquia.vercel.app"
// --------------------
const defaultOrigins = [
  "http://localhost:4200",
  
  "https://frontend-gestor-parroquia.vercel.app",
];

const whitelist = (process.env.FRONTEND_ORIGINS
  ? process.env.FRONTEND_ORIGINS.split(",")
  : defaultOrigins
).map((s) => s.trim()).filter(Boolean);

// Si usas JWT por header (sin cookies), deja false. Si usas cookies, true + cookies SameSite=None; Secure
const USE_CREDENTIALS = false;

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin || whitelist.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: USE_CREDENTIALS,
  })
);

// ✅ Responder preflight correctamente
app.options("*", cors());

// 📦 Body parser JSON
app.use(express.json());

// --------------------
// 🩺 Healthcheck
// --------------------
app.get("/api/health", (_, res) => res.json({ ok: true }));

// --------------------
// 🔒 Middleware verifyToken
// --------------------
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "Token requerido" });

  try {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

// --------------------
// 👤 AUTH
// --------------------
app.post("/api/register", async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: { nombre, email, password: hashed, rol },
    });
    res.json(user);
  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({ message: "Error interno al registrar usuario" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Validación básica
    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son requeridos" });
    }

    // 2) Buscar usuario
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Usuario no existe" });

    // 3) Verificar password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // 4) Verificar secreto JWT
    if (!process.env.JWT_SECRET) {
      console.error("⚠️ JWT_SECRET no está definido en el entorno");
      return res.status(500).json({ message: "Configuración inválida del servidor" });
    }

    // 5) Firmar token
    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ token, rol: user.rol, nombre: user.nombre });
  } catch (error) {
    console.error("❌ Error en login:", error);
    return res.status(500).json({ message: "Error interno en login" });
  }
});


// --------------------
// 💰 INGRESOS
// --------------------
app.get("/api/ingresos", verifyToken, async (_, res) => {
  const ingresos = await prisma.ingreso.findMany({ orderBy: { fecha: "desc" } });
  res.json(ingresos);
});

app.post("/api/ingresos", verifyToken, async (req, res) => {
  try {
    const { categoria, descripcion, monto, fecha } = req.body;
    const ingreso = await prisma.ingreso.create({
      data: {
        categoria,
        descripcion,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
      },
    });
    res.json(ingreso);
  } catch (error) {
    console.error("❌ Error creando ingreso:", error);
    res.status(500).json({ message: "Error interno al crear ingreso" });
  }
});

app.put("/api/ingresos/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, descripcion, monto, fecha } = req.body;
    const ingreso = await prisma.ingreso.update({
      where: { id: parseInt(id) },
      data: {
        categoria,
        descripcion,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
      },
    });
    res.json(ingreso);
  } catch (error) {
    console.error("❌ Error actualizando ingreso:", error);
    res.status(500).json({ message: "Error interno al actualizar ingreso" });
  }
});

app.delete("/api/ingresos/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ingreso.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Ingreso eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando ingreso:", error);
    res.status(500).json({ message: "Error interno al eliminar ingreso" });
  }
});

// --------------------
// 💸 EGRESOS
// --------------------
app.get("/api/egresos", verifyToken, async (_, res) => {
  const egresos = await prisma.egreso.findMany({ orderBy: { fecha: "desc" } });
  res.json(egresos);
});

app.post("/api/egresos", verifyToken, async (req, res) => {
  try {
    const { categoria, descripcion, monto, fecha } = req.body;
    const egreso = await prisma.egreso.create({
      data: {
        categoria,
        descripcion,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
      },
    });
    res.json(egreso);
  } catch (error) {
    console.error("❌ Error creando egreso:", error);
    res.status(500).json({ message: "Error interno al crear egreso" });
  }
});

app.put("/api/egresos/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, descripcion, monto, fecha } = req.body;
    const egreso = await prisma.egreso.update({
      where: { id: parseInt(id) },
      data: {
        categoria,
        descripcion,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
      },
    });
    res.json(egreso);
  } catch (error) {
    console.error("❌ Error actualizando egreso:", error);
    res.status(500).json({ message: "Error interno al actualizar egreso" });
  }
});

app.delete("/api/egresos/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.egreso.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Egreso eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando egreso:", error);
    res.status(500).json({ message: "Error interno al eliminar egreso" });
  }
});

// --------------------
// 📊 REPORTES
// --------------------
app.get("/api/reportes/resumen", verifyToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = new Date(from);
      if (to) where.fecha.lte = new Date(to + "T23:59:59.999Z");
    }

    const ingresos = await prisma.ingreso.aggregate({ _sum: { monto: true }, where });
    const egresos = await prisma.egreso.aggregate({ _sum: { monto: true }, where });

    res.json({
      totalIngresos: ingresos._sum.monto ?? 0,
      totalEgresos: egresos._sum.monto ?? 0,
      balance: (ingresos._sum.monto ?? 0) - (egresos._sum.monto ?? 0),
    });
  } catch (error) {
    console.error("❌ Error en /reportes/resumen:", error);
    res.status(500).json({ message: "Error interno en reportes" });
  }
});

app.get("/api/reportes/ingresos-por-categoria", verifyToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = new Date(from);
      if (to) where.fecha.lte = new Date(to + "T23:59:59.999Z");
    }

    const data = await prisma.ingreso.groupBy({
      by: ["categoria"],
      _sum: { monto: true },
      where,
    });

    res.json(data.map((d) => ({ categoria: d.categoria, total: d._sum.monto ?? 0 })));
  } catch (error) {
    console.error("❌ Error en /reportes/ingresos-por-categoria:", error);
    res.status(500).json({ message: "Error interno en reportes" });
  }
});

app.get("/api/reportes/egresos-por-categoria", verifyToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = new Date(from);
      if (to) where.fecha.lte = new Date(to + "T23:59:59.999Z");
    }

    const data = await prisma.egreso.groupBy({
      by: ["categoria"],
      _sum: { monto: true },
      where,
    });

    res.json(data.map((d) => ({ categoria: d.categoria, total: d._sum.monto ?? 0 })));
  } catch (error) {
    console.error("❌ Error en /reportes/egresos-por-categoria:", error);
    res.status(500).json({ message: "Error interno en reportes" });
  }
});


app.get("/api/health", (_, res) => res.json({ ok: true }));

app.get("/api/debug/config", async (_, res) => {
  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbOk = false;
    console.error("DB check failed:", e);
  }
  res.json({
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    dbOk
  });
});


app.get("/api/debug/db", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ dbOk: true });
  } catch (e) {
    console.error("DB error detail:", e); // se ve en Logs de Koyeb
    res.status(500).json({
      dbOk: false,
      code: e.code || null,
      message: e.message || String(e).slice(0, 500)
    });
  }
});


app.get("/api/debug/env", (_, res) => {
  const mask = (s='') => s.replace(/:\/\/([^:]+):[^@]+@/, '://$1:***@');
  res.json({
    databaseUrl: mask(process.env.DATABASE_URL || ''),
    nodeEnv: process.env.NODE_ENV || 'undefined'
  });
});


// --------------------
// 🚀 SERVIDOR
// --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend en ejecución en el puerto ${PORT}`);
});

// (Opcional) Manejo elegante de cierre
process.on("SIGTERM", async () => {
  console.log("🛑 Cerrando servidor...");
  await prisma.$disconnect();
  process.exit(0);
});
