import { existsSync, readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { resolve } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { loadPluginDefinitions, readVerified } from "./resources";

afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelectorAll("style[data-tau-content-plugin]").forEach(style => style.remove());
});
const hash = async (text: string) =>
  [...new Uint8Array(await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");

it("摘要失败和预先取消均不留下资源或执行插件", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const fetch = vi.fn(async () => new Response("unexpected"));
  vi.stubGlobal("fetch", fetch);
  await expect(readVerified(new URL("https://example.com/a"), "0".repeat(64))).rejects.toThrow(
    "摘要不匹配"
  );
  const controller = new AbortController();
  controller.abort();
  await expect(
    readVerified(new URL("https://example.com/b"), "0".repeat(64), controller.signal)
  ).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(document.querySelectorAll("style[data-tau-content-plugin]")).toHaveLength(0);
});

const catalogPath = resolve("test-fixtures/catalog.json");
it.skipIf(!existsSync(catalogPath))(
  "公开能力可接入五个正式 C23 插件，多实例样式与卸载互不影响",
  async () => {
    vi.stubGlobal("crypto", webcrypto);
    const dependencies = [];
    const files = new Map<string, string>();
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as {
      directory: string;
      nodeTypes: string[];
    }[];
    expect(catalog).toHaveLength(5);
    for (const item of catalog) {
      const base = resolve("test-fixtures", item.directory);
      const manifest = JSON.parse(readFileSync(resolve(base, "manifest.json"), "utf8"));
      const code = readFileSync(resolve(base, manifest.main), "utf8");
      expect(await hash(code)).toBe(manifest.integrity[manifest.main]);
      const entry = `${manifest.id}/main.js`;
      files.set(new URL(entry, "https://example.com/data.json").href, code);
      let styles: string | undefined;
      if (manifest.styles) {
        styles = `${manifest.id}/main.css`;
        files.set(
          new URL(styles, "https://example.com/data.json").href,
          readFileSync(resolve(base, manifest.styles), "utf8")
        );
      }
      dependencies.push({
        runtimeVersion: 1 as const,
        manifest,
        entry,
        styles,
        nodeTypes: item.nodeTypes,
      });
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: URL) =>
          new Response(files.get(String(url)), { status: files.has(String(url)) ? 200 : 404 })
      )
    );
    const first = await loadPluginDefinitions(
      dependencies,
      "https://example.com/data.json",
      '[data-published-content="a"]'
    );
    const second = await loadPluginDefinitions(
      dependencies,
      "https://example.com/data.json",
      '[data-published-content="b"]'
    );
    expect(first.definitions).toHaveLength(5);
    expect(first.definitions[0]).not.toBe(second.definitions[0]);
    first.dispose();
    const remaining = [...document.querySelectorAll("style[data-tau-content-plugin]")];
    expect(remaining.length).toBeGreaterThan(0);
    expect(
      remaining.every(style => style.textContent?.includes('[data-published-content="b"]'))
    ).toBe(true);
    second.dispose();
    expect(document.querySelectorAll("style[data-tau-content-plugin]")).toHaveLength(0);
  }
);
