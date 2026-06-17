import { create } from 'zustand'

interface AnimationStore {
  // Breath
  breathPhase: number
  breathScale: number
  breathVertical: number

  // Blink
  isBlinking: boolean
  blinkProgress: number

  // Hover
  hoverScale: number
  eyeTargetX: number
  eyeTargetY: number
  headTiltX: number
  headTiltY: number

  // Click
  clickScale: number
  isClickActive: boolean

  // Appendages
  earWigglePhase: number
  tailWagPhase: number
  tailWagAmplitude: number

  // Actions
  updateBreath: (phase: number, scale: number, vertical: number) => void
  setBlink: (active: boolean, progress: number) => void
  setHover: (scale: number, eyeX: number, eyeY: number, headX: number, headY: number) => void
  setClick: (scale: number, active: boolean) => void
  setAppendage: (earPhase: number, tailPhase: number, tailAmp: number) => void
  resetAnimation: () => void
}

const initialState = {
  breathPhase: 0,
  breathScale: 1,
  breathVertical: 0,
  isBlinking: false,
  blinkProgress: 0,
  hoverScale: 1,
  eyeTargetX: 0,
  eyeTargetY: 0,
  headTiltX: 0,
  headTiltY: 0,
  clickScale: 1,
  isClickActive: false,
  earWigglePhase: 0,
  tailWagPhase: 0,
  tailWagAmplitude: 0
}

export const useAnimationStore = create<AnimationStore>((set) => ({
  ...initialState,

  updateBreath: (phase, scale, vertical) =>
    set({ breathPhase: phase, breathScale: scale, breathVertical: vertical }),

  setBlink: (active, progress) =>
    set({ isBlinking: active, blinkProgress: progress }),

  setHover: (scale, eyeX, eyeY, headX, headY) =>
    set({
      hoverScale: scale,
      eyeTargetX: eyeX,
      eyeTargetY: eyeY,
      headTiltX: headX,
      headTiltY: headY
    }),

  setClick: (scale, active) =>
    set({ clickScale: scale, isClickActive: active }),

  setAppendage: (earPhase, tailPhase, tailAmp) =>
    set({
      earWigglePhase: earPhase,
      tailWagPhase: tailPhase,
      tailWagAmplitude: tailAmp
    }),

  resetAnimation: () => set(initialState)
}))
