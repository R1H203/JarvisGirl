/**
 * Character — 角色系统
 *
 * 职责: 管理 Live2D 角色注册、加载、切换生命周期
 * 约束: 不影响 Emotion/Action/Pipeline，只管理 model 层
 */

import { Live2DModel } from 'pixi-live2d-display'
import { Application } from 'pixi.js'
import { setLive2DModel, clearLive2DModel } from './live2dDriver'
import { startMouseTracking, stopMouseTracking } from './mouseTracker'

// ── 角色配置 ──

export interface CharacterConfig {
  id: string
  name: string
  modelUrl: string
  type: 'cubism2' | 'cubism3'
}

/** 角色注册表（可运行时追加） */
const CHARACTER_REGISTRY: CharacterConfig[] = [
  {
    id: 'fox',
    name: '小狐狸',
    modelUrl: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Senko_Normals/senko.model3.json',
    type: 'cubism3',
  },
  {
    id: 'cat',
    name: '小貓',
    modelUrl: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json',
    type: 'cubism2',
  },
  {
    id: 'bunny',
    name: '小兔',
    modelUrl: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json',
    type: 'cubism2',
  },
]

// ── 内部状态 ──

let _app: Application | null = null
let _canvas: HTMLCanvasElement | null = null
let _currentId: string = 'fox'
let _currentModel: Live2DModel | null = null

/** 交换锁：正在加载时不接受新请求 */
let _swapGuard = false

// ── 公开 API ──

/** 获取当前角色 ID */
export function getCurrentCharacterId(): string {
  return _currentId
}

/** 获取当前角色配置 */
export function getCurrentCharacter(): CharacterConfig | undefined {
  return CHARACTER_REGISTRY.find(c => c.id === _currentId)
}

/** 获取所有可用角色 */
export function getAvailableCharacters(): CharacterConfig[] {
  return [...CHARACTER_REGISTRY]
}

/** 注册新角色（运行时追加） */
export function registerCharacter(config: CharacterConfig): void {
  const existing = CHARACTER_REGISTRY.findIndex(c => c.id === config.id)
  if (existing >= 0) {
    CHARACTER_REGISTRY[existing] = config
  } else {
    CHARACTER_REGISTRY.push(config)
  }
  console.log(`[Character] 已注册角色: ${config.id} (${config.name})`)
}

/** 切换角色 */
export async function setCharacter(id: string): Promise<boolean> {
  if (_swapGuard) {
    console.warn('[Character] 正在切换中，忽略请求:', id)
    return false
  }
  if (id === _currentId && _currentModel) {
    console.log(`[Character] 已经是角色: ${id}`)
    return true
  }

  const config = CHARACTER_REGISTRY.find(c => c.id === id)
  if (!config) {
    console.error(`[Character] 未知角色: ${id}，可用: [${CHARACTER_REGISTRY.map(c => c.id).join(', ')}]`)
    return false
  }

  _swapGuard = true
  console.log(`[Character] 切换角色: ${_currentId} → ${id} (${config.name})`)

  // 1. 清理旧模型的 Live2DDriver 订阅 + mouseTracker
  clearLive2DModel()
  stopMouseTracking()

  // 2. 销毁旧模型
  if (_currentModel) {
    try {
      _currentModel.destroy()
      _currentModel = null
    } catch (err) {
      console.warn('[Character] 销毁旧模型时出错:', err)
    }
  }

  // 3. 清除舞台
  if (_app) {
    _app.stage.removeChildren()
  }

  // 4. 加载新模型
  try {
    const model = await Live2DModel.from(config.modelUrl, {
      autoHitTest: false,
      autoFocus: config.type === 'cubism3',
    })
    _currentModel = model

    if (!_app) {
      console.error('[Character] PixiJS Application 未初始化')
      _swapGuard = false
      return false
    }

    // 4. 添加到舞台
    _app.stage.addChild(model)

    // 5. 缩放到窗口
    const scaleX = (_app.screen.width * 0.8) / model.width
    const scaleY = (_app.screen.height * 0.8) / model.height
    model.scale.set(Math.min(scaleX, scaleY))
    model.anchor.set(0.5, 1)
    model.position.set(_app.screen.width / 2, _app.screen.height)

    // 6. 设置交互
    model.eventMode = 'static'
    model.cursor = 'grab'

    // 7. 注册到 Live2D 驱动
    setLive2DModel(model)

    // 8. 注册鼠标追踪（Cubism 3 支持 focus，Cubism 2 会静默失效）
    startMouseTracking(model)

    _currentId = id

    // 9. 触发 character:change 事件
    const { eventBus } = await import('./eventBus')
    eventBus.emit('character:change', { id, name: config.name, type: config.type })

    console.log(`[Character] 切换完成: ${config.name}`)
    _swapGuard = false
    return true
  } catch (err) {
    console.error(`[Character] 加载角色 ${id} 失败:`, err)
    _currentModel = null
    _swapGuard = false
    return false
  }
}

/** 初始化角色系统（启动时调用） */
export function initCharacterSystem(
  app: Application,
  canvas: HTMLCanvasElement,
  defaultId: string = 'fox',
): Promise<boolean> {
  _app = app
  _canvas = canvas

  console.log(`[Character] 初始化，默认角色: ${defaultId}`)

  // 暴露全局切换接口
  if (typeof window !== 'undefined') {
    const existing = (window as any).__JARVIS_GIRL__
    if (existing) {
      existing.characterList = getAvailableCharacters
      existing.setCharacter = setCharacter
      existing.getCharacter = getCurrentCharacter
    }
  }

  return setCharacter(defaultId)
}
