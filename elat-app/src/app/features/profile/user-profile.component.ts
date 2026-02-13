import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule
    ],
    template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
            <mat-card-title>Change Password</mat-card-title>
        </mat-card-header>
        <mat-card-content>
            <form (ngSubmit)="changePassword()">
                <div class="form-col">
                    <mat-form-field appearance="outline">
                        <mat-label>Current Password</mat-label>
                        <input matInput type="password" [(ngModel)]="passwords.current" name="current" required>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                        <mat-label>New Password</mat-label>
                        <input matInput type="password" [(ngModel)]="passwords.new" name="new" required>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                        <mat-label>Confirm New Password</mat-label>
                        <input matInput type="password" [(ngModel)]="passwords.confirm" name="confirm" required>
                    </mat-form-field>
                </div>

                <div class="actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="!passwords.current || !passwords.new">
                        Update Password
                    </button>
                </div>
            </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .profile-container { padding: 20px; display: flex; justify-content: center; }
    .profile-card { width: 100%; max-width: 500px; padding: 20px; }
    .form-col { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
    .actions { margin-top: 20px; display: flex; justify-content: flex-end; }
  `]
})
export class UserProfileComponent {
    authService = inject(AuthService);

    passwords = {
        current: '',
        new: '',
        confirm: ''
    };

    changePassword() {
        if (this.passwords.new !== this.passwords.confirm) {
            alert('New passwords do not match');
            return;
        }

        this.authService.changePassword({
            currentPassword: this.passwords.current,
            newPassword: this.passwords.new
        }).subscribe({
            next: (res) => {
                alert(res.msg);
                this.passwords = { current: '', new: '', confirm: '' };
            },
            error: (err) => {
                alert('Failed to update password: ' + (err.error?.msg || err.message));
            }
        });
    }
}
