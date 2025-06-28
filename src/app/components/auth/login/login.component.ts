import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { CopyrightFooterComponent } from '../../shared/copyright-footer/copyright-footer.component';
import { APP_CONFIG } from '../../../config/app.config';

@Component({
 selector: 'app-login',
 standalone: true,
 imports: [CommonModule, FormsModule, RouterModule, CopyrightFooterComponent],
 templateUrl: './login.component.html',
 styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginData = {
    email: '',
    password: ''
  };
  
  isLoading = false;
  errorMessage = '';
  
  private returnUrl: string = APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT;
  }
  
  onSubmit(): void {
    if (this.isLoading) return;
    
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.errorMessage = response.error || 'Error de autenticación';
        }
        this.isLoading = false;
      },
      error: (error) => {
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
  
  clearError(): void {
    this.errorMessage = '';
  }
}