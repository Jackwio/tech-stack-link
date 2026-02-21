# Tech Stack Link

Tech Stack Link 是一個部署在 GitHub Pages 的靜態網站，用來整理 Side Project 與其 Tech Stack，並快照每個 repo 的 issue 狀態。

## Stack

- Astro + TypeScript
- GitHub GraphQL（以 token 自動探索 owner repos）
- GitHub API 同步腳本 (`scripts/sync-github.ts`)
- 靜態輸出資料 (`src/data/catalog.json`)
- Vitest（單元/流程測試）

## Data Flow

1. 設定 sync 環境變數（owner、是否包含 private/fork/archive）
2. 執行 `npm run sync`
3. 由 GitHub API 自動探索 repo 並產生/更新 `src/data/catalog.json`
4. `npm run build` 後部署到 GitHub Pages

## Local Setup

```bash
npm install
cp .env.example .env # optional
```

`.env` 可設定：

```bash
GITHUB_TOKEN=ghp_xxx
SYNC_OWNER=jackwio
SYNC_INCLUDE_PRIVATE=true
SYNC_INCLUDE_FORKS=false
SYNC_INCLUDE_ARCHIVED=false
```

`npm run sync` 需要 `GITHUB_TOKEN`（GraphQL repo discovery + issues cursor 分頁）。
若要同步 `private` repo，token 需具備可讀 private repo 權限。

## Commands

```bash
npm run dev       # local preview
npm run sync      # sync repo + issues snapshot into src/data/catalog.json
npm run test      # run vitest
npm run build     # production build
```

## Deployment

本專案提供手動觸發 workflow：`.github/workflows/pages-manual-sync-deploy.yml`

- Trigger: `workflow_dispatch`（手動）
- Secret:
  - `SYNC_GITHUB_TOKEN`（建議，PAT，可讀 private repo）
  - 若未設定則退回 `secrets.GITHUB_TOKEN`（通常只能讀本 repo）
- Result: 同步資料後 build，部署至 GitHub Pages
