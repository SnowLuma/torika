// 导出通用渲染器接口和类型（由 engine 提供规范）
export type {
  IRenderer,
  TemplateData,
  RenderResult,
  RendererConfig,
  RendererType
} from '../../engine/src/types/renderer.js';

// 导出渲染器类型常量（由 engine 提供）
export { RENDERER_TYPES } from '../../engine/src/types/renderer.js';

// 导出React渲染器实现
export { ReactRenderer } from './renderer.js';