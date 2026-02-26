import { FrameAnalyzer } from '../../pkg-web/embed_core'

class WasmManager {
  private static instance: WasmManager
  private analyzer: FrameAnalyzer | null = null
  private isInitialized = false
  private isInitializing = false
  private initPromise: Promise<FrameAnalyzer> | null = null

  private constructor() { }

  static getInstance(): WasmManager {
    if (!WasmManager.instance) {
      WasmManager.instance = new WasmManager()
    }
    return WasmManager.instance
  }

  async getAnalyzer(): Promise<FrameAnalyzer> {
    if (this.analyzer) {
      return this.analyzer
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.initializeWasm()
    return this.initPromise
  }

  private async initializeWasm(): Promise<FrameAnalyzer> {
    if (this.isInitializing) {
      throw new Error('WASM is already initializing')
    }

    this.isInitializing = true

    try {
      console.log('初始化WASM模块...')

      // Import and initialize WASM
      const wasmModule = await import('../../pkg-web/embed_core')
      await wasmModule.default()

      // Create analyzer (no region parameter needed)
      this.analyzer = new wasmModule.FrameAnalyzer()
      this.isInitialized = true

      // Load and apply stored configurations
      await this.loadStoredConfigurations()

      console.log('WASM模块初始化成功')
      return this.analyzer
    } catch (error) {
      console.error('WASM初始化失败:', error)
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  private async loadStoredConfigurations(): Promise<void> {
    if (!this.analyzer) {
      return
    }

    const availableProtocols = ['CSG13', 'CSG16', 'DLT/645-2007', 'MOUDLE', 'TASK_MS', 'His']

    for (const protocol of availableProtocols) {
      const storageKey = `protocol_config_${protocol}`
      const storedConfig = localStorage.getItem(storageKey)

      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig)
          if (!parsed.isDefault && parsed.content) {
            // Update WASM configuration with stored content
            this.analyzer.update_protocol_config(protocol, parsed.content)
            console.log(`已加载 ${protocol} 协议的自定义配置`)
          }
        } catch (error) {
          console.error(`Failed to load stored config for ${protocol}:`, error)
        }
      }
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.analyzer !== null
  }
}

export const wasmManager = WasmManager.getInstance()