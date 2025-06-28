

export interface Story {
  id: string;
  title: string;
  content: string;
  context: string;
  category: string;
  pedagogical_approach: 'montessori' | 'waldorf' | 'traditional';
  teacher_id?: string;
  created_at: string;
}

export interface Scenario {
  id: string;
  story_id: string;
  description: string;
  sequence_number: number;
  prompt_for_image: string;
  created_at: string;
  image?: Image;
}

export interface Image {
  id: string;
  scenario_id: string;
  prompt: string;
  image_url: string;
  created_at: string;
}

export interface IllustratedStory {
  story: Story;
  scenarios: Scenario[];
}

// DTOs para requests
export interface GenerateStoryRequest {
  context: string;
  category: string;
  pedagogical_approach: 'montessori' | 'waldorf' | 'traditional';
  target_age: string;
  teacher_id?: string;
  max_length?: number;
  num_illustrations?: number;
}

export interface GenerateImageRequest {
  prompt: string;
  pedagogical_approach: 'montessori' | 'waldorf' | 'traditional';
  style?: string;
  width?: number;
  height?: number;
}

// Respuestas de la API - 
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;

  stories?: Story[];  
  scenarios?: Scenario[];  
  images?: Image[];  
}

export interface PreviewStoryResponse {
  success: boolean;
  story?: Story;
  scenarios?: Scenario[];
  images?: Image[];
  summary?: string;
  mode?: 'preview' | 'saved'; 
  preview_info?: {
    generated_at: string;
    is_preview: boolean;
    can_save: boolean;
    expires_info?: string;
  };
  // Propiedades de error
  error?: string;
  message?: string;
  step?: string;
}

// Estados de la aplicación
export interface PreviewState {
  story?: Story;
  scenarios: Scenario[];
  status: 'idle' | 'generating' | 'ready' | 'saving' | 'error';
  error?: string;
  lastUpdated?: number;
}

// Opciones de formulario
export interface GradeOption {
  value: string;
  label: string;
  ageRange: string;
}

export interface PedagogicalApproach {
  key: 'montessori' | 'waldorf' | 'traditional';
  label: string;
  description: string;
}

// Usuario/Profesor
export interface Teacher {
  id: string;
  username: string;
  email: string;
  school?: string;
  grade?: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  teacher: Teacher;
  error?: string;
}

// Configuraciones
export const GRADE_OPTIONS: GradeOption[] = [
  { value: 'Primero de Básica', label: 'Primero de Básica (6-7 años)', ageRange: '6-7 años' },
  { value: 'Segundo de Básica', label: 'Segundo de Básica (7-8 años)', ageRange: '7-8 años' },
  { value: 'Tercero de Básica', label: 'Tercero de Básica (8-9 años)', ageRange: '8-9 años' },
  { value: 'Cuarto de Básica', label: 'Cuarto de Básica (9-10 años)', ageRange: '9-10 años' },
  { value: 'Quinto de Básica', label: 'Quinto de Básica (10-11 años)', ageRange: '10-11 años' },
  { value: 'Sexto de Básica', label: 'Sexto de Básica (11-12 años)', ageRange: '11-12 años' },
  { value: 'Séptimo de Básica', label: 'Séptimo de Básica (12-13 años)', ageRange: '12-13 años' },
];

export const PEDAGOGICAL_APPROACHES: PedagogicalApproach[] = [
  {
    key: 'montessori',
    label: 'Montessori',
    description: 'Enfoque en la autonomía y el aprendizaje a través de la experiencia'
  },
  {
    key: 'waldorf',
    label: 'Waldorf',
    description: 'Desarrollo integral a través del arte, ritmo y imaginación'
  },
  {
    key: 'traditional',
    label: 'Reggio Emilia',
    description: 'Aprendizaje colaborativo y expresión creativa'
  }
];