import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssessmentService } from '../../../services/assessment.service';
import { Router, RouterModule } from '@angular/router';
import { AssessmentState } from '../../../models/assessment.model';

@Component({
  selector: 'app-assessment-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule, RouterModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>My Assessments</h1>
        <button mat-raised-button color="primary" routerLink="/assessment/init">
            <mat-icon>add</mat-icon> New Assessment
        </button>
      </div>

      <div class="table-container mat-elevation-z2">
        <div class="scroll-container">
          <table mat-table [dataSource]="assessmentService.allAssessments()">
  
            <!-- Country Column -->
            <ng-container matColumnDef="country">
              <th mat-header-cell *matHeaderCellDef> Country </th>
              <td mat-cell *matCellDef="let element"> {{element.context.country}} </td>
            </ng-container>
  
            <!-- Base Column -->
            <ng-container matColumnDef="base">
              <th mat-header-cell *matHeaderCellDef> Base </th>
              <td mat-cell *matCellDef="let element"> {{element.context.base}} </td>
            </ng-container>
  
            <!-- Month Column -->
            <ng-container matColumnDef="month">
              <th mat-header-cell *matHeaderCellDef> Month </th>
              <td mat-cell *matCellDef="let element"> {{element.context.evaluationMonth}} </td>
            </ng-container>
  
            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef> Status </th>
              <td mat-cell *matCellDef="let element"> 
                  <span class="status-badge" [class.draft]="element.status === 'DRAFT'" [class.submitted]="element.status === 'SUBMITTED'" [class.validated]="element.status === 'VALIDATED'">
                      {{element.status}}
                  </span>
              </td>
            </ng-container>
  
            <!-- Progress Column -->
            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef> Progress </th>
              <td mat-cell *matCellDef="let element"> 
                  <span class="metric-value">{{ calculateProgress(element) }}%</span> 
              </td>
            </ng-container>
  
            <!-- Score Column -->
            <ng-container matColumnDef="score">
              <th mat-header-cell *matHeaderCellDef> Score </th>
              <td mat-cell *matCellDef="let element"> 
                  <span class="metric-value score">{{ calculateScore(element) }}%</span> 
              </td>
            </ng-container>
  
            <!-- Updated At Column -->
            <ng-container matColumnDef="updatedAt" class="desktop-only">
              <th mat-header-cell *matHeaderCellDef> Last Active </th>
              <td mat-cell *matCellDef="let element"> {{element.updatedAt | date:'shortDate'}} </td>
            </ng-container>
  
            <!-- Actions Column -->
            <ng-container matColumnDef="actions" stickyEnd>
              <th mat-header-cell *matHeaderCellDef> Actions </th>
              <td mat-cell *matCellDef="let element">
                  <button mat-icon-button color="accent" (click)="resume(element)" [matTooltip]="element.status === 'DRAFT' ? 'Continue' : 'View'">
                      <mat-icon>{{ element.status === 'DRAFT' ? 'edit' : 'visibility' }}</mat-icon>
                  </button>
              </td>
            </ng-container>
  
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <div *ngIf="assessments.length === 0" class="empty-state">
            <p>No assessments found. Start a new one!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 12px; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    h1 { font-size: 1.5rem; margin: 0; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    .scroll-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 600px; }
    .empty-state { padding: 48px; text-align: center; color: #777; font-style: italic; }
    
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

    @media (max-width: 600px) {
      .header { flex-direction: column; gap: 12px; align-items: flex-start; }
      .container { padding: 8px; }
    }
  `]
})
export class AssessmentListComponent implements OnInit {
  assessmentService = inject(AssessmentService);
  router = inject(Router);

  assessments: AssessmentState[] = [];
  displayedColumns: string[] = ['country', 'base', 'month', 'status', 'progress', 'score', 'updatedAt', 'actions'];

  ngOnInit() {
    // Clear active context when entering list view
    this.assessmentService.clearActiveContext();
    this.assessmentService.sync(); // Auto-pull latest updates from server
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
}
