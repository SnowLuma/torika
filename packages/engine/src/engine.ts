import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

export const cache = new Map<string, string>();

export function compileMarkdown(file: string, outDir: string) {
  const raw = fs.readFileSync(file, "utf-8");
  const { content, data } = matter(raw);
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || '无标题'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 { color: #2c3e50; }
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
    blockquote {
      border-left: 4px solid #3498db;
      padding-left: 15px;
      margin-left: 0;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>${data.title || '无标题'}</h1>
  <div class="content">
    ${marked(content)}
  </div>
</body>
</html>`;
  cache.set(file, html);

  const outFile = path.join(outDir, path.basename(file).replace(".md", ".html"));
  fs.writeFileSync(outFile, html, 'utf-8');
  //console.log(`✨ [Engine] Updated: ${file}`);
}

export function fullBuild(contentDir: string, outDir: string) {
  console.log("🔨 [Engine] Full build...");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(contentDir);
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    compileMarkdown(path.join(contentDir, file), outDir);
  }
}
