# Catalog Tabs And Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將首頁改為三個 Tabs，新增 Gist/Topic 分類資料，同步調整 GitHub Actions 為資料同步與手動部署分離。

**Architecture:** 將 `src/data/catalog.json` 升級為首頁聚合資料物件，讓同步腳本一次產出 `projects`、`gistGroups`、`topicGroups` 與 `syncedAt`。首頁依同一份 JSON 渲染三個 tabs，CI workflow 分別負責提交資料與手動部署。

**Tech Stack:** Astro, TypeScript, Vitest, GitHub Actions, GitHub GraphQL/REST API

---

### Task 1: 擴充型別與 schema

**Files:**
- Modify: `src/lib/catalog/types.ts`
- Modify: `src/lib/catalog/schema.ts`
- Test: `tests/catalog/schema.test.ts`

**Step 1: Write the failing test**

在 `tests/catalog/schema.test.ts` 新增首頁聚合資料 schema 測試，涵蓋 `projects`、`gistGroups`、`topicGroups`、`syncedAt`。

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/catalog/schema.test.ts`
Expected: FAIL，因為現有 schema 仍只接受 project array。

**Step 3: Write minimal implementation**

在 `src/lib/catalog/types.ts` 與 `src/lib/catalog/schema.ts` 增加 gist/topic/homepage snapshot 型別與 zod schema。

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/catalog/schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/catalog/schema.test.ts src/lib/catalog/types.ts src/lib/catalog/schema.ts
git commit -m "test(schema): 擴充首頁聚合資料模型"
```

### Task 2: 先定義同步分組行為

**Files:**
- Create: `tests/catalog/grouping.test.ts`
- Modify: `src/lib/catalog/discovery.ts`
- Modify: `scripts/sync-github.ts`

**Step 1: Write the failing test**

新增分組測試，驗證 gist description 逗號拆分與 repo topic issue 關聯邏輯。

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/catalog/grouping.test.ts`
Expected: FAIL，因為尚未提供 grouping helpers。

**Step 3: Write minimal implementation**

在 `src/lib/catalog/discovery.ts` 或共用模組新增 grouping helpers，讓同步腳本可產出 gist/topic groups。

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/catalog/grouping.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/catalog/grouping.test.ts src/lib/catalog/discovery.ts scripts/sync-github.ts
git commit -m "test(sync): 定義 Gist 與 Topic 分組邏輯"
```

### Task 3: 改寫同步腳本輸出首頁快照

**Files:**
- Modify: `scripts/sync-github.ts`
- Modify: `src/data/catalog.json`
- Test: `tests/catalog/query-flow.test.ts`

**Step 1: Write the failing test**

補上同步輸出結構測試，確認 JSON 根物件與欄位命名。

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/catalog/query-flow.test.ts`
Expected: FAIL，因為同步輸出仍是 project array。

**Step 3: Write minimal implementation**

改寫 `scripts/sync-github.ts`，抓取 gists、組出 topic groups，寫出新的 snapshot 結構。

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/catalog/query-flow.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/sync-github.ts src/data/catalog.json tests/catalog/query-flow.test.ts
git commit -m "feat(sync): 輸出首頁聚合快照"
```

### Task 4: 實作首頁 Tabs 與新資料視圖

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`
- Test: `tests/catalog/page-script.test.ts`
- Create: `tests/catalog/index-tabs.test.ts`

**Step 1: Write the failing test**

新增首頁 tabs 與 gist/topic 文案測試。

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/catalog/page-script.test.ts tests/catalog/index-tabs.test.ts`
Expected: FAIL，因為頁面仍只有單一清單。

**Step 3: Write minimal implementation**

在首頁加入 tabs、三種 panel 與必要 client-side tab state/rendering。

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/catalog/page-script.test.ts tests/catalog/index-tabs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/index.astro src/styles/global.css tests/catalog/page-script.test.ts tests/catalog/index-tabs.test.ts
git commit -m "feat(ui): 新增首頁多分頁資料視圖"
```

### Task 5: 調整 GitHub Actions

**Files:**
- Modify: `.github/workflows/daily-catalog-sync.yml`
- Modify: `.github/workflows/pages-manual-sync-deploy.yml`
- Create: `tests/catalog/workflows.test.ts`

**Step 1: Write the failing test**

新增 workflow 檔案內容測試，確認 daily 仍可同步提交、pages 僅支援手動部署且不再同步。

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/catalog/workflows.test.ts`
Expected: FAIL，因為現況 pages workflow 仍含 push 與 sync。

**Step 3: Write minimal implementation**

修改兩份 workflow 使職責分離。

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/catalog/workflows.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add .github/workflows/daily-catalog-sync.yml .github/workflows/pages-manual-sync-deploy.yml tests/catalog/workflows.test.ts
git commit -m "ci: 拆分同步與手動部署流程"
```

### Task 6: 全量驗證與交付

**Files:**
- Modify: `README.md`

**Step 1: Run targeted tests**

Run: `npm run test -- tests/catalog`
Expected: PASS

**Step 2: Run full verification**

Run: `npm run test && npm run build`
Expected: PASS

**Step 3: Update docs if needed**

補充 README 或 workflow 說明。

**Step 4: Create final commit**

```bash
git add README.md docs/plans .github/workflows src tests
git commit -m "feat: 新增首頁分頁分類與同步部署拆分"
```
