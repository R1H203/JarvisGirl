import { Application, Ticker } from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'
import { invoke } from '@tauri-apps/api/core'

// Register Live2D ticker
Live2DModel.registerTicker(Ticker)

// Live2D model URL (Senko fox from CDN)
const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Senko_Normals/senko.model3.json'

async function main() {
  // Create a canvas element and append it
  const canvas = document.createElement('canvas')
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  document.body.appendChild(canvas)

  const app = new Application({
    view: canvas,
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  })

  try {
    const model = await Live2DModel.from(MODEL_URL, { autoInteract: false })
    app.stage.addChild(model)

    // Scale and center
    const scaleX = (app.screen.width * 0.8) / model.width
    const scaleY = (app.screen.height * 0.8) / model.height
    model.scale.set(Math.min(scaleX, scaleY))
    model.anchor.set(0.5, 1)
    model.position.set(app.screen.width / 2, app.screen.height)

    // Enable interaction on the model
    model.eventMode = 'static'
    model.cursor = 'grab'

    // Drag window — PixiJS v7 uses FederatedPointerEvent (e.button directly)
    model.on('pointerdown', (e) => {
      if (e.button === 0) {
        invoke('start_drag')
      }
    })

    // Right-click context menu
    app.view.addEventListener('contextmenu', (e) => {
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
      // Error message
      ctx.fillStyle = '#999'
      ctx.font = '14px sans-serif'
      ctx.fillText('Loading fox...', canvas.width / 2 / (window.devicePixelRatio || 1),
        canvas.height / 2 / (window.devicePixelRatio || 1) + 50)
    }
  }
}

main()
