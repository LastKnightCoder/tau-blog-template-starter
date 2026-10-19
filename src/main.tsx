import { Content } from "./Content";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, useSearchParams } from "react-router-dom";
import {
  createClient,
  type ContentRef,
  type DataManifest,
  type DataResult,
} from "@tau/blog";
import "@tau/blog/styles.css";
import "./style.css";

const manifestPath = document.querySelector<HTMLMetaElement>(
  'meta[name="tau-manifest"]',
)?.content;
if (!manifestPath || manifestPath.includes("__TAU_"))
  throw new Error("缺少数据清单，请使用开发服务器或宿主发布产物");
const client = createClient({
  manifestUrl: new URL(manifestPath, document.baseURI).href,
});
// 本模板只有一个页面，用 `?content=<key>` 选择正文；路由规则由模板决定，宿主不知道这个 URL。
const routeFor = (key: string) => `/?content=${encodeURIComponent(key)}`;
const hrefFor = (target: ContentRef) => routeFor(target.key);

function App({ manifest }: { manifest: DataManifest }) {
  const [params] = useSearchParams();
  const [result, setResult] = useState<DataResult>();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ key: string; title: string }[]>([]);
  const [searchError, setSearchError] = useState("");
  const key = params.get("content");
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setResult(undefined);
    if (key)
      client
        .readData({ key, signal: controller.signal })
        .then(setResult)
        .catch((error) => {
          if (!controller.signal.aborted) setError(String(error));
        });
    return () => controller.abort();
  }, [key]);
  useEffect(() => {
    const controller = new AbortController();
    client
      .search(query, { signal: controller.signal })
      .then((hits) => {
        setHits(hits);
        setSearchError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted) setSearchError(String(error));
      });
    return () => controller.abort();
  }, [query]);
  return (
    <main>
      <header>
        <Link to="/">{manifest.site.title}</Link>
        <span>模板起步</span>
      </header>
      <input
        aria-label="搜索正文"
        placeholder="搜索正文"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {searchError && <p role="alert">{searchError}</p>}
      {query ? (
        <nav>
          {hits.map((hit) => (
            <Link key={hit.key} to={routeFor(hit.key)}>
              {hit.title}
            </Link>
          ))}
        </nav>
      ) : null}
      {!key && (
        <nav>
          {manifest.items.map((item) => (
            <Link key={item.key} to={routeFor(item.key)}>
              {item.title}
            </Link>
          ))}
        </nav>
      )}
      {error && <p role="alert">{error}</p>}
      {key && !result && !error && <p role="status">正在读取内容…</p>}
      {result && (
        <article>
          <h1>
            {manifest.items.find((item) => item.key === result.data.key)?.title}
          </h1>
          <Content key={result.data.key} content={result} hrefFor={hrefFor} />
        </article>
      )}
    </main>
  );
}

const root = createRoot(document.getElementById("root")!);
client.readManifest().then(
  (manifest) =>
    root.render(
      <BrowserRouter basename={manifest.site.basePath.replace(/\/$/, "") || "/"}>
        <App manifest={manifest} />
      </BrowserRouter>,
    ),
  (error) => root.render(<p role="alert">{String(error)}</p>),
);
