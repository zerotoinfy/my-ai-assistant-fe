import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AppUserRole, AuthSessionService } from '../services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    const allowedRoles = (route.data['roles'] || []) as AppUserRole[];
    const user = this.authSessionService.getCurrentUser();

    if (!user) {
      void this.router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      if (user.role === 'Checker') {
        void this.router.navigate(['/dashboard/checker-queue']);
      } else {
        void this.router.navigate(['/dashboard']);
      }
      return false;
    }

    return true;
  }
}
