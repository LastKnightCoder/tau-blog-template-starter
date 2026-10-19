# Tau 模板起步仓库

这是模板作者的独立工程，直接使用 `@tau/blog`。宿主只输出数据、搜索和插件产物；页面、Router、搜索界面及预览由模板决定。

公开依赖固定为 `@xiongtao.xt/tau-blog@0.1.0`，代码中使用别名 `@tau/blog`。点击 [Use this template](https://github.com/LastKnightCoder/tau-blog-template-starter/generate) 创建自己的仓库后，按锁文件安装即可，无需宿主 checkout 或本机源码链接。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test
pnpm build
```

开发服务器用 `scripts/dev-fixture.mjs` 中的内存夹具，生产构建不包含夹具。更换页面与路由即可开始自己的模板；不必导入宿主源码或组装 EditorKit。

```tsx
import { createRoot } from "react-dom/client";
import { createClient, ContentRenderer } from "@tau/blog";
import "@tau/blog/styles.css";

async function main() {
  const client = createClient({ manifestUrl: "/data/site.实际摘要.json" });
  const content = await client.readData({ key: "实际正文的 key" });
  createRoot(document.getElementById("root")!).render(<ContentRenderer content={content} />);
}
void main();
```

以上为在新 Vite React 工程中读取一篇已发布正文的完整接入示例，清单地址和正文 key 替换为实际数据。本仓库的 src/main.tsx 进一步展示列表、搜索和 HashRouter。ContentRenderer 内部负责内容插件加载、摘要校验、共享依赖、样式和卸载，模板无需复制接入源码或装配 EditorKit。多个渲染器各自拥有正文与插件状态，关闭一个不影响另一个。

HTML 等内容直接使用对应插件的原有渲染组件。模板不识别具体节点或改写 render；缺少插件不自动安装或恢复旧内置实现。

CSS 校验后按原文加载和清理，不改写选择器或动画，样式范围由内容插件自身负责。src/Content.tsx 只定义本模板的等待和错误展示；作者可修改、删除或直接使用 ContentRenderer，不需要手动装配 Provider。

路由示例采用 HashRouter，`?content=` 只是本模板选择的规则；宿主不知道该 URL。内容引用和搜索使用清单 key。作者可替换 Router、渲染器和预览方式。

修改 `template.json` 的身份信息后构建，产物为 `output/<id>-<version>.zip`，通过现有插件中心安装并由宿主发布。ZIP 只含作者静态产物和完整摘要，不需要执行桌面插件生命周期。
