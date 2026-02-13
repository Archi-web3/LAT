import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ActionPlanService } from '../../../services/action-plan.service';
import { AssessmentService } from '../../../services/assessment.service';
import { ActionItem } from '../../../models/action-plan.model';
import { ActionEditDialogComponent } from '../action-edit-dialog/action-edit-dialog.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { getCategoryColor } from '../../../core/constants/category-colors';

@Component({
    selector: 'app-action-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatTabsModule,
        MatChipsModule,
        MatTooltipModule,
        MatDialogModule,
        MatDialogModule,
        MatDialogModule,
        MatSnackBarModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        DragDropModule,
        DatePipe,
        RouterModule
    ],
    template: `
    <div class="dashboard-container">
      
      <!-- Compact Header & Toolbar -->
      <div class="compact-header mat-elevation-z1" *ngIf="currentContext() as ctx">
        
        <!-- Top Row: Nav, Title, Context, Toggles, Actions -->
        <div class="header-row top-row">
            <div class="flex-group">
                <button mat-icon-button routerLink="/assessment/list" matTooltip="Retour aux évaluations">
                    <mat-icon>arrow_back</mat-icon>
                </button>
                <h2>Plan d'Action</h2>
                
                <div class="mini-chips">
                    <span class="chip primary">📍 {{ ctx.country }}</span>
                    <span class="chip accent">🏢 {{ ctx.base }}</span>
                    <span class="chip">📅 {{ ctx.evaluationMonth }}</span>
                </div>
            </div>

            <div class="flex-group right">
                 <!-- View Toggles -->
                 <div class="toggle-group" *ngIf="plan()">
                    <button class="toggle-btn" [class.active]="viewMode() === 'LIST'" (click)="viewMode.set('LIST')">
                        <mat-icon class="small-icon">list</mat-icon> Liste
                    </button>
                    <button class="toggle-btn" [class.active]="viewMode() === 'GANTT'" (click)="viewMode.set('GANTT')">
                        <mat-icon class="small-icon">calendar_view_week</mat-icon> Gantt
                    </button>
                 </div>

                 <button mat-icon-button color="warn" (click)="generatePlan()" matTooltip="Régénérer le plan">
                    <mat-icon>refresh</mat-icon>
                </button>
            </div>
        </div>

        <!-- Second Row: Filters (Integrated) & Legend -->
        <div class="header-row filter-row" *ngIf="plan()">
            <div class="filters-group">
                <mat-icon class="filter-icon">filter_alt</mat-icon>
                
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="micro-field">
                    <mat-label>Priorité</mat-label>
                    <mat-select [ngModel]="filterPriority()" (ngModelChange)="filterPriority.set($event)" multiple>
                        <mat-option value="CRITICAL">CRITICAL</mat-option>
                        <mat-option value="HIGH">HIGH</mat-option>
                        <mat-option value="MEDIUM">MEDIUM</mat-option>
                        <mat-option value="LOW">LOW</mat-option>
                    </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="micro-field">
                    <mat-label>Catégorie</mat-label>
                    <mat-select [ngModel]="filterCategory()" (ngModelChange)="filterCategory.set($event)" multiple>
                        @for (cat of uniqueCategories(); track cat) {
                            <mat-option [value]="cat">{{ cat }}</mat-option>
                        }
                    </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="micro-field">
                    <mat-label>Responsable</mat-label>
                    <mat-select [ngModel]="filterOwner()" (ngModelChange)="filterOwner.set($event)" multiple>
                        <mat-option value="Unassigned">Non assigné</mat-option>
                        @for (owner of uniqueOwners(); track owner) {
                            <mat-option [value]="owner">{{ owner }}</mat-option>
                        }
                    </mat-select>
                </mat-form-field>

                <button mat-icon-button class="small-btn" (click)="resetFilters()" *ngIf="hasActiveFilters()" matTooltip="Reset">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <div class="legend-group" *ngIf="viewMode() === 'GANTT'">
                <div class="legend-item"><span class="dot done"></span> Fait</div>
                <div class="legend-item"><span class="dot doing"></span> En cours</div>
                <div class="legend-item"><span class="dot todo"></span> À faire</div>
            </div>
        </div>

      </div>

      <!-- State 1: No Plan -->
      <div *ngIf="!plan()" class="empty-state">
        <mat-icon class="large-icon">assignment_late</mat-icon>
        <h3>Aucun plan d'action généré.</h3>
        <p>Générez un plan pour commencer.</p>
        <button mat-raised-button color="primary" (click)="generatePlan()">
            <mat-icon>auto_awesome</mat-icon> Générer
        </button>
      </div>

      <!-- State 2: Plan Exists -->
      <div *ngIf="plan() as p" class="plan-content">
        
        <!-- Empty Actions State -->
        <div *ngIf="!p.actions || p.actions.length === 0" class="success-state">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h3>Tout est conforme !</h3>
        </div>

        <!-- LIST VIEW -->
        <div *ngIf="p.actions && p.actions.length > 0 && viewMode() === 'LIST'" class="view-content fade-in">
             <div class="table-container">
                    <table mat-table [dataSource]="sortedActions()" class="mat-elevation-z2">
                        <!-- Columns same as before -->
                        <ng-container matColumnDef="priority">
                            <th mat-header-cell *matHeaderCellDef> Priorité </th>
                            <td mat-cell *matCellDef="let action"> 
                                <span class="priority-badge" [class]="action.priority.toLowerCase()">
                                    {{ action.priority }}
                                </span>
                            </td>
                        </ng-container>

                        <ng-container matColumnDef="task">
                            <th mat-header-cell *matHeaderCellDef> Action </th>
                            <td mat-cell *matCellDef="let action">
                                <div class="task-info">
                                    <span class="category">{{ action.section || action.category }}</span>
                                    <span class="question">{{ action.questionText }}</span>
                                    <span class="owner" *ngIf="action.owner">👤 {{ action.owner }}</span>
                                </div>
                            </td>
                        </ng-container>

                        <ng-container matColumnDef="dates">
                            <th mat-header-cell *matHeaderCellDef> Dates </th>
                            <td mat-cell *matCellDef="let action">
                                <div class="date-col">
                                    <span>Du: {{ action.startDate | date:'dd/MM' }}</span>
                                    <span>Au: {{ action.dueDate | date:'dd/MM' }}</span>
                                </div>
                            </td>
                        </ng-container>

                        <ng-container matColumnDef="status">
                            <th mat-header-cell *matHeaderCellDef> Statut </th>
                            <td mat-cell *matCellDef="let action">
                                <div class="status-badge" [class]="action.status.toLowerCase()">
                                    {{ action.status }}
                                </div>
                            </td>
                        </ng-container>

                        <ng-container matColumnDef="actions">
                            <th mat-header-cell *matHeaderCellDef> Actions </th>
                            <td mat-cell *matCellDef="let action">
                                <button mat-icon-button color="primary" (click)="editAction(action)">
                                    <mat-icon>edit</mat-icon>
                                </button>
                                <a mat-icon-button *ngIf="action.proofLink" [href]="action.proofLink" target="_blank">
                                    <mat-icon>link</mat-icon>
                                </a>
                            </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>
                </div>
        </div>

        <!-- GANTT VIEW -->
        <div *ngIf="p.actions && p.actions.length > 0 && viewMode() === 'GANTT'" class="view-content fade-in">
             <div class="gantt-wrapper">
                 <!-- Gantt Chart Body (Controls moved to Header) -->
                 <div class="gantt-scroll-container">
                        <div class="gantt-grid" [style.grid-template-columns]="gridTemplateColumns()">
                            
                            <!-- Header Row -->
                            <div class="gantt-header-row" [style.grid-template-columns]="gridTemplateColumns()">
                                <div class="gantt-header-label" style="grid-column: 1;">Tâche</div>
                                @for (slot of timelineSlots(); track slot.date) {
                                    <div class="gantt-header-cell">
                                        <div class="week-num">S{{ slot.week }}</div>
                                        <div class="month-label" *ngIf="slot.isMonthStart">{{ slot.date | date:'MMM' }}</div>
                                    </div>
                                }
                            </div>

                            <!-- Body -->
                            <div class="gantt-body" cdkDropList 
                                 (cdkDropListDropped)="drop($event)"
                                 [cdkDropListDisabled]="hasActiveFilters()">
                                @for (action of sortedActions(); track action.id) {
                                    <div class="gantt-row-container" cdkDrag [style.grid-template-columns]="gridTemplateColumns()">
                                        <div class="gantt-custom-placeholder" *cdkDragPlaceholder></div>

                                        <!-- Label -->
                                        <div class="gantt-row-label" 
                                             style="grid-column: 1;"
                                             [style.border-left-color]="getCategoryColor(action.section || action.category || '')"
                                             [class.priority-critical]="action.priority === 'CRITICAL'">
                                            
                                            <div class="row-handle" cdkDragHandle *ngIf="!hasActiveFilters()">
                                                <mat-icon>drag_indicator</mat-icon>
                                            </div>

                                            <div class="row-content-wrapper">
                                                <div class="row-category" [style.color]="getCategoryColor(action.section || action.category || '')">
                                                    {{ action.section || action.category }}
                                                </div>
                                                <div class="row-title" matTooltip="{{ action.questionText }}">{{ action.questionText }}</div>
                                                <div class="row-meta" *ngIf="action.owner">👤 {{ action.owner }}</div>
                                            </div>
                                        </div>

                                        <!-- Bar -->
                                        <div class="gantt-bar-wrapper" 
                                             [style.grid-column]="getGridPlacement(action)"
                                             (click)="editAction(action)"
                                             matTooltip="{{ action.status }} - {{ action.owner }}">
                                            
                                            <div class="gantt-bar" [class]="cleanStatus(action.status)">
                                                <span class="bar-label">{{ action.owner || '?' }}</span>
                                            </div>
                                        </div>

                                        <!-- Grid Lines -->
                                        <div class="row-grid-lines" style="grid-column: 2 / -1;">
                                             @for (slot of timelineSlots(); track slot.date) {
                                                <div class="row-grid-line"></div>
                                             }
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                 </div>
             </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .dashboard-container { padding: 16px; margin: 0; max-width: 100%; height: calc(100vh - 80px); display: flex; flex-direction: column; overflow: hidden; }
    
    /* Compact Header */
    .compact-header {
        background: white; border-radius: 4px; padding: 8px 16px; margin-bottom: 12px;
        flex-shrink: 0;
    }
    .header-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .top-row { margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .filter-row { padding-top: 0; gap: 8px; align-items: center; }

    .flex-group { display: flex; align-items: center; gap: 12px; }
    .flex-group.right { margin-left: auto; }

    h2 { margin: 0; font-size: 1.25rem; white-space: nowrap; color: #333; }
    
    /* Mini Chips */
    .mini-chips { display: flex; gap: 6px; }
    .chip { 
        font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; background: #eee; color: #555; font-weight: 500; 
        display: flex; align-items: center; border: 1px solid #ddd;
    }
    .chip.primary { background: #e3f2fd; color: #1565c0; border-color: #bbdefb; }
    .chip.accent { background: #fff3e0; color: #ef6c00; border-color: #ffe0b2; }

    /* Toggle Group */
    .toggle-group { display: flex; background: #f5f5f5; border-radius: 4px; padding: 2px; }
    .toggle-btn {
        border: none; background: none; padding: 4px 12px; font-size: 0.8rem; cursor: pointer; border-radius: 3px;
        color: #666; font-weight: 500; display: flex; align-items: center; gap: 4px;
    }
    .toggle-btn.active { background: white; color: #3f51b5; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .small-icon { font-size: 16px; height: 16px; width: 16px; }

    /* Filter Styles */
    .filters-group { display: flex; align-items: center; gap: 8px; flex: 1; }
    .filter-icon { color: #888; font-size: 20px; margin-right: 4px; }
    
    .micro-field { width: 140px; font-size: 0.8rem; }
    ::ng-deep .micro-field .mat-mdc-text-field-wrapper { padding-top: 0; height: 32px; padding-bottom: 0; }
    ::ng-deep .micro-field .mat-mdc-form-field-infix { padding-top: 4px; padding-bottom: 0; border-top: 0; min-height: 32px; }
    ::ng-deep .micro-field .mat-mdc-form-field-flex { height: 32px; align-items: center; }

    .small-btn { width: 32px; height: 32px; line-height: 32px; padding: 0; }

    /* Legend */
    .legend-group { display: flex; gap: 12px; font-size: 0.75rem; margin-left: auto; align-items: center; }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot.done { background-color: #4caf50; }
    .dot.doing { background-color: #2196f3; }
    .dot.todo { background-color: #9e9e9e; }

    /* Plan Content - Fills remaining height */
    .plan-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
    .gantt-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0; margin: 0; box-shadow: none; border-radius: 0; }
    .gantt-scroll-container { flex: 1; overflow: auto; padding-bottom: 20px; }
    
    /* GANTT HEADER STICKY */
    .gantt-grid { position: relative; display: flex; flex-direction: column; width: 100%; min-width: fit-content; }
    
    .gantt-header-row {
        display: grid; /* RESTORED THIS */
        position: sticky; top: 0; z-index: 50; background: white; box-shadow: 0 2px 2px rgba(0,0,0,0.05);
        border-bottom: 2px solid #ddd;
    }
    
    .gantt-header-label { 
        font-weight: bold; padding: 8px; height: 40px; box-sizing: border-box; background: white;
        position: sticky; left: 0; z-index: 21; /* Sticky Header Label */
    }

    .gantt-header-cell { 
        text-align: center; border-left: 1px solid #eee; padding: 4px; font-size: 0.75rem; 
        background: #fafafa; height: 40px; box-sizing: border-box;
    }

    /* Draggable Row Container */
    .gantt-row-container {
        display: grid; /* Already here but confirming */
        position: relative;
        border-bottom: 1px solid #f0f0f0;
        background: white;
        transition: box-shadow 0.2s;
    }
    
    /* Hover effect for row */
    .gantt-row-container:hover { background: #fafafa; }
    .gantt-row-container:hover .row-handle { opacity: 1; }

    /* CDK Drag Styles */
    .cdk-drag-preview {
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        background: white;
        border-radius: 4px;
        opacity: 0.9;
        display: grid; /* Maintain grid in preview */
    }
    .cdk-drag-placeholder { opacity: 0; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
    .gantt-body.cdk-drop-list-dragging .gantt-row-container:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* Label Column */
    .gantt-row-label {
        position: sticky; left: 0; background: white; z-index: 10;
        padding: 4px 8px; border-right: 1px solid #eee;
        height: 60px;
        display: flex; align-items: center; /* Row layout */
        box-sizing: border-box;
        border-left: 4px solid transparent;
    }
    
    .row-handle {
        color: #bbb; cursor: grab; margin-right: 8px; opacity: 0; transition: opacity 0.2s;
    }
    .row-content-wrapper { flex: 1; overflow: hidden; }

    .row-category { font-size: 0.65rem; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; display: flex; justify-content: space-between; }
    
    .row-title { 
        font-size: 0.8rem; font-weight: 500; color: #333;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
    }

    /* Bar Wrapper */
    .gantt-bar-wrapper {
        height: 60px;
        position: relative;
        z-index: 5;
        cursor: pointer;
        display: flex; align-items: center; 
        padding: 0 4px;
        box-sizing: border-box;
    }

    .gantt-bar {
        height: 70%; 
        border-radius: 6px; display: flex; align-items: center; padding: 0 12px;
        color: white; font-size: 0.75rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        white-space: nowrap; overflow: hidden; gap: 6px;
        border: 1px solid rgba(255,255,255,0.2);
        text-shadow: 0 1px 2px rgba(0,0,0,0.3); /* Legibility */
    }

    /* Row Grid Lines */
    .row-grid-lines {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        display: grid; pointer-events: none; z-index: 0;
        grid-template-columns: subgrid; /* Requires CSS subgrid or repeat manually? Using manual repeat */
        grid-template-columns: repeat(52, 1fr); /* Fallback/Hack: We can't use dynamic repeat here easily without variable. 
           Actually, we can just use flex or repeated divs. 
           BETTER: Just absolute positioning lines if possible, or flex. 
           Let's use a background image for grid lines? No, we need alignment.
           Simple Fix: Flexbox with 100% width/count.
        */
        display: flex;
    }
    .row-grid-line { border-left: 1px dashed #eee; flex: 1; height: 100%; }

    /* Priority Badges (List View) */
    .priority-badge { font-size: 0.75rem; font-weight: bold; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
    .priority-badge.critical { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
    .priority-badge.high { background: #fff3e0; color: #ef6c00; border: 1px solid #ffe0b2; }
    .priority-badge.medium { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
    .priority-badge.low { background: #f1f8e9; color: #33691e; border: 1px solid #dcedc8; }

    /* Status Badges */
    .status-badge { font-size: 0.75rem; font-weight: 500; padding: 2px 8px; border-radius: 12px; display: inline-block; }
    .status-badge.doing { background: #e3f2fd; color: #1565c0; }
    .status-badge.todo { background: #f5f5f5; color: #666; }
    .status-badge.done { background: #e8f5e9; color: #2e7d32; }

    /* Fix Dropdown Alignment */
    ::ng-deep .micro-field .mat-mdc-text-field-wrapper { padding-top: 0 !important; height: 36px !important; padding-bottom: 0 !important; display: flex; align-items: center; }
    ::ng-deep .micro-field .mat-mdc-form-field-infix { padding-top: 0 !important; padding-bottom: 0 !important; border-top: 0; min-height: 36px !important; display: flex; align-items: center; }
    
    /* Make label persist correctly when floating */
    ::ng-deep .micro-field .mat-mdc-floating-label { top: 50% !important; transform: translateY(-50%) !important; }
    ::ng-deep .micro-field.mat-mdc-form-field-has-label .mat-mdc-floating-label.mdc-floating-label--float-above { 
        top: 0px !important; 
        transform: translateY(-0%) scale(0.75) !important; 
        opacity: 0.7;
    }
    
    /* When value selected, ensure it doesn't overlap header too much? Override standard behavior */

    /* List View Tweaks */
    .view-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; height: 100%; }
    .table-container { flex: 1; overflow: auto; padding-bottom: 16px; }

    .date-col { display: flex; flex-direction: column; gap: 2px; font-size: 0.8rem; white-space: nowrap; min-width: 90px; }
  `]
})

