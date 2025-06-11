import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { StoryService } from '../../services/story.service';
import { PreviewService } from '../../services/preview.service';
import { AuthService } from '../../services/auth.service';
import { 
  GenerateStoryRequest, 
  GRADE_OPTIONS, 
  PEDAGOGICAL_APPROACHES,
  PreviewState,
  Scenario
} from '../../models/story.model';
import { APP_CONFIG } from '../../config/app.config';

@Component({
  selector: 'app-create-story',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-story.component.html',
  styleUrls: ['./create-story.component.css']
})
export class CreateStoryComponent implements OnInit, OnDestroy {
  
  readonly formData: GenerateStoryRequest = {
    context: '',
    category: '',
    pedagogical_approach: 'traditional',
    target_age: 'Primero de Básica',
    num_illustrations: 3 
  };

  readonly gradeOptions = GRADE_OPTIONS;
  readonly pedagogicalApproaches = PEDAGOGICAL_APPROACHES;

  isGenerating = false;
  validationErrors: string[] = [];
  currentUser: any = null;
  previewState: PreviewState = { scenarios: [], status: 'idle' };
  currentLoadingMessage: {emoji: string, text: string} | null = null;

  private dividedStoryParagraphs: string[] = [];
  private loadingMessageIndex = 0;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly storyService: StoryService,
    private readonly previewService: PreviewService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.previewService.clearPreview();
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  private initializeUser(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.id) this.formData.teacher_id = user.id;
    });
    this.subscriptions.add(userSub);
  }

  private setupSubscriptions(): void {
    const previewSub = this.previewService.previewState$.subscribe(state => {
      this.previewState = state;
      if (state.status === 'ready' && state.story?.content) {
        this.dividedStoryParagraphs = this.divideStoryContent(
          state.story.content, 
          state.scenarios.length
        );
      }
    });

    const loadingSub = this.previewService.loadingMessage$.subscribe(
      message => this.currentLoadingMessage = message
    );

    this.subscriptions.add(previewSub);
    this.subscriptions.add(loadingSub);
  }

  // ========================================
  // CONTENT DIVISION - STRATEGY PATTERN
  // ========================================

  private divideStoryContent(storyContent: string, numChapters: number): string[] {
    const cleanContent = storyContent.trim();
    
    // Estrategia 1: Párrafos naturales
    let paragraphs = cleanContent
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 10)
      .map(p => p.trim());
    
    // Estrategia 2: Por oraciones si no hay suficientes párrafos
    if (paragraphs.length < numChapters) {
      const sentences = cleanContent
        .split(/\.\s+(?=[A-Z])/)
        .filter(s => s.trim().length > 20)
        .map(s => s.trim() + (s.endsWith('.') ? '' : '.'));
      
      if (sentences.length >= numChapters) {
        const sentencesPerParagraph = Math.ceil(sentences.length / numChapters);
        paragraphs = [];
        
        for (let i = 0; i < numChapters; i++) {
          const start = i * sentencesPerParagraph;
          const end = Math.min(start + sentencesPerParagraph, sentences.length);
          const paragraphSentences = sentences.slice(start, end);
          
          if (paragraphSentences.length > 0) {
            paragraphs.push(paragraphSentences.join(' '));
          }
        }
      }
    }
    
    // Estrategia 3: División matemática
    if (paragraphs.length < numChapters) {
      const words = cleanContent.split(' ');
      const wordsPerChapter = Math.ceil(words.length / numChapters);
      paragraphs = [];
      
      for (let i = 0; i < numChapters; i++) {
        const start = i * wordsPerChapter;
        const end = Math.min(start + wordsPerChapter, words.length);
        const chapterWords = words.slice(start, end);
        
        if (chapterWords.length > 0) {
          paragraphs.push(chapterWords.join(' '));
        }
      }
    }
    
    // Asegurar número exacto de capítulos
    while (paragraphs.length < numChapters) {
      const lastParagraph = paragraphs[paragraphs.length - 1] || 
                           'La historia continúa desarrollándose de manera fascinante...';
      paragraphs.push(lastParagraph);
    }
    
    return paragraphs.slice(0, numChapters);
  }

  getStoryParagraphForChapter(chapterIndex: number): string {
    if (chapterIndex < 0 || chapterIndex >= this.dividedStoryParagraphs.length) {
      return 'El contenido de este capítulo se está procesando...';
    }
    return this.dividedStoryParagraphs[chapterIndex];
  }

  // ========================================
  // STORY GENERATION - FACADE PATTERN
  // ========================================

  onGenerateStory(): void {
    this.validationErrors = [];
    this.dividedStoryParagraphs = [];

    const validation = this.storyService.validateStoryRequest(this.formData);
    if (!validation.valid) {
      this.validationErrors = validation.errors;
      return;
    }

    this.isGenerating = true;
    this.previewService.setGeneratingState();
    this.startLoadingAnimation();

    const generateSub = this.storyService.generatePreview(this.formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.processPreviewResponse(response);
          this.stopLoadingAnimation();
          this.isGenerating = false;
        } else {
          const errorMessage = response.message || response.error || 'Error desconocido';
          this.handleGenerationError(errorMessage);
        }
      },
      error: (error) => {
        const errorMessage = error.error?.error || error.error?.message || error.message || 'Error de conexión';
        this.handleGenerationError(errorMessage);
      }
    });

    this.subscriptions.add(generateSub);
  }

  // Response processing con Data Mapper Pattern
  private processPreviewResponse(response: any): void {
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
    
    this.previewService.initializePreview({
      ...response,
      scenarios: processedScenarios
    });
  }

  // ========================================
  // IMAGE MANAGEMENT - COMMAND PATTERN
  // ========================================

  onChangeImage(scenarioId: string): void {
    const regenerateSub = this.storyService.regenerateScenarioImage(
      scenarioId, 
      { 
        pedagogical_approach: this.formData.pedagogical_approach,
        style: 'children_illustration'
      }
    ).subscribe({
      next: (response) => {
        if (response.success && response.data?.new_image) {
          this.previewService.updateScenarioImage(scenarioId, response.data.new_image);
        }
      },
      error: (error) => console.error('Error al regenerar imagen:', error)
    });

    this.subscriptions.add(regenerateSub);
  }

  // ========================================
  // LIBRARY OPERATIONS
  // ========================================

  onSaveToLibrary(): void {
    const previewData = this.previewService.getPreviewDataForSave();
    if (!previewData) return;

    this.previewService.setSavingState();

    const saveSub = this.storyService.savePreviewedStory(previewData).subscribe({
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

    this.subscriptions.add(saveSub);
  }

  onExportToPDF(): void {
    // TODO: Implementar exportación PDF
  }

  // ========================================
  // FORM MANAGEMENT
  // ========================================

  selectPedagogicalApproach(approach: 'montessori' | 'waldorf' | 'traditional'): void {
    this.formData.pedagogical_approach = approach;
  }

  isFormValid(): boolean {
    return this.formData.context.trim().length >= 10 && 
           this.formData.category.trim().length >= 2;
  }

  // ========================================
  // LOADING ANIMATION
  // ========================================

  private startLoadingAnimation(): void {
    const messages = APP_CONFIG.LOADING_MESSAGES;
    this.previewService.setLoadingMessage(messages[0]);
    this.loadingMessageIndex = 0;

    const loadingInterval = interval(3000).subscribe(() => {
      this.loadingMessageIndex = (this.loadingMessageIndex + 1) % messages.length;
      this.previewService.setLoadingMessage(messages[this.loadingMessageIndex]);
    });

    this.subscriptions.add(loadingInterval);
  }

  private stopLoadingAnimation(): void {
    this.previewService.setLoadingMessage(null);
  }

  private handleGenerationError(errorMessage: string): void {
    this.isGenerating = false;
    this.stopLoadingAnimation();
    this.previewService.setLoadingState('error', errorMessage);
  }

  // ========================================
  // UTILITY METHODS - PURE FUNCTIONS
  // ========================================

  getImageUrl(relativeUrl: string): string {
    return this.storyService.getImageUrl(relativeUrl);
  }

  canSave(): boolean {
    return this.previewService.isPreviewReadyToSave();
  }

  isSaving(): boolean {
    return this.previewService.isSaving();
  }

  getProgress(): {current: number, total: number, percentage: number} {
    return this.previewService.getGenerationProgress();
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
    
    return chapterNumber > titles.length 
      ? `📖 Capítulo ${chapterNumber}`
      : titles[chapterNumber - 1] || `📖 Capítulo ${chapterNumber}`;
  }

  getGeneratedImagesCount(): number {
    return this.previewState.scenarios.filter(s => s.image && !(s as any).imageError).length;
  }

  getContentWordCount(): number {
    return this.previewState.story?.content?.split(' ').length || 0;
  }

  onImageError(event: any, scenario: any): void {
    (scenario as any).imageError = true;
  }
}