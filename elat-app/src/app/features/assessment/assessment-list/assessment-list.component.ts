import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { AssessmentService } from '../../../services/assessment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Router, RouterModule } from '@angular/router';
import { AssessmentState } from '../../../models/assessment.model';
import { computed } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-assessment-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule, 
    MatTooltipModule, 
    MatTabsModule,
    RouterModule,
    TranslatePipe
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ 'COMMON.ASSESSMENTS_DASHBOARD' | translate }}</h1>
        <div class="header-actions">
            <button mat-raised-button color="primary" routerLink="/assessment/init">
                <mat-icon>add</mat-icon> New Assessment
            </button>
        </div>
      </div>

      <mat-tab-group class="tab-group" animationDuration="0ms">
        
        <!-- Tab 1: MINE -->
        <mat-tab>
            <ng-template mat-tab-label>
                <mat-icon class="tab-icon">person</mat-icon>
                <span>{{ 'MENU.ONGOING_ASSESSMENTS' | translate }} ({{ myAssessments().length }})</span>
            </ng-template>
            <ng-template matTabContent>
                <ng-container *ngTemplateOutlet="assessmentTable; context: { $implicit: myAssessments(), isOwner: true }"></ng-container>
            </ng-template>
        </mat-tab>

        <!-- Tab 2: BASE -->
        <mat-tab *ngIf="user()?.assignedBase">
            <ng-template mat-tab-label>
                <mat-icon class="tab-icon">location_on</mat-icon>
                <span>{{ 'MENU.BASE_ASSESSMENTS' | translate }} ({{ baseAssessments().length }})</span>
            </ng-template>
            <ng-template matTabContent>
                <ng-container *ngTemplateOutlet="assessmentTable; context: { $implicit: baseAssessments(), isOwner: false }"></ng-container>
            </ng-template>
        </mat-tab>

        <!-- Tab 3: COUNTRY (Role protected) -->
        <mat-tab *ngIf="user()?.role !== 'USER' && user()?.assignedCountry">
            <ng-template mat-tab-label>
                <mat-icon class="tab-icon">flag</mat-icon>
                <span>{{ 'MENU.COUNTRY_ASSESSMENTS' | translate }} ({{ countryAssessments().length }})</span>
            </ng-template>
            <ng-template matTabContent>
                <ng-container *ngTemplateOutlet="assessmentTable; context: { $implicit: countryAssessments(), isOwner: false }"></ng-container>
            </ng-template>
        </mat-tab>

        <!-- Tab 4: POOL / GLOBAL (Role protected Catch-all) -->
        <mat-tab *ngIf="user()?.role !== 'USER'">
            <ng-template mat-tab-label>
                <mat-icon class="tab-icon">public</mat-icon>
                <span>{{ 'MENU.GLOBAL_POOL' | translate }} ({{ poolAssessments().length }})</span>
            </ng-template>
            <ng-template matTabContent>
                <ng-container *ngTemplateOutlet="assessmentTable; context: { $implicit: poolAssessments(), isOwner: false }"></ng-container>
            </ng-template>
        </mat-tab>

      </mat-tab-group>

      <!-- Reusable Table Template -->
      <ng-template #assessmentTable let-dataSource let-isOwner="isOwner">
          <div class="table-container mat-elevation-z2">
            <div class="scroll-container">
              <table mat-table [dataSource]="dataSource">
                
                <!-- Sync Status Column -->
                <ng-container matColumnDef="sync">
                  <th mat-header-cell *matHeaderCellDef [matTooltip]="'COMMON.SYNC_STATUS' | translate">
                    <mat-icon>sync</mat-icon>
                  </th>
                  <td mat-cell *matCellDef="let element">
                    <mat-icon *ngIf="element.synced" class="sync-icon synced" matTooltip="Synced with Cloud">cloud_done</mat-icon>
                    <mat-icon *ngIf="!element.synced" class="sync-icon local" matTooltip="Local Draft Only">phonelink_setup</mat-icon>
                  </td>
                </ng-container>

                <!-- Owner Column -->
                <ng-container matColumnDef="owner">
                  <th mat-header-cell *matHeaderCellDef>{{ 'COMMON.AUTHOR' | translate }}</th>
                  <td mat-cell *matCellDef="let element">
                    <div class="owner-cell">
                      <span class="owner-name">{{ element.submittedBy || ('COMMON.USER' | translate) + ' Inconnu' }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Country Column -->
                <ng-container matColumnDef="country">
                  <th mat-header-cell *matHeaderCellDef>{{ 'COMMON.COUNTRY' | translate }}</th>
                  <td mat-cell *matCellDef="let element"> {{element.context?.country}} </td>
                </ng-container>
      
                <!-- Base Column -->
                <ng-container matColumnDef="base">
                  <th mat-header-cell *matHeaderCellDef>{{ 'COMMON.BASE' | translate }}</th>
                  <td mat-cell *matCellDef="let element"> {{element.context?.base}} </td>
                </ng-container>
      
                <!-- Month Column -->
                <ng-container matColumnDef="month">
                  <th mat-header-cell *matHeaderCellDef>{{ 'COMMON.MONTH' | translate }}</th>
                  <td mat-cell *matCellDef="let element"> {{element.context?.evaluationMonth}} </td>
                </ng-container>
      
                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>{{ 'COMMON.STATUS' | translate }}</th>
                  <td mat-cell *matCellDef="let element">
                    <mat-chip [color]="getStatusColor(element.status)" selected [disableRipple]="true">
                      {{element.status}}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Score Column -->
                <ng-container matColumnDef="score">
                  <th mat-header-cell *matHeaderCellDef>{{ 'COMMON.SCORE' | translate }}</th>
                  <td mat-cell *matCellDef="let element">
                    <span class="score-badge" [class]="getScoreClass(element.score)">
                      {{ (element.score | number:'1.0-1') || '0' }}%
                    </span>
                  </td>
                </ng-container>
      
                <!-- Updated At Column -->
                <ng-container matColumnDef="updatedAt">
                  <th mat-header-cell *matHeaderCellDef>{{ 'COMMON.LAST_UPDATE' | translate }}</th>
                  <td mat-cell *matCellDef="let element"> {{element.updatedAt | date:'short'}} </td>
                </ng-container>
      
                <!-- Actions Column -->
                <ng-container matColumnDef="actions" stickyEnd>
                  <th mat-header-cell *matHeaderCellDef>{{ 'COMMON.ACTIONS' | translate }}</th>
                  <td mat-cell *matCellDef="let element">
                      <button mat-icon-button color="accent" (click)="resume(element)" [matTooltip]="isOwner && element.status === 'DRAFT' ? 'Continuer' : 'Voir'">
                          <mat-icon>{{ isOwner && element.status === 'DRAFT' ? 'edit' : 'visibility' }}</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" *ngIf="isOwner && element.status === 'DRAFT'" (click)="deleteDraft(element)" matTooltip="Supprimer">
                          <mat-icon>delete</mat-icon>
                      </button>
                  </td>
                </ng-container>
      
                <tr mat-header-row *matHeaderRowDef="isOwner ? displayedColumns : sharedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: isOwner ? displayedColumns : sharedColumns;"></tr>
              </table>
            </div>

            <div *ngIf="dataSource.length === 0" class="empty-state">
                <mat-icon>folder_open</mat-icon>
                <p>Aucune évaluation trouvée dans cette catégorie.</p>
            </div>
          </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .container { padding: 12px; max-width: 1400px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 0 4px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    h1 { font-size: 1.6rem; font-weight: 600; margin: 0; color: #333; }
    
    .sync-btn { color: #666; transition: all 0.3s ease; }
    .sync-btn.syncing { animation: rotate 1.5s linear infinite; color: #3f51b5; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .tab-group { background: transparent; }
    .tab-icon { margin-right: 8px; font-size: 20px; vertical-align: middle; }

    .table-container { background: white; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; border-top: none; }
    .scroll-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 800px; }
    
    .owner-cell { display: flex; align-items: center; gap: 8px; color: #666; font-size: 0.85rem; }
    .small-icon { font-size: 16px; width: 16px; height: 16px; color: #999; }

    .empty-state { padding: 64px; text-align: center; color: #999; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.3; }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        display: inline-block;
        min-width: 70px;
        text-align: center;
    }
    .status-badge.draft { background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; }
    .status-badge.submitted { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
    .status-badge.validated { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }

    .metric-value { font-weight: bold; color: #555; font-size: 0.9rem; }
    .metric-value.score { color: #3f51b5; }

    .sync-icon { font-size: 18px; width: 18px; height: 18px; vertical-align: middle; }
    .sync-icon.synced { color: #4caf50; }
    .sync-icon.local { color: #ff9800; }

    @media (max-width: 600px) {
      .header { flex-direction: column; gap: 16px; align-items: stretch; }
      .header-actions { justify-content: space-between; }
      .container { padding: 8px; }
      h1 { text-align: center; }
    }
  `]
})
export class AssessmentListComponent implements OnInit {
  assessmentService = inject(AssessmentService);
  authService = inject(AuthService);
  router = inject(Router);

  user = this.authService.currentUser;

  // Columns for both personal and shared views should include Auteur (owner)
  displayedColumns: string[] = ['sync', 'owner', 'country', 'base', 'month', 'status', 'score', 'updatedAt', 'actions'];
  sharedColumns: string[] = ['owner', 'country', 'base', 'month', 'status', 'score', 'updatedAt', 'actions'];

  // Categorized Assessments
  myAssessments = computed(() => {
    const userId = this.user()?.id;
    return this.assessmentService.allAssessments().filter(a => a.userId === userId && a.status === 'DRAFT');
  });

  baseAssessments = computed(() => {
    const userId = this.user()?.id;
    const base = this.user()?.assignedBase;
    
    return this.assessmentService.allAssessments().filter(a => {
        // Own assessments that are NOT drafts go here
        const isMineAndFinal = a.userId === userId && a.status !== 'DRAFT';
        // Assessments by others in my base
        const isOthersInMyBase = a.context?.base === base && a.userId !== userId;

        return isMineAndFinal || isOthersInMyBase;
    });
  });

  countryAssessments = computed(() => {
    const userId = this.user()?.id;
    const base = this.user()?.assignedBase;
    const country = this.user()?.assignedCountry;
    if (!country) return [];

    return this.assessmentService.allAssessments().filter(a => 
      (a.context?.country === country) && 
      (a.context?.base !== base) && 
      (a.userId !== userId)
    );
  });

  poolAssessments = computed(() => {
    const userId = this.user()?.id;
    const country = this.user()?.assignedCountry;
    const base = this.user()?.assignedBase;
    const role = this.user()?.role;

    // Only non-USERs see the Global tab
    if (!role || role === 'USER') return [];

    // Catch-all: everything that is NOT mine, NOT in my base, and NOT in my country (if assigned)
    return this.assessmentService.allAssessments().filter(a => {
        const isMine = a.userId === userId;
        const isInMyBase = base ? a.context?.base === base : false;
        const isInMyCountry = country ? a.context?.country === country : false;
        
        return !isMine && !isInMyBase && !isInMyCountry;
    });
  });

  ngOnInit() {
    this.assessmentService.clearActiveContext();
    this.assessmentService.sync(); 
  }

  resume(assessment: AssessmentState) {
    if (assessment.context) {
      this.assessmentService.initializeAssessment(assessment.context);
      const firstSection = this.assessmentService.sections()[0];
      if (firstSection) {
        this.router.navigate(['/assessment', firstSection.id]);
      }
    }
  }

  deleteDraft(assessment: AssessmentState) {
    if (confirm('Are you sure you want to permanently delete this draft?')) {
      this.assessmentService.deleteAssessment(assessment);
      // Logic refreshed automatically via service signals
    }
  }

  // --- Metrics Calculations (Mirrors logic in Service) ---

  calculateProgress(assessment: AssessmentState): number {
    const sections = this.assessmentService.sections();
    if (!sections || sections.length === 0) return 0;
    if (!assessment.answers) return 0;

    let totalQuestions = 0;
    let answeredQuestions = 0;

    sections.forEach(s => {
      s.questions.forEach(q => {
        totalQuestions++;
        const val = assessment.answers[q.id];
        if (val !== undefined && val !== null) {
          answeredQuestions++;
        }
      });
    });

    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  }

  calculateScore(assessment: AssessmentState): number {
    const sections = this.assessmentService.sections();
    if (!sections || sections.length === 0) return 0;
    if (!assessment.answers) return 0;

    let totalPoints = 0;
    let maxPoints = 0;

    sections.forEach(s => {
      s.questions.forEach(q => {
        const val = assessment.answers[q.id];
        if (val !== undefined && val !== -1) {
          totalPoints += (val * q.weight);
          maxPoints += (1 * q.weight);
        }
      });
    });

    return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'SUBMITTED': return 'accent';
      case 'VALIDATED': return 'primary';
      case 'DRAFT':
      default: return 'warn';
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }
}
