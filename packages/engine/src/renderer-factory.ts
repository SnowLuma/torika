import type { IRenderer, IRendererFactory, RENDERER_TYPES } from './types/renderer.js';

/**
 * 渲染器工厂
 * 负责注册、创建和管理不同类型的渲染器
 */
export class RendererFactory implements IRendererFactory {
  private rendererClasses = new Map<string, new (config?: any) => IRenderer>();
  private rendererInstances = new Map<string, IRenderer>();

  registerRenderer(type: string, rendererClass: new (config?: any) => IRenderer): void {
    this.rendererClasses.set(type, rendererClass);
    console.log(`✅ [Engine] 渲染器已注册: ${type}`);
  }

  async createRenderer(type: string, config?: Record<string, any>): Promise<IRenderer | null> {
    try {
      // 检查是否已有实例
      const instanceKey = `${type}:${JSON.stringify(config || {})}`;
      if (this.rendererInstances.has(instanceKey)) {
        return this.rendererInstances.get(instanceKey)!;
      }

      // 获取渲染器类
      const RendererClass = this.rendererClasses.get(type);
      if (!RendererClass) {
        console.warn(`⚠️ [Engine] 未找到渲染器类型: ${type}`);
        return null;
      }

      // 创建实例
      const renderer = new RendererClass(config);
      
      // 初始化
      if (renderer.initialize) {
        await renderer.initialize(config);
      }

      // 缓存实例
      this.rendererInstances.set(instanceKey, renderer);

      console.log(`✅ [Engine] 渲染器创建成功: ${type}`);
      return renderer;
    } catch (error) {
      console.error(`❌ [Engine] 创建渲染器失败: ${type}`, error);
      return null;
    }
  }

  getRenderer(type: string): IRenderer | null {
    // 尝试获取默认配置的实例
    const defaultKey = `${type}:{}`;
    return this.rendererInstances.get(defaultKey) || null;
  }

  isSupported(type: string): boolean {
    return this.rendererClasses.has(type);
  }

  getSupportedTypes(): string[] {
    return Array.from(this.rendererClasses.keys());
  }

  /**
   * 清理所有渲染器实例
   */
  async dispose(): Promise<void> {
    for (const [key, renderer] of this.rendererInstances) {
      try {
        if (renderer.dispose) {
          await renderer.dispose();
        }
      } catch (error) {
        console.error(`[Engine] 清理渲染器失败: ${key}`, error);
      }
    }
    this.rendererInstances.clear();
    console.log('✅ [Engine] 渲染器工厂已清理');
  }

  /**
   * 获取渲染器信息
   */
  getRendererInfo(type: string): any {
    const RendererClass = this.rendererClasses.get(type);
    if (!RendererClass) {
      return null;
    }

    try {
      const tempRenderer = new RendererClass();
      return tempRenderer.getConfig();
    } catch (error) {
      console.error(`[Engine] 获取渲染器信息失败: ${type}`, error);
      return null;
    }
  }
}

// 全局渲染器工厂实例
export const rendererFactory = new RendererFactory();