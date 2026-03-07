# Tech Stack Link

Tech Stack Link 是一個部署在 GitHub Pages 的靜態網站，用來整理 Side Project 與其 Tech Stack，並展示 repo catalog、依 Gist description 分類的片段，以及依 repo topic 分類的 repo/issue 快照。

## 程式架構

### 1. 前端展示（Astro）
- `src/pages/index.astro`
  - 載入 `src/data/catalog.json`
  - 渲染三個 Tabs：Projects / Gists by Description / Repos by Topic
  - 僅在 Projects Tab 啟用 stack 多選與 keyword 篩選
  - URL query state 同步（可分享篩選結果）
- `src/components/BaseHead.astro`
  - 管理 SEO/meta 與 base-path-safe 資源路徑
- `src/styles/global.css`
  - 首頁樣式與 RWD

### 2. 資料同步（GitHub GraphQL）
- `scripts/sync-github.ts`
  - 透過 `GITHUB_TOKEN` 從 GitHub GraphQL 自動探索 owner 的 repos
  - 透過 GitHub REST API 同步該 owner 的 gists
  - 依設定決定是否包含 private / fork / archived
  - 抓取 repo metadata、完整 issue 分頁，以及 gist description 分類資料
  - 輸出 `src/data/catalog.json`
- `src/lib/catalog/discovery.ts`
  - 將 GitHub repository 資料映射成專案模型（`ProjectInput`）
- `src/lib/catalog/*.ts`
  - schema 驗證、normalize、filter、query state 等邏輯

### 3. CI/CD（GitHub Actions）
- `.github/workflows/pages-manual-sync-deploy.yml`
  - `test -> build -> deploy`
  - 僅允許手動觸發，不會重新同步資料
- `.github/workflows/daily-catalog-sync.yml`
  - 每日排程同步 `src/data/catalog.json`（`04:00 UTC`，即 `12:00 UTC+8`）
  - 支援手動觸發（`workflow_dispatch`）
  - 僅在 `src/data/catalog.json` 有異動時才會自動 commit + push

## 如何安裝

```bash
npm install
cp .env.example .env
```

`.env` 範例：

```bash
GITHUB_TOKEN=ghp_xxx
SYNC_OWNER=jackwio
SYNC_INCLUDE_PRIVATE=true
SYNC_INCLUDE_FORKS=false
SYNC_INCLUDE_ARCHIVED=false
```

## 如何跑程式

```bash
npm run dev        # 啟動本機開發伺服器
npm run sync       # 從 GitHub 同步資料並更新 src/data/catalog.json
npm run test       # 執行測試
npm run build      # 打包靜態網站
npm run preview    # 本機預覽 build 結果
```

## 如何使用

### A. 本機使用
1. 設定 `.env`（至少 `GITHUB_TOKEN`、`SYNC_OWNER`）。
2. 執行 `npm run sync` 產生最新 `catalog.json`。
3. 執行 `npm run dev` 開始瀏覽與篩選。

### B. 透過 GitHub Action 自動同步
1. 在 repo Secrets 新增 `SYNC_GITHUB_TOKEN`（建議 PAT，需可讀 private repos）。
2. 觸發 workflow：
   - `Daily Catalog Sync`：每天中午 12:00（UTC+8）自動執行，或手動執行；流程為 `sync -> test`，並在資料有變更時自動提交 `src/data/catalog.json`。
   - `Pages Manual Sync Deploy`：在 `Daily Catalog Sync` 完成且資料已更新後，手動觸發 `test -> build -> deploy` 到 GitHub Pages。

## Tech Stack Link 如何實作

此專案採用「build-time 資料快照」策略，避免前端直接打 GitHub API：

1. **Repo 探索**  
   `sync` 腳本依 `SYNC_OWNER` 查詢 owner 旗下 repos（可含 private）。
2. **資料轉換**  
   將 GitHub repository topic / language / visibility 轉成站內專案資料模型。
3. **Issue 聚合**  
   每個 repo 以 cursor 分頁抓取 issues，輸出標準化欄位（title/state/labels/updatedAt/url）。
4. **Gist 與 Topic 分組**  
   將 gist description 以逗號切分後分組，並依 repo topics 建立 topic group 與 topic-matched issue 清單。
5. **靜態輸出**  
   將資料寫入單一 `src/data/catalog.json` snapshot，供前端唯一讀取來源。
6. **前端篩選**  
   在瀏覽器端只針對 Projects Tab 做 stack AND 篩選與 keyword 搜尋，並同步到 URL query。

## 安全與風險提醒

- 若 `SYNC_INCLUDE_PRIVATE=true`，同步後資料會出現在公開 Pages，等同公開 private repo / issue 資訊。
- 請確認此行為符合你的可見性政策再啟用。

## 授權

本專案採用 MIT License，詳見 `LICENSE`。
