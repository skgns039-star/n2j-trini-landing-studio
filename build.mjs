import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const result = await build({
  entryPoints: ["src/main.tsx"], bundle: true, write: false,
  format: "iife", platform: "browser", target: "es2022",
  jsx: "automatic", minify: true, legalComments: "inline",
  define: { "process.env.NODE_ENV": '"production"' },
});
const css = await readFile("styles.css", "utf8");
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="N2J TRINI — 브랜드 템플릿 편집, 미리보기와 HTML 저장. AI 신규 생성은 미연결입니다."><title>N2J TRINI · 브랜드 랜딩 스튜디오</title><style>${css}</style></head><body><div id="root"></div><noscript>예시 체험에는 JavaScript가 필요합니다.</noscript><script>${js}</script></body></html>`;
await writeFile("index.html", html);

// Export the authored HTML/CSS examples, without any runtime or model code.
const presetBuild = await build({ entryPoints: ["src/src/presets.ts"], bundle: true, write: false, format: "esm", platform: "node" });
const { presets } = await import(`data:text/javascript;base64,${Buffer.from(presetBuild.outputFiles[0].text).toString("base64")}`);
await mkdir("examples", { recursive: true });
for (const preset of presets) {
  const widget = preset.widget;
  await writeFile(`examples/${preset.id}.html`, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${preset.brand} · 가상 예시</title><style>body{margin:0}${widget.css}</style></head><body>${widget.html}</body></html>`);
}
console.log("Built standalone index.html and three authored examples.");
