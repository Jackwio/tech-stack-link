# Tech Stack Link Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 實作可部署於 GitHub Pages 的 Tech Stack Link MVP，支援專案卡片、Tech Stack 篩選、關鍵字搜尋、Issue 快照展示與手動同步流程。

**Architecture:** 使用 `data/projects.yaml` 作為手動維護來源，透過 `scripts/sync-github.ts` 向 GitHub API 取得 repo/issue metadata 並輸出 `src/data/catalog.json`。前端首頁只讀取 `catalog.json`，在 client-side 進行篩選與 URL query 同步。

**Tech Stack:** Astro 5, TypeScript, Zod, YAML parser, Vitest

---

### Task 1: Data Model + Validation Utilities

**Files:**
- Create: `data/projects.yaml`
- Create: `src/data/catalog.json`
- Create: `src/lib/catalog/schema.ts`
- Create: `src/lib/catalog/types.ts`
- Test: `tests/catalog/schema.test.ts`

### Task 2: Sync Script + GitHub Enrichment

**Files:**
- Create: `scripts/sync-github.ts`
- Create: `src/lib/catalog/normalize.ts`
- Modify: `package.json`
- Test: `tests/catalog/normalize.test.ts`

### Task 3: Filter + URL Query State

**Files:**
- Create: `src/lib/catalog/filter.ts`
- Create: `src/lib/catalog/query.ts`
- Test: `tests/catalog/filter.test.ts`
- Test: `tests/catalog/query-flow.test.ts`

### Task 4: Homepage UI

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`
- Modify: `src/consts.ts`

### Task 5: Verification

**Files:**
- Modify: `package.json`
- Run: `npm run test`
- Run: `npm run build`
