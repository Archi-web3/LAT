import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AssessmentService } from '../../../services/assessment.service';
import { QuestionCardComponent } from '../question-card/question-card.component';
import { LocalizePipe } from '../../../core/i18n/localize.pipe';

@Component({
  selector: 'app-section-view',
  standalone: true,
  imports: [CommonModule, QuestionCardComponent, LocalizePipe],
  template: `
    <div class="section-container" *ngIf="currentSection(); let section">
      <h2>{{ section | localize:'title' }}</h2>
      
      <div class="questions-list">
        @for (question of section.questions; track question.id) {
          <app-question-card 
            [question]="question">
          </app-question-card>
        }
      </div>
    </div>
    <div *ngIf="!currentSection()" class="loading">
      <p>Loading section...</p>
    </div>
  `,
  styles: [`
    .section-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    h2 {
      margin-bottom: 24px;
      color: #333;
      border-bottom: 2px solid #eee;
      padding-bottom: 12px;
    }
  `]
})
export class SectionViewComponent {
  private route = inject(ActivatedRoute);
  private assessmentService = inject(AssessmentService);

  private routeParams = toSignal(this.route.paramMap); // Signal for route params

  currentSectionId = computed(() => this.routeParams()?.get('sectionId'));

  currentSection = computed(() => {
    const id = this.currentSectionId();
    if (!id) return null;
    return this.assessmentService.sections().find(s => s.id === id);
  });
}
