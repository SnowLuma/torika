import { MinimalLayout } from './MinimalLayout.js';
import { MinimalPost } from './MinimalPost.js';

// 主题配置
export const themeConfig = {
  siteName: "Minimal Blog",
  author: "Minimal Author",
  lang: "zh-CN",
  description: "A minimal blog theme for Torika",
  customStyles: ["/static/minimal.css"],
  customScripts: [],
  staticDir: "./static"
};

// 页面布局组件
export const layouts = {
  default: MinimalLayout,
  post: MinimalPost,
  page: MinimalPost,
  minimal: MinimalLayout
};

// 可复用组件
export const components = {
  Layout: MinimalLayout,
  Post: MinimalPost,
  MinimalLayout,
  MinimalPost
};

// 标准主题导出
export const themeExport = {
  name: 'custom-theme-example',
  version: '0.1.0',
  engine: 'react',
  config: themeConfig,
  layouts,
  components,
  staticDir: './static'
};

// 默认导出
export default themeExport;

// 兼容性导出
export { MinimalLayout, MinimalPost };
export type { MinimalLayoutProps } from './MinimalLayout.js';
export type { MinimalPostProps } from './MinimalPost.js';