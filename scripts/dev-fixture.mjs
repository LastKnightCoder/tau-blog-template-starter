import { createHash } from "node:crypto";

const prefix = "/__tau_demo/";
const files = new Map();
const json = (name, value) => {
  const body = JSON.stringify(value);
  const integrity = createHash("sha256").update(body).digest("hex");
  const file = `${name}.${integrity}.json`;
  files.set(prefix + file, body);
  return { file, integrity };
};
const article = json("article", {
  version: 1, key: "article:1", meta: { type: "article", publishTime: 1 },
  content: { id: 1, title: "从模板开始", author: "示例", tags: [], createTime: 1, updateTime: 1,
    content: [
      { type: "paragraph", children: [{ type: "formatted", text: "这份正文来自数据协议，页面、路由和预览由模板决定。" }] },
      { type: "paragraph", children: [{ type: "formatted", text: "Editor 可独立用于编辑或只读；插件资源由模板接入层准备。", bold: true }] },
    ],
  },
});
const search = json("search", { version: 1, documents: [{ key: "article:1", type: "article", id: 1, title: "从模板开始", summary: "模板开发示例", content: "数据协议、模板路由和通用 Editor", tags: [] }] });
const manifest = json("site", { version: 1, site: { title: "我的 Tau 模板", description: "仅开发模式使用的示例数据", basePath: "/" }, search: { data: search.file, integrity: search.integrity }, items: [{ key: "article:1", type: "article", id: 1, title: "从模板开始", data: article.file, integrity: article.integrity }] });
export const demoData = { files, manifestUrl: prefix + manifest.file };
