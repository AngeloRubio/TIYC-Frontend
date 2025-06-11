import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

import { 
  Story, 
  GenerateStoryRequest, 
  ApiResponse, 
  PreviewStoryResponse,
  IllustratedStory 
} from '../models/story.model';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private readonly apiUrl = APP_CONFIG.API_BASE_URL;
  
  // Estado reactivo para los cuentos
  private storiesSubject = new BehaviorSubject<Story[]>([]);
  public stories$ = this.storiesSubject.asObservable();
  
  // Estado del preview actual
  private currentPreviewSubject = new BehaviorSubject<PreviewStoryResponse | null>(null);
  public currentPreview$ = this.currentPreviewSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * NUEVO: Genera preview de cuento sin guardar en BD
   */
  generatePreview(request: GenerateStoryRequest): Observable<PreviewStoryResponse> {
    const url = `${this.apiUrl}${APP_CONFIG.ENDPOINTS.PREVIEW_STORY}`;
    
    return this.http.post<PreviewStoryResponse>(url, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * NUEVO: Guarda un preview en la biblioteca
   */
  savePreviewedStory(previewData: PreviewStoryResponse): Observable<ApiResponse<{story_id: string}>> {
    const url = `${this.apiUrl}${APP_CONFIG.ENDPOINTS.SAVE_STORY}`;
    
    return this.http.post<ApiResponse<{story_id: string}>>(url, previewData, {
      headers: this.getHeaders()
    });
  }

  /**
   * NUEVO: Regenera imagen de un escenario específico
   */
  regenerateScenarioImage(
    scenarioId: string, 
    options?: {
      pedagogical_approach?: string;
      style?: string;
    }
  ): Observable<ApiResponse<{new_image: any}>> {
    const url = `${this.apiUrl}/regenerate-scenario-image/${scenarioId}`;
    
    return this.http.post<ApiResponse<{new_image: any}>>(url, options || {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Genera cuento completo y lo guarda (endpoint original)
   */
  generateCompleteStory(request: GenerateStoryRequest): Observable<PreviewStoryResponse> {
    const url = `${this.apiUrl}${APP_CONFIG.ENDPOINTS.GET_STORY}`;
    
    return this.http.post<PreviewStoryResponse>(url, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene un cuento ilustrado completo por ID
   */
  getIllustratedStory(storyId: string): Observable<ApiResponse<IllustratedStory>> {
    const url = `${this.apiUrl}${APP_CONFIG.ENDPOINTS.GET_STORY}/${storyId}`;
    
    return this.http.get<ApiResponse<IllustratedStory>>(url, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene cuentos recientes
   */
  getRecentStories(limit: number = 10): Observable<ApiResponse<Story[]>> {
    const url = `${this.apiUrl}${APP_CONFIG.ENDPOINTS.RECENT_STORIES}?limit=${limit}`;
    
    return this.http.get<ApiResponse<Story[]>>(url, {
      headers: this.getHeaders()
    });
  }

/**
   * Obtiene cuentos de un profesor específico
   */
  getTeacherStories(teacherId: string, limit: number = 10): Observable<{success: boolean, stories?: Story[], error?: string}> {
    const url = `${this.apiUrl}${APP_CONFIG.ENDPOINTS.TEACHER_STORIES}/${teacherId}?limit=${limit}`;
    
    return this.http.get<{success: boolean, stories?: Story[], error?: string}>(url, {
      headers: this.getHeaders()
    });
  }

  /**
   * GESTIÓN DE ESTADO: Actualiza el preview actual
   */
  setCurrentPreview(preview: PreviewStoryResponse | null): void {
    this.currentPreviewSubject.next(preview);
  }

  /**
   * GESTIÓN DE ESTADO: Obtiene el preview actual
   */
  getCurrentPreview(): PreviewStoryResponse | null {
    return this.currentPreviewSubject.value;
  }

  /**
   * GESTIÓN DE ESTADO: Actualiza la lista de cuentos
   */
  updateStoriesList(stories: Story[]): void {
    this.storiesSubject.next(stories);
  }

  /**
   * GESTIÓN DE ESTADO: Agrega un cuento a la lista
   */
  addStoryToList(story: Story): void {
    const currentStories = this.storiesSubject.value;
    this.storiesSubject.next([story, ...currentStories]);
  }

  /**
   * UTILIDAD: Genera headers con autenticación
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Solo acceder a localStorage en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * UTILIDAD: Construye URL completa para imágenes
   */
  getImageUrl(relativeUrl: string): string {
    if (relativeUrl.startsWith('http')) {
      return relativeUrl; // URL absoluta
    }
    return `${this.apiUrl.replace('/api', '')}${relativeUrl}`;
  }

  /**
   * UTILIDAD: Valida request antes de enviar
   */
  validateStoryRequest(request: GenerateStoryRequest): {valid: boolean, errors: string[]} {
    const errors: string[] = [];

    if (!request.context || request.context.trim().length < 10) {
      errors.push('El contexto debe tener al menos 10 caracteres');
    }

    if (!request.category || request.category.trim().length < 2) {
      errors.push('La categoría es requerida');
    }

    if (!['montessori', 'waldorf', 'traditional'].includes(request.pedagogical_approach)) {
      errors.push('Enfoque pedagógico no válido');
    }

    if (request.context && request.context.length > APP_CONFIG.APP_SETTINGS.MAX_CONTEXT_LENGTH) {
      errors.push(`El contexto no puede exceder ${APP_CONFIG.APP_SETTINGS.MAX_CONTEXT_LENGTH} caracteres`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}