# Catalog Tabs And Sync Design

## 1. 背景

現有首頁只呈現單一 Repo Catalog，資料同步也只涵蓋 repository 與 issues。新需求要求將首頁改為三個 Tabs，並新增 Gist 與 repo topics 的分類瀏覽，同時將 CI 流程拆為「資料同步」與「手動部署」兩段。

## 2. 需求摘要

1. 現有首頁內容保留，移至第 1 個 Tab。
2. 新增第 2 個 Tab，依 GitHub Gist description 以逗號分隔後的分類字串分組。
3. Gist 卡片只顯示 `Gist name` 與 `Gist URL`。
4. 新增第 3 個 Tab，依 GitHub repository topics 分組。
5. Repo card 只顯示 `Repo name` 與 `Repo URL`，並列出 issue title 內包含該 topic 字串的 issues。
6. `Daily Catalog Sync` 只同步資料並提交，不負責部署。
7. `Pages Manual Sync Deploy` 改為僅在手動觸發時 build/deploy，且不再重新同步資料。
8. 本地實作完成後需提交詳細 zh-TW commit log，並額外觸發一次 `Pages Manual Sync Deploy`。

## 3. 資料設計

### 3.1 首頁資料來源

將 `src/data/catalog.json` 由原本的 `CatalogProject[]` 升級為單一物件：

- `projects`: 原有 repo catalog 資料
- `gistGroups`: 依 description token 分類後的結果
- `topicGroups`: 依 repo topic 分類後的結果
- `syncedAt`: 同步時間

這樣首頁只需載入一份 JSON，即可支援三個 Tabs。

### 3.2 Gist 分類規則

1. 以 GitHub API 取得 owner 名下 Gists。
2. 使用 gist `description` 作為分類來源。
3. description 以逗號切開後，對每個 token 做 trim。
4. 空字串 token 丟棄。
5. 每個分類群組只保留 `name` 與 `url`。

### 3.3 Repo Topic 分類規則

1. 以 repository topics 作為分類來源。
2. 每個 topic 群組收集所有包含該 topic 的 repositories。
3. group 內每個 repo 只顯示 `name` 與 `url`。
4. issue 篩選條件為 `issue.title` 包含 topic 字串，不分大小寫。

## 4. UI 設計

### 4.1 Tabs

首頁新增三個 tabs：

1. `Projects`
2. `Gists by Description`
3. `Repos by Topic`

第 1 個 Tab 保留既有搜尋與 Tech Stack 篩選。第 2、3 個 Tabs 不需要沿用第 1 個 Tab 的 filter controls。

### 4.2 卡片呈現

1. 第 1 個 Tab 維持現有 project cards。
2. 第 2 個 Tab 以分類區塊呈現，每個分類內是 gist cards。
3. 第 3 個 Tab 以 topic 區塊呈現，每個分類內是 repo cards 與對應 issue 清單。

## 5. 同步流程

### 5.1 Daily Catalog Sync

1. 取得 repo、issues、gists。
2. 建立三個 tabs 所需的聚合資料。
3. 寫入 `src/data/catalog.json`。
4. 執行測試。
5. 若資料變更則 commit/push。

### 5.2 Pages Manual Sync Deploy

1. 僅允許 `workflow_dispatch`。
2. checkout 當前 repo 狀態。
3. 安裝依賴、跑測試、build、deploy。
4. 不再執行 `npm run sync`，避免部署時改寫資料。

## 6. 測試策略

1. schema tests：驗證新的首頁資料模型。
2. sync/discovery tests：驗證 gist description 與 repo topic 的分組邏輯。
3. page tests：驗證 tabs 標記與關鍵文案存在。
4. workflow tests 以檔案內容檢查為主，確保觸發條件與同步步驟符合新規則。

## 7. 風險

1. Gist API 與 GraphQL repo API 需並行維護兩套資料抓取邏輯。
2. 將 `catalog.json` 結構升級為物件後，既有前端與測試需要同步修改。
3. 若 workflow 需要遠端部署，最後的手動觸發將依本機可用的 `gh` CLI 與登入狀態決定是否能自動完成。
