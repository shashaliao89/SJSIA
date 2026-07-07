# SJSIA 盛家運動健康產業協會

Monorepo 結構：

| 目錄 | 用途 | 部署 |
|------|------|------|
| `site/` | 對外官網 | Vercel（Root Directory: **site**） |
| `portal/` | 會員後台 | Vercel（Root Directory: **portal**） |
| `backend/` | API | Railway（Root Directory: **backend**） |

詳見 [DEPLOY.md](./DEPLOY.md)。

## 本機開發

```bash
# 官網
npm run site:dev

# 會員後台
npm run portal:dev

# API
npm run backend:dev
```
