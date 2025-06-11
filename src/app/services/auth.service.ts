import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; 
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, delay, tap, catchError } from 'rxjs/operators'; 

import { Teacher, LoginRequest, LoginResponse } from '../models/story.model';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Subject para el estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<Teacher | null>(null);
  
  // Observables públicos
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(
    
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    // Verificar autenticación al inicializar el servicio
    this.checkAuthStatus();
  }
  
  /**
   * 🌟 LOGIN REAL - Conecta con tu API Flask
   * Este es el método principal que debes usar en producción
   */
  login(email: string, password: string): Observable<any> {
    console.log('🔌 Conectando con API Flask para login...');
    
    const loginData = { email, password };
    const url = `${APP_CONFIG.API_BASE_URL}${APP_CONFIG.ENDPOINTS.LOGIN}`;
    
    console.log('📡 Enviando request a:', url);
    console.log('📦 Datos enviados:', loginData);
    
    return this.http.post<any>(url, loginData).pipe(
      tap(response => {
        console.log('✅ Respuesta del backend:', response);
        
        if (response.success) {
          // Guardar token y usuario real del backend
          this.setToken(response.token);
          this.currentUserSubject.next(response.teacher);
          this.isAuthenticatedSubject.next(true);
          console.log('🎉 Login exitoso con usuario real:', response.teacher);
        } else {
          console.log('❌ Login falló:', response.error);
        }
      }),
      catchError(error => {
        console.error('💥 Error en login real:', error);
        
        // Crear mensaje de error más amigable
        let errorMessage = 'Error de conexión con el servidor';
        if (error.status === 401) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar con el servidor. ¿Está corriendo en http://localhost:5000?';
        }
        
        return of({
          success: false,
          error: errorMessage
        });
      })
    );
  }

  /**
   * 🧪 LOGIN MOCK - Para desarrollo y pruebas
   * Útil cuando el backend no está disponible
   */
  loginMock(email: string, password: string): Observable<LoginResponse> {
    console.log('🎭 Iniciando login mock con:', { email, password });
    
    // Simular respuesta de API usando datos reales de tu backend
    const mockUser: Teacher = {
      id: '1f0204b9-0807-47c9-8c25-4c7f81dc0d74', // ✅ UUID real del profesor Juan
      username: 'profesor_juan',
      email: 'juan@escuela.com',
      school: 'Escuela Primaria Santa Fe',
      grade: '3er Grado',
      created_at: '2025-05-25T22:31:58'
    };
    
    const mockResponse: LoginResponse = {
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZWFjaGVyX2lkIjoiMWYwMjA0YjktMDgwNy00N2M5LThjMjUtNGM3ZjgxZGMwZDc0IiwiZW1haWwiOiJqdWFuQGVzY3VlbGEuY29tIiwiZXhwIjoxNzQ4NzQ1Mzk3fQ.0bbMz-SKB2_S2-hC7sXN4kVgBkFjoDD91_f_8uwlsoU',
      teacher: mockUser
    };
    
    // Simular delay de red
    return of(mockResponse).pipe(
      delay(1000),
      map(response => {
        console.log('🎭 Login mock exitoso:', response);
        
        // Actualizar estado exactamente como lo haría el login real
        this.setToken(response.token);
        this.currentUserSubject.next(response.teacher);
        this.isAuthenticatedSubject.next(true);
        
        return response;
      })
    );
  }

  /**
   * 🚪 Cierra la sesión del usuario
   */
  logout(): void {
    console.log('👋 Cerrando sesión...');
    
    // Remover token del localStorage
    this.removeToken();
    
    // Limpiar estado
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Redirigir al login
    this.router.navigate([APP_CONFIG.AUTH_CONFIG.LOGOUT_REDIRECT]);
    
    console.log('✅ Sesión cerrada');
  }
  
  /**
   * 👤 Obtiene el usuario actual
   */
  getCurrentUser(): Observable<Teacher | null> {
    return this.currentUser$;
  }
  
  /**
   * 🔐 Verifica si el usuario está autenticado
   */
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$;
  }
  
  /**
   * 🎫 Obtiene el token de autenticación (compatible con SSR)
   */
  getToken(): string | null {
    // Verificar si estamos en el navegador antes de acceder a localStorage
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
    }
    // Si estamos en el servidor, retornar null
    return null;
  }
  
  /**
   * ✅ Verifica si el token es válido
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
      console.error('❌ Error al verificar token:', error);
      return false;
    }
  }
  
  /**
   * 💾 MÉTODOS PRIVADOS - Manejo de tokens y estado
   */
  
  private setToken(token: string): void {
    // Solo guardar en localStorage si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY, token);
      console.log('💾 Token guardado en localStorage');
    }
  }
  
  private removeToken(): void {
    // Solo remover de localStorage si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
      console.log('🗑️ Token removido de localStorage');
    }
  }
  
  private checkAuthStatus(): void {
    // Solo verificar autenticación si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      // ✅ MEJORADO: Logging más claro para SSR
      console.log('🖥️ SSR: Inicializando en servidor, autenticación pendiente...');
      this.isAuthenticatedSubject.next(false);
      return;
    }
    
    const token = this.getToken();
    
    if (token && this.isTokenValid()) {
      console.log('🔍 Token encontrado y válido, verificando usuario...');
      
      // Intentar extraer datos del usuario del token
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Datos del token:', payload);
        
        // Crear usuario básico desde el token
        const userFromToken: Teacher = {
          id: payload.teacher_id || 'unknown',
          username: 'Usuario Recuperado',
          email: payload.email || 'email@unknown.com',
          school: 'Escuela Recuperada',
          grade: 'Grado Recuperado',
          created_at: new Date().toISOString()
        };
        
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(userFromToken);
        console.log('✅ Usuario autenticado desde token:', userFromToken);
        
      } catch (error) {
        console.error('❌ Error al procesar token:', error);
        this.logout(); // Token corrupto, cerrar sesión
      }
      
    } else {
      console.log('❌ Token inválido o no existe');
      this.isAuthenticatedSubject.next(false);
      this.removeToken();
    }
  }
}