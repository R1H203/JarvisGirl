import { create } from 'zustand'

interface InteractionStore {
  mouseX: number
  mouseY: number
  screenX: number
  screenY: number
  isHovering: boolean
  isDragging: boolean
  lastClickTime: number
  lastClickX: number
  lastClickY: number
  mousePenetration: boolean

  setMousePosition: (x: number, y: number, screenX: number, screenY: number) => void
  setHovering: (hovering: boolean) => void
  setDragging: (dragging: boolean) => void
  registerClick: (x: number, y: number) => void
  toggleMousePenetration: () => void
}

export const useInteractionStore = create<InteractionStore>((set) => ({
  mouseX: 0,
  mouseY: 0,
  screenX: 0,
  screenY: 0,
  isHovering: false,
  isDragging: false,
  lastClickTime: 0,
  lastClickX: 0,
  lastClickY: 0,
  mousePenetration: false,

  setMousePosition: (x, y, screenX, screenY) =>
    set({ mouseX: x, mouseY: y, screenX, screenY }),

  setHovering: (hovering) =>
    set({ isHovering: hovering }),

  setDragging: (dragging) =>
    set({ isDragging: dragging }),

  registerClick: (x, y) =>
    set({
      lastClickX: x,
      lastClickY: y,
      lastClickTime: Date.now()
    }),

  toggleMousePenetration: () =>
    set((state) => ({ mousePenetration: !state.mousePenetration }))
}))
