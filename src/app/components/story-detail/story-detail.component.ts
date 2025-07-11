import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject, filter, interval, takeWhile } from 'rxjs';
import { CommonModule } from '@angular/common';

import { StoryService } from '../../services/story.service';
import { PdfService, PDFValidationResponse } from '../../services/pdf.service';
import { Story, Scenario, Image as StoryImage } from '../../models/story.model';
import { ImageModalComponent } from '../shared/image-modal/image-modal.component';
import { ImageModalService, ImageModalData } from '../../services/image-modal.service';

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
  story: Story | null = null;
  scenarios: Scenario[] = [];
  images: StoryImage[] = [];
  storyData: any = null;
  isLoading = true;
  error: string | null = null;
  
  isExporting: boolean = false;
  exportProgress: number = 0;
  exportMessage: string = '';
  isValidatingPdf = false;
  pdfValidationResult: ValidationResult | null = null;
  showValidationDetails = false;
  
  private readonly storyIdSubject = new BehaviorSubject<string | null>(null);
  private readonly subscriptions: Subscription[] = [];
  private readonly chapterTitles = [
    '🌟 El Comienzo de la Aventura',
    '🎭 El Desarrollo de la Historia',
    '🎨 Momentos Especiales',
    '🌈 Descubrimientos Importantes',
    '💫 El Clímax de la Historia',
    '🎉 El Final Feliz'
  ];

  private readonly progressSteps = [
    { progress: 10, message: 'Validando contenido del cuento...' },
    { progress: 25, message: 'Preparando estructura del PDF...' },
    { progress: 40, message: 'Procesando imágenes...' },
    { progress: 60, message: 'Aplicando formato pedagógico...' },
    { progress: 75, message: 'Optimizando para niños...' },
    { progress: 90, message: 'Finalizando documento...' },
    { progress: 100, message: 'PDF generado exitosamente' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storyService: StoryService,
    private pdfService: PdfService,
    private imageModalService: ImageModalService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.subscribeToExportProgress();
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

  private subscribeToExportProgress(): void {
    const progressSubscription = this.pdfService.exportProgress$.subscribe(progress => {
      this.isExporting = progress.isExporting;
      this.exportProgress = progress.progress;
      this.exportMessage = progress.message;
    });

    this.subscriptions.push(progressSubscription);
  }

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
          
          this.images = [];
          this.scenarios.forEach(scenario => {
            if (scenario.image) {
              this.images.push(scenario.image);
            }
          });
          
          this.storyData = response;
          
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

    const pdfConfig = {
      format: 'A4',
      orientation: 'portrait',
      include_images: true,
      include_cover: true,
      colorful_design: true,
      child_friendly_layout: true
    };

    this.startProgressSimulation();

    this.storyService.exportStoryToPDF(this.story.id, { config: pdfConfig })
      .subscribe({
        next: (response: Blob) => {
          this.completeExport(response);
        },
        error: (error: any) => {
          this.handleExportError(error);
        }
      });
  }

  private startProgressSimulation(): void {
    this.pdfService.setExportProgress(true, 0, 'Iniciando exportación...');
    
    let currentStep = 0;
    
    const progressTimer = interval(800).pipe(
      takeWhile(() => currentStep < this.progressSteps.length && this.isExporting)
    ).subscribe(() => {
      if (currentStep < this.progressSteps.length) {
        const step = this.progressSteps[currentStep];
        this.pdfService.setExportProgress(true, step.progress, step.message);
        currentStep++;
      }
    });

    this.subscriptions.push(progressTimer);
  }

  private completeExport(response: Blob): void {
    this.pdfService.setExportProgress(true, 100, 'Preparando descarga...');
    
    setTimeout(() => {
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
      
      this.pdfService.setExportProgress(false, 0, '');
      
      console.log(`✅ PDF descargado: ${filename}`);
    }, 500);
  }

  private handleExportError(error: any): void {
    console.error('❌ Error exportando PDF:', error);
    this.pdfService.setExportProgress(false, 0, '');
    this.showErrorMessage('Error al generar el PDF. Por favor, inténtalo de nuevo.');
  }

  getStoryContentForScene(sceneIndex: number): string {
    if (!this.story?.content) return '';
    
    const content = this.story.content;
    const activityIndex = content.indexOf('**Actividad');
    
    let narrativeContent = content;
    if (activityIndex !== -1) {
      narrativeContent = content.substring(0, activityIndex).trim();
    }
    
    const paragraphs = narrativeContent
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 20)
      .map(p => p.trim());
    
    if (paragraphs.length === 0) return '';
    
    const totalScenarios = this.scenarios.length;
    
    if (paragraphs.length >= totalScenarios) {
      const paragraphsPerScene = Math.floor(paragraphs.length / totalScenarios);
      const extraParagraphs = paragraphs.length % totalScenarios;
      
      let startIndex = 0;
      for (let i = 0; i < sceneIndex; i++) {
        startIndex += paragraphsPerScene + (i < extraParagraphs ? 1 : 0);
      }
      
      const endIndex = startIndex + paragraphsPerScene + (sceneIndex < extraParagraphs ? 1 : 0);
      return paragraphs.slice(startIndex, endIndex).join('\n\n');
      
    } else {
      if (sceneIndex < paragraphs.length) {
        return paragraphs[sceneIndex];
      } else {
        const scenario = this.scenarios[sceneIndex];
        return `${scenario?.description || 'Continuando la historia...'}\n\nEn esta parte de la aventura, los personajes continúan desarrollando la trama principal de una manera emocionante y educativa.`;
      }
    }
  }

  getPedagogicalContent(): string {
    if (!this.story?.content) return '';
    
    const approach = this.story.pedagogical_approach || 'traditional';
    
    switch (approach.toLowerCase()) {
      case 'montessori':
        return this.extractMontessoriActivities();
      case 'waldorf':
        return this.extractWaldorfActivities();
      case 'traditional':
        return this.extractTraditionalMoraleja();
      default:
        return this.extractTraditionalMoraleja();
    }
  }

  private extractMontessoriActivities(): string {
    const content = this.story!.content;
    const activityIndex = content.indexOf('**Actividad');
    
    if (activityIndex === -1) return '';
    
    const messageIndex = content.indexOf('**Mensaje positivo');
    const endIndex = messageIndex !== -1 ? messageIndex : content.length;
    
    let activities = content.substring(activityIndex, endIndex).trim();
    activities = this.cleanMarkdownFormatting(activities);
    
    return activities;
  }

  private extractWaldorfActivities(): string {
    const content = this.story!.content;
    const activityIndex = content.indexOf('**Actividad');
    
    if (activityIndex === -1) {
      return this.generateWaldorfContent();
    }
    
    const messageIndex = content.indexOf('**Mensaje positivo');
    const endIndex = messageIndex !== -1 ? messageIndex : content.length;
    
    let activities = content.substring(activityIndex, endIndex).trim();
    activities = this.cleanMarkdownFormatting(activities);
    
    return activities;
  }

  private extractTraditionalMoraleja(): string {
    const content = this.story!.content;
    
    const moralejaPatterns = [
      /Y.*aprendi[óo].*que/i,
      /La.*moraleja.*es/i,
      /As[íi].*aprendemos.*que/i,
      /Esta.*historia.*nos.*ense[ñn]a/i,
      /La.*lecci[óo]n.*de.*esta.*historia/i
    ];
    
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const lastParagraphs = paragraphs.slice(-3);
    
    for (const paragraph of lastParagraphs) {
      for (const pattern of moralejaPatterns) {
        if (pattern.test(paragraph)) {
          return this.cleanMarkdownFormatting(paragraph);
        }
      }
    }
    
    if (lastParagraphs.length > 0) {
      const lastParagraph = lastParagraphs[lastParagraphs.length - 1];
      
      if (!lastParagraph.includes('**Actividad') && lastParagraph.length > 50) {
        return `La historia nos enseña que: ${this.cleanMarkdownFormatting(lastParagraph)}`;
      }
    }
    
    return this.generateTraditionalMoraleja();
  }

  private generateWaldorfContent(): string {
    const category = this.story!.category.toLowerCase();
    const title = this.story!.title;
    
    const waldorfActivities: { [key: string]: string } = {
      'arte': `Actividades Creativas Waldorf:
    
1. Pintura con acuarelas: Recrea los colores y emociones de "${title}" usando acuarelas, permitiendo que los colores se mezclen libremente en papel húmedo.

2. Modelado en cera: Crea figuras de los personajes principales usando cera de abeja, sintiendo las formas emerger naturalmente.

3. Narración rítmica: Cuenta la historia usando gestos y movimientos que acompañen el ritmo natural del cuento.`,

      'naturaleza': `Conexión con la Naturaleza (Waldorf):
    
1. Observación contemplativa: Sal al jardín o parque para observar los elementos naturales presentes en "${title}", dibujando con suavidad lo que observas.

2. Recolección artística: Crea una mesa de estación con elementos naturales que representen los momentos del cuento.

3. Círculo de gratitud: En grupo, expresen gratitud por los elementos naturales que aparecen en la historia.`,

      'default': `Experiencias Artísticas Waldorf:
    
1. Dibujo de formas: Dibuja las formas principales de "${title}" usando movimientos amplios y rítmicos, comenzando desde el centro hacia afuera.

2. Trabajo manual: Crea un objeto representativo del cuento usando materiales naturales (lana, madera, piedras).

3. Euritmia: Expresa los sentimientos del cuento a través de movimientos corporales armoniosos.`
    };
    
    return waldorfActivities[category] || waldorfActivities['default'];
  }

  private generateTraditionalMoraleja(): string {
    const category = this.story!.category.toLowerCase();
    
    const moralejas: { [key: string]: string } = {
      'amistad': 'La verdadera amistad se basa en el respeto, la ayuda mutua y la confianza. Los buenos amigos nos apoyan en los momentos difíciles y celebran nuestros logros.',
      'aventura': 'Cada aventura nos enseña algo nuevo sobre nosotros mismos y el mundo. El coraje no es la ausencia de miedo, sino actuar a pesar de él.',
      'ciencia': 'La curiosidad y el deseo de aprender nos llevan a hacer grandes descubrimientos. Cada pregunta es el inicio de una nueva aventura del conocimiento.',
      'valores': 'Los valores como la honestidad, la bondad y la perseverancia son los cimientos de una vida plena y de relaciones significativas.',
      'familia': 'La familia es nuestro primer hogar del corazón, donde aprendemos a amar, compartir y crecer juntos con comprensión y apoyo mutuo.',
      'default': 'Cada historia nos deja una enseñanza valiosa que podemos aplicar en nuestra vida diaria para ser mejores personas y construir un mundo más hermoso.'
    };
    
    return `Moraleja de la historia: ${moralejas[category] || moralejas['default']}`;
  }

  private cleanMarkdownFormatting(text: string): string {
    return text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/^\s*[-*+]\s/gm, '')
      .replace(/^\s*\d+\.\s/gm, '')
      .trim();
  }

  hasPedagogicalContent(): boolean {
    return this.getPedagogicalContent().length > 0;
  }

  getPedagogicalTitle(): string {
    if (!this.story?.pedagogical_approach) return 'Contenido Pedagógico';
    
    const approach = this.story.pedagogical_approach.toLowerCase();
    
    switch (approach) {
      case 'montessori':
        return 'Actividades Montessori';
      case 'waldorf':
        return 'Experiencias Waldorf';
      case 'traditional':
        return 'Moraleja del Cuento';
      default:
        return 'Contenido Pedagógico';
    }
  }

  getPedagogicalIcon(): string {
    if (!this.story?.pedagogical_approach) return '📚';
    
    const approach = this.story.pedagogical_approach.toLowerCase();
    
    switch (approach) {
      case 'montessori':
        return '🔬';
      case 'waldorf':
        return '🎨';
      case 'traditional':
        return '💫';
      default:
        return '📚';
    }
  }

  getPedagogicalColor(): string {
    if (!this.story?.pedagogical_approach) return 'from-blue-50 to-indigo-50';
    
    const approach = this.story.pedagogical_approach.toLowerCase();
    
    switch (approach) {
      case 'montessori':
        return 'from-red-50 to-pink-50';
      case 'waldorf':
        return 'from-purple-50 to-violet-50';
      case 'traditional':
        return 'from-blue-50 to-indigo-50';
      default:
        return 'from-blue-50 to-indigo-50';
    }
  }

  getPedagogicalBorderColor(): string {
    if (!this.story?.pedagogical_approach) return 'border-blue-200';
    
    const approach = this.story.pedagogical_approach.toLowerCase();
    
    switch (approach) {
      case 'montessori':
        return 'border-red-200';
      case 'waldorf':
        return 'border-purple-200';
      case 'traditional':
        return 'border-blue-200';
      default:
        return 'border-blue-200';
    }
  }

  getPedagogicalTextColor(): string {
    if (!this.story?.pedagogical_approach) return 'text-blue-700';
    
    const approach = this.story.pedagogical_approach.toLowerCase();
    
    switch (approach) {
      case 'montessori':
        return 'text-red-700';
      case 'waldorf':
        return 'text-purple-700';
      case 'traditional':
        return 'text-blue-700';
      default:
        return 'text-blue-700';
    }
  }

  getCompleteNarrative(): string {
    if (!this.story?.content) return '';
    
    const content = this.story.content;
    const activityIndex = content.indexOf('**Actividad');
    
    if (activityIndex !== -1) {
      return content.substring(0, activityIndex).trim();
    }
    
    return content;
  }

  openImageModal(scenario: Scenario, index: number): void {
    if (!scenario.image) return;

    const allImages: ImageModalData[] = this.getOrderedScenarios()
      .filter(s => s.image)
      .map((s, idx) => ({
        imageUrl: this.getImageUrl(s.image!.image_url),
        title: this.getChapterTitle(idx + 1),
        description: s.description,
        chapterNumber: idx + 1,
        prompt: s.image!.prompt
      }));

    const currentIndex = allImages.findIndex(img => img.chapterNumber === index + 1);

    const imageData: ImageModalData = {
      imageUrl: this.getImageUrl(scenario.image.image_url),
      title: this.getChapterTitle(index + 1),
      description: scenario.description,
      chapterNumber: index + 1,
      prompt: scenario.image.prompt,
      allImages: allImages,
      currentIndex: currentIndex >= 0 ? currentIndex : 0
    };

    this.imageModalService.openModal(imageData);
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
      console.log('Eliminar cuento:', this.story.id);
      this.router.navigate(['/biblioteca']);
    }
  }

  createNew(): void {
    this.router.navigate(['/crear-cuento']);
  }

  private showErrorMessage(message: string): void {
    alert(message);
  }

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
    return this.chapterTitles[chapterNumber - 1] || `📖 Capítulo ${chapterNumber}`;
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return `http://localhost:5000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

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