import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class authGuard implements CanActivate {
  
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * 🔒 Guard principal que protege rutas que requieren autenticación
   * 
   * @param route - Ruta activada
   * @param state - Estado del router
   * @returns Observable<boolean> - true si puede acceder, false si no
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    console.log('🔒 AuthGuard: Verificando acceso a:', state.url);
    
    return this.authService.isAuthenticated$.pipe(
      take(1), // Solo tomar el primer valor
      map(isAuthenticated => {
        
        if (isAuthenticated) {
          console.log('✅ AuthGuard: Usuario autenticado, permitiendo acceso');
          return true;
        } else {
          console.log('❌ AuthGuard: Usuario no autenticado, redirigiendo al login');
          
          // Guardar la URL que el usuario intentaba acceder para redirigir después del login
          const returnUrl = state.url;
          console.log('📝 AuthGuard: Guardando URL de retorno:', returnUrl);
          
          // Navegar al login con la URL de retorno como parámetro
          this.router.navigate([APP_CONFIG.AUTH_CONFIG.LOGOUT_REDIRECT], {
            queryParams: { returnUrl: returnUrl }
          });
          
          return false;
        }
      })
    );
  }
}

/**
 * 🔒 Función alternativa para usar con el nuevo sistema de guards funcionales
 * (Angular 15+)
 */
export const authGuardFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        router.navigate([APP_CONFIG.AUTH_CONFIG.LOGOUT_REDIRECT]);
        return false;
      }
    })
  );
};