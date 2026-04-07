import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AssessmentService } from '../../../services/assessment.service';
import { QuestionCardComponent } from '../question-card/question-card.component';
import { LocalizePipe } from '../../../core/i18n/localize.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-section-view',
  standalone: true,
  imports: [CommonModule, QuestionCardComponent, LocalizePipe, MatButtonModule, MatIconModule, RouterModule],
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

      <div class="navigation-actions">
        <button mat-stroked-button color="primary" (click)="goToPrevious()" [disabled]="!hasPrevious()">
          <mat-icon>chevron_left</mat-icon>
          Previous Section
        </button>
        <span class="spacer"></span>
        <button mat-raised-button color="primary" (click)="goToNext()" *ngIf="hasNext(); else finishBtn">
          Next Section
          <mat-icon>chevron_right</mat-icon>
        </button>
        <ng-template #finishBtn>
          <button mat-raised-button color="accent" routerLink="/assessment/list">
            <mat-icon>check_circle</mat-icon>
            Finish & Return to Menu
          </button>
        </ng-template>
      </div>
    </div>
    <div *ngIf="!currentSection()" class="loading">
      <p>Loading section...</p>
    </div>
  `,
  styles: [`
    .section-container {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
      padding-bottom: 40px;
    }
    h2 {
      margin-bottom: 24px;
      color: #333;
      border-bottom: 2px solid #eee;
      padding-bottom: 12px;
      font-size: 1.4rem;
    }
    .navigation-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      gap: 12px;
    }
    .spacer { flex: 1; }

    @media (max-width: 600px) {
      .section-container { padding: 12px; }
      h2 { font-size: 1.2rem; margin-bottom: 16px; }
      .navigation-actions {
        flex-direction: column-reverse;
        align-items: stretch;
      }
      .navigation-actions button { width: 100%; margin-bottom: 8px; }
    }
  `],
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

  private sections = this.assessmentService.sections;

  private currentIndex = computed(() => {
    const sections = this.sections();
    const id = this.currentSectionId();
    return sections.findIndex(s => s.id === id);
  });

  private router = inject(Router);

  hasPrevious() { return this.currentIndex() > 0; }
  hasNext() { return this.currentIndex() < this.sections().length - 1; }

  goToPrevious() {
    const sections = this.sections();
    const prev = sections[this.currentIndex() - 1];
    if (prev) {
      this.router.navigate(['/assessment', prev.id]);
      window.scrollTo(0, 0);
    }
  }

  goToNext() {
    const sections = this.sections();
    const next = sections[this.currentIndex() + 1];
    if (next) {
      this.router.navigate(['/assessment', next.id]);
      window.scrollTo(0, 0);
    }
  }
}
