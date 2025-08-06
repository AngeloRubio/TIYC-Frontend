import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { StoryService } from '../../services/story.service';
import { PreviewService } from '../../services/preview.service';
import { AuthService } from '../../services/auth.service';
import { ImageModalService, ImageModalData } from '../../services/image-modal.service';
import { PdfService, PDFConfiguration } from '../../services/pdf.service';
import { ImageModalComponent } from '../shared/image-modal/image-modal.component';
import {
  GenerateStoryRequest,
  GRADE_OPTIONS,
  PEDAGOGICAL_APPROACHES,
  PreviewState,
  Scenario,
  Image
} from '../../models/story.model';
import { APP_CONFIG } from '../../config/app.config';

@Component({
  selector: 'app-create-story',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageModalComponent],
  templateUrl: './create-story.component.html',
  styleUrls: ['./create-story.component.css']
})
export class CreateStoryComponent implements OnInit, OnDestroy {

  // Inyección de dependencias por composición (DIP)
  private readonly viewStateManager = new ViewStateManager();
  private readonly contentStrategy = new ContentDivisionStrategy();
  private readonly animationController = new LoadingAnimationController();
  private readonly subscriptionManager = new SubscriptionManager();

  // Datos del formulario siguiendo patrón Value Object
  readonly formData: GenerateStoryRequest = {
    context: '',
    category: '',
    pedagogical_approach: 'traditional',
    target_age: 'Primero de Básica',
    num_illustrations: 6
  };

  readonly gradeOptions = GRADE_OPTIONS;
  readonly pedagogicalApproaches = PEDAGOGICAL_APPROACHES;

  // Estado del componente (encapsulación)
  isGenerating = false;
  isExportingPDF = false;
  validationErrors: string[] = [];
  currentUser: any = null;
  previewState: PreviewState = { scenarios: [], status: 'idle' };
  currentLoadingMessage: { emoji: string, text: string } | null = null;

  private dividedStoryParagraphs: string[] = [];

  constructor(
    private readonly storyService: StoryService,
    private readonly previewService: PreviewService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly imageModalService: ImageModalService,
    private readonly pdfService: PdfService
  ) { }

  get viewState(): 'form' | 'preview' {
    return this.viewStateManager.getCurrentView();
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.cleanupResources();
  }

  // Métodos de interfaz pública (SRP - Responsabilidad Única)
  showForm(): void {
    this.viewStateManager.setView('form');
    this.previewService.clearPreview();
  }

  showPreview(): void {
    this.viewStateManager.setView('preview');
  }

  onGenerateStory(): void {
    // 🔍 DEBUG: Ver qué se va a enviar
    console.log('🔍 DEBUG - formData completo antes de enviar:', this.formData);
    console.log('🔍 DEBUG - target_age específicamente:', this.formData.target_age);
    console.log('🔍 DEBUG - Tipo de target_age:', typeof this.formData.target_age);

    const validationResult = this.validateForm();
    if (!validationResult.isValid) {
      this.validationErrors = validationResult.errors;
      return;
    }

    this.showPreview();
    this.startGeneration();
  }

  onChangeImage(scenarioId: string): void {
    const scenario = this.previewState.scenarios.find(s => s.id === scenarioId);

    if (!scenario) {
      console.error('❌ Scenario no encontrado para regenerar imagen');
      return;
    }

    const regenerateCommand = new OptimizedImageRegenerationCommand(
      this.storyService,
      this.previewService,
      scenario.prompt_for_image,
      {
        scenario_id: scenarioId,
        pedagogical_approach: this.formData.pedagogical_approach,
        style: 'children_illustration'
      }
    );

    const regenerateSub = regenerateCommand.execute();
    this.subscriptionManager.add(regenerateSub);
  }

  onSaveToLibrary(): void {
    const saveCommand = new SaveToLibraryCommand(
      this.storyService,
      this.previewService,
      this.router
    );

    const saveSub = saveCommand.execute();
    this.subscriptionManager.add(saveSub);
  }

