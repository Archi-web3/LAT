import { Routes } from '@angular/router';
import { AssessmentLayoutComponent } from './features/assessment/assessment-layout/assessment-layout.component';
import { SectionViewComponent } from './features/assessment/section-view/section-view.component';
import { HistoryViewComponent } from './features/history/history-view/history-view.component';
import { MatrixViewComponent } from './features/matrix/matrix-view/matrix-view.component';
import { LoginComponent } from './features/auth/login/login.component';
import { UserListComponent } from './features/admin/user-list/user-list.component';
import { AdminDocsComponent } from './features/admin/admin-docs/admin-docs.component';
import { CoordinationDashboardComponent } from './features/coordination/coordination-dashboard/coordination-dashboard.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'assessment',
        component: AssessmentLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'init', loadComponent: () => import('./features/assessment/assessment-init/assessment-init.component').then(m => m.AssessmentInitComponent) },
            { path: 'list', loadComponent: () => import('./features/assessment/assessment-list/assessment-list.component').then(m => m.AssessmentListComponent) },

            // Administrative Routes (Must be before :sectionId wildcard)
            {
                path: 'admin/users',
                loadComponent: () => import('./features/admin/user-list/user-list.component').then(m => m.UserListComponent),
                canActivate: [roleGuard],
                data: { roles: ['SUPER_ADMIN'] }
            },
            {
                path: 'admin/config',
                loadComponent: () => import('./features/admin/admin-config/admin-config.component').then(m => m.AdminConfigComponent),
                canActivate: [roleGuard],
                data: { roles: ['SUPER_ADMIN'] }
            },
            {
                path: 'admin/roadmap',
                loadComponent: () => import('./features/admin/roadmap/roadmap.component').then(m => m.RoadmapComponent),
                canActivate: [roleGuard],
                data: { roles: ['SUPER_ADMIN'] }
            },

            // Dynamic Section Route (Wildcard for text IDs)
            { path: ':sectionId', component: SectionViewComponent },

            { path: '', redirectTo: 'list', pathMatch: 'full' }
        ]
    },
    { path: 'history', component: HistoryViewComponent, canActivate: [authGuard] },
    { path: 'matrix', component: MatrixViewComponent, canActivate: [authGuard] },
    // Removed the top-level admin/users route as it's now nested
    { path: 'admin/docs', component: AdminDocsComponent, canActivate: [authGuard] },
    { path: 'coordination', component: CoordinationDashboardComponent, canActivate: [authGuard] },
    {
        path: 'action-plan',
        loadComponent: () => import('./features/action-plan/action-dashboard/action-dashboard.component').then(m => m.ActionDashboardComponent),
        canActivate: [authGuard]
    },
    { path: '', redirectTo: '/assessment', pathMatch: 'full' }
];
