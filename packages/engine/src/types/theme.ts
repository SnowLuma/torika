// 主题配置接口
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

// 页面元数据接口
export interface PageMeta {
  title?: string;
  author?: string;
  date?: string | Date;
  tags?: string[];
  description?: string;
  layout?: string;
  [key: string]: any;
}

// 页面类型枚举
export enum PageType {
  Post = 'post',
  Page = 'page',
  Index = 'index',
  Archive = 'archive',
  Tag = 'tag',
  Custom = 'custom'
}

// 页面数据接口
export interface PageData {
  type: PageType;
  meta: PageMeta;
  content: string;
  filePath: string;
  outputPath: string;
}

// 主题导出接口
export interface ThemeExport {
  name: string;
  version: string;
  engine: string;
  config: ThemeConfig;
  layouts: Record<string, any>;
  components?: Record<string, any>;
  staticDir?: string;
}