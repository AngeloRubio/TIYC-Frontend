import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AdminService } from '../../../services/admin.service';
import { RoleService } from '../../../services/role.service';
import { UserWithRole, UserRole } from '../../../models/story.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-tiyc-brown mb-2">Gestión de Usuarios</h1>
          <p class="text-gray-600">Administra todos los usuarios del sistema</p>
        </div>
        <button 
          routerLink="/admin/crear-usuario"
          class="bg-tiyc-primary hover:bg-tiyc-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
          ➕ Crear Usuario
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              (ngModelChange)="applyFilters()"
              placeholder="Nombre o email..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiyc-primary">
          </div>
          
          <!-- Role Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <select 
              [(ngModel)]="roleFilter"
              (ngModelChange)="applyFilters()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiyc-primary">
              <option value="">Todos los roles</option>
              <option value="teacher">Profesores</option>
              <option value="admin">Administradores</option>
            </select>
          </div>

          <!-- Results Info -->
          <div class="flex items-end">
            <p class="text-sm text-gray-600">
              Mostrando {{ filteredUsers.length }} de {{ allUsers.length }} usuarios
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tiyc-primary"></div>
      </div>

      <!-- Users Table -->
      <div *ngIf="!isLoading" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escuela</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of filteredUsers" class="hover:bg-gray-50">
                <!-- User Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-tiyc-primary rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {{ user.username.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ user.username }}</div>
                      <div class="text-sm text-gray-500">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                
                <!-- Role -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getRoleBadgeClass(user.role)">
                    {{ getRoleLabel(user.role) }}
                  </span>
                </td>
                
                <!-- School -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ user.school || 'No especificada' }}
                </td>
                
                <!-- Created Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(user.created_at) }}
                </td>
                
                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button 
                      (click)="editUser(user)"
                      class="text-tiyc-primary hover:text-tiyc-primary-dark transition-colors duration-200 px-3 py-1 rounded">
                      ✏️ Editar
                    </button>
                    <button 
                      (click)="deleteUser(user)"
                      [disabled]="user.id === currentUserId"
                      class="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 px-3 py-1 rounded">
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && filteredUsers.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">👥</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No se encontraron usuarios</h3>
        <p class="text-gray-600 mb-6">{{ searchTerm || roleFilter ? 'Intenta ajustar los filtros' : 'Aún no hay usuarios registrados' }}</p>
        <button 
          routerLink="/admin/crear-usuario"
          class="bg-tiyc-primary hover:bg-tiyc-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
          Crear Primer Usuario
        </button>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-700">{{ error }}</p>
        <button 
          (click)="loadUsers()"
          class="mt-2 text-red-600 hover:text-red-800 underline">
          Reintentar
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div *ngIf="userToDelete" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" (click)="cancelDelete()">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <span class="text-red-600">⚠️</span>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Confirmar Eliminación</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que deseas eliminar al usuario <strong>{{ userToDelete.username }}</strong>? 
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              (click)="confirmDelete()"
              [disabled]="isDeleting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
              {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
           </button>
           <button 
             (click)="cancelDelete()"
             [disabled]="isDeleting"
             class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
             Cancelar
           </button>
         </div>
       </div>
     </div>
   </div>
 `,
  styles: [`
   .badge {
     @apply px-3 py-1 rounded-full text-sm font-medium;
   }
 `]
})
export class UserManagementComponent implements OnInit, OnDestroy {

  isLoading = true;
  isDeleting = false;
  error: string | null = null;

  allUsers: UserWithRole[] = [];
  filteredUsers: UserWithRole[] = [];

  searchTerm = '';
  roleFilter: UserRole | '' = '';

  userToDelete: UserWithRole | null = null;
  currentUserId = '';

  private subscriptions = new Subscription();

  constructor(
    private adminService: AdminService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.getCurrentUserId();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private getCurrentUserId(): void {
    // Obtener ID del usuario actual desde AuthService
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId = payload.teacher_id || '';
      } catch (error) {
        console.error('Error al obtener user ID:', error);
      }
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.adminService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.users) {
          this.allUsers = response.users;
          this.applyFilters();
        } else {
          this.error = response.error || 'Error al cargar usuarios';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.error = 'Error de conexión';
        this.isLoading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  applyFilters(): void {
    let filtered = [...this.allUsers];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Filtro por rol
    if (this.roleFilter) {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    this.filteredUsers = filtered;
  }

  editUser(user: UserWithRole): void {
    // TODO: Implementar modal de edición o navegar a página de edición
    console.log('Editar usuario:', user);
  }

  deleteUser(user: UserWithRole): void {
    this.userToDelete = user;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;

    this.isDeleting = true;

    const sub = this.adminService.deleteUser(this.userToDelete.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Remover usuario de la lista
          this.allUsers = this.allUsers.filter(u => u.id !== this.userToDelete!.id);
          this.applyFilters();
          this.userToDelete = null;
        } else {
          this.error = response.error || 'Error al eliminar usuario';
        }
        this.isDeleting = false;
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        this.error = 'Error de conexión';
        this.isDeleting = false;
      }
    });

    this.subscriptions.add(sub);
  }

  cancelDelete(): void {
    this.userToDelete = null;
  }

  getRoleLabel(role: UserRole): string {
    return this.roleService.getRoleLabel(role);
  }

  getRoleBadgeClass(role: UserRole): string {
    return `badge ${this.roleService.getRoleBadgeClass(role)}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}