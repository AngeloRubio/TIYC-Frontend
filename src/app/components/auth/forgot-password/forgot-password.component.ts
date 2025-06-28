// src/app/components/auth/forgot-password/forgot-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { APP_CONFIG } from '../../../config/app.config';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-tiyc-light flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white bg-opacity-95 rounded-2xl overflow-hidden shadow-tiyc-xl">

        <!-- Header -->
        <div class="bg-tiyc-primary px-6 py-4 text-white">
          <div class="text-center">
            <h1 class="text-tiyc-title font-bold">🔑 Recuperar Contraseña</h1>
            <div class="text-tiyc-small opacity-75">{{ getStepDescription() }}</div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">

          <!-- Mensajes -->
          <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            <div class="text-tiyc-body">{{ errorMessage }}</div>
          </div>

          <div *ngIf="successMessage" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4">
            <div class="text-tiyc-body">{{ successMessage }}</div>
          </div>

          <!-- Step 1: Solicitar recuperación -->
          <div *ngIf="currentStep === 'request'" class="space-y-6">
            <div class="text-center">
              <div class="text-4xl mb-4">📧</div>
              <h3 class="text-tiyc-brown font-bold text-tiyc-heading mb-4">Ingresa tu email</h3>
              <p class="text-gray-600 text-tiyc-body">
                Te enviaremos un código para restablecer tu contraseña.
              </p>
            </div>

            <form (ngSubmit)="onRequestReset()" #requestForm="ngForm">
              <div class="mb-6">
                <label class="block text-tiyc-primary font-bold mb-2 text-tiyc-body">
                  Email registrado
                </label>
                <input
                  type="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  placeholder="tu.email@escuela.com"
                  class="input-tiyc"
                  required
                  #emailInput="ngModel"
                />
                <div *ngIf="emailInput.invalid && emailInput.touched" class="text-red-500 text-tiyc-small mt-1">
                  Ingresa un email válido
                </div>
              </div>

              <div class="flex gap-3">
                <button type="button" (click)="goToLogin()" class="btn-tiyc-secondary flex-1">
                  ← Volver al Login
                </button>
                <button
                  type="submit"
                  [disabled]="!emailInput.valid || isLoading"
                  class="btn-tiyc-primary flex-1"
                  [class.opacity-50]="!emailInput.valid || isLoading"
                >
                  <span *ngIf="!isLoading">📤 Enviar Código</span>
                  <span *ngIf="isLoading">Enviando...</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Step 2: Verificar código -->
          <div *ngIf="currentStep === 'verify'" class="space-y-6">
            <div class="text-center">
              <div class="text-4xl mb-4">🔐</div>
              <h3 class="text-tiyc-brown font-bold text-tiyc-heading mb-4">Verificar Código</h3>
              <p class="text-gray-600 text-tiyc-body mb-4">
                Revisa tu email e ingresa el código de recuperación.
              </p>
              
              <!-- Token para desarrollo -->
              <div *ngIf="recoveryToken && isDevMode" class="bg-yellow-50 border border-yellow-300 p-3 rounded-lg mb-4">
                <div class="text-tiyc-small font-bold text-yellow-800 mb-2">🔧 MODO DESARROLLO:</div>
                <div class="bg-gray-100 p-2 rounded text-tiyc-small font-mono break-all">
                  {{ recoveryToken }}
                </div>
                <button (click)="useDevToken()" class="btn-tiyc-secondary text-tiyc-small mt-2 px-3 py-1">
                  Usar este código
                </button>
              </div>
            </div>

            <form (ngSubmit)="onVerifyCode()" #verifyForm="ngForm">
              <div class="mb-6">
                <label class="block text-tiyc-primary font-bold mb-2 text-tiyc-body">
                  Código de recuperación
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.token"
                  name="token"
                  placeholder="Ingresa el código recibido"
                  class="input-tiyc"
                  required
                  #tokenInput="ngModel"
                />
              </div>

              <div class="flex gap-3">
                <button type="button" (click)="goBack()" class="btn-tiyc-secondary flex-1">
                  ← Volver
                </button>
                <button
                  type="submit"
                  [disabled]="!tokenInput.valid || isLoading"
                  class="btn-tiyc-primary flex-1"
                >
                  <span *ngIf="!isLoading">✓ Verificar</span>
                  <span *ngIf="isLoading">Verificando...</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Step 3: Nueva contraseña -->
          <div *ngIf="currentStep === 'reset'" class="space-y-6">
            <div class="text-center">
              <div class="text-4xl mb-4">🔒</div>
              <h3 class="text-tiyc-brown font-bold text-tiyc-heading mb-4">Nueva Contraseña</h3>
              <p class="text-gray-600 text-tiyc-body">
                Crea una contraseña segura para tu cuenta.
              </p>
            </div>

            <form (ngSubmit)="onResetPassword()" #resetForm="ngForm">
              <div class="mb-4">
                <label class="block text-tiyc-primary font-bold mb-2 text-tiyc-body">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  [(ngModel)]="formData.newPassword"
                  name="newPassword"
                  placeholder="Mínimo 6 caracteres"
                  class="input-tiyc"
                  required
                  minlength="6"
                  #passwordInput="ngModel"
                />
                <div *ngIf="passwordInput.invalid && passwordInput.touched" class="text-red-500 text-tiyc-small mt-1">
                  La contraseña debe tener al menos 6 caracteres
                </div>
              </div>

              <div class="mb-6">
                <label class="block text-tiyc-primary font-bold mb-2 text-tiyc-body">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  [(ngModel)]="formData.confirmPassword"
                  name="confirmPassword"
                  placeholder="Repite tu nueva contraseña"
                  class="input-tiyc"
                  required
                  #confirmInput="ngModel"
                />
                <div *ngIf="formData.newPassword !== formData.confirmPassword && confirmInput.touched" class="text-red-500 text-tiyc-small mt-1">
                  Las contraseñas no coinciden
                </div>
              </div>

              <button
                type="submit"
                [disabled]="resetForm.invalid || formData.newPassword !== formData.confirmPassword || isLoading"
                class="btn-tiyc-primary w-full"
                [class.opacity-50]="resetForm.invalid || formData.newPassword !== formData.confirmPassword || isLoading"
              >
                <span *ngIf="!isLoading">🔄 Cambiar Contraseña</span>
                <span *ngIf="isLoading">Cambiando...</span>
              </button>
            </form>
          </div>

          <!-- Step 4: Éxito -->
          <div *ngIf="currentStep === 'success'" class="space-y-6 text-center">
            <div class="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 class="text-tiyc-brown font-bold text-tiyc-heading mb-4">¡Contraseña Restablecida!</h3>
            <p class="text-gray-600 text-tiyc-body mb-6">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            
            <button (click)="goToLogin()" class="btn-tiyc-primary px-8 py-3">
              🚪 Ir al Login
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-bounce {
      animation: bounce 1s infinite;
    }
    
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
      40%, 43% { transform: translateY(-30px); }
      70% { transform: translateY(-15px); }
      90% { transform: translateY(-4px); }
    }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  
  currentStep: 'request' | 'verify' | 'reset' | 'success' = 'request';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  recoveryToken = '';
  isDevMode = !environment.production; // ✅ Usar environment importado
  
  formData = {
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    // Verificar si viene con un token en la URL
    const tokenFromUrl = this.route.snapshot.queryParams['token'];
    if (tokenFromUrl) {
      this.formData.token = tokenFromUrl;
      this.currentStep = 'verify';
    }
  }
  
  onRequestReset(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const url = `${APP_CONFIG.API_BASE_URL}/auth/forgot-password`;
    
    this.http.post<any>(url, { email: this.formData.email }).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.recoveryToken = response.recovery_token || '';
          this.currentStep = 'verify';
        } else {
          this.errorMessage = response.error || 'Error al enviar código';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error de conexión. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  onVerifyCode(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const url = `${APP_CONFIG.API_BASE_URL}/auth/verify-recovery-token`;
    
    this.http.post<any>(url, { token: this.formData.token }).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentStep = 'reset';
        } else {
          this.errorMessage = response.error || 'Código inválido';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al verificar código. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  onResetPassword(): void {
    if (this.isLoading) return;
    
    if (this.formData.newPassword !== this.formData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const url = `${APP_CONFIG.API_BASE_URL}/auth/reset-password`;
    
    this.http.post<any>(url, {
      token: this.formData.token,
      new_password: this.formData.newPassword
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentStep = 'success';
        } else {
          this.errorMessage = response.error || 'Error al cambiar contraseña';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cambiar contraseña. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  useDevToken(): void {
    if (this.recoveryToken) {
      this.formData.token = this.recoveryToken;
    }
  }
  
  goBack(): void {
    if (this.currentStep === 'verify') {
      this.currentStep = 'request';
    } else if (this.currentStep === 'reset') {
      this.currentStep = 'verify';
    }
    this.errorMessage = '';
  }
  
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
  
  getStepDescription(): string {
    switch (this.currentStep) {
      case 'request':
        return 'Paso 1: Solicitar código de recuperación';
      case 'verify':
        return 'Paso 2: Verificar código';
      case 'reset':
        return 'Paso 3: Crear nueva contraseña';
      case 'success':
        return '¡Proceso completado!';
      default:
        return '';
    }
  }
}