  onExportToPDF(): void {
    if (!this.previewState.story) {
      console.error('No hay datos de story para exportar');
      return;
    }

    console.log('📄 Iniciando exportación PDF del preview...');

    // Patrón Strategy para configuración de PDF
    const pdfConfig: PDFConfiguration = this.pdfService.getOptimizedConfig(
      this.formData.pedagogical_approach,
      this.formData.target_age
    );

    const previewData = {
      success: true,
      story: this.previewState.story,
      scenarios: this.previewState.scenarios,
      images: this.previewState.scenarios.map(s => s.image).filter((img): img is Image => img !== undefined),
      mode: 'preview' as const
    };

    this.setExportingState(true);

    const progressSub = this.pdfService.getExportProgress().subscribe(
      progress => {
        if (progress.isExporting) {
          console.log(`📄 Progreso PDF: ${progress.progress}% - ${progress.message}`);
        }
      }
    );

    const exportSub = this.pdfService.exportPreviewToPdf(previewData, pdfConfig).subscribe({
      next: (pdfBlob: Blob) => {
        console.log('✅ PDF preview generado exitosamente');
        const filename = this.generatePdfFilename(this.previewState.story!.title);
        this.pdfService.downloadBlob(pdfBlob, filename);
        this.setExportingState(false);
        this.showSuccessMessage('PDF descargado exitosamente');
      },
      error: (error) => {
        console.error('❌ Error exportando PDF preview:', error);
        this.setExportingState(false);
        this.showErrorMessage('Error al generar PDF. Inténtalo de nuevo.');
      }
    });

    this.subscriptionManager.add(progressSub);
    this.subscriptionManager.add(exportSub);
  }

  openImageModal(scenario: Scenario, chapterIndex: number): void {
    if (!scenario.image || !this.previewState.story) return;

    const imageModalDataBuilder = new ImageModalDataBuilder(
      this.previewState.scenarios,
      this.getImageUrl.bind(this),
      this.getChapterTitle.bind(this)
    );

    const imageData = imageModalDataBuilder
      .setCurrentScenario(scenario, chapterIndex)
      .build();

    this.imageModalService.openModal(imageData);
  }

  // Form interaction methods
  selectPedagogicalApproach(approach: 'montessori' | 'waldorf' | 'traditional'): void {
    this.formData.pedagogical_approach = approach;
  }

  // Métodos de consulta de estado de vista
  isFormValid(): boolean {
    return this.formData.context.trim().length >= 10 &&
      this.formData.category.trim().length >= 2;
  }

  canSave(): boolean {
    return this.previewService.isPreviewReadyToSave();
  }

  isSaving(): boolean {
    return this.previewService.isSaving();
  }

  getProgress(): GenerationProgress {
    return this.previewService.getGenerationProgress();
  }

  // Métodos utilitarios
  getImageUrl(relativeUrl: string): string {
    return this.storyService.getImageUrl(relativeUrl);
  }

  getChapterTitle(chapterNumber: number): string {
    const chapterTitleStrategy = new ChapterTitleStrategy();
    return chapterTitleStrategy.getTitle(chapterNumber);
  }

  getStoryParagraphForChapter(chapterIndex: number): string {
    if (chapterIndex < 0 || chapterIndex >= this.dividedStoryParagraphs.length) {
      return 'El contenido de este capítulo se está procesando...';
    }
    return this.dividedStoryParagraphs[chapterIndex];
  }

  getPedagogicalLabel(): string {
    const approach = this.pedagogicalApproaches.find(p => p.key === this.formData.pedagogical_approach);
    return approach?.label || 'Traditional';
  }

  onImageError(event: any, scenario: any): void {
    (scenario as any).imageError = true;
  }

