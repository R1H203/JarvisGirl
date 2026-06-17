import { Expression } from '../types/pet'
import { logger } from '../utils/logger'

type ImageMap = Map<string, HTMLImageElement>

class AssetManager {
  private cache = new Map<string, ImageMap>()
  private currentCharacter = 'default'
  private basePath = ''

  setBasePath(path: string): void {
    this.basePath = path
  }

  async loadCharacter(characterName: string): Promise<void> {
    this.currentCharacter = characterName

    if (this.cache.has(characterName)) {
      return
    }

    const expressionValues = Object.values(Expression)
    const imageMap: ImageMap = new Map()
    const loadPromises: Promise<void>[] = []

    for (const expr of expressionValues) {
      const imgPath = this.getAssetPath(characterName, expr)
      const promise = this.loadImage(imgPath).then((img) => {
        imageMap.set(expr, img)
      })
      loadPromises.push(promise)
    }

    try {
      await Promise.all(loadPromises)
      this.cache.set(characterName, imageMap)
      logger.info(`AssetManager: loaded character "${characterName}"`)
    } catch (err) {
      logger.error(`AssetManager: failed to load character "${characterName}"`, err)
      throw err
    }
  }

  getAsset(expression: Expression): HTMLImageElement | undefined {
    return this.cache.get(this.currentCharacter)?.get(expression)
  }

  getCharacterPath(characterName?: string): string {
    const name = characterName || this.currentCharacter
    return `${this.basePath}assets/characters/${name}/`
  }

  private getAssetPath(characterName: string, expression: Expression): string {
    return `${this.basePath}assets/characters/${characterName}/${expression}.png`
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load: ${src}`))
      img.src = src
    })
  }

  preload(): Promise<void> {
    return this.loadCharacter(this.currentCharacter)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const assetManager = new AssetManager()
