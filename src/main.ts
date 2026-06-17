import { Application, Ticker } from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'
import { invoke } from '@tauri-apps/api/core'
import { initRuntime } from './core/runtime'
import { eventBus } from './core/eventBus'
import { stateMachine, PetState } from './core/stateMachine'
import { setLive2DModel, dumpModelParams } from './core/live2dDriver'
import { startMouseTracking, setMouseTracking } from './core/mouseTracker'
import { initInteractionDetector } from './core/interactionDetector'

// Register Live2D ticker
Live2DModel.registerTicker(Ticker)

// Live2D model URL (Senko fox from CDN)
const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Senko_Normals/senko.model3.json'

async function main() {
  // Initialize runtime core (EventBus + StateMachine + ExpressionPipeline + ParticleSystem)
  initRuntime({ devLog: true })

  // Create canvas for PixiJS rendering
  const canvas = document.createElement('canvas')
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  document.body.appendChild(canvas)

  // Initialize interaction detector (click detection + proximity)
  // Must be called after canvas is in DOM for pointer events
  initInteractionDetector(canvas, {
    startDrag: () => invoke('start_drag'),
  })

  const app = new Application({
    view: canvas,
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })

  try {
    const model = await Live2DModel.from(MODEL_URL, { autoHitTest: false, autoFocus: true })
    app.stage.addChild(model)

    // Scale and center
    const scaleX = (app.screen.width * 0.8) / model.width
    const scaleY = (app.screen.height * 0.8) / model.height
    model.scale.set(Math.min(scaleX, scaleY))
    model.anchor.set(0.5, 1)
    model.position.set(app.screen.width / 2, app.screen.height)

    // Register model with Live2D driver (emotion→parameter, action→motion)
    setLive2DModel(model)
    // Start mouse tracking (eye + head follow cursor)
    startMouseTracking(model)
    // Wire up debug dump to window
    ;(window as any).__JARVIS_GIRL__.dumpModelParams = dumpModelParams

    // Enable interaction on the model (for PixiJS pointer events)
    model.eventMode = 'static'
    model.cursor = 'grab'

    // Right-click context menu (handle via native canvas event for reliability)
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      invoke('show_context_menu')
    })
  } catch (err) {
    console.error('Failed to load Live2D model:', err)
    // Fallback: simple fox emoji
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#6B8EC4'
      ctx.font = '40px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🦊', canvas.width / 2 / (window.devicePixelRatio || 1),
        canvas.height / 2 / (window.devicePixelRatio || 1))
      ctx.fillStyle = '#999'
      ctx.font = '14px sans-serif'
      ctx.fillText('Loading fox...', canvas.width / 2 / (window.devicePixelRatio || 1),
        canvas.height / 2 / (window.devicePixelRatio || 1) + 50)
    }
  }
}

main()
