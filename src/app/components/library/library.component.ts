import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { StoryService } from '../../services/story.service';
import { AuthService } from '../../services/auth.service';
import { Story, Teacher } from '../../models/story.model';
import { ImageModalService, ImageModalData } from '../../services/image-modal.service';
import { ImageModalComponent } from '../shared/image-modal/image-modal.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, ImageModalComponent],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit, OnDestroy {

  stories: Story[] = [];
  isLoading = true;
  error: string | null = null;
  currentUser: Teacher | null = null;

  searchTerm = '';
  selectedFilter: 'all' | 'recent' | 'category' = 'all';

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private storyService: StoryService,
    private authService: AuthService,
    private imageModalService: ImageModalService
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

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

  goToCreate(): void {
    this.router.navigate(['/crear']);
  }

  viewStory(storyId: string): void {
    this.router.navigate(['/cuento', storyId]);
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm.toLowerCase();
  }

  setFilter(filter: 'all' | 'recent' | 'category'): void {
    this.selectedFilter = filter;
  }

  getFilteredStories(): Story[] {
    let filtered = [...this.stories];

    if (this.searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(this.searchTerm) ||
        story.category.toLowerCase().includes(this.searchTerm) ||
        story.context.toLowerCase().includes(this.searchTerm)
      );
    }

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

  getPedagogicalApproachLabel(approach: string): { label: string, color: string } {
    switch (approach) {
      case 'montessori':
        return { label: 'Montessori', color: 'bg-blue-500' };
      case 'waldorf':
        return { label: 'Waldorf', color: 'bg-purple-500' };
      case 'traditional':
        return { label: 'Tradicional', color: 'bg-green-500' };
      default:
        return { label: approach, color: 'bg-gray-500' };
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  hasStories(): boolean {
    return this.getFilteredStories().length > 0;
  }

  getEmptyMessage(): string {
    if (this.searchTerm) {
      return `No se encontraron cuentos que coincidan con "${this.searchTerm}"`;
    }

    if (this.selectedFilter === 'recent') {
      return 'No hay cuentos recientes para mostrar';
    }

    return 'Aún no has creado ningún cuento. ¡Comienza creando tu primera historia!';
  }

  //  Sistema de imágenes por metodología pedagógica
  getPedagogicalImage(approach: string): string {
    const images: { [key: string]: string } = {
      'montessori': '/assets/images/methodologies/montessori.jpg',
      'waldorf': '/assets/images/methodologies/waldorf.jpg',
      'traditional': '/assets/images/methodologies/traditional.jpg'
    };
    return images[approach] || '/assets/images/methodologies/traditional.jpg';
  }

  // Modal sin placeholder SVG
  openImageModal(story: Story, categoryIndex: number): void {
    const imageData: ImageModalData = {
      imageUrl: this.getPedagogicalImage(story.pedagogical_approach),
      title: story.title,
      description: story.context || 'Vista previa del cuento',
      chapterNumber: 1,
      prompt: `Cuento con metodología: ${story.pedagogical_approach}`
    };

    this.imageModalService.openModal(imageData);
  }
}