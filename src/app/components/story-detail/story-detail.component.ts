import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { StoryService } from '../../services/story.service';
import { Story, Scenario } from '../../models/story.model';


interface LocalIllustratedStory {
  story: Story;
  scenarios: Scenario[];
}

@Component({
  selector: 'app-story-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-detail.component.html',
  styleUrls: ['./story-detail.component.css']
})
export class StoryDetailComponent implements OnInit, OnDestroy {
  
  // Estado del componente
  storyData: LocalIllustratedStory | null = null;
  isLoading = true;
  error: string | null = null;
  storyId: string | null = null;
  
  // Subscripciones
  private subscriptions = new Subscription();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private storyService: StoryService
  ) {}
  
  ngOnInit(): void {
    this.initializeComponent();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Inicializa el componente obteniendo el ID del cuento y cargando datos
   */
  private initializeComponent(): void {
    // Obtener ID del cuento desde la ruta
    const routeSub = this.route.params.subscribe(params => {
      this.storyId = params['id'];
      if (this.storyId) {
        this.loadStoryDetail();
      } else {
        this.error = 'ID de cuento no válido';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(routeSub);
  }
  
  /**
   * Carga el detalle completo del cuento
   */
  loadStoryDetail(): void {
    if (!this.storyId) return;
    
    this.isLoading = true;
    this.error = null;
    
    console.log('📖 Cargando cuento:', this.storyId);
    
    const storySub = this.storyService.getIllustratedStory(this.storyId).subscribe({
      next: (response: any) => { 
        console.log('📦 Respuesta del backend:', response);
        
        if (response.success && response.story) {
        
          this.storyData = {
            story: response.story,
            scenarios: response.scenarios || []
          };
          console.log('✅ Cuento cargado:', this.storyData.story.title);
        } else {
          this.error = response.error || 'Error al cargar el cuento';
          console.error('❌ Error en respuesta:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error HTTP al cargar cuento:', error);
        
        if (error.status === 404) {
          this.error = 'El cuento solicitado no existe o ha sido eliminado';
        } else if (error.status === 401) {
          this.error = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 0) {
          this.error = 'No se puede conectar con el servidor. Verifica que esté ejecutándose.';
        } else {
          this.error = 'Error de conexión al cargar el cuento';
        }
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(storySub);
  }

  goBack(): void {
    this.router.navigate(['/biblioteca']);
  }
  

  createNew(): void {
    this.router.navigate(['/crear']);
  }
  

  exportToPDF(): void {
    console.log('📄 Exportar a PDF - Por implementar');
 
  }
  

  getImageUrl(relativeUrl: string): string {
    return this.storyService.getImageUrl(relativeUrl);
  }
  
  /**
   * Obtener etiqueta de enfoque pedagógico con color
   */
  getPedagogicalApproachLabel(approach: string): {label: string, color: string} {
    switch (approach) {
      case 'montessori':
        return { label: 'Montessori', color: 'bg-blue-500' };
      case 'waldorf':
        return { label: 'Waldorf', color: 'bg-purple-500' };
      case 'traditional':
        return { label: 'Reggio Emilia', color: 'bg-green-500' };
      default:
        return { label: approach, color: 'bg-gray-500' };
    }
  }
  
  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Obtener emoji para categoría
   */
  getCategoryEmoji(category: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('aventura')) return '🗺️';
    if (categoryLower.includes('ciencia')) return '🔬';
    if (categoryLower.includes('fantasía')) return '🧚‍♀️';
    if (categoryLower.includes('naturaleza')) return '🌿';
    if (categoryLower.includes('animales')) return '🐾';
    if (categoryLower.includes('arte') || categoryLower.includes('color')) return '🎨';
    if (categoryLower.includes('música')) return '🎵';
    if (categoryLower.includes('valor')) return '💎';
    if (categoryLower.includes('amistad')) return '👫';
    if (categoryLower.includes('familia')) return '👨‍👩‍👧‍👦';
    
    return '📖'; // Default
  }
  
  /**
   * Obtener escenarios ordenados por secuencia
   */
  getOrderedScenarios(): Scenario[] {
    if (!this.storyData?.scenarios) return [];
    
    return [...this.storyData.scenarios].sort((a, b) => 
      a.sequence_number - b.sequence_number
    );
  }
  
  /**
   * Verificar si el cuento tiene imágenes
   */
  hasImages(): boolean {
    return this.getOrderedScenarios().some(scenario => scenario.image);
  }
  
  /**
   * Contar total de imágenes
   */
  getTotalImages(): number {
    return this.getOrderedScenarios().filter(scenario => scenario.image).length;
  }
  
  /**
   * Obtener título atractivo para cada capítulo
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
    
    // Si hay más capítulos que títulos predefinidos, usar genéricos
    if (chapterNumber > titles.length) {
      return `📖 Capítulo ${chapterNumber}`;
    }
    
    return titles[chapterNumber - 1] || `📖 Capítulo ${chapterNumber}`;
  }
  
  /**
   *: Dividir el contenido del cuento entre escenas para más narrativa
   */
  getStoryContentForScene(sceneIndex: number): string {
    if (!this.storyData?.story?.content) return '';
    
    const fullContent = this.storyData.story.content;
    const totalScenes = this.getOrderedScenarios().length;
    
    // Dividir el contenido en párrafos
    const paragraphs = fullContent.split('\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length === 0) return 'Contenido no disponible.';
    
    // Calcular cuántos párrafos por escena
    const paragraphsPerScene = Math.ceil(paragraphs.length / totalScenes);
    
    // Obtener párrafos para esta escena
    const startIndex = sceneIndex * paragraphsPerScene;
    const endIndex = Math.min(startIndex + paragraphsPerScene, paragraphs.length);
    
    const sceneParagraphs = paragraphs.slice(startIndex, endIndex);
    
    // Si no hay párrafos específicos, usar descripción del escenario ampliada
    if (sceneParagraphs.length === 0) {
      const scenario = this.getOrderedScenarios()[sceneIndex];
      return this.expandScenarioDescription(scenario.description);
    }
    
    return sceneParagraphs.join('\n\n');
  }
  
  /**
   * Expandir descripción del escenario para más contenido
   */
  private expandScenarioDescription(description: string): string {
  
    const expansions: {[key: string]: string} = {
      'aventura': 'La emoción se siente en el aire mientras nuestros personajes se embarcan en esta nueva experiencia. Cada paso los lleva más cerca de descubrimientos increíbles.',
      'bosque': 'Los árboles susurran secretos antiguos mientras la luz del sol se filtra entre las hojas, creando un ambiente mágico y misterioso.',
      'casa': 'El hogar se convierte en el escenario perfecto para momentos especiales, donde cada rincón guarda recuerdos y nuevas posibilidades.',
      'amistad': 'Los lazos que se forman en estos momentos durarán para siempre, enseñándonos el valor de compartir y cuidar unos de otros.',
      'aprender': 'Cada nuevo conocimiento abre puertas a mundos inexplorados, despertando la curiosidad y el deseo de seguir descubriendo.',
      'valor': 'El coraje no significa no tener miedo, sino encontrar la fuerza para seguir adelante a pesar de las dudas.',
    };
    
    // Buscar palabras clave y agregar expansión apropiada
    for (const [keyword, expansion] of Object.entries(expansions)) {
      if (description.toLowerCase().includes(keyword)) {
        return `${description}\n\n${expansion}`;
      }
    }
    
    // Expansión genérica si no se encuentra palabra clave específica
    return `${description}\n\nEste momento de la historia nos invita a reflexionar y sentir junto con los personajes, descubriendo nuevas perspectivas y emociones que enriquecen nuestra experiencia de lectura.`;
  }
}