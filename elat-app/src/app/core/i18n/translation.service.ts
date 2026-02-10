import { Injectable, signal, computed } from '@angular/core';
import { TOP_LEVEL_TRANSLATIONS } from './translations';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    // State
    currentLang = signal<'EN' | 'FR'>('EN'); // Default to EN

    // Dictionaries
    translations = signal(TOP_LEVEL_TRANSLATIONS);

    // Computed current dictionary
    currentDictionary = computed(() => this.translations()[this.currentLang()]);

    constructor() {
        // Restore from localStorage if available
        const savedLang = localStorage.getItem('elat-lang');
        if (savedLang === 'EN' || savedLang === 'FR') {
            this.currentLang.set(savedLang);
        }
    }

    setLanguage(lang: 'EN' | 'FR') {
        this.currentLang.set(lang);
        localStorage.setItem('elat-lang', lang);
    }

    translate(key: string): string {
        const keys = key.split('.');
        let value: any = this.currentDictionary();

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key; // Return key if not found
            }
        }
        return value as string;
    }
}
