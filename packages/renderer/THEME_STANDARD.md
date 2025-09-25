# React主题标准约定

## 主题导出规范

每个React主题都应该符合以下导出规范：

```typescript
// theme.ts 或 index.ts
export interface ThemeExport {
  name: string;           // 主题名称
  version: string;        // 主题版本
  engine: 'react';        // 渲染引擎类型
  config: ThemeConfig;    // 默认配置
  layouts: {              // 布局组件
    default: React.ComponentType<LayoutProps>;
    [layoutName: string]: React.ComponentType<any>;
  };
  components?: {          // 可选的组件集合
    [componentName: string]: React.ComponentType<any>;
  };
  staticDir?: string;     // 静态资源目录
}

export default themeExport;
```

## 必需的布局组件

### 1. default (默认布局)
```typescript
interface LayoutProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}
```

### 2. post (文章布局)
```typescript
interface PostProps {
  meta: PageMeta;
  content: string;
  className?: string;
}
```

## 可选的页面组件

### 1. IndexPage (首页)
```typescript
interface IndexPageProps {
  title?: string;
  posts?: Array<{
    meta: PageMeta;
    excerpt?: string;
    url: string;
  }>;
  className?: string;
}
```

### 2. ArchivePage (归档页)
```typescript
interface ArchivePageProps {
  title?: string;
  posts?: Array<{
    meta: PageMeta;
    url: string;
  }>;
  groupBy?: 'year' | 'month' | 'none';
  className?: string;
}
```

### 3. CustomPage (自定义页面)
```typescript
interface CustomPageProps {
  title?: string;
  content: string;
  meta?: Record<string, any>;
  className?: string;
  layout?: 'default' | 'full-width' | 'sidebar';
}
```

## 自定义页面支持

### 通过页面名称指定组件

在markdown文件的front matter中指定：

```yaml
---
title: "关于我们"
page: "AboutPage"    # 指定使用AboutPage组件
# 或者
component: "TeamPage"  # 指定使用TeamPage组件
---
```

### 自定义组件约定

自定义组件应该接受以下标准props：

```typescript
interface CustomComponentProps {
  meta: PageMeta;      // 页面元数据
  content: string;     // 页面内容（HTML）
  [key: string]: any;  // 来自front matter的其他属性
}
```

## 布局系统

### 1. 指定布局
```yaml
---
title: "特殊页面"
layout: "sidebar"    # 使用sidebar布局
---
```

### 2. 无布局
```yaml
---
title: "纯净页面"
layout: "none"       # 不使用任何布局包装
---
```

## 主题配置

```typescript
interface ThemeConfig {
  siteName?: string;
  author?: string;
  lang?: string;
  description?: string;
  customStyles?: string[];
  customScripts?: string[];
  staticDir?: string;
  [key: string]: any;  // 主题特定配置
}
```

## 静态资源

主题的静态资源应该放在 `static` 目录下，构建时会自动复制到输出目录的 `/static/` 路径。

在主题配置中引用静态资源：

```typescript
export const themeConfig = {
  customStyles: ['/static/theme.css'],
  customScripts: ['/static/theme.js']
};
```

## 主题示例结构

```
my-theme/
├── package.json
├── index.ts              # 主题入口文件
├── layouts/
│   ├── Layout.tsx        # 默认布局
│   ├── Post.tsx          # 文章布局
│   └── Sidebar.tsx       # 侧边栏布局
├── components/
│   ├── IndexPage.tsx     # 首页组件
│   ├── ArchivePage.tsx   # 归档页组件
│   ├── AboutPage.tsx     # 自定义关于页组件
│   └── TeamPage.tsx      # 自定义团队页组件
├── static/
│   ├── style.css         # 主题样式
│   ├── script.js         # 主题脚本
│   └── images/           # 图片资源
└── theme.yaml            # 主题元数据（可选）
```

## 兼容性检查

渲染器会按以下顺序查找组件：

1. `themeModule[componentName]`
2. `themeModule.components[componentName]`
3. `themeModule.layouts[componentName]`
4. `themeModule.default[componentName]`
5. `themeModule.default.components[componentName]`
6. `themeModule.default.layouts[componentName]`

如果找不到指定组件，会回退到内置组件。