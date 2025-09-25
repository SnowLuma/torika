# Custom Theme Example

这是一个演示如何创建自定义Torika主题的示例。

## 主题特点

- 🎨 简洁的Minimal设计风格
- 📱 响应式布局
- 🚀 完全符合Torika主题标准
- 🔧 易于自定义和扩展

## 目录结构

```
custom-theme-example/
├── package.json          # 包配置
├── tsconfig.json         # TypeScript配置
├── src/
│   ├── index.ts          # 主题导出入口
│   ├── MinimalLayout.tsx # 布局组件
│   └── MinimalPost.tsx   # 文章组件
├── static/
│   └── minimal.css       # 主题样式
└── README.md            # 说明文档
```

## 使用方法

### 1. 本地开发
在项目根目录的 `config.yaml` 中指定主题：

```yaml
theme: "@torika/custom-theme-example"
siteName: "My Minimal Blog"
author: "Your Name"
```

### 2. 作为npm包
如果要发布为npm包，其他用户可以这样使用：

```bash
npm install @torika/custom-theme-example
```

然后在 `config.yaml` 中：

```yaml
theme: "@torika/custom-theme-example"
```

## 主题结构

### 导出规范
```typescript
export const themeExport = {
  name: 'custom-theme-example',
  version: '0.1.0',
  engine: 'react',
  config: themeConfig,
  layouts,
  components,
  staticDir: './static'
};
```

### 支持的组件
- `MinimalLayout` - 默认页面布局
- `MinimalPost` - 文章页面组件

### 支持的布局
- `default` - 使用MinimalLayout
- `post` - 使用MinimalPost  
- `page` - 使用MinimalPost
- `minimal` - 使用MinimalLayout

## 自定义扩展

### 添加新组件
1. 在 `src/` 目录下创建新的组件文件
2. 在 `index.ts` 中导出组件
3. 添加到 `components` 对象中

### 修改样式
编辑 `static/minimal.css` 文件，支持CSS变量自定义：

```css
:root {
  --primary-color: #007acc;
  --text-color: #2d3748;
  --background-color: #ffffff;
  --border-color: #e2e8f0;
  --gray-color: #718096;
}
```

### 添加自定义页面
创建新的组件并添加到exports中，例如：

```typescript
// src/AboutPage.tsx
export function AboutPage({ meta, content }: CustomPageProps) {
  // 自定义页面实现
}

// src/index.ts
export const components = {
  // ...其他组件
  AboutPage
};
```

然后在markdown文件中使用：

```yaml
---
title: "关于我们"
page: "AboutPage"
---
```

## 兼容性

此主题完全符合Torika主题标准，支持：

- ✅ 标准页面类型（Post、Page、Index等）
- ✅ 自定义页面组件
- ✅ 布局系统
- ✅ 静态资源管理
- ✅ 配置驱动的主题系统

## 开发

```bash
# 构建主题
pnpm build

# 在Torika项目中测试
cd ../../
pnpm dev
```