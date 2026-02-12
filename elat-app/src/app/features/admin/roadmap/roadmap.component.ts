import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { AdminService } from '../../../core/admin/admin.service';
import { RoadmapItem } from '../../../models/admin-config.model';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-roadmap',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatTabsModule,
        FormsModule
    ],
    template: `
    <div class="container">
        <div class="header">
            <h2>Roadmap & Améliorations</h2>
            <p>Suivi des fonctionnalités futures et des améliorations techniques suggérées.</p>
        </div>

        <!-- Progress -->
        <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress()"></div>
        </div>
        <div class="progress-text">{{ completedCount() }} / {{ totalCount() }} tâches complétées ({{ progress() }}%)</div>

        <div class="roadmap-list">
            @for (item of roadmapItems(); track item.id) {
                <div class="roadmap-item" [class.done]="item.status === 'DONE'">
                    <div class="item-header">
                        <mat-checkbox 
                            [checked]="item.status === 'DONE'" 
                            (change)="toggleStatus(item)" 
                            color="primary">
                        </mat-checkbox>
                        <div class="item-content">
                            <div class="title-row">
                                <span class="item-title">{{ item.title }}</span>
                                <span class="badge" [class]="item.category">{{ item.category }}</span>
                            </div>
                            <div class="item-desc">{{ item.description }}</div>
                        </div>
                    </div>
                </div>
            }
        </div>
        
        <div class="actions">
             <button mat-raised-button color="primary" (click)="save()">
                <mat-icon>save</mat-icon> Enregistrer la Roadmap
            </button>
        </div>

    </div>
  `,
    styles: [`
    .container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    .header h2 { margin-bottom: 8px; color: #333; }
    .header p { color: #666; }

    .progress-bar { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
    .progress-fill { height: 100%; background: #4caf50; transition: width 0.3s ease; }
    .progress-text { text-align: right; font-size: 0.9rem; color: #666; margin-bottom: 24px; font-weight: 500; }

    .roadmap-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
    .roadmap-item { 
        background: white; 
        padding: 16px; 
        border-radius: 8px; 
        border: 1px solid #e0e0e0;
        transition: all 0.2s;
    }
    .roadmap-item.done {
        background: #f9f9f9;
        opacity: 0.8;
    }
    .roadmap-item.done .item-title { text-decoration: line-through; color: #888; }
    
    .item-header { display: flex; align-items: flex-start; gap: 12px; }
    .item-content { flex: 1; }
    
    .title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .item-title { font-weight: 600; font-size: 1.1rem; color: #333; }
    
    .badge { 
        font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: bold; text-transform: uppercase; 
    }
    .badge.TECH { background: #e3f2fd; color: #1565c0; }
    .badge.FEATURE { background: #e8f5e9; color: #2e7d32; }
    .badge.UX { background: #fce4ec; color: #c2185b; }

    .item-desc { color: #555; line-height: 1.4; font-size: 0.95rem; margin-top: 4px; }

    .actions { display: flex; justify-content: flex-end; }
  `]
})
export class RoadmapComponent {
    adminService = inject(AdminService);

    // Local copy of items for editing
    roadmapItems = signal<RoadmapItem[]>([]);

    constructor() {
        effect(() => {
            const config = this.adminService.config();
            if (config && config.roadmap) {
                this.roadmapItems.set(JSON.parse(JSON.stringify(config.roadmap)));
            }
        });
    }

    toggleStatus(item: RoadmapItem) {
        this.roadmapItems.update(items =>
            items.map(i => i.id === item.id ? { ...i, status: i.status === 'TODO' ? 'DONE' : 'TODO' } : i)
        );
    }

    progress() {
        const total = this.roadmapItems().length;
        if (total === 0) return 0;
        const done = this.roadmapItems().filter(i => i.status === 'DONE').length;
        return Math.round((done / total) * 100);
    }

    totalCount() { return this.roadmapItems().length; }
    completedCount() { return this.roadmapItems().filter(i => i.status === 'DONE').length; }

    save() {
        const currentConfig = this.adminService.config();
        if (currentConfig) {
            const newConfig = { ...currentConfig, roadmap: this.roadmapItems() };
            this.adminService.saveConfig(newConfig).subscribe({
                next: () => alert('Roadmap updated successfully!'),
                error: (err) => alert('Failed to save roadmap.')
            });
        }
    }
}
