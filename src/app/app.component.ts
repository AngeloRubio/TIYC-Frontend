import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

import { HeaderComponent } from './components/shared/header/header.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'TIYC - Tú Inspiras, Yo Creo';
  
  // Estado de la aplicación
  isLoading = true;
  isAuthenticated = false;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.initializeApp();
  }
  
  /**
   * Inicializa la aplicación verificando el estado de autenticación
   */
  private initializeApp(): void {
    // Suscribirse al estado de autenticación
    this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        this.isLoading = false;
        
        // Redirigir según el estado de autenticación
        this.handleAuthRedirect();
      }
    );
  }
  
  /**
   * Maneja las redirecciones según el estado de autenticación
   */
  private handleAuthRedirect(): void {
    const currentUrl = this.router.url;
    
    if (!this.isAuthenticated && currentUrl !== '/login') {
      // Usuario no autenticado y no está en login -> redirigir a login
      this.router.navigate(['/login']);
    } else if (this.isAuthenticated && currentUrl === '/login') {
      // Usuario autenticado y está en login -> redirigir a biblioteca
      this.router.navigate(['/biblioteca']);
    }
  }
}