
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ImageModalData {
  imageUrl: string;
  title: string;
  description: string;
  chapterNumber: number;
  prompt?: string;
  allImages?: ImageModalData[]; // Para navegación
  currentIndex?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageModalService {
  
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private modalDataSubject = new BehaviorSubject<ImageModalData | null>(null);
  
  public isOpen$ = this.isOpenSubject.asObservable();
  public modalData$ = this.modalDataSubject.asObservable();
  
  /**
   * Abre el modal con la imagen especificada
   */
  openModal(imageData: ImageModalData): void {
    this.modalDataSubject.next(imageData);
    this.isOpenSubject.next(true);
    
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.isOpenSubject.next(false);
    this.modalDataSubject.next(null);
    
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }
  
  /**
   * Navega a la imagen anterior
   */
  goToPrevious(): void {
    const currentData = this.modalDataSubject.value;
    if (!currentData || !currentData.allImages || currentData.currentIndex === undefined) return;
    
    const newIndex = currentData.currentIndex > 0 
      ? currentData.currentIndex - 1 
      : currentData.allImages.length - 1;
    
    const newImageData = { ...currentData.allImages[newIndex], currentIndex: newIndex, allImages: currentData.allImages };
    this.modalDataSubject.next(newImageData);
  }
  
  /**
   * Navega a la imagen siguiente
   */
  goToNext(): void {
    const currentData = this.modalDataSubject.value;
    if (!currentData || !currentData.allImages || currentData.currentIndex === undefined) return;
    
    const newIndex = currentData.currentIndex < currentData.allImages.length - 1 
      ? currentData.currentIndex + 1 
      : 0;
    
    const newImageData = { ...currentData.allImages[newIndex], currentIndex: newIndex, allImages: currentData.allImages };
    this.modalDataSubject.next(newImageData);
  }
  
  /**
   * Verifica si hay imagen anterior
   */
  hasPrevious(): boolean {
    const currentData = this.modalDataSubject.value;
    return !!(currentData?.allImages && currentData.allImages.length > 1);
  }
  
  /**
   * Verifica si hay imagen siguiente  
   */
  hasNext(): boolean {
    const currentData = this.modalDataSubject.value;
    return !!(currentData?.allImages && currentData.allImages.length > 1);
  }
  
  /**
   * Descarga la imagen actual
   */
  downloadImage(): void {
    const currentData = this.modalDataSubject.value;
    if (!currentData) return;
    
    const link = document.createElement('a');
    link.href = currentData.imageUrl;
    link.download = `cuento-capitulo-${currentData.chapterNumber}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}