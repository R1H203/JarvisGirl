import { PetState, Expression } from '../types/pet'

// ── Transition Map (no if-else chains) ──
export const TRANSITIONS: Record<PetState, PetState[]> = {
  [PetState.Idle]: [PetState.Listening, PetState.Sleeping, PetState.Busy],
  [PetState.Listening]: [PetState.Thinking, PetState.Idle],
  [PetState.Thinking]: [PetState.Talking, PetState.Idle, PetState.Error],
  [PetState.Talking]: [PetState.Idle, PetState.Error],
  [PetState.Sleeping]: [PetState.Idle],
  [PetState.Busy]: [PetState.Idle, PetState.Error],
  [PetState.Error]: [PetState.Idle]
}

// ── Error recovery targets ──
export const ERROR_RECOVERY: Partial<Record<PetState, PetState>> = {
  [PetState.Thinking]: PetState.Idle,
  [PetState.Talking]: PetState.Idle,
  [PetState.Busy]: PetState.Idle,
  [PetState.Error]: PetState.Idle
}

// ── Expression per state ──
export const STATE_EXPRESSION: Record<PetState, Expression> = {
  [PetState.Idle]: Expression.Normal,
  [PetState.Listening]: Expression.Normal,
  [PetState.Thinking]: Expression.Think,
  [PetState.Talking]: Expression.Normal,
  [PetState.Sleeping]: Expression.Sleep,
  [PetState.Busy]: Expression.Think,
  [PetState.Error]: Expression.Sad
}
