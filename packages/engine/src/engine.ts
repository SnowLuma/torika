import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import yaml from 'js-yaml';
import type { ThemeConfig, PageData, PageType, ThemeExport } from './types/theme.js';
import type { IRenderer, TemplateData, RenderResult, RENDERER_TYPES } from './types/renderer.js';
import { rendererFactory } from './renderer-factory.js';

export const cache = new Map<string, string>();

// 主题加载器
export class ThemeLoader {
  private static loadedThemes = new Map<string, ThemeExport>();

  /**
   * 根据配置文件自动加载主题
   */
  static async loadThemeFromConfig(configPath: string): Promise<ThemeExport | null> {
    try {
      if (!fs.existsSync(configPath)) {
        console.warn(`配置文件不存在: ${configPath}`);
        return null;
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = yaml.load(configContent) as any;
      
      if (!config?.theme) {
        console.warn('配置文件中未指定主题');
        return null;
      }

      return await this.loadTheme(config.theme, path.dirname(configPath));
    } catch (error) {
      console.error('加载主题配置失败:', error);
      return null;
    }
  }

  /**
   * 加载指定主题
   */
  static async loadTheme(themeName: string, basePath?: string): Promise<ThemeExport | null> {
    try {
      // 检查缓存
      if (this.loadedThemes.has(themeName)) {
        return this.loadedThemes.get(themeName)!;
      }

      // 查找主题路径
      const themePath = this.resolveThemePath(themeName, basePath);
      if (!themePath) {
        console.error(`找不到主题: ${themeName}`);
        return null;
      }

      // 加载主题模块
      const themeModule = await import(themePath);
      const themeExport: ThemeExport = themeModule.default || themeModule;

      // 验证主题格式
      if (!this.validateThemeExport(themeExport)) {
        console.error(`主题格式不正确: ${themeName}`);
        return null;
      }

      // 缓存主题
      this.loadedThemes.set(themeName, themeExport);
      console.log(`✅ 主题加载成功: ${themeName}`);
      
      return themeExport;
    } catch (error) {
      console.error(`加载主题失败: ${themeName}`, error);
      return null;
    }
  }

  /**
   * 解析主题路径
   */
  private static resolveThemePath(themeName: string, basePath?: string): string | null {
    const possiblePaths = [
      // 相对于当前项目的主题路径
      basePath ? path.resolve(basePath, `themes/${themeName}`) : null,
      basePath ? path.resolve(basePath, `../packages/${themeName}`) : null,
      // node_modules中的主题包
      path.resolve(process.cwd(), `node_modules/@torika/${themeName}`),
      path.resolve(process.cwd(), `node_modules/${themeName}`),
      // 当前工作目录的themes文件夹
      path.resolve(process.cwd(), `themes/${themeName}`),
    ].filter(Boolean) as string[];

    for (const themePath of possiblePaths) {
      const indexPath = path.join(themePath, 'index.js');
      const packagePath = path.join(themePath, 'package.json');
      
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
      if (fs.existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
          const main = pkg.main || 'index.js';
          const mainPath = path.join(themePath, main);
          if (fs.existsSync(mainPath)) {
            return mainPath;
          }
        } catch {}
      }
    }

    return null;
  }

  /**
   * 验证主题导出格式
   */
  private static validateThemeExport(themeExport: any): themeExport is ThemeExport {
    return (
      themeExport &&
      typeof themeExport.name === 'string' &&
      typeof themeExport.version === 'string' &&
      typeof themeExport.engine === 'string' &&
      typeof themeExport.config === 'object' &&
      typeof themeExport.layouts === 'object'
    );
  }

  /**
   * 获取已加载的主题
   */
  static getLoadedTheme(themeName: string): ThemeExport | undefined {
    return this.loadedThemes.get(themeName);
  }

  /**
   * 清除主题缓存
   */
  static clearCache(): void {
    this.loadedThemes.clear();
  }
}

/**
 * 主渲染引擎 - 控制整个渲染流程
 * 负责主题管理、渲染器选择、HTML文档生成
 */
export class RenderEngine {
  private currentTheme: ThemeExport | null = null;
  private currentRenderer: IRenderer | null = null;
  private config: Record<string, any> = {};

  /**
   * 初始化引擎
   */
  async initialize(config?: Record<string, any>): Promise<void> {
    this.config = { ...this.config, ...config };

    // 尝试自动注册默认的 React 渲染器（如果 renderer 包可用）
    try {
      const rendererModule = await import('../../renderer/dist/index.js');
      if (rendererModule && rendererModule.ReactRenderer) {
        // 动态注册 React 渲染器
        rendererFactory.registerRenderer('react', rendererModule.ReactRenderer);
        console.log('✅ [Engine] 已自动注册 ReactRenderer');
      }
    } catch {
      // 忽略无法加载 renderer 包的情况（运行时可按需注册）
    }

    console.log('✅ [Engine] 渲染引擎初始化完成');
  }

