import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { AssessmentService } from '../../../services/assessment.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-coordination-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    DatePipe
  ],
  template: `
    <div class="coord-container">
      <div class="header">
        <h1>Coordination Dashboard</h1>
        <p class="subtitle">Overview of all assessments in your scope</p>
      </div>

      <mat-card>
        <table mat-table [dataSource]="data" class="mat-elevation-z0">

          <!-- Country Column -->
          <ng-container matColumnDef="country">
            <th mat-header-cell *matHeaderCellDef> Country </th>
            <td mat-cell *matCellDef="let element"> {{element.country || 'N/A'}} </td>
          </ng-container>

          <!-- Base Column -->
          <ng-container matColumnDef="base">
            <th mat-header-cell *matHeaderCellDef> Base </th>
            <td mat-cell *matCellDef="let element"> {{element.base || 'N/A'}} </td>
          </ng-container>

          <!-- User Column -->
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef> User </th>
            <td mat-cell *matCellDef="let element"> 
                {{element.userId?.name || 'Unknown'}} 
                <span class="email">({{element.userId?.email}})</span>
            </td>
          </ng-container>

          <!-- Score Column -->
          <ng-container matColumnDef="score">
            <th mat-header-cell *matHeaderCellDef> Score </th>
            <td mat-cell *matCellDef="let element"> 
                <span class="score-badge" [class]="getScoreClass(element.score)">
                    {{element.score}}%
                </span>
            </td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef> Date </th>
            <td mat-cell *matCellDef="let element"> {{element.date | date:'mediumDate'}} </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Actions </th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button color="primary" (click)="viewAssessment(element)" matTooltip="View Details">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteAssessment(element._id)" *ngIf="authService.currentUser()?.role === 'SUPER_ADMIN'">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        <div *ngIf="data.length === 0" class="no-data">
            <mat-icon>info</mat-icon>
            <p>No assessments found for your scope.</p>
            <p *ngIf="authService.currentUser() as user">
                Role: {{ user.role }} <br>
                Assigned: {{ user.assignedCountries || user.assignedCountry }}
            </p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .coord-container { padding: 20px; }
    .header { margin-bottom: 20px; }
    .subtitle { color: #666; font-size: 0.9rem; }
    table { width: 100%; }
    .email { font-size: 0.8rem; color: #888; margin-left: 4px; }
    
    .no-data { padding: 40px; text-align: center; color: #888; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    
    .score-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
    }
    .score-high { background: #E8F5E9; color: #2E7D32; }
    .score-med { background: #FFF3E0; color: #EF6C00; }
    .score-low { background: #FFEBEE; color: #C62828; }
  `]
})
export class CoordinationDashboardComponent implements OnInit {
  assessmentService = inject(AssessmentService);
  authService = inject(AuthService);
  router = inject(Router);

  displayedColumns: string[] = ['country', 'base', 'user', 'score', 'date', 'actions'];
  data: any[] = [];

  ngOnInit() {
    this.assessmentService.getRemoteHistory().subscribe({
      next: (res) => {
        console.log('Coordination Data:', res);
        this.data = res;
      },
      error: (err) => {
        console.error('Coordination Error:', err);
      }
    });
  }

  viewAssessment(element: any) {
    if (element.country && element.base && element.evaluationMonth) {
      const context = {
        country: element.country,
        base: element.base,
        evaluationMonth: element.evaluationMonth,
        date: element.date
      };

      this.assessmentService.context.set(context);
      this.assessmentService.answers.set(element.answers || {});
      this.assessmentService.comments.set(element.comments || {});
      this.assessmentService.status.set(element.status || 'SUBMITTED');

      const firstSection = this.assessmentService.sections()[0];
      if (firstSection) {
        this.router.navigate(['/assessment', firstSection.id]);
      }
    } else {
      alert('Invalid assessment data');
    }
  }

  deleteAssessment(id: string) {
    if (confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      this.assessmentService.deleteRemoteAssessment(id).subscribe({
        next: () => {
          this.data = this.data.filter(item => item._id !== id);
        },
        error: (err) => alert('Failed to delete: ' + err.message)
      });
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-med';
    return 'score-low';
  }
}
