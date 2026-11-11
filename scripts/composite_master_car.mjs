import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })

  const bCar = fs.readFileSync("public/images/entrance/luxury_gt_car.jpg").toString("base64")
  const bWheel = fs.readFileSync("cars/Information/wheels.jpg").toString("base64")

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background:#000;">
        <canvas id="c" width="1376" height="768"></canvas>
      </body>
    </html>
  `)

  await page.evaluate(async ({ bCar, bWheel }) => {
    const canvas = document.getElementById("c")
    const ctx = canvas.getContext("2d")

    const carImg = new Image()
    carImg.src = "data:image/jpeg;base64," + bCar
    await new Promise(r => carImg.onload = r)

    const wheelImg = new Image()
    wheelImg.src = "data:image/jpeg;base64," + bWheel
    await new Promise(r => wheelImg.onload = r)

    // 1. Draw base master car (flawless body, zero AI slop, existing pristine floor reflection)
    ctx.drawImage(carImg, 0, 0, 1376, 768)

    // Wheel renderer
    function drawBmwWheel(cx, cy, radius, isFront = true) {
      ctx.save()

      // 1. Cross-drilled carbon-ceramic brake rotor behind spokes
      const rotorR = radius * 0.76
      const rotorGrad = ctx.createRadialGradient(cx, cy, rotorR * 0.25, cx, cy, rotorR)
      rotorGrad.addColorStop(0, "#28303e")
      rotorGrad.addColorStop(0.7, "#353f52")
      rotorGrad.addColorStop(1, "#181d26")
      ctx.beginPath()
      ctx.arc(cx, cy, rotorR, 0, Math.PI * 2)
      ctx.fillStyle = rotorGrad
      ctx.fill()
      ctx.lineWidth = 1.2
      ctx.strokeStyle = "#475569"
      ctx.stroke()

      // Drilled ventilation cooling holes
      ctx.fillStyle = "#090d14"
      const holeRadii = [radius * 0.44, radius * 0.56, radius * 0.68]
      for (const hr of holeRadii) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
          ctx.beginPath()
          ctx.arc(cx + Math.cos(a) * hr, cy + Math.sin(a) * hr, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // 2. High-Performance Pit Stop Orange Brembo-Style Caliper
      ctx.save()
      ctx.beginPath()
      const startAngle = isFront ? Math.PI * 1.04 : Math.PI * 1.02
      const endAngle = isFront ? Math.PI * 1.44 : Math.PI * 1.42
      ctx.arc(cx, cy, radius * 0.74, startAngle, endAngle)
      ctx.arc(cx, cy, radius * 0.48, endAngle, startAngle, true)
      ctx.closePath()
      const calGrad = ctx.createLinearGradient(cx - radius * 0.6, cy - radius * 0.6, cx, cy)
      calGrad.addColorStop(0, "#fb923c")
      calGrad.addColorStop(0.4, "#ea580c")
      calGrad.addColorStop(1, "#9a3412")
      ctx.fillStyle = calGrad
      ctx.fill()
      ctx.lineWidth = 1.2
      ctx.strokeStyle = "#f97316"
      ctx.stroke()

      // Subtle Caliper Monogram
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${Math.round(radius * 0.11)}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const calA = isFront ? Math.PI * 1.24 : Math.PI * 1.22
      ctx.fillText("PS", cx + Math.cos(calA) * (radius * 0.61), cy + Math.sin(calA) * (radius * 0.61))
      ctx.restore()

      // 3. BMW Swept Aero Wishbone Turbine Wheel
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.985, 0, Math.PI * 2)
      ctx.clip()

      // Draw the BMW wheel
      const srcCenter = 223.5
      const srcRimRadius = 168
      const destScale = radius / srcRimRadius
      const destW = 447 * destScale
      const destH = 447 * destScale

      ctx.globalAlpha = 0.90
      ctx.drawImage(wheelImg, cx - srcCenter * destScale, cy - srcCenter * destScale, destW, destH)

      // Studio tone grading matching the car's liquid graphite clearcoat reflections
      ctx.globalAlpha = 0.28
      const studioGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
      studioGrad.addColorStop(0, "#38bdf8")
      studioGrad.addColorStop(0.3, "#475569")
      studioGrad.addColorStop(0.7, "#0f172a")
      studioGrad.addColorStop(1, "#020617")
      ctx.fillStyle = studioGrad
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

      // Fender well ambient occlusion shadow
      ctx.globalAlpha = 0.45
      const aoGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius)
      aoGrad.addColorStop(0, "#000000")
      aoGrad.addColorStop(0.28, "rgba(0,0,0,0.15)")
      aoGrad.addColorStop(0.65, "transparent")
      ctx.fillStyle = aoGrad
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

      ctx.restore()

      // 4. Outer machined rim lip highlight
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.98, 0, Math.PI * 2)
      ctx.lineWidth = 1.4
      ctx.strokeStyle = "rgba(226, 232, 240, 0.55)"
      ctx.stroke()

      // 5. Tire bead shadow
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.lineWidth = 2.2
      ctx.strokeStyle = "rgba(5, 7, 10, 0.95)"
      ctx.stroke()

      ctx.restore()
    }

    // Render front and rear wheels
    drawBmwWheel(308, 472, 78.5, true)
    drawBmwWheel(1074, 472, 78.5, false)

  }, { bCar, bWheel })

  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_composite_master_car_v3.png" })
  console.log("Saved test_composite_master_car_v3.png")

  const dataUrl = await page.evaluate(() => document.getElementById("c").toDataURL("image/jpeg", 0.98))
  const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "")
  fs.writeFileSync("public/images/entrance/master_executive_gt.jpg", base64Data, "base64")
  console.log("Saved public/images/entrance/master_executive_gt.jpg")

  await browser.close()
}

run().catch(console.error)
