import { useEffect, useState } from "react"

import ModelCanvas from "./ModelCanvas"

import type { GalleryWork } from "./Work"
import { publicAsset } from "./publicAsset"

const EMPTY_MOTIFS: GalleryWork["motifs"] = []

const WELCOME_BLURB = `Welcome to Dukot!

Dukot takes its name from two meanings. The first, takes its meaning from the Tagalog language which means to snatch or take away. The second, takes its meaning from Bisaya, which equates to the burnt rice or crust left at the bottom of the pot.

This exhibit aims to present the effects of historical revisionism on Filipino indigenous culture. You will be able to counter-restore colonial artifacts by adding indigenous designs, and also see others' contributions and how the canvas has evolved over time. Dukot shows that historical revisionism, while a very real part of our history, can be fought against by re-asserting and spreading awareness of our indigenous culture.`

export default function ExhibitScreen({
  work,

  onOpenDesigner,

  onOpenGallery,

  onBackToGallery,
}: {
  work?: GalleryWork

  onOpenDesigner: () => void

  onOpenGallery: () => void

  onBackToGallery?: () => void
}) {
  const [timelineIndex, setTimelineIndex] = useState(1)

  const timelineLabels = [
    "Indigenous",

    "Colonial",

    ...(work?.contributions.map((contribution) => contribution.author) ?? []),
  ]

  const lastTimelineIndex = timelineLabels.length - 1

  const currentContribution =
    work && timelineIndex >= 2
      ? work.contributions[timelineIndex - 2]
      : undefined

  const initialMotifs = currentContribution?.motifs ?? EMPTY_MOTIFS

  const reveal = timelineIndex === 0 ? 1 : 0

  useEffect(() => {
    setTimelineIndex(1)
  }, [work?.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setTimelineIndex((current) => Math.max(0, current - 1))
      }

      if (event.key === "ArrowRight") {
        setTimelineIndex((current) => Math.min(lastTimelineIndex, current + 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lastTimelineIndex])

  const artifactName = work?.name ?? "Santo Niño"

  const caption =
    timelineIndex === 0
      ? "Indigenous layer: Diwata / agipo tradition (artist's interpretation based on documented oral tradition)"
      : timelineIndex === 1
        ? "Colonial layer: the Santo Niño as displayed today"
        : `${currentContribution?.author ?? "Community"}'s design`

  const blurb =
    timelineIndex === 0
      ? "Pansinin kung gaano kadaling natatakpan ang naunang patong."
      : currentContribution?.reason ||
        WELCOME_BLURB

  const isWelcomeBlurb = timelineIndex !== 0 && !currentContribution?.reason

  return (
    <main className="exhibit-page">
      <section
        className="textile-frame"
        aria-label="Dukot interactive artifact exhibit"
      >
        <div className="exhibit-panel">
          <header className="title-row">
            <div className="title-rule" aria-hidden="true">
              <img src={publicAsset("assets/80349.svg")} alt="" />
            </div>
            <h1>DUKOT</h1>
          </header>

          <div className="exhibit-grid">
            <section className="artifact-column" aria-live="polite">
              <h2>{artifactName}</h2>
              <div
                className="artifact-stage"
                aria-label={`${artifactName} display area`}
              >
                <ModelCanvas
                  initialMotifs={initialMotifs}
                  motifUrl={null}
                  maxMotifs={initialMotifs.length}
                  reveal={reveal}
                />
                <p className="layer-caption">{caption}</p>
              </div>

              <div className="timeline-control">
                <label className="reveal-bar">
                  <span>{timelineLabels[0]}</span>
                  <input
                    aria-label="Artifact design timeline"
                    type="range"
                    min={0}
                    max={lastTimelineIndex}
                    step={1}
                    value={timelineIndex}
                    onChange={(event) =>
                      setTimelineIndex(Number(event.target.value))
                    }
                  />
                  <span>{timelineLabels[lastTimelineIndex]}</span>
                </label>
                <nav className="timeline-steps" aria-label="Design history">
                  {timelineLabels.map((label, index) => (
                    <button
                      aria-current={
                        timelineIndex === index ? "step" : undefined
                      }
                      key={`${index}-${label}`}
                      onClick={() => setTimelineIndex(index)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            </section>

            <aside
              className={`story-card${isWelcomeBlurb ? " story-card--intro" : ""}`}
            >
              <p key={`${timelineIndex}-${blurb}`}>{blurb}</p>
              <button
                type="button"
                className="design-cta"
                onClick={onOpenDesigner}
              >
                Design on this artifact →
              </button>
              {onBackToGallery ? (
                <button
                  className="exhibit-gallery-link"
                  onClick={onBackToGallery}
                  type="button"
                >
                  Back to gallery
                </button>
              ) : (
                <button
                  className="exhibit-gallery-link"
                  onClick={onOpenGallery}
                  type="button"
                >
                  View shared gallery
                </button>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
