import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { CopyrightFooterComponent } from '../../shared/copyright-footer/copyright-footer.component';
import { APP_CONFIG } from '../../../config/app.config';

interface LoginFormData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopyrightFooterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  readonly loginData: LoginFormData = {
    email: '',
    password: ''
  };
  
  isLoading = false;
  errorMessage = '';
  
  private returnUrl: string = APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT;
  
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || APP_CONFIG.AUTH_CONFIG.LOGIN_REDIRECT;
  }
  
  onSubmit(): void {
    if (this.isLoading || !this.isFormValid()) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => this.handleLoginResponse(response),
      error: (error) => this.handleLoginError(error)
    });
  }
  
  clearError(): void {
    this.errorMessage = '';
  }

  private isFormValid(): boolean {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return false;
    }
    return true;
  }

  private handleLoginResponse(response: any): void {
    if (response.success) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.errorMessage = response.error || 'Error de autenticación';
    }
    this.isLoading = false;
  }

  private handleLoginError(error: any): void {
    this.errorMessage = this.getErrorMessage(error);
    this.isLoading = false;
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Email o contraseña incorrectos';
    }
    if (error.status === 0) {
      return 'No se puede conectar con el servidor. ¿Está corriendo en http://localhost:5000?';
    }
    if (error.status >= 500) {
      return 'Error del servidor. Inténtalo más tarde.';
    }
    return 'Error de conexión. Inténtalo de nuevo.';
  }
}