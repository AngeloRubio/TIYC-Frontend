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
  
  // Datos del formulario
  formData: GenerateStoryRequest = {
    context: '',
    category: '',
    pedagogical_approach: 'traditional',
    target_age: 'Primero de Básica',
    num_illustrations: 3 
  };

  // Opciones para selects
  gradeOptions = GRADE_OPTIONS;
  pedagogicalApproaches = PEDAGOGICAL_APPROACHES;

  // Estado del componente
  isGenerating = false;
  validationErrors: string[] = [];
  currentUser: any = null;

  // Estado del preview
  previewState: PreviewState = { scenarios: [], status: 'idle' };
  currentLoadingMessage: {emoji: string, text: string} | null = null;
  loadingMessageIndex = 0;


  private dividedStoryParagraphs: string[] = [];

  // Subscriptions para manejo de estado
  private subscriptions = new Subscription();

  constructor(
    private storyService: StoryService,
    private previewService: PreviewService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.previewService.clearPreview();
  }

  /**
   * Inicialización del componente
   */
  private initializeComponent(): void {
    const userSub = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
        if (user?.id) {
          this.formData.teacher_id = user.id;
        }
      }
    );
    this.subscriptions.add(userSub);
  }

  /**
   * Configurar subscripciones reactivas
   */
  private setupSubscriptions(): void {
    const previewSub = this.previewService.previewState$.subscribe(
      state => {
        this.previewState = state;
        
        // ⭐ NUEVO: Cuando el estado cambia a 'ready', dividir el contenido
        if (state.status === 'ready' && state.story?.content) {
          this.dividedStoryParagraphs = this.divideStoryContent(
            state.story.content, 
            state.scenarios.length
          );
          console.log('📖 Cuento dividido en párrafos:', this.dividedStoryParagraphs);
        }
      }
    );

    const loadingSub = this.previewService.loadingMessage$.subscribe(
      message => this.currentLoadingMessage = message
    );

    this.subscriptions.add(previewSub);
    this.subscriptions.add(loadingSub);
  }

  /**
   * ⭐ NUEVO: Dividir el contenido del cuento por párrafos naturales
   */
  private divideStoryContent(storyContent: string, numChapters: number): string[] {
    console.log(`📚 Dividiendo cuento en ${numChapters} capítulos`);
    console.log(`📝 Contenido original: ${storyContent.length} caracteres`);
    
    // Limpiar y preparar el contenido
    const cleanContent = storyContent.trim();
    
    // ⭐ OPCIÓN 1: División por párrafos naturales (doble salto de línea)
    let naturalParagraphs = cleanContent
      .split(/\n\s*\n/)  // Dividir por doble salto de línea
      .filter(p => p.trim().length > 10)  // Solo párrafos significativos
      .map(p => p.trim());
    
    console.log(`📋 Párrafos naturales encontrados: ${naturalParagraphs.length}`);
    
    // Si no hay suficientes párrafos naturales, dividir por oraciones
    if (naturalParagraphs.length < numChapters) {
      console.log('🔀 No hay suficientes párrafos naturales, dividiendo por oraciones...');
      
      // División por oraciones (punto seguido de espacio y mayúscula)
      const sentences = cleanContent
        .split(/\.\s+(?=[A-Z])/)  // Dividir por punto + espacio + mayúscula
        .filter(s => s.trim().length > 20)  // Solo oraciones significativas
        .map(s => s.trim() + (s.endsWith('.') ? '' : '.'));  // Asegurar punto final
      
      console.log(`📝 Oraciones encontradas: ${sentences.length}`);
      
      if (sentences.length >= numChapters) {
        // Agrupar oraciones en párrafos
        const sentencesPerParagraph = Math.ceil(sentences.length / numChapters);
        naturalParagraphs = [];
        
        for (let i = 0; i < numChapters; i++) {
          const startIndex = i * sentencesPerParagraph;
          const endIndex = Math.min(startIndex + sentencesPerParagraph, sentences.length);
          const paragraphSentences = sentences.slice(startIndex, endIndex);
          
          if (paragraphSentences.length > 0) {
            naturalParagraphs.push(paragraphSentences.join(' '));
          }
        }
      }
    }
    
    // Si aún no tenemos suficientes, división matemática
    if (naturalParagraphs.length < numChapters) {
      console.log('🧮 División matemática por longitud...');
      
      const words = cleanContent.split(' ');
      const wordsPerChapter = Math.ceil(words.length / numChapters);
      naturalParagraphs = [];
      
      for (let i = 0; i < numChapters; i++) {
        const startIndex = i * wordsPerChapter;
        const endIndex = Math.min(startIndex + wordsPerChapter, words.length);
        const chapterWords = words.slice(startIndex, endIndex);
        
        if (chapterWords.length > 0) {
          naturalParagraphs.push(chapterWords.join(' '));
        }
      }
    }
    
    // Asegurar que tenemos exactamente numChapters párrafos
    while (naturalParagraphs.length < numChapters) {
      // Si faltan párrafos, duplicar el último o crear genérico
      const lastParagraph = naturalParagraphs[naturalParagraphs.length - 1] || 
                           'La historia continúa desarrollándose de manera fascinante...';
      naturalParagraphs.push(lastParagraph);
    }
    
    // Si tenemos más párrafos de los necesarios, tomar solo los primeros
    const result = naturalParagraphs.slice(0, numChapters);
    
    console.log('✅ División completada:');
    result.forEach((paragraph, index) => {
      console.log(`  Capítulo ${index + 1}: ${paragraph.substring(0, 50)}... (${paragraph.length} chars)`);
    });
    
    return result;
  }

  /**
   * ⭐ NUEVO: Obtener párrafo específico para un capítulo
   */
  getStoryParagraphForChapter(chapterIndex: number): string {
    if (chapterIndex < 0 || chapterIndex >= this.dividedStoryParagraphs.length) {
      console.warn(`⚠️ Índice de capítulo inválido: ${chapterIndex}`);
      return 'El contenido de este capítulo se está procesando...';
    }
    
    const paragraph = this.dividedStoryParagraphs[chapterIndex];
    console.log(`📖 Obteniendo párrafo para capítulo ${chapterIndex + 1}: ${paragraph.substring(0, 50)}...`);
    
    return paragraph;
  }

  /**
   * ⭐ CORREGIDO: Generar cuento preview con mejor manejo de estado
   */
  onGenerateStory(): void {
    console.log('🚀 Iniciando generación de cuento...');
    
    // Limpiar errores previos y cache
    this.validationErrors = [];
    this.dividedStoryParagraphs = [];

    // Validar formulario
    const validation = this.storyService.validateStoryRequest(this.formData);
    if (!validation.valid) {
      this.validationErrors = validation.errors;
      return;
    }

    // Iniciar proceso de generación
    this.isGenerating = true;
    this.previewService.setGeneratingState();
    this.startLoadingAnimation();

    console.log('📡 Enviando request al backend:', this.formData);

    // Llamar al endpoint de preview
    const generateSub = this.storyService.generatePreview(this.formData).subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida del backend:', response);
        
        if (response.success) {
          // ⭐ CLAVE: Procesar la respuesta completa
          console.log('📖 Story:', response.story);
          console.log('🎬 Scenarios:', response.scenarios);
          console.log('🖼️ Images:', response.images);
          
          // ⭐ CORREGIDO: Mapear imágenes a escenarios CORRECTAMENTE
          this.processPreviewResponse(response);
          
          this.stopLoadingAnimation();
          this.isGenerating = false;
        } else {
          const errorMessage = response.message || response.error || 'Error desconocido';
          console.error('❌ Error en respuesta:', errorMessage);
          this.handleGenerationError(errorMessage);
        }
      },
      error: (error) => {
        console.error('💥 Error HTTP:', error);
        
        let errorMessage = 'Error de conexión';
        
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.handleGenerationError(errorMessage);
      }
    });

    this.subscriptions.add(generateSub);
  }

  /**
   * ⭐ NUEVO: Procesar respuesta del preview correctamente
   */
  private processPreviewResponse(response: any): void {
    console.log('🔄 Procesando respuesta del preview...');
    
    // Crear mapa de imágenes por scenario_id para mapeo rápido
    const imageMap = new Map();
    if (response.images && Array.isArray(response.images)) {
      response.images.forEach((image: any) => {
        console.log(`📷 Mapeando imagen ${image.id} → scenario ${image.scenario_id}`);
        imageMap.set(image.scenario_id, image);
      });
    }
    
    // Procesar escenarios y asignar imágenes
    const processedScenarios: Scenario[] = [];
    if (response.scenarios && Array.isArray(response.scenarios)) {
      response.scenarios.forEach((scenario: any) => {
        const scenarioWithImage: Scenario = {
          ...scenario,
          image: imageMap.get(scenario.id) || undefined // ⭐ CLAVE: Asignar imagen si existe
        };
        
        console.log(`🎬 Escenario ${scenario.id}:`, {
          description: scenario.description,
          hasImage: !!scenarioWithImage.image,
          imageUrl: scenarioWithImage.image?.image_url
        });
        
        processedScenarios.push(scenarioWithImage);
      });
    }
    
    // Inicializar preview con datos procesados
    const processedResponse = {
      ...response,
      scenarios: processedScenarios
    };
    
    console.log('✅ Datos procesados enviados a PreviewService:', processedResponse);
    this.previewService.initializePreview(processedResponse);
  }

  /**
   * ⭐ MEJORADO: Cambiar imagen de un escenario
   */
  onChangeImage(scenarioId: string): void {
    console.log(`🔄 Regenerando imagen para escenario: ${scenarioId}`);
    
    const regenerateSub = this.storyService.regenerateScenarioImage(
      scenarioId, 
      { 
        pedagogical_approach: this.formData.pedagogical_approach,
        style: 'children_illustration'
      }
    ).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de regeneración:', response);
        
        if (response.success && response.data?.new_image) {
          console.log('🖼️ Nueva imagen recibida:', response.data.new_image);
          this.previewService.updateScenarioImage(scenarioId, response.data.new_image);
        } else {
          console.error('❌ Error en regeneración:', response);
        }
      },
      error: (error) => {
        console.error('💥 Error al regenerar imagen:', error);
      }
    });

    this.subscriptions.add(regenerateSub);
  }

  /**
   * ACCIÓN: Guardar cuento en biblioteca
   */
  onSaveToLibrary(): void {
    const previewData = this.previewService.getPreviewDataForSave();
    
    if (!previewData) {
      console.error('No hay datos de preview para guardar');
      return;
    }

    console.log('💾 Guardando en biblioteca:', previewData);
    this.previewService.setSavingState();

    const saveSub = this.storyService.savePreviewedStory(previewData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Cuento guardado exitosamente');
          this.router.navigate(['/biblioteca']);
        } else {
          const errorMessage = response.message || response.error || 'Error al guardar';
          this.previewService.setLoadingState('error', errorMessage);
        }
      },
      error: (error) => {
        console.error('💥 Error al guardar:', error);
        
        let errorMessage = 'Error al guardar el cuento';
        
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        this.previewService.setLoadingState('error', errorMessage);
      }
    });

    this.subscriptions.add(saveSub);
  }

  /**
   * ACCIÓN: Exportar a PDF
   */
  onExportToPDF(): void {

    console.log('📄 Exportar a PDF - Por implementar');
  }

  /**
   * ACCIÓN: Seleccionar enfoque pedagógico
   */
  selectPedagogicalApproach(approach: 'montessori' | 'waldorf' | 'traditional'): void {
    this.formData.pedagogical_approach = approach;
  }

  /**
   * ⭐ MEJORADO: Animación de loading con logs
   */
  private startLoadingAnimation(): void {
    const messages = APP_CONFIG.LOADING_MESSAGES;
    
    console.log('🎭 Iniciando animación de loading...');
    
    // Mostrar primer mensaje inmediatamente
    this.previewService.setLoadingMessage(messages[0]);
    this.loadingMessageIndex = 0;

    // Rotar mensajes cada 3 segundos
    const loadingInterval = interval(3000).subscribe(() => {
      this.loadingMessageIndex = (this.loadingMessageIndex + 1) % messages.length;
      console.log(`🎭 Cambiando mensaje: ${messages[this.loadingMessageIndex].text}`);
      this.previewService.setLoadingMessage(messages[this.loadingMessageIndex]);
    });

    this.subscriptions.add(loadingInterval);
  }

  private stopLoadingAnimation(): void {
    console.log('🛑 Deteniendo animación de loading');
    this.previewService.setLoadingMessage(null);
  }

  /**
   * UTILIDAD: Manejo de errores
   */
  private handleGenerationError(errorMessage: string): void {
    console.error('❌ Manejando error de generación:', errorMessage);
    this.isGenerating = false;
    this.stopLoadingAnimation();
    this.previewService.setLoadingState('error', errorMessage);
  }

  /**
   * ⭐ MEJORADO: Obtener URL completa de imagen con logs
   */
  getImageUrl(relativeUrl: string): string {
    const fullUrl = this.storyService.getImageUrl(relativeUrl);
    console.log(`🖼️ Construyendo URL: ${relativeUrl} → ${fullUrl}`);
    return fullUrl;
  }

  /**
   * UTILIDAD: Verificar si el formulario es válido
   */
  isFormValid(): boolean {
    return this.formData.context.trim().length >= 10 && 
           this.formData.category.trim().length >= 2;
  }

  /**
   * UTILIDAD: Verificar si se puede guardar
   */
  canSave(): boolean {
    return this.previewService.isPreviewReadyToSave();
  }

  /**
   * UTILIDAD: Verificar si está guardando
   */
  isSaving(): boolean {
    return this.previewService.isSaving();
  }

  /**
   * UTILIDAD: Obtener progreso de generación
   */
  getProgress(): {current: number, total: number, percentage: number} {
    return this.previewService.getGenerationProgress();
  }

  /**
   * ✨ NUEVO: Obtener título atractivo para cada capítulo
   */
  getChapterTitle(chapterNumber: number): string {
    const titles = [
      '🌟 El Comienzo de la Aventura',
      '🎭 El Desarrollo de la Historia', 
      '🎨 Momentos Especiales',
      '🌈 Descubrimientos Importantes',
      '💫 El Clímax de la Historia',
      '🎉 El Final Feliz'
    ];
    
    if (chapterNumber > titles.length) {
      return `📖 Capítulo ${chapterNumber}`;
    }
    
    return titles[chapterNumber - 1] || `📖 Capítulo ${chapterNumber}`;
  }

  /**
   *  Contar imágenes generadas
   */
  getGeneratedImagesCount(): number {
    const count = this.previewState.scenarios.filter(s => s.image && !(s as any).imageError).length;
    console.log(`📊 Imágenes generadas: ${count} de ${this.previewState.scenarios.length}`);
    return count;
  }

  /**
   *  Contar palabras del contenido
   */
  getContentWordCount(): number {
    if (!this.previewState.story?.content) return 0;
    return this.previewState.story.content.split(' ').length;
  }

  /**
   *  Manejar errores de carga de imágenes con logs
   */
  onImageError(event: any, scenario: any): void {
    console.error('🖼️ Error al cargar imagen del escenario:', scenario.id, event);
    console.error('URL que falló:', event.target?.src);
    (scenario as any).imageError = true;
  }
}