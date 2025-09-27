/**
 * 通用渲染器接口规范
 * 所有渲染器（React、Vue、Svelte等）都必须遵守这个规范
 */

// 渲染结果
export interface RenderResult {
  /** 渲染后的HTML字符串 */
  html: string;
  /** 是否渲染成功 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
  /** 渲染器特定的元数据 */
  metadata?: Record<string, any>;
}

// 渲染器配置
export interface RendererConfig {
  /** 渲染器名称 */
  name: string;
  /** 渲染器版本 */
  version: string;
  /** 渲染器类型 */
  type: string;
  /** 渲染器特定选项 */
  options?: Record<string, any>;
}

// 模板数据
export interface TemplateData {
  /** 模板/组件 */
  template: any;
  /** 传递给模板的属性 */
  props?: Record<string, any>;
  /** 子内容 */
  children?: any;
  /** 额外元数据 */
  metadata?: Record<string, any>;
}

// 通用渲染器接口
export interface IRenderer {
  /** 获取渲染器配置 */
  getConfig(): RendererConfig;
  
  /** 渲染模板为HTML */
  render(templateData: TemplateData): Promise<RenderResult>;
  
  /** 同步渲染（如果支持） */
  renderSync?(templateData: TemplateData): RenderResult;
  
  /** 验证模板数据是否有效 */
  validate(templateData: TemplateData): boolean;
  
  /** 初始化渲染器 */
  initialize?(config?: Record<string, any>): Promise<void>;
  
  /** 清理资源 */
  dispose?(): Promise<void>;
  
  /** 可选：将主题模块注入到渲染器（例如 React 渲染器可能需要访问组件/布局） */
  setThemeModule?(themeModule: any): void;
}

// 渲染器工厂接口
export interface IRendererFactory {
  /** 注册渲染器 */
  registerRenderer(type: string, rendererClass: new (config?: any) => IRenderer): void;
  
  /** 创建渲染器实例 */
  createRenderer(type: string, config?: Record<string, any>): Promise<IRenderer | null>;
  
  /** 获取渲染器实例 */
  getRenderer(type: string): IRenderer | null;
  
  /** 检查是否支持指定类型 */
  isSupported(type: string): boolean;
  
  /** 获取所有支持的渲染器类型 */
  getSupportedTypes(): string[];
}

// 渲染器类型常量
export const RENDERER_TYPES = {
  REACT: 'react',
  VUE: 'vue',
  SVELTE: 'svelte',
  SOLID: 'solid',
  PREACT: 'preact',
  ANGULAR: 'angular'
} as const;

export type RendererType = typeof RENDERER_TYPES[keyof typeof RENDERER_TYPES];