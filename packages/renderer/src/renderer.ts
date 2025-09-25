import React from 'react';
import { renderToString } from 'react-dom/server';

export interface PostData {
  title?: string;
  content: string;
  [key: string]: any;
}

export interface RenderOptions {
  lang?: string | undefined;
  title?: string;
  meta?: Record<string, string>;
  styles?: string[] | undefined;
  scripts?: string[] | undefined;
}

/**
 * 将React组件渲染为完整的HTML文档
 * @param component React组件
 * @param options 渲染选项
 * @returns 完整的HTML字符串
 */
export function renderToHtml(
  component: React.ReactElement,
  options: RenderOptions = {}
): string {
  const {
    lang = 'zh-CN',
    title = '无标题',
    meta = {},
    styles = [],
    scripts = []
  } = options;

  // 渲染React组件为字符串
  const appHtml = renderToString(component);

  // 生成meta标签
  const metaTags = Object.entries(meta)
    .map(([name, content]) => `  <meta name="${name}" content="${content}">`)
    .join('\n');

  // 生成样式标签
  const styleTags = styles
    .map(style => `  <link rel="stylesheet" href="${style}">`)
    .join('\n');

  // 生成脚本标签
  const scriptTags = scripts
    .map(script => `  <script src="${script}"></script>`)
    .join('\n');

  // 默认样式
  const defaultStyles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 { 
      color: #2c3e50; 
    }
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
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #3498db;
      padding-left: 15px;
      margin-left: 0;
      color: #666;
    }
    .content {
      margin-top: 2rem;
    }
  `;

  // 构建完整的HTML文档
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
${metaTags ? metaTags + '\n' : ''}  <style>
${defaultStyles}
  </style>
${styleTags ? styleTags + '\n' : ''}${scriptTags ? scriptTags + '\n' : ''}</head>
<body>
  <div id="root">${appHtml}</div>
</body>
</html>`;
}

/**
 * 渲染React组件为HTML字符串（不包含完整文档结构）
 * @param component React组件
 * @returns HTML字符串
 */
export function renderComponent(component: React.ReactElement): string {
  return renderToString(component);
}

/**
 * 创建一个带有默认样式的页面组件
 * @param children 子组件
 * @param className 额外的CSS类名
 */
export function Page({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return React.createElement('div', { 
    className: `page ${className}`.trim() 
  }, children);
}
