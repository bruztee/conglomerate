# Conglomerate Group - Frontend

Фронтенд інвестиційної платформи на Next.js 16 з інтеграцією Cloudflare Workers API.

## Архітектура

- **Next.js 16** - React framework з App Router
- **TypeScript** - типізація
- **Tailwind CSS** - стилізація
- **shadcn/ui** - UI компоненти
- **API Client** - інтеграція з Cloudflare Workers backend

## Налаштування

### 1. Встановити залежності

```bash
npm install
```

### 2. Налаштувати environment variables

Файл `.env.local` вже створено:

```bash
NEXT_PUBLIC_API_URL=https://conglomerate-api.ravencwr3476.workers.dev
```

**Важливо**: Frontend комунікує **тільки з backend API**. Supabase credentials потрібні тільки на backend.

### 3. Запустити dev server

```bash
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000)

## Структура

### Pages

- `/` - Landing page
- `/auth/login` - Вхід
- `/auth/register` - Реєстрація  
- `/auth/verify` - Верифікація email
- `/dashboard` - Особистий кабінет
- `/admin` - Адмін панель
- `/referral` - Реферальна програма
- `/withdraw` - Вивід коштів

### API Client

`src/lib/api.ts` - клієнт для взаємодії з backend API:

```typescript
import { api } from '@/lib/api'

// Auth
await api.login(email, password)
await api.register(email, password, referralCode)
await api.logout()

// Wallet
await api.getWallet()
await api.getTransactions()

// Deposits
await api.createDeposit(amount)
await api.getDeposits()

// Withdrawals
await api.createWithdrawal(amount, destination)

// Investments
await api.getInvestmentPlans()
await api.createInvestment(planId, amount)
```

### Auth Context

`src/context/AuthContext.tsx` - глобальний стан аутентифікації:

```typescript
import { useAuth } from '@/context/AuthContext'

const { user, loading, login, register, logout } = useAuth()
```

### Protected Routes

Middleware автоматично перенаправляє:
- Неавторизованих користувачів → `/auth/login`
- Авторизованих на auth pages → `/dashboard`

## Аутентифікація

### Реєстрація

1. Користувач заповнює форму `/auth/register`
2. Backend створює акаунт через Supabase Auth
3. Supabase відправляє email з verification link
4. Користувач підтверджує email
5. Після верифікації можна увійти

### Вхід

1. Користувач вводить email + password
2. Backend перевіряє credentials та email verification
3. Повертає `access_token` і `refresh_token`
4. Frontend зберігає токени в localStorage та cookies
5. Middleware використовує cookie для захисту routes

### Token Refresh

Access tokens живуть 1 годину. При закінченні:

```typescript
await api.refreshToken() // Автоматично оновлює токени
```

## Backend API

**URL**: https://conglomerate-api.ravencwr3476.workers.dev

**Auth Headers**:
```
Authorization: Bearer {access_token}
```

**Endpoints**: Дивіться `/backend/README.md`

## Deployment

```bash
npm run build
npm run start
```

Або через Vercel:

```bash
vercel
```

## Email Verification

Supabase автоматично відправляє verification emails при реєстрації.

**Redirect URL**: Налаштовано в backend на `/auth/verify`

Користувач отримує лист → клікає link → верифікується → може увійти

## Реферальна система

При реєстрації можна вказати реферальний код:

```
/auth/register?ref=ABC123XYZ
```

Код автоматично підставляється в форму реєстрації.
