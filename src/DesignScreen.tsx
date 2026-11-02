import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react"
import { createPortal } from "react-dom"

import ModelCanvas, { type ModelCanvasHandle } from "./ModelCanvas"
import type { DesignMotif } from "./Work"
import { publicAsset } from "./publicAsset"

import "./Design.css"

type Pattern = {
  id: string

  src: string

  label: string
}

const designFiles = [
  "Group 23.png",

  "Group 24.png",

  "Group 25.png",

  "Group 26.png",

  "Group 27.png",

  "Group 28.png",

  "Group 29.png",

  "Group 30.png",

  "Group 31.png",

  "Group 32.png",

  "Group 33.png",

  "Group 34.png",

  "Group 35.png",

  "Group 36.png",

  "Group 37.png",

  "Group 38.png",

  "Group 51.png",

  "Group 52.png",

  "Group 53.png",

  "Group 54.png",

  "Group 55.png",

  "Group 56.png",

  "Group 57.png",

  "Group 58.png",

  "Vector.png",

  "Vector-1.png",

  "Vector-2.png",

  "Vector-3.png",

  "Vector-4.png",
]

const patterns: Pattern[] = designFiles.map((file, index) => ({
  id: `design-${index + 1}`,

  src: publicAsset(`designs/${encodeURIComponent(file)}`),

  label: `Design ${index + 1}`,
}))

const PATTERNS_PER_PALETTE = 8

const PATTERNS_PER_PAGE = PATTERNS_PER_PALETTE * 2

const PAGE_COUNT = Math.ceil(patterns.length / PATTERNS_PER_PAGE)

const decalSize = 0.1

const MAX_PATTERNS = 12

function PatternPalette({
  items,

  selectedId,

  onSelect,
}: {
  items: Pattern[]

  selectedId?: string

  onSelect: (pattern: Pattern) => void
}) {
  const beginDrag = (event: DragEvent<HTMLButtonElement>, pattern: Pattern) => {
    event.dataTransfer.effectAllowed = "copy"

    event.dataTransfer.setData("text/pattern-id", pattern.id)

    onSelect(pattern)
  }

  return (
    <aside className="pattern-palette" aria-label="Design choices">
      <div className="pattern-grid">
        {items.map((pattern) => (
          <button
            className={`pattern-tile${
              selectedId === pattern.id ? " is-selected" : ""
            }`}
            draggable
            key={pattern.id}
            onClick={() => onSelect(pattern)}
            onDragStart={(event) => beginDrag(event, pattern)}
            title={`Drag ${pattern.label} onto the model`}
            type="button"
          >
            <img src={pattern.src} alt={pattern.label} draggable={false} />
          </button>
        ))}
        {Array.from({ length: PATTERNS_PER_PALETTE - items.length }, (_, i) => (
          <div
            className="pattern-tile is-empty"
            aria-hidden="true"
            key={`empty-${i}`}
          />
        ))}
      </div>
    </aside>
  )
}

