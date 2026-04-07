import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActionItem } from '../../../models/action-plan.model';
import { AdminService } from '../../../core/admin/admin.service';

@Component({
    selector: 'app-action-edit-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule
    ],
    providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }
    ],
    template: `
    <h2 mat-dialog-title>
        <mat-icon>edit</mat-icon> Éditer l'Action
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="edit-form">
        
        <!-- Read-only Context -->
        <div class="context-info">
            <strong>{{ data.category }}</strong>
            <p>{{ data.questionText }}</p>
        </div>

        <div class="row">
            <mat-form-field appearance="outline" class="col">
                <mat-label>Priorité</mat-label>
                <mat-select formControlName="priority">
                    <mat-option value="CRITICAL">CRITIQUE</mat-option>
                    <mat-option value="HIGH">HAUTE</mat-option>
                    <mat-option value="MEDIUM">MOYENNE</mat-option>
                    <mat-option value="LOW">BASSE</mat-option>
                </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col">
                <mat-label>Statut</mat-label>
                <mat-select formControlName="status">
                    <mat-option value="TODO">À FAIRE</mat-option>
                    <mat-option value="DOING">EN COURS</mat-option>
                    <mat-option value="DONE">FAIT</mat-option>
                </mat-select>
            </mat-form-field>
        </div>

        <div class="row">
            <mat-form-field appearance="outline" class="col">
                <mat-label>Début</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col">
                <mat-label>Échéance</mat-label>
                <input matInput [matDatepicker]="duePicker" formControlName="dueDate">
                <mat-datepicker-toggle matIconSuffix [for]="duePicker"></mat-datepicker-toggle>
                <mat-datepicker #duePicker></mat-datepicker>
            </mat-form-field>
        </div>

        <!-- Assign To User -->
        <mat-form-field appearance="outline" class="full-width">
            <mat-label>Assigner à (Utilisateur)</mat-label>
            <mat-select formControlName="assignedUser" (selectionChange)="onUserChange($event)">
                <mat-option [value]="null">-- Aucun --</mat-option>
                <mat-option *ngFor="let user of users()" [value]="user">
                    {{ user.name }} ({{ user.email }})
                </mat-option>
            </mat-select>
        </mat-form-field>

        <!-- Fallback / Manual Owner Name -->
        <mat-form-field appearance="outline" class="full-width">
            <mat-label>Responsable (Nom)</mat-label>
            <input matInput formControlName="owner" placeholder="Nom du responsable (ex: Log Base)">
            <mat-icon matSuffix>person</mat-icon>
            <mat-hint>Rempli automatiquement si un utilisateur est sélectionné</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
            <mat-label>Commentaires / Détails</mat-label>
            <textarea matInput formControlName="comments" rows="3"></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        Enregistrer
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .edit-form { display: flex; flex-direction: column; gap: 16px; padding-top: 10px; }
    .context-info { 
        background: #f5f5f5; 
        padding: 12px; 
        border-radius: 4px; 
        margin-bottom: 8px; 
        border-left: 4px solid #3f51b5;
    }
    .context-info strong { display: block; font-size: 0.8rem; text-transform: uppercase; color: #666; }
    .context-info p { margin: 4px 0 0; font-size: 0.9rem; }
    
    .row { display: flex; gap: 16px; }
    .col { flex: 1; }
    .full-width { width: 100%; }
  `]
})
export class ActionEditDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private adminService = inject(AdminService);

    public data = inject<any>(MAT_DIALOG_DATA); // Usage 'any' temporarily to handle extra fields safely
    public dialogRef = inject(MatDialogRef<ActionEditDialogComponent>);

    users = this.adminService.users;

    form = this.fb.group({
        priority: [this.data.priority, Validators.required],
        status: [this.data.status, Validators.required],
        startDate: [new Date(this.data.startDate), Validators.required],
        dueDate: [new Date(this.data.dueDate), Validators.required],
        owner: [this.data.owner || ''],
        comments: [this.data.comments || ''],
        assignedUser: [null as any] // Temporary holder for selection
    });

    ngOnInit() {
        // Load users if empty
        if (this.users().length === 0) {
            this.adminService.getUsers().subscribe();
        }

        // Try to pre-select user if we have an ID
        if (this.data.assignedToUserId) {
            // We need to wait for users to load or check if loaded
            // For now simple match if present
            const found = this.users().find(u => u.id === this.data.assignedToUserId);
            if (found) {
                this.form.patchValue({ assignedUser: found });
            }
        }
    }

    onUserChange(event: any) {
        const user = event.value;
        if (user) {
            this.form.patchValue({ owner: user.name });
        }
    }

    save() {
        if (this.form.valid) {
            const formVal = this.form.value;
            const selectedUser = formVal.assignedUser;

            const updatedAction = {
                ...this.data,
                priority: formVal.priority,
                status: formVal.status,
                startDate: new Date(formVal.startDate as any).toISOString(),
                dueDate: new Date(formVal.dueDate as any).toISOString(),
                owner: formVal.owner,
                comments: formVal.comments,
                assignedToUserId: selectedUser ? selectedUser.id : undefined,
                assignedToEmail: selectedUser ? selectedUser.email : undefined
            };

            this.dialogRef.close(updatedAction);
        }
    }
}
