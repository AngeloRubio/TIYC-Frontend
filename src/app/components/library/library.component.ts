import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { StoryService } from '../../services/story.service';
import { AuthService } from '../../services/auth.service';
import { Story, Teacher } from '../../models/story.model';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit, OnDestroy {
  
  // Estado del componente
  stories: Story[] = [];
  isLoading = true;
  error: string | null = null;
  currentUser: Teacher | null = null;
  
  // Filtros y búsqueda
  searchTerm = '';
  selectedFilter: 'all' | 'recent' | 'category' = 'all';
  
  // Subscripciones
  private subscriptions = new Subscription();
  
  constructor(
    private router: Router,
    private storyService: StoryService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.initializeComponent();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Inicializa el componente obteniendo usuario y cargando cuentos
   */
  private initializeComponent(): void {
    const userSub = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
        if (user) {
          this.loadUserStories();
        } else {
          this.router.navigate(['/login']);
        }
      }
    );
    
    this.subscriptions.add(userSub);
  }
  
  /**
   * Carga los cuentos del usuario actual
   */
  private loadUserStories(): void {
    if (!this.currentUser?.id) {
      this.error = 'Usuario no identificado';
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    const storiesSub = this.storyService.getTeacherStories(this.currentUser.id, 20).subscribe({
      next: (response) => {
        if (response.success) {
          this.stories = response.stories || [];
        } else {
          this.error = response.error || 'Error al cargar cuentos';
        }
        this.isLoading = false;
      },
      error: (error) => {
        if (error.status === 401) {
          this.error = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          this.router.navigate(['/login']);
        } else if (error.status === 0) {
          this.error = 'No se puede conectar con el servidor.';
        } else {
          this.error = 'Error de conexión al cargar los cuentos';
        }
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(storiesSub);
  }
  
  /**
   * Navega a la página de creación de cuento
   */
  goToCreate(): void {
    this.router.navigate(['/crear']);
  }
  
  /**
   * Navega al detalle de un cuento específico
   */
  viewStory(storyId: string): void {
    this.router.navigate(['/cuento', storyId]);
  }
  
  /**
   * Filtrar cuentos por búsqueda
   */
  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm.toLowerCase();
  }
  
  /**
   * Cambiar filtro activo
   */
  setFilter(filter: 'all' | 'recent' | 'category'): void {
    this.selectedFilter = filter;
  }
  
  /**
   * Obtener cuentos filtrados
   */
  getFilteredStories(): Story[] {
    let filtered = [...this.stories];
    
    // Filtro por búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(story => 
        story.title.toLowerCase().includes(this.searchTerm) ||
        story.category.toLowerCase().includes(this.searchTerm) ||
        story.context.toLowerCase().includes(this.searchTerm)
      );
    }
    
    // Filtro por tipo
    switch (this.selectedFilter) {
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 10);
        break;
      case 'category':
        filtered = filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }
    
    return filtered;
  }
  
  /**
   * ✅ NUEVO: Obtener información completa del usuario
   */
  getUserInfo(): string {
    if (!this.currentUser) {
      return 'Información no disponible';
    }
    
    const name = this.getUserDisplayName();
    const school = this.currentUser.school || '';
    const grade = this.currentUser.grade || '';
    
    let info = `Bienvenido, ${name}`;
    
    if (school && school !== 'Escuela Recuperada' && school !== 'Escuela no especificada') {
      info += ` - ${school}`;
    }
    
    if (grade && grade !== 'Grado Recuperado') {
      info += ` (${grade})`;
    }
    
    return info;
  }
  
  /**
   * ✅ MEJORADO: Obtener nombre real del usuario
   */
  getUserDisplayName(): string {
    if (!this.currentUser) {
      return 'Profesor';
    }
    
    if (this.currentUser.username && this.currentUser.username !== 'Usuario Recuperado') {
      return this.currentUser.username;
    }
    
    if (this.currentUser.email) {
      const emailName = this.currentUser.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'Profesor';
  }
  
  /**
   * Obtener etiqueta de enfoque pedagógico con color
   */
  getPedagogicalApproachLabel(approach: string): {label: string, color: string} {
    switch (approach) {
      case 'montessori':
        return { label: 'Montessori', color: 'bg-blue-500' };
      case 'waldorf':
        return { label: 'Waldorf', color: 'bg-purple-500' };
      case 'traditional':
        return { label: 'Reggio Emilia', color: 'bg-green-500' };
      default:
        return { label: approach, color: 'bg-gray-500' };
    }
  }
  
  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  
  /**
   * Obtener emoji para categoría
   */
  getCategoryEmoji(category: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('aventura')) return '🗺️';
    if (categoryLower.includes('ciencia')) return '🔬';
    if (categoryLower.includes('fantasía')) return '🧚‍♀️';
    if (categoryLower.includes('naturaleza')) return '🌿';
    if (categoryLower.includes('animales')) return '🐾';
    if (categoryLower.includes('arte') || categoryLower.includes('color')) return '🎨';
    if (categoryLower.includes('música')) return '🎵';
    if (categoryLower.includes('valor')) return '💎';
    if (categoryLower.includes('amistad')) return '👫';
    if (categoryLower.includes('familia')) return '👨‍👩‍👧‍👦';
    
    return '📖';
  }
  
  /**
   * Verificar si hay cuentos para mostrar
   */
  hasStories(): boolean {
    return this.getFilteredStories().length > 0;
  }
  
  /**
   * Obtener mensaje cuando no hay cuentos
   */
  getEmptyMessage(): string {
    if (this.searchTerm) {
      return `No se encontraron cuentos que coincidan con "${this.searchTerm}"`;
    }
    
    if (this.selectedFilter === 'recent') {
      return 'No hay cuentos recientes para mostrar';
    }
    
    return 'Aún no has creado ningún cuento. ¡Comienza creando tu primera historia!';
  }
}