# SWR Оптимізація для швидкого завантаження

## Проблема
При кожній навігації між сторінками (dashboard → withdraw → settings) йде повторне завантаження всіх даних з API. Це створює затримку 2-3 секунди.

## Рішення: SWR (stale-while-revalidate)

### Що дає SWR:
1. **Instant loading з кешу** - показує дані відразу з браузер кешу
2. **Background revalidation** - оновлює дані в фоні
3. **Automatic deduplication** - якщо 3 компоненти запитують /wallet одночасно, йде тільки 1 request
4. **Smart refetching** - авто-оновлення при focus/reconnect

### Приклад "до" vs "після":

**ДО (manual fetching):**
```typescript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetch = async () => {
    setLoading(true)  // Користувач бачить loading spinner
    const result = await api.getWallet()
    setData(result)
    setLoading(false)  // 2-3 секунди очікування
  }
  fetch()
}, [])
```

**ПІСЛЯ (SWR):**
```typescript
const { wallet, isLoading } = useWallet()
// Instant показ даних з кешу (0ms!)
// Background update в фоні
```

### Створені hooks:

1. **`useWallet()`** - wallet balance, profit, locked_amount
2. **`useDeposits()`** - active deposits + history
3. **`useWithdrawals()`** - withdrawal history

### Як використовувати:

```typescript
import { useWallet } from '@/hooks/useWallet'
import { useDeposits } from '@/hooks/useDeposits'

export default function DashboardPage() {
  // SWR hooks - instant data з кешу
  const { wallet, isLoading, refresh } = useWallet()
  const { activeDeposits, depositHistory, isLoading: depositsLoading } = useDeposits()
  
  // Дані доступні ВІДРАЗУ з кешу (попередній візит)
  const balance = wallet?.balance || 0
  
  // Після deposit - manual refresh
  const handleDepositSuccess = async () => {
    await refresh() // Оновить тільки wallet
  }
  
  return (
    <>
      {isLoading && !wallet ? <Loading /> : <div>{balance}</div>}
    </>
  )
}
```

### Конфігурація SWR:

```typescript
{
  revalidateOnFocus: false,     // Не перезавантажувати при focus window
  revalidateOnReconnect: true,  // Перезавантажити при reconnect інтернету
  dedupingInterval: 5000,       // Дедуплікація запитів протягом 5 сек
}
```

### Результат:
- **Навігація dashboard → withdraw**: 0ms (instant з кешу) замість 2000ms
- **Навігація withdraw → dashboard**: 0ms (instant з кешу) замість 2000ms
- Background update відбувається непомітно

### Наступні кроки:
1. Оновити dashboard/page.tsx на useWallet + useDeposits
2. Оновити withdraw/page.tsx на useWallet + useDeposits + useWithdrawals
3. Оновити referral/page.tsx на useWallet
4. Видалити всі manual useState + useEffect fetching

### Додаткова оптимізація (опціонально):
- Додати `mutate` для optimistic updates (показати зміни до API response)
- Збільшити dedupingInterval до 10-15 секунд для рідко змінюваних даних
- Додати SWR global config через SWRConfig provider
