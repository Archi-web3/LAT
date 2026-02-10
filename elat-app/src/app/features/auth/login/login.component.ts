import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslatePipe
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header class="centered-header">
          <div class="logo-container">
            <img src="/assets/logo-full-transparent.png" alt="ACF" class="login-logo">
          </div>
          <h1>ELAT</h1>
        </mat-card-header>
        
        <mat-card-content>
        
          <!-- Lang Switcher -->
          <div class="lang-switcher">
            <button mat-button [class.active]="translationService.currentLang() === 'EN'" (click)="setLang('EN')">EN</button>
            <span class="divider">|</span>
            <button mat-button [class.active]="translationService.currentLang() === 'FR'" (click)="setLang('FR')">FR</button>
          </div>

          <form (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'LOGIN.EMAIL_LABEL' | translate }}</mat-label>
              <input matInput [(ngModel)]="email" name="email" required>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'LOGIN.PASSWORD_LABEL' | translate }}</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required>
            </mat-form-field>
            
            <p class="error" *ngIf="error()">{{ error() }}</p>

            <div class="actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="loading()">
                    {{ loading() ? ('COMMON.LOADING' | translate) : ('LOGIN.BUTTON' | translate) }}
                </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: #f5f5f5;
    }
    .login-card {
        width: 100%;
        max-width: 400px;
        padding: 16px;
    }
    .centered-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
    }
    .logo-container {
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
    }
    .login-logo {
        max-width: 150px;
        height: auto;
        object-fit: contain;
    }
    h1 {
        margin: 0;
        font-size: 32px; /* Bigger */
        color: rgb(0, 95, 182); /* Specific Blue */
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; /* Nice font */
        font-weight: 700;
        letter-spacing: 1px;
    }
    .full-width {
        width: 100%;
        margin-bottom: 16px;
    }
    .actions {
        display: flex;
        justify-content: flex-end;
    }
    .error {
        color: #f44336;
        margin-bottom: 16px;
    }
    .lang-switcher {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 16px;
    }
    .lang-switcher button {
      min-width: 40px;
      font-weight: normal;
      opacity: 0.6;
    }
    .lang-switcher button.active {
      font-weight: bold;
      opacity: 1;
      color: #3f51b5;
    }
    .divider { margin: 0 4px; color: #ccc; }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  translationService = inject(TranslationService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  setLang(lang: 'EN' | 'FR') {
    this.translationService.setLanguage(lang);
  }

  onSubmit() {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        // Redirect handled in service
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Login failed', err);
        // Translation for error message would need dynamic key passing, simplistic for now
        this.error.set('Login failed');
        this.loading.set(false);
      }
    });
  }
}
