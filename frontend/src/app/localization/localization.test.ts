import { DOCUMENT, Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { LocalizationService } from './localization.service';
import { botLabel, errorMessageKey, messages } from './messages';

function page(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const document = { title: '', documentElement: { lang: '' }, defaultView: { localStorage: storage } };
  const injector = Injector.create({ providers: [{ provide: DOCUMENT, useValue: document }] });

  return {
    document,
    open: () => runInInjectionContext(injector, () => new LocalizationService()),
  };
}

describe('localization', () => {
  it('has a non-empty translation for every message in both languages', () => {
    expect(Object.keys(messages.ru).sort()).toEqual(Object.keys(messages.en).sort());
    for (const dictionary of Object.values(messages)) {
      for (const text of Object.values(dictionary)) expect(text.trim()).not.toBe('');
    }
  });

  it('defaults to English, updates page metadata, and restores the language on return', () => {
    const stored = new Map<string, string>();
    const browserPage = page({
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => { stored.set(key, value); },
    });
    const locale = browserPage.open();
    expect(browserPage.document.documentElement.lang).toBe('en');
    expect(browserPage.document.title).toBe('Battleship');
    expect(locale.messages().yourTurn).toBe('Your turn');
    expect(locale.percent(0.5)).toBe('50%');

    locale.setLanguage('ru');
    expect(browserPage.document.documentElement.lang).toBe('ru');
    expect(browserPage.document.title).toBe('Морской бой');
    expect(locale.messages().yourTurn).toBe('Ваш ход');
    expect(locale.percent(0.5)).toBe('50\u00a0%');
    expect(browserPage.open().language()).toBe('ru');

    locale.setLanguage('en');
    expect(browserPage.open().language()).toBe('en');
  });

  it('supports switching when access to local storage fails', () => {
    const unavailable = () => { throw new Error('Storage unavailable'); };
    const locale = page({ getItem: unavailable, setItem: unavailable }).open();
    expect(locale.language()).toBe('en');
    locale.setLanguage('ru');
    expect(locale.messages().newGame).toBe('Новая игра');
  });

  it('uses English for an unsupported saved language', () => {
    const locale = page({ getItem: () => 'fr', setItem: () => {} }).open();
    expect(locale.language()).toBe('en');
  });

  it('localizes difficulty IDs and API error codes, with localized fallbacks', () => {
    expect(botLabel(messages.en, 'random')).toBe('Beginner');
    expect(botLabel(messages.ru, 'hard')).toBe('Высокий');
    expect(botLabel(messages.en, 'unknown')).toBe('Unknown difficulty');

    const key = errorMessageKey('REPEAT_SHOT', 'shotFailed');
    expect(messages.en[key]).toBe('This cell has already been targeted.');
    expect(messages.ru[key]).toBe('По этой клетке уже стреляли.');
    expect(errorMessageKey('unknown', 'startFailed')).toBe('startFailed');
    expect(errorMessageKey(undefined, 'createFailed')).toBe('createFailed');
  });
});
