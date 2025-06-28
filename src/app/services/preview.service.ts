import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { 
  PreviewStoryResponse, 
  PreviewState, 
  Image 
} from '../models/story.model';


interface ScenarioRegenerationState {
  [scenarioId: string]: {
    isRegenerating: boolean;
    error?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PreviewService {
  
  private readonly previewStateSubject = new BehaviorSubject<PreviewState>({
    scenarios: [],
    status: 'idle'
  });
  
  private readonly loadingMessageSubject = new BehaviorSubject<{emoji: string, text: string} | null>(null);
  
  // Estado de regeneración por escenario
  private readonly regenerationStateSubject = new BehaviorSubject<ScenarioRegenerationState>({});
  
  readonly previewState$ = this.previewStateSubject.asObservable();
  readonly loadingMessage$ = this.loadingMessageSubject.asObservable();
  readonly regenerationState$ = this.regenerationStateSubject.asObservable();

  initializePreview(previewData: PreviewStoryResponse): void {
    if (!previewData.scenarios || !Array.isArray(previewData.scenarios)) {
      this.setLoadingState('error', 'Datos de escenarios inválidos');
      return;
    }

    this.previewStateSubject.next({
      story: previewData.story,
      scenarios: previewData.scenarios || [],
      status: 'ready'
    });
  }

  setLoadingState(status: PreviewState['status'], error?: string): void {
    const currentState = this.previewStateSubject.value;
    this.previewStateSubject.next({ ...currentState, status, error });
  }

  setLoadingMessage(message: {emoji: string, text: string} | null): void {
    this.loadingMessageSubject.next(message);
  }

  /**
   *  Inicia el estado de regeneración para un escenario
   */
  startScenarioRegeneration(scenarioId: string): void {
    console.log(`🔄 [REGENERATION] Iniciando para scenario: ${scenarioId}`);
    
    const currentState = this.regenerationStateSubject.value;
    this.regenerationStateSubject.next({
      ...currentState,
      [scenarioId]: {
        isRegenerating: true,
        error: undefined
      }
    });
  }

  /**
   * Finaliza el estado de regeneración para un escenario
   */
  finishScenarioRegeneration(scenarioId: string, error?: string): void {
    console.log(`✅ [REGENERATION] Finalizando para scenario: ${scenarioId}`, error ? `Error: ${error}` : 'Exitoso');
    
    const currentState = this.regenerationStateSubject.value;
    this.regenerationStateSubject.next({
      ...currentState,
      [scenarioId]: {
        isRegenerating: false,
        error: error
      }
    });
  }

  updateScenarioImage(scenarioId: string, newImage: Image): void {
    console.log(`🖼️ [UPDATE] Actualizando imagen para scenario: ${scenarioId}`);
    console.log(`🖼️ [UPDATE] Nueva imagen:`, {
      id: newImage.id,
      url: newImage.image_url,
      prompt: newImage.prompt?.substring(0, 50) + '...'
    });

    const currentState = this.previewStateSubject.value;
    
  
    const scenarioExists = currentState.scenarios.find(s => s.id === scenarioId);
    if (!scenarioExists) {
      console.error(`❌ [UPDATE] Scenario ${scenarioId} no encontrado en estado actual`);
      return;
    }

    // Actualizar scenarios con nueva imagen
    const updatedScenarios = currentState.scenarios.map(scenario => {
      if (scenario.id === scenarioId) {
        const updatedScenario = { 
          ...scenario, 
          image: {
            ...newImage,
            scenario_id: scenarioId //  Asegurar ID correcto
          }
        };
        console.log(`✅ [UPDATE] Scenario actualizado:`, updatedScenario.id);
        return updatedScenario;
      }
      return scenario;
    });

    this.previewStateSubject.next({ 
      ...currentState, 
      scenarios: updatedScenarios,
      //  Timestamp para forzar re-render
      lastUpdated: Date.now()
    });

    console.log(`🔄 [UPDATE] Estado actualizado. Total scenarios: ${updatedScenarios.length}`);
    console.log(`🔄 [UPDATE] Scenarios con imagen: ${updatedScenarios.filter(s => s.image).length}`);
  }

  isPreviewReadyToSave(): boolean {
    const state = this.previewStateSubject.value;
    return (
      state.status === 'ready' &&
      !!state.story &&
      state.scenarios.length > 0 &&
      state.scenarios.every(scenario => !!scenario.image)
    );
  }

  getPreviewDataForSave(): PreviewStoryResponse | null {
    const state = this.previewStateSubject.value;
    
    console.log(`💾 [SAVE] Preparando datos para guardar...`);
    console.log(`💾 [SAVE] Estado actual:`, {
      status: state.status,
      hasStory: !!state.story,
      totalScenarios: state.scenarios.length,
      scenariosWithImages: state.scenarios.filter(s => s.image).length
    });
    
    if (!this.isPreviewReadyToSave() || !state.story) {
      console.error(`❌ [SAVE] Preview no está listo para guardar`);
      return null;
    }

    //  Extraer imágenes directamente de scenarios (incluye regeneradas)
    const currentImages = state.scenarios
      .filter(s => s.image)
      .map(s => {
        console.log(`🖼️ [SAVE] Incluyendo imagen:`, {
          scenarioId: s.id,
          imageId: s.image!.id,
          imageUrl: s.image!.image_url
        });
        return s.image!;
      });

    console.log(`💾 [SAVE] Total de imágenes a guardar: ${currentImages.length}`);

    return {
      success: true,
      story: state.story,
      scenarios: state.scenarios,
      images: currentImages,  // 🎯 Imágenes actualizadas del estado
      mode: 'preview'
    };
  }

  getCurrentState(): PreviewState {
    return this.previewStateSubject.value;
  }

  clearPreview(): void {
    this.previewStateSubject.next({ scenarios: [], status: 'idle' });
    this.loadingMessageSubject.next(null);
  }

  getGeneratedImagesCount(): number {
    return this.previewStateSubject.value.scenarios.filter(s => !!s.image).length;
  }

  getGenerationProgress(): {current: number, total: number, percentage: number} {
    const state = this.previewStateSubject.value;
    const total = state.scenarios.length;
    const current = this.getGeneratedImagesCount();
    
    return {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0
    };
  }

  getCurrentError(): string | undefined {
    return this.previewStateSubject.value.error;
  }

  /**
   *  Verifica si un escenario se está regenerando
   */
  isScenarioRegenerating(scenarioId: string): boolean {
    const state = this.regenerationStateSubject.value;
    return state[scenarioId]?.isRegenerating || false;
  }

  /**
   *  Obtiene error de regeneración para un escenario
   */
  getScenarioRegenerationError(scenarioId: string): string | undefined {
    const state = this.regenerationStateSubject.value;
    return state[scenarioId]?.error;
  }

  setSavingState(): void { 
    this.setLoadingState('saving'); 
  }
  
  setGeneratingState(): void { 
    this.setLoadingState('generating'); 
  }
  
  isGenerating(): boolean { 
    return this.previewStateSubject.value.status === 'generating'; 
  }
  
  isSaving(): boolean { 
    return this.previewStateSubject.value.status === 'saving'; 
  }
  
  isReady(): boolean { 
    return this.previewStateSubject.value.status === 'ready'; 
  }
  
  isIdle(): boolean { 
    return this.previewStateSubject.value.status === 'idle'; 
  }
  
  hasError(): boolean { 
    return this.previewStateSubject.value.status === 'error'; 
  }
  
  hasErrors(): boolean { 
    const state = this.previewStateSubject.value;
    return state.status === 'error' || !!state.error;
  }
}