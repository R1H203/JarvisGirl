import { create } from 'zustand'
import { PetState, Expression } from '../types/pet'
import { TRANSITIONS, STATE_EXPRESSION } from '../state/machine'
import { assertTransition } from '../state/guards'
import { eventBus } from '../events/EventBus'
import { PetEvent } from '../types/events'
import { logger } from '../utils/logger'

interface PetStore {
  state: PetState
  previousState: PetState | null
  expression: Expression
  expressionIntensity: number

  transition: (to: PetState) => void
  setExpression: (expr: Expression) => void
  reset: () => void
}

export const usePetStore = create<PetStore>((set, get) => ({
  state: PetState.Idle,
  previousState: null,
  expression: Expression.Normal,
  expressionIntensity: 1,

  transition: (to: PetState) => {
    const { state: from } = get()
    assertTransition(from, to)

    if (TRANSITIONS[from]?.includes(to)) {
      set({ previousState: from, state: to, expression: STATE_EXPRESSION[to] })
      eventBus.emit(PetEvent.STATE_CHANGE, { from, to })
      logger.info(`State: ${from} -> ${to}`)
    }
  },

  setExpression: (expr: Expression) => {
    set({ expression: expr, expressionIntensity: 1 })
    eventBus.emit(PetEvent.EXPRESSION_SET, { expression: expr })
  },

  reset: () => {
    set({
      state: PetState.Idle,
      previousState: null,
      expression: Expression.Normal,
      expressionIntensity: 1
    })
  }
}))
