import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })

  const bCar = fs.readFileSync("public/images/entrance/luxury_gt_car.jpg").toString("base64")
  const bWheel = fs.readFileSync("cars/Information/wheels.jpg").toString("base64")

  // Generate master car with feathered edges in canvas to guarantee 0,0,0 border pixels
  await page.setContent('<canvas id="c" width="1376" height="768"></canvas>')

  await page.evaluate(async ({ bCar, bWheel }) => {
    const canvas = document.getElementById("c")
    const ctx = canvas.getContext("2d")

    const carImg = new Image()
    carImg.src = "data:image/jpeg;base64," + bCar
    await new Promise(r => carImg.onload = r)

    const wheelImg = new Image()
    wheelImg.src = "data:image/jpeg;base64," + bWheel
    await new Promise(r => wheelImg.onload = r)

    // 1. Draw base car image
    ctx.drawImage(carImg, 0, 0, 1376, 768)

    // 2. Wheel renderer
    function drawBmwWheel(cx, cy, radius, isFront = true) {
      ctx.save()

      // Rotor
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

      // Drilled ventilation holes
      ctx.fillStyle = "#090d14"
      const holeRadii = [radius * 0.44, radius * 0.56, radius * 0.68]
      for (const hr of holeRadii) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
          ctx.beginPath()
          ctx.arc(cx + Math.cos(a) * hr, cy + Math.sin(a) * hr, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Pit Stop Orange Brembo Caliper
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

      // Caliper "PS" Monogram
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${Math.round(radius * 0.11)}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const calA = isFront ? Math.PI * 1.24 : Math.PI * 1.22
      ctx.fillText("PS", cx + Math.cos(calA) * (radius * 0.61), cy + Math.sin(calA) * (radius * 0.61))
      ctx.restore()

      // BMW Wheel Spoke Cutout
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.985, 0, Math.PI * 2)
      ctx.clip()

      const srcCenter = 223.5
      const srcRimRadius = 168
      const destScale = radius / srcRimRadius
      const destW = 447 * destScale
      const destH = 447 * destScale

      ctx.globalAlpha = 0.90
      ctx.drawImage(wheelImg, cx - srcCenter * destScale, cy - srcCenter * destScale, destW, destH)

      // Lighting grade
      ctx.globalAlpha = 0.28
      const studioGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
      studioGrad.addColorStop(0, "#38bdf8")
      studioGrad.addColorStop(0.3, "#475569")
      studioGrad.addColorStop(0.7, "#0f172a")
      studioGrad.addColorStop(1, "#020617")
      ctx.fillStyle = studioGrad
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

      // Fender AO
      ctx.globalAlpha = 0.45
      const aoGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius)
      aoGrad.addColorStop(0, "#000000")
      aoGrad.addColorStop(0.28, "rgba(0,0,0,0.15)")
      aoGrad.addColorStop(0.65, "transparent")
      ctx.fillStyle = aoGrad
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      ctx.restore()

      // Rim lip highlight
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.98, 0, Math.PI * 2)
      ctx.lineWidth = 1.4
      ctx.strokeStyle = "rgba(226, 232, 240, 0.55)"
      ctx.stroke()

      // Tire bead shadow
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.lineWidth = 2.2
      ctx.strokeStyle = "rgba(5, 7, 10, 0.95)"
      ctx.stroke()

      ctx.restore()
    }

    drawBmwWheel(308, 472, 78.5, true)
    drawBmwWheel(1074, 472, 78.5, false)

    // 3. SEAMLESS VIGNETTE FEATHERING:
    // Blend all outer boundaries to pure pitch black (#000000) so there can NEVER be a hard rectangular edge!
    
    // Bottom feathering (fades floor reflection gently into pitch black #000000 before reaching y=768)
    const botGrad = ctx.createLinearGradient(0, 600, 0, 768)
    botGrad.addColorStop(0, "rgba(0, 0, 0, 0)")
    botGrad.addColorStop(0.4, "rgba(0, 0, 0, 0.3)")
    botGrad.addColorStop(0.8, "rgba(0, 0, 0, 0.85)")
    botGrad.addColorStop(1, "rgba(0, 0, 0, 1)")
    ctx.fillStyle = botGrad
    ctx.fillRect(0, 600, 1376, 168)

    // Left feathering
    const leftGrad = ctx.createLinearGradient(0, 0, 160, 0)
    leftGrad.addColorStop(0, "rgba(0, 0, 0, 1)")
    leftGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.6)")
    leftGrad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = leftGrad
    ctx.fillRect(0, 0, 160, 768)

    // Right feathering
    const rightGrad = ctx.createLinearGradient(1216, 0, 1376, 0)
    rightGrad.addColorStop(0, "rgba(0, 0, 0, 0)")
    rightGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.6)")
    rightGrad.addColorStop(1, "rgba(0, 0, 0, 1)")
    ctx.fillStyle = rightGrad
    ctx.fillRect(1216, 0, 160, 768)

    // Top feathering
    const topGrad = ctx.createLinearGradient(0, 0, 0, 100)
    topGrad.addColorStop(0, "rgba(0, 0, 0, 1)")
    topGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.5)")
    topGrad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, 1376, 100)

    // Radial vignette around edges
    const radVignette = ctx.createRadialGradient(688, 384, 450, 688, 384, 720)
    radVignette.addColorStop(0, "rgba(0, 0, 0, 0)")
    radVignette.addColorStop(0.7, "rgba(0, 0, 0, 0.3)")
    radVignette.addColorStop(1, "rgba(0, 0, 0, 1)")
    ctx.fillStyle = radVignette
    ctx.fillRect(0, 0, 1376, 768)

  }, { bCar, bWheel })

  // Check border pixels again after feathering
  const edgeData = await page.evaluate(() => {
    const canvas = document.getElementById("c")
    const ctx = canvas.getContext("2d")
    const p = ctx.getImageData(0, 0, 1376, 768).data
    const getRGB = (x, y) => {
      const i = (y * 1376 + x) * 4
      return [p[i], p[i+1], p[i+2]]
    }
    return {
      topLeft: getRGB(0, 0),
      topMid: getRGB(688, 0),
      topRight: getRGB(1375, 0),
      midLeft: getRGB(0, 384),
      midRight: getRGB(1375, 384),
      botLeft: getRGB(0, 767),
      botMid: getRGB(688, 767),
      botRight: getRGB(1375, 767),
    }
  })
  console.log("Feathered Edge Pixels (must all be [0,0,0]):", edgeData)

  const dataUrl = await page.evaluate(() => document.getElementById("c").toDataURL("image/jpeg", 0.98))
  const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "")
  fs.writeFileSync("public/images/entrance/master_executive_gt.jpg", base64Data, "base64")
  fs.writeFileSync("public/images/entrance/gt_full_reveal.jpg", base64Data, "base64")
  console.log("Saved feathered master_executive_gt.jpg and gt_full_reveal.jpg")

  await browser.close()
}

run().catch(console.error)
