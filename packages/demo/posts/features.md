---
title: Torika 博客引擎特性介绍
date: 2023-09-24
tags: [features, documentation]
categories: [tech]
---

# Torika 博客引擎特性详解

Torika 是一个功能丰富的静态博客引擎，让我们来详细了解它的各项特性。

## 核心架构

### 模块化设计

Torika 采用了清晰的模块化架构：

- **核心模块 (Core)**: BlogEngine 和 TemplateRenderer
- **解析器 (Parsers)**: MarkdownParser 处理 Markdown 文件
- **生成器 (Generators)**: StaticGenerator 生成静态网站
- **工具类 (Utils)**: ConfigLoader 等辅助工具

### TypeScript 支持

完全使用 TypeScript 编写，提供：

- 强类型检查
- 智能代码补全
- 更好的开发体验

## 文档处理

### Front Matter 支持

每篇文章都可以包含 YAML Front Matter：

```yaml
---
title: 文章标题
date: 2023-09-24
tags: [tag1, tag2]
categories: [category1]
author: 作者名称
---
```

### 自动摘要生成

系统会自动从文章内容中生成摘要，用于：

- 首页文章列表
- RSS 源
- SEO 优化

## 网站生成

### 多种页面类型

Torika 会自动生成：

- 文章详情页
- 首页文章列表
- 标签页面
- 分类页面
- 分页导航

### 静态资源处理

自动复制和处理：

- CSS 样式文件
- JavaScript 脚本
- 图片资源
- 其他静态文件

## 下一步

查看 [配置文档](config.html) 了解如何自定义你的博客设置。