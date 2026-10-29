import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STAGING_DB_URL =
  process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL
if (!STAGING_DB_URL) {
  console.error(
    "[ERROR] STAGING_DATABASE_URL environment variable is required.",
  )
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: STAGING_DB_URL,
  ssl: {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
  },
})

async function migrate() {
  console.log("=== Safe Migration: Base64 Images to Object/Static Storage ===")

  // 1. Query vehicles with large Base64 images or gallery entries
  const res = await pool.query(
    "SELECT id, name, image, gallery, octet_length(image) as len, octet_length(gallery) as gallery_len FROM vehicles WHERE octet_length(image) > 1000 OR octet_length(gallery) > 1000",
  )
  console.log(
    `Found ${res.rows.length} vehicle(s) with inline image or gallery data.`,
  )

  if (res.rows.length === 0) {
    console.log(
      "All vehicle images and galleries are already optimized URLs. Nothing to migrate.",
    )
    await pool.end()
    return
  }

  // 2. Create backup directory and save full JSON backup of original records
  const backupDir = path.join(__dirname, "backups")
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  const backupFile = path.join(
    backupDir,
    `vehicle_images_backup_${Date.now()}.json`,
  )
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        image: r.image,
        gallery: r.gallery,
      })),
      null,
      2,
    ),
  )
  console.log(
    `[Backup Saved] Preserved original image and gallery data to ${backupFile}`,
  )

  // 3. Ensure target storage directory exists
  const targetDir = path.join(__dirname, "../public/images/vehicles")
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  // 4. Extract, decode, and save binary image files safely
  for (const car of res.rows) {
    let newImageUrl = car.image
    const rawImage = String(car.image || "")

    if (rawImage.startsWith("data:image/")) {
      const matches = rawImage.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/)
      if (matches) {
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1]
        const base64Data = matches[2]
        const buffer = Buffer.from(base64Data, "base64")
        const hash = crypto
          .createHash("sha256")
          .update(buffer)
          .digest("hex")
          .slice(0, 12)
        const fileName = `${car.id}-${hash}.${ext}`
        const filePath = path.join(targetDir, fileName)
        fs.writeFileSync(filePath, buffer)
        newImageUrl = `/images/vehicles/${fileName}`
        console.log(
          `  Saved cover: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`,
        )
      }
    }

    // Process gallery
    let newGallery = car.gallery
    if (
      typeof car.gallery === "string" &&
      car.gallery.includes("data:image/")
    ) {
      try {
        const parsed = JSON.parse(car.gallery)
        if (Array.isArray(parsed)) {
          const updatedGallery = []
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i]
            if (typeof item === "string" && item.startsWith("data:image/")) {
              const matches = item.match(
                /^data:image\/([a-zA-Z0-9]+);base64,(.+)$/,
              )
              if (matches) {
                const ext = matches[1] === "jpeg" ? "jpg" : matches[1]
                const buffer = Buffer.from(matches[2], "base64")
                const hash = crypto
                  .createHash("sha256")
                  .update(buffer)
                  .digest("hex")
                  .slice(0, 12)
                const fileName = `${car.id}-gallery-${i}-${hash}.${ext}`
                const filePath = path.join(targetDir, fileName)
                fs.writeFileSync(filePath, buffer)
                updatedGallery.push(`/images/vehicles/${fileName}`)
                console.log(`  Saved gallery image ${i}: ${fileName}`)
                continue
              }
            }
            updatedGallery.push(item)
          }
          newGallery = JSON.stringify(updatedGallery)
        }
      } catch (e) {
        console.warn(`Could not parse gallery for ${car.id}:`, e.message)
      }
    }

    // 5. Update vehicle row to the new asset URLs
    await pool.query(
      "UPDATE vehicles SET image = $1, gallery = $2 WHERE id = $3",
      [newImageUrl, newGallery, car.id],
    )
  }

  console.log(
    "\n[SUCCESS] Successfully migrated vehicle images to static asset storage.",
  )
  await pool.end()
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
