# Tau 模板起步仓库

这是模板作者的独立工程，使用公开数据 SDK 和通用 Editor。宿主只输出数据、搜索和插件产物；页面、Router、正文、搜索界面及预览由模板决定。

本工程通过 npm 别名使用公开的 `@xiongtao.xt/tau-editor@0.1.0` 和 `@xiongtao.xt/tau-plugins@0.19.0`，代码中仍使用 `@tau/editor`、`@tau/plugins`。按仓库锁文件安装即可，不需要宿主 checkout、本机源码链接或候选归档。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test
pnpm build
```

开发服务器用 `scripts/dev-fixture.mjs` 中的内存夹具，生产构建不包含夹具。更换页面与路由即可开始自己的模板；不必导入宿主源码或组装 EditorKit。

```tsx
import { PublishedContent } from "./published/PublishedContent";

const result = await client.readData({ key });
<PublishedContent result={result} />
```

`src/published/` 是可修改的模板接入代码，负责资源摘要校验、C23 共享模块映射、扩展适配、样式作用域与释放。Editor 自身不读取 dataUrl 或发布协议。多个 PublishedContent 各自创建资源和编辑状态，关闭一个不会卸载另一个。

已有 HTML 插件贡献中的完整 HTML 文档在模板的 iframe 中展示；正文伴生 CSS 同时传入子文档。普通 HTML 片段仍交给真实插件渲染。缺少插件不自动安装或恢复旧内置实现。

路由示例采用 HashRouter，`?content=` 只是本模板选择的规则；宿主不知道该 URL。内容引用和搜索使用清单 key。作者可替换 Router、Editor、预览方式或整个接入层。

修改 `template.json` 的身份信息后构建，产物为 `output/<id>-<version>.zip`，通过现有插件中心安装并由宿主发布。ZIP 只含作者静态产物和完整摘要，不需要执行桌面插件生命周期。
