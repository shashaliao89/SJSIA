# 部署指南：Vercel + Railway

本 repo 含三個可部署單元：

| 服務 | 目錄 | 平台 | 預設 port |
|------|------|------|-----------|
| 官網 | `site/` | Vercel | 3000 |
| 會員後台 | `portal/` | Vercel | 3001 |
| API | `backend/` | Railway | 4000 |

---

## 一、本機開發（Docker PostgreSQL）

### 1. 啟動資料庫

在 repo 根目錄：

```bash
docker compose up -d
docker compose ps   # 確認 healthy
```

連線字串：

```
postgresql://postgres:postgres@localhost:5432/sjsia_portal
```

### 2. 後端 API

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

→ http://localhost:4000/health

### 3. 會員後台 Portal

```bash
cd portal
cp .env.example .env.local
npm install
npm run dev
```

→ http://localhost:3001

### 4. 官網（可選）

```bash
cd site
cp .env.example .env.local   # 設定 NEXT_PUBLIC_PORTAL_URL=http://localhost:3001
npm install
npm run dev
```

→ http://localhost:3000（TopNav「會員後台」會連到 Portal）

### 停止資料庫

```bash
docker compose down        # 保留資料
docker compose down -v     # 清除 volume（重置 DB）
```

---

## 二、Railway 部署 Backend

### 步驟

1. 登入 [Railway](https://railway.app)，**New Project**
2. **Add PostgreSQL** → 記下 `DATABASE_URL`（或之後用 `${{Postgres.DATABASE_URL}}` 引用）
3. **New Service → GitHub Repo**，Root Directory 設 **`backend`**
4. **Variables**（Settings → Variables）：

| 變數 | 值 |
|------|-----|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` 或手動貼上 |
| `JWT_SECRET` | 長隨機字串（至少 32 字元） |
| `CORS_ORIGIN` | Portal 正式網址，例如 `https://portal-xxx.vercel.app` |
| `PORT` | Railway 通常自動注入，可不設 |

5. **Deploy** 後，`npm start` 會自動跑 migration（見 `backend/package.json`）
6. **一次性**建立管理員（Railway CLI 或 Dashboard → Run Command）：

```bash
npm run db:seed
```

7. 記下 Public Domain，例如：`https://sjsia-portal-api-production.up.railway.app`
8. 驗證：`GET https://<api-domain>/health` → `{"ok":true}`

### 設定檔

- `backend/railway.toml`：build / healthcheck / start
- 每次 deploy 會執行 `node dist/db/migrate.js` 再啟動 API

---

## 三、Vercel 部署 Portal（會員後台）

### 步驟

1. [Vercel](https://vercel.com) → **Add New Project** → 選同一 Git repo
2. **Root Directory**：`portal`
3. Framework：Next.js（自動偵測）
4. **Environment Variables**：

| 變數 | 值 |
|------|-----|
| `NEXT_PUBLIC_API_URL` | Railway API 網址，例如 `https://sjsia-portal-api-production.up.railway.app` |
| `NEXT_PUBLIC_SITE_URL` | 官網正式網址，例如 `https://www.sjsia.tw` |

5. Deploy → 取得網址，例如 `https://portal-xxx.vercel.app`

6. **回 Railway** 更新 `CORS_ORIGIN` 為 Portal 網址（若有多網域用逗號分隔）

7. 重新 Deploy Backend（或等下次 deploy 生效）

---

## 四、Vercel 部署 Site（官網）

### 步驟

1. 再建一個 Vercel Project（同一 repo）
2. **Root Directory**：`site`
3. **Environment Variables**：

| 變數 | 值 |
|------|-----|
| `NEXT_PUBLIC_PORTAL_URL` | Portal 正式網址，例如 `https://portal-xxx.vercel.app` |

4. Deploy → 官網 TopNav「會員後台」會導向 `{PORTAL_URL}/login`

---

## 五、環境變數對照表

| 變數 | 設定位置 | 用途 |
|------|----------|------|
| `DATABASE_URL` | Railway (backend) | PostgreSQL |
| `JWT_SECRET` | Railway (backend) | JWT 簽章 |
| `CORS_ORIGIN` | Railway (backend) | 允許 Portal 跨域 |
| `NEXT_PUBLIC_API_URL` | Vercel (portal) | Portal 呼叫 API |
| `NEXT_PUBLIC_SITE_URL` | Vercel (portal) | Portal 返回官網連結 |
| `NEXT_PUBLIC_PORTAL_URL` | Vercel (site) | 官網連結到 Portal |

---

## 六、自訂網域（選用）

| 服務 | 建議子網域 |
|------|------------|
| 官網 | `www.sjsia.tw` 或 `sjsia.tw` |
| Portal | `portal.sjsia.tw` 或 `member.sjsia.tw` |
| API | `api.sjsia.tw`（Railway Custom Domain） |

設定自訂網域後，記得同步更新：

- Portal 的 `NEXT_PUBLIC_API_URL`
- Site 的 `NEXT_PUBLIC_PORTAL_URL`
- Backend 的 `CORS_ORIGIN`

---

## 七、預設管理員

首次 `db:seed` 後：

- Email：`admin@sjsia.tw`
- 密碼：`admin123456`（**正式環境請立即修改**）

可在 Railway Variables 覆寫 `ADMIN_EMAIL`、`ADMIN_PASSWORD` 後再跑一次 `npm run db:seed`（僅在 admin 不存在時建立）。

---

## 八、常見問題

**Portal 登入顯示 Network Error**  
→ 檢查 `NEXT_PUBLIC_API_URL` 是否正確、Railway API 是否 online、CORS 是否包含 Portal 網域。

**待審核無法使用功能**  
→ 用 Admin 登入 Portal → 會員管理 → 通過審核。

**本機 DB 連不上**  
→ `docker compose ps` 確認 healthy；port 5432 是否被占用。

**Railway build 失敗**  
→ 確認 Root Directory 為 `backend`；本地先跑 `npm run build` 測試。