  /**
   * 注册渲染器
   */
  registerRenderer(type: string, rendererClass: new (config?: any) => IRenderer): void {
    rendererFactory.registerRenderer(type, rendererClass);
  }

  /**
   * 设置主题
   */
  async setTheme(theme: ThemeExport): Promise<void> {
    this.currentTheme = theme;
    
    // 根据主题配置选择渲染器
    const rendererType = theme.engine || 'react';
    this.currentRenderer = await rendererFactory.createRenderer(rendererType, theme.config);
    
    if (!this.currentRenderer) {
      throw new Error(`无法创建渲染器: ${rendererType}`);
    }

    // 如果渲染器支持注入主题模块，将完整的主题导出注入进去
    if (this.currentRenderer.setThemeModule) {
      this.currentRenderer.setThemeModule(theme);
    }
    
    console.log(`✅ [Engine] 主题设置成功: ${theme.name}, 渲染器: ${rendererType}`);
  }

  /**
   * 渲染页面
   */
  async renderPage(pageData: PageData): Promise<string> {
    if (!this.currentTheme || !this.currentRenderer) {
      throw new Error('引擎未初始化或主题未设置');
    }

    try {
      // 1. 获取页面模板
      const template = this.getPageTemplate(pageData);
      if (!template) {
        throw new Error(`找不到页面模板: ${pageData.type}`);
      }

      // 2. 准备模板数据
      const templateData: TemplateData = {
        template,
        props: {
          meta: pageData.meta,
          ...pageData.meta,
          content: pageData.content
        },
        metadata: {
          pageType: pageData.type,
          theme: this.currentTheme.name
        }
      };

      // 3. 使用渲染器渲染
      const renderResult = await this.currentRenderer.render(templateData);
      if (!renderResult.success) {
        throw new Error(`渲染失败: ${renderResult.error}`);
      }

      // 4. 生成完整的HTML文档
      return this.generateHTMLDocument(renderResult.html, pageData);

    } catch (error) {
      console.error(`[Engine] 页面渲染失败:`, error);
      throw error;
    }
  }

  /**
   * 获取页面模板
   */
  private getPageTemplate(pageData: PageData): any {
    if (!this.currentTheme) return null;

    const { layouts, components } = this.currentTheme;

    // 优先考虑 meta 指定的自定义页面组件（例如 frontmatter 中指定 page 或 component）
    const customName = pageData.meta?.page || pageData.meta?.component;
    if (customName) {
      return (
        components?.[customName] ||
        layouts?.[customName] ||
        (this.currentTheme as any)[customName]
      );
    }

    // 根据页面类型选择模板
    switch (pageData.type) {
      case 'post':
        return layouts.Post || layouts.post || layouts.default;
      case 'page':
        return layouts.Page || layouts.page || layouts.default;
      case 'index':
        return components?.IndexPage || layouts.Index || layouts.index || layouts.default;
      case 'archive':
        return components?.ArchivePage || layouts.Archive || layouts.archive || layouts.default;
      default:
        return layouts.default;
    }
  }

