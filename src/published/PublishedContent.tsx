import { createContext, useContext, useEffect, useState } from "react";
import { Editor, type AnyExtension, type ElementRenderProps } from "@tau/editor";
import { SourceBlockEditor } from "@tau/editor/source";
import { CodeXml } from "lucide-react";
import type { DataResult, ContentNode } from "@tau/plugins/publish-data";
import type { Descendant } from "slate";
import { prepareContent } from "./resources";

const ContentCss = createContext("");
export const PublishedContentCss = ContentCss.Provider;

export function htmlDocumentSource(html: string, css: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  const style = document.createElement("style");
  style.dataset.tauContentCss = "";
  style.textContent = css.replace(/<\/style/gi, "<\\/style");
  document.head.append(style);
  return (
    (document.doctype ? new XMLSerializer().serializeToString(document.doctype) : "") +
    document.documentElement.outerHTML
  );
}

function FullHtmlDocument({ attributes, children, element }: ElementRenderProps) {
  const css = useContext(ContentCss);
  const html = String((element as unknown as { html: string }).html);
  return (
    <div {...attributes}>
      <SourceBlockEditor
        mode="htmlmixed"
        title="HTML"
        icon={CodeXml}
        initValue={html}
        element={element}
        extend
        onChange={() => {}}
      >
        <iframe
          title="HTML 文档"
          srcDoc={htmlDocumentSource(html, css)}
          sandbox="allow-scripts allow-forms"
          style={{ width: "100%", height: 600, border: 0 }}
        />
      </SourceBlockEditor>
      {children}
    </div>
  );
}

export function adaptPublishedExtensions(extensions: readonly AnyExtension[]): AnyExtension[] {
  return extensions.map(extension => ({
    ...extension,
    elements: extension.elements?.map(element => {
      if (element.type !== "html-block" || !element.render) return element;
      const Fragment = element.render;
      return {
        ...element,
        render: (props: ElementRenderProps) => {
          const html = (props.element as unknown as { html?: unknown }).html;
          return typeof html === "string" &&
            /<!doctype\s+html|<(?:html|head|body)(?:\s|>)/i.test(html) ? (
            <FullHtmlDocument {...props} />
          ) : (
            <Fragment {...props} />
          );
        },
      };
    }),
  }));
}

export function PublishedContent({
  result,
  nodes,
  extensions = [],
}: {
  result: DataResult;
  nodes?: ContentNode[];
  extensions?: readonly AnyExtension[];
}) {
  const [state, setState] = useState<{
    result: DataResult;
    scope: string;
    css: string;
    extensions: AnyExtension[];
  }>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const scope = crypto.randomUUID();
    let dispose: (() => void) | undefined;
    setState(undefined);
    setError("");
    prepareContent(result, scope, controller.signal)
      .then(prepared => {
        dispose = prepared.dispose;
        if (controller.signal.aborted) return dispose();
        setState({
          result,
          scope,
          css: prepared.css,
          extensions: adaptPublishedExtensions(
            prepared.definitions.flatMap(definition => definition.editorExtensions ?? [])
          ),
        });
      })
      .catch(error => {
        if (!controller.signal.aborted) setError(String(error));
      });
    return () => {
      controller.abort();
      dispose?.();
    };
  }, [result]);
  if (error) return <p role="alert">{error}</p>;
  if (!state || state.result !== result) return <p role="status">正在准备正文…</p>;
  const content = nodes ?? ("content" in result.data.content ? result.data.content.content : []);
  return (
    <div data-published-content={state.scope}>
      <ContentCss.Provider value={state.css}>
        <Editor
          key={state.scope}
          initValue={content as Descendant[]}
          readonly
          extensions={[...state.extensions, ...extensions]}
        />
      </ContentCss.Provider>
    </div>
  );
}
