import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { APP_CONFIG } from '../../../config/app.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // Datos del formulario
  loginData = {
    email: '',
    password: ''
  };
  
  // Estado del componente
  isLoading = false;
  errorMessage = '';
  
  
  private returnUrl: string = APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // ✅ Agregar ActivatedRoute
  ) {}
  
  ngOnInit(): void {
  
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT;
    console.log('🔗 LoginComponent: URL de retorno configurada:', this.returnUrl);
  }
  
  /**
   * Maneja el envío del formulario de login
   */
  onSubmit(): void {
    if (this.isLoading) return;
    
    // Validación básica
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('🔐 Intentando login...');
    
    // Usar login real con el backend
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Login exitoso, redirigiendo a:', this.returnUrl);
          
          
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.errorMessage = response.error || 'Error de autenticación';
          console.log('❌ Error en login:', this.errorMessage);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('💥 Error en conexión de login:', error);
        
        // Mejorar mensajes de error específicos
        if (error.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage = 'No se puede conectar con el servidor. ¿Está corriendo en http://localhost:5000?';
        } else if (error.status >= 500) {
          this.errorMessage = 'Error del servidor. Inténtalo más tarde.';
        } else {
          this.errorMessage = 'Error de conexión. Inténtalo de nuevo.';
        }
        
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Limpia el mensaje de error
   */
  clearError(): void {
    this.errorMessage = '';
  }
}