const PREFIX = '[JarvisGirl]'

export const logger = {
  info: (msg: string, data?: unknown): void => {
    console.log(`${PREFIX} [INFO] ${msg}`, data ?? '')
  },
  warn: (msg: string, data?: unknown): void => {
    console.warn(`${PREFIX} [WARN] ${msg}`, data ?? '')
  },
  error: (msg: string, error?: unknown): void => {
    console.error(`${PREFIX} [ERROR] ${msg}`, error ?? '')
  },
  debug: (msg: string, data?: unknown): void => {
    if (import.meta.env.DEV) {
      console.log(`${PREFIX} [DEBUG] ${msg}`, data ?? '')
    }
  }
}
