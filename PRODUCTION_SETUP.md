# Production Setup Guide

## 1. Custom Domain для API (api.conglomerate-g.com)

### Крок 1: Deploy Worker
```bash
cd backend
wrangler deploy
```

### Крок 2: Додати Custom Domain в Cloudflare Dashboard

1. Перейди в Cloudflare Dashboard: https://dash.cloudflare.com
2. Вибери **Workers & Pages** в лівому меню
3. Знайди worker **conglomerate-api** (або **conglomerate-api-prod**)
4. Перейди в **Settings** → **Triggers** → **Custom Domains**
5. Натисни **Add Custom Domain**
6. Введи: `api.conglomerate-g.com`
7. Натисни **Add Custom Domain**

Cloudflare автоматично створить DNS запис і SSL сертифікат.

### Крок 3: Перевірити DNS
Після додавання domain, перевір DNS:
```bash
dig api.conglomerate-g.com
# Має показати A або AAAA record на Cloudflare Worker
```

### Крок 4: Тестування
```bash
curl https://api.conglomerate-g.com/health
# Має повернути {"status":"ok"}
```

---

## 2. Environment Variables та Secrets

### Backend (Cloudflare Worker)

**Secrets (вже налаштовані через wrangler secret put):**
```bash
# Якщо потрібно оновити:
cd backend
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste the service role key from Supabase Dashboard
```

**Environment Variables** (вже в wrangler.toml):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Frontend (Vercel)

**Environment Variables** в Vercel Dashboard:
1. Перейди: https://vercel.com/viktorias-projects-0cf93b9b/conglomerate/settings/environment-variables
2. Додай/оновити:
   - `NEXT_PUBLIC_API_URL` = `https://api.conglomerate-g.com`

**Після оновлення variables:**
```bash
cd frontend
vercel --prod
```

---

## 3. Domains Summary

| Service | Domain | Status |
|---------|--------|--------|
| Frontend | https://conglomerate-g.com | ✅ Active |
| Frontend | https://www.conglomerate-g.com | ✅ Active |
| Frontend (Vercel) | https://conglomerate-eight.vercel.app | ✅ Active |
| API | https://api.conglomerate-g.com | ⏳ Need to setup |
| API (Workers) | https://conglomerate-api.ravencwr3476.workers.dev | ✅ Active (backup) |

---

## 4. Supabase Configuration

### Project: shqeobfnetdhlnmrosqv
- **URL**: https://shqeobfnetdhlnmrosqv.supabase.co
- **Region**: eu-central-1

### Auth Configuration
1. Перейди: https://supabase.com/dashboard/project/shqeobfnetdhlnmrosqv/auth/url-configuration
2. **Site URL**: `https://conglomerate-g.com`
3. **Redirect URLs** (додай всі):
   - `https://conglomerate-g.com/**`
   - `https://www.conglomerate-g.com/**`
   - `https://conglomerate-eight.vercel.app/**`
   - `http://localhost:3000/**`

---

## 5. Security Checklist

### Backend
- ✅ CORS налаштовано для production domains
- ✅ RLS policies оптимізовані
- ✅ Functions мають SET search_path
- ⏳ Rate limiting (опціонально)

### Frontend
- ✅ Environment variables налаштовані
- ✅ API URL вказує на custom domain
- ✅ Auth redirect URLs налаштовані

### Database
- ✅ Всі Supabase security warnings виправлені
- ✅ Foreign key indexes додані
- ✅ Duplicate policies видалені

---

## 6. Monitoring та Logs

### Cloudflare Worker Logs
```bash
wrangler tail
# Або в Dashboard: Workers & Pages → conglomerate-api → Logs
```

### Vercel Logs
https://vercel.com/viktorias-projects-0cf93b9b/conglomerate/logs

### Supabase Logs
https://supabase.com/dashboard/project/shqeobfnetdhlnmrosqv/logs/explorer

---

## 7. Deployment Commands

### Full Production Deploy
```bash
# Backend
cd backend
wrangler deploy

# Frontend  
cd frontend
vercel --prod --yes
```

### Quick Deploy (після змін)
```bash
# Backend only
cd backend && wrangler deploy

# Frontend only
cd frontend && vercel --prod --yes
```

---

## 8. Rollback (якщо щось пішло не так)

### Backend
```bash
# List deployments
wrangler deployments list

# Rollback to previous
wrangler rollback <deployment-id>
```

### Frontend (Vercel)
1. Перейди: https://vercel.com/viktorias-projects-0cf93b9b/conglomerate/deployments
2. Знайди попередній successful deployment
3. Натисни **...** → **Promote to Production**

---

## 9. Performance Optimization

### Cloudflare (вже активовано)
- ✅ Worker KV (якщо потрібно кешування)
- ✅ R2 (якщо потрібно file storage)
- ✅ Custom domains з SSL

### Vercel (вже активовано)
- ✅ Edge Network
- ✅ Image Optimization
- ✅ ISR (Incremental Static Regeneration)

---

## 10. Cost Monitoring

### Cloudflare Workers
- Free tier: 100,000 requests/day
- Paid: $5/month + $0.50 per million requests
- Dashboard: https://dash.cloudflare.com/workers/overview

### Vercel
- Pro Plan: вже оплачено
- Dashboard: https://vercel.com/viktorias-projects-0cf93b9b/usage

### Supabase
- Free tier з обмеженнями
- Dashboard: https://supabase.com/dashboard/project/shqeobfnetdhlnmrosqv/settings/billing
