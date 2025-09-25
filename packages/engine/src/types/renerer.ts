import type { PageData, ThemeConfig } from './theme.js';

// 渲染选项接口
export interface RenderOptions {
  lang?: string;
  title?: string;
  meta?: Record<string, string>;
  styles?: string[];
  scripts?: string[];
}

// 主题渲染引擎抽象类
export abstract class ThemeRendererEngine {
  protected config: ThemeConfig;

  constructor(config: ThemeConfig = {}) {
    this.config = config;
  }

  abstract getEngineName(): string;
  abstract renderPage(pageData: PageData): Promise<string>;
  abstract renderToHtml(component: any, options?: RenderOptions): string;
  abstract compileMarkdown(file: string, outDir: string): Promise<void>;
  abstract fullBuild(contentDir: string, outDir: string): Promise<void>;
  
  // 可选方法
  getCache?(file: string): string | undefined;
  updateConfig?(newConfig: Partial<ThemeConfig>): void;
  getConfig?(): ThemeConfig;
  copyStaticAssets?(staticDir: string, outDir: string): Promise<void>;
}