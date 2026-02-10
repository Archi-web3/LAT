import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AssessmentService } from '../../../services/assessment.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-history-view',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
  template: `
    <div class="history-container">
      <div class="header-actions">
           <button mat-button routerLink="/assessment">
              <mat-icon>arrow_back</mat-icon> Back to Assessment
           </button>
           <h2>Assessment History</h2>
      </div>
      
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>

      <div class="list-container">
        <h3>Past Assessments</h3>
        <ul>
          <li *ngFor="let item of history">
            <span class="date">{{ item.date | date:'medium' }}</span>
            <span class="name">{{ item.name }}</span>
            <span class="score" [class.good]="item.score >= 80" [class.warn]="item.score < 50">
                {{ item.score }}%
            </span>
          </li>
        </ul>
        <p *ngIf="history.length === 0">No history available yet.</p>
      </div>
      
      <div class="actions">
        <button (click)="saveCurrent()" class="save-btn">Save Current Assessment</button>
        <button (click)="exportToCSV()" class="export-btn">Export for Power BI (CSV)</button>
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    .chart-container {
      height: 300px;
      margin-bottom: 32px;
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .list-container ul {
      list-style: none;
      padding: 0;
    }
    .list-container li {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .score {
      font-weight: bold;
    }
    .score.good { color: green; }
    .score.warn { color: red; }
    .actions { margin-top: 24px; display: flex; gap: 16px; }
    button {
       padding: 10px 20px;
       border: none;
       border-radius: 4px;
       cursor: pointer;
       font-weight: 500;
    }
    .save-btn { background: #1976d2; color: white; }
    .save-btn:hover { background: #1565c0; }
    
    .export-btn { background: #2e7d32; color: white; }
    .export-btn:hover { background: #1b5e20; }
  `]
})
export class HistoryViewComponent implements OnInit, AfterViewInit {
  assessmentService = inject(AssessmentService);
  history: any[] = [];

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart: any;

  ngOnInit() {
    this.history = this.assessmentService.getHistory();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  initChart() {
    if (!this.chartCanvas || this.history.length === 0) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Sort by date
    const sortedHistory = [...this.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedHistory.map(h => new Date(h.date).toLocaleDateString()),
        datasets: [{
          label: 'Global Compliance Score',
          data: sortedHistory.map(h => h.score),
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  saveCurrent() {
    this.assessmentService.saveAssessmentSnapshot('Manual Save');
    this.history = this.assessmentService.getHistory();
    if (this.chart) {
      this.chart.destroy();
    }
    this.initChart();
  }

  exportToCSV() {
    if (this.history.length === 0) return;

    // Normalized format for Power BI: One row per answer
    // Columns: AssessmentID, Date, Section, QuestionID, QuestionText, Category, AnswerValue, AnswerLabel, Comment

    const headers = ['AssessmentID', 'Date', 'Name', 'Score', 'Section', 'QuestionID', 'Question', 'Category', 'AnswerValue', 'Comment'];
    let csvContent = headers.join(',') + '\n';

    const sections = this.assessmentService.sections();

    this.history.forEach(assessment => {
      sections.forEach(section => {
        section.questions.forEach(q => {
          const answerVal = assessment.answers[q.id];
          const comment = assessment.comments?.[q.id] || ''; // Comments needed in snapshot too actually

          // Only include answered questions or all? Let's include all for completeness or just answered.
          // Power BI prefers consistent datasets.

          if (answerVal !== undefined) {
            const row = [
              assessment.id,
              assessment.date,
              `"${assessment.name}"`,
              assessment.score,
              `"${section.title}"`,
              q.id,
              `"${q.text.replace(/"/g, '""')}"`,
              `"${q.category}"`,
              answerVal,
              `"${comment.replace(/"/g, '""')}"`
            ];
            csvContent += row.join(',') + '\n';
          }
        });
      });
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `elat_export_pbi_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
