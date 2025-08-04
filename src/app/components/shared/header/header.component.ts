import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { AuthService } from '../../../services/auth.service';
import { RoleService } from '../../../services/role.service';
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
  
  private readonly subscriptions = new Subscription();
  
  constructor(
    public readonly router: Router,
    private readonly authService: AuthService,
    private readonly roleService: RoleService,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}
  
  ngOnInit(): void {
    this.loadUserInfo();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Navega a la página de biblioteca
   */
  goToLibrary(): void {
    this.closeUserMenu();
    this.safeNavigate('/biblioteca');
  }
  
  /**
   * Navega a la página de configuración
   */
  goToConfig(): void {
    this.closeUserMenu();
    this.safeNavigate('/configuracion');
  }

  /**
   * Navega al panel de administración
   */
  goToAdmin(): void {
    this.closeUserMenu();
    this.safeNavigate('/admin');
  }
  
  /**
   * Maneja el logout del usuario
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
  }
  
  /**
   * Cierra el menú de usuario
   */
  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    const user = this.currentUser;
    const roleServiceResult = this.roleService.isCurrentUserAdmin();
    const directCheck = user?.role === 'admin';
    
    console.log('🔍 Header - Usuario actual:', user);
    console.log('🔍 Header - Role en usuario:', user?.role);
    console.log('🔍 Header - RoleService result:', roleServiceResult);
    console.log('🔍 Header - Direct check:', directCheck);
    
    return directCheck;
  }

  /**
   * Obtiene el rol del usuario para mostrar
   */
  getUserRole(): string {
    if (!this.currentUser?.role) return '';
    return this.roleService.getRoleLabel(this.currentUser.role);
  }

  /**
   * Obtiene la clase CSS para el badge del rol
   */
  getUserRoleBadgeClass(): string {
    if (!this.currentUser?.role) return 'bg-gray-100 text-gray-800';
    return this.roleService.getRoleBadgeClass(this.currentUser.role);
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

  /**
   * Navegación segura con fallbacks
   */
  private safeNavigate(route: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      try {
        if (this.router?.navigate) {
          this.router.navigate([route]);
        } else {
          this.fallbackNavigate(route);
        }
      } catch (error) {
        this.fallbackNavigate(route);
      }
    }, 0);
  }

  /**
   * Navegación de fallback usando window.location
   */
  private fallbackNavigate(route: string): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = route;
    }
  }

  /**
   * Logout seguro con fallbacks
   */
  private safeLogout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      try {
        if (this.authService?.logout) {
          this.authService.logout();
        } else {
          this.fallbackLogout();
        }
      } catch (error) {
        this.fallbackLogout();
      }
    }, 0);
  }

  /**
   * Logout de fallback manual
   */
  private fallbackLogout(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem('tiyc_auth_token');
        localStorage.removeItem('tiyc_user_data');
      } catch (e) {
        // Silently handle localStorage errors
      }
      
      window.location.href = '/login';
    }
  }

  /**
   * Cargar información del usuario
   */
  private loadUserInfo(): void {
    if (!isPlatformBrowser(this.platformId) || !this.authService) {
      return;
    }

    try {
      if (this.authService.isAuthenticated$) {
        const authSub = this.authService.isAuthenticated$.subscribe({
          next: (isAuth: boolean) => {
            this.isAuthenticated = isAuth;
          },
          error: (error) => {
            // Handle error silently or with minimal logging
          }
        });
        this.subscriptions.add(authSub);
      }
      
      if (this.authService.currentUser$) {
        const userSub = this.authService.currentUser$.subscribe({
          next: (user: Teacher | null) => {
            this.currentUser = user;
            console.log('🔍 Header - Usuario actualizado:', user);
          },
          error: (error) => {
            // Handle error silently or with minimal logging
          }
        });
        this.subscriptions.add(userSub);
      }
    } catch (error) {
      // Handle initialization errors silently
    }
  }
}