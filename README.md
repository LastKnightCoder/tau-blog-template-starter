# Tau 模板起步仓库

这是模板作者的独立工程，直接使用 `@tau/blog`。宿主只输出数据、搜索和插件产物；页面、Router、搜索界面及预览由模板决定。

公开依赖固定为 `@xiongtao.xt/tau-blog@0.2.0`，代码中使用别名 `@tau/blog`。点击 [Use this template](https://github.com/LastKnightCoder/tau-blog-template-starter/generate) 创建自己的仓库后，按锁文件安装即可，无需宿主 checkout 或本机源码链接。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test
pnpm build
```

开发服务器用 `scripts/dev-fixture.mjs` 中的内存夹具，生产构建不包含夹具。`pnpm-workspace.yaml` 里的 `minimumReleaseAgeExclude` 只为让 pnpm 安装刚发布的固定版本，版本发布满一天后可以删除。

## 最小接入

```tsx
import { createRoot } from "react-dom/client";
import { createClient, ContentRenderer } from "@tau/blog";
import "@tau/blog/styles.css";

async function main() {
  const client = createClient({ manifestUrl: "/data/site.实际摘要.json" });
  const content = await client.readData({ key: "实际正文的 key" });
  createRoot(document.getElementById("root")!).render(
    <ContentRenderer content={content} hrefFor={target => `/?content=${target.key}`} />
  );
}
void main();
```

宿主能发布的内容 ContentRenderer 都会完整显示，包括内容插件、网页嵌入、音视频、发布设置里的图片外观和站内链接。模板只需用 `hrefFor` 告诉它某个内容对应哪个页面地址；悬停预览、目录等可选能力见 `@tau/blog` 的 README。

## 本仓库的示例

- `src/main.tsx`：列表、搜索和单页路由。地址是 `<部署路径>/?content=<key>`，用 BrowserRouter，basename 取清单的 `site.basePath`；这个规则只属于本模板，宿主不知道这个 URL。
- `src/Content.tsx`：本模板的等待与错误展示，可修改、删除或直接使用 ContentRenderer。
- `index.html` 的 `data-theme="paper" data-mode="light"`：使用包内的 Tau 主题取值。也可以去掉它，在自己的样式里定义 `--tau-*` 变量。

如果改成多级路径路由（如 `/articles/3`），静态托管直接打开深链时找不到文件。可以把入口 HTML 复制为 `404.html` 并列入 `template.entries`：GitHub Pages 会自动使用它，S3 需要把错误页设为 `404.html`。资源路径要改用 `__TAU_BASE__`（宿主发布时替换为部署路径），官方模板的 `scripts/build.mjs` 有现成做法。

HTML 等内容直接使用对应插件的原有渲染组件，模板不识别具体插件节点，也不改写其 render。

## 打包

先把 `template.json` 的 `id`、`name` 改成自己的（`example.template` 只是占位，不同模板 id 相同会互相覆盖），再执行 `pnpm build`，产物为 `output/<id>-<version>.zip`。ZIP 只含静态产物和完整摘要，不执行桌面插件生命周期；通过插件中心提交后，用户安装即可在发布设置中选择。
