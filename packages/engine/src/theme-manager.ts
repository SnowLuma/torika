import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { ThemeConfig, PageData, PageType, ThemeExport } from './types/theme.js';
import { getRenderEngine } from './engine.js';

// 通用配置管理器
export class ConfigManager {
  private static instance: ConfigManager;
  private configs = new Map<string, any>();

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 加载配置文件
   */
  loadConfig<T = any>(configPath: string, defaultConfig?: T): T {
    try {
      if (this.configs.has(configPath)) {
        return this.configs.get(configPath);
      }

      if (!fs.existsSync(configPath)) {
        console.warn(`配置文件不存在，使用默认配置: ${configPath}`);
        const config = defaultConfig || {} as T;
        this.configs.set(configPath, config);
        return config;
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      let config: T;

      if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        config = yaml.load(configContent) as T;
      } else if (configPath.endsWith('.json')) {
        config = JSON.parse(configContent) as T;
      } else {
        throw new Error(`不支持的配置文件格式: ${configPath}`);
      }

      const mergedConfig = { ...defaultConfig, ...config } as T;
      this.configs.set(configPath, mergedConfig);
      console.log(`✅ 配置加载成功: ${configPath}`);
      
      return mergedConfig;
    } catch (error) {
      console.error(`配置文件加载失败: ${configPath}`, error);
      const config = defaultConfig || {} as T;
      this.configs.set(configPath, config);
      return config;
    }
  }

  /**
   * 保存配置文件
   */
  saveConfig<T = any>(configPath: string, config: T): void {
    try {
      let content: string;

      if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        content = yaml.dump(config);
      } else if (configPath.endsWith('.json')) {
        content = JSON.stringify(config, null, 2);
      } else {
        throw new Error(`不支持的配置文件格式: ${configPath}`);
      }

      fs.writeFileSync(configPath, content, 'utf-8');
      this.configs.set(configPath, config);
      console.log(`✅ 配置保存成功: ${configPath}`);
    } catch (error) {
      console.error(`配置保存失败: ${configPath}`, error);
    }
  }

  /**
   * 获取缓存的配置
   */
  getConfig<T = any>(configPath: string): T | undefined {
    return this.configs.get(configPath);
  }

  /**
   * 清除配置缓存
   */
  clearCache(configPath?: string): void {
    if (configPath) {
      this.configs.delete(configPath);
    } else {
      this.configs.clear();
    }
  }
}

// 主题管理器
export class ThemeManager {
  private static instance: ThemeManager;
  private loadedThemes = new Map<string, any>();
  private currentEngine: ThemeExport | null = null;
  private configManager = ConfigManager.getInstance();

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * 根据配置文件自动初始化主题
   */
  async initializeFromConfig(configPath: string): Promise<boolean> {
    try {
      const config = this.configManager.loadConfig(configPath);
      
      if (!config.theme) {
        console.warn('配置文件中未指定主题，使用默认主题');
        return await this.initializeDefaultTheme();
      }

      return await this.initializeTheme(config.theme, config, path.dirname(configPath));
    } catch (error) {
      console.error('从配置文件初始化主题失败:', error);
      return await this.initializeDefaultTheme();
    }
  }

  /**
   * 初始化指定主题
   */
  async initializeTheme(themeName: string, siteConfig?: any, basePath?: string): Promise<boolean> {
    try {
      console.log(`🎨 正在初始化主题: ${themeName}`);

      // 查找主题
      const themeExport = await this.loadTheme(themeName, basePath);
      if (!themeExport) {
        console.error(`主题加载失败: ${themeName}`);
        return false;
      }

      // 合并配置
      const mergedConfig: ThemeConfig = {
        ...themeExport.config,
        ...siteConfig
      };

      // 创建渲染引擎
      // const engine = await this.createEngine(themeExport.engine, mergedConfig, themeName);
      // if (!engine) {
      //   console.error(`渲染引擎创建失败: ${themeExport.engine}`);
      //   return false;
      // }

      // 将主题设置到渲染引擎，由引擎负责选择并创建渲染器
      const renderEngine = getRenderEngine();
      await renderEngine.setTheme(themeExport);

      this.currentEngine = themeExport;
      console.log(`✅ 主题初始化成功: ${themeName} (${themeExport.engine})`);
      
      return true;
    } catch (error) {
      console.error(`主题初始化失败: ${themeName}`, error);
      return false;
    }
  }

