import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { AuthService } from '../../../services/auth.service';
import { Teacher } from '../../../models/story.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('slideDown', [
      state('closed', style({
        opacity: 0,
        transform: 'translateY(-10px) scale(0.95)',
        visibility: 'hidden'
      })),
      state('open', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        visibility: 'visible'
      })),
      transition('closed => open', [
        animate('200ms ease-out')
      ]),
      transition('open => closed', [
        animate('150ms ease-in')
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  
  isUserMenuOpen = false;
  currentUser: Teacher | null = null;
  isAuthenticated = false;
  
  private subscriptions = new Subscription();
  
  constructor(
    public router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    this.loadUserInfo();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Navega a la página de biblioteca
   * Mantiene compatibilidad con tu template original
   */
  goToLibrary(): void {
    this.closeUserMenu();
    this.safeNavigate('/biblioteca');
  }
  
  /**
   * Navega a la página de configuración
   * Mantiene compatibilidad con tu template original
   */
  goToConfig(): void {
    this.closeUserMenu();
    this.safeNavigate('/configuracion');
  }
  
  /**
   * Maneja el logout del usuario
   * Mantiene compatibilidad con tu template original
   */
  logout(): void {
    this.closeUserMenu();
    this.safeLogout();
  }

  /**
   * Alterna la visibilidad del menú de usuario
   */
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    console.log('Menu toggled:', this.isUserMenuOpen);
  }
  
  /**
   * Cierra el menú de usuario
   */
  closeUserMenu(): void {
    this.isUserMenuOpen = false;
    console.log('Menu closed');
  }

  /**
   * Navegación segura con fallbacks
   */
  private safeNavigate(route: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('SSR: Navigation skipped');
      return;
    }

    setTimeout(() => {
      try {
        if (this.router && this.router.navigate) {
          this.router.navigate([route]);
          console.log(`Navigated to: ${route}`);
        } else {
          throw new Error('Router not available');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        this.fallbackNavigate(route);
      }
    }, 0);
  }

  /**
   * Navegación de fallback usando window.location
   */
  private fallbackNavigate(route: string): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log(`Fallback navigation to: ${route}`);
      window.location.href = route;
    }
  }

  /**
   * Logout seguro con fallbacks
   */
  private safeLogout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('SSR: Logout skipped');
      return;
    }

    setTimeout(() => {
      try {
        if (this.authService && typeof this.authService.logout === 'function') {
          this.authService.logout();
          console.log('Logout via AuthService');
        } else {
          throw new Error('AuthService logout not available');
        }
      } catch (error) {
        console.error('Logout error:', error);
        this.fallbackLogout();
      }
    }, 0);
  }

  /**
   * Logout de fallback manual
   */
  private fallbackLogout(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('Fallback logout');
      
      try {
        localStorage.removeItem('tiyc_auth_token');
        localStorage.removeItem('tiyc_user_data');
      } catch (e) {
        console.warn('Could not clear localStorage:', e);
      }
      
      window.location.href = '/login';
    }
  }

  /**
   * Cargar información del usuario
   */
  private loadUserInfo(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('SSR: User info loading skipped');
      return;
    }

    try {
      if (this.authService) {
        
        if (this.authService.isAuthenticated$) {
          const authSub = this.authService.isAuthenticated$.subscribe({
            next: (isAuth: boolean) => {
              this.isAuthenticated = isAuth;
              console.log('Auth status updated:', isAuth);
            },
            error: (error) => {
              console.error('Auth subscription error:', error);
            }
          });
          this.subscriptions.add(authSub);
        }
        
        if (this.authService.currentUser$) {
          const userSub = this.authService.currentUser$.subscribe({
            next: (user: Teacher | null) => {
              this.currentUser = user;
              console.log('User updated:', user?.username || 'No user');
            },
            error: (error) => {
              console.error('User subscription error:', error);
            }
          });
          this.subscriptions.add(userSub);
        }

        console.log('User info subscriptions established');
        
      } else {
        console.error('AuthService not available');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  /**
   * Obtener nombre para mostrar del usuario
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Profesor';
    return this.currentUser.username || 'Usuario';
  }
  
  /**
   * Obtener email del usuario
   */
  getUserEmail(): string {
    if (!this.currentUser) return '';
    return this.currentUser.email || '';
  }
  
  /**
   * Estado de la animación del dropdown
   */
  getDropdownAnimationState(): string {
    return this.isUserMenuOpen ? 'open' : 'closed';
  }
}