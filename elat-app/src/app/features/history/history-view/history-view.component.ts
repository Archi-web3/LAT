import { Component, inject, effect } from '@angular/core';
import Chart from 'chart.js/auto';
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
        
        <!-- CHART SECTION -->
        <mat-card class="chart-card" *ngIf="history().length > 1">
            <h3>Évolution des Scores</h3>
            <div class="chart-container">
                <canvas id="historyChart"></canvas>
            </div>
        </mat-card>

        <!-- CONFLICTS SECTION -->
        <div class="conflicts-section" *ngIf="conflicts().length > 0">
            <mat-card class="conflict-card warning">
                <h3>⚠️ Conflits de synchronisation détectés</h3>
                <p>Des versions locales ont été écrasées par le serveur. Vous pouvez les restaurer ici.</p>
                
                <mat-list>
                    <mat-list-item *ngFor="let c of conflicts()">
                        <mat-icon matListItemIcon class="orange-icon">warning</mat-icon>
                        <div matListItemTitle>Sauvegarde du {{ c.date | date:'medium' }}</div>
                        <div matListItemLine>{{ c.originalKey }}</div>
                        <div matListItemMeta>
                            <button mat-button color="primary" (click)="assessmentService.restoreConflict(c)">Restaurer</button>
                            <button mat-button color="warn" (click)="assessmentService.discardConflict(c.key)">Supprimer</button>
                        </div>
                    </mat-list-item>
                </mat-list>
            </mat-card>
        </div>

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
    .chart-card { margin-bottom: 24px; padding: 16px; }
    .chart-card h3 { margin-bottom: 16px; color: #3f51b5; }
    .chart-container { position: relative; height: 250px; width: 100%; }

    .conflicts-section { margin-bottom: 24px; }
    .conflict-card.warning { 
        border-left: 4px solid #ef6c00; 
        background: #fff3e0;
    }
    .conflict-card h3 { 
        margin: 16px; 
        color: #ef6c00; 
        display: flex; 
        align-items: center; 
        gap: 8px; 
    }
    .conflict-card p { margin: 0 16px 16px; color: #555; }
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
  // Signal to the history array
  history = this.assessmentService.history;
  conflicts = this.assessmentService.conflicts;

  constructor() {
    this.assessmentService.checkConflicts();
  }

  // Chart
  chart: any;

  constructor() {
    this.assessmentService.checkConflicts();

    // Update chart when history changes
    effect(() => {
      const data = this.history();
      if (data && data.length > 0) {
        // Give time for DOM to render canvas if switching views
        setTimeout(() => this.initChart(data), 100);
      }
    });
  }

  initChart(historyData: any[]) {
    const ctx = document.getElementById('historyChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    // Filter: Only keep items with a score and date
    // Sort by Date Ascending
    const validItems = historyData
      .filter(h => h.score !== undefined && h.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (validItems.length < 2) return; // Need at least 2 points for a trend

    const labels = validItems.map(h => new Date(h.date).toLocaleDateString());
    const scores = validItems.map(h => h.score);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Score Évolution (%)',
          data: scores,
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Score' }
          }
        }
      }
    });
  }

  getIcon(action: string): string {
    switch (action) {
      case 'CREATED': return 'add_circle';
      case 'SUBMITTED': return 'send';
      case 'VALIDATED': return 'verified';
      case 'RESET': return 'restart_alt';
      case 'UNLOCKED': return 'lock_open';
      case 'SYNC': return 'sync';
      case 'CONFLICT': return 'warning';
      case 'RESOLVED': return 'check_circle';
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
      case 'RESOLVED': return 'green-icon';
      default: return 'grey-icon';
    }
  }
}