  /**
   * 初始化默认主题
   */
  async initializeDefaultTheme(): Promise<boolean> {
    console.log('🎨 使用默认主题');
    
    const defaultConfig: ThemeConfig = {
      siteName: 'Torika Blog',
      author: 'Anonymous',
      lang: 'zh-CN',
      customStyles: ['/static/style.css'],
      customScripts: []
    };

    try {
      // 尝试加载默认主题包
      const themeModule = await import('@torika/default-theme-react');
      const themeExport = themeModule.default || themeModule;
      // 将主题设置到渲染引擎
      const renderEngine = getRenderEngine();
      await renderEngine.setTheme(themeExport);
      this.currentEngine = themeExport;
      return true;
    } catch (error) {
      console.error('加载默认主题失败:', error);
      return false;
    }
  }

  /**
   * 加载主题模块
   */
  private async loadTheme(themeName: string, basePath?: string): Promise<any> {
    try {
      // 检查缓存
      if (this.loadedThemes.has(themeName)) {
        return this.loadedThemes.get(themeName);
      }

      // 查找主题路径
      const themePath = ThemeManager.resolveThemePath(themeName, basePath);
      if (!themePath) {
        console.error(`找不到主题: ${themeName}`);
        return null;
      }

      // 加载主题模块
      const themeModule = await import(themePath);
      const themeExport = themeModule.default || themeModule;

      // 解析并规范化主题的静态资源目录（相对于主题包）
      try {
        // themePath 以 file:// 开头
        const { fileURLToPath } = await import('url');
        const themeFile = fileURLToPath(themePath);
        const themeDir = path.dirname(themeFile);
        if (themeExport.staticDir) {
          // 如果是相对路径则解析为绝对路径
          const candidate = path.resolve(themeDir, themeExport.staticDir as string);
          const candidateFromPackageRoot = path.resolve(themeDir, '..', themeExport.staticDir as string);
          if (fs.existsSync(candidate)) {
            themeExport.staticDir = candidate;
          } else if (fs.existsSync(candidateFromPackageRoot)) {
            themeExport.staticDir = candidateFromPackageRoot;
          } else {
            // 若两者都不存在，仍设为首个候选（方便后续路径诊断），并在控制台发出警告
            themeExport.staticDir = candidate;
            console.warn(`⚠️ 主题静态资源目录未找到（尝试过 dist 与 包根路径）: ${candidate} / ${candidateFromPackageRoot}`);
          }
          // 也同步到 config 中，方便模板或其他逻辑使用
          if (!themeExport.config) themeExport.config = {};
          themeExport.config.staticDir = themeExport.staticDir;
        }
      } catch (err) {
        // 如果解析失败则保持原样
      }

      // 验证主题格式
      if (!this.validateThemeExport(themeExport)) {
        console.error(`主题格式不正确: ${themeName}`);
        return null;
      }

      // 缓存主题
      this.loadedThemes.set(themeName, themeExport);
      
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
        return this.pathToFileUrl(indexPath);
      }
      if (fs.existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
          const main = pkg.main || 'index.js';
          const mainPath = path.join(themePath, main);
          if (fs.existsSync(mainPath)) {
            return this.pathToFileUrl(mainPath);
          }
        } catch {}
      }
    }

    return null;
  }

  /**
   * 转换文件路径为file:// URL
   */
  private static pathToFileUrl(filePath: string): string {
    return `file://${filePath.replace(/\\/g, '/')}`;
  }

  /**
   * 创建渲染引擎（已弃用）
   * 已移除：渲染器现在由 RenderEngine 和 RendererFactory 管理，
   * 不再保留该兼容方法。
   */
  // createEngine 已移除，保留注释说明以便回溯历史记录。

  /**
   * 验证主题导出格式
   */
  private validateThemeExport(themeExport: any): boolean {
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
   * 获取当前渲染引擎
   */
  getCurrentEngine(): ThemeExport | null {
    return this.currentEngine;
  }

  /**
   * 设置当前渲染引擎（主题导出）
   */
  setCurrentEngine(engine: ThemeExport): void {
    this.currentEngine = engine;
  }

  /**
   * 清除主题缓存
   */
  clearCache(): void {
    this.loadedThemes.clear();
  }
}