import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import React from "react";
import { renderToHtml } from "./renderer.js";
// 临时定义，直到engine包构建完成
export interface ThemeConfig {
  siteName?: string;
  author?: string;
  lang?: string;
  description?: string;
  customStyles?: string[];
  customScripts?: string[];
  staticDir?: string;
  [key: string]: any;
}

export interface PageMeta {
  title?: string;
  author?: string;
  date?: string | Date;
  tags?: string[];
  description?: string;
  layout?: string;
  [key: string]: any;
}

export enum PageType {
  Post = 'post',
  Page = 'page',
  Index = 'index',
  Archive = 'archive',
  Tag = 'tag',
  Custom = 'custom'
}

export interface PageData {
  type: PageType;
  meta: PageMeta;
  content: string;
  filePath: string;
  outputPath: string;
}

export interface RenderOptions {
  lang?: string;
  title?: string;
  meta?: Record<string, string>;
  styles?: string[];
  scripts?: string[];
}

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
  
  getCache?(file: string): string | undefined;
  updateConfig?(newConfig: Partial<ThemeConfig>): void;
  getConfig?(): ThemeConfig;
  copyStaticAssets?(staticDir: string, outDir: string): Promise<void>;
}

export class ReactThemeEngine extends ThemeRendererEngine {
  private cache = new Map<string, string>();
  private themeModule: any = null;
  private themeName: string = '';

  constructor(config: ThemeConfig = {}, themeName?: string) {
    super({
      siteName: 'Torika Blog',
      author: 'Anonymous',
      lang: 'zh-CN',
      customStyles: [],
      customScripts: [],
      ...config
    });
    this.themeName = themeName || 'default-theme-react';
  }

  getEngineName(): string {
    return 'react';
  }

  /**
   * 设置主题模块
   */
  setThemeModule(themeModule: any): void {
    this.themeModule = themeModule;
  }

  /**
   * 获取主题组件
   */
  private getThemeComponent(componentName: string): any {
    if (!this.themeModule) {
      console.warn(`主题模块未加载: ${this.themeName}`);
      return null;
    }

    // 尝试多种方式获取组件
    return (
      this.themeModule[componentName] ||
      this.themeModule.components?.[componentName] ||
      this.themeModule.layouts?.[componentName] ||
      this.themeModule.default?.[componentName] ||
      this.themeModule.default?.components?.[componentName] ||
      this.themeModule.default?.layouts?.[componentName]
    );
  }

  /**
   * 获取主题布局组件
   */
  private getLayoutComponent(layoutName: string): any {
    const layouts = this.themeModule?.layouts || this.themeModule?.default?.layouts || {};
    return layouts[layoutName] || layouts.default || layouts.Layout;
  }

  /**
   * 渲染页面数据
   */
  async renderPage(pageData: PageData): Promise<string> {
    const { meta, content, type } = pageData;
    
    // 如果没有加载主题模块，尝试加载
    if (!this.themeModule) {
      await this.loadThemeModule();
    }

    let component: React.ReactElement;
    
    // 1. 优先检查是否有自定义页面组件（通过meta.page或meta.component指定）
    const customPageName = meta.page || meta.component;
    if (customPageName && typeof customPageName === 'string') {
      const CustomComponent = this.getThemeComponent(customPageName);
      if (CustomComponent) {
        component = React.createElement(CustomComponent, {
          meta,
          content,
          ...meta // 传递所有元数据作为props
        });
        return this.wrapWithLayoutAndRender(component, pageData, meta.layout);
      }
    }

    // 2. 根据页面类型选择对应的组件
    component = await this.createComponentByType(type, meta, content);

    // 3. 包装布局并渲染
    return this.wrapWithLayoutAndRender(component, pageData, meta.layout);
  }

  /**
   * 根据页面类型创建组件
   */
  private async createComponentByType(type: PageType, meta: PageMeta, content: string): Promise<React.ReactElement> {
    switch (type) {
      case PageType.Post:
      case PageType.Page:
        return this.createPostComponent(meta, content);
      
      case PageType.Index:
        return this.createIndexComponent(meta, content);
      
      case PageType.Archive:
        return this.createArchiveComponent(meta, content);
      
      case PageType.Custom:
        return this.createCustomComponent(meta, content);
      
      default:
        return this.createDefaultComponent(content);
    }
  }

  /**
   * 创建文章组件
   */
  private createPostComponent(meta: PageMeta, content: string): React.ReactElement {
    const PostComponent = this.getThemeComponent('Post') || this.getLayoutComponent('post');
    
    if (PostComponent) {
      return React.createElement(PostComponent, { meta, content });
    }

    // 回退到默认HTML结构
    return this.createDefaultPostComponent(meta, content);
  }

