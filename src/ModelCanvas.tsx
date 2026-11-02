import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

import * as THREE from "three"

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js"
import type { DesignMotif } from "./Work"

export type ModelCanvasHandle = {
  /** Place a motif where the given screen point hits the model. Returns false if nothing was placed. */

  placeMotif: (
    url: string,

    clientX: number,

    clientY: number,

    size?: number,
  ) => boolean

  /** Remove the most recently placed motif. */

  undo: () => void

  /** Remove every placed motif. */

  clear: () => void

  /** PNG data URL of the current view (or null if unavailable). */

  snapshot: () => string | null

  getMotifs: () => DesignMotif[]
}

type Props = {
  modelUrl?: string

  revealModelUrl?: string

  reveal?: number // 0 = Santo Niño only, 1 = indigenous figure only

  motifUrl: string | null

  initialMotifs?: DesignMotif[]

  /** Decal size used by tap-to-place when no explicit size is given. */

  motifSize?: number

  size?: number

  rotation?: number

  maxMotifs?: number

  onPlacementsChange?: (count: number) => void
}

type Placement = {
  target: THREE.Mesh

  point: THREE.Vector3

  normal: THREE.Vector3

  size: number

  rotation: number

  texture: THREE.Texture

  mesh: THREE.Mesh

  url: string

  x: number

  y: number
}

function buildDecal(p: Omit<Placement, "mesh">) {
  const helper = new THREE.Object3D()

  helper.position.copy(p.point)

  helper.lookAt(p.point.clone().add(p.normal))

  helper.rotateZ(p.rotation)

  const geo = new DecalGeometry(
    p.target,

    p.point,

    helper.rotation,

    new THREE.Vector3(p.size, p.size, p.size),
  )

  const mat = new THREE.MeshBasicMaterial({
    map: p.texture,

    transparent: true,

    depthWrite: false,

    polygonOffset: true,

    polygonOffsetFactor: -4,
  })

  return new THREE.Mesh(geo, mat)
}

async function loadNormalized(url: string) {
  const gltf = await new GLTFLoader().loadAsync(url)

  const model = gltf.scene

  const box = new THREE.Box3().setFromObject(model)

  const center = box.getCenter(new THREE.Vector3())

  const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray())

  model.position.sub(center)

  const wrapper = new THREE.Group()

  wrapper.add(model)

  wrapper.scale.setScalar(2 / maxDim)

  wrapper.updateMatrixWorld(true)

  const meshes: THREE.Mesh[] = []

  const materials: THREE.Material[] = []

  model.traverse((o) => {
    const m = o as THREE.Mesh

    if (!m.isMesh) return

    m.material = Array.isArray(m.material)
      ? m.material.map((x) => x.clone())
      : m.material.clone()
    ;(Array.isArray(m.material) ? m.material : [m.material]).forEach((x) =>
      materials.push(x),
    )

    meshes.push(m)
  })

  return { wrapper, meshes, materials }
}

function setOpacity(
  group: THREE.Object3D,

  materials: THREE.Material[],

  opacity: number,
) {
  group.visible = opacity > 0.01

  materials.forEach((m) => {
    m.transparent = opacity < 0.999

    m.opacity = opacity

    m.depthWrite = opacity > 0.5
  })
}