  // Métodos de implementación privados (encapsulación)
  private initializeComponent(): void {
    this.initializeUser();
    this.setupSubscriptions();
  }

  private cleanupResources(): void {
    this.subscriptionManager.unsubscribeAll();
    this.previewService.clearPreview();
    this.animationController.stop();
  }

  private validateForm(): FormValidationState {
    this.validationErrors = [];
    this.dividedStoryParagraphs = [];

    const validation = this.storyService.validateStoryRequest(this.formData);
    return {
      isValid: validation.valid,
      errors: validation.errors
    };
  }

  private startGeneration(): void {
    this.isGenerating = true;
    this.previewService.setGeneratingState();
    this.animationController.start(this.previewService);

    const generateSub = this.storyService.generatePreview(this.formData).subscribe({
      next: (response) => this.handleGenerationSuccess(response),
      error: (error) => this.handleGenerationError(this.extractErrorMessage(error))
    });

    this.subscriptionManager.add(generateSub);
  }

  private handleGenerationSuccess(response: any): void {
    if (response.success) {
      this.processPreviewResponse(response);
      this.completeGeneration();
    } else {
      const errorMessage = response.message || response.error || 'Error desconocido';
      this.handleGenerationError(errorMessage);
    }
  }

  private extractErrorMessage(error: any): string {
    return error.error?.error || error.error?.message || error.message || 'Error de conexión';
  }

  private completeGeneration(): void {
    this.animationController.stop();
    this.isGenerating = false;
  }

  private handleGenerationError(errorMessage: string): void {
    this.isGenerating = false;
    this.animationController.stop();
    this.previewService.setLoadingState('error', errorMessage);
  }

  private processPreviewResponse(response: any): void {
    const responseProcessor = new PreviewResponseProcessor();
    const processedData = responseProcessor.process(response);

    this.previewService.initializePreview(processedData);
  }

  private initializeUser(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.id) this.formData.teacher_id = user.id;
    });
    this.subscriptionManager.add(userSub);
  }

  private setupSubscriptions(): void {
    const previewSub = this.previewService.previewState$.subscribe(state => {
      this.previewState = state;
      if (state.status === 'ready' && state.story?.content) {
        this.dividedStoryParagraphs = this.contentStrategy.divide(
          state.story.content,
          state.scenarios.length
        );
      }
    });

    const loadingSub = this.previewService.loadingMessage$.subscribe(
      message => this.currentLoadingMessage = message
    );

    this.subscriptionManager.add(previewSub);
    this.subscriptionManager.add(loadingSub);
  }

  // Métodos helper específicos para PDF
  private generatePdfFilename(storyTitle: string): string {
    const sanitizedTitle = storyTitle
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 30);
    const timestamp = new Date().toISOString().split('T')[0];
    return `cuento_${sanitizedTitle}_${timestamp}.pdf`;
  }

  private setExportingState(isExporting: boolean): void {
    this.isExportingPDF = isExporting;
  }

  private showSuccessMessage(message: string): void {
    console.log('✅', message);
    // TODO: Implementar sistema de notificaciones adecuado
  }

  private showErrorMessage(message: string): void {
    console.error('❌', message);
    // TODO: Implementar notificación de errores adecuada
  }
}

// Tipos de dominio para mejor seguridad de tipos
interface FormValidationState {
  isValid: boolean;
  errors: string[];
}

interface GenerationProgress {
  current: number;
  total: number;
  percentage: number;
}

// Implementaciones de estrategias (siguiendo patrón Strategy)
class ViewStateManager {
  private currentView: 'form' | 'preview' = 'form';

  setView(view: 'form' | 'preview'): void {
    this.currentView = view;
  }

  getCurrentView(): 'form' | 'preview' {
    return this.currentView;
  }
}

