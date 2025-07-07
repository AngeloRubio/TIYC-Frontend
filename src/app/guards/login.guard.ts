import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Guard que evita que usuarios autenticados accedan al login
   * 
   * Si el usuario ya está autenticado, lo redirige a la biblioteca
   * Si no está autenticado, le permite acceder al login
   * 
   * @param route - Ruta activada  
   * @param state - Estado del router
   * @returns Observable<boolean> - true si puede acceder al login, false si ya está autenticado
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        
        if (isAuthenticated) {
          // Verificar si hay URL de retorno en los query params
          const returnUrl = route.queryParams['returnUrl'];
          
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigate([APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT]);
          }
          
          return false;
        } else {
          return true; 
        }
      })
    );
  }
}

export const loginGuardFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        router.navigate([APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT]);
        return false;
      } else {
        return true;
      }
    })
  );
};