/**
 * Shared client-side image compression for inspection photos and signature images.
 */
export function compressConditionImageFile(
  file: File,
  maxDim = 900,
  quality = 0.78,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read image file."))
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result !== "string") {
        reject(new Error("Invalid image data."))
        return
      }
      const img = new Image()
      img.onerror = () => reject(new Error("Invalid image file format."))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas rendering unavailable."))
          return
        }
        if (mimeType === "image/png") {
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, width, height)
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL(mimeType, quality))
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  })
}
