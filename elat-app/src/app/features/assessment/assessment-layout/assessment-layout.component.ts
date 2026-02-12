import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssessmentService } from '../../../services/assessment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { getCategoryColor } from '../../../core/constants/category-colors';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';
import { LocalizePipe } from '../../../core/i18n/localize.pipe';

@Component({
  selector: 'app-assessment-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslatePipe,
    LocalizePipe
  ],
  templateUrl: './assessment-layout.component.html',
  styleUrl: './assessment-layout.component.scss'
})
export class AssessmentLayoutComponent {
  assessmentService = inject(AssessmentService);
  authService = inject(AuthService);
  translationService = inject(TranslationService);
  sections = this.assessmentService.sections;

  // UI State
  showDashboards = signal(false); // Collapsed by default

  setLang(lang: 'EN' | 'FR') {
    console.log('Switching language to', lang);
    this.translationService.setLanguage(lang);
  }

  getCategoryColor(category: string): string {
    return getCategoryColor(category);
  }

  // Debug getter
  get sectionsCount() {
    const count = this.sections().length;
    console.log('SideNav sections count:', count);
    return count;
  }

  globalProgress() {
    return this.assessmentService.getGlobalProgress();
  }

  globalScore() {
    return this.assessmentService.getGlobalScore();
  }

  getSectionProgress(id: string) {
    return this.assessmentService.getSectionProgress(id);
  }

  logout() {
    this.authService.logout();
  }

  resetAssessment() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les réponses à N/A ? Cette action est irréversible.')) {
      this.assessmentService.resetAnswers();
    }
  }

  exportCSV() {
    this.assessmentService.exportToCSV();
  }

  // --- Lifecycle Methods ---

  submit() {
    this.assessmentService.submitAssessment();
  }

  validate() {
    this.assessmentService.validateAssessment();
  }

  unlock() {
    this.assessmentService.unlockAssessment();
  }

  canValidate(): boolean {
    const role = this.authService.currentUser()?.role;
    return ['SUPER_ADMIN', 'POOL_COORDINATOR', 'COUNTRY_COORDINATOR'].includes(role || '');
  }
}
