import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import yaml from 'js-yaml';
import type { ThemeConfig, PageData, PageType, ThemeExport } from './types/theme.js';
import type { ThemeRendererEngine } from './types/renerer.js';

export const cache = new Map<string, string>();

// 兼容旧接口
export interface ThemeEngine {
  compileMarkdown(file: string, outDir: string): void;
  fullBuild(contentDir: string, outDir: string): void;
  getCache?(file: string): string | undefined;
}

// 默认的简单HTML主题引擎
export class DefaultThemeEngine implements ThemeEngine {
  compileMarkdown(file: string, outDir: string): void {
    const raw = fs.readFileSync(file, "utf-8");
    const { content, data } = matter(raw);
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || '无标题'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 { color: #2c3e50; }
    code {
      background: #f4f4f4;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
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
  </style>
</head>
<body>
  <h1>${data.title || '无标题'}</h1>
  <div class="content">
    ${marked.parse(content, { async: false })}
  </div>
</body>
</html>`;
    cache.set(file, html);

    const outFile = path.join(outDir, path.basename(file).replace(".md", ".html"));
    fs.writeFileSync(outFile, html, 'utf-8');
    console.log(`✨ [Engine] Updated: ${file}`);
  }

  fullBuild(contentDir: string, outDir: string): void {
    console.log("🔨 [Engine] Full build...");
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    const files = fs.readdirSync(contentDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      this.compileMarkdown(path.join(contentDir, file), outDir);
    }
  }

  getCache(file: string): string | undefined {
    return cache.get(file);
  }
}

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

// 全局主题引擎实例
let currentThemeEngine: ThemeEngine = new DefaultThemeEngine();

/**
 * 设置主题引擎
 */
export function setThemeEngine(themeEngine: ThemeEngine) {
  currentThemeEngine = themeEngine;
}

/**
 * 获取当前主题引擎
 */
export function getThemeEngine(): ThemeEngine {
  return currentThemeEngine;
}

export function compileMarkdown(file: string, outDir: string) {
  return currentThemeEngine.compileMarkdown(file, outDir);
}

export function fullBuild(contentDir: string, outDir: string) {
  return currentThemeEngine.fullBuild(contentDir, outDir);
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
