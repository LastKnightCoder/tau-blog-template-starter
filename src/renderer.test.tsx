import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { Node, Transforms } from "slate";
import { expect, it, vi } from "vitest";
import { Editor, type EditorRef } from "@tau/editor";
import { ContentRenderer, type DataResult } from "@tau/editor/renderer";

it("公开 Editor 无需宿主接线即可编辑，多实例不共享正文或回调", async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  if (!Element.prototype.scrollIntoView)
    Element.prototype.scrollIntoView = () => {};
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const first = createRef<EditorRef>(),
    second = createRef<EditorRef>();
  const content = [
    {
      type: "paragraph" as const,
      children: [{ type: "formatted" as const, text: "正文" }],
    },
  ];
  const onChange = vi.fn();
  try {
    await act(async () =>
      root.render(
        <>
          <Editor ref={first} initValue={content} onChange={onChange} />
          <Editor ref={second} initValue={content} readonly />
        </>,
      ),
    );
    expect(first.current!.getEditor()).not.toBe(second.current!.getEditor());
    onChange.mockClear();
    await act(async () => {
      const editor = first.current!.getEditor();
      Transforms.select(editor, { path: [0, 0], offset: 2 });
      editor.insertText("更新");
    });
    expect(Node.string(first.current!.getEditor())).toBe("正文更新");
    expect(Node.string(second.current!.getEditor())).toBe("正文");
    expect(content[0].children[0].text).toBe("正文");
    expect(onChange).toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});

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
