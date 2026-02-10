import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

@Pipe({
    name: 'localize',
    standalone: true,
    pure: false // Impure to track language changes
})
export class LocalizePipe implements PipeTransform {
    service = inject(TranslationService);

    transform(obj: any, field: string): string {
        if (!obj) return '';

        const lang = this.service.currentLang();

        // If English, try to find field_en
        if (lang === 'EN') {
            const enField = `${field}_en`;
            if (obj[enField]) return obj[enField];
        }

        // Default to base field (EN or whatever is default)
        return obj[field] || '';
    }
}
