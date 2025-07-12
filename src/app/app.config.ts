import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
 providers: [
   provideRouter(routes), 
   provideClientHydration(),
   provideHttpClient(withFetch()),
   importProvidersFrom(BrowserAnimationsModule),
 ]
};

function getApiBaseUrl(): string {
  console.log('🔍 Environment check:', {
    production: environment.production,
    apiUrl: environment.apiUrl
  });
  
  if (environment.production) {
    console.log('✅ Using PRODUCTION URL:', environment.apiUrl);
    return environment.apiUrl;
  }
  
  console.log('🛠️ Using DEVELOPMENT URL: http://localhost:5000/api');
  return 'http://localhost:5000/api';
}

export const APP_CONFIG = {
 // URLs de la API - DETECTA AUTOMÁTICAMENTE
 API_BASE_URL: getApiBaseUrl(),

 ENDPOINTS: {
   //  Autenticación
   LOGIN: '/auth/login',
   PROFILE: '/auth/profile',
   
   //  Cuentos 
   PREVIEW_STORY: '/preview-illustrated-story',          
   SAVE_STORY: '/save-previewed-story',                 
   GET_STORY: '/illustrated-stories',                    
   RECENT_STORIES: '/stories/recent',                   
   TEACHER_STORIES: '/stories/teacher',                  
   
   //  Imágenes 
   REGENERATE_PREVIEW_IMAGE: '/regenerate-preview-image', 
   REGENERATE_IMAGE: '/regenerate-scenario-image',        
   
   //  Perfil y Configuración
   PROFILE_UPDATE: '/profile',
   PROFILE_PASSWORD: '/profile/password',
   PROFILE_STATS: '/profile/stats',

   // PDF Endpoints
   EXPORT_STORY_PDF: '/stories',
   EXPORT_PREVIEW_PDF: '/stories/preview/export-pdf',
   VALIDATE_PDF: '/stories',
   PDF_TEMPLATES: '/pdf/templates',
   PDF_CONFIG: '/pdf/config/default',
   PDF_DOWNLOAD: '/pdf/download',
 },

 APP_SETTINGS: {
   // Generación de Cuentos
   DEFAULT_NUM_ILLUSTRATIONS: 6,                       
   MIN_NUM_ILLUSTRATIONS: 1,
   MAX_NUM_ILLUSTRATIONS: 8,
   DEFAULT_PEDAGOGICAL_APPROACH: 'traditional' as const,
   
   // Validación de Contenido
   MIN_CONTEXT_LENGTH: 10,
   MAX_CONTEXT_LENGTH: 500,
   MIN_CATEGORY_LENGTH: 2,
   
   // Configuración de Imágenes
   SUPPORTED_IMAGE_FORMATS: ['png', 'jpg', 'jpeg', 'webp'],
   IMAGE_MAX_SIZE: 1024 * 1024 * 5, // 5MB
   
   PREVIEW_TIMEOUT: 120000,         
   REGENERATION_TIMEOUT: 30000,    
   SAVE_TIMEOUT: 15000,             
   
   MAX_CACHED_STORIES: 50,
   STORAGE_QUOTA_WARNING: 0.8,       
 },

 AUTH_CONFIG: {
   TOKEN_KEY: 'tiyc_auth_token',
   USER_DATA_KEY: 'tiyc_user_data',
   REFRESH_THRESHOLD: 300000,       
   AUTO_LOGOUT_WARNING: 60000,      
   LOGIN_REDIRECT: '/biblioteca',
   LOGOUT_REDIRECT: '/login',
   SESSION_CHECK_INTERVAL: 30000,    
 },

 LOADING_MESSAGES: [
   { emoji: '🌟', text: 'Despertando la imaginación...', phase: 'init' },
   { emoji: '📚', text: 'Tejiendo historias encantadoras...', phase: 'story' },
   { emoji: '🎨', text: 'Dando vida a los personajes...', phase: 'scenarios' },
   { emoji: '🖼️', text: 'Creando mundos de aventuras...', phase: 'images' },
   { emoji: '✨', text: 'Añadiendo el toque final de magia...', phase: 'final' },
   { emoji: '🎉', text: '¡Tu cuento está casi listo!', phase: 'complete' },
 ],

 OPERATION_MESSAGES: {
   REGENERATING: [
     { emoji: '🔄', text: 'Creando una nueva versión...' },
     { emoji: '🎨', text: 'Ajustando los colores y formas...' },
     { emoji: '✨', text: 'Perfeccionando los detalles...' },
   ],
   SAVING: [
     { emoji: '💾', text: 'Guardando tu creación...' },
     { emoji: '📚', text: 'Añadiendo a tu biblioteca...' },
     { emoji: '🎉', text: '¡Casi terminamos!' },
   ]
 },
 
 UI_CONFIG: {
   ANIMATION_DURATION: 300,
   SLOW_ANIMATION_DURATION: 600,
   FAST_ANIMATION_DURATION: 150,
   
   TOAST_TIMEOUT: 5000,
   SUCCESS_TOAST_TIMEOUT: 3000,
   ERROR_TOAST_TIMEOUT: 8000,
   
   DEBOUNCE_TIME: 500,
   SEARCH_DEBOUNCE_TIME: 300,
   VALIDATION_DEBOUNCE_TIME: 800,

   ITEMS_PER_PAGE: 12,
   STORIES_PER_PAGE: 9,
   MAX_RECENT_STORIES: 20,

   MOBILE_BREAKPOINT: 768,
   TABLET_BREAKPOINT: 1024,
   DESKTOP_BREAKPOINT: 1280,
   
   SMOOTH_SCROLL_DURATION: 500,
   INFINITE_SCROLL_THRESHOLD: 200,
 },

 MONITORING_CONFIG: {
   TRACK_GENERATION_TIME: true,
   TRACK_USER_INTERACTIONS: true,
   TRACK_ERROR_RATES: true,
   
   MEASURE_LOAD_TIMES: true,
   MEASURE_INTERACTION_DELAY: true,
   
   MAX_GENERATION_TIME: 180000,    
   MAX_ERROR_RATE: 0.05,            
   MAX_LOAD_TIME: 5000,           
 },

 PWA_CONFIG: {
   ENABLE_OFFLINE_MODE: false,      
   CACHE_STORIES: true,
   CACHE_IMAGES: false,              
   SYNC_WHEN_ONLINE: true,
 },

 APP_INFO: {
   NAME: 'TIYC',
   FULL_NAME: 'Tú Inspiras, Yo Creo',
   VERSION: '1.2.0',            
   BUILD_DATE: '2025-01-20',
   SCHOOL: 'Unidad Educativa Santa Fe',
   DESCRIPTION: 'Plataforma de generación de cuentos ilustrados con IA pedagógica',
   AUTHOR: 'Equipo TIYC',
   CONTACT: 'soporte@tiyc-santafe.edu.ec',
   REPOSITORY: 'https://github.com/tiyc-santa-fe/story-platform',
 },

 ENVIRONMENT: {
   PRODUCTION: environment.production,  // ← TAMBIÉN DINÁMICO
   DEVELOPMENT: !environment.production,
   STAGING: false,

   FEATURES: {
     ENABLE_PDF_EXPORT: true,       
     ENABLE_STORY_SHARING: false,   
     ENABLE_COLLABORATION: false,   
     ENABLE_VOICE_NARRATION: false,  
     ENABLE_ADVANCED_EDITOR: true,  
     ENABLE_IMAGE_REGENERATION: true, 
   },
   
   DEBUG: {
     LOG_API_CALLS: !environment.production,  // ← SOLO EN DEV
     LOG_STATE_CHANGES: !environment.production,
     LOG_PERFORMANCE: true,
     VERBOSE_ERRORS: !environment.production,
   }
 },
};

