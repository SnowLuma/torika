export abstract class ThemeRendererEngine {
    abstract getEngineName(): Promise<string>;
    abstract renderHtml(): Promise<string>;
}