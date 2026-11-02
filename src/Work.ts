export type DesignMotif = {
  url: string

  x: number

  y: number

  size: number
}

export type WorkContribution = {
  author: string

  reason: string

  motifs: DesignMotif[]
}

export type GalleryWork = {
  id: string

  name: string

  image?: string

  motifs: DesignMotif[]

  contributions: WorkContribution[]
}

export const sampleWorks: GalleryWork[] = [
  {
    id: "sample-1",

    name: "WOVEN MEMORY",

    motifs: [{ url: "/designs/Group%2031.png", x: 0.5, y: 0.5, size: 0.2 }],

    contributions: [
      {
        author: "Community member",

        reason:
          "A pattern inspired by the colors and stories passed down through generations.",

        motifs: [{ url: "/designs/Group%2031.png", x: 0.5, y: 0.5, size: 0.2 }],
      },
    ],
  },

  {
    id: "sample-2",

    name: "LIVING TRADITION",

    motifs: [{ url: "/designs/Vector-1.png", x: 0.5, y: 0.5, size: 0.2 }],

    contributions: [
      {
        author: "Community member",

        reason:
          "A design that celebrates the craft and creativity of our community.",

        motifs: [{ url: "/designs/Vector-1.png", x: 0.5, y: 0.5, size: 0.2 }],
      },
    ],
  },
]