// Resto de tipos y funciones igual...
export type PedagogicalApproach = typeof APP_CONFIG.APP_SETTINGS.DEFAULT_PEDAGOGICAL_APPROACH;
export type LoadingMessage = typeof APP_CONFIG.LOADING_MESSAGES[0];
export type OperationMessage = typeof APP_CONFIG.OPERATION_MESSAGES.REGENERATING[0];
export type EnvironmentFeature = keyof typeof APP_CONFIG.ENVIRONMENT.FEATURES;
export type UIAnimationDuration = keyof Pick<typeof APP_CONFIG.UI_CONFIG, 'ANIMATION_DURATION' | 'SLOW_ANIMATION_DURATION' | 'FAST_ANIMATION_DURATION'>;
export type APIEndpoint = keyof typeof APP_CONFIG.ENDPOINTS;
export type HTTPTimeout = keyof Pick<typeof APP_CONFIG.APP_SETTINGS, 'PREVIEW_TIMEOUT' | 'REGENERATION_TIMEOUT' | 'SAVE_TIMEOUT'>;

export function isFeatureEnabled(feature: EnvironmentFeature): boolean {
 return APP_CONFIG.ENVIRONMENT.FEATURES[feature];
}

export function getEndpointUrl(endpoint: APIEndpoint): string {
 return `${APP_CONFIG.API_BASE_URL}${APP_CONFIG.ENDPOINTS[endpoint]}`;
}

export function isDevelopment(): boolean {
 return APP_CONFIG.ENVIRONMENT.DEVELOPMENT;
}

export function getLoadingMessageByPhase(phase: string): LoadingMessage | undefined {
 return APP_CONFIG.LOADING_MESSAGES.find(msg => msg.phase === phase);
}

export function getTimeoutForOperation(operation: HTTPTimeout): number {
 return APP_CONFIG.APP_SETTINGS[operation];
}