// División de contenido usando patrón Template Method
class ContentDivisionStrategy {
  divide(storyContent: string, numChapters: number): string[] {
    const cleanContent = storyContent.trim();
    let paragraphs = this.extractNaturalParagraphs(cleanContent);

    if (paragraphs.length < numChapters) {
      paragraphs = this.extractSentenceBasedParagraphs(cleanContent, numChapters);
    }

    if (paragraphs.length < numChapters) {
      paragraphs = this.createMathematicalDivision(cleanContent, numChapters);
    }

    return this.ensureExactChapterCount(paragraphs, numChapters);
  }

  private extractNaturalParagraphs(content: string): string[] {
    return content
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 10)
      .map(p => p.trim());
  }

  private extractSentenceBasedParagraphs(content: string, numChapters: number): string[] {
    const sentences = content
      .split(/\.\s+(?=[A-Z])/)
      .filter(s => s.trim().length > 20)
      .map(s => s.trim() + (s.endsWith('.') ? '' : '.'));

    if (sentences.length >= numChapters) {
      const sentencesPerParagraph = Math.ceil(sentences.length / numChapters);
      const paragraphs = [];

      for (let i = 0; i < numChapters; i++) {
        const start = i * sentencesPerParagraph;
        const end = Math.min(start + sentencesPerParagraph, sentences.length);
        const paragraphSentences = sentences.slice(start, end);

        if (paragraphSentences.length > 0) {
          paragraphs.push(paragraphSentences.join(' '));
        }
      }
      return paragraphs;
    }
    return [];
  }

  private createMathematicalDivision(content: string, numChapters: number): string[] {
    const words = content.split(' ');
    const wordsPerChapter = Math.ceil(words.length / numChapters);
    const paragraphs = [];

    for (let i = 0; i < numChapters; i++) {
      const start = i * wordsPerChapter;
      const end = Math.min(start + wordsPerChapter, words.length);
      const chapterWords = words.slice(start, end);

      if (chapterWords.length > 0) {
        paragraphs.push(chapterWords.join(' '));
      }
    }
    return paragraphs;
  }

  private ensureExactChapterCount(paragraphs: string[], numChapters: number): string[] {
    while (paragraphs.length < numChapters) {
      const lastParagraph = paragraphs[paragraphs.length - 1] ||
        'La historia continúa desarrollándose de manera fascinante...';
      paragraphs.push(lastParagraph);
    }

    return paragraphs.slice(0, numChapters);
  }
}

// Builder pattern para construcción de datos del modal
class ImageModalDataBuilder {
  constructor(
    private scenarios: Scenario[],
    private getImageUrlFn: (url: string) => string,
    private getChapterTitleFn: (num: number) => string
  ) { }

  private currentScenario?: Scenario;
  private currentChapterIndex = 0;

  setCurrentScenario(scenario: Scenario, chapterIndex: number): this {
    this.currentScenario = scenario;
    this.currentChapterIndex = chapterIndex;
    return this;
  }

  build(): ImageModalData {
    if (!this.currentScenario?.image) {
      throw new Error('No image available for modal');
    }

    const allImages = this.scenarios
      .filter(s => s.image)
      .map((s, index) => ({
        imageUrl: this.getImageUrlFn(s.image!.image_url),
        title: this.getChapterTitleFn(index + 1),
        description: s.description,
        chapterNumber: index + 1,
        prompt: s.image!.prompt
      }));

    const currentIndex = allImages.findIndex(img => img.chapterNumber === this.currentChapterIndex + 1);

    return {
      imageUrl: this.getImageUrlFn(this.currentScenario.image.image_url),
      title: this.getChapterTitleFn(this.currentChapterIndex + 1),
      description: this.currentScenario.description,
      chapterNumber: this.currentChapterIndex + 1,
      prompt: this.currentScenario.prompt_for_image,
      allImages: allImages,
      currentIndex: currentIndex >= 0 ? currentIndex : 0
    };
  }
}

// Controlador de animaciones de carga
class LoadingAnimationController {
  private loadingInterval?: Subscription;
  private loadingMessageIndex = 0;

