import { Application, Ticker } from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'
import { invoke } from '@tauri-apps/api/core'
import { initRuntime } from './core/runtime'
import { eventBus } from './core/eventBus'
import { initInteractionDetector } from './core/interactionDetector'
import { initCharacterSystem } from './core/character'

// Register Live2D ticker (must be called once before any model is loaded)
Live2DModel.registerTicker(Ticker)

async function main() {
  // Step 1: Initialize runtime core (EventBus + StateMachine + ExpressionPipeline)
  initRuntime({ devLog: true })

  // Step 2: Create canvas for PixiJS rendering
  const canvas = document.createElement('canvas')
  // CSS z-index 2 is applied by styles.css
  // Canvas is positioned fixed, full viewport
  document.body.appendChild(canvas)

  // Step 3: Create PixiJS Application
  const app = new Application({
    view: canvas,
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })

  // Step 4: Initialize interaction detector (click + edge detection)
  // Must be called after canvas is in DOM for pointer events
  initInteractionDetector(canvas, {
    startDrag: () => invoke('start_drag'),
  })

  // Step 5: Initialize character system (loads default fox model)
  // Handles full lifecycle: load → register drivers → mouse tracking
  initCharacterSystem(app, canvas)

  // Step 6: Right-click context menu (canvas native event)
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    invoke('show_context_menu')
  })

  // Step 7: Window resize → reposition model
  window.addEventListener('resize', () => {
    // Character system will handle this on next character load
    // For now, the model position is set once
  })
}

main()
