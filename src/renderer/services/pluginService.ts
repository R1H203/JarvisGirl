import { PetEvent } from '../types/events'
import { logger } from '../utils/logger'

interface PluginManifest {
  name: string
  version: string
  description: string
  entry: string
}

class PluginService {
  private plugins: PluginManifest[] = []

  async scanPlugins(): Promise<PluginManifest[]> {
    logger.info('Plugin: scan (stub) - no plugins directory implemented yet')
    this.plugins = []
    return this.plugins
  }

  getPlugins(): PluginManifest[] {
    return this.plugins
  }

  callPluginHooks(_event: PetEvent, _payload: unknown): void {
    // Stub: future plugin event dispatching
  }
}

export const pluginService = new PluginService()