const ModelCanvas = forwardRef<ModelCanvasHandle, Props>(function ModelCanvas(
  {
    modelUrl = "/model.glb",

    revealModelUrl = "/model_2.glb",

    reveal = 0,

    motifUrl,

    initialMotifs = [],

    motifSize,

    size = 0.4,

    rotation = 0,

    maxMotifs = 3,

    onPlacementsChange,
  },

  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)

  const propsRef = useRef({
    motifUrl,

    initialMotifs,

    motifSize,

    size,

    rotation,

    maxMotifs,

    reveal,

    onPlacementsChange,
  })

  const rebuildLastRef = useRef<() => void>(() => {})

  const apiRef = useRef<ModelCanvasHandle>({
    placeMotif: () => false,

    undo: () => {},

    clear: () => {},

    snapshot: () => null,

    getMotifs: () => [],
  })

  propsRef.current = {
    motifUrl,

    initialMotifs,

    motifSize,

    size,

    rotation,

    maxMotifs,

    reveal,

    onPlacementsChange,
  }

  // Stable handle that forwards to whatever the scene effect currently provides

  useImperativeHandle(
    ref,

    () => ({
      placeMotif: (...args) => apiRef.current.placeMotif(...args),

      undo: () => apiRef.current.undo(),

      clear: () => apiRef.current.clear(),

      snapshot: () => apiRef.current.snapshot(),

      getMotifs: () => apiRef.current.getMotifs(),
    }),

    [],
  )

  useEffect(() => {
    const container = containerRef.current!

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100)

    camera.position.set(0, 0.5, 3.5)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,

      alpha: true,

      preserveDrawingBuffer: true,
    })

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 1.2))

    const dir = new THREE.DirectionalLight(0xffffff, 2)

    dir.position.set(3, 5, 4)

    scene.add(dir)

    const placements: Placement[] = []

    let santo: Awaited<ReturnType<typeof loadNormalized>> | null = null

    let indigenous: Awaited<ReturnType<typeof loadNormalized>> | null = null

    let cancelled = false

    const textureLoader = new THREE.TextureLoader()

    const raycaster = new THREE.Raycaster()

    const controls = new OrbitControls(camera, renderer.domElement)

    controls.enableDamping = true

    controls.enableZoom = true

    controls.minDistance = 2

    controls.maxDistance = 6

    loadNormalized(revealModelUrl)

      .then((r) => {
        if (cancelled) return

        indigenous = r

        scene.add(r.wrapper)
      })

      .catch((err) => console.error("Indigenous model failed:", err))

    const notify = () =>
      propsRef.current.onPlacementsChange?.(placements.length)

    const disposePlacement = (p: Placement) => {
      scene.remove(p.mesh)

      p.mesh.geometry.dispose()
      ;(p.mesh.material as THREE.Material).dispose()

      p.texture.dispose()
    }

    // Shared by tap-to-place and drag-and-drop

    const placeAt = (
      url: string,

      clientX: number,

      clientY: number,

      sizeOverride?: number,
    ) => {
      const { size, motifSize, rotation, maxMotifs, reveal } = propsRef.current

      if (!santo || reveal > 0.1 || placements.length >= maxMotifs) return false

      const rect = renderer.domElement.getBoundingClientRect()

      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,

        -((clientY - rect.top) / rect.height) * 2 + 1,
      )

      raycaster.setFromCamera(ndc, camera)

      const hit = raycaster.intersectObjects(santo.meshes, false)[0]

      if (!hit || !hit.face) return false

      const normal = hit.face.normal

        .clone()

        .transformDirection(hit.object.matrixWorld)

      const texture = textureLoader.load(url)

      texture.colorSpace = THREE.SRGBColorSpace

      const base = {
        target: hit.object as THREE.Mesh,

        point: hit.point.clone(),

        normal,

        size: sizeOverride ?? motifSize ?? size,

        rotation,

        texture,

        url,

        x: (clientX - rect.left) / rect.width,

        y: (clientY - rect.top) / rect.height,
      }

      const mesh = buildDecal(base)

      scene.add(mesh)

      placements.push({ ...base, mesh })

      notify()

      return true
    }

    loadNormalized(modelUrl)

      .then((r) => {
        if (cancelled) return

        santo = r

        scene.add(r.wrapper)

        propsRef.current.initialMotifs.forEach((motif) => {
          const rect = renderer.domElement.getBoundingClientRect()

          placeAt(
            motif.url,

            rect.left + rect.width * motif.x,

            rect.top + rect.height * motif.y,

            motif.size,
          )
        })
      })

      .catch((err) => console.error("Santo Niño model failed:", err))

    apiRef.current = {
      placeMotif: placeAt,

      undo: () => {
        const last = placements.pop()

        if (!last) return

        disposePlacement(last)

        notify()
      },

      clear: () => {
        if (!placements.length) return

        placements.splice(0).forEach(disposePlacement)

        notify()
      },

      snapshot: () => {
        renderer.render(scene, camera)

        return renderer.domElement.toDataURL("image/png")
      },

      getMotifs: () =>
        placements.map(({ url, x, y, size }) => ({ url, x, y, size })),
    }

    // Tap (not drag) to place the selected motif

    let downX = 0

    let downY = 0

    const onDown = (e: PointerEvent) => {
      downX = e.clientX

      downY = e.clientY
    }

    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return

      const { motifUrl } = propsRef.current

      if (!motifUrl) return

      placeAt(motifUrl, e.clientX, e.clientY)
    }

    renderer.domElement.addEventListener("pointerdown", onDown)

    renderer.domElement.addEventListener("pointerup", onUp)

    rebuildLastRef.current = () => {
      const last = placements[placements.length - 1]

      if (!last) return

      scene.remove(last.mesh)

      last.mesh.geometry.dispose()

      last.size = propsRef.current.size

      last.rotation = propsRef.current.rotation

      last.mesh = buildDecal(last)

      scene.add(last.mesh)
    }

    const resize = () => {
      const w = container.clientWidth

      const h = container.clientHeight

      renderer.setSize(w, h)

      camera.aspect = w / h

      camera.updateProjectionMatrix()
    }

    const ro = new ResizeObserver(resize)

    ro.observe(container)

    resize()

    let raf = 0

    const loop = () => {
      raf = requestAnimationFrame(loop)

      const r = propsRef.current.reveal

      if (santo) setOpacity(santo.wrapper, santo.materials, 1 - r)

      if (indigenous) setOpacity(indigenous.wrapper, indigenous.materials, r)

      placements.forEach((p) => {
        const mat = p.mesh.material as THREE.MeshBasicMaterial

        mat.opacity = 1 - r

        p.mesh.visible = 1 - r > 0.01
      })

      controls.update()

      renderer.render(scene, camera)
    }

    loop()

    return () => {
      cancelled = true

      cancelAnimationFrame(raf)

      ro.disconnect()

      renderer.domElement.removeEventListener("pointerdown", onDown)

      renderer.domElement.removeEventListener("pointerup", onUp)

      placements.splice(0).forEach(disposePlacement)

      apiRef.current = {
        placeMotif: () => false,

        undo: () => {},

        clear: () => {},

        snapshot: () => null,

        getMotifs: () => [],
      }

      controls.dispose()

      renderer.dispose()

      container.removeChild(renderer.domElement)
    }
  }, [modelUrl, revealModelUrl])

  useEffect(() => {
    rebuildLastRef.current()
  }, [size, rotation])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none"
      id="model-canvas"
    />
  )
})

export default ModelCanvas
