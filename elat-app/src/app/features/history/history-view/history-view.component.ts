import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { AssessmentService } from '../../../services/assessment.service';

@Component({
  selector: 'app-history-view',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, RouterModule],
  template: `
    <div class="history-container">
      <div class="header">
        <button mat-icon-button routerLink="/assessment">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Historique des modifications</h2>
      </div>

      <div class="history-list" *ngIf="assessmentService.context(); else noContext">
        <mat-card class="history-card">
           <mat-list>
             <ng-container *ngFor="let item of history(); let last = last">
               <mat-list-item class="history-item">
                 <mat-icon matListItemIcon [fontIcon]="getIcon(item.action)" [class]="getColorClass(item.action)"></mat-icon>
                 <div matListItemTitle>
                   <span class="action-title">{{ item.action }}</span>
                   <span class="action-date">{{ item.date | date:'medium' }}</span>
                 </div>
                 <div matListItemLine>
                   <span class="user-info">{{ item.user }}</span>
                 </div>
                 <div matListItemLine *ngIf="item.details" class="details">
                   {{ item.details }}
                 </div>
               </mat-list-item>
               <mat-divider *ngIf="!last"></mat-divider>
             </ng-container>

             <mat-list-item *ngIf="history().length === 0">
               <p matListItemTitle>Aucun historique disponible.</p>
             </mat-list-item>
           </mat-list>
        </mat-card>
      </div>

      <ng-template #noContext>
        <p class="error-msg">Aucune évaluation active. Veuillez en sélectionner une.</p>
        <button mat-raised-button color="primary" routerLink="/assessment/list">Aller à la liste</button>
      </ng-template>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .history-item {
      height: auto !important;
      padding-top: 12px;
      padding-bottom: 12px;
    }
    .action-title {
      font-weight: 600;
      margin-right: 12px;
    }
    .action-date {
      color: #757575;
      font-size: 0.85em;
    }
    .user-info {
      font-style: italic;
      color: #555;
    }
    .details {
      margin-top: 4px;
      color: #333;
    }
    
    /* Icons Colors */
    .green-icon { color: #2e7d32; }
    .blue-icon { color: #1565c0; }
    .orange-icon { color: #ef6c00; }
    .red-icon { color: #c62828; }
    .grey-icon { color: #757575; }

    .error-msg {
      text-align: center;
      color: #757575;
      margin-top: 40px;
    }
  `]
})
export class HistoryViewComponent {
  assessmentService = inject(AssessmentService);

  // Signal to the history array
  history = this.assessmentService.history;

  getIcon(action: string): string {
    switch (action) {
      case 'CREATED': return 'add_circle';
      case 'SUBMITTED': return 'send';
      case 'VALIDATED': return 'verified';
      case 'RESET': return 'restart_alt';
      case 'UNLOCKED': return 'lock_open';
      case 'SYNC': return 'sync';
      case 'CONFLICT': return 'warning';
      default: return 'history';
    }
  }

  getColorClass(action: string): string {
    switch (action) {
      case 'CREATED': return 'green-icon';
      case 'SUBMITTED': return 'blue-icon';
      case 'VALIDATED': return 'green-icon';
      case 'RESET': return 'red-icon';
      case 'UNLOCKED': return 'orange-icon';
      case 'SYNC': return 'blue-icon';
      case 'CONFLICT': return 'red-icon';
      default: return 'grey-icon';
    }
  }
}
