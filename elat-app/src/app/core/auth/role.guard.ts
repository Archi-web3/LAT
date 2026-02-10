import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    const expectedRoles = route.data['roles'] as string[];

    if (!user) {
        return router.createUrlTree(['/login']);
    }

    if (expectedRoles && expectedRoles.includes(user.role)) {
        return true;
    }

    // Redirect to home if unauthorized
    return router.createUrlTree(['/']);
};
