import React from 'react';
import { renderToString } from 'react-dom/server';
import type { 
  IRenderer, 
  TemplateData, 
  RenderResult, 
  RendererConfig
} from '../../engine/src/types/renderer.js';

/**
 * React渲染器 - 遵守统一的渲染器接口规范
 * 实现IRenderer接口，可被engine统一管理
 */
export class ReactRenderer implements IRenderer {
  private config: RendererConfig;
  private themeModule: any = null;

  constructor(config?: Record<string, any>) {
    this.config = {
      name: 'ReactRenderer',
      version: '1.0.0',
      type: 'react',
      options: config || {}
    };
  }

  getConfig(): RendererConfig {
    return { ...this.config };
  }

  validate(templateData: TemplateData): boolean {
    if (!templateData || typeof templateData !== 'object') {
      return false;
    }

    const { template } = templateData;
    
    // 检查是否为有效的React组件或元素
    return React.isValidElement(template) || 
           typeof template === 'function' ||
           (typeof template === 'object' && template?.$$typeof);
  }

  async render(templateData: TemplateData): Promise<RenderResult> {
    try {
      if (!this.validate(templateData)) {
        return {
          html: '',
          success: false,
          error: 'Invalid template data for React renderer'
        };
      }

      const element = this.createReactElement(templateData);
      if (!element) {
        return {
          html: '',
          success: false,
          error: 'Failed to create React element'
        };
      }

      const html = renderToString(element);
      
      return {
        html,
        success: true,
        metadata: {
          renderer: 'react',
          version: this.config.version
        }
      };
    } catch (error) {
      return {
        html: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown render error'
      };
    }
  }

  renderSync(templateData: TemplateData): RenderResult {
    try {
      if (!this.validate(templateData)) {
        return {
          html: '',
          success: false,
          error: 'Invalid template data for React renderer'
        };
      }

      const element = this.createReactElement(templateData);
      if (!element) {
        return {
          html: '',
          success: false,
          error: 'Failed to create React element'
        };
      }

      const html = renderToString(element);
      
      return {
        html,
        success: true,
        metadata: {
          renderer: 'react',
          version: this.config.version
        }
      };
    } catch (error) {
      return {
        html: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown render error'
      };
    }
  }

  async initialize(config?: Record<string, any>): Promise<void> {
    if (config) {
      this.config.options = { ...this.config.options, ...config };
    }
  }

  async dispose(): Promise<void> {
    // React渲染器无需特殊清理
  }

  /**
   * 创建React元素
   */
  private createReactElement(templateData: TemplateData): React.ReactElement | null {
    const { template, props = {}, children } = templateData;

    try {
      // 如果已经是React元素，克隆并添加props
      if (React.isValidElement(template)) {
        return children 
          ? React.cloneElement(template, props, children) 
          : React.cloneElement(template, props);
      }

      // 如果是React组件（函数或类）
      if (typeof template === 'function') {
        const finalProps = children ? { ...props, children } : props;
        return React.createElement(template, finalProps);
      }

      // 如果是组件对象
      if (typeof template === 'object' && template) {
        const finalProps = children ? { ...props, children } : props;
        return React.createElement(template, finalProps);
      }

      // 如果是字符串形式的模板，尝试从注入的主题模块中查找组件
      if (typeof template === 'string' && this.themeModule) {
        const comp = (
          this.themeModule[template] ||
          this.themeModule.components?.[template] ||
          this.themeModule.layouts?.[template] ||
          this.themeModule.default?.components?.[template] ||
          this.themeModule.default?.layouts?.[template]
        );

        if (comp) {
          const finalProps = children ? { ...props, children } : props;
          return React.createElement(comp, finalProps);
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to create React element:', error);
      return null;
    }
  }

  /**
   * 注入主题模块
   */
  setThemeModule(themeModule: any): void {
    this.themeModule = themeModule;
  }
}
