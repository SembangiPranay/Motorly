import { spawn } from "node:child_process"
import readline from "node:readline"

const CYAN = "\x1b[36m"
const GREEN = "\x1b[32m"
const RESET = "\x1b[0m"
const BOLD = "\x1b[1m"
const RED = "\x1b[31m"

console.log(`${BOLD}${CYAN}=== MOTORLY Full-Stack Dev Engine Starting ===${RESET}`)

// 1. Start Backend API Server
const serverProc = spawn("node", ["api/index.js"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, PORT_BACKEND: "3001" },
})

const serverOut = readline.createInterface({ input: serverProc.stdout })
serverOut.on("line", (line) => {
  console.log(`${CYAN}[API]${RESET} ${line}`)
})

const serverErr = readline.createInterface({ input: serverProc.stderr })
serverErr.on("line", (line) => {
  console.error(`${RED}[API ERR]${RESET} ${line}`)
})

// 2. Start Vite Dev Server (Port 3000)
const viteProc = spawn("npx", ["vite", "--port", "3000"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, PORT: "3000" },
})

const viteOut = readline.createInterface({ input: viteProc.stdout })
viteOut.on("line", (line) => {
  console.log(`${GREEN}[VITE]${RESET} ${line}`)
})

const viteErr = readline.createInterface({ input: viteProc.stderr })
viteErr.on("line", (line) => {
  console.error(`${RED}[VITE ERR]${RESET} ${line}`)
})

// Clean process termination handler
function cleanup() {
  console.log(`\n${BOLD}Shutting down full-stack development servers...${RESET}`)
  try {
    serverProc.kill("SIGTERM")
  } catch {}
  try {
    viteProc.kill("SIGTERM")
  } catch {}
  process.exit(0)
}

process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)
process.on("exit", cleanup)
