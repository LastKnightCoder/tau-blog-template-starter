# Tau 模板起步儲存庫

這是模板作者的獨立專案，直接使用 `@tau/blog`。宿主只輸出資料、搜尋與外掛產物；頁面、Router、搜尋介面及預覽皆由模板決定。

公開相依套件固定為 `@xiongtao.xt/tau-blog@0.6.0`，程式碼中使用別名 `@tau/blog`。點擊 [Use this template](https://github.com/LastKnightCoder/tau-blog-template-starter/generate) 建立自己的儲存庫後，依鎖定檔案安裝即可，無需宿主 checkout 或本機原始碼連結。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test
pnpm build
```

開發伺服器使用 `scripts/dev-fixture.mjs` 中的記憶體測試資料，正式建置不包含測試資料。`pnpm-workspace.yaml` 中的 `minimumReleaseAgeExclude` 只是為了讓 pnpm 安裝剛發佈的固定版本，版本發佈滿一天後即可刪除。

## 最小接入

```tsx
import { createRoot } from "react-dom/client";
import { createClient, ContentRenderer } from "@tau/blog";
import "@tau/blog/styles.css";

async function main() {
  const client = createClient({ manifestUrl: "/data/site.實際摘要.json" });
  const content = await client.readData({ key: "實際內文的 key" });
  createRoot(document.getElementById("root")!).render(
    <ContentRenderer content={content} hrefFor={target => `/?content=${target.key}`} />
  );
}
void main();
```

宿主能發佈的內容 `ContentRenderer` 都會完整顯示，包括內容外掛、網頁嵌入、影音、發佈設定裡的圖片外觀與站內連結。模板只需透過 `hrefFor` 告訴它某則內容對應哪個頁面網址；懸停預覽、目錄等選用能力請參閱 `@tau/blog` 的 README。

## 本儲存庫的範例

- `src/main.tsx`：列表、搜尋與單頁路由。網址格式為 `<部署路徑>/?content=<key>`，使用 `BrowserRouter`，`basename` 取自清單的 `site.basePath`；此規則僅屬於本模板，宿主不感知此 URL。
- `src/Content.tsx`：本模板的載入與錯誤呈現，可自行修改、刪除或直接使用 `ContentRenderer`。
- `index.html` 的 `data-theme="paper" data-mode="light"`：使用套件內建的 Tau 主題取值。也可以移除它，改在自己的樣式中定義 `--tau-*` 變數。

若改為多層路徑路由（例如 `/articles/3`），靜態託管直接開啟深層連結時會找不到檔案。可將入口 HTML 複製為 `404.html` 並列入 `template.entries`：GitHub Pages 會自動使用它，S3 則需將錯誤頁設為 `404.html`。資源路徑要改用 `__TAU_BASE__`（宿主發佈時替換為部署路徑），官方模板的 `scripts/build.mjs` 有現成寫法可參考。

HTML 等內容直接使用對應外掛原本的算繪元件，模板不識別具體外掛節點，也不改寫其 render。

## 站點欄位

宿主只提供站點標題、圖示、`basePath` 與 `publicUrl`，其餘站點設定由模板自行宣告。在 `template.json` 的 `siteFields` 中列出欄位，使用者就能在 Tau「站點設定 · 部落格模板」中填寫，發佈後從 `manifest.site.fields[key]` 讀取：

```json
"siteFields": [
  { "key": "tagline", "label": "副標題", "type": "text", "placeholder": "一句話介紹你的站點" },
  { "key": "layout", "label": "首頁排版", "type": "select", "options": [{ "value": "list", "label": "列表" }, { "value": "grid", "label": "格狀" }], "default": "list" },
  { "key": "showSearch", "label": "顯示搜尋", "type": "switch", "default": true }
]
```

支援 `text`、`textarea`、`url`、`select`、`switch` 五種型別，可選填 `description`（說明）、`placeholder`（文字類）與 `default`。`key` 須以字母開頭，僅含字母、數字與底線，最多 32 個欄位。使用者未填寫的欄位取 `default`；文字類無預設值時為空字串，開關為 `false`，下拉選單為第一個選項。

## 打包

先將 `template.json` 的 `id`、`name` 改為自己的名稱（`example.template` 僅為預留佔位，不同模板 id 相同會互相覆蓋），再執行 `pnpm build`，產物為 `output/<id>-<version>.zip`。ZIP 僅含靜態產物與完整性摘要，不執行桌面外掛生命週期；透過外掛中心提交後，使用者安裝即可在發佈設定中選用。

## 樣式設定

本模板為最小化範例，不包含 Tailwind CSS。若你需要使用 Tailwind 自訂樣式，請查看 **[樣式設定指南](STYLING_GUIDE.md)**，了解如何正確設定以避免常見的樣式問題。

⚠️ **重要**：如果你從官方模板 [tau-blog-template](https://github.com/LastKnightCoder/tau-blog-template) 複製程式碼並使用 Tailwind，務必參考樣式指南正確設定，否則可能出現響應式排版失效、樣式遺失等問題。

## 設定介面的語言

`template.json` 的 `i18n` 用來宣告詞典檔案，`resources` 路徑相對於打包後的 `template.root`；本範例由建置腳本把 `locales/` 下的 JSON 複製到 `dist/site/locales/`。欄位的 `label`、`description`、`placeholder` 與選項 `label` 可使用 `{ "kind": "i18n", "key": "詞條鍵" }`。

這些詞典僅供 Tau 的模板設定介面使用，會進行完整性校驗並計入套件配額，但不會隨站點匯出。網站本身需要的 JSON 應作為未宣告為介面詞典的普通資產。欄位的 key、選項 value、預設值與使用者填寫的內容均保持原樣。

本範例的新詞典宣告要求桌面用戶端至少為 `0.68.0`；舊的純字串模板仍依原協定運作。UI 函式庫與部落格算繪函式庫使用各自的版本，不由這個用戶端門檻決定。
