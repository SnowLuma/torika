import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { ThemeConfig, PageData, PageType } from './types/theme.js';
import type { ThemeRendererEngine } from './types/renerer.js';

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
  private currentEngine: ThemeRendererEngine | null = null;
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
      const engine = await this.createEngine(themeExport.engine, mergedConfig, themeName);
      if (!engine) {
        console.error(`渲染引擎创建失败: ${themeExport.engine}`);
        return false;
      }

      // 如果是React引擎，设置主题模块
      if (themeExport.engine === 'react' && 'setThemeModule' in engine) {
        (engine as any).setThemeModule(themeExport);
      }

      this.currentEngine = engine;
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
      const rendererModule = await import('../../renderer/dist/index.js');
      const ReactThemeEngine = rendererModule.ReactThemeEngine;
      this.currentEngine = new ReactThemeEngine(defaultConfig) as unknown as ThemeRendererEngine;
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
      const themePath = this.resolveThemePath(themeName, basePath);
      if (!themePath) {
        console.error(`找不到主题: ${themeName}`);
        return null;
      }

      // 加载主题模块
      const themeModule = await import(themePath);
      const themeExport = themeModule.default || themeModule;

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
  private resolveThemePath(themeName: string, basePath?: string): string | null {
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
      const themeFilePath = path.join(themePath, 'theme.js');
      const distIndexPath = path.join(themePath, 'dist/index.js');
      const distThemePath = path.join(themePath, 'dist/theme.js');
      const packagePath = path.join(themePath, 'package.json');
      
      // 优先检查构建后的文件
      if (fs.existsSync(distThemePath)) {
        return this.pathToFileUrl(distThemePath);
      }
      if (fs.existsSync(distIndexPath)) {
        return this.pathToFileUrl(distIndexPath);
      }
      if (fs.existsSync(themeFilePath)) {
        return this.pathToFileUrl(themeFilePath);
      }
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
  private pathToFileUrl(filePath: string): string {
    return `file://${filePath.replace(/\\/g, '/')}`;
  }

  /**
   * 创建渲染引擎
   */
  private async createEngine(engineType: string, config: ThemeConfig, themeName?: string): Promise<ThemeRendererEngine | null> {
    try {
      switch (engineType.toLowerCase()) {
        case 'react':
          const rendererModule = await import('../../renderer/dist/index.js');
          const ReactThemeEngine = rendererModule.ReactThemeEngine;
          return new ReactThemeEngine(config, themeName) as unknown as ThemeRendererEngine;
        default:
          console.error(`不支持的渲染引擎: ${engineType}`);
          return null;
      }
    } catch (error) {
      console.error(`创建渲染引擎失败: ${engineType}`, error);
      return null;
    }
  }

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
  getCurrentEngine(): ThemeRendererEngine | null {
    return this.currentEngine;
  }

  /**
   * 设置当前渲染引擎
   */
  setCurrentEngine(engine: ThemeRendererEngine): void {
    this.currentEngine = engine;
  }

  /**
   * 清除主题缓存
   */
  clearCache(): void {
    this.loadedThemes.clear();
  }
}