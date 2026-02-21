# Tech Stack Link Design

## 1. 背景與目標

建立一個部署在 GitHub Pages 的網站，用來整理 Side Project 與其 Tech Stack，方便未來快速查詢「某個技術用在哪些專案」。  
本設計以 MVP 為主，優先提供快速瀏覽、篩選、與 Issue 追蹤入口。

## 2. 已確認需求

1. 使用 `Astro + TypeScript`。
2. 每個 Side Project 以 Card 呈現，包含 Tech Stack Tag 與 Repo 連結。
3. 可依 `Tech Stack Tag` 篩選，並支援關鍵字搜尋（Project 名稱/描述）。
4. 顯示完整 Issue 清單並可連到 GitHub。
5. 同步模式採「手動觸發」（更新資料或部署時才同步）。
6. GitHub Token 由 GitHub Actions `Secrets` 管理。
7. 目前決策：不區分 public/private 內容，全部顯示於公開 GitHub Pages。

## 3. 架構設計

### 3.1 整體流程

1. 人工維護 `data/projects.yaml`（專案核心描述）。
2. 同步腳本 `scripts/sync-github.ts` 讀取 YAML，呼叫 GitHub API 補齊 repo/issue 資訊。
3. 產生 `src/data/catalog.json` 作為前端唯一資料來源。
4. Astro build 後部署到 GitHub Pages。

### 3.2 設計原則

1. 前端不直接呼叫 GitHub API，避免暴露 token 與受 rate limit 影響。
2. 所有展示資料在 build time 固化為靜態 JSON，確保頁面快且穩定。
3. 保持資料模型單一來源，避免 YAML 與 UI 欄位定義漂移。

## 4. 資料模型

### 4.1 手動來源（`data/projects.yaml`）

每個 Project 具備欄位：

- `id`: string（穩定識別碼）
- `name`: string
- `description`: string
- `repo`: string（`owner/name`）
- `stacks`: string[]（例如 `["astro", "typescript"]`）
- `tags`: string[]（自定分類）
- `links`: `{ label: string; url: string }[]`（可選）

### 4.2 同步輸出（`src/data/catalog.json`）

每個 Project 在輸出中增加：

- `repoUrl`: string
- `repoMeta`: `{ stars: number; forks: number; updatedAt: string }`
- `issues`:  
  `[{ number: number; title: string; state: "OPEN" | "CLOSED"; labels: string[]; updatedAt: string; url: string }]`

## 5. 頁面與互動

### 5.1 版面

1. 首頁上方：Filter Bar（Tag 多選 + 關鍵字輸入 + 清除）。
2. 首頁下方：Project Card Grid（RWD）。

### 5.2 Card 內容

1. Project 名稱、描述。
2. Tech Stack Tags。
3. Repo 連結。
4. `Issues` 收合區塊（展開後顯示完整清單）。

### 5.3 篩選規則

1. Tag：多選，採 AND 條件（專案必須同時包含已選 tags）。
2. 關鍵字：比對 `name + description`，不分大小寫。
3. 篩選與搜尋前端即時生效，不重新整理頁面。
4. URL query 同步篩選狀態，支援分享結果。

## 6. Issue 整合規則

1. 每次手動同步時更新 issue 快照。
2. 顯示欄位：title、state、labels、updatedAt、GitHub URL。
3. 若無 issue，卡片顯示 `No issues`。
4. 若 API 失敗，沿用上次成功的 `catalog.json` 並在同步流程標示警告。

## 7. 錯誤處理與穩定性

1. YAML schema 驗證失敗：同步立即中止並回傳錯誤行號/欄位。
2. 單一 repo API 失敗：記錄錯誤並繼續其他 repo，最後整體回傳非 0 方便 CI 判斷。
3. Rate limit：偵測剩餘配額並輸出提示，必要時中止避免產出不完整資料。
4. 前端資料載入異常：顯示 fallback 訊息，避免白畫面。

## 8. 安全與可見性

1. Token 僅存在本機 `.env` 與 GitHub Actions `Secrets`。
2. 不在前端注入任何 secret。
3. 因為目前決策是公開展示全部 repo/issue，等同放棄私有資訊保密；需確認可接受長期風險。

## 9. 測試策略

1. 單元測試：
   - YAML 解析與 schema 驗證
   - 篩選邏輯（tag + keyword）
   - issue 正規化轉換
2. 元件測試：
   - Card 渲染
   - Issue 展開/收合
   - 空資料狀態
3. E2E（最少 1 條）：
   - 首頁載入 -> 選 tag -> 輸入關鍵字 -> URL query 正確

## 10. 非目標（MVP 不做）

1. 站內登入或權限控管。
2. 即時（runtime）GitHub API 查詢。
3. 跨頁管理後台。

## 11. 驗收標準

1. 可從首頁快速找出特定 Tech Stack 對應專案。
2. 每張 Card 可查看 repo 與 issue 清單並跳轉 GitHub。
3. GitHub Pages 成功部署且可在行動裝置正常使用。
4. 同步流程可重現，失敗時提供可行錯誤資訊。
