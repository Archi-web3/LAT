import { Component, inject, signal, ViewChild } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AssessmentService } from '../../../services/assessment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { getCategoryColor } from '../../../core/constants/category-colors';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';
import { LocalizePipe } from '../../../core/i18n/localize.pipe';
import { PdfService } from '../../../services/pdf.service';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

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
    MatMenuModule,
    TranslatePipe,
    LocalizePipe,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './assessment-layout.component.html',
  styleUrl: './assessment-layout.component.scss'
})
export class AssessmentLayoutComponent {
  assessmentService = inject(AssessmentService);
  authService = inject(AuthService);
  translationService = inject(TranslationService);
  pdfService = inject(PdfService);
  sections = this.assessmentService.sections;

  // Responsive State
  private breakpointObserver = inject(BreakpointObserver);
  isMobile = signal(false);

  // Connection State
  private connectivityService = inject(ConnectivityService);
  isOnline = this.connectivityService.isOnline;
  private snackBar = inject(MatSnackBar);

  // UI State
  showDashboards = signal(false);

  constructor() {
    this.breakpointObserver.observe(['(max-width: 960px)']) // Tablet/Mobile breakpoint
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
  }

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

  exportExcel() {
    this.assessmentService.exportToExcel();
  }

  exportPDF() {
    const state = {
      context: this.assessmentService.context(),
      answers: this.assessmentService.answers(),
      comments: this.assessmentService.comments(),
      proofLinks: this.assessmentService.proofLinks(),
      proofPhotos: this.assessmentService.proofPhotos(),
      status: this.assessmentService.status(),
      score: this.assessmentService.getGlobalScore(),
      submittedBy: this.assessmentService.submittedBy(),
      submittedAt: this.assessmentService.submittedAt(),
      validatedBy: this.assessmentService.validatedBy(),
      validatedAt: this.assessmentService.validatedAt(),
      createdAt: '',
      updatedAt: ''
    };

    if (!state.context) return;

    // @ts-ignore
    this.pdfService.generateAssessmentReport(state, this.sections(), []);
  }

  manualSync() {
    this.assessmentService.sync();
    // Watch for sync completion to show snackbar
    const sub = this.assessmentService.isSyncing();
    // We can't easily wait for the signal to change back to false in a simple way here without effect or subscriber,
    // but we can check the result in the service or just show a generic message.
    // Let's assume we want a quick feedback.
    this.snackBar.open('Synchronisation en cours...', '', { duration: 2000 });
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

  @ViewChild('drawer') drawer!: any;

  closeOnMobile() {
    if (this.isMobile()) {
      this.drawer.close();
    }
  }

  canValidate(): boolean {
    const role = this.authService.currentUser()?.role;
    return ['SUPER_ADMIN', 'POOL_COORDINATOR', 'COUNTRY_COORDINATOR'].includes(role || '');
  }
}
