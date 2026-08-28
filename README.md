# SJSIA 盛家健康發展協會

Monorepo 結構：

| 目錄 | 用途 | 部署 |
|------|------|------|
| `site/` | 對外官網 | Vercel（Root Directory: **site**） |
| `portal/` | 會員後台 | Vercel（Root Directory: **portal**） |
| `backend/` | API | Railway（Root Directory: **backend**） |

詳見 [DEPLOY.md](./DEPLOY.md)。

## 會員驗證信

Backend 的 Railway Variables 建議設定 `RESEND_API_KEY` 與 `EMAIL_FROM`。Railway
Hobby／Trial 方案不開放 SMTP，正式寄信請使用 Resend HTTPS API；SMTP 變數僅作為
Railway Pro 以上方案的備援。

## 本機開發

```bash
# 官網
npm run site:dev

# 會員後台
npm run portal:dev

# API
npm run backend:dev
```
