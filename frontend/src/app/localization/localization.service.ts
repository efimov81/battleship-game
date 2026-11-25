import { computed, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import { type Language, messages } from './messages';

const STORAGE_KEY = 'battleship.language';

@Injectable({ providedIn: 'root' })
export class LocalizationService {
  private readonly document = inject(DOCUMENT);
  private readonly selectedLanguage = signal<Language>(this.readLanguage());

  readonly language = this.selectedLanguage.asReadonly();
  readonly messages = computed(() => messages[this.language()]);
  private readonly percentFormat = computed(() => new Intl.NumberFormat(this.language(), { style: 'percent' }));

  constructor() {
    this.updateDocument();
  }

  setLanguage(language: Language): void {
    this.selectedLanguage.set(language);
    this.updateDocument();

    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Switching still works when browser storage is unavailable.
    }
  }

  percent(value: number): string {
    return this.percentFormat().format(value);
  }

  private readLanguage(): Language {
    try {
      return this.document.defaultView?.localStorage.getItem(STORAGE_KEY) === 'ru' ? 'ru' : 'en';
    } catch {
      return 'en';
    }
  }

  private updateDocument(): void {
    this.document.documentElement.lang = this.language();
    this.document.title = this.messages().title;
  }
}
