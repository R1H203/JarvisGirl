import type { PetState } from './pet'

export enum PetEvent {
  CLICK = 'click',
  HOVER_START = 'hover:start',
  HOVER_END = 'hover:end',
  DRAG_START = 'drag:start',
  DRAG_END = 'drag:end',
  RIGHT_CLICK = 'right:click',
  AI_START = 'ai:start',
  AI_END = 'ai:end',
  AI_ERROR = 'ai:error',
  TTS_START = 'tts:start',
  TTS_END = 'tts:end',
  STATE_CHANGE = 'state:change',
  EXPRESSION_SET = 'expression:set',
  SLEEP = 'sleep',
  WAKE = 'wake',
  PLUGIN_ACTION = 'plugin:action',
  ERROR_OCCURRED = 'error:occurred'
}

export interface EventPayloadMap {
  [PetEvent.CLICK]: { x: number; y: number; screenX: number; screenY: number }
  [PetEvent.HOVER_START]: { x: number; y: number }
  [PetEvent.HOVER_END]: Record<string, never>
  [PetEvent.DRAG_START]: { x: number; y: number }
  [PetEvent.DRAG_END]: Record<string, never>
  [PetEvent.RIGHT_CLICK]: { x: number; y: number }
  [PetEvent.AI_START]: { text?: string }
  [PetEvent.AI_END]: { text: string; emotion?: string }
  [PetEvent.AI_ERROR]: { code: string; message: string }
  [PetEvent.TTS_START]: { text: string }
  [PetEvent.TTS_END]: Record<string, never>
  [PetEvent.STATE_CHANGE]: { from: PetState; to: PetState }
  [PetEvent.EXPRESSION_SET]: { expression: string }
  [PetEvent.SLEEP]: Record<string, never>
  [PetEvent.WAKE]: Record<string, never>
  [PetEvent.PLUGIN_ACTION]: { plugin: string; action: string; data?: unknown }
  [PetEvent.ERROR_OCCURRED]: { code: string; message: string }
}