  /**
   * 生成完整的HTML文档
   */
  private generateHTMLDocument(content: string, pageData: PageData): string {
    const { meta } = pageData;
    const theme = this.currentTheme!;

    // 简单的属性值转义，避免将任意内容直接放入属性中导致 HTML 解析错误
    const escapeAttr = (v: any) => {
      if (v === undefined || v === null) return '';
      return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // 生成meta标签（对值进行转义）
    const metaTags = Object.entries(meta)
      .filter(([key, value]) => value !== undefined && value !== null && typeof value === 'string')
      .map(([name, value]) => `  <meta name="${escapeAttr(name)}" content="${escapeAttr(value)}">`)
      .join('\n');

    // 生成样式链接
    const styleLinks = (theme.config.customStyles || [])
      .map(style => `  <link rel="stylesheet" href="${escapeAttr(style)}">`)
      .join('\n');

    // 生成脚本链接
    const scriptTags = (theme.config.customScripts || [])
      .map(script => `  <script src="${escapeAttr(script)}"></script>`)
      .join('\n');

    // 将完整的页面数据以 JSON 的形式注入到页面中，供浏览器端脚本使用（安全处理闭合 script）
    const safePageDataJson = escapeAttr(JSON.stringify({ meta: pageData.meta, content: pageData.content }).replace(/<\/script>/gi, '<\\/script>'));
    const pageDataScript = `  <script id="__TORIKA_PAGE_DATA__" type="application/json">${safePageDataJson}</script>`;

    return `<!DOCTYPE html>
<html lang="${escapeAttr(theme.config.lang || 'zh-CN')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeAttr(meta.title || theme.config.siteName || '无标题')}</title>
${metaTags ? metaTags + '\n' : ''}${styleLinks ? styleLinks + '\n' : ''}${scriptTags ? scriptTags + '\n' : ''}${pageDataScript ? pageDataScript + '\n' : ''}</head>
<body>
${content}
${scriptTags ? scriptTags + '\n' : ''}</body>
</html>`;
  }

  /**
   * 编译单个Markdown文件或复制资源（支持 contentRoot 用于计算输出路径）
   */
  async compileMarkdown(file: string, outDir: string, contentRoot?: string): Promise<void> {
    try {
      const ext = path.extname(file).toLowerCase();

      // 计算相对输出路径（基于 contentRoot，如果未提供则取 basename）
      const rel = contentRoot ? path.relative(contentRoot, file) : path.basename(file);
      const outRel = ext === '.md' ? rel.replace(/\.md$/i, '.html') : rel;
      const outFile = path.join(outDir, outRel);

      // 确保输出目录存在
      fs.mkdirSync(path.dirname(outFile), { recursive: true });

      if (ext !== '.md') {
        // 非 Markdown 文件直接复制（静态资源或 HTML 等）
        fs.copyFileSync(file, outFile);
        console.log(`📦 [Engine] Copied static asset: ${file} -> ${outFile}`);
        return;
      }

      const raw = fs.readFileSync(file, 'utf-8');
      const { content, data } = matter(raw);
      const htmlContent = marked.parse(content, { async: false }) as string;

      // 决定页面类型：位于 _posts 目录下的视为 post，否则视为 page/custom
      const isPost = rel.split(path.sep).includes('_posts');
      const pageType: PageType = isPost ? 'post' as PageType : 'page' as PageType;

      const pageData: PageData = {
        type: pageType,
        meta: {
          title: data.title || '无标题',
          author: data.author,
          date: data.date,
          tags: data.tags,
          rawMarkdown: content,
          renderedHtml: htmlContent,
          ...data
        },
        content: htmlContent,
        filePath: file,
        outputPath: outFile
      };

      const html = await this.renderPage(pageData);
      cache.set(file, html);
      fs.writeFileSync(outFile, html, 'utf-8');
      console.log(`✨ [Engine] Updated: ${file} -> ${outFile}`);
    } catch (error) {
      console.error(`[Engine] 编译失败: ${file}`, error);
      throw error;
    }
  }

  /**
   * 全量构建：递归扫描 contentDir，渲染 Markdown，复制静态资源；首页 posts 列表只收集 _posts 下面的 Markdown。
   */
  async fullBuild(contentDir: string, outDir: string): Promise<void> {
    console.log("🔨 [Engine] Full build...");
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    // 递归列举所有文件
    const allFiles: string[] = [];
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          allFiles.push(full);
        }
      }
    };

    if (fs.existsSync(contentDir)) {
      walk(contentDir);
    } else {
      console.warn(`[Engine] 内容目录不存在: ${contentDir}`);
    }

    // 收集 posts 列表（仅来自 contentDir/_posts 目录）
    const postsDir = path.join(contentDir, '_posts');
    const postFiles: string[] = [];
    if (fs.existsSync(postsDir)) {
      const collectPosts = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            collectPosts(full);
          } else if (full.toLowerCase().endsWith('.md')) {
            postFiles.push(full);
          }
        }
      };
      collectPosts(postsDir);
    }

    const posts: Array<{ meta: any; excerpt?: string; url: string }> = [];

    // 先生成 posts 列表元数据
    for (const file of postFiles) {
      try {
        const raw = fs.readFileSync(file, 'utf-8');
        const { content, data } = matter(raw);
        const rendered = marked.parse(content, { async: false }) as string;
        const text = rendered.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        const excerpt = text.length > 160 ? text.slice(0, 157) + '...' : text;

        const rel = path.relative(contentDir, file);
        const url = (data.slug && `${data.slug}.html`) || rel.replace(/\\/g, '/').replace(/\.md$/i, '.html');

        posts.push({
          meta: {
            title: data.title || '无标题',
            date: data.date,
            tags: data.tags || [],
            ...data
          },
          excerpt,
          url
        });
      } catch (err) {
        console.warn(`[Engine] 读取 post 元数据失败: ${file}`, err);
      }
    }

    // 编译或复制所有文件
    for (const file of allFiles) {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.md') {
        await this.compileMarkdown(file, outDir, contentDir);
      } else {
        // 直接复制非 Markdown 文件到输出目录，保持相对路径
        const rel = path.relative(contentDir, file);
        const outFile = path.join(outDir, rel);
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.copyFileSync(file, outFile);
        console.log(`📦 [Engine] Copied asset: ${file} -> ${outFile}`);
      }
    }

    // 生成首页与归档（只基于 posts 列表）
    if (this.currentTheme) {
      try {
        const indexPageData: PageData = {
          type: 'index' as PageType,
          meta: {
            title: this.currentTheme.config.siteName || '首页',
            posts,
          },
          content: '',
          filePath: '<<generated-index>>',
          outputPath: path.join(outDir, 'index.html')
        };

        const indexHtml = await this.renderPage(indexPageData);
        fs.writeFileSync(indexPageData.outputPath, indexHtml, 'utf-8');
        console.log(`✨ [Engine] Generated index: ${indexPageData.outputPath}`);
      } catch (err) {
        console.warn('[Engine] 生成首页失败:', err);
      }

      try {
        const archivePageData: PageData = {
          type: 'archive' as PageType,
          meta: {
            title: '归档',
            posts,
            groupBy: 'year'
          },
          content: '',
          filePath: '<<generated-archive>>',
          outputPath: path.join(outDir, 'archive.html')
        };

        const archiveHtml = await this.renderPage(archivePageData);
        fs.writeFileSync(archivePageData.outputPath, archiveHtml, 'utf-8');
        console.log(`✨ [Engine] Generated archive: ${archivePageData.outputPath}`);
      } catch (err) {
        console.warn('[Engine] 生成归档页失败:', err);
      }
    }

    // 复制主题静态资源
    if (this.currentTheme?.staticDir && fs.existsSync(this.currentTheme.staticDir)) {
      await StaticAssetsHandler.copyStaticAssets(this.currentTheme.staticDir, outDir);
    }
  }

  /**
   * 获取缓存
   */
  getCache(file: string): string | undefined {
    return cache.get(file);
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    await rendererFactory.dispose();
    this.currentTheme = null;
    this.currentRenderer = null;
    console.log('✅ [Engine] 引擎已清理');
  }
}

