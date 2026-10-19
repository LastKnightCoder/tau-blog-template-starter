import { defineConfig } from "vite";
import { demoData } from "./scripts/dev-fixture.mjs";

export default defineConfig({
  base: "./",
  plugins: [{
    name: "template-dev-fixture",
    apply: "serve",
    transformIndexHtml: html => html.replace("__TAU_MANIFEST__", demoData.manifestUrl),
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const body = demoData.files.get(request.url?.split("?")[0] ?? "");
        if (!body) return next();
        response.setHeader("Content-Type", "application/json");
        response.end(body);
      });
    },
  }],
  esbuild: { jsx: "automatic" },
  resolve: { dedupe: ["react", "react-dom", "slate", "slate-dom", "slate-react", "react-dnd"] },
  build: { outDir: "dist/site" },
});
