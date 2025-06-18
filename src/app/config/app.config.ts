export const APP_CONFIG = {
  // URLs de la API
  API_BASE_URL: 'http://localhost:5000/api',
  
  ENDPOINTS: {
    // Autenticación
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    
    // Cuentos
    PREVIEW_STORY: '/preview-illustrated-story',
    SAVE_STORY: '/save-previewed-story',
    GET_STORY: '/illustrated-stories',
    RECENT_STORIES: '/stories/recent',
    TEACHER_STORIES: '/stories/teacher',
    
    // Imágenes
    REGENERATE_IMAGE: '/regenerate-scenario-image',
    STORY_IMAGES: '/images/story',
    
    // Escenarios
    STORY_SCENARIOS: '/scenarios/story',
    
    // Perfil del profesor
    PROFILE_GET: '/profile',
    PROFILE_UPDATE: '/profile',
    PROFILE_PASSWORD: '/profile/password',
    PROFILE_ACTIVITY: '/profile/activity',
    PROFILE_VALIDATE: '/profile/validate',
    PROFILE_STATS: '/profile/stats',
  },
  
  // Configuraciones de la aplicación
  APP_SETTINGS: {
    DEFAULT_NUM_ILLUSTRATIONS: 6,
    DEFAULT_PEDAGOGICAL_APPROACH: 'traditional' as const,
    MAX_CONTEXT_LENGTH: 500,
    SUPPORTED_IMAGE_FORMATS: ['png', 'jpg', 'jpeg'],
    PREVIEW_TIMEOUT: 120000, // 2 minutos
  },
  
  // Configuraciones de autenticación
  AUTH_CONFIG: {
    TOKEN_KEY: 'tiyc_auth_token',
    REFRESH_THRESHOLD: 300000, // 5 minutos antes de expiración
    LOGIN_REDIRECT: '/biblioteca',
    LOGOUT_REDIRECT: '/login',
  },
  
  // Mensajes de loading
  LOADING_MESSAGES: [
    { emoji: '🌟', text: 'Despertando la imaginación...' },
    { emoji: '📚', text: 'Tejiendo historias encantadoras...' },
    { emoji: '🎨', text: 'Dando vida a los personajes...' },
    { emoji: '🖼️', text: 'Creando mundos de aventuras...' },
    { emoji: '✨', text: 'Añadiendo el toque final de magia...' },
  ],
  
  // Configuraciones de UI
  UI_CONFIG: {
    ANIMATION_DURATION: 300,
    TOAST_TIMEOUT: 5000,
    DEBOUNCE_TIME: 500,
    ITEMS_PER_PAGE: 12,
  },
  
  APP_INFO: {
    NAME: 'TIYC',
    FULL_NAME: 'Tú Inspiras, Yo Creo',
    VERSION: '1.0.0',
    SCHOOL: 'Unidad Educativa Santa Fe',
    DESCRIPTION: 'Plataforma de generación de cuentos ilustrados con IA',
  },
};

// Tipos derivados de la configuración
export type PedagogicalApproach = typeof APP_CONFIG.APP_SETTINGS.DEFAULT_PEDAGOGICAL_APPROACH;
export type LoadingMessage = typeof APP_CONFIG.LOADING_MESSAGES[0];