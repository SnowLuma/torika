import chokidar from "chokidar";
import path from "path";
import { createServer } from "vite";
import { fileURLToPath } from "url";
import { ThemeManager, ConfigManager } from "@torika/engine/src/index";
import fs from "fs";


const current_dir = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(current_dir, "../../demo");
const postsDir = path.resolve(demoDir, "source/_posts");
const outDir = path.resolve(demoDir, "dist");
const configPath = path.resolve(demoDir, "config.yaml");

async function startDev() {
  try {
    // 初始化主题管理器
    const themeManager = ThemeManager.getInstance();
    
    // 从配置文件加载主题
    const success = await themeManager.initializeFromConfig(configPath);
    if (!success) {
      console.error('主题初始化失败，退出开发服务器');
      return;
    }

    // 获取当前引擎
    const engine = themeManager.getCurrentEngine();
    if (!engine) {
      console.error('无法获取渲染引擎');
      return;
    }

    // 执行全量构建
    await engine.fullBuild(postsDir, outDir);

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

    // 监听文件变化
    chokidar.watch(postsDir).on("change", async (file) => {
      console.log(`📝 文件变化: ${file}`);
      await engine.compileMarkdown(file, outDir);
      vite.ws.send({ type: "full-reload" });
    });

    // 监听配置文件变化
    chokidar.watch(configPath).on("change", async () => {
      console.log('📋 配置文件变化，重新初始化主题');
      const success = await themeManager.initializeFromConfig(configPath);
      if (success) {
        const newEngine = themeManager.getCurrentEngine();
        if (newEngine) {
          await newEngine.fullBuild(postsDir, outDir);
          vite.ws.send({ type: "full-reload" });
        }
      }
    });

  } catch (error) {
    console.error('启动开发服务器失败:', error);
  }
}

startDev();
