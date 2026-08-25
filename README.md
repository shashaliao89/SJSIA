# SJSIA 盛家運動健康產業協會

Monorepo 結構：

| 目錄 | 用途 | 部署 |
|------|------|------|
| `site/` | 對外官網 | Vercel（Root Directory: **site**） |
| `portal/` | 會員後台 | Vercel（Root Directory: **portal**） |
| `backend/` | API | Railway（Root Directory: **backend**） |

詳見 [DEPLOY.md](./DEPLOY.md)。

## 會員驗證信

Backend 的 Railway Variables 需設定 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、
`SMTP_PASS`、`EMAIL_FROM`。正式寄件人使用 `shasha.liao@stepc.co`；若信箱由
Google Workspace 管理，`SMTP_PASS` 應使用該帳號的應用程式密碼，不要使用登入密碼。

## 本機開發

```bash
# 官網
npm run site:dev

# 會員後台
npm run portal:dev

# API
npm run backend:dev
```
