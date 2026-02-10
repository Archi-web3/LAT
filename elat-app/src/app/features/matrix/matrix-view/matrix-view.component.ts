import { Component, inject, OnInit, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { AssessmentService } from '../../../services/assessment.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

import { MatDialog } from '@angular/material/dialog';
import { ChartExpansionDialogComponent } from '../chart-expansion-dialog/chart-expansion-dialog.component';

@Component({
  selector: 'app-matrix-view',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="matrix-container">
      <div class="header-actions">
           <button mat-button routerLink="/assessment">
              <mat-icon>arrow_back</mat-icon> Back to Assessment
           </button>
           <h2>Matrix Dashboard</h2>
      </div>
      
      <p>Performance analysis by transversal components</p>

      <div class="charts-row">
        <!-- Global Score Card -->
        <div class="chart-container score-card" [class.low]="globalScore() < 50" [class.med]="globalScore() >= 50 && globalScore() < 80" [class.high]="globalScore() >= 80">
            <h3>Global Assessment Score</h3>
            <div class="score-circle">
                <span class="score-value">{{ globalScore() }}%</span>
                <span class="score-label">Compliance</span>
            </div>
            <div class="progress-info">
                <span>Progress: {{ globalProgress() }}%</span>
                <span style="display:block; font-size: 0.8rem; margin-top: 4px; color: #888;">N/A Rate: {{ globalNARate() }}%</span>
            </div>
        </div>

        <!-- Bar Chart (Clickable) -->
        <div class="chart-container clickable-chart" (click)="expandBarChart()" matTooltip="Click to Expand">
             <div class="chart-header">
                <h3>Transversal Analysis</h3>
                <mat-icon class="expand-icon">open_in_full</mat-icon>
            </div>
            <div class="canvas-wrapper">
                <canvas #barChartCanvas></canvas>
            </div>
        </div>
        
        <!-- Radar Chart with Expand Capability -->
        <div class="chart-container clickable-chart" (click)="expandRadar()" matTooltip="Click to Expand">
            <div class="chart-header">
                <h3>Logistics Categories Profile</h3>
                <mat-icon class="expand-icon">open_in_full</mat-icon>
            </div>
            <div class="canvas-wrapper">
                <canvas #radarChartCanvas></canvas>
            </div>
        </div>
      </div>

      <div class="breakdown">
        <h3>Detailed Breakdown per Logistics Category (Click for N/A %)</h3>
        <div class="grid">
            <div *ngFor="let item of sectionData()" class="card clickable-card" (click)="showNA(item)"
                 [class.low]="item.score < 50" [class.med]="item.score >= 50 && item.score < 80" [class.high]="item.score >= 80">
                <span class="label">{{ item.name }}</span>
                <span class="value">{{ item.score }}%</span>
                <div class="progress">
                    <div class="bar" [style.width.%]="item.score"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .matrix-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .header-actions { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .header-actions h2 { margin: 0; }
    
    .charts-row {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        margin: 32px 0;
    }
    .chart-container {
      flex: 1;
      min-width: 300px;
      height: 500px; /* Increased height */
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    .clickable-chart {
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        border: 1px solid transparent;
    }
    .clickable-chart:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        border-color: #e0e0e0;
    }

    .chart-header {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        margin-bottom: 12px;
    }
    .expand-icon {
        position: absolute;
        right: 0;
        color: #999;
        font-size: 20px;
    }

    .canvas-wrapper {
        position: relative;
        flex: 1;
        width: 100%;
        min-height: 0;
    }
    h3 { margin: 0; color: #555; font-size: 1rem; text-align: center; }
    
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .card { padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 8px; }
    .label { font-weight: 500; font-size: 0.9rem; color: #666; }
    .value { font-size: 1.5rem; font-weight: bold; }
    .progress { height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
    .bar { height: 100%; transition: width 0.5s ease; background: #3f51b5; }
    .card.low .value { color: #f44336; } .card.low .bar { background: #f44336; }
    .card.med .value { color: #ff9800; } .card.med .bar { background: #ff9800; }
    .card.high .value { color: #4caf50; } .card.high .bar { background: #4caf50; }
    
    .clickable-card { cursor: pointer; transition: transform 0.1s; }
    .clickable-card:active { transform: scale(0.98); }

    .score-card {
        align-items: center;
        justify-content: center;
        text-align: center;
    }
    .score-circle {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        border: 10px solid #eee;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: 20px 0;
    }
    .score-card.low .score-circle { border-color: #f44336; color: #f44336; }
    .score-card.med .score-circle { border-color: #ff9800; color: #ff9800; }
    .score-card.high .score-circle { border-color: #4caf50; color: #4caf50; }

    .score-value { font-size: 2.5rem; font-weight: bold; line-height: 1; margin-bottom: 4px; }
    .score-label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.7; letter-spacing: 1px; }
    .progress-info { font-weight: bold; color: #555; }
  `]
})
export class MatrixViewComponent implements OnInit {
  assessmentService = inject(AssessmentService);
  dialog = inject(MatDialog);

  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('radarChartCanvas') radarChartCanvas!: ElementRef<HTMLCanvasElement>;

  barChart: any;
  radarChart: any;

  globalScore = computed(() => this.assessmentService.getGlobalScore());
  globalProgress = computed(() => this.assessmentService.getGlobalProgress());

  // Data for Transversal Analysis (Bar Chart)
  transversalData = computed(() => {
    const components = this.assessmentService.transversalComponents();
    const sections = this.assessmentService.sections();
    const answers = this.assessmentService.answers();

    return components.map(compName => {
      let totalScore = 0;
      let maxScore = 0;

      sections.forEach(s => {
        s.questions.forEach(q => {
          if (q.transversalTags.includes(compName)) {
            const ans = answers[q.id];
            if (ans !== undefined && ans !== -1) {
              totalScore += (ans * q.weight);
              maxScore += (1.0 * q.weight);
            }
          }
        });
      });

      return {
        name: compName,
        score: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
      };
    });
  });

  // Data for Logistics Categories (Radar Chart & Grid)
  sectionData = computed(() => {
    const sections = this.assessmentService.sections();
    const answers = this.assessmentService.answers();

    return sections.map(section => {
      let totalScore = 0;
      let maxScore = 0;

      section.questions.forEach(q => {
        const ans = answers[q.id];
        if (ans !== undefined && ans !== -1) {
          totalScore += (ans * q.weight);
          maxScore += (1.0 * q.weight);
        }
      });

      return {
        name: section.title,
        score: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
      };
    });
  });

  ngOnInit() {
    setTimeout(() => this.initCharts(), 100);
  }

  initCharts() {
    this.initBarChart();
    this.initRadarChart();
  }

  globalNARate = computed(() => this.assessmentService.getGlobalNArate());

  initBarChart() {
    if (!this.barChartCanvas) return;
    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.transversalData();

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Compliance %',
          data: data.map(d => d.score),
          backgroundColor: data.map(d => d.score < 50 ? 'rgba(244,67,54,0.6)' : d.score < 80 ? 'rgba(255,152,0,0.6)' : 'rgba(76,175,80,0.6)'),
          borderColor: data.map(d => d.score < 50 ? '#f44336' : d.score < 80 ? '#ff9800' : '#4caf50'),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } },
        onClick: (e) => this.expandBarChart() // Allow clicking on chart elements too
      }
    });
  }

  initRadarChart() {
    if (!this.radarChartCanvas) return;
    const ctx = this.radarChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.sectionData();

    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Logistics Profile',
          data: data.map(d => d.score),
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: '#4caf50',
          borderWidth: 2,
          pointBackgroundColor: '#4caf50',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4caf50',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { display: true, color: 'rgba(0,0,0,0.05)' },
            grid: { circular: true },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { stepSize: 20, backdropColor: 'transparent' }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  expandBarChart() {
    const data = this.transversalData();
    this.dialog.open(ChartExpansionDialogComponent, {
      width: '90vw',
      height: '80vh',
      maxWidth: '1200px',
      data: {
        title: 'Transversal Analysis (Detailed)',
        labels: data.map(d => d.name),
        values: data.map(d => d.score),
        type: 'bar' // Handled in dialog? Or generic
      }
    });
  }

  expandRadar() {
    const data = this.sectionData();
    this.dialog.open(ChartExpansionDialogComponent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '1200px',
      data: {
        title: 'Logistics Categories Profile (Detailed)',
        labels: data.map(d => d.name),
        values: data.map(d => d.score)
      }
    });
  }

  showNA(item: any) {
    // Using section name to find ID is tricky if titles change, but better to pass ID if available.
    // We only have sectionData with name/score. Let's find section by title.
    const section = this.assessmentService.sections().find(s => s.title === item.name);
    if (section) {
      const na = this.assessmentService.getSectionNArate(section.id);
      alert(`${item.name}\n\nCompliance: ${item.score}%\nNot Applicable (N/A): ${na}%`);
    }
  }
}
