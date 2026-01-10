# Conglomerate Investment Platform API

Backend API для інвестиційної платформи на Cloudflare Workers + Supabase.

## Архітектура

- **Cloudflare Workers** - serverless API
- **Supabase** - Postgres database + Auth
- **JWT Authentication** - стандартний Supabase Auth flow
- **RLS** - Row Level Security для захисту даних

## Налаштування

### 1. Встановити залежності

```bash
npm install
```

### 2. Налаштувати секрети

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

**SUPABASE_SERVICE_ROLE_KEY** - отримати з Supabase Dashboard (Settings > API > service_role key)

**Важливо**: Не використовуйте `service_role` key у клієнтському коді - він обходить RLS!

### 3. Запустити локально

```bash
npm run dev
```

### 4. Деплой

```bash
npm run deploy
```

## API Endpoints

### Auth
- `POST /api/auth/register` - реєстрація (повертає session з access_token та refresh_token)
- `POST /api/auth/login` - вхід (повертає session)
- `POST /api/auth/logout` - вихід (потрібен JWT в Authorization header)
- `POST /api/auth/refresh` - оновлення токена (body: { refresh_token })
- `GET /api/auth/me` - інфо про користувача (потрібен JWT)

### Wallet
- `GET /api/wallet` - баланс та статистика
- `GET /api/transactions` - історія транзакцій

### Deposits
- `POST /api/deposits` - створити заявку на депозит (потрібен JWT)
- `GET /api/deposits` - список депозитів (потрібен JWT)
- `POST /api/deposits/:id/confirm` - підтвердити депозит (admin, потрібен JWT)

### Withdrawals
- `POST /api/withdrawals` - створити заявку на вивід (потрібен JWT)
- `GET /api/withdrawals` - список виводів (потрібен JWT)
- `POST /api/withdrawals/:id/approve` - схвалити вивід (admin, потрібен JWT)

### Investments
- `GET /api/investment-plans` - список інвест-планів (публічний)
- `POST /api/investments` - створити інвестицію (потрібен JWT)
- `GET /api/investments` - мої інвестиції (потрібен JWT)

## Authentication Flow

### 1. Реєстрація/Вхід
```bash
curl -X POST https://your-api.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Відповідь:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "v1.MR5m...",
      "expires_in": 3600
    }
  }
}
```

### 2. Використання JWT
Всі protected endpoints вимагають JWT токен в заголовку:
```bash
curl https://your-api.workers.dev/api/wallet \
  -H "Authorization: Bearer eyJhbGc..."
```

### 3. Оновлення токена
Коли `access_token` закінчується (через 1 годину):
```bash
curl -X POST https://your-api.workers.dev/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"v1.MR5m..."}'
```

## Безпека

### JWT Authentication
- Access tokens живуть 1 годину
- Refresh tokens живуть 7 днів
- JWT токени підписані Supabase (ES256 algorithm)
- Автоматична ротація через refresh endpoint

### RLS Policies
- Користувачі бачать тільки свої дані
- Адміни мають доступ до всього
- Service role обходить RLS для системних операцій

## Database Schema

### Основні таблиці
- `profiles` - профілі користувачів
- `accounts` - рахунки
- `ledger_entries` - журнал проводок (append-only)
- `deposits` - заявки на депозит
- `withdrawals` - заявки на вивід
- `user_investments` - активні інвестиції
- `investment_plans` - плани нарахування відсотків
- `audit_log` - аудит всіх дій

### Ключові функції
- `accrue_interest()` - нарахування відсотків
- `get_account_balance(uuid)` - баланс рахунку
- `get_investment_stats(uuid)` - статистика інвестицій
- `apply_referral_bonus()` - реферальний бонус

## Cron Jobs

Для автоматичного нарахування відсотків використовуйте Supabase Cron:

```sql
SELECT cron.schedule(
  'accrue-interest',
  '0 * * * *', -- кожну годину
  $$SELECT * FROM accrue_interest()$$
);
```

## Supabase Project

- **Project ID**: shqeobfnetdhlnmrosqv
- **URL**: https://shqeobfnetdhlnmrosqv.supabase.co
- **Region**: eu-central-1

## Development

TypeScript помилки при розробці - це нормально до встановлення node_modules.

```bash
npm install
npm run dev
```

## Deployment

1. Встановити Wrangler CLI
2. Залогінитись: `wrangler login`
3. Встановити секрети (див. вище)
4. Деплой: `npm run deploy`
