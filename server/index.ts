import express from "express"
import cors from "cors"
import { fileURLToPath } from "node:url"
import { isProduction } from "./config.ts"
import { db, initDatabase } from "./db.ts"
import { reconcileDatabaseInvariants } from "./reconcile.ts"
import authRoutes from "./routes/auth.ts"
import fleetRoutes from "./routes/fleet.ts"
import reservationsRoutes from "./routes/reservations.ts"
import bookingDocumentsRoutes from "./routes/booking-documents.ts"
import rentalLifecycleRoutes from "./routes/rental-lifecycle.ts"
import extensionsRoutes from "./routes/extensions.ts"
import adminRoutes from "./routes/admin.ts"
import promosRoutes from "./routes/promos.ts"
import maintenanceRoutes from "./routes/maintenance.ts"
import settingsRoutes from "./routes/settings.ts"
import emailRoutes from "./routes/email.ts"
import reviewsRoutes from "./routes/reviews.ts"

const app = express()

await initDatabase()
if (!isProduction && !db.isSupabase) await reconcileDatabaseInvariants()

app.disable("x-powered-by")
app.use(cors())

// Normalize routes if running behind serverless rewrites (e.g. Vercel /api rewrites)
app.use((req, _res, next) => {
  if (req.url.startsWith("/images")) {
    return next()
  }
  if (!/^\/api(?:[/?]|$)/.test(req.url)) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url)
  }
  next()
})

// Global Cache-Busting Middleware for API Routes
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
  res.setHeader("Surrogate-Control", "no-store")
  next()
})
app.use(express.json({ limit: "4mb" }))

const publicImagesDir = fileURLToPath(new URL("../public/images", import.meta.url))
app.use(["/images", "/api/images"], express.static(publicImagesDir, { maxAge: "1d" }))

// Public Health Check Endpoint (With Positive Database Identification)
app.get(["/api", "/api/health"], async (_req, res) => {
  try {
    await db.get("SELECT 1")
  } catch {
    return res.status(503).json({ status: "unavailable", service: "Pit Stop Car Hire API" })
  }
  res.json({
    status: "ok",
    service: "Pit Stop Car Hire API",
    supabase: db.isSupabase,
    database: {
      active: db.isSupabase ? "supabase" : "sqlite",
      host: db.activeHost || null,
      name: db.activeDbName || null,
    },
    environment: isProduction ? "production" : "staging",
    timestamp: new Date().toISOString(),
  })
})

app.use(
  "/api",
  authRoutes,
  fleetRoutes,
  reservationsRoutes,
  bookingDocumentsRoutes,
  rentalLifecycleRoutes,
  extensionsRoutes,
  adminRoutes,
  promosRoutes,
  maintenanceRoutes,
  settingsRoutes,
  emailRoutes,
  reviewsRoutes,
)

app.use("/api", (_req, res) => {
  res.status(404).json({ success: false, error: "API route not found." })
})

// Global JSON Error Handler (Guarantees all backend errors return JSON, not HTML)
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Backend Error]", err?.message || err)
  if (res.headersSent) {
    return next(err)
  }
  const status = err?.status || 500
  return res.status(status).json({
    success: false,
    error: status >= 500 ? "Internal server error occurred." : err?.message,
  })
})

export default app
