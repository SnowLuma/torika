# @torika/renderer - 渲染器接口规范 & React实现

定义统一的渲染器接口规范，并提供React渲染器实现。

## 🏗️ 设计原则

- **接口统一**: 所有渲染器都遵守IRenderer接口规范
- **Engine管理**: 渲染器由engine包统一注册和管理
- **类型安全**: 完整的TypeScript类型定义
- **可扩展**: 易于添加新的渲染器类型（Vue、Svelte等）

## 📋 渲染器接口规范

### IRenderer 接口

```typescript
interface IRenderer {
  getConfig(): RendererConfig;
  render(templateData: TemplateData): Promise<RenderResult>;
  renderSync?(templateData: TemplateData): RenderResult;
  validate(templateData: TemplateData): boolean;
  initialize?(config?: Record<string, any>): Promise<void>;
  dispose?(): Promise<void>;
}
```

### 通用类型定义

```typescript
interface TemplateData {
  template: any;                    // 模板/组件
  props?: Record<string, any>;      // 属性
  children?: any;                   // 子内容
  metadata?: Record<string, any>;   // 元数据
}

interface RenderResult {
  html: string;                     // 渲染后的HTML
  success: boolean;                 // 是否成功
  error?: string;                   // 错误信息
  metadata?: Record<string, any>;   // 渲染元数据
}
```

## 🚀 使用示例

### React渲染器使用

```typescript
import { ReactRenderer, RENDERER_TYPES } from '@torika/renderer';

// 1. 创建React渲染器实例
const reactRenderer = new ReactRenderer();

// 2. 准备模板数据
const templateData = {
  template: MyReactComponent,
  props: { title: 'Hello World', content: 'Some content' },
  children: <div>Child content</div>
};

// 3. 渲染
const result = await reactRenderer.render(templateData);
if (result.success) {
  console.log(result.html);
}
```

### Engine端集成

```typescript
// Engine包中注册渲染器
import { ReactRenderer, RENDERER_TYPES } from '@torika/renderer';

// 注册React渲染器
engine.registerRenderer(RENDERER_TYPES.REACT, ReactRenderer);

// 使用渲染器
const renderer = engine.getRenderer('react');
const result = await renderer.render(templateData);
```

### 实现新的渲染器

```typescript
import { IRenderer, TemplateData, RenderResult } from '@torika/renderer';

class VueRenderer implements IRenderer {
  getConfig() {
    return {
      name: 'VueRenderer',
      version: '1.0.0',
      type: 'vue'
    };
  }

  async render(templateData: TemplateData): Promise<RenderResult> {
    // Vue 渲染逻辑
    try {
      const html = await renderVueComponent(templateData.template, templateData.props);
      return { html, success: true };
    } catch (error) {
      return { html: '', success: false, error: error.message };
    }
  }

  validate(templateData: TemplateData): boolean {
    // Vue组件验证逻辑
    return isVueComponent(templateData.template);
  }
}
```

## 🔧 React渲染器实现

### ReactRenderer

- **类型**: `RENDERER_TYPES.REACT` (`'react'`)
- **特性**: 支持函数组件、类组件、JSX元素
- **方法**: 实现完整的IRenderer接口

```typescript
const reactRenderer = new ReactRenderer({
  // 可选配置
});

const templateData = {
  template: ({ title, children }) => <div><h1>{title}</h1>{children}</div>,
  props: { title: 'My Page' },
  children: <p>Page content</p>
};

const result = await reactRenderer.render(templateData);
```

## � 渲染流程

1. **Engine** 注册并管理多种渲染器（React、Vue等）
2. **Engine** 根据配置选择合适的渲染器
3. **Theme** 提供标准格式的模板数据
4. **Renderer** 将模板数据渲染为HTML
5. **Engine** 获取渲染结果，进行后续处理

## 📦 包结构

```
@torika/renderer/
├── src/
│   ├── types.ts          # 渲染器接口规范
│   ├── renderer.ts       # React渲染器实现
│   └── index.ts          # 统一导出
├── dist/                 # 编译输出
└── README.md            # 本文档
```

## 🎯 设计优势

1. **接口统一**: 所有渲染器遵守相同的IRenderer接口
2. **类型安全**: 完整的TypeScript类型定义和检查
3. **可扩展性**: 轻松添加Vue、Svelte等新渲染器
4. **Engine管理**: 渲染器注册和选择由Engine统一控制
5. **职责清晰**: Renderer只负责渲染，不涉及路由、状态等

这个设计让Engine可以统一管理多种渲染器，为不同的前端技术栈提供统一的接口。