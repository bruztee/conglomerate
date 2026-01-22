# Localization Implementation Guide

## Overview
The application now supports Ukrainian (uk), Russian (ru), and English (en) languages using next-intl.

## How it works

### Language Switcher
Small language buttons are located in the footer:
- УКР (Ukrainian)
- РУС (Russian)
- ENG (English)

The selected language is highlighted with a silver background.

### Automatic Language Detection
On first visit, the application automatically detects the browser language:
- If browser is set to Russian → defaults to Russian
- If browser is set to English → defaults to English
- Otherwise → defaults to Ukrainian

The selected language is stored in a cookie and persists across sessions.

### Using Translations in Components

```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('namespace');
  
  return <div>{t('key')}</div>;
}
```

### Translation Files
Located in `/messages/`:
- `uk.json` - Ukrainian translations
- `ru.json` - Russian translations
- `en.json` - English translations

### Admin Pages
Admin pages (CRM) are NOT translated and remain in Ukrainian only, as requested.

### Completed Translations
- ✅ Footer with language switcher
- ✅ Header (navigation, buttons)
- ✅ Home page (all sections)
- ✅ Login page
- ✅ Register page
- 🔄 Dashboard page (in progress)
- 🔄 Withdraw page (pending)
- 🔄 Referral page (pending)
- 🔄 DepositFlow component (pending)
- 🔄 PhoneVerificationPopup (pending)

### Language Change Behavior
When user changes language, the page automatically reloads to apply the new language across all content.
