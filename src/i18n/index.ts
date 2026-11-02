import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import id from './id.json';
import ms from './ms.json';
import ta from './ta.json';
import zh from './zh.json';

export const languages = ['ms', 'en', 'zh', 'ta', 'id'] as const;
export type Language = (typeof languages)[number];
export const languageNames: Record<Language, string> = { ms: 'Bahasa Melayu', en: 'English', zh: '中文', ta: 'தமிழ்', id: 'Bahasa Indonesia' };
const resources = { ms: { translation: ms }, en: { translation: en }, zh: { translation: zh }, ta: { translation: ta }, id: { translation: id } };
const detected = getLocales()[0]?.languageCode as Language | undefined;

// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({ resources, lng: languages.includes(detected as Language) ? detected : 'ms', fallbackLng: 'ms', interpolation: { escapeValue: false } });

export async function restoreLanguage() {
  const saved = await AsyncStorage.getItem('kk_language');
  // eslint-disable-next-line import/no-named-as-default-member
  if (languages.includes(saved as Language)) await i18n.changeLanguage(saved as Language);
}

export async function setLanguage(language: Language) {
  // eslint-disable-next-line import/no-named-as-default-member
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem('kk_language', language);
}

export default i18n;
