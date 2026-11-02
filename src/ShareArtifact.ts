import type { GalleryWork } from "./Work"

const canvasWidth = 1200

const canvasHeight = 1600

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)

    image.onerror = () =>
      reject(new Error(`Unable to load share image: ${src}`))

    image.src = src
  })
}

function drawContain(
  context: CanvasRenderingContext2D,

  image: HTMLImageElement,

  x: number,

  y: number,

  width: number,

  height: number,
) {
  const scale = Math.min(width / image.width, height / image.height)

  const drawWidth = image.width * scale

  const drawHeight = image.height * scale

  context.drawImage(
    image,

    x + (width - drawWidth) / 2,

    y + (height - drawHeight) / 2,

    drawWidth,

    drawHeight,
  )
}

function wrapText(
  context: CanvasRenderingContext2D,

  text: string,

  x: number,

  y: number,

  maxWidth: number,

  lineHeight: number,

  maxLines: number,
) {
  const words = text.trim().split(/\s+/).filter(Boolean)

  const lines: string[] = []

  let line = ""

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word

    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line)

      line = word
    } else {
      line = candidate
    }
  }

  if (line) lines.push(line)

  lines.slice(0, maxLines).forEach((value, index) => {
    context.fillText(value, x, y + index * lineHeight, maxWidth)
  })
}

export async function createShareArtifact(work: GalleryWork): Promise<Blob> {
  if (!work.image) throw new Error("This artifact has no published image yet.")

  const [textile, artwork, ...motifImages] = await Promise.all([
    loadImage("/assets/b056d.png"),

    loadImage(work.image),

    ...work.motifs.slice(0, 4).map((motif) => loadImage(motif.url)),
  ])

  const canvas = document.createElement("canvas")

  canvas.width = canvasWidth

  canvas.height = canvasHeight

  const context = canvas.getContext("2d")

  if (!context) throw new Error("Your browser cannot create a share image.")

  context.drawImage(textile, 0, 0, canvasWidth, canvasHeight)

  context.fillStyle = "rgba(231, 218, 241, 0.94)"

  context.fillRect(56, 56, canvasWidth - 112, canvasHeight - 112)

  context.textAlign = "center"

  context.fillStyle = "#47033b"

  context.font = "900 80px Inter, Arial, sans-serif"

  context.fillText("DUKOT", canvasWidth / 2, 150)

  context.fillStyle = "#ad0891"

  context.font = "700 39px Inter, Arial, sans-serif"

  context.fillText("YOUR ARTIFACT", canvasWidth / 2, 220)

  const frame = { x: 180, y: 280, width: 840, height: 900 }

  context.fillStyle = "#47033b"

  context.beginPath()

  context.roundRect(
    frame.x - 8,
    frame.y - 8,
    frame.width + 16,
    frame.height + 16,
    28,
  )

  context.fill()

  context.fillStyle = "#f3f2f3"

  context.beginPath()

  context.roundRect(frame.x, frame.y, frame.width, frame.height, 22)

  context.fill()

  context.save()

  context.beginPath()

  context.roundRect(frame.x, frame.y, frame.width, frame.height, 22)

  context.clip()

  drawContain(
    context,
    artwork,
    frame.x + 14,
    frame.y + 14,
    frame.width - 28,
    frame.height - 28,
  )

  context.restore()

  context.textAlign = "left"

  context.fillStyle = "#47033b"

  context.font = "700 34px Inter, Arial, sans-serif"

  context.fillText(work.name, 150, 1260, 900)

  context.font = "700 25px Inter, Arial, sans-serif"

  context.fillText("Group of Origin: Cebuano", 150, 1310)

  context.font = "700 24px Inter, Arial, sans-serif"

  context.fillText("Motifs Used:", 150, 1370)

  let motifX = 360

  for (const image of motifImages) {
    drawContain(context, image, motifX, 1330, 62, 62)

    motifX += 82
  }

  const reason = work.contributions.at(-1)?.reason

  if (reason) {
    context.fillStyle = "#413737"

    context.font = "italic 22px Inter, Arial, sans-serif"

    wrapText(context, reason, 150, 1450, 900, 30, 3)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Your browser could not export the share image."))
    }, "image/png")
  })
}
