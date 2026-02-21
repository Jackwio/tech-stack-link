# Tech Stack Link

Tech Stack Link 是一個部署在 GitHub Pages 的靜態網站，用來整理 Side Project 與其 Tech Stack，並快照每個 repo 的 issue 狀態。

## Stack

- Astro + TypeScript
- YAML (`data/projects.yaml`) 作為手動資料來源
- GitHub API 同步腳本 (`scripts/sync-github.ts`)
- 靜態輸出資料 (`src/data/catalog.json`)
- Vitest（單元/流程測試）

## Data Flow

1. 編輯 `data/projects.yaml`
2. 執行 `npm run sync`
3. 產生/更新 `src/data/catalog.json`
4. `npm run build` 後部署到 GitHub Pages

## Local Setup

```bash
npm install
cp .env.example .env # optional
```

`.env` 可設定：

```bash
GITHUB_TOKEN=ghp_xxx
```

`npm run sync` 需要 `GITHUB_TOKEN`（GraphQL cursor 分頁），才能抓取完整 issue 清單並避免 rate limit 問題。

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
- Secret: `GITHUB_TOKEN`（供 sync script 使用）
- Result: 同步資料後 build，部署至 GitHub Pages
