import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
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
            <h2>Roadmap & Documentation</h2>
        </div>

        <mat-tab-group>
            <!-- TAB 1: ROADMAP -->
            <mat-tab label="Roadmap">
                <div class="tab-content">
                    <p class="tab-intro">Suivi des fonctionnalités futures et des améliorations techniques suggérées.</p>
                    
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
            </mat-tab>

            <!-- TAB 2: TECH DOCS -->
            <mat-tab label="Documentation Technique">
                <div class="tab-content doc-content">
                    <h3>Architecture Système</h3>
                    <div class="doc-card">
                        <div class="doc-row">
                            <span class="label">Frontend (Vercel):</span>
                            <span class="value">https://lat-lemon.vercel.app</span>
                        </div>
                        <div class="doc-row">
                            <span class="label">Backend (Render):</span>
                            <span class="value">https://elat.onrender.com</span>
                        </div>
                        <div class="doc-row">
                            <span class="label">Database:</span>
                            <span class="value">MongoDB Atlas</span>
                        </div>
                    </div>

                    <h3>Dépannage & Correctifs Récents</h3>
                    <div class="doc-section">
                        <h4>1. Erreurs de Connexion (504 / CORS)</h4>
                        <p>Si l'application affiche "Offline" ou des erreurs réseaux :</p>
                        <ul>
                            <li>Vérifier que l'URL API dans <code>environment.prod.ts</code> est bien <strong>https://elat.onrender.com</strong>.</li>
                            <li>Le backend sur Render peut s'endormir (Free Tier). La première requête peut prendre jusqu'à 50s.</li>
                            <li>CORS est configuré pour autoriser explicitement le domaine Vercel.</li>
                        </ul>

                        <h4>2. Base de Données</h4>
                        <p>Timeout de connexion configuré à <strong>5 secondes</strong> pour éviter que le serveur ne freeze indéfiniment si la DB est inaccessible.</p>

                        <h4>3. Interface Utilisateur</h4>
                        <p>Les boutons d'export (PDF, CSV) doivent être visibles sur fond bleu (Toolbar). S'ils disparaissent, vérifier qu'ils n'ont pas l'attribut <code>color="primary"</code>.</p>

                        <h4>4. Synchronisation & Conflits</h4>
                        <p>Le système gère automatiquement les conflits de données entre l'utilisateur et le serveur :</p>
                        <ul>
                            <li>Si une version serveur plus récente est détectée, elle écrase la version locale.</li>
                            <li>La version locale écrasée est <strong>sauvegardée</strong> en tant que "Copie de Conflit".</li>
                            <li>Ces copies sont accessibles via l'onglet <strong>Historique</strong> et peuvent être restaurées manuellement.</li>
                        </ul>
                    </div>

                    <h3>Maintenance</h3>
                    <div class="doc-section">
                        <p>Pour mettre à jour les données (Questions/Sections), utiliser le fichier JSON dans <code>assets/data/</code> ou l'interface Admin Config.</p>
                    </div>
                </div>
            </mat-tab>
        </mat-tab-group>
    </div>
  `,
    styles: [`
    .container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .header { margin-bottom: 16px; }
    .header h2 { margin-bottom: 8px; color: #333; }
    
    .tab-content { padding-top: 24px; }
    .tab-intro { color: #666; margin-bottom: 16px; }

    /* Doc Styles */
    .doc-content h3 { color: #3f51b5; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px; }
    .doc-content h4 { color: #333; margin-top: 16px; margin-bottom: 8px; font-weight: 600; }
    .doc-card { background: #f5f5f5; padding: 16px; border-radius: 8px; border-left: 4px solid #3f51b5; }
    .doc-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .doc-row .label { font-weight: 500; color: #555; }
    .doc-row .value { font-family: monospace; color: #333; }
    .doc-section ul { padding-left: 20px; line-height: 1.6; color: #444; }

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
