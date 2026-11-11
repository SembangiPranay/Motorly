import fs from "fs"

let html = fs.readFileSync("scripts/test_bmw_wheel_prototype.html", "utf-8")

// Replace gradient with solid pure white fill
html = html.replace('fill="url(#brightSilver)"', 'fill="#FFFFFF"')

fs.writeFileSync("scripts/test_bmw_wheel_prototype.html", html, "utf-8")
console.log("Replaced gradient with #FFFFFF!")
