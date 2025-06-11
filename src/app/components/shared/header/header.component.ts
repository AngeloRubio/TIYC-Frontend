import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  // Estado del dropdown del usuario
  isUserMenuOpen = false;
  
  // Información del usuario
  currentUser: Teacher | null = null;
  isAuthenticated = false;
  
  // Subscripciones
  private subscriptions = new Subscription();
  
  constructor(
    public router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.loadUserInfo();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
   * Navega a la página de biblioteca
   * ⭐ ACTUALIZADO: goToHome() eliminado, solo biblioteca
   */
  goToLibrary(): void {
    this.closeUserMenu();
    this.router.navigate(['/biblioteca']);
  }
  
  /**
   * Navega a la página de configuración
   */
  goToConfig(): void {
    this.closeUserMenu();
    this.router.navigate(['/configuracion']);
  }
  
  /**
   * ❌ ELIMINADO: goToHome() - Ya no es necesario
   * El logo ahora redirige directamente a biblioteca
   */
  
  /**
   * Maneja el logout del usuario
   */
  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }
  
  /**
   * Carga la información del usuario autenticado
   */
  private loadUserInfo(): void {
    // Suscribirse al estado de autenticación
    const authSub = this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );
    
    // Suscribirse a los datos del usuario
    const userSub = this.authService.currentUser$.subscribe(
      user => this.currentUser = user
    );
    
    this.subscriptions.add(authSub);
    this.subscriptions.add(userSub);
  }
  
  /**
   * Obtiene el nombre para mostrar del usuario
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Usuario';
    return this.currentUser.username || 'Profesor';
  }
  
  /**
   * Obtiene el email del usuario
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