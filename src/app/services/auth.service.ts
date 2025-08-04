import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { Teacher, LoginResponse } from '../models/story.model';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
providedIn: 'root'
})
export class AuthService {
// Subject para el estado de autenticación
private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
private readonly currentUserSubject = new BehaviorSubject<Teacher | null>(null);

// Observables públicos
public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
public readonly currentUser$ = this.currentUserSubject.asObservable();

constructor(
  private readonly http: HttpClient,
  @Inject(PLATFORM_ID) private readonly platformId: Object,
  private readonly router: Router
) {
  // Verificar autenticación al inicializar el servicio
  this.checkAuthStatus();
}

/**
 * LOGIN REAL - Conecta con tu API Flask
 * Este es el método principal que debes usar en producción
 */
login(email: string, password: string): Observable<any> {
  const loginData = { email, password };
  const url = `https://tiyc-backend-production.up.railway.app/api/auth/login`;

  return this.http.post<any>(url, loginData).pipe(
    tap(response => {
      if (response.success) {
        this.handleLoginSuccess(response);
      }
    }),
    catchError(error => this.handleLoginError(error))
  );
}

/**
 * Cierra la sesión del usuario
 */
logout(): void {
  // Remover token del localStorage
  this.removeToken();

  // Limpiar estado
  this.currentUserSubject.next(null);
  this.isAuthenticatedSubject.next(false);

  // Redirigir al login
  this.router.navigate([APP_CONFIG.AUTH_CONFIG.LOGOUT_REDIRECT]);
}

/**
 * Obtiene el usuario actual
 */
getCurrentUser(): Observable<Teacher | null> {
  return this.currentUser$;
}

/**
 * Obtiene el usuario actual de forma síncrona
 */
getCurrentUserSync(): Teacher | null {
  const user = this.currentUserSubject.value;
  console.log('🔍 AuthService.getCurrentUserSync():', user);
  return user;
}

/**
 * Verifica si el usuario está autenticado
 */
isAuthenticated(): Observable<boolean> {
  return this.isAuthenticated$;
}

updateCurrentUser(userData: any): void {
  this.currentUserSubject.next(userData);
}

getToken(): string | null {
  // Verificar si estamos en el navegador antes de acceder a localStorage
  if (isPlatformBrowser(this.platformId)) {
    return localStorage.getItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
  }
  // Si estamos en el servidor, retornar null
  return null;
}

/**
 * Verifica si el token es válido
 */
isTokenValid(): boolean {
  const token = this.getToken();
  if (!token) return false;

  try {
    // Decodificar el JWT para verificar expiración
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch (error) {
    return false;
  }
}

/**
 * MÉTODOS PRIVADOS - Manejo de tokens y estado
 */
private handleLoginSuccess(response: any): void {
  console.log('✅ Login exitoso:', response);
  
  this.setToken(response.token);
  
  // ✅ Incluir role en el usuario
  const userWithRole = {
    ...response.teacher,
    role: response.teacher.role || 'teacher'  // Default fallback
  };
  
  console.log('🔍 Usuario con role:', userWithRole);
  
  this.isAuthenticatedSubject.next(true);
  this.currentUserSubject.next(userWithRole);
}

private setToken(token: string): void {
  // Solo guardar en localStorage si estamos en el navegador
  if (isPlatformBrowser(this.platformId)) {
    localStorage.setItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY, token);
  }
}

private removeToken(): void {
  // Solo remover del localStorage si estamos en el navegador
  if (isPlatformBrowser(this.platformId)) {
    localStorage.removeItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
  }
}

private checkAuthStatus(): void {
  // Solo verificar autenticación si estamos en el navegador
  if (!isPlatformBrowser(this.platformId)) {
    this.isAuthenticatedSubject.next(false);
    return;
  }

  const token = this.getToken();

  if (token && this.isTokenValid()) {
    // Intentar extraer datos del usuario del token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // ✅ Crear usuario básico desde el token incluyendo role
      const userFromToken: Teacher = {
        id: payload.teacher_id || 'unknown',
        username: 'Usuario Recuperado',
        email: payload.email || 'email@unknown.com',
        role: payload.role || 'teacher',  // ✅ INCLUIR ROLE
        school: 'Escuela Recuperada',
        grade: 'Grado Recuperado',
        created_at: new Date().toISOString()
      };

      console.log('🔍 Usuario recuperado del token:', userFromToken);

      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(userFromToken);
    } catch (error) {
      this.logout(); // Token corrupto, cerrar sesión
    }
  } else {
    this.isAuthenticatedSubject.next(false);
    this.removeToken();
  }
}

private handleLoginError(error: any): Observable<any> {
// Manejo de errores de login
  let errorMessage = 'Error de conexión con el servidor';
  if (error.status === 401) {
    errorMessage = 'Email o contraseña incorrectos';
  } else if (error.status === 0) {
    errorMessage = 'No se puede conectar con el servidor. ¿Está corriendo el servidor?';
  }

  return of({
    success: false,
    error: errorMessage
  });
}
}