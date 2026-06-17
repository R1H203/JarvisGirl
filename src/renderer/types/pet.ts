export enum PetState {
  Idle = 'idle',
  Listening = 'listening',
  Thinking = 'thinking',
  Talking = 'talking',
  Sleeping = 'sleeping',
  Busy = 'busy',
  Error = 'error'
}

export enum Expression {
  Normal = 'normal',
  Happy = 'happy',
  Sad = 'sad',
  Blink = 'blink',
  Sleep = 'sleep',
  Think = 'think',
  Surprise = 'surprise'
}

export interface CharacterMeta {
  name: string
  themeHue: number
  themeSaturation: number
  hasSeparableEars: boolean
  hasSeparableTail: boolean
  eyeOffsetX: number
  eyeOffsetY: number
  originX: number
  originY: number
}
