import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AuthService } from './auth.service';
import { UserRole } from '../models/story.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private readonly authService = inject(AuthService);

  /**
   * Verifica si el usuario actual es administrador
   */
  isAdmin(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => user?.role === 'admin')
    );
  }

  /**
   * Verifica si el usuario actual es profesor
   */
  isTeacher(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => user?.role === 'teacher')
    );
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getCurrentRole(): Observable<UserRole | null> {
    return this.authService.currentUser$.pipe(
      map(user => user?.role || null)
    );
  }

  /**
   * Verifica si el usuario actual es administrador (método síncrono)
   */
  isCurrentUserAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user && 'role' in user ? user.role === 'admin' : false;
  }

  /**
   * Obtiene la etiqueta legible del rol
   */
  getRoleLabel(role: UserRole): string {
    const labels = {
      'admin': 'Administrador',
      'teacher': 'Profesor'
    };
    return labels[role] || 'Desconocido';
  }

  /**
   * Obtiene el color del badge según el rol
   */
  getRoleBadgeClass(role: UserRole): string {
    const classes = {
      'admin': 'bg-red-100 text-red-800',
      'teacher': 'bg-blue-100 text-blue-800'
    };
    return classes[role] || 'bg-gray-100 text-gray-800';
  }
}