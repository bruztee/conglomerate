# Deployment Guide

Інструкція з розгортання Conglomerate Investment Platform.

## Backend (Cloudflare Workers)

### ✅ Вже задеплоєно

**URL**: https://conglomerate-api.ravencwr3476.workers.dev

### Secrets

Встановлено через Wrangler:

```bash
cd backend
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

**Service Role Key**: Отримати з [Supabase Dashboard](https://supabase.com/dashboard/project/shqeobfnetdhlnmrosqv/settings/api)

### Повторний Deploy

```bash
cd backend
npm run deploy
```

### Перевірка

```bash
curl https://conglomerate-api.ravencwr3476.workers.dev/api/investment-plans
```

## Frontend (Next.js)

### Environment Variables

Створено `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://conglomerate-api.ravencwr3476.workers.dev
NEXT_PUBLIC_SUPABASE_URL=https://shqeobfnetdhlnmrosqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Deploy на Vercel

1. Підключити Git репозиторій до Vercel
2. Налаштувати Environment Variables (з `.env.local`)
3. Deploy автоматично

**Або через CLI:**

```bash
cd frontend
vercel
```

### Build локально

```bash
cd frontend
npm run build
npm run start
```

## Database (Supabase)

### ✅ Вже налаштовано

**Project ID**: shqeobfnetdhlnmrosqv  
**Region**: eu-central-1  
**URL**: https://shqeobfnetdhlnmrosqv.supabase.co

### Міграції

Всі міграції застосовано через MCP:

- ✅ 001_initial_schema - таблиці БД
- ✅ 002_rls_policies - RLS політики
- ✅ 003_interest_accrual_function - функції начисления процентів
- ✅ Investment plans seeded

### Cron Jobs

Налаштувати в Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'accrue-interest',
  '0 * * * *', -- Кожну годину
  $$SELECT * FROM accrue_interest()$$
);
```

### Email Templates

Налаштувати в Dashboard → Authentication → Email Templates:

**Confirm signup**:
```
Redirect URL: https://your-domain.com/auth/verify
```

## Перевірка Deployment

### 1. Backend API

```bash
# Health check
curl https://conglomerate-api.ravencwr3476.workers.dev/api/investment-plans

# Має повернути список планів
```

### 2. Frontend

Відкрити: https://your-vercel-domain.vercel.app

- ✅ Landing page завантажується
- ✅ Реєстрація працює
- ✅ Email verification працює
- ✅ Вхід після verification

### 3. Database

```bash
# Через Supabase Dashboard
# Settings → Database → Connection info
```

## Custom Domain

### Backend

Налаштувати через Cloudflare Workers:

```bash
wrangler domains add conglomerate-api.your-domain.com
```

### Frontend

Налаштувати через Vercel Dashboard → Settings → Domains

## Monitoring

### Backend Logs

```bash
wrangler tail
```

### Database Logs

Supabase Dashboard → Logs

### Frontend Logs

Vercel Dashboard → Logs

## Troubleshooting

### Backend 500 Error

1. Перевірити secrets: `wrangler secret list`
2. Перевірити `.dev.vars` для локального dev
3. Перевірити Supabase service_role key

### Email Verification не працює

1. Перевірити Supabase → Authentication → Email Templates
2. Перевірити Redirect URL
3. Перевірити SMTP налаштування

### CORS Issues

Backend вже налаштовано на CORS для всіх доменів. Якщо потрібно обмежити:

`backend/src/utils/response.ts` → `corsHeaders()`

## Production Checklist

- [x] Backend задеплоєно на Cloudflare Workers
- [x] Secrets встановлено
- [x] Database schema застосовано
- [x] RLS policies активовано
- [x] Investment plans створено
- [x] Email verification налаштовано
- [ ] Frontend задеплоєно на Vercel
- [ ] Custom domain налаштовано
- [ ] Cron jobs активовано
- [ ] Monitoring налаштовано
- [ ] SSL certificates активовано

## Security Notes

- ✅ RLS enabled на всіх таблицях
- ✅ JWT tokens для auth
- ✅ Service role key тільки в backend
- ✅ Email verification обов'язкова
- ✅ Audit log для admin операцій
- ✅ HttpOnly cookies (планується для production)

## Backup

### Database

Supabase автоматично робить щоденні backups.

Manual backup:
```bash
# Через Supabase CLI
supabase db dump -f backup.sql
```

### Code

Git repository - головний source of truth.

Tags для releases:
```bash
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```
