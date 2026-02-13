import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/admin/admin.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LocationService } from '../../../services/location.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="admin-container">
      <div class="header">
        <h1>User Management</h1>
        <div class="actions">
            <button mat-stroked-button color="primary" (click)="triggerFileInput()">
                <mat-icon>upload_file</mat-icon> Import CSV
            </button>
            <input type="file" id="csvInput" (change)="onFileSelected($event)" accept=".csv" style="display: none;">
            
            <button mat-raised-button color="primary" (click)="startCreate()">
              <mat-icon>add</mat-icon> Add User
            </button>
        </div>
      </div>

      <!-- Simple Inline Form for Creation/Edit -->
      <mat-card *ngIf="showForm" class="user-form">
        <mat-card-header>
            <mat-card-title>{{ newUser._id ? 'Edit User' : 'New User' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
            <form (ngSubmit)="saveUser()">
                <div class="form-row">
                    <mat-form-field appearance="outline">
                        <mat-label>Name</mat-label>
                        <input matInput [(ngModel)]="newUser.name" name="name" required>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                        <mat-label>Email</mat-label>
                        <input matInput [(ngModel)]="newUser.email" name="email" required>
                    </mat-form-field>
                </div>
                <div class="form-row">
                    <mat-form-field appearance="outline">
                        <mat-label>Password {{ newUser._id ? '(Leave blank to keep)' : '' }}</mat-label>
                        <input matInput [(ngModel)]="newUser.password" name="password" [required]="!newUser._id">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                        <mat-label>Role</mat-label>
                        <mat-select [(ngModel)]="newUser.role" name="role" required>
                            <mat-option value="USER">User</mat-option>
                            <mat-option value="COUNTRY_COORDINATOR">Country Coord</mat-option>
                            <mat-option value="POOL_COORDINATOR">Pool Coord</mat-option>
                            <mat-option value="SUPER_ADMIN">Super Admin</mat-option>
                        </mat-select>
                    </mat-form-field>
                </div>
                
                <div class="form-row">
                    <!-- Country Selection -->
                    <mat-form-field appearance="outline" *ngIf="newUser.role !== 'SUPER_ADMIN'">
                        <mat-label>Country</mat-label>
                        <mat-select *ngIf="newUser.role === 'POOL_COORDINATOR'" [(ngModel)]="newUser.assignedCountries" name="countries" multiple>
                            <mat-option *ngFor="let c of countries()" [value]="c.code">{{ c.name }}</mat-option>
                        </mat-select>
                        <mat-select *ngIf="newUser.role !== 'POOL_COORDINATOR'" [(ngModel)]="newUser.assignedCountry" name="country" (selectionChange)="onCountryChange()">
                             <mat-option *ngFor="let c of countries()" [value]="c.code">{{ c.name }}</mat-option>
                        </mat-select>
                    </mat-form-field>

                    <!-- Base Selection (Only for USER) -->
                    <mat-form-field appearance="outline" *ngIf="newUser.role === 'USER' && newUser.assignedCountry">
                        <mat-label>Base</mat-label>
                        <mat-select [(ngModel)]="newUser.assignedBase" name="base">
                             <mat-option *ngFor="let b of availableBases" [value]="b.name">{{ b.name }}</mat-option>
                        </mat-select>
                    </mat-form-field>
                </div>

                <div class="actions">
                    <button mat-button type="button" (click)="resetForm()">Cancel</button>
                    <button mat-raised-button color="accent" type="submit">{{ newUser._id ? 'Update' : 'Create' }}</button>
                </div>
            </form>
        </mat-card-content>
      </mat-card>

      <table mat-table [dataSource]="users()" class="mat-elevation-z8">
        
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef> Name </th>
          <td mat-cell *matCellDef="let user"> {{user.name}} </td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef> Email </th>
          <td mat-cell *matCellDef="let user"> {{user.email}} </td>
        </ng-container>

        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef> Role </th>
          <td mat-cell *matCellDef="let user"> 
            <span class="role-badge" [class]="user.role">{{user.role}}</span>
          </td>
        </ng-container>

        <!-- Added Country and Base Columns -->
        <ng-container matColumnDef="country">
          <th mat-header-cell *matHeaderCellDef> Country </th>
          <td mat-cell *matCellDef="let user"> 
            {{ user.assignedCountry || (user.assignedCountries?.join(', ')) || '-' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="base">
          <th mat-header-cell *matHeaderCellDef> Base </th>
          <td mat-cell *matCellDef="let user"> {{ user.assignedBase || '-' }} </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Actions </th>
          <td mat-cell *matCellDef="let user">
            <button mat-icon-button (click)="editUser(user)">
                <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteUser(user._id)" [disabled]="user.role === 'SUPER_ADMIN'">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .admin-container { padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .user-form { margin-bottom: 20px; background: #fafafa; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; }
    table { width: 100%; }
    
    .role-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        white-space: nowrap;
    }
    .role-badge.SUPER_ADMIN { background: #E3F2FD; color: #1565C0; }
    .role-badge.POOL_COORDINATOR { background: #E8F5E9; color: #2E7D32; }
    .role-badge.USER { background: #F3E5F5; color: #7B1FA2; }
  `]
})

export class UserListComponent implements OnInit {
  adminService = inject(AdminService);
  locationService: LocationService = inject(LocationService);

  users = this.adminService.users;
  countries = this.locationService.countries; // Signal<Country[]>

  // Updated columns
  displayedColumns = ['name', 'email', 'role', 'country', 'base', 'actions'];

  showForm = false;
  newUser: any = { role: 'USER', assignedCountries: [], assignedBases: [] };

  // Computed bases based on selected country (for Single selection scenario)
  availableBases: any[] = [];

  ngOnInit() {
    this.adminService.getUsers().subscribe();
  }

  onCountryChange() {
    // Update available bases when country changes (For Single Country scenario)
    const countryCode = this.newUser.assignedCountry as string;
    if (countryCode) {
      this.availableBases = this.locationService.getBasesForCountry(countryCode);
    } else {
      this.availableBases = [];
    }
  }

  // Header "Add User" button
  startCreate() {
    this.resetForm();
    this.showForm = true;
  }

  resetForm() {
    this.showForm = false;
    this.newUser = { role: 'USER', assignedCountries: [], assignedBases: [] };
    this.availableBases = [];
  }

  editUser(user: any) {
    this.newUser = { ...user, password: '' }; // Clone and reset password field
    // Trigger side effect for bases if needed
    if (this.newUser.assignedCountry) {
      this.availableBases = this.locationService.getBasesForCountry(this.newUser.assignedCountry);
    }
    this.showForm = true;
  }

  saveUser() {
    // Harmonize data before sending
    if (this.newUser.role === 'POOL_COORDINATOR') {
      this.newUser.assignedCountry = null;
      this.newUser.assignedBase = null;
    } else {
      this.newUser.assignedCountries = [];
    }

    if (this.newUser._id) {
      // Update
      this.adminService.updateUser(this.newUser._id, this.newUser).subscribe(() => {
        this.resetForm();
      });
    } else {
      // Create
      this.adminService.createUser(this.newUser).subscribe(() => {
        this.resetForm();
      });
    }
  }

  // --- CSV Import ---
  triggerFileInput() {
    const fileInput = document.getElementById('csvInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.parseCSV(file);
    }
    // Reset input
    event.target.value = '';
  }

  parseCSV(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const data = this.csvToJSON(text);
      if (data && data.length > 0) {
        if (confirm(`Ready to import ${data.length} users?`)) {
          this.adminService.importUsers(data).subscribe({
            next: (res) => {
              alert(`Import successful!\nCreated: ${res.created}\nSkipped: ${res.skipped}\nErrors: ${res.errors.length}`);
            },
            error: (err) => alert('Import failed: ' + err.message)
          });
        }
      } else {
        alert('No valid data found in CSV.');
      }
    };
    reader.readAsText(file);
  }

  csvToJSON(csv: string): any[] {
    const lines = csv.split('\n');
    const result = [];
    // Remove headers
    const headers = lines[0].split(',').map(h => h.trim());

    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentline = lines[i].split(',');

      if (currentline.length < headers.length) continue; // Skip empty lines

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j] ? currentline[j].trim() : '';
      }

      // Basic filter for empty rows
      if (obj.email && obj.name) {
        result.push(obj);
      }
    }
    return result;
  }

  deleteUser(id: string) {
    if (confirm('Are you sure?')) {
      this.adminService.deleteUser(id).subscribe();
    }
  }
}
