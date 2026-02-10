import { Component, Inject, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-expansion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
        <div class="dialog-header">
            <h2>{{ data.title }}</h2>
            <button mat-icon-button (click)="close()">
                <mat-icon>close</mat-icon>
            </button>
        </div>
        
        <div class="canvas-wrapper">
             <canvas #largeCanvas></canvas>
        </div>
    </div>
  `,
  styles: [`
    .dialog-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 24px;
        box-sizing: border-box;
    }
    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    h2 { margin: 0; font-size: 1.5rem; color: #3f51b5; }
    .canvas-wrapper {
        flex: 1;
        position: relative;
        min-height: 500px;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    canvas {
        max-height: 100%;
        max-width: 100%;
    }
  `]
})
export class ChartExpansionDialogComponent implements OnInit {
  @ViewChild('largeCanvas') largeCanvas!: ElementRef<HTMLCanvasElement>;

  private dialogRef = inject(MatDialogRef<ChartExpansionDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    setTimeout(() => this.initChart(), 100);
  }

  close() {
    this.dialogRef.close();
  }

  initChart() {
    if (!this.largeCanvas) return;
    const ctx = this.largeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Enhanced Styling for Large Chart
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: this.data.labels,
        datasets: [{
          label: 'Score (%)',
          data: this.data.values,
          backgroundColor: 'rgba(76, 175, 80, 0.4)', // Professional Green transparent
          borderColor: '#43a047', // Darker Green
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#43a047',
          pointHoverBackgroundColor: '#43a047',
          pointHoverBorderColor: '#fff',
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { size: 16 },
            bodyFont: { size: 14 },
            padding: 12,
            backgroundColor: 'rgba(0,0,0,0.8)'
          }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(0,0,0,0.1)' },
            grid: {
              color: 'rgba(0,0,0,0.05)',
              circular: true // Circular grid lines look more modern
            },
            pointLabels: {
              font: { size: 14, weight: 'bold' },
              color: '#444'
            },
            ticks: {
              backdropColor: 'transparent',
              stepSize: 20,
              font: { size: 12 }
            },
            suggestedMin: 0,
            suggestedMax: 100
          }
        }
      }
    });
  }
}
