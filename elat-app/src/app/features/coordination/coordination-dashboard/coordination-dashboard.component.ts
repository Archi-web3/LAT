import { Component, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AssessmentService } from '../../../services/assessment.service';
import { DashboardService, DashboardMetrics } from '../../../services/dashboard.service';
import { AuthService } from '../../../core/auth/auth.service';

import * as L from 'leaflet';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-coordination-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="coord-container">
      <div class="header">
        <h1>Coordination Dashboard</h1>
        <p class="subtitle">Global Overview & Performance</p>
      </div>

        <!-- Filter Bar -->
        <mat-card class="filter-bar" [formGroup]="filterForm">
            <div class="filter-row">
                <mat-form-field appearance="outline" class="dense-field">
                    <mat-label>Date Range</mat-label>
                    <mat-date-range-input [rangePicker]="picker">
                        <input matStartDate formControlName="start" placeholder="Start date">
                        <input matEndDate formControlName="end" placeholder="End date">
                    </mat-date-range-input>
                    <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-date-range-picker #picker></mat-date-range-picker>
                </mat-form-field>

                <mat-form-field appearance="outline" class="dense-field" style="width: 250px;">
                    <mat-label>Countries</mat-label>
                    <mat-select formControlName="countries" multiple>
                        <mat-option *ngFor="let c of availableCountries" [value]="c">{{c}}</mat-option>
                    </mat-select>
                </mat-form-field>

                <button mat-button color="warn" (click)="filterForm.reset()">Reset</button>
            </div>
        </mat-card>

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
                 <h3>Score Evolution</h3>
                 <canvas id="evolutionChart"></canvas>
             </mat-card>

             <mat-card class="chart-card">
                 <h3>Score by Country</h3>
                 <canvas id="countryChart"></canvas>
             </mat-card>
          </div>

          <!-- Right: List -->
          <div class="list-view">
             <mat-card>
                <h3>Assessments</h3>
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
    .coord-container { padding: 20px; background-color: #f7f9fc; min-height: 100vh; }
    .header { margin-bottom: 20px; }
    .subtitle { color: #666; font-size: 0.9rem; }
    
    .filter-bar { margin-bottom: 20px; padding: 15px 20px; }
    .filter-row { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
    .dense-field .mat-mdc-form-field-wrapper { padding-bottom: 0; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .kpi-card { padding: 20px; text-align: center; }
    .kpi-value { font-size: 2.5rem; font-weight: bold; color: #3f51b5; }
    .kpi-value.success { color: #2E7D32; }
    .kpi-value.warn { color: #C62828; }
    .kpi-label { font-size: 0.9rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }

    .dashboard-content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 960px) { .dashboard-content { grid-template-columns: 1fr; } }

    .map-container { height: 350px; width: 100%; z-index: 1; border-radius: 4px; overflow: hidden; }
    .map-card { padding: 0; overflow: hidden; }
    .map-card h3 { padding: 15px; margin: 0; background: #fff; border-bottom: 1px solid #eee; }
    
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
  fb = inject(FormBuilder);

  displayedColumns: string[] = ['country', 'base', 'score', 'actions'];

  // Raw data from server
  rawData: any[] = [];
  // Filtered data for display
  data: any[] = [];

  metrics: DashboardMetrics | null = null;
  filterForm: FormGroup;

  // Lists for Filter Dropdowns
  availableCountries: string[] = [];

  private map: L.Map | undefined;
  private chart: Chart | undefined;
  private evolutionChart: Chart | undefined;

  // Mock Coordinates
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
    'AF': [33.9391, 67.7100],  // Afghanistan
    'SS': [6.8770, 31.3070],  // South Sudan
    'IQ': [33.2232, 43.6793], // Iraq
    'SY': [34.8021, 38.9968], // Syria
    'LB': [33.8547, 35.8623], // Lebanon
    'JO': [30.5852, 36.2384], // Jordan
    'PS': [31.9522, 35.2332], // Palestine
    'MM': [21.9162, 95.9560], // Myanmar
    'BD': [23.6850, 90.3563], // Bangladesh
    'VE': [6.4238, -66.5897], // Venezuela
    'CO': [4.5709, -74.2973], // Colombia
    'HT': [18.9712, -72.2852], // Haiti
  };

  constructor() {
    this.filterForm = this.fb.group({
      start: [null],
      end: [null],
      countries: [[]]
    });

    // React to form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit() {
    this.refreshData();
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
    if (this.evolutionChart) this.evolutionChart.destroy();
  }

  refreshData() {
    this.assessmentService.getRemoteHistory().subscribe({
      next: (res) => {
        this.rawData = res;

        // Extract available countries for filter
        this.availableCountries = [...new Set(res.map((i: any) => i.country))].sort();

        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
      }
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;

    this.data = this.dashboardService.filterData(this.rawData, {
      start: filters.start,
      end: filters.end,
      countries: filters.countries
    });

    this.metrics = this.dashboardService.computeMetrics(this.data);

    setTimeout(() => {
      this.initMap();
      this.initChart();
      this.initEvolutionChart();
    }, 100);
  }

  initMap() {
    if (this.map) {
      this.map.remove();
      this.map = undefined; // Clear ref
    }

    // Ensure container exists
    const container = document.getElementById('map');
    if (!container) return;

    this.map = L.map('map').setView([10.0, 15.0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.metrics && this.metrics.byCountry) {
      this.metrics.byCountry.forEach(c => {
        const coords = this.coordinates[c.name] || this.coordinates[c.name.substring(0, 2).toUpperCase()];
        if (coords) {
          const marker = L.circleMarker(coords, {
            color: this.getColor(c.score),
            fillColor: this.getColor(c.score),
            fillOpacity: 0.8,
            radius: 8 + (c.count * 1.5)
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
        plugins: { legend: { display: false } }, // Hide legend for single dataset
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }

  initEvolutionChart() {
    const ctx = document.getElementById('evolutionChart') as HTMLCanvasElement;
    if (!ctx || !this.metrics) return;

    if (this.evolutionChart) this.evolutionChart.destroy();

    // Simple implementation: Global Evolution
    // If we want multiple lines per country, we need more complex data prep. 
    // For now, let's show the Global Trend of filtered selection.

    this.evolutionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.metrics.evolution.map(e => e.name),
        datasets: [{
          label: 'Global Score Trend',
          data: this.metrics.evolution.map(e => e.value),
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.2)',
          fill: true,
          tension: 0.3
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