export class ActionDashboardComponent implements OnInit {
    actionService = inject(ActionPlanService);
    assessmentService = inject(AssessmentService);
    dialog = inject(MatDialog);
    snackBar = inject(MatSnackBar);

    plan = this.actionService.currentPlan;
    currentContext = this.assessmentService.context;

    displayedColumns = ['priority', 'task', 'dates', 'status', 'actions'];

    // View State
    viewMode = signal<'LIST' | 'GANTT'>('LIST');

    // Timeline State
    // Timeline State - Moved to bottom (computed)

    // Filters
    filterPriority = signal<string[]>([]);
    filterCategory = signal<string[]>([]);
    filterOwner = signal<string[]>([]);

    // Computed Options for Selects
    uniqueCategories = computed(() => {
        const actions = this.plan()?.actions || [];
        // Extract Categories from Sections or fallback text
        const cats = new Set(actions.map(a => a.section || a.category));
        return Array.from(cats).sort();
    });

    uniqueOwners = computed(() => {
        const actions = this.plan()?.actions || [];
        const owners = new Set(actions.map(a => a.owner).filter(o => !!o));
        return Array.from(owners).sort();
    });

    hasActiveFilters = computed(() => {
        return this.filterPriority().length > 0 ||
            this.filterCategory().length > 0 ||
            this.filterOwner().length > 0;
    });

