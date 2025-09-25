import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import React from "react";
import { renderToHtml } from "./Renderer/renderer.js";
import { Layout } from "./Layout/Layout.js";
import { Post } from "./Layout/Post.js";

export interface ThemeConfig {
  siteName?: string;
  author?: string;
  lang?: string;
  customStyles?: string[];
  customScripts?: string[];
}

export class ReactThemeEngine {
  private config: ThemeConfig;
  private cache = new Map<string, string>();

  constructor(config: ThemeConfig = {}) {
    this.config = {
      siteName: 'Torika Blog',
      author: 'Anonymous',
      lang: 'zh-CN',
      customStyles: [],
      customScripts: [],
      ...config
    };
  }

  /**
   * 编译单个Markdown文件为HTML
   */
  compileMarkdown(file: string, outDir: string): void {
    const raw = fs.readFileSync(file, "utf-8");
    const { content, data } = matter(raw);
    
    // 使用marked渲染Markdown内容
    const htmlContent = marked.parse(content, { async: false }) as string;
    
    // 创建Post组件
    const postComponent = React.createElement(Post, {
      meta: {
        title: data.title || '无标题',
        author: data.author || this.config.author,
        date: data.date,
        tags: data.tags,
        ...data
      },
      content: htmlContent
    });

    // 创建Layout组件包装Post
    const layoutComponent = React.createElement(Layout, {
      title: this.config.siteName!,
      children: postComponent
    });

    // 渲染为完整HTML
    const html = renderToHtml(layoutComponent, {
      lang: this.config.lang!,
      title: data.title || '无标题',
      meta: {
        author: data.author || this.config.author!,
        description: data.description || '',
        ...data.meta
      },
      styles: this.config.customStyles!,
      scripts: this.config.customScripts!
    });

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
  fullBuild(contentDir: string, outDir: string): void {
    console.log("🔨 [ReactTheme] Full build...");
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    const files = fs.readdirSync(contentDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      this.compileMarkdown(path.join(contentDir, file), outDir);
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