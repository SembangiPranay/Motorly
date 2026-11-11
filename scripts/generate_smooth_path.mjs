import fs from "fs"

const points = JSON.parse(fs.readFileSync("scripts/scanned_roofline_points.json", "utf8"))

// Catmull-Rom to cubic Bezier curve converter
function catmullRom2bezier(pts) {
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i === 0 ? pts[0] : pts[i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = i + 2 < pts.length ? pts[i + 2] : p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

// Sample every 3rd point
const sampled = points.filter((_, i) => i % 3 === 0 || i === points.length - 1)
const smoothD = catmullRom2bezier(sampled)
console.log("Smooth SVG Path D:")
console.log(smoothD)
fs.writeFileSync("scripts/smooth_roofline_path.txt", smoothD)
