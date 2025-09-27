import { Layout } from './Layout/Layout.js';
import { Post } from './Layout/Post.js';
import { IndexPage } from './Layout/IndexPage.js';
import { ArchivePage } from './Layout/ArchivePage.js';
import { CustomPage } from './Layout/CustomPage.js';
import { AboutPage } from './Layout/AboutPage.js';
import Header from './Layout/Header.js';
import React from 'react';

// 主题配置
export const themeConfig = {
  siteName: "Torika Blog",
  author: "Anonymous",
  lang: "zh-CN",
  description: "A beautiful blog powered by Torika",
  customStyles: ["/static/style.css"],
  customScripts: [],
  staticDir: "./static"
};

// 页面布局组件
export const layouts = {
  default: Layout,
  post: Post,
  page: Post,
  index: IndexPage,
  archive: ArchivePage,
  custom: CustomPage
};

// 可复用组件
export const components = {
  Layout,
  Post,
  IndexPage,
  ArchivePage,
  CustomPage,
  AboutPage,
  // 导出 Header 以便主题外部或渲染器可以引用
  // Header 位于 src/Layout/Header.tsx，并会在构建时输出到 dist
  Header
};

// 标准主题导出
export const themeExport = {
  name: 'default-theme-react',
  version: '0.1.0',
  engine: 'react',
  config: themeConfig,
  layouts,
  components,
  staticDir: './static'
};

// 默认导出
export default themeExport;

// 说明：不再导出兼容旧接口。所有主题消费者应通过默认导出或 `layouts`/`components` 访问组件。
// 如果需要单独导出组件用于测试或外部复用，请在 `index.ts` 中明确导出.