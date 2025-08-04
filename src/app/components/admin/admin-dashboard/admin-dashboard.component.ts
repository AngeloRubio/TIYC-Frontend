import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AdminService } from '../../../services/admin.service';
import { RoleService } from '../../../services/role.service';
import { UserWithRole } from '../../../models/story.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-tiyc-brown mb-2">Panel de Administración</h1>
        <p class="text-gray-600">Gestiona usuarios y configuraciones del sistema</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tiyc-primary"></div>
      </div>

      <!-- Stats Cards -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <!-- Total Users -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              👥
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ totalUsers }}</p>
              <p class="text-gray-600">Total Usuarios</p>
            </div>
          </div>
        </div>

        <!-- Teachers -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              🧑‍🏫
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ teacherCount }}</p>
              <p class="text-gray-600">Profesores</p>
            </div>
          </div>
        </div>

        <!-- Admins -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              👑
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ adminCount }}</p>
              <p class="text-gray-600">Administradores</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div *ngIf="!isLoading" class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <button 
            routerLink="/admin/usuarios"
            class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-tiyc-primary hover:bg-tiyc-primary hover:bg-opacity-5 transition-all duration-200">
            <span class="text-2xl mr-3">👥</span>
            <div class="text-left">
              <p class="font-semibold text-gray-900">Gestionar Usuarios</p>
              <p class="text-sm text-gray-600">Ver, crear, editar y eliminar usuarios</p>
            </div>
          </button>

          <button 
            routerLink="/admin/crear-usuario"
            class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-tiyc-primary hover:bg-tiyc-primary hover:bg-opacity-5 transition-all duration-200">
            <span class="text-2xl mr-3">➕</span>
            <div class="text-left">
              <p class="font-semibold text-gray-900">Crear Usuario</p>
              <p class="text-sm text-gray-600">Agregar nuevo profesor o administrador</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Recent Users -->
      <div *ngIf="!isLoading && recentUsers.length > 0" class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Usuarios Recientes</h2>
        <div class="space-y-3">
          <div *ngFor="let user of recentUsers" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-tiyc-primary rounded-full flex items-center justify-center text-white font-semibold mr-3">
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ user.username }}</p>
                <p class="text-sm text-gray-600">{{ user.email }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span [class]="getRoleBadgeClass(user.role)">
                {{ getRoleLabel(user.role) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-700">{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .badge {
      @apply px-3 py-1 rounded-full text-sm font-medium;
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  isLoading = true;
  error: string | null = null;
  
  totalUsers = 0;
  teacherCount = 0;
  adminCount = 0;
  recentUsers: UserWithRole[] = [];
  
  private subscriptions = new Subscription();

  constructor(
    private adminService: AdminService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadDashboardData(): void {
    const sub = this.adminService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.users) {
          this.processUsersData(response.users);
        } else {
          this.error = response.error || 'Error al cargar datos';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.error = 'Error de conexión';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(sub);
  }

  private processUsersData(users: UserWithRole[]): void {
    this.totalUsers = users.length;
    this.teacherCount = users.filter(u => u.role === 'teacher').length;
    this.adminCount = users.filter(u => u.role === 'admin').length;
    
    // Últimos 5 usuarios creados
    this.recentUsers = users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }

  getRoleLabel(role: string): string {
    return this.roleService.getRoleLabel(role as any);
  }

  getRoleBadgeClass(role: string): string {
    return `badge ${this.roleService.getRoleBadgeClass(role as any)}`;
  }
}