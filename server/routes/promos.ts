import { Router } from "express"
import { db } from "../db.ts"
import { requireAdmin } from "../auth.ts"
import { formatPromoRow } from "../serializers.ts"

const router = Router()

// GET all promo codes (Admin ONLY)
router.get("/promos", requireAdmin, async (req, res) => {
  const rows = await db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC").all()
  return res.json(rows.map(formatPromoRow))
})

// GET all promo codes alias (Admin ONLY)
router.get("/admin/promos", requireAdmin, async (req, res) => {
  const rows = await db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC").all()
  return res.json(rows.map(formatPromoRow))
})

// POST create promo code
router.post("/promos", requireAdmin, async (req, res) => {
  const { code, discountPercent, description, expiryDate } = req.body
  if (!code || !discountPercent) {
    return res.status(400).json({ error: "Promo code and discount percent are required." })
  }

  const normalizedCode = code.trim().toUpperCase()
  const existing = await db
    .prepare("SELECT code FROM promo_codes WHERE code = ?")
    .get(normalizedCode)
  if (existing) {
    return res.status(409).json({ error: "Promo code already exists." })
  }

  await db
    .prepare(
      `
    INSERT INTO promo_codes (code, discount_percent, description, is_active, expiry_date, usage_count)
    VALUES (?, ?, ?, 1, ?, 0)
  `,
    )
    .run(
      normalizedCode,
      Number(discountPercent),
      description || "Promotional discount rule",
      expiryDate || "2026-12-31",
    )

  const created = await db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(normalizedCode)
  return res.status(201).json(formatPromoRow(created))
})

// PATCH toggle promo active status
router.patch<{ code: string }>("/promos/:code/toggle", requireAdmin, async (req, res) => {
  const promoCode = req.params.code.toUpperCase()
  const promo = (await db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(promoCode)) as any
  if (!promo) {
    return res.status(404).json({ error: "Promo code not found." })
  }

  const newActive = promo.is_active ? 0 : 1
  await db.prepare("UPDATE promo_codes SET is_active = ? WHERE code = ?").run(newActive, promoCode)

  const updated = await db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(promoCode)
  return res.json(formatPromoRow(updated))
})

// DELETE promo code
router.delete<{ code: string }>("/promos/:code", requireAdmin, async (req, res) => {
  const promoCode = req.params.code.toUpperCase()
  await db.prepare("DELETE FROM promo_codes WHERE code = ?").run(promoCode)
  return res.json({
    success: true,
    message: `Promo code ${promoCode} deleted.`,
  })
})

// POST Validate Promo Code (Customer Checkout) - Read-only check, does NOT prematurely increment usage
router.post("/promos/validate", async (req, res) => {
  const { code } = req.body
  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(200).json({ valid: false, message: "Please provide a privilege code." })
  }

  const promoCode = code.trim().toUpperCase()
  const promo = (await db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(promoCode)) as any

  if (!promo) {
    return res.status(200).json({ valid: false, message: "Privilege code not recognized." })
  }

  if (!promo.is_active) {
    return res.status(200).json({
      valid: false,
      message: "This privilege code has been deactivated.",
    })
  }

  if (promo.expiry_date) {
    const expiryTime = Date.parse(promo.expiry_date)
    if (!isNaN(expiryTime) && expiryTime < Date.now()) {
      return res.status(200).json({ valid: false, message: "This privilege code has expired." })
    }
  }

  return res.status(200).json({
    valid: true,
    code: promo.code,
    discountPercent: promo.discount_percent,
    description: promo.description,
    message: `${promo.discount_percent}% Atelier Privilege Applied`,
  })
})

export default router