    sortedActions = computed(() => {
        const p = this.plan();
        if (!p || !p.actions) return [];

        let filtered = [...p.actions];

        // Apply Priority Filter
        const priorities = this.filterPriority();
        if (priorities.length > 0) {
            filtered = filtered.filter(a => priorities.includes(a.priority));
        }

        // Apply Category Filter
        const categories = this.filterCategory();
        if (categories.length > 0) {
            filtered = filtered.filter(a => categories.includes(a.section || a.category || ''));
        }

        // Apply Owner Filter
        const owners = this.filterOwner();
        if (owners.length > 0) {
            filtered = filtered.filter(a => {
                const owner = a.owner; // can be undefined
                // If "Unassigned" selected, include undefined/null/empty
                if (owners.includes('Unassigned') && !owner) return true;
                return owner && owners.includes(owner);
            });
        }

        return filtered;
    });

    resetFilters() {
        this.filterPriority.set([]);
        this.filterCategory.set([]);
        this.filterOwner.set([]);
    }

    gridTemplateColumns = computed(() => {
        const count = this.timelineSlots().length;
        // First col 300px (Label), then count columns of 1fr (Weeks)
        return `300px repeat(${count}, minmax(40px, 1fr))`;
    });

    ngOnInit() {
        if (this.currentContext()) {
            this.actionService.loadPlan(this.currentContext());
        }
    }

