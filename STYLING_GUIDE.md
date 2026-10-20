# 样式配置指南

本模板是最小化示例，直接使用 `@tau/blog` 包的样式和组件。如果你需要使用 Tailwind CSS 自定义样式，请参考以下配置。

## 为什么需要这些配置？

如果你计划：
- 使用 Tailwind CSS 构建自定义布局
- 导入外部 CSS 包（如 `@tau/blog/styles.css`）
- 添加响应式设计（断点：sm/md/lg/xl）

那么你需要正确配置 Tailwind 和 Vite 构建选项，**否则可能出现样式丢失、响应式布局失效等问题**。

## 必需的配置文件

### 1. tailwind.config.ts

如果使用 Tailwind CSS，必须创建此文件以确保响应式断点正确生效：

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 2. 更新 vite.config.ts

如果使用 Tailwind 和导入外部 CSS 包，需要优化 Vite 构建配置：

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "slate",
      "slate-react",
      "react-dnd",
      "react-dnd-html5-backend",
    ],
  },
  build: {
    outDir: "dist/site",
    emptyOutDir: true,
    // 关键：确保所有 CSS 合并到一个文件
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        // 关键：确保所有模块打包到一起
        manualChunks: undefined,
      },
    },
  },
  // 关键：确保外部包的样式也被处理
  optimizeDeps: {
    include: ["@tau/blog"],
  },
});
```

### 3. 更新 package.json 依赖

如果使用 Tailwind CSS，添加以下依赖：

```json
{
  "devDependencies": {
    "@tailwindcss/vite": "4.1.18",
    "@vitejs/plugin-react-swc": "3.11.0",
    "tailwindcss": "4.1.18",
    "postcss": "8.5.6"
  }
}
```

## 常见问题

### 问题 1：桌面端导航栏消失，只显示移动端菜单

**原因**：响应式类（如 `hidden md:flex`）未生效

**解决**：创建 `tailwind.config.ts`，明确定义断点

### 问题 2：布局组件样式丢失

**原因**：外部 CSS（`@tau/blog/styles.css` 等）未正确打包

**解决**：在 `vite.config.ts` 中设置 `cssCodeSplit: false` 和 `optimizeDeps`

### 问题 3：构建后样式不完整

**原因**：CSS 代码分割导致部分样式未加载

**解决**：设置 `manualChunks: undefined`

## 验证构建产物

构建后检查：

```bash
# CSS 文件应该足够大（如果使用了 Tailwind，通常 > 200KB）
ls -lh dist/site/assets/*.css

# 验证关键样式存在
grep "md:flex\|lg:flex" dist/site/assets/*.css
```

## 参考

- 官方模板：https://github.com/LastKnightCoder/tau-blog-template
- 问题修复：v1.2.1 commit 记录

---

**注意**：本 starter 模板默认不包含 Tailwind，仅在你需要时参考此指南添加。
