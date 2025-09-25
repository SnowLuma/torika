import chokidar from "chokidar";
import path from "path";
import { compileMarkdown, fullBuild, setThemeEngine } from "@torika/engine/src/engine";
import { defaultThemeEngine } from "@torika/default-theme-react";
import { createServer } from "vite";
import { fileURLToPath } from "url";


const current_dir = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.resolve(current_dir, "../../demo/posts");
const outDir = path.resolve(current_dir, "../../demo/dist");

async function startDev() {
  // 设置React主题引擎
  setThemeEngine(defaultThemeEngine);
  
  fullBuild(postsDir, outDir);

  const vite = await createServer({
    root: path.resolve(current_dir, "../../demo/dist"),
  });
  let httpServer = await vite.listen();

  const address = httpServer.httpServer?.address();
  if (address && typeof address === 'object') {
    const url = `http://localhost:${address.port}`;
    console.log(`Demo URL: ${url}`);
  }

  chokidar.watch(postsDir).on("change", (file) => {
    compileMarkdown(file, outDir);
    vite.ws.send({ type: "full-reload" });
  });
}

startDev();