    generatePlan() {
        if (confirm('Générer le plan d\'action va effacer les actions manuelles éventuelles. Continuer ?')) {
            this.actionService.initializePlanFromAssessment();
            // Optional: Reload logic handled by service signal update

            // Check count immediately from signal
            const p = this.plan();
            const count = p?.actions?.length || 0;

            if (count > 0) {
                this.snackBar.open(`Plan généré avec ${count} actions correctives.`, 'OK', { duration: 3000 });
            } else {
                this.snackBar.open('Aucune action générée (Scores > Seuils). Tout est conforme !', 'OK', { duration: 5000 });
            }
        }
    }

    editAction(action: ActionItem) {
        const dialogRef = this.dialog.open(ActionEditDialogComponent, {
            width: '600px',
            data: action
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('[DEBUG] Dialog closed. Received result:', result);
            if (result) {
                this.actionService.updateAction(result);
            }
        });
    }

    // --- Gantt Math ---

    // --- Category Colors ---
    getCategoryColor(category: string): string {
        return getCategoryColor(category);
    }

    // --- Drag & Drop ---
    drop(event: CdkDragDrop<ActionItem[]>) {
        // Create new array to trigger immutability (although moveItemInArray mutates, we spread)
        const currentActions = [...this.sortedActions()];
        moveItemInArray(currentActions, event.previousIndex, event.currentIndex);

        // Save new order via service
        this.actionService.reorderActions(currentActions);
    }

