import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ContentRenderer, type DataResult } from "@tau/blog";

it("最小公开入口接收正文即可渲染，无需接线或手动准备插件", async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const content: DataResult = {
    dataUrl: "https://example.com/data/card.json",
    data: {
      version: 1,
      key: "example",
      meta: { type: "card", publishTime: 1 },
      content: {
        id: 1,
        tags: [],
        createTime: 1,
        updateTime: 1,
        content: [
          {
            type: "paragraph",
            children: [{ type: "formatted", text: "最小接入正文" }],
          },
        ],
      },
    },
  };
  try {
    await act(async () => root.render(<ContentRenderer content={content} />));
    await vi.waitFor(async () => {
      await act(async () => new Promise((resolve) => setTimeout(resolve, 5)));
      expect(container.textContent).toContain("最小接入正文");
    });
    expect(container.querySelector('[contenteditable="false"]')).not.toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
