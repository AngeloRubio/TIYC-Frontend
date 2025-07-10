import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject, filter, map } from 'rxjs';
import { CommonModule } from '@angular/common';

import { StoryService } from '../../services/story.service';
import { PdfService, PDFValidationResponse } from '../../services/pdf.service';
import { Story, Scenario, Image as StoryImage } from '../../models/story.model';
import { ImageModalComponent } from '../shared/image-modal/image-modal.component';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  child_friendly_score?: number;
  suggested_improvements?: string[];
  images_count?: number;
}

@Component({
  selector: 'app-story-detail',
  templateUrl: './story-detail.component.html',
  styleUrls: ['./story-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, ImageModalComponent]
})
export class StoryDetailComponent implements OnInit, OnDestroy {
  // Propiedades principales
  story: Story | null = null;
  scenarios: Scenario[] = [];
  images: StoryImage[] = [];
  storyData: any = null; // Para compatibilidad con template existente
  isLoading = true;
  error: string | null = null;
  
  // Propiedades para PDF
  isExporting: boolean = false;
  exportProgress: number = 0;
  exportMessage: string = '';
  isValidatingPdf = false;
  pdfValidationResult: ValidationResult | null = null;
  showValidationDetails = false;
  
  // Propiedades para navegación
  private storyIdSubject = new BehaviorSubject<string | null>(null);
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storyService: StoryService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeComponent(): void {
    const storyIdSubscription = this.route.paramMap.subscribe(params => {
      const storyId = params.get('id');
      if (storyId) {
        this.storyIdSubject.next(storyId);
      }
    });

    const loadSubscription = this.storyIdSubject.pipe(
      filter(storyId => !!storyId)
    ).subscribe(storyId => {
      if (storyId) {
        this.loadStoryDetail(storyId);
      }
    });

    this.subscriptions.push(storyIdSubscription, loadSubscription);
  }

  // Método público para compatibilidad con template
  loadStoryDetail(storyId?: string): void {
    if (!storyId) {
      const currentStoryId = this.storyIdSubject.value;
      if (currentStoryId) {
        storyId = currentStoryId;
      } else {
        return;
      }
    }

    this.isLoading = true;
    this.error = null;

    this.storyService.getStoryWithDetails(storyId).subscribe({
      next: (response: any) => {
        console.log('📖 Datos del cuento recibidos:', response);
        
        if (response?.success && response?.story) {
          this.story = response.story;
          this.scenarios = response.scenarios || [];
          
          // Extraer imágenes de los scenarios
          this.images = [];
          this.scenarios.forEach(scenario => {
            if (scenario.image) {
              this.images.push(scenario.image);
            }
          });
          
          this.storyData = response; // Para compatibilidad con template
          
          console.log(`✅ Cuento cargado: "${this.story?.title}"`);
          console.log(`📚 Escenarios: ${this.scenarios.length}`);
          console.log(`🖼️ Imágenes: ${this.images.length}`);
        } else {
          this.error = 'No se encontraron datos del cuento';
        }
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando cuento:', error);
        this.error = 'Error al cargar el cuento';
        this.isLoading = false;
      }
    });
  }

  exportToPDF(): void {
    if (!this.story) {
      console.error('❌ No hay cuento disponible para exportar');
      return;
    }

    console.log('📄 Iniciando exportación PDF del cuento:', this.story.id);
    this.isExporting = true;
    this.exportProgress = 0;
    this.exportMessage = 'Preparando exportación...';

    this.updateProgress(10, 'Validando contenido...');

    const pdfConfig = {
      format: 'A4',
      orientation: 'portrait',
      include_images: true,
      include_cover: true,
      colorful_design: true,
      child_friendly_layout: true
    };

    const exportData = {
      config: pdfConfig,
      teacher_id: null
    };

    this.updateProgress(30, 'Generando PDF...');

    this.storyService.exportStoryToPDF(this.story.id, exportData)
      .subscribe({
        next: (response: Blob) => {
          this.updateProgress(80, 'Preparando descarga...');
          
          console.log('✅ PDF generado exitosamente');
          
          const filename = `${this.story?.title?.replace(/[^a-zA-Z0-9\s]/g, '_') || 'cuento'}.pdf`;
          
          const url = window.URL.createObjectURL(response);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
          
          this.updateProgress(100, 'Descarga completada');
          
          setTimeout(() => {
            this.isExporting = false;
            this.exportProgress = 0;
            this.exportMessage = '';
          }, 1500);
          
          console.log(`✅ PDF descargado: ${filename}`);
        },
        error: (error: any) => {
          console.error('❌ Error exportando PDF:', error);
          this.isExporting = false;
          this.exportProgress = 0;
          this.exportMessage = '';
          
          this.showErrorMessage('Error al generar el PDF. Por favor, inténtalo de nuevo.');
        }
      });
  }

  validateForPdf(): void {
    if (!this.story) {
      console.error('❌ No hay cuento disponible para validar');
      return;
    }

    this.isValidatingPdf = true;
    this.pdfValidationResult = null;

    this.pdfService.validateStoryForPdf(this.story.id).subscribe({
      next: (result: PDFValidationResponse) => {
        console.log('📋 Resultado de validación completo:', result);
        
        // Convertir PDFValidationResponse a ValidationResult
        this.pdfValidationResult = {
          valid: result.success || false,
          errors: result.error ? [result.error] : [],
          warnings: [],
          recommendations: [],
          child_friendly_score: 0,
          suggested_improvements: [],
          images_count: 0
        };
        
        this.isValidatingPdf = false;
        
        if (result.success) {
          console.log('✅ Cuento válido para PDF');
        } else {
          console.log('❌ Cuento no válido para PDF:', result.error);
        }
      },
      error: (error: any) => {
        console.error('❌ Error validando para PDF:', error);
        this.isValidatingPdf = false;
        this.showErrorMessage('Error al validar el cuento para PDF');
      }
    });
  }

  toggleValidationDetails(): void {
    this.showValidationDetails = !this.showValidationDetails;
  }

  getScenarioImage(scenarioId: string): StoryImage | undefined {
    return this.images.find(img => img.scenario_id === scenarioId);
  }

  onImageError(event: any): void {
    console.warn('❌ Error cargando imagen:', event.target.src);
    event.target.style.display = 'none';
  }

  goBack(): void {
    this.router.navigate(['/biblioteca']);
  }

  editStory(): void {
    if (this.story) {
      this.router.navigate(['/editar-cuento', this.story.id]);
    }
  }

  deleteStory(): void {
    if (!this.story) return;

    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar el cuento "${this.story.title}"?`);
    
    if (confirmDelete) {
      // Simulación de eliminación - adaptar según tu StoryService
      console.log('Eliminar cuento:', this.story.id);
      this.router.navigate(['/biblioteca']);
    }
  }

  createNew(): void {
    this.router.navigate(['/crear-cuento']);
  }

  private updateProgress(progress: number, message: string): void {
    this.exportProgress = progress;
    this.exportMessage = message;
  }

  private showErrorMessage(message: string): void {
    alert(message);
  }

  // Métodos para compatibilidad con template existente
  getCategoryEmoji(category: string): string {
    const emojis: { [key: string]: string } = {
      'aventura': '🗺️',
      'fantasia': '🦄',
      'ciencia': '🔬',
      'naturaleza': '🌿',
      'amistad': '👫',
      'familia': '👨‍👩‍👧‍👦',
      'valores': '⭐',
      'educativo': '📚'
    };
    return emojis[category.toLowerCase()] || '📖';
  }

  getPedagogicalApproachLabel(approach?: string): string {
    if (!approach) return 'Tradicional';
    
    const approaches: { [key: string]: string } = {
      'montessori': 'Montessori',
      'waldorf': 'Waldorf',
      'traditional': 'Tradicional'
    };
    
    return approaches[approach] || approach;
  }

  getPedagogicalApproachColor(approach: string): string {
    switch (approach) {
      case 'montessori':
        return 'bg-red-500';
      case 'waldorf':
        return 'bg-green-500';
      case 'traditional':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getOrderedScenarios(): Scenario[] {
    return this.scenarios.sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
  }

  getTotalImages(): number {
    return this.images.length;
  }

  getChapterTitle(chapterNumber: number): string {
    const titles = [
      '🌟 El Comienzo de la Aventura',
      '🎭 El Desarrollo de la Historia',
      '🎨 Momentos Especiales',
      '🌈 Descubrimientos Importantes',
      '💫 El Clímax de la Historia',
      '🎉 El Final Feliz'
    ];
    
    return titles[chapterNumber - 1] || `📖 Capítulo ${chapterNumber}`;
  }

  openImageModal(scenario: Scenario, index: number): void {
    console.log('Abrir modal de imagen:', scenario, index);
    // Implementar modal de imagen
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return `http://localhost:5000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  getStoryContentForScene(sceneIndex: number): string {
    if (!this.story?.content) return '';
    
    // Dividir el contenido en párrafos para cada escena
    const paragraphs = this.story.content.split('\n').filter(p => p.trim().length > 0);
    
    if (sceneIndex < paragraphs.length) {
      return paragraphs[sceneIndex];
    }
    
    // Si no hay suficientes párrafos, usar descripción del escenario
    const scenario = this.scenarios[sceneIndex];
    return scenario?.description || 'Contenido del escenario...';
  }

  // Métodos auxiliares para el template
  getValidationStatusClass(): string {
    if (!this.pdfValidationResult) return '';
    return this.pdfValidationResult.valid ? 'text-success' : 'text-danger';
  }

  getValidationStatusIcon(): string {
    if (!this.pdfValidationResult) return '';
    return this.pdfValidationResult.valid ? '✅' : '❌';
  }

  getValidationStatusText(): string {
    if (!this.pdfValidationResult) return '';
    return this.pdfValidationResult.valid ? 'Válido para PDF' : 'Requiere ajustes';
  }

  getScenarioCount(): number {
    return this.scenarios.length;
  }

  getImageCount(): number {
    return this.images.length;
  }

  hasContent(): boolean {
    return !!(this.story?.content && this.story.content.trim().length > 0);
  }

  getContentPreview(): string {
    if (!this.story?.content) return '';
    const preview = this.story.content.substring(0, 150);
    return preview.length < this.story.content.length ? preview + '...' : preview;
  }

  getCreationDate(): string {
    if (!this.story?.created_at) return '';
    return new Date(this.story.created_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}