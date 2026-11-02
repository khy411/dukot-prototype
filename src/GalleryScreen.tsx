import { useEffect, useState } from "react"
import ModelCanvas from "./ModelCanvas"
import "./Gallery.css"
import { createShareArtifact } from "./ShareArtifact"
import type { GalleryWork } from "./Work"
import { publicAsset } from "./publicAsset"

function ShareArtifactModal({
  work,
  onClose,
}: {
  work: GalleryWork
  onClose: () => void
}) {
  const [previewUrl, setPreviewUrl] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    let objectUrl = ""
    let cancelled = false
    createShareArtifact(work)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not prepare your share image.",
          )
        }
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [work])

  const download = () => {
    if (!previewUrl) return
    const link = document.createElement("a")
    link.href = previewUrl
    link.download = "dukot-your-artifact.png"
    link.click()
  }

  const share = async () => {
    if (!previewUrl) return
    setSharing(true)
    setNotice("")
    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const file = new File([blob], "dukot-your-artifact.png", {
        type: "image/png",
      })
      const shareData = {
        title: `My ${work.name} | DUKOT`,
        text: work.contributions.at(-1)?.reason || "My DUKOT artifact",
        files: [file],
      }
      if (navigator.canShare?.(shareData) && navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.share) {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: window.location.href,
        })
      } else {
        setNotice(
          "Social sharing isn’t available in this browser. Download the image to share it.",
        )
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return
      setError(
        cause instanceof Error ? cause.message : "Could not share your work.",
      )
    } finally {
      setSharing(false)
    }
  }

  return (
    <div
      className="share-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby="share-modal-title"
        aria-modal="true"
        className="share-modal"
        role="dialog"
      >
        <button
          aria-label="Close share dialog"
          className="share-modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <h2 id="share-modal-title">SHARE YOUR ARTIFACT</h2>
        <p className="share-modal-intro">
          Your design, ready to download or share with your community.
        </p>
        {previewUrl ? (
          <img
            className="share-preview"
            src={previewUrl}
            alt={`Share preview for ${work.name}`}
          />
        ) : error ? (
          <p className="share-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="share-loading" role="status">
            Preparing your share image…
          </p>
        )}
        {notice && (
          <p className="share-notice" role="status">
            {notice}
          </p>
        )}
        <div className="share-actions">
          <button
            className="share-download-button"
            disabled={!previewUrl}
            onClick={download}
            type="button"
          >
            Download image
          </button>
          <button
            className="share-native-button"
            disabled={!previewUrl || sharing}
            onClick={share}
            type="button"
          >
            {sharing ? "Opening share…" : "Share"}
          </button>
        </div>
      </section>
    </div>
  )
}

export default function GalleryScreen({
  works,
  onBack,
  onViewWork,
}: {
  works: GalleryWork[]
  onBack: () => void
  onViewWork: (work: GalleryWork) => void
}) {
  const [shareWork, setShareWork] = useState<GalleryWork>()

  return (
    <main className="gallery-page">
      <section className="gallery-panel" aria-labelledby="gallery-title">
        <header className="gallery-header">
          <div className="gallery-title-rule" aria-hidden="true">
            <img src={publicAsset("assets/80349.svg")} alt="" />
          </div>
          <h1 id="gallery-title">DUKOT</h1>
          <p>GALLERY</p>
        </header>
        <div className="gallery-grid">
          {works.map((work) => (
            <article className="gallery-card" key={work.id}>
              <h2>{work.name}</h2>
              <div className="gallery-image-frame">
                {work.image ? (
                  <img
                    className="gallery-published-image"
                    src={work.image}
                    alt={`${work.name}, decorated Santo Niño model`}
                  />
                ) : (
                  <ModelCanvas
                    initialMotifs={work.motifs}
                    motifUrl={null}
                    maxMotifs={work.motifs.length}
                  />
                )}
              </div>
              <button
                className="gallery-view-button"
                onClick={() => onViewWork(work)}
                type="button"
              >
                VIEW
              </button>
              {work.image &&
                work.contributions.some((item) => item.author === "You") && (
                  <button
                    className="gallery-share-button"
                    onClick={() => setShareWork(work)}
                    type="button"
                  >
                    Share / Download
                  </button>
                )}
            </article>
          ))}
        </div>
        <button className="gallery-back-button" onClick={onBack} type="button">
          Back to exhibit
        </button>
      </section>
      {shareWork && (
        <ShareArtifactModal
          work={shareWork}
          onClose={() => setShareWork(undefined)}
        />
      )}
    </main>
  )
}