// 全局渲染引擎实例
const renderEngine = new RenderEngine();

/**
 * 获取全局渲染引擎
 */
export function getRenderEngine(): RenderEngine {
  return renderEngine;
}

export async function compileMarkdown(file: string, outDir: string, contentRoot?: string): Promise<void> {
  // 优先使用新的 RenderEngine 实现（如果已初始化）
  try {
    if (renderEngine) {
      return await renderEngine.compileMarkdown(file, outDir, contentRoot);
    }
  } catch (err) {
    throw err;
  }
}

export async function fullBuild(contentDir: string, outDir: string): Promise<void> {
  try {
    if (renderEngine) {
      return await renderEngine.fullBuild(contentDir, outDir);
    }
  } catch (err) {
    throw err;
  }
}

// 静态资源处理器
export class StaticAssetsHandler {
  /**
   * 复制静态资源目录
   */
  static async copyStaticAssets(staticDir: string, outDir: string): Promise<void> {
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
  private static async copyDirectory(src: string, dest: string): Promise<void> {
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
   * 获取静态资源URL
   */
  static getStaticUrl(assetPath: string): string {
    return `/static/${assetPath}`;
  }
}

// 配置文件处理器
export class ConfigLoader {
  /**
   * 加载YAML配置文件
   */
  static loadConfig<T = any>(configPath: string, defaultConfig?: T): T {
    try {
      if (!fs.existsSync(configPath)) {
        console.warn(`配置文件不存在，使用默认配置: ${configPath}`);
        return defaultConfig || {} as T;
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = yaml.load(configContent) as T;
      
      return { ...defaultConfig, ...config } as T;
    } catch (error) {
      console.error(`配置文件加载失败: ${configPath}`, error);
      return defaultConfig || {} as T;
    }
  }

  /**
   * 保存配置到YAML文件
   */
  static saveConfig<T = any>(configPath: string, config: T): void {
    try {
      const yamlContent = yaml.dump(config);
      fs.writeFileSync(configPath, yamlContent, 'utf-8');
      console.log(`✅ 配置文件保存成功: ${configPath}`);
    } catch (error) {
      console.error(`配置文件保存失败: ${configPath}`, error);
    }
  }
}
