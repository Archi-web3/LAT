import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false // Impure to detect signal changes automatically without async pipe everywhere
})
export class TranslatePipe implements PipeTransform {
    service = inject(TranslationService);

    transform(key: string): string {
        return this.service.translate(key);
    }
}