  /**
   * 创建首页组件
   */
  private createIndexComponent(meta: PageMeta, content: string): React.ReactElement {
    const IndexComponent = this.getThemeComponent('IndexPage') || 
                           this.getThemeComponent('Index') || 
                           this.getLayoutComponent('index');
    
    if (IndexComponent && meta.posts && Array.isArray(meta.posts)) {
      return React.createElement(IndexComponent, {
        title: meta.title || this.config.siteName,
        posts: meta.posts,
        ...meta
      });
    }

    return this.createDefaultComponent(content);
  }

  /**
   * 创建归档页面组件
   */
  private createArchiveComponent(meta: PageMeta, content: string): React.ReactElement {
    const ArchiveComponent = this.getThemeComponent('ArchivePage') || 
                            this.getThemeComponent('Archive') || 
                            this.getLayoutComponent('archive');
    
    if (ArchiveComponent && meta.posts && Array.isArray(meta.posts)) {
      return React.createElement(ArchiveComponent, {
        title: meta.title || '归档',
        posts: meta.posts,
        groupBy: meta.groupBy || 'year',
        ...meta
      });
    }

    return this.createDefaultComponent(content);
  }

  /**
   * 创建自定义页面组件
   */
  private createCustomComponent(meta: PageMeta, content: string): React.ReactElement {
    const CustomComponent = this.getThemeComponent('CustomPage') || 
                           this.getThemeComponent('Custom') || 
                           this.getLayoutComponent('custom');
    
    if (CustomComponent) {
      return React.createElement(CustomComponent, {
        title: meta.title,
        content,
        meta,
        layout: meta.pageLayout || 'default'
      });
    }

    return this.createDefaultComponent(content);
  }

  /**
   * 创建默认组件
   */
  private createDefaultComponent(content: string): React.ReactElement {
    return React.createElement('div', { 
      className: 'default-content',
      dangerouslySetInnerHTML: { __html: content } 
    });
  }

  /**
   * 创建默认文章组件
   */
  private createDefaultPostComponent(meta: PageMeta, content: string): React.ReactElement {
    return React.createElement('article', { 
      className: 'default-post' 
    }, [
      // 标题
      meta.title && React.createElement('header', { 
        key: 'header',
        className: 'post-header' 
      }, [
        React.createElement('h1', { 
          key: 'title',
          className: 'post-title' 
        }, meta.title),
        // 元信息
        (meta.author || meta.date) && React.createElement('div', { 
          key: 'meta',
          className: 'post-meta' 
        }, [
          meta.author && React.createElement('span', { 
            key: 'author',
            className: 'post-author' 
          }, `作者: ${meta.author}`),
          meta.date && React.createElement('time', { 
            key: 'date',
            className: 'post-date' 
          }, typeof meta.date === 'string' ? meta.date : meta.date.toISOString().split('T')[0])
        ].filter(Boolean))
      ].filter(Boolean)),
      // 内容
      React.createElement('div', { 
        key: 'content',
        className: 'post-content',
        dangerouslySetInnerHTML: { __html: content } 
      })
    ].filter(Boolean));
  }

  /**
   * 创建默认布局
   */
  private createDefaultLayout(children: React.ReactElement): React.ReactElement {
    return React.createElement('html', { 
      lang: this.config.lang || 'zh-CN' 
    }, [
      React.createElement('head', { key: 'head' }, [
        React.createElement('meta', { 
          key: 'charset',
          charSet: 'UTF-8' 
        }),
        React.createElement('meta', { 
          key: 'viewport',
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0' 
        }),
        React.createElement('title', { 
          key: 'title' 
        }, this.config.siteName || 'Torika Blog'),
        // 默认样式
        React.createElement('style', { 
          key: 'default-styles',
          dangerouslySetInnerHTML: { 
            __html: `
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                color: #333;
              }
              .default-post .post-title {
                color: #2c3e50;
                margin-bottom: 1rem;
              }
              .default-post .post-meta {
                color: #666;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #eee;
              }
              .default-post .post-meta > * {
                margin-right: 1rem;
              }
              .default-content, .post-content {
                line-height: 1.8;
              }
              code {
                background: #f4f4f4;
                padding: 2px 4px;
                border-radius: 3px;
              }
              pre {
                background: #f4f4f4;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
              }
              blockquote {
                border-left: 4px solid #3498db;
                padding-left: 15px;
                margin-left: 0;
                color: #666;
              }
            ` 
          }
        }),
        // 自定义样式
        ...(this.config.customStyles || []).map((style, index) => 
          React.createElement('link', { 
            key: `style-${index}`,
            rel: 'stylesheet',
            href: style 
          })
        )
      ]),
      React.createElement('body', { key: 'body' }, [
        React.createElement('div', { 
          key: 'root',
          id: 'root' 
        }, children),
        // 自定义脚本
        ...(this.config.customScripts || []).map((script, index) => 
          React.createElement('script', { 
            key: `script-${index}`,
            src: script 
          })
        )
      ])
    ]);
  }