    // --- Gantt Math ---

    // --- Gantt Math ---

    // Computed Start Date (Anchored to Evaluation Month if possible)
    timelineStart = computed(() => {
        const ctx = this.currentContext();
        let startAnchor = new Date();

        if (ctx && ctx.evaluationMonth) {
            // Try parse "YYYY-MM"
            const parts = ctx.evaluationMonth.split('-');
            if (parts.length === 2) {
                startAnchor = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            }
        } else {
            // Fallback to min action date
            const actions = this.plan()?.actions || [];
            if (actions.length > 0) {
                let minT = new Date(actions[0].startDate).getTime();
                actions.forEach(a => {
                    const t = new Date(a.startDate).getTime();
                    if (t < minT) minT = t;
                });
                startAnchor = new Date(minT);
            }
        }

        // Buffer: Start 1 week before the anchor
        const start = new Date(startAnchor);
        start.setDate(start.getDate() - 7);

        // Align to Monday
        const day = start.getDay();
        const diff = start.getDate() - day + (day == 0 ? -6 : 1);
        start.setDate(diff);

        return start;
    });

    // Computed End Date
    timelineEnd = computed(() => {
        const actions = this.plan()?.actions || [];
        const start = this.timelineStart();

        // Default end: Start + 3 months
        let maxT = new Date(start).getTime() + (1000 * 60 * 60 * 24 * 90);

        // Or max action date if later
        actions.forEach(a => {
            const d = new Date(a.dueDate).getTime();
            if (d > maxT) maxT = d;
        });

        const end = new Date(maxT);
        end.setDate(end.getDate() + 14); // Buffer
        return end;
    });

