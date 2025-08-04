import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { RoleService } from '../services/role.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class adminGuard implements CanActivate {

  private readonly roleService = inject(RoleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * 🛡️ Guard que protege rutas de administrador
   * 
   * Verifica que el usuario esté autenticado Y sea admin
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/login']);
          return false;
        }

        const isAdmin = this.roleService.isCurrentUserAdmin();
        
        if (!isAdmin) {
          this.router.navigate(['/biblioteca']);
          return false;
        }

        return true;
      })
    );
  }
}

export const adminGuardFn = () => {
  const roleService = inject(RoleService);
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        router.navigate(['/login']);
        return false;
      }
      
      if (!roleService.isCurrentUserAdmin()) {
        router.navigate(['/biblioteca']);
        return false;
      }
      
      return true;
    })
  );
};