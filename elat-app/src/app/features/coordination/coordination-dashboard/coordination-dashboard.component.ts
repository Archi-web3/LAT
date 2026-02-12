import { Component, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { AssessmentService } from '../../../services/assessment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { DashboardService, DashboardMetrics } from '../../../services/dashboard.service';

import * as L from 'leaflet';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-coordination-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule
  ],
  template: `
    <div class="coord-container">
      <div class="header">
        <h1>Coordination Dashboard</h1>
        <p class="subtitle">Global Overview & Performance</p>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" *ngIf="metrics">
        <mat-card class="kpi-card">
            <div class="kpi-value">{{ metrics.totalAssessments }}</div>
            <div class="kpi-label">Total Assessments</div>
        </mat-card>
        <mat-card class="kpi-card">
            <div class="kpi-value" [class.success]="metrics.averageScore >= 80" [class.warn]="metrics.averageScore < 50">
                {{ metrics.averageScore }}%
            </div>
            <div class="kpi-label">Average Score</div>
        </mat-card>
        <mat-card class="kpi-card">
            <div class="kpi-value">{{ metrics.activeCountries }}</div>
            <div class="kpi-label">Active Countries</div>
        </mat-card>
      </div>

      <div class="dashboard-content">
          <!-- Left: Map & Charts -->
          <div class="visuals">
             <mat-card class="map-card">
                 <h3>Global Presence</h3>
                 <div id="map" class="map-container"></div>
             </mat-card>

             <mat-card class="chart-card">
                 <h3>Score by Country</h3>
                 <canvas id="countryChart"></canvas>
             </mat-card>
          </div>

          <!-- Right: List -->
          <div class="list-view">
             <mat-card>
                <h3>Recent Assessments</h3>
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

                   <!-- Score Column -->
                  <ng-container matColumnDef="score">
                    <th mat-header-cell *matHeaderCellDef> Score </th>
                    <td mat-cell *matCellDef="let element"> 
                        <span class="score-badge" [class]="getScoreClass(element.score)">
                            {{element.score}}%
                        </span>
                    </td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef> </th>
                    <td mat-cell *matCellDef="let element">
                      <button mat-icon-button color="primary" (click)="viewAssessment(element)" matTooltip="View">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
             </mat-card>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .coord-container { padding: 20px; }
    .header { margin-bottom: 20px; }
    .subtitle { color: #666; font-size: 0.9rem; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .kpi-card { padding: 20px; text-align: center; }
    .kpi-value { font-size: 2.5rem; font-weight: bold; color: #3f51b5; }
    .kpi-value.success { color: #2E7D32; }
    .kpi-value.warn { color: #C62828; }
    .kpi-label { font-size: 0.9rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }

    .dashboard-content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 960px) { .dashboard-content { grid-template-columns: 1fr; } }

    .map-container { height: 300px; width: 100%; z-index: 1; }
    .map-card { padding: 10px; }
    .chart-card { padding: 20px; margin-top: 20px; }

    table { width: 100%; }
    .score-badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
    .score-high { background: #E8F5E9; color: #2E7D32; }
    .score-med { background: #FFF3E0; color: #EF6C00; }
    .score-low { background: #FFEBEE; color: #C62828; }
  `]
})
export class CoordinationDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  assessmentService = inject(AssessmentService);
  dashboardService = inject(DashboardService);
  authService = inject(AuthService);
  router = inject(Router);

  displayedColumns: string[] = ['country', 'base', 'score', 'actions'];
  data: any[] = [];
  metrics: DashboardMetrics | null = null;

  private map: L.Map | undefined;
  private chart: Chart | undefined;

  // Mock Coordinates for Demo (In real app, we need a DB of coordinates per Base/Country)
  private coordinates: Record<string, [number, number]> = {
    'CD': [-4.0383, 21.7587], // DRC
    'CF': [6.6111, 20.9394],  // CAR
    'TD': [15.4542, 18.7322], // Chad
    'CM': [7.3697, 12.3547],  // Cameroon
    'NG': [9.0820, 8.6753],   // Nigeria
    'BF': [12.2383, -1.5616], // Burkina Faso
    'ML': [17.5707, -3.9962], // Mali
    'NE': [17.6078, 8.0817],  // Niger
    'FR': [46.603354, 1.888334], // France
    'UA': [48.3794, 31.1656], // Ukraine
    'YE': [15.552727, 48.516388], // Yemen
    'AF': [33.9391, 67.7100]  // Afghanistan
  };

  ngOnInit() {
    this.refreshData();
  }

  ngAfterViewInit() {
    // Wait for data to be loaded before initializing map
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }

  refreshData() {
    this.assessmentService.getRemoteHistory().subscribe({
      next: (res) => {
        this.data = res;
        this.metrics = this.dashboardService.computeMetrics(res);

        // UI Update is async
        setTimeout(() => {
          this.initMap();
          this.initChart();
        }, 100);
      },
      error: (err) => console.error(err)
    });
  }

  initMap() {
    if (this.map) {
      this.map.remove(); // Reset map
    }

    const container = document.getElementById('map');
    if (!container) return;

    this.map = L.map('map').setView([10.0, 15.0], 3); // Centered on Africa

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add Markers from Metrics
    if (this.metrics && this.metrics.byCountry) {
      this.metrics.byCountry.forEach(c => {
        const coords = this.coordinates[c.name] || this.coordinates[c.name.substring(0, 2).toUpperCase()];
        if (coords) {
          const marker = L.circleMarker(coords, {
            color: this.getColor(c.score),
            fillColor: this.getColor(c.score),
            fillOpacity: 0.8,
            radius: 10 + (c.count * 2) // Size based on volume
          }).addTo(this.map!);

          marker.bindPopup(`<b>${c.name}</b><br>Score: ${c.score}%<br>Assessments: ${c.count}`);
        }
      });
    }
  }

  initChart() {
    const ctx = document.getElementById('countryChart') as HTMLCanvasElement;
    if (!ctx || !this.metrics) return;

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.metrics.byCountry.map(c => c.name),
        datasets: [{
          label: 'Avg Score',
          data: this.metrics.byCountry.map(c => c.score),
          backgroundColor: this.metrics.byCountry.map(c => this.getColor(c.score)),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }

  getColor(score: number): string {
    if (score >= 80) return '#2E7D32'; // Green
    if (score >= 50) return '#EF6C00'; // Orange
    return '#C62828'; // Red
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-med';
    return 'score-low';
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
      if (firstSection) this.router.navigate(['/assessment', firstSection.id]);
    }
  }
}
