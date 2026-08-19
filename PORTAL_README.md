# 盛家協會會員後台 MVP

| 目錄 | 說明 | 部署 |
|------|------|------|
| `site/` | 對外官網 | Vercel |
| `portal/` | 會員後台 | Vercel |
| `backend/` | Express API + PostgreSQL | Railway |

**完整部署步驟** → [`DEPLOY.md`](./DEPLOY.md)

---

## 本機快速開始

### 1. PostgreSQL（Docker）

```bash
# repo 根目錄
npm run db:up
# 或：docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run db:import-members
npm run dev
```

API：http://localhost:4000

### 3. Portal

```bash
cd portal
cp .env.example .env.local
npm install
npm run dev
```

Portal：http://localhost:3001

### 4. 官網（TopNav 連結 Portal）

```bash
cd site
cp .env.example .env.local
npm install
npm run dev
```

官網：http://localhost:3000 → 點「會員後台」進 Portal

---

## 預設管理員

- Email：`admin@sjsia.tw`
- 密碼：`admin123456`

---

## 角色路由

| 角色 | Dashboard |
|------|-----------|
| 品牌方 | `/dashboard/brand` |
| KOL | `/dashboard/kol` |
| Admin | `/dashboard/admin` |

Schema：`backend/src/db/schema.sql`

## 會員名單匯入

本機私密檔 `backend/src/data/member-kols.json` 是從 Google 試算表「會員名單_整理」整理出的 KOL 快照，已被 `.gitignore` 排除，避免把管理員限定報價提交到 GitHub。
執行 `npm run db:import-members` 可安全重複匯入；相同 `source_ref` 會更新，不會重複新增。
正式 Railway 資料庫請在安全環境中設定 Railway `DATABASE_URL` 後執行一次此命令，不要把私密 JSON 加入 Git。
