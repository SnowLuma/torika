import { Layout } from './Layout/Layout.js';
import { Post } from './Layout/Post.js';
import { IndexPage } from './Layout/IndexPage.js';
import { ArchivePage } from './Layout/ArchivePage.js';
import { CustomPage } from './Layout/CustomPage.js';
import { AboutPage } from './Layout/AboutPage.js';
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
  AboutPage
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

// 兼容旧的导出
export { Layout, Post, IndexPage, ArchivePage, CustomPage, AboutPage };
export type { LayoutProps } from './Layout/Layout.js';
export type { PostProps, PostMeta } from './Layout/Post.js';
export type { IndexPageProps } from './Layout/IndexPage.js';
export type { ArchivePageProps } from './Layout/ArchivePage.js';
export type { CustomPageProps } from './Layout/CustomPage.js';
export type { AboutPageProps } from './Layout/AboutPage.js';