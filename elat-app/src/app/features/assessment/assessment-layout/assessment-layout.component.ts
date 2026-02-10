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
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button (click)="drawer.toggle()" aria-label="Toggle menu">
        <mat-icon>menu</mat-icon>
      </button>
      <img src="/assets/logo-white-transparent.png" alt="Logo" class="toolbar-logo">
      <span>{{ 'APP_NAME' | translate }} - Assessment</span>
      
      <!-- Context Badge (Always Left if active) -->
      <span *ngIf="assessmentService.context()" class="context-badge">
         {{ assessmentService.context()?.base }} ({{ assessmentService.context()?.evaluationMonth }})
      </span>

      <!-- Spacer - Pushes everything else to the Right -->
      <span class="spacer"></span>
      
      <!-- Context-Aware Controls (Right Side) -->
      <ng-container *ngIf="assessmentService.context()">
          
          <!-- LOGGING INFO (Submit/Validate) -->
          <div class="log-info" *ngIf="assessmentService.status() !== 'DRAFT'">
              <div *ngIf="assessmentService.submittedBy() as subBy" class="log-line">
                  <mat-icon>send</mat-icon> Submitted by {{ subBy }} on {{ assessmentService.submittedAt() | date:'short' }}
              </div>
              <div *ngIf="assessmentService.validatedBy() as valBy" class="log-line validated">
                  <mat-icon>verified</mat-icon> Validated by {{ valBy }} on {{ assessmentService.validatedAt() | date:'short' }}
              </div>
          </div>

          <button mat-icon-button (click)="exportCSV()" matTooltip="Export to CSV (PowerBI)" color="accent">
            <mat-icon>file_download</mat-icon>
          </button>

          <button mat-icon-button (click)="resetAssessment()" matTooltip="Reset All Answers" color="warn">
            <mat-icon>restart_alt</mat-icon>
          </button>

          <div class="metrics">
              <div class="metric-item">
                <span class="label">Progression</span>
                <span class="value">{{ globalProgress() }}%</span>
              </div>
              <div class="metric-item">
                <span class="label">{{ 'COMMON.SCORE' | translate }}</span>
                <span class="value ignore-low-score">{{ globalScore() }}%</span>
              </div>
          </div>
          
          <!-- Lifecycle Actions -->
          <div class="lifecycle-actions">
              <!-- SUBMIT (Visible to All if Draft) -->
              <button mat-raised-button color="primary" 
                      *ngIf="assessmentService.status() === 'DRAFT'"
                      (click)="submit()"
                      [matTooltip]="'COMMON.SUBMIT' | translate">
                  <mat-icon>send</mat-icon> {{ 'COMMON.SUBMIT' | translate }}
              </button>

              <!-- VALIDATE (Coordinators only if Submitted) -->
              <button mat-raised-button color="accent" 
                      *ngIf="assessmentService.status() === 'SUBMITTED' && canValidate()"
                      (click)="validate()">
                  <mat-icon>check_circle</mat-icon> {{ 'COMMON.VALIDATE' | translate }}
              </button>

              <!-- UNLOCK (Coordinators only if Submitted/Validated) -->
               <button mat-icon-button color="warn" 
                      *ngIf="assessmentService.status() !== 'DRAFT' && canValidate()"
                      (click)="unlock()"
                      matTooltip="Unlock / Revert to Draft">
                  <mat-icon>lock_open</mat-icon>
              </button>
          </div>
      </ng-container>

      <span class="spacer-mini"></span>

      <!-- Language Switcher (Toolbar) -->
      <button mat-button class="lang-btn" [class.active]="translationService.currentLang() === 'EN'" (click)="setLang('EN')">EN</button>
      <span class="lang-divider">|</span>
      <button mat-button class="lang-btn" [class.active]="translationService.currentLang() === 'FR'" (click)="setLang('FR')">FR</button>
      
      <span class="spacer-mini"></span>

      <!-- User Info -->
      <div class="user-info" *ngIf="authService.currentUser() as user">
        <span class="user-name">{{ user.name }}</span>
        <span class="user-role">{{ user.role }}</span>
      </div>

      <button mat-icon-button (click)="logout()" [matTooltip]="'MENU.LOGOUT' | translate">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer mode="side" opened class="sidenav">
        <mat-nav-list>

        <!-- Collapsible Header -->
        <div mat-subheader class="sidebar-header" (click)="showDashboards.set(!showDashboards())">
            <span>Dashboards & Vues</span>
            <mat-icon class="toggle-icon">{{ showDashboards() ? 'expand_less' : 'expand_more' }}</mat-icon>
        </div>

        <!-- Collapsible Content -->
        @if (showDashboards()) {
            <div class="collapsible-menu">
                <a mat-list-item routerLink="/assessment/list" routerLinkActive="active-link">
                    <mat-icon matListItemIcon>history</mat-icon>
                    <span matListItemTitle>{{ 'MENU.MY_ASSESSMENTS' | translate }}</span>
                </a>
                <a mat-list-item routerLink="/matrix" routerLinkActive="active-link">
                    <mat-icon matListItemIcon>dashboard</mat-icon>
                    <span matListItemTitle>{{ 'MENU.MATRIX_DASHBOARD' | translate }}</span>
                </a>
                <a mat-list-item routerLink="/action-plan" routerLinkActive="active-link">
                    <mat-icon matListItemIcon>event_note</mat-icon>
                    <span matListItemTitle>{{ 'MENU.ACTION_PLAN' | translate }}</span>
                </a>

                @if (['SUPER_ADMIN', 'POOL_COORDINATOR', 'COUNTRY_COORDINATOR'].includes(authService.currentUser()?.role || '')) {
                  <a mat-list-item routerLink="/coordination" routerLinkActive="active-link">
                      <mat-icon matListItemIcon>public</mat-icon>
                      <span matListItemTitle>{{ 'MENU.COORDINATION' | translate }}</span>
                  </a>
                }

                @if (authService.currentUser()?.role === 'SUPER_ADMIN') {
                  <a mat-list-item routerLink="/assessment/admin/users" routerLinkActive="active-link">
                      <mat-icon matListItemIcon>people</mat-icon>
                      <span matListItemTitle>{{ 'MENU.USERS' | translate }}</span>
                  </a>
                  <a mat-list-item routerLink="/assessment/admin/config" routerLinkActive="active-link">
                      <mat-icon matListItemIcon>settings</mat-icon>
                      <span matListItemTitle>{{ 'MENU.CONFIG' | translate }}</span>
                  </a>
                  <a mat-list-item routerLink="/admin/docs" routerLinkActive="active-link">
                      <mat-icon matListItemIcon>menu_book</mat-icon>
                      <span matListItemTitle>Admin Guide</span>
                  </a>
                }
            </div>
        }

          <h3 matSubheader>Sections</h3>
          @for (section of sections(); track section.id) {
             <a mat-list-item 
                [routerLink]="['/assessment', section.id]" 
                routerLinkActive="active-link"
                class="section-item"
                [style.border-left-color]="getCategoryColor(section.title)">
               <span matListItemTitle class="section-title">{{ section | localize:'title' }}</span>
               <div matListItemLine class="section-meta">
                   <span>{{ section.questions.length }} Q</span>
                   <span class="section-progress" 
                         [class.complete]="getSectionProgress(section.id) === 100">
                     {{ getSectionProgress(section.id) }}%
                   </span>
               </div>
             </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content class="content">
        <router-outlet></router-outlet>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .toolbar-logo {
      height: 40px;
      margin-right: 15px;
      border-radius: 4px;
    }
    .sidenav-container {
      height: calc(100vh - 64px);
      background-color: #f8f9fa; /* Lighter background for the container */
    }
    .sidenav {
      width: 320px; /* Widened from 250px */
      border-right: 1px solid rgba(0,0,0,0.08);
      background: white;
      box-shadow: 2px 0 5px rgba(0,0,0,0.03);
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15); /* Slightly deeper shadow */
    }
    .spacer {
      flex: 1 1 auto;
    }
    
    /* Navigation List Items */
    .mat-nav-list .mat-list-item {
        height: auto; /* Allow height to adjust for content */
        min-height: 48px;
        margin-bottom: 2px;
    }

    .active-link {
      background: rgba(63, 81, 181, 0.08); /* Softer active background */
      color: #3f51b5; /* Primary color for active text */
      font-weight: 500;
      border-right: 4px solid #3f51b5;
    }

    /* Collapsible Styles */
    .sidebar-header {
        display: flex; justify-content: space-between; align-items: center;
        cursor: pointer;
        padding: 16px 16px; /* More padding */
        font-weight: 600; 
        color: #444;
        font-size: 0.95rem;
        background: #fdfdfd;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.2s;
    }
    .sidebar-header:hover { background: #f5f5f5; color: #222; }
    .toggle-icon { font-size: 20px; height: 20px; width: 20px; opacity: 0.6; }
    .collapsible-menu { 
        background: #fafafa; 
        border-bottom: 1px solid #eee; 
        padding-top: 4px;
        padding-bottom: 4px;
    }

    /* Section Subheader */
    h3[matSubheader] {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #888;
        letter-spacing: 0.5px;
        margin-top: 16px;
        padding-left: 16px;
    }

    /* Section Item with Dynamic Color Border */
    .section-item {
      border-left: 5px solid transparent; /* Placeholder for dynamic color */
      transition: all 0.2s ease;
      position: relative;
    }
    .section-item:hover {
      background: rgba(0,0,0,0.03);
    }
    .section-item.active-link {
      border-right: none; /* remove right border for sections */
      background: rgba(0,0,0,0.06);
    }
    
    /* Section Title - Neutral Color */
    .section-title {
        color: #333; /* Neutral color instead of category color */
        font-size: 0.95rem;
        line-height: 1.4;
        display: block;
        padding-top: 8px;
        padding-bottom: 2px;
    }
    
    .section-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 2px;
        margin-bottom: 8px; /* Give it some breathing room */
        font-size: 0.8rem;
        color: #888; /* Lighter text for meta info */
    }
    .section-progress {
        font-weight: 600;
        color: #f57c00; // Orange for ongoing
        padding: 1px 6px;
        border-radius: 4px;
        background: rgba(245, 124, 0, 0.1);
    }
    .section-progress.complete {
        color: #2e7d32; // Darker green
        background: rgba(76, 175, 80, 0.1);
    }

    .metrics {
        display: flex;
        gap: 20px; /* More spacing */
        margin-right: 15px;
        padding-right: 15px;
        border-right: 1px solid rgba(255,255,255,0.2);
    }
    .metric-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.1;
    }
    .metric-item .label {
        font-size: 0.7rem; /* Slightly larger */
        text-transform: uppercase;
        opacity: 0.8;
        letter-spacing: 0.5px;
    }
    .metric-item .value {
        font-weight: 700;
        font-size: 1.2rem;
    }
    .context-badge {
        font-size: 0.85rem;
        background: rgba(255,255,255,0.15);
        padding: 5px 12px;
        border-radius: 20px; /* Rounder badge */
        margin-left: 15px;
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    /* ... (rest of the styles essentially same, just ensuring consistency) ... */
    
    .status-badge {
        padding: 4px 12px;
        border-radius: 16px;
        font-weight: bold;
        font-size: 0.8rem;
        text-transform: uppercase;
        margin-right: 16px;
        border: 1px solid rgba(255,255,255,0.3);
    }
    .status-badge.draft { background: rgba(255,255,255,0.1); color: #ddd; }
    .status-badge.submitted { background: #ff9800; color: white; border-color: #ff9800; }
    .status-badge.validated { background: #4caf50; color: white; border-color: #4caf50; }
    
    .lifecycle-actions { display: flex; gap: 8px; margin-right: 16px; }
    .spacer-mini { width: 10px; }
    
    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-right: 15px; /* More margin */
      line-height: 1.2;
    }
    .user-name { font-weight: 600; font-size: 0.9rem; }
    .user-role { font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Logging Info */
    .log-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-right: 25px; /* More margin */
        font-size: 0.75rem;
        opacity: 0.9;
        text-align: right;
    }
    .log-line {
        display: flex;
        align-items: center;
        justify-content: flex-end; /* Right align */
        gap: 6px;
    }
    .log-line mat-icon { font-size: 14px; height: 14px; width: 14px; }
    .log-line.validated { color: #ccff90; }

    .lang-btn {
        min-width: 0;
        padding: 0 10px;
        color: rgba(255,255,255,0.7);
        font-weight: normal;
        border-radius: 14px;
    }
    .lang-btn.active {
        color: #3f51b5;
        background: white;
        font-weight: bold;
    }
    .lang-divider { color: rgba(255,255,255,0.3); margin: 0 5px; }
  `]
})
export class AssessmentLayoutComponent {
  assessmentService = inject(AssessmentService);
  authService = inject(AuthService);
  translationService = inject(TranslationService);
  sections = this.assessmentService.sections;

  // UI State
  showDashboards = signal(false); // Collapsed by default

  setLang(lang: 'EN' | 'FR') {
    this.translationService.setLanguage(lang);
  }

  getCategoryColor(category: string): string {
    return getCategoryColor(category);
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
