import { pathToFileURL } from "node:url"
import app from "../server/index.ts"

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href &&
  process.env.VERCEL !== "1" &&
  !process.env.NOW_REGION
) {
  const port = Number(process.env.PORT_BACKEND || 3001)
  app.listen(port, () => {
    console.log(`[Backend] Pit Stop Car Hire API listening on port ${port}`)
  })
}

export default app