  /**
   * 包装布局并渲染
   */
  private wrapWithLayoutAndRender(
    component: React.ReactElement, 
    pageData: PageData, 
    layoutName?: string
  ): string {
    const { meta, type } = pageData;
    
    // 如果指定了特定布局，使用指定的布局
    let finalComponent = component;
    
    if (layoutName && layoutName !== 'none') {
      const LayoutComponent = this.getLayoutComponent(layoutName);
      if (LayoutComponent) {
        finalComponent = React.createElement(LayoutComponent, {
          title: this.config.siteName,
          children: component
        });
      }
    } else if (type !== PageType.Custom || !layoutName) {
      // 默认情况下，非自定义页面使用默认布局
      const DefaultLayout = this.getLayoutComponent('default') || 
                           this.getThemeComponent('Layout');
      
      if (DefaultLayout) {
        finalComponent = React.createElement(DefaultLayout, {
          title: this.config.siteName,
          children: component
        });
      } else {
        // 回退到默认HTML布局
        finalComponent = this.createDefaultLayout(component);
      }
    }

    // 如果使用了默认布局，直接渲染为字符串（因为已经包含了完整的HTML结构）
    if (finalComponent.type === 'html') {
      return '<!DOCTYPE html>' + this.renderComponentToString(finalComponent);
    }

    return this.renderToHtml(finalComponent, {
      lang: this.config.lang!,
      title: meta.title || this.config.siteName || '无标题',
      meta: {
        author: meta.author || this.config.author || '',
        description: meta.description || this.config.description || '',
        ...(meta as Record<string, string>)
      },
      styles: this.config.customStyles!,
      scripts: this.config.customScripts!
    });
  }

  /**
   * 加载主题模块
   */
  private async loadThemeModule(): Promise<void> {
    if (this.themeModule) return;

    try {
      // 尝试加载指定的主题模块
      const module = await import(this.themeName);
      this.themeModule = module.default || module;
      console.log(`✅ 主题模块加载成功: ${this.themeName}`);
    } catch (error) {
      console.warn(`⚠️ 无法加载主题模块 ${this.themeName}，使用内置组件`);
      // 加载默认主题作为回退
      try {
        const defaultModule = await import('@torika/default-theme-react');
        this.themeModule = defaultModule.default || defaultModule;
      } catch {
        console.warn('⚠️ 连默认主题都无法加载，将使用内置组件');
      }
    }
  }

  /**
   * 渲染React组件为HTML
   */
  renderToHtml(component: React.ReactElement, options?: RenderOptions): string {
    return renderToHtml(component, options);
  }

  /**
   * 渲染React组件为字符串（不包含DOCTYPE等）
   */
  private renderComponentToString(component: React.ReactElement): string {
    const React = require('react');
    const { renderToString } = require('react-dom/server');
    return renderToString(component);
  }

  /**
   * 编译单个Markdown文件为HTML
   */
  async compileMarkdown(file: string, outDir: string): Promise<void> {
    const raw = fs.readFileSync(file, "utf-8");
    const { content, data } = matter(raw);
    
    // 使用marked渲染Markdown内容
    const htmlContent = marked.parse(content, { async: false }) as string;
    
    // 创建页面数据
    const pageData: PageData = {
      type: PageType.Post,
      meta: {
        title: data.title || '无标题',
        author: data.author || this.config.author,
        date: data.date,
        tags: data.tags,
        ...data
      },
      content: htmlContent,
      filePath: file,
      outputPath: path.join(outDir, path.basename(file).replace(".md", ".html"))
    };

    // 使用renderPage方法渲染
    const html = await this.renderPage(pageData);

    // 缓存结果
    this.cache.set(file, html);

    // 写入文件
    const outFile = path.join(outDir, path.basename(file).replace(".md", ".html"));
    fs.writeFileSync(outFile, html, 'utf-8');
    console.log(`✨ [ReactTheme] Updated: ${file}`);
  }

  /**
   * 全量构建
   */
  async fullBuild(contentDir: string, outDir: string): Promise<void> {
    console.log("🔨 [ReactTheme] Full build...");
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    const files = fs.readdirSync(contentDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      await this.compileMarkdown(path.join(contentDir, file), outDir);
    }

    // 复制静态资源
    if (this.config.staticDir && fs.existsSync(this.config.staticDir)) {
      await this.copyStaticAssets(this.config.staticDir, outDir);
    }
  }

  /**
   * 复制静态资源
   */
  async copyStaticAssets(staticDir: string, outDir: string): Promise<void> {
    if (!fs.existsSync(staticDir)) {
      console.warn(`静态资源目录不存在: ${staticDir}`);
      return;
    }

    const staticOutDir = path.join(outDir, 'static');
    await this.copyDirectory(staticDir, staticOutDir);
    console.log(`✅ 静态资源复制完成: ${staticDir} -> ${staticOutDir}`);
  }

  /**
   * 递归复制目录
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * 获取缓存的HTML内容
   */
  getCache(file: string): string | undefined {
    return this.cache.get(file);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ThemeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ThemeConfig {
    return { ...this.config };
  }
}

// 导出默认实例
export const defaultThemeEngine = new ReactThemeEngine();