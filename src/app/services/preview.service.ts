import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { 
  PreviewStoryResponse, 
  PreviewState, 
  Image 
} from '../models/story.model';

@Injectable({
  providedIn: 'root'
})
export class PreviewService {
  
  private readonly previewStateSubject = new BehaviorSubject<PreviewState>({
    scenarios: [],
    status: 'idle'
  });
  
  private readonly loadingMessageSubject = new BehaviorSubject<{emoji: string, text: string} | null>(null);
  
  readonly previewState$ = this.previewStateSubject.asObservable();
  readonly loadingMessage$ = this.loadingMessageSubject.asObservable();

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

  updateScenarioImage(scenarioId: string, newImage: Image): void {
    const currentState = this.previewStateSubject.value;
    
    const updatedScenarios = currentState.scenarios.map(scenario => 
      scenario.id === scenarioId ? { ...scenario, image: newImage } : scenario
    );

    this.previewStateSubject.next({ ...currentState, scenarios: updatedScenarios });
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
    
    if (!this.isPreviewReadyToSave() || !state.story) return null;

    return {
      success: true,
      story: state.story,
      scenarios: state.scenarios,
      images: state.scenarios.map(s => s.image!).filter(img => !!img),
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

  setSavingState(): void { this.setLoadingState('saving'); }
  setGeneratingState(): void { this.setLoadingState('generating'); }
  isGenerating(): boolean { return this.previewStateSubject.value.status === 'generating'; }
  isSaving(): boolean { return this.previewStateSubject.value.status === 'saving'; }
  isReady(): boolean { return this.previewStateSubject.value.status === 'ready'; }
  isIdle(): boolean { return this.previewStateSubject.value.status === 'idle'; }
  hasError(): boolean { return this.previewStateSubject.value.status === 'error'; }
  hasErrors(): boolean { 
    const state = this.previewStateSubject.value;
    return state.status === 'error' || !!state.error;
  }
}