# Tau Blog Template Starter

A standalone starter repository for blog template authors using `@tau/blog` directly. The Tau host outputs only site data, search indexes, and plugin bundles; the template controls pages, routing, search UI, and previews.

The public dependency is pinned to `@xiongtao.xt/tau-blog@0.6.0` and aliased as `@tau/blog` in source code. Click [Use this template](https://github.com/LastKnightCoder/tau-blog-template-starter/generate) to create your own repository, then install from the lockfile — no host checkout or local source links required.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test
pnpm build
```

The dev server uses the in-memory fixture in `scripts/dev-fixture.mjs`; production builds exclude the fixture. `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` only allows pnpm to install a freshly published pinned version and can be removed a day after release.

## Minimal Integration

```tsx
import { createRoot } from "react-dom/client";
import { createClient, ContentRenderer } from "@tau/blog";
import "@tau/blog/styles.css";

async function main() {
  const client = createClient({ manifestUrl: "/data/site.<digest>.json" });
  const content = await client.readData({ key: "<content-key>" });
  createRoot(document.getElementById("root")!).render(
    <ContentRenderer content={content} hrefFor={target => `/?content=${target.key}`} />
  );
}
void main();
```

`ContentRenderer` renders everything the host can publish, including content plugins, web embeds, audio/video, image presentation from publish settings, and internal links. The template only needs to provide `hrefFor` to map each target to a page URL. See `@tau/blog`'s README for optional features like hover previews and table of contents.

## What's Included

- `src/main.tsx`: list view, search, and single-page routing. URLs use `<basePath>/?content=<key>` with `BrowserRouter` and `basename` read from `site.basePath` in the manifest; this URL scheme belongs solely to the template and is opaque to the host.
- `src/Content.tsx`: loading and error UI for this starter; customize, remove, or use `ContentRenderer` directly.
- `data-theme="paper" data-mode="light"` in `index.html`: opts into built-in Tau theme values. You can also remove these attributes and define `--tau-*` CSS variables in your own stylesheet.

If you switch to multi-segment path routing (such as `/articles/3`), static hosts will return 404 on direct deep links. Copy your entry HTML to `404.html` and add it to `template.entries` — GitHub Pages serves it automatically, while S3 requires setting `404.html` as the error document. Prefix asset URLs with `__TAU_BASE__` (replaced by the host with the deployment base path at publish time); see `scripts/build.mjs` in the official template for a working reference.

Rich content blocks such as HTML embeds render directly through their original plugin components; templates do not inspect specific plugin node types or override their renderers.

## Site Fields

The host provides only the site title, icon, `basePath`, and `publicUrl`; all other site configuration is declared by the template. Define fields under `siteFields` in `template.json` so users can fill them in under **Publish → Site Settings · Blog Template** in Tau and read them from `manifest.site.fields[key]`:

```json
"siteFields": [
  { "key": "tagline", "label": "Tagline", "type": "text", "placeholder": "Introduce your site in one sentence" },
  { "key": "layout", "label": "Home layout", "type": "select", "options": [{ "value": "list", "label": "List" }, { "value": "grid", "label": "Grid" }], "default": "list" },
  { "key": "showSearch", "label": "Show search", "type": "switch", "default": true }
]
```

Five field types are supported: `text`, `textarea`, `url`, `select`, and `switch`, with optional `description`, `placeholder` (for text fields), and `default`. Each `key` must start with a letter, contain only letters, digits, and underscores, and a template may define at most 32 fields. Unfilled fields fall back to `default`, or to an empty string (text), `false` (switch), or the first option (select).

## Packaging

Replace `id` and `name` in `template.json` with your own (`example.template` is a placeholder — templates with the same ID overwrite one another), then run `pnpm build` to generate `output/<id>-<version>.zip`. The ZIP contains only static assets and integrity hashes and does not execute desktop plugin lifecycle hooks. Once submitted to **Plugin Center**, users can install it and select it in publish settings.

## Styling Configuration

This starter is minimal and does not include Tailwind CSS. If you plan to style your template with Tailwind, read the **[Styling Guide](STYLING_GUIDE.md)** to configure it properly and avoid common styling issues.

⚠️ **Important**: If you copy code from the official [tau-blog-template](https://github.com/LastKnightCoder/tau-blog-template) and use Tailwind, follow the styling guide carefully; otherwise responsive layouts or styles may break.

## Settings UI Localization

`i18n` in `template.json` declares locale dictionaries, with `resources` paths resolved relative to the packaged `template.root`; this starter's build script copies JSON files from `locales/` into `dist/site/locales/`. Field `label`, `description`, `placeholder`, and option `label` values may use `{ "kind": "i18n", "key": "message.key" }`.

These dictionaries are used exclusively by Tau's template settings UI: they are integrity-checked and counted toward the package budget, but are not exported with the published site. JSON files needed by the site itself should be bundled as regular assets rather than declared as UI dictionaries. Field keys, option values, defaults, and user-entered values remain unchanged.

The dictionary declaration in this starter requires Tau Desktop `0.68.0` or later; legacy plain-string templates continue to work under the original protocol. UI and blog renderer libraries follow their own versions independently of this client threshold.
