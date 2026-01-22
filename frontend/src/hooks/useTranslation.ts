"use client"

import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslation(namespace?: string) {
  return useNextIntlTranslations(namespace);
}

export { useTranslations } from 'next-intl';
