import { Router } from "express"
import { db } from "../db.ts"
import { requireAdmin } from "../auth.ts"
import { formatMaintenanceRow } from "../serializers.ts"

const router = Router()

// GET all maintenance logs with pagination and filtering (Admin Protected)
router.get("/maintenance", requireAdmin, async (req, res) => {
  try {
    const rawAll = req.query.all === "true" || req.query.raw === "true"
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10))
    const offset = (page - 1) * limit
    const carId = req.query.carId ? String(req.query.carId).trim() : null
    const status = req.query.status ? String(req.query.status).trim() : null
    const search = req.query.search ? String(req.query.search).trim() : null

    let whereConditions: string[] = []
    let params: any[] = []

    if (carId) {
      whereConditions.push("m.car_id = ?")
      params.push(carId)
    }

    if (status) {
      whereConditions.push("m.status = ?")
      params.push(status)
    }

    if (search) {
      whereConditions.push(
        "(LOWER(v.name) LIKE ? OR LOWER(m.service_type) LIKE ? OR LOWER(m.id) LIKE ?)",
      )
      const wildcard = `%${search.toLowerCase()}%`
      params.push(wildcard, wildcard, wildcard)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    if (rawAll) {
      const rows = await db
        .prepare(
          `
        SELECT m.*, v.name as car_name
        FROM maintenance_logs m
        LEFT JOIN vehicles v ON m.car_id = v.id
        ${whereClause}
        ORDER BY m.created_at DESC
      `,
        )
        .all(...params)
      return res.json(rows.map(formatMaintenanceRow))
    }

    // Total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.car_id = v.id
      ${whereClause}
    `
    const countRow = await db.prepare(countSql).get(...params)
    const total = Number(countRow?.total || 0)
    const totalPages = Math.ceil(total / limit) || 1

    // Paginated data query
    const dataSql = `
      SELECT m.*, v.name as car_name
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.car_id = v.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `
    const rows = await db.prepare(dataSql).all(...params, limit, offset)
    const data = rows.map(formatMaintenanceRow)

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (err: any) {
    console.error("[Maintenance Logs Error]", err?.message)
    return res.status(500).json({ error: "Failed to retrieve maintenance logs." })
  }
})

// POST create maintenance log
router.post("/maintenance", requireAdmin, async (req, res) => {
  const { carId, serviceType, cost, odometer, date, status, technicianNotes, setVehicleStatus } =
    req.body
  if (!carId || !serviceType) {
    return res.status(400).json({ error: "carId and serviceType are required." })
  }

  const logId = `MNT-${Math.floor(1000 + Math.random() * 9000)}`
  await db
    .prepare(
      `
    INSERT INTO maintenance_logs (id, car_id, service_type, cost, odometer, date, status, technician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      logId,
      carId,
      serviceType,
      Number(cost) || 0,
      Number(odometer) || 15000,
      date || new Date().toISOString().split("T")[0],
      status || "Completed",
      technicianNotes || "",
    )

  // If vehicle should be put in maintenance or returned to available
  if (setVehicleStatus) {
    await db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(setVehicleStatus, carId)
  }

  const created = await db
    .prepare(
      `
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    WHERE m.id = ?
  `,
    )
    .get(logId)

  return res.status(201).json(formatMaintenanceRow(created))
})

// PATCH update maintenance status
router.patch("/maintenance/:id/status", requireAdmin, async (req, res) => {
  const logId = req.params.id
  const { status } = req.body
  if (!status) return res.status(400).json({ error: "Status is required." })

  await db.prepare("UPDATE maintenance_logs SET status = ? WHERE id = ?").run(status, logId)
  const updated = await db
    .prepare(
      `
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    WHERE m.id = ?
  `,
    )
    .get(logId)

  return res.json(formatMaintenanceRow(updated))
})

export default router
