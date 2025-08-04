import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { APP_CONFIG } from '../config/app.config';
import { 
  UserWithRole, 
  CreateUserRequest, 
  UpdateUserRequest, 
  AdminApiResponse 
} from '../models/story.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get headers(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtiene todos los usuarios del sistema
   */
  getAllUsers(): Observable<AdminApiResponse> {
    const url = `${APP_CONFIG.API_BASE_URL}/admin/users`;
    
    return this.http.get<AdminApiResponse>(url, { headers: this.headers }).pipe(
      map(response => {
        console.log('✅ AdminService: Usuarios obtenidos:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ AdminService: Error al obtener usuarios:', error);
        return of({
          success: false,
          error: error.error?.error || 'Error al obtener usuarios',
          users: []
        });
      })
    );
  }

  /**
   * Crea un nuevo usuario
   */
  createUser(userData: CreateUserRequest): Observable<AdminApiResponse> {
    const url = `${APP_CONFIG.API_BASE_URL}/admin/users`;
    
    return this.http.post<AdminApiResponse>(url, userData, { headers: this.headers }).pipe(
      map(response => {
        console.log('✅ AdminService: Usuario creado:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ AdminService: Error al crear usuario:', error);
        return of({
          success: false,
          error: error.error?.error || 'Error al crear usuario'
        });
      })
    );
  }

  /**
   * Actualiza un usuario existente
   */
  updateUser(userId: string, userData: UpdateUserRequest): Observable<AdminApiResponse> {
    const url = `${APP_CONFIG.API_BASE_URL}/admin/users/${userId}`;
    
    return this.http.put<AdminApiResponse>(url, userData, { headers: this.headers }).pipe(
      map(response => {
        console.log('✅ AdminService: Usuario actualizado:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ AdminService: Error al actualizar usuario:', error);
        return of({
          success: false,
          error: error.error?.error || 'Error al actualizar usuario'
        });
      })
    );
  }

  /**
   * Elimina un usuario
   */
  deleteUser(userId: string): Observable<AdminApiResponse> {
    const url = `${APP_CONFIG.API_BASE_URL}/admin/users/${userId}`;
    
    return this.http.delete<AdminApiResponse>(url, { headers: this.headers }).pipe(
      map(response => {
        console.log('✅ AdminService: Usuario eliminado:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ AdminService: Error al eliminar usuario:', error);
        return of({
          success: false,
          error: error.error?.error || 'Error al eliminar usuario'
        });
      })
    );
  }
}