import { useState } from "react"

import ExhibitScreen from "./ExhibitScreen"

import DesignScreen from "./DesignScreen"

import GalleryScreen from "./GalleryScreen"

import { sampleWorks, type GalleryWork } from "./Work"

type Screen = "exhibit" | "design" | "gallery"

export default function App() {
  const [screen, setScreen] = useState<Screen>("exhibit")

  const [works, setWorks] = useState<GalleryWork[]>(sampleWorks)

  const [activeWorkId, setActiveWorkId] = useState<string>()

  const [designingWorkId, setDesigningWorkId] = useState<string>()

  const activeWork = works.find((work) => work.id === activeWorkId)

  const designingWork = works.find((work) => work.id === designingWorkId)

  if (screen === "design") {
    return (
      <DesignScreen
        artifactName={designingWork?.name}
        initialMotifs={designingWork?.motifs}
        onBack={() => {
          if (!designingWork) setActiveWorkId(undefined)

          setDesigningWorkId(undefined)

          setScreen("exhibit")
        }}
        onPublish={({ image, reason, motifs }) => {
          if (designingWork) {
            setWorks((current) =>
              current.map((work) =>
                work.id === designingWork.id
                  ? {
                      ...work,

                      image,

                      motifs,

                      contributions: [
                        ...work.contributions,

                        { author: "You", reason, motifs },
                      ],
                    }
                  : work,
              ),
            )

            setActiveWorkId(designingWork.id)
          } else {
            const newWork: GalleryWork = {
              id: `work-${Date.now()}`,

              name: "YOUR ARTIFACT",

              image,

              motifs,

              contributions: [{ author: "You", reason, motifs }],
            }

            setWorks((current) => [...current, newWork])

            setActiveWorkId(newWork.id)
          }

          setDesigningWorkId(undefined)

          setScreen("gallery")
        }}
      />
    )
  }

  if (screen === "gallery") {
    return (
      <GalleryScreen
        works={works}
        onBack={() => {
          setActiveWorkId(undefined)

          setScreen("exhibit")
        }}
        onViewWork={(work) => {
          setActiveWorkId(work.id)

          setScreen("exhibit")
        }}
      />
    )
  }

  return (
    <ExhibitScreen
      work={activeWork}
      onBackToGallery={
        activeWork
          ? () => {
              setScreen("gallery")
            }
          : undefined
      }
      onOpenDesigner={() => {
        setDesigningWorkId(activeWork?.id)

        setScreen("design")
      }}
      onOpenGallery={() => setScreen("gallery")}
    />
  )
}
