import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * 🚪 Guard que evita que usuarios autenticados accedan al login
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
    
    console.log('🚪 LoginGuard: Verificando si debe acceder al login');
    
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        
        if (isAuthenticated) {
          console.log('✅ LoginGuard: Usuario ya autenticado, redirigiendo a biblioteca');
          
          // Verificar si hay URL de retorno en los query params
          const returnUrl = route.queryParams['returnUrl'];
          
          if (returnUrl) {
            console.log('📍 LoginGuard: Redirigiendo a URL guardada:', returnUrl);
            this.router.navigateByUrl(returnUrl);
          } else {
            console.log('📚 LoginGuard: Redirigiendo a biblioteca por defecto');
            this.router.navigate([APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT]);
          }
          
          return false;
        } else {
          console.log('🔓 LoginGuard: Usuario no autenticado, permitiendo acceso al login');
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