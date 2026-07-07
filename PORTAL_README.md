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
