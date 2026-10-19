import * as react from "react";
import * as reactDom from "react-dom";
import * as reactDomClient from "react-dom/client";
import * as jsx from "react/jsx-runtime";
import * as jsxDev from "react/jsx-dev-runtime";
import * as ui from "@tau/editor/ui";
import { defineElement, defineExtension } from "@tau/editor/api";
import { sourceEditorRuntime, inlineSourceRuntime } from "@tau/editor/source";
import { SIDEBAR_GROUPS } from "@tau/plugins/publish-artifacts";

// C23 定义适配只提供静态内容能力，不调用桌面生命周期或伪造宿主服务。
const plugins = Object.freeze({
  SIDEBAR_GROUPS,
  definePlugin: (definition: Record<string, unknown>) =>
    Object.freeze({
      ...definition,
      apiVersion: 1,
      create: definition.create ?? (() => ({ activate: () => undefined })),
    }),
  defineEditorElement: defineElement,
  defineEditorExtension: (definition: Parameters<typeof defineExtension>[0]) => {
    if ("plugins" in definition) throw new Error("C23 不支持原始 Slate 包装器");
    return defineExtension(definition);
  },
  ...sourceEditorRuntime,
  ...inlineSourceRuntime,
  usePluginServices: () => undefined,
});

export const pluginModules: Readonly<Record<string, unknown>> = Object.freeze({
  "@tau/plugins": plugins,
  "@tau/ui": ui,
  react,
  "react-dom": reactDom,
  "react-dom/client": reactDomClient,
  "react/jsx-runtime": jsx,
  "react/jsx-dev-runtime": jsxDev,
});
