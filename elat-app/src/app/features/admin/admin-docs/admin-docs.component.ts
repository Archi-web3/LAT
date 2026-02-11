import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
    selector: 'app-admin-docs',
    standalone: true,
    imports: [
        CommonModule,
        MatTabsModule,
        MatCardModule,
        MatIconModule,
        MatExpansionModule
    ],
    template: `
    <div class="docs-container">
      <h1>Documentation & Guide</h1>
      
      <mat-tab-group dynamicHeight>
        <!-- TAB 1: USER GUIDE -->
        <mat-tab label="Guide Utilisateur">
          <div class="tab-content">
            <mat-card>
                <mat-card-header>
                    <mat-card-title>1. Démarrage & Tableau de Bord</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                    <p>À votre connexion, vous arrivez sur le tableau de bord <strong>"My Assessments"</strong>.</p>
                    <ul>
                        <li><strong>Liste des Évaluations</strong> : Retrouvez ici toutes vos évaluations en cours (Brouillons) et passées.</li>
                        <li><strong>Reprendre</strong> : Cliquez sur <mat-icon inline>edit</mat-icon> "Continue" pour reprendre une évaluation là où vous l'avez laissée.</li>
                        <li><strong>Nouvelle Évaluation</strong> : Cliquez sur le bouton bleu "New Assessment".</li>
                        <li><strong>Contexte Intelligent</strong> : Chaque évaluation est isolée par <strong>Pays/Base/Mois</strong>. Vous pouvez gérer plusieurs bases en parallèle sans mélanger les données.</li>
                    </ul>
                </mat-card-content>
            </mat-card>

            <mat-card class="mt-2">
                <mat-card-header>
                    <mat-card-title>2. Remplir une évaluation</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                    <ul>
                        <li><strong>Navigation</strong> : Utilisez le menu de gauche pour passer d'une section à l'autre (ex: "Supply Chain", "Fleet").</li>
                        <li><strong>Réponses</strong> : Cochez <strong>Oui (1)</strong>, <strong>Non (0)</strong> ou <strong>N/A (-1)</strong>. La sauvegarde est automatique.</li>
                        <li><strong>Scores</strong> : Suivez votre progression (barres vertes) et votre score en temps réel en haut de l'écran.
                            <br><em>Le score est calculé sur la base des questions répondues. Les réponses <strong>N/A</strong> sont exclues du calcul (elles ne comptent pas dans le total possible).</em>
                        </li>
                        <li><strong>Reset</strong> : Le bouton "Reset" en haut à droite efface TOUTES les réponses de l'évaluation en cours. À utiliser avec précaution.</li>
                    </ul>
                </mat-card-content>
            </mat-card>

            <mat-card class="mt-2">
                <mat-card-header>
                    <mat-card-title>3. Rapports & Export</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                    <ul>
                        <li><strong>Matrix Dashboard</strong> : Vue d'ensemble avec Radar Chart interactif et "Score Report" global.</li>
                        <li><strong>Export CSV (Power BI)</strong> : Dans la barre d'outils, cliquez sur l'icône <mat-icon inline>file_download</mat-icon> pour télécharger les données brutes au format CSV. Ce fichier est optimisé pour l'import dans Power BI.</li>
                    </ul>
                </mat-card-content>
            </mat-card>

             <mat-card class="mt-2">
                <mat-card-header>
                    <mat-card-title>4. Administration (Super Admin)</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                    <p>En tant que Super Admin, vous avez accès à des menus exclusifs :</p>
                    <ul>
                        <li><strong>Gestion des Utilisateurs</strong> ...</li>
                        <li><strong>Configuration des Questions</strong> ...</li>
                    </ul>
                </mat-card-content>
            </mat-card>

            <mat-card class="mt-2">
                <mat-card-header>
                    <mat-card-title>5. Plan d'Action Correctif</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                    <p>Le module <strong>Action Plan</strong> transforme les résultats de l'évaluation en tâches concrètes.</p>
                    <ul>
                        <li><strong>Génération Automatique</strong> :
                            Un algorithme analyse vos scores et crée des actions pour chaque point faible.
                            <ul>
                                <li><strong style="color: #d32f2f">Priorité CRITIQUE</strong> : Score &lt; Seuil Critique (Défaut 50%). Échéance : +1 Mois.</li>
                                <li><strong style="color: #f57c00">Priorité ÉLEVÉE</strong> : Score &lt; Seuil Élevé (Défaut 80%). Échéance : +3 Mois.</li>
                            </ul>
                        </li>
                        <li><strong>Suivi</strong> : Assignez des responsables, modifiez les statuts (To Do / Doing / Done) et ajoutez des commentaires.</li>
                        <li><strong>Vue Gantt</strong> : Visualisez la planification temporelle de toutes les actions correctives.</li>
                        <li><strong>Configuration</strong> : Les seuils de priorité sont ajustables dans le menu <em>"Questions Config"</em>.</li>
                    </ul>
                </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- TAB 2: TECHNICAL GUIDE -->
        <mat-tab label="Documentation Technique">
           <div class="tab-content">
             <mat-accordion>
                <mat-expansion-panel expanded>
                    <mat-expansion-panel-header>
                        <mat-panel-title>Architecture (MEAN Stack)</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p>L'application repose sur une architecture moderne <strong>Full-Stack JavaScript</strong> :</p>
                    <ul>
                        <li><strong>Frontend (Angular 19)</strong> :
                            Interface utilisateur réactive (Single Page Application).
                            Utilise Angular Material pour le design.
                        </li>
                        <li><strong>Backend (Node.js + Express)</strong> :
                            API REST sécurisée servant les données.
                        </li>
                        <li><strong>Database (MongoDB Atlas)</strong> :
                            Base de données NoSQL hébergée dans le cloud (AWS Paris).
                            Flexibilité pour stocker les questionnaires dynamiques.
                        </li>
                    </ul>
                </mat-expansion-panel>

                <mat-expansion-panel>
                    <mat-expansion-panel-header>
                        <mat-panel-title>Stockage & Isolation</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                        <li><strong>Local Storage Dynamique</strong> : 
                            Chaque évaluation est stockée sous une clé unique : <code>elat-assessment-[PAYS]-[BASE]-[MOIS]</code>.
                        </li>
                        <li>Cela garantit l'isolation totale des données entre les contextes.</li>
                        <li>Le service <code>AssessmentService</code> gère dynamiquement le chargement/sauvegarde selon le contexte actif.</li>
                    </ul>
                </mat-expansion-panel>

                <mat-expansion-panel>
                    <mat-expansion-panel-header>
                        <mat-panel-title>Sécurité & Authentification</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                        <li><strong>JWT (JSON Web Token)</strong> : Utilisé pour sécuriser les échanges.</li>
                        <li><strong>Bcrypt</strong> : Mots de passe cryptés.</li>
                        <li><strong>RBAC</strong> : Contrôle d'accès basé sur les rôles (Middleware + Guards).</li>
                    </ul>
                </mat-expansion-panel>

                <mat-expansion-panel>
                    <mat-expansion-panel-header>
                        <mat-panel-title>Stratégie Hors Ligne (Offline)</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                        <li><strong>Local First</strong> : Données écrites prioritairement en local.</li>
                        <li><strong>Sync Service</strong> : Tente de synchroniser avec le backend dès que la connexion est disponible (<code>navigator.onLine</code>).</li>
                    </ul>
                </mat-expansion-panel>
             </mat-accordion>
           </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
    styles: [`
    .docs-container { padding: 20px; max-width: 1000px; margin: 0 auto; }
    .tab-content { padding: 20px; }
    h1 { margin-bottom: 20px; color: #3f51b5; }
    h3 { color: #3f51b5; margin-top: 16px; }
    ul { margin-bottom: 16px; list-style-type: disc; margin-left: 20px; }
    li { margin-bottom: 8px; line-height: 1.5; }
    .mt-2 { margin-top: 20px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
  `]
})
export class AdminDocsComponent { }
