# Test Domain Setup - test.conglomerate-g.com

## 1. Cloudflare DNS налаштування

Додай CNAME запис в Cloudflare DNS:

```
Type: CNAME
Name: test
Target: cname.vercel-dns.com
Proxy status: Proxied (orange cloud)
TTL: Auto
```

## 2. Vercel Domain налаштування

В Vercel project settings → Domains:

1. Add domain: `test.conglomerate-g.com`
2. Vercel дасть інструкції для verification
3. Після verification, призначити domain на `dev` branch

## 3. Backend CORS

✅ Вже додано `test.conglomerate-g.com` в CORS allowedOrigins

## 4. Frontend ENV

✅ Створено `.env.development` з `NEXT_PUBLIC_API_URL=https://api.conglomerate-g.com`

## 5. Deploy

```bash
# Backend (якщо треба redeploy)
cd backend
npm run deploy

# Frontend - Vercel автоматично deploy на test.conglomerate-g.com коли push в dev branch
git push origin dev
```

## 6. Testing

Після налаштування DNS та Vercel:
- Frontend: https://test.conglomerate-g.com
- Backend: https://api.conglomerate-g.com (той самий що production)
- Cookies працюватимуть через Domain=.conglomerate-g.com

## Notes

- test.conglomerate-g.com використовує той самий backend що і production
- Але frontend deploy з dev branch
- Можна тестувати нові фічі без впливу на production users
