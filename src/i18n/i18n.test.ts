import { describe, expect, it } from 'vitest';
import en from './en.json';
import id from './id.json';
import ms from './ms.json';
import ta from './ta.json';
import zh from './zh.json';

describe('translations', () => {
  it.each([['en', en], ['zh', zh], ['ta', ta], ['id', id]])('%s has every Malay source key', (_, translation) => {
    expect(Object.keys(translation).sort()).toEqual(Object.keys(ms).sort());
  });
});
