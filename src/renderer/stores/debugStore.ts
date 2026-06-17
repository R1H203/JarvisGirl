import { create } from 'zustand'

interface DebugStore {
  visible: boolean
  showHitbox: boolean
  fps: number
  frameTime: number
  lastStateTransition: string | null
  animationNames: string[]

  toggle: () => void
  toggleHitbox: () => void
  updateMetrics: (fps: number, frameTime: number) => void
  setStateTransition: (from: string, to: string) => void
}

export const useDebugStore = create<DebugStore>((set) => ({
  visible: false,
  showHitbox: false,
  fps: 0,
  frameTime: 0,
  lastStateTransition: null,
  animationNames: [],

  toggle: () => set((s) => ({ visible: !s.visible })),
  toggleHitbox: () => set((s) => ({ showHitbox: !s.showHitbox })),
  updateMetrics: (fps, frameTime) => set({ fps, frameTime }),
  setStateTransition: (from, to) =>
    set({ lastStateTransition: `${from} -> ${to}` })
}))
