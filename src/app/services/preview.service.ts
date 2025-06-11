import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { 
  PreviewStoryResponse, 
  PreviewState, 
  Scenario, 
  Image 
} from '../models/story.model';

@Injectable({
  providedIn: 'root'
})
export class PreviewService {
  
  // Estado principal del preview
  private previewStateSubject = new BehaviorSubject<PreviewState>({
    scenarios: [],
    status: 'idle'
  });
  public previewState$ = this.previewStateSubject.asObservable();

  // Estado de loading con mensajes dinámicos
  private loadingMessageSubject = new BehaviorSubject<{emoji: string, text: string} | null>(null);
  public loadingMessage$ = this.loadingMessageSubject.asObservable();

  constructor() {}

  /**
   * ⭐ MEJORADO: Inicializar preview con mejor manejo de imágenes
   */
  initializePreview(previewData: PreviewStoryResponse): void {
    console.log('🔄 PreviewService: Inicializando preview con datos:', previewData);
    
    // ⭐ VALIDACIÓN: Verificar que tenemos datos válidos
    if (!previewData.scenarios || !Array.isArray(previewData.scenarios)) {
      console.error('❌ PreviewService: Datos de escenarios inválidos:', previewData.scenarios);
      this.setLoadingState('error', 'Datos de escenarios inválidos');
      return;
    }

    // ⭐ LOGGING: Debug de cada escenario e imagen
    previewData.scenarios.forEach((scenario, index) => {
      console.log(`🎬 Escenario ${index + 1}:`, {
        id: scenario.id,
        description: scenario.description?.substring(0, 50) + '...',
        hasImage: !!scenario.image,
        imageUrl: scenario.image?.image_url,
        imageId: scenario.image?.id
      });
    });

    const newState: PreviewState = {
      story: previewData.story,
      scenarios: previewData.scenarios || [],
      status: 'ready'
    };

    console.log('✅ PreviewService: Estado establecido:', {
      storyTitle: newState.story?.title,
      scenariosCount: newState.scenarios.length,
      imagesCount: newState.scenarios.filter(s => s.image).length,
      status: newState.status
    });

    this.previewStateSubject.next(newState);
  }

  /**
   * GESTIÓN DE ESTADO: Actualizar estado de loading
   */
  setLoadingState(status: PreviewState['status'], error?: string): void {
    const currentState = this.previewStateSubject.value;
    
    console.log(`📊 PreviewService: Cambiando estado a '${status}'${error ? ` con error: ${error}` : ''}`);
    
    this.previewStateSubject.next({
      ...currentState,
      status,
      error
    });
  }

  /**
   * GESTIÓN DE ESTADO: Actualizar mensaje de loading
   */
  setLoadingMessage(message: {emoji: string, text: string} | null): void {
    this.loadingMessageSubject.next(message);
  }

  /**
   * ⭐ MEJORADO: Reemplazar imagen de un escenario específico
   */
  updateScenarioImage(scenarioId: string, newImage: Image): void {
    console.log(`🔄 PreviewService: Actualizando imagen para escenario ${scenarioId}:`, newImage);
    
    const currentState = this.previewStateSubject.value;
    
    const updatedScenarios = currentState.scenarios.map(scenario => {
      if (scenario.id === scenarioId) {
        console.log(`✅ PreviewService: Imagen actualizada para escenario ${scenarioId}`);
        return {
          ...scenario,
          image: newImage
        };
      }
      return scenario;
    });

    this.previewStateSubject.next({
      ...currentState,
      scenarios: updatedScenarios
    });
    
    // ⭐ LOGGING: Verificar actualización
    const updatedScenario = updatedScenarios.find(s => s.id === scenarioId);
    console.log(`🔍 PreviewService: Escenario actualizado:`, {
      scenarioId,
      hasImage: !!updatedScenario?.image,
      imageUrl: updatedScenario?.image?.image_url
    });
  }

  /**
   * ⭐ MEJORADO: Verificar que el preview está listo para guardar
   */
  isPreviewReadyToSave(): boolean {
    const state = this.previewStateSubject.value;
    
    const isReady = (
      state.status === 'ready' &&
      state.story !== undefined &&
      state.scenarios.length > 0 &&
      state.scenarios.every(scenario => scenario.image !== undefined)
    );
    
    console.log('🔍 PreviewService: ¿Listo para guardar?', {
      isReady,
      status: state.status,
      hasStory: !!state.story,
      scenariosCount: state.scenarios.length,
      allHaveImages: state.scenarios.every(scenario => scenario.image !== undefined),
      imagesCount: state.scenarios.filter(s => s.image).length
    });
    
    return isReady;
  }

