import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { Node, Transforms } from "slate";
import { expect, it, vi } from "vitest";
import { Editor, type EditorRef } from "@tau/editor";

it("公开 Editor 无需宿主接线即可编辑，多实例不共享正文或回调", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const first = createRef<EditorRef>(),
    second = createRef<EditorRef>();
  const content = [
    { type: "paragraph" as const, children: [{ type: "formatted" as const, text: "正文" }] },
  ];
  const onChange = vi.fn();
  try {
    await act(async () =>
      root.render(
        <>
          <Editor ref={first} initValue={content} onChange={onChange} />
          <Editor ref={second} initValue={content} readonly />
        </>
      )
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
