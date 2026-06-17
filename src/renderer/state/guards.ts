import { PetState, TRANSITIONS } from './machine'
import { logger } from '../utils/logger'

export function canTransition(from: PetState, to: PetState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function assertTransition(from: PetState, to: PetState): void {
  if (!canTransition(from, to)) {
    logger.warn(`State transition ${from} -> ${to} is not allowed, ignoring`)
  }
}