  /**
   * ⭐ MEJORADO: Obtener datos formateados para guardar
   */
  getPreviewDataForSave(): PreviewStoryResponse | null {
    const state = this.previewStateSubject.value;
    
    if (!this.isPreviewReadyToSave() || !state.story) {
      console.warn('⚠️ PreviewService: No se puede obtener datos para guardar - preview no está listo');
      return null;
    }

    const dataToSave: PreviewStoryResponse = {
      success: true,
      story: state.story,
      scenarios: state.scenarios,
      images: state.scenarios.map(s => s.image!).filter(img => img !== undefined),
      mode: 'preview'
    };
    
    console.log('💾 PreviewService: Datos preparados para guardar:', {
      storyTitle: dataToSave.story?.title,
      scenariosCount: dataToSave.scenarios?.length,
      imagesCount: dataToSave.images?.length
    });

    return dataToSave;
  }

  /**
   * UTILIDAD: Obtener estado actual
   */
  getCurrentState(): PreviewState {
    return this.previewStateSubject.value;
  }

  /**
   * ⭐ MEJORADO: Limpiar preview con logs
   */
  clearPreview(): void {
    console.log('🧹 PreviewService: Limpiando preview');
    
    this.previewStateSubject.next({
      scenarios: [],
      status: 'idle'
    });
    
    this.loadingMessageSubject.next(null);
  }

  /**
   * ⭐ MEJORADO: Contar imágenes generadas con logs
   */
  getGeneratedImagesCount(): number {
    const state = this.previewStateSubject.value;
    const count = state.scenarios.filter(s => s.image !== undefined).length;
    
    console.log(`📊 PreviewService: ${count} imágenes de ${state.scenarios.length} escenarios`);
    return count;
  }

  /**
   * UTILIDAD: Obtener progreso de generación
   */
  getGenerationProgress(): {current: number, total: number, percentage: number} {
    const state = this.previewStateSubject.value;
    const total = state.scenarios.length;
    const current = this.getGeneratedImagesCount();
    
    const progress = {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0
    };
    
    console.log('📈 PreviewService: Progreso de generación:', progress);
    return progress;
  }

  /**
   * VALIDACIÓN: Verificar si hay errores en el preview
   */
  hasErrors(): boolean {
    const state = this.previewStateSubject.value;
    return state.status === 'error' || !!state.error;
  }

  /**
   * UTILIDAD: Obtener mensaje de error actual
   */
  getCurrentError(): string | undefined {
    return this.previewStateSubject.value.error;
  }

  /**
   * ESTADO: Marcar como guardando
   */
  setSavingState(): void {
    console.log('💾 PreviewService: Cambiando a estado de guardado');
    this.setLoadingState('saving');
  }

  /**
   * ESTADO: Marcar como generando
   */
  setGeneratingState(): void {
    console.log('⚡ PreviewService: Cambiando a estado de generación');
    this.setLoadingState('generating');
  }

  /**
   * UTILIDAD: Verificar si está en proceso de generación
   */
  isGenerating(): boolean {
    return this.previewStateSubject.value.status === 'generating';
  }

  /**
   * UTILIDAD: Verificar si está guardando
   */
  isSaving(): boolean {
    return this.previewStateSubject.value.status === 'saving';
  }

  /**
   * UTILIDAD: Verificar si está listo
   */
  isReady(): boolean {
    return this.previewStateSubject.value.status === 'ready';
  }

  /**
   * UTILIDAD: Verificar si está en estado idle
   */
  isIdle(): boolean {
    return this.previewStateSubject.value.status === 'idle';
  }

  /**
   * UTILIDAD: Verificar si hay error
   */
  hasError(): boolean {
    return this.previewStateSubject.value.status === 'error';
  }

  /**
   * ⭐ NUEVO: Método de debug para troubleshooting
   */
  debugCurrentState(): void {
    const state = this.previewStateSubject.value;
    
    console.group('🔍 PreviewService DEBUG STATE');
    console.log('Status:', state.status);
    console.log('Story:', state.story?.title || 'No story');
    console.log('Scenarios count:', state.scenarios.length);
    console.log('Error:', state.error || 'No error');
    
    state.scenarios.forEach((scenario, index) => {
      console.log(`Scenario ${index + 1}:`, {
        id: scenario.id,
        hasImage: !!scenario.image,
        imageUrl: scenario.image?.image_url
      });
    });
    
    console.groupEnd();
  }
}