export default function DesignScreen({
  onBack,
  onPublish,
  initialMotifs = [],
  artifactName = "Santo Niño",
}: {
  onBack: () => void
  onPublish: (work: {
    image: string
    reason: string
    motifs: DesignMotif[]
  }) => void
  initialMotifs?: DesignMotif[]
  artifactName?: string
}) {
  const canvasRef = useRef<ModelCanvasHandle>(null)

  const [selected, setSelected] = useState<Pattern>()

  const [page, setPage] = useState(0)

  const [count, setCount] = useState(0)

  const [published, setPublished] = useState(false)

  const [publishModalOpen, setPublishModalOpen] = useState(false)

  const [publishReason, setPublishReason] = useState("")
  const [publishError, setPublishError] = useState("")

  useEffect(() => {
    if (!publishModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPublishModalOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [publishModalOpen])

  const pageItems = patterns.slice(
    page * PATTERNS_PER_PAGE,

    (page + 1) * PATTERNS_PER_PAGE,
  )

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    const id = event.dataTransfer.getData("text/pattern-id")

    const pattern = patterns.find((item) => item.id === id) ?? selected

    if (!pattern) return

    canvasRef.current?.placeMotif(
      pattern.src,

      event.clientX,

      event.clientY,

      decalSize,
    )
  }

  const handlePublish = () => {
    setPublishModalOpen(true)
  }

  const handlePublishSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const image = canvasRef.current?.snapshot()
    if (!image) {
      setPublishError("Your work is still loading. Please try again.")
      return
    }
    onPublish({
      image,
      reason: publishReason,
      motifs: canvasRef.current?.getMotifs() ?? [],
    })
    setPublished(true)
    setPublishModalOpen(false)
  }

  return (
    <main className="design-screen page-shell">
      <div className="rotate-hint" role="alert">
        <span aria-hidden="true">⟳</span>
        <p>Please rotate your phone to landscape</p>
      </div>
      <section className="woven-mat" aria-label="Dukot pattern editor">
        <div className="editor-panel">
          <header className="editor-header">
            <div className="dotted-rule" />
            <h1>DUKOT</h1>
            <div className="dotted-rule" />
          </header>

          <nav className="page-navigation" aria-label="Artifact pages">
            <button type="button" onClick={onBack}>
              <img src={publicAsset("assets/c113a.svg")} alt="" />
              Previous Page
            </button>
            <div className="design-pagination" aria-label="Design pages">
              <span>Designs</span>
              <button
                type="button"
                onClick={() => setPage((current) => current - 1)}
                disabled={page === 0}
                aria-label="Previous designs"
              >
                ‹
              </button>
              <span className="design-page-count" aria-live="polite">
                {page + 1} / {PAGE_COUNT}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={page === PAGE_COUNT - 1}
                aria-label="Next designs"
              >
                ›
              </button>
            </div>
          </nav>

          <div className="workspace">
            <PatternPalette
              items={pageItems.slice(0, PATTERNS_PER_PALETTE)}
              selectedId={selected?.id}
              onSelect={setSelected}
            />

            <section className="design-column">
              <h2>{artifactName}</h2>
              <div
                className={`model-stage${selected ? " is-ready" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault()

                  event.dataTransfer.dropEffect = "copy"
                }}
                onDrop={handleDrop}
                aria-label="Santo Niño model. Drop a pattern here to apply it."
              >
                <ModelCanvas
                  ref={canvasRef}
                  motifUrl={selected?.src ?? null}
                  motifSize={decalSize}
                  initialMotifs={initialMotifs}
                  maxMotifs={initialMotifs.length + MAX_PATTERNS}
                  onPlacementsChange={(n) => {
                    setCount(n)

                    setPublished(false)
                  }}
                />
                {selected && count === 0 && (
                  <p className="drop-hint">Drop or tap to place</p>
                )}
                {count >= MAX_PATTERNS && (
                  <p className="drop-hint">Limit reached. Undo to add more.</p>
                )}
              </div>

              <div className="editor-tools">
                <button
                  type="button"
                  onClick={() => canvasRef.current?.undo()}
                  disabled={count === 0}
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={() => canvasRef.current?.clear()}
                  disabled={count === 0}
                >
                  Clear
                </button>
              </div>

              <button
                className="publish-button"
                onClick={handlePublish}
                type="button"
              >
                {published ? "PUBLISHED" : "PUBLISH"}
              </button>
            </section>

            <PatternPalette
              items={pageItems.slice(PATTERNS_PER_PALETTE)}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          </div>
        </div>
      </section>
      {publishModalOpen &&
        createPortal(
          <div
            className="publish-modal-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPublishModalOpen(false)
              }
            }}
          >
            <form
              aria-labelledby="publish-work-title"
              aria-modal="true"
              className="publish-modal"
              onSubmit={handlePublishSubmit}
              role="dialog"
            >
              <button
                aria-label="Close publish dialog"
                className="publish-modal-close"
                onClick={() => setPublishModalOpen(false)}
                type="button"
              >
                ×
              </button>
              <h2 id="publish-work-title">PUBLISH YOUR WORK</h2>
              <label className="sr-only" htmlFor="publish-reason">
                Why did you choose this work?
              </label>
              <textarea
                autoFocus
                id="publish-reason"
                onChange={(event) => setPublishReason(event.target.value)}
                placeholder="Pinili ko ito dahil..."
                value={publishReason}
              />
              {publishError && (
                <p className="publish-modal-error" role="alert">
                  {publishError}
                </p>
              )}
              <button className="publish-modal-submit" type="submit">
                SUBMIT
              </button>
            </form>
          </div>,
          document.body,
        )}
    </main>
  )
}
