import { useEffect } from 'react'
import { useConfigStore } from '../stores/configStore'
import { usePlatform } from '../platform/PlatformProvider'

export function useConfig(): { loaded: boolean } {
  const loaded = useConfigStore((s) => s.loaded)
  const load = useConfigStore((s) => s.load)
  const platform = usePlatform()

  useEffect(() => {
    if (!loaded) {
      load(platform.config)
    }
  }, [loaded, load, platform.config])

  return { loaded }
}