    // Computed Slots generated from Start/End
    timelineSlots = computed(() => {
        const start = new Date(this.timelineStart());
        const end = this.timelineEnd();

        const slots = [];
        const current = new Date(start);

        let iterations = 0;
        while (current <= end && iterations < 52) {
            slots.push({
                date: new Date(current),
                week: this.getWeekNumber(current),
                isMonthStart: current.getDate() <= 7
            });
            current.setDate(current.getDate() + 7);
            iterations++;
        }
        return slots;
    });

    // Helper for visual status class
    cleanStatus(status: string): string {
        if (!status) return 'default';
        const s = status.trim().toLowerCase();
        if (s.includes('todo') || s.includes('faire')) return 'todo';
        if (s.includes('doing') || s.includes('cours')) return 'doing';
        if (s.includes('done') || s.includes('fait')) return 'done';
        return 'default';
    }

    getGridPlacement(action: ActionItem): string {
        const slots = this.timelineSlots();
        if (slots.length === 0) return 'grid-column: 1';

        const start = new Date(action.startDate);
        const due = new Date(action.dueDate);
        const tlStart = this.timelineStart();

        const oneWeekMs = 1000 * 60 * 60 * 24 * 7;

        let startDiff = (start.getTime() - tlStart.getTime()) / oneWeekMs;
        let durDiff = (due.getTime() - start.getTime()) / oneWeekMs;

        // Visual fix: If duration is 0 (same day), force at least 0.5 week visual
        if (durDiff < 0.2) durDiff = 0.5;

        // Columns start at 2 (1 is Label)
        // Floor start to align with weeks, but allow partial starts visually if we wanted (here strict grid)
        const colStart = Math.max(2, Math.floor(startDiff) + 2);
        const span = Math.max(1, Math.ceil(durDiff));

        // Debug first action to spam less
        // Log specific action to debug movement
        if (action.questionText && action.questionText.includes('matrice')) {
            console.log(`[DEBUG] Grid Action: ${action.questionText?.substring(0, 15)} | Status: ${action.status} | Start: ${action.startDate} | Grid: ${colStart}`);
        }

        return `${colStart} / span ${span}`;
    }

    private getWeekNumber(d: Date): number {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return weekNo;
    }
}
