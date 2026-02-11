import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { AssessmentService } from '../../../services/assessment.service';
import { AssessmentSection, AssessmentQuestion } from '../../../models/assessment.model';
import { AdminConfig, DEFAULT_CONFIG } from '../../../models/admin-config.model';
import { AdminService } from '../../../core/admin/admin.service';

@Component({
    selector: 'app-admin-config',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatExpansionModule,
        MatIconModule,
        MatSnackBarModule,
        MatTabsModule,
        MatChipsModule,
        MatSelectModule
    ],
    template: `
    <div class="container">
      <h2>Admin Configuration</h2>
      <p>Manage assessment content, translations, and settings.</p>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="saveConfiguration()">
            <mat-icon>save</mat-icon> Save Changes
        </button>
        <button mat-button color="warn" (click)="resetToDefaults()">
            <mat-icon>restore</mat-icon> Reset to Defaults
        </button>
      </div>

      <mat-tab-group [(selectedIndex)]="selectedTabIndex">
        <!-- TAB 1: QUESTIONS & STRUCTURE -->
        <mat-tab label="Structures & Questions">
            <div class="tab-content">
                <mat-form-field appearance="outline" class="full-width search-bar">
                    <mat-label>Search Questions (ID, Text, Category)</mat-label>
                    <input matInput [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Type 'Général' to find general questions...">
                    <mat-icon matSuffix>search</mat-icon>
                    <button *ngIf="searchTerm()" matSuffix mat-icon-button aria-label="Clear" (click)="searchTerm.set('')">
                        <mat-icon>close</mat-icon>
                    </button>
                </mat-form-field>

                <mat-accordion multi>
                @for (section of sections(); track section.id) {
                <mat-expansion-panel [expanded]="searchTerm().length > 0">
                    <mat-expansion-panel-header>
                    <mat-panel-title>
                        <strong>{{ section.title }}</strong>
                    </mat-panel-title>
                    <mat-panel-description>
                        {{ section.questions.length }} Questions
                    </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="section-edit" *ngIf="searchTerm().length === 0">
                        <div class="dual-input">
                            <mat-form-field appearance="outline" class="half-width">
                                <mat-label>Titre Section (FR)</mat-label>
                                <input matInput [(ngModel)]="section.title">
                            </mat-form-field>
                            <mat-form-field appearance="outline" class="half-width">
                                <mat-label>Section Title (EN)</mat-label>
                                <input matInput [(ngModel)]="section.title_en">
                            </mat-form-field>
                        </div>
                    </div>

                    <div class="questions-list">
                        @for (q of section.questions; track q.id; let i = $index) {
                            <!-- FILTERING LOGIC -->
                            @if (doesQuestionMatch(q)) {
                                <div class="question-item">
                                    <div class="q-header">
                                        <span class="q-id">{{ q.id }}</span>
                                        <div class="q-meta">
                                            <span class="badge">{{ q.responseType }}</span>
                                            <span class="badge category">{{ q.category }}</span>
                                        </div>
                                        <button mat-icon-button color="warn" (click)="removeQuestion(section, i)" matTooltip="Remove Question">
                                            <mat-icon>delete</mat-icon>
                                        </button>
                                    </div>
                                    
                                    <div class="q-body">
                                        <div class="dual-input">
                                            <mat-form-field appearance="outline" class="half-width">
                                                <mat-label>Question (FR)</mat-label>
                                                <textarea matInput [(ngModel)]="q.text" rows="3"></textarea>
                                            </mat-form-field>
                                            <mat-form-field appearance="outline" class="half-width">
                                                <mat-label>Question (EN)</mat-label>
                                                <textarea matInput [(ngModel)]="q.text_en" rows="3"></textarea>
                                            </mat-form-field>
                                        </div>

                                        <div class="dual-input">
                                            <mat-form-field appearance="outline" class="half-width">
                                                <mat-label>Categorie (Clé/FR)</mat-label>
                                                <input matInput [(ngModel)]="q.category">
                                            </mat-form-field>
                                             <mat-form-field appearance="outline" class="half-width">
                                                <mat-label>Category (EN)</mat-label>
                                                <input matInput [(ngModel)]="q.category_en">
                                            </mat-form-field>
                                        </div>

                                        <mat-form-field appearance="outline" class="full-width">
                                            <mat-label>Expertises Transversales</mat-label>
                                            <mat-select multiple [(ngModel)]="q.transversalTags">
                                                @for (exp of config().transversalExpertises; track exp.id) {
                                                    <mat-option [value]="exp.label_fr">{{ exp.label_fr }}</mat-option>
                                                }
                                            </mat-select>
                                        </mat-form-field>

                                        <mat-form-field appearance="outline" class="q-weight">
                                            <mat-label>Weight</mat-label>
                                            <input matInput type="number" [(ngModel)]="q.weight" step="0.5">
                                        </mat-form-field>
                                    </div>
                                </div>
                            }
                        }
                        
                        <button mat-stroked-button (click)="addQuestion(section)" *ngIf="searchTerm().length === 0">
                            <mat-icon>add</mat-icon> Add Question
                        </button>
                    </div>

                </mat-expansion-panel>
                }
                </mat-accordion>
            </div>
        </mat-tab>

        <!-- TAB 2: CATEGORIES -->
        <mat-tab label="Catégories Logistique">
            <div class="tab-content">
                <p class="hint">Gérez les traductions des catégories logistiques. Sauvegarder appliquera ces changements à toutes les questions.</p>
                
                <table class="config-table">
                    <thead>
                        <tr>
                            <th>Catégorie (FR)</th>
                            <th>Traduction (EN)</th>
                            <th>Questions liées</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (cat of categories(); track cat.original) {
                            <tr>
                                <td>
                                    <mat-form-field appearance="outline" class="dense">
                                        <input matInput [(ngModel)]="cat.fr">
                                    </mat-form-field>
                                </td>
                                <td>
                                    <mat-form-field appearance="outline" class="dense">
                                        <input matInput [(ngModel)]="cat.en" placeholder="No translation">
                                    </mat-form-field>
                                </td>
                                <td>
                                    <a href="javascript:void(0)" (click)="filterByCategory(cat.original)" style="color: #3f51b5; font-weight: bold; text-decoration: none;">
                                        {{ cat.count }} questions
                                    </a>
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        </mat-tab>

        <!-- TAB 3: RESPONSE TYPES -->
        <mat-tab label="Types de Réponse">
             <div class="tab-content">
                <p class="hint">Traduisez les options pour chaque type de réponse standard.</p>
                
                <div class="response-types-list">
                    @for (type of responseTypes(); track type.name) {
                        <div class="response-type-card">
                            <h4>{{ type.name }}</h4>
                            <div class="options-grid">
                                @for (opt of type.options; track opt.value) {
                                    <div class="opt-row">
                                        <div class="opt-val" [style.color]="opt.color" [style.font-size]="opt.value === -1 ? '0.8rem' : 'inherit'">
                                            {{ opt.value === -1 ? 'Exclu' : opt.value }}
                                        </div>
                                        <mat-form-field appearance="outline" class="dense">
                                            <mat-label>Label (FR)</mat-label>
                                            <input matInput [(ngModel)]="opt.label">
                                        </mat-form-field>
                                        <mat-form-field appearance="outline" class="dense">
                                            <mat-label>Label (EN)</mat-label>
                                            <input matInput [(ngModel)]="opt.label_en">
                                        </mat-form-field>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                </div>
             </div>
        </mat-tab>
        
        <!-- TAB 4: SETTINGS -->
        <mat-tab label="Settings">
             <div class="tab-content">
                <h3>Règles de Priorité (Plan d'Action)</h3>
                <div class="threshold-inputs">
                    <mat-form-field appearance="outline">
                        <mat-label>Seuil Critique (%)</mat-label>
                        <input matInput type="number" [(ngModel)]="config().priorityThresholds.critical" min="0" max="100">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                        <mat-label>Seuil Élevé (%)</mat-label>
                        <input matInput type="number" [(ngModel)]="config().priorityThresholds.high" min="0" max="100">
                    </mat-form-field>
                </div>
            </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
    styles: [`
    .container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .actions { margin-bottom: 24px; display: flex; gap: 16px; }
    .full-width { width: 100%; }
    .half-width { width: 48%; }
    .dual-input { display: flex; gap: 4%; width: 100%; }
    
    .tab-content { padding-top: 24px; }
    .hint { color: #666; margin-bottom: 16px; font-style: italic; }

    .question-item {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .q-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
    }
    .q-id { font-weight: bold; color: #555; background: #eee; padding: 2px 8px; border-radius: 4px; }
    .badge { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-right: 8px; }
    .badge.category { background: #e0f2f1; color: #00695c; }
    
    .q-body { display: flex; flex-direction: column; gap: 8px; }
    
    /* Tables */
    .config-table { width: 100%; border-collapse: collapse; }
    .config-table th { text-align: left; padding: 12px; background: #f5f5f5; border-bottom: 2px solid #ddd; }
    .config-table td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: middle; }
    
    /* Response Types */
    .response-types-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 24px; }
    .response-type-card { background: #fafafa; border: 1px solid #eee; padding: 16px; border-radius: 8px; }
    .response-type-card h4 { margin: 0 0 16px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    .opt-row { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
    .opt-val { font-weight: bold; width: 30px; }
    .dense { margin-bottom: -16px; font-size: 0.9rem; width: 100%; }

    .threshold-inputs { display: flex; gap: 24px; }
  `]
})
export class AdminConfigComponent {
    assessmentService = inject(AssessmentService);
    adminService = inject(AdminService);
    snackBar = inject(MatSnackBar);

    sections = signal<AssessmentSection[]>(JSON.parse(JSON.stringify(this.assessmentService.sections())));
    config = signal<AdminConfig>(this.loadConfig());

    // Computed for UI
    categories = signal<{ original: string, fr: string, en: string, count: number }[]>([]);
    responseTypes = signal<{ name: string, options: any[] }[]>([]);

    // Filter
    searchTerm = signal<string>('');
    selectedTabIndex = signal<number>(0);

    constructor() {
        this.extractMetadata();
        this.loadFromBackend();
    }

    loadFromBackend() {
        this.adminService.getConfig().subscribe({
            next: (data) => {
                if (data) {
                    if (data.sections && data.sections.length > 0) {
                        this.sections.set(data.sections);
                    }
                    if (data.settings) {
                        this.config.set(data.settings);
                    }
                    this.extractMetadata();
                    console.log('Admin Config loaded from Cloud');
                }
            },
            error: (err) => console.error('Failed to load cloud config', err)
        });
    }

    loadConfig(): AdminConfig {
        const saved = localStorage.getItem('elat-admin-config');
        return saved ? JSON.parse(saved) : { ...DEFAULT_CONFIG };
    }

    extractMetadata() {
        const cats = new Map<string, { fr: string, en: string, count: number }>();
        const types = new Map<string, any[]>(); // name -> options

        this.sections().forEach(s => {
            s.questions.forEach(q => {
                // Categories
                if (!cats.has(q.category)) {
                    cats.set(q.category, { fr: q.category, en: q.category_en || '', count: 0 });
                }
                const c = cats.get(q.category)!;
                c.count++;

                if (!q.transversalTags) {
                    q.transversalTags = [];
                }

                // Response Types
                if (q.responseType && q.options && q.options.length > 0) {
                    if (!types.has(q.responseType)) {
                        // Deep copy options so we can edit them independently initially
                        types.set(q.responseType, JSON.parse(JSON.stringify(q.options)));
                    }
                }
            });
        });

        this.categories.set(Array.from(cats.entries()).map(([k, v]) => ({ original: k, ...v })));
        this.responseTypes.set(Array.from(types.entries()).map(([k, v]) => ({ name: k, options: v })));
    }

    saveConfiguration() {
        const sections = this.sections();

        // 1. Bulk Update Categories
        this.categories().forEach(cat => {
            sections.forEach(s => {
                s.questions.forEach(q => {
                    if (q.category === cat.original) {
                        q.category = cat.fr;
                        q.category_en = cat.en;
                    }
                });
            });
        });

        // 2. Bulk Update Response Types
        this.responseTypes().forEach(type => {
            sections.forEach(s => {
                s.questions.forEach(q => {
                    if (q.responseType === type.name) {
                        q.options?.forEach((qOpt, idx) => {
                            const masterOpt = type.options[idx];
                            if (masterOpt) {
                                qOpt.label = masterOpt.label;
                                qOpt.label_en = masterOpt.label_en;
                            }
                        });
                    }
                });
            });
        });

        // Save
        this.assessmentService.sections.set(sections);
        localStorage.setItem('elat-config-sections', JSON.stringify(sections));
        localStorage.setItem('elat-admin-config', JSON.stringify(this.config()));

        this.adminService.saveConfig({
            sections: sections,
            settings: this.config()
        }).subscribe({
            next: () => this.snackBar.open('Configuration saved successfully!', 'Close', { duration: 3000 }),
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error saving to Cloud. Saved locally only.', 'Close', { duration: 3000 });
            }
        });

        this.extractMetadata();
    }

    resetToDefaults() {
        if (confirm('Reset all questions to default JSON? Any custom changes will be lost.')) {
            localStorage.removeItem('elat-config-sections');
            window.location.reload();
        }
    }

    addQuestion(section: AssessmentSection) {
        const newId = section.id + '.' + (section.questions.length + 1);
        section.questions.push({
            id: newId,
            text: 'New Question',
            weight: 1,
            category: 'General',
            category_en: 'General',
            responseType: 'Échelle de conformité',
            transversalTags: [],
            options: []
        });
    }

    removeQuestion(section: AssessmentSection, index: number) {
        if (confirm('Delete this question?')) {
            section.questions.splice(index, 1);
        }
    }

    // --- Filtering Logic ---
    doesQuestionMatch(q: AssessmentQuestion): boolean {
        const term = this.searchTerm().toLowerCase();
        if (!term) return true;

        const textMatch = q.text?.toLowerCase().includes(term) ?? false;
        const catMatch = q.category?.toLowerCase().includes(term) ?? false;
        const idMatch = q.id?.toLowerCase().includes(term) ?? false;

        return textMatch || catMatch || idMatch;
    }

    filterByCategory(category: string) {
        this.searchTerm.set(category);
        this.selectedTabIndex.set(0); // Switch to Structure tab
        this.snackBar.open(`Filtering by category: ${category}`, 'Close', { duration: 2000 });
    }

    addTag(question: AssessmentQuestion, event: any) {
        const value = (event.value || '').trim();
        if (value) {
            if (!question.transversalTags) {
                question.transversalTags = [];
            }
            question.transversalTags.push(value);
        }
        event.chipInput!.clear();
    }

    removeTag(question: AssessmentQuestion, tag: string) {
        const index = question.transversalTags.indexOf(tag);
        if (index >= 0) {
            question.transversalTags.splice(index, 1);
        }
    }

    // --- Expertises Dictionary Management ---
    addExpertise() {
        if (!this.config().transversalExpertises) {
            this.config().transversalExpertises = [];
        }
        this.config().transversalExpertises.push({
            id: 'new-' + Date.now(),
            label_fr: 'Nouvelle Expertise',
            label_en: ''
        });
    }

    removeExpertise(index: number) {
        if (confirm('Supprimer cette expertise ? Cela ne la retirera pas des questions existantes mais elle ne sera plus proposée.')) {
            this.config().transversalExpertises.splice(index, 1);
        }
    }
}
