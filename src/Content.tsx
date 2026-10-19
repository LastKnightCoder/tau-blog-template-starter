import { Component, type ReactNode } from "react";
import { ContentRenderer, type ContentRendererProps } from "@tau/blog";

class ContentErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  render() {
    return this.state.error ? (
      <p role="alert">正文加载失败：{this.state.error.message}</p>
    ) : (
      this.props.children
    );
  }
}

export function Content(props: ContentRendererProps) {
  return (
    <ContentErrorBoundary key={props.content.dataUrl}>
      <ContentRenderer
        {...props}
        fallback={<p role="status">正在准备正文…</p>}
      />
    </ContentErrorBoundary>
  );
}
