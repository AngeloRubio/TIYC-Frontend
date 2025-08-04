import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AdminService } from '../../../services/admin.service';
import { CreateUserRequest, UserRole } from '../../../models/story.model';
import { GRADE_OPTIONS } from '../../../models/story.model';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-2xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-tiyc-brown mb-2">Crear Nuevo Usuario</h1>
        <p class="text-gray-600">Completa la información para crear un nuevo usuario</p>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <form [formGroup]="createUserForm" (ngSubmit)="onSubmit()">
          
          <!-- Información Básica -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nombre de Usuario -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario *
                </label>
                <input 
                  type="text" 
                  formControlName="username"
                  placeholder="Ej: Juan Pérez"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiyc-primary"
                  [class.border-red-500]="createUserForm.get('username')?.invalid && createUserForm.get('username')?.touched">
                <div *ngIf="createUserForm.get('username')?.invalid && createUserForm.get('username')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  El nombre de usuario es requerido
                </div>
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input 
                  type="email" 
                  formControlName="email"
                  placeholder="usuario@ejemplo.com"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiyc-primary"
                  [class.border-red-500]="createUserForm.get('email')?.invalid && createUserForm.get('email')?.touched">
                <div *ngIf="createUserForm.get('email')?.invalid && createUserForm.get('email')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  <span *ngIf="createUserForm.get('email')?.errors?.['required']">El email es requerido</span>
                  <span *ngIf="createUserForm.get('email')?.errors?.['email']">Formato de email inválido</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Credenciales -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Credenciales</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Contraseña -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input 
                  type="password" 
                  formControlName="password"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiyc-primary"
                  [class.border-red-500]="createUserForm.get('password')?.invalid && createUserForm.get('password')?.touched">
                <div *ngIf="createUserForm.get('password')?.invalid && createUserForm.get('password')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  <span *ngIf="createUserForm.get('password')?.errors?.['required']">La contraseña es requerida</span>
                  <span *ngIf="createUserForm.get('password')?.errors?.['minlength']">Mínimo 6 caracteres</span>
                </div>
              </div>

              <!-- Rol -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select 
                  formControlName="role"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiyc-primary"
                  [class.border-red-500]="createUserForm.get('role')?.invalid && createUserForm.get('role')?.touched">
                  <option value="">Seleccionar rol</option>
                  <option value="teacher">Profesor</option>
                  <option value="admin">Administrador</option>
                </select>
                <div *ngIf="createUserForm.get('role')?.invalid && createUserForm.get('role')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  El rol es requerido
                </div>
              </div>
            </div>
          </div>

          <!-- Información Adicional (solo para profesores) -->
          <div *ngIf="createUserForm.get('role')?.value === 'teacher'" class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Información Educativa</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Escuela -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Escuela/Institución
                </label>
                <input 
                  type="text" 
                  formControlName="school"
                  placeholder="Ej: Escuela Primaria San José"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiyc-primary">
              </div>

              <!-- Grado -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Grado/Nivel
                </label>
                <select 
                  formControlName="grade"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiyc-primary">
                  <option value="">Seleccionar grado</option>
                  <option *ngFor="let grade of gradeOptions" [value]="grade.value">
                    {{ grade.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="error" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-700">{{ error }}</p>
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-green-700">{{ successMessage }}</p>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end space-x-4">
            <button 
              type="button"
              (click)="goBack()"
              [disabled]="isSubmitting"
              class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200 disabled:opacity-50">
              Cancelar
            </button>
            <button 
              type="submit"
              [disabled]="createUserForm.invalid || isSubmitting"
              class="px-6 py-2 bg-tiyc-primary hover:bg-tiyc-primary-dark text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50">
              {{ isSubmitting ? 'Creando...' : 'Crear Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class CreateUserComponent implements OnDestroy {

  createUserForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  successMessage: string | null = null;
  gradeOptions = GRADE_OPTIONS;
  
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router
  ) {
    this.createUserForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
      school: [''],
      grade: ['']
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSubmit(): void {
    if (this.createUserForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.successMessage = null;

    const userData: CreateUserRequest = {
      username: this.createUserForm.value.username,
      email: this.createUserForm.value.email,
      password: this.createUserForm.value.password,
      role: this.createUserForm.value.role as UserRole,
      school: this.createUserForm.value.school || undefined,
      grade: this.createUserForm.value.grade || undefined
    };

    const sub = this.adminService.createUser(userData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Usuario creado exitosamente';
          setTimeout(() => {
            this.router.navigate(['/admin/usuarios']);
          }, 2000);
        } else {
          this.error = response.error || 'Error al crear usuario';
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        this.error = 'Error de conexión';
        this.isSubmitting = false;
      }
    });

    this.subscriptions.add(sub);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createUserForm.controls).forEach(key => {
      const control = this.createUserForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/usuarios']);
  }
}