  start(previewService: PreviewService): void {
    const messages = APP_CONFIG.LOADING_MESSAGES;
    previewService.setLoadingMessage(messages[0]);
    this.loadingMessageIndex = 0;

    this.loadingInterval = interval(3000).subscribe(() => {
      this.loadingMessageIndex = (this.loadingMessageIndex + 1) % messages.length;
      previewService.setLoadingMessage(messages[this.loadingMessageIndex]);
    });
  }

  stop(): void {
    if (this.loadingInterval) {
      this.loadingInterval.unsubscribe();
      this.loadingInterval = undefined;
    }
  }
}

// Gestor de suscripciones para evitar memory leaks
class SubscriptionManager {
  private subscriptions = new Subscription();

  add(subscription: Subscription): void {
    this.subscriptions.add(subscription);
  }

  unsubscribeAll(): void {
    this.subscriptions.unsubscribe();
  }
}

// Procesador de respuestas del preview
class PreviewResponseProcessor {
  process(response: any): any {
    const imageMap = new Map();
    if (response.images && Array.isArray(response.images)) {
      response.images.forEach((image: any) => {
        imageMap.set(image.scenario_id, image);
      });
    }

    const processedScenarios: Scenario[] = [];
    if (response.scenarios && Array.isArray(response.scenarios)) {
      response.scenarios.forEach((scenario: any) => {
        const scenarioWithImage: Scenario = {
          ...scenario,
          image: imageMap.get(scenario.id) || undefined
        };
        processedScenarios.push(scenarioWithImage);
      });
    }

    return {
      ...response,
      scenarios: processedScenarios
    };
  }
}

// Comando para regeneración optimizada de imágenes
class OptimizedImageRegenerationCommand {
  constructor(
    private storyService: StoryService,
    private previewService: PreviewService,
    private prompt: string,
    private options: any
  ) { }

  execute(): Subscription {
    return this.storyService.regeneratePreviewImage(this.prompt, this.options).subscribe({
      next: (response) => {
        if (response.success && response.data?.new_image) {
          this.previewService.updateScenarioImage(this.options.scenario_id, response.data.new_image);
        }
      },
      error: (error) => console.error('Error al regenerar imagen:', error)
    });
  }
}

// Comando para guardar en biblioteca
class SaveToLibraryCommand {
  constructor(
    private storyService: StoryService,
    private previewService: PreviewService,
    private router: Router
  ) { }

  execute(): Subscription {
    const previewData = this.previewService.getPreviewDataForSave();
    if (!previewData) {
      throw new Error('No preview data available to save');
    }

    this.previewService.setSavingState();

    return this.storyService.savePreviewedStory(previewData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/biblioteca']);
        } else {
          const errorMessage = response.message || response.error || 'Error al guardar';
          this.previewService.setLoadingState('error', errorMessage);
        }
      },
      error: (error) => {
        const errorMessage = error.error?.error || error.error?.message || 'Error al guardar el cuento';
        this.previewService.setLoadingState('error', errorMessage);
      }
    });
  }
}

// Comando para exportar a PDF
class ExportToPDFCommand {
  constructor(private previewState: PreviewState) { }

  execute(): void {
    console.log('📄 Exportar a PDF - Por implementar');
  }
}

// Estrategia para títulos de capítulos
class ChapterTitleStrategy {
  private readonly titles = [
    '🌟 El Comienzo de la Aventura',
    '🎭 El Desarrollo de la Historia',
    '🎨 Momentos Especiales',
    '🌈 Descubrimientos Importantes',
    '💫 El Clímax de la Historia',
    '🎉 El Final Feliz'
  ];

  getTitle(chapterNumber: number): string {
    return chapterNumber > this.titles.length
      ? `📖 Capítulo ${chapterNumber}`
      : this.titles[chapterNumber - 1] || `📖 Capítulo ${chapterNumber}`;
  }
}