import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Link, useSearchParams } from "react-router-dom";
import {
  createClient,
  ContentRenderer,
  type DataManifest,
  type DataResult,
} from "@tau/editor/renderer";
import "@tau/editor/styles.css";
import "./style.css";

const manifestPath = document.querySelector<HTMLMetaElement>(
  'meta[name="tau-manifest"]',
)?.content;
if (!manifestPath || manifestPath.includes("__TAU_"))
  throw new Error("缺少数据清单，请使用开发服务器或宿主发布产物");
const client = createClient({
  manifestUrl: new URL(manifestPath, document.baseURI).href,
});

function App() {
  const [params] = useSearchParams();
  const [manifest, setManifest] = useState<DataManifest>();
  const [result, setResult] = useState<DataResult>();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ key: string; title: string }[]>([]);
  const key = params.get("content");
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setResult(undefined);
    client
      .readManifest({ signal: controller.signal })
      .then(async (manifest) => {
        setManifest(manifest);
        if (key) {
          const result = await client.readData({
            key,
            signal: controller.signal,
          });
          if (!controller.signal.aborted) setResult(result);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(String(error));
      });
    return () => controller.abort();
  }, [key]);
  useEffect(() => {
    const controller = new AbortController();
    client
      .search(query, { signal: controller.signal })
      .then(setHits)
      .catch((error) => {
        if (!controller.signal.aborted) setError(String(error));
      });
    return () => controller.abort();
  }, [query]);
  return (
    <main>
      <header>
        <Link to="/">{manifest?.site.title ?? "Tau 模板"}</Link>
        <span>模板起步</span>
      </header>
      <input
        aria-label="搜索正文"
        placeholder="搜索正文"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      {query ? (
        <nav>
          {hits.map((hit) => (
            <Link key={hit.key} to={`/?content=${encodeURIComponent(hit.key)}`}>
              {hit.title}
            </Link>
          ))}
        </nav>
      ) : null}
      {!key && (
        <nav>
          {manifest?.items.map((item) => (
            <Link
              key={item.key}
              to={`/?content=${encodeURIComponent(item.key)}`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      )}
      {key && !result && !error && <p role="status">正在读取内容…</p>}
      {result && (
        <article>
          <h1>
            {
              manifest?.items.find((item) => item.key === result.data.key)
                ?.title
            }
          </h1>
          <ContentRenderer key={result.data.key} content={result} />
        </article>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);
