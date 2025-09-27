import chokidar from "chokidar";
import path from "path";
import { createServer } from "vite";
import { fileURLToPath } from "url";
import { ThemeManager, ConfigManager, getRenderEngine } from "@torika/engine";
import fs from "fs";


const current_dir = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(current_dir, "../../demo");
const contentDir = path.resolve(demoDir, 'source');
const outDir = path.resolve(demoDir, "dist");
const configPath = path.resolve(demoDir, "config.yaml");

async function startDev() {
  try {
    // 初始化主题管理器
    const themeManager = ThemeManager.getInstance();

    // 先初始化渲染引擎以确保渲染器已注册（例如 ReactRenderer）
    const renderEngine = getRenderEngine();
    await renderEngine.initialize();

    // 从配置文件加载主题
    const success = await themeManager.initializeFromConfig(configPath);
    if (!success) {
      console.error('主题初始化失败，退出开发服务器');
      return;
    }

    // 获取 RenderEngine 实例
    // RenderEngine 已在上面初始化并被复用
    if (!renderEngine) {
      console.error('无法获取 RenderEngine');
      return;
    }

    // 执行全量构建
    await renderEngine.fullBuild(contentDir, outDir);

    // 启动Vite开发服务器
    const vite = await createServer({
      root: outDir,
    });
    let httpServer = await vite.listen();

    const address = httpServer.httpServer?.address();
    if (address && typeof address === 'object') {
      const url = `http://localhost:${address.port}`;
      console.log(`🚀 Demo URL: ${url}`);
    }

    // 监听文件变化（监听整个 source 目录）
    chokidar.watch(contentDir, { ignoreInitial: true }).on('all', async (event, file) => {
      console.log(`📝 文件 ${event}: ${file}`);
      try {
        // 当文件发生变化时，调用引擎的 compileMarkdown（会处理 md 渲染与静态文件复制）
        // cast to any to avoid type mismatch with compiled .d.ts
        await (renderEngine as any).compileMarkdown(file, outDir, contentDir);
        vite.ws.send({ type: 'full-reload' });
      } catch (err) {
        console.error('文件处理失败:', err);
      }
    });

    // 监听配置文件变化
    chokidar.watch(configPath).on("change", async () => {
      console.log('📋 配置文件变化，重新初始化主题');
      const success = await themeManager.initializeFromConfig(configPath);
      if (success) {
        const renderEngine = getRenderEngine();
        if (renderEngine) {
          await renderEngine.fullBuild(contentDir, outDir);
          vite.ws.send({ type: "full-reload" });
        }
      }
    });

  } catch (error) {
    console.error('启动开发服务器失败:', error);
  }
}

startDev();
