import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { APP_CONFIG } from '../../../config/app.config';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  
  currentStep: 'request' | 'verify' | 'reset' | 'success' = 'request';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  recoveryToken = '';
  isDevMode = true; // Por defecto true para desarrollo
  
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
    console.log('🔑 ForgotPasswordComponent inicializado');
    
    // Verificar si viene con un token en la URL (para emails)
    const tokenFromUrl = this.route.snapshot.queryParams['token'];
    if (tokenFromUrl) {
      this.formData.token = tokenFromUrl;
      this.currentStep = 'verify';
      console.log('🔗 Token detectado en URL, saltando a verificación');
    }
  }
  
  onRequestReset(): void {
    if (this.isLoading) return;
    
    console.log('📧 Solicitando reset para:', this.formData.email);
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const url = `${APP_CONFIG.API_BASE_URL}/auth/forgot-password`;
    console.log('📡 Enviando request a:', url);
    
    this.http.post<any>(url, { email: this.formData.email }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);
        
        if (response.success) {
          this.successMessage = response.message;
          this.recoveryToken = response.recovery_token || ''; // Para desarrollo
          this.currentStep = 'verify';
          
          console.log('✅ Código enviado exitosamente');
        } else {
          this.errorMessage = response.error || 'Error al enviar código';
          console.log('❌ Error en respuesta:', this.errorMessage);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('💥 Error en request:', error);
        this.errorMessage = 'Error de conexión. ¿Está corriendo el servidor?';
        this.isLoading = false;
      }
    });
  }
  
  onVerifyCode(): void {
    if (this.isLoading) return;
    
    console.log('🔍 Verificando código:', this.formData.token.substring(0, 10) + '...');
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const url = `${APP_CONFIG.API_BASE_URL}/auth/verify-recovery-token`;
    
    this.http.post<any>(url, { token: this.formData.token }).subscribe({
      next: (response) => {
        console.log('✅ Verificación response:', response);
        
        if (response.success) {
          this.currentStep = 'reset';
          console.log('🔓 Token válido, procediendo a reset');
        } else {
          this.errorMessage = response.error || 'Código inválido';
          console.log('❌ Token inválido:', this.errorMessage);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('💥 Error en verificación:', error);
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
    
    console.log('🔐 Cambiando contraseña...');
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const url = `${APP_CONFIG.API_BASE_URL}/auth/reset-password`;
    
    this.http.post<any>(url, {
      token: this.formData.token,
      new_password: this.formData.newPassword
    }).subscribe({
      next: (response) => {
        console.log('✅ Reset response:', response);
        
        if (response.success) {
          this.currentStep = 'success';
          console.log('🎉 Contraseña cambiada exitosamente');
        } else {
          this.errorMessage = response.error || 'Error al cambiar contraseña';
          console.log('❌ Error al cambiar:', this.errorMessage);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('💥 Error en reset:', error);
        this.errorMessage = 'Error al cambiar contraseña. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  useDevToken(): void {
    if (this.recoveryToken) {
      this.formData.token = this.recoveryToken;
      console.log('✅ Token copiado al campo de verificación');
    }
  }
  
  goBack(): void {
    if (this.currentStep === 'verify') {
      this.currentStep = 'request';
      this.errorMessage = '';
    } else if (this.currentStep === 'reset') {
      this.currentStep = 'verify';
      this.errorMessage = '';
    }
    console.log('⬅️ Volviendo al paso anterior');
  }
  
  goToLogin(): void {
    console.log('🚪 Navegando al login');
    this.router.navigate(['/login']);
  }
  
  clearError(): void {
    this.errorMessage = '';
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