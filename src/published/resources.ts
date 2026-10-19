import type { DataResult } from "@tau/plugins/publish-data";
import type { PublishedPluginRender } from "@tau/plugins/publish-artifacts";
import {
  evaluatePluginPackage,
  validatePluginManifest,
  assertRenderTypes,
  PLUGIN_RENDER_VERSION,
} from "@tau/plugins/publish-artifacts";
import type { AnyExtension } from "@tau/editor";
import { pluginModules } from "./plugin-modules";
import { scopeContentCss } from "./content-css";

export interface ContentPluginDefinition {
  id: string;
  editorExtensions?: readonly AnyExtension[];
}

export async function readVerified(
  url: URL,
  integrity: string,
  signal?: AbortSignal
): Promise<string> {
  signal?.throwIfAborted();
  if (!/^[a-f0-9]{64}$/.test(integrity)) throw new Error("资源摘要格式错误");
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`资源读取失败：HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
  signal?.throwIfAborted();
  if (digest !== integrity) throw new Error("资源摘要不匹配");
  return new TextDecoder().decode(bytes);
}

export async function loadPluginDefinitions(
  dependencies: readonly PublishedPluginRender[],
  dataUrl: string,
  scope: string,
  signal?: AbortSignal
) {
  const definitions: ContentPluginDefinition[] = [];
  const ids = new Set<string>(),
    types = new Set<string>();
  const styles: HTMLStyleElement[] = [];
  const dispose = () => styles.splice(0).forEach(style => style.remove());
  try {
    for (const dependency of dependencies) {
      if (dependency.runtimeVersion !== PLUGIN_RENDER_VERSION)
        throw new Error("不支持此内容插件协议");
      const manifest = validatePluginManifest(dependency.manifest);
      if (!manifest.editor || ids.has(manifest.id)) throw new Error("内容插件重复或缺少编辑器声明");
      ids.add(manifest.id);
      if (Boolean(manifest.styles) !== Boolean(dependency.styles))
        throw new Error("插件样式声明不完整");
      const code = await readVerified(
        new URL(dependency.entry, dataUrl),
        manifest.integrity[manifest.main],
        signal
      );
      const css =
        manifest.styles && dependency.styles
          ? await readVerified(
              new URL(dependency.styles, dataUrl),
              manifest.integrity[manifest.styles],
              signal
            )
          : undefined;
      signal?.throwIfAborted();
      const definition = evaluatePluginPackage({ manifest, code, css }, pluginModules);
      assertRenderTypes(definition, dependency.nodeTypes);
      for (const type of dependency.nodeTypes) {
        if (types.has(type)) throw new Error(`内容插件节点冲突：${type}`);
        types.add(type);
      }
      if (css !== undefined) {
        const style = document.createElement("style");
        style.dataset.tauContentPlugin = manifest.id;
        style.textContent = scopeContentCss(css, scope);
        styles.push(style);
        document.head.append(style);
      }
      // 归属及协议已校验；扩展在 Editor 装配时继续接受通用冲突与结构检查。
      definitions.push({
        id: definition.id,
        editorExtensions: definition.editorExtensions as readonly AnyExtension[] | undefined,
      });
    }
    return { definitions, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

export async function prepareContent(result: DataResult, scopeId: string, signal?: AbortSignal) {
  const scope = `[data-published-content="${scopeId}"]`;
  const plugins = await loadPluginDefinitions(
    result.data.pluginRenderers ?? [],
    result.dataUrl,
    scope,
    signal
  );
  const styles: HTMLStyleElement[] = [];
  const css: string[] = [];
  const dispose = () => {
    plugins.dispose();
    styles.splice(0).forEach(style => style.remove());
  };
  try {
    for (const ref of result.data.contentStyles ?? []) {
      const source = await readVerified(new URL(ref.href, result.dataUrl), ref.integrity, signal);
      css.push(source);
      const style = document.createElement("style");
      style.dataset.tauPublishedCss = scopeId;
      style.textContent = scopeContentCss(source, scope);
      styles.push(style);
      document.head.append(style);
    }
    signal?.throwIfAborted();
    return { definitions: plugins.definitions, css: css.join("\n"), dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
