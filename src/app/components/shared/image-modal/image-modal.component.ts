// src/app/components/shared/image-modal/image-modal.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ImageModalService, ImageModalData } from '../../../services/image-modal.service';

@Component({
  selector: 'app-image-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm animate-fadeIn"
      (click)="onBackdropClick($event)"
    >
      <!-- Modal Container -->
      <div class="relative w-full h-full max-w-7xl max-h-screen p-4 flex flex-col">
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-4 text-white">
          <div class="flex items-center space-x-4">
            <h2 class="text-tiyc-heading font-bold">{{ modalData?.title }}</h2>
            <span class="bg-tiyc-primary px-3 py-1 rounded-full text-tiyc-small font-semibold">
              Capítulo {{ modalData?.chapterNumber }}
            </span>
          </div>
          
          <div class="flex items-center space-x-3">
            <!-- Navegación entre imágenes -->
            <button 
              *ngIf="imageModalService.hasPrevious()"
              (click)="goToPrevious()"
              class="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
              title="Imagen anterior"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <button 
              *ngIf="imageModalService.hasNext()"
              (click)="goToNext()"
              class="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
              title="Imagen siguiente"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
            
            <!-- Botón descargar -->
            <button 
              (click)="downloadImage()"
              class="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
              title="Descargar imagen"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </button>
            
            <!-- Botón cerrar -->
            <button 
              (click)="closeModal()"
              class="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-all duration-200"
              title="Cerrar modal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Imagen principal con zoom -->
        <div class="flex-1 flex items-center justify-center overflow-hidden">
          <div class="relative max-w-full max-h-full">
            <img 
              *ngIf="modalData"
              [src]="modalData.imageUrl"
              [alt]="modalData.title"
              class="max-w-full max-h-full object-contain cursor-zoom-in transition-transform duration-300 rounded-lg shadow-2xl"
              [class.cursor-zoom-out]="isZoomed"
              [style.transform]="getImageTransform()"
              (click)="toggleZoom()"
              (load)="onImageLoad()"
              (error)="onImageError()"
            >
            
            <!-- Loading spinner -->
            <div *ngIf="isImageLoading" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          </div>
        </div>
        
        <!-- Footer con información -->
        <div class="mt-4 text-white text-center">
          <p class="text-tiyc-body">{{ modalData?.description }}</p>
        </div>
        
        <!-- Instrucciones -->
        <div class="text-center text-gray-400 text-tiyc-small mt-3">
          <span>Clic en la imagen para hacer zoom • ESC para cerrar</span>
          <span *ngIf="imageModalService.hasNext() || imageModalService.hasPrevious()"> • ← → para navegar</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
    
    .cursor-zoom-in {
      cursor: zoom-in;
    }
    
    .cursor-zoom-out {
      cursor: zoom-out;
    }
  `]
})
export class ImageModalComponent implements OnInit, OnDestroy {
  
  isOpen = false;
  modalData: ImageModalData | null = null;
  isZoomed = false;
  isImageLoading = true;
  
  private subscriptions = new Subscription();
  
  constructor(public imageModalService: ImageModalService) {}
  
  ngOnInit(): void {
    // Suscribirse al estado del modal
    const isOpenSub = this.imageModalService.isOpen$.subscribe(
      isOpen => this.isOpen = isOpen
    );
    
    const modalDataSub = this.imageModalService.modalData$.subscribe(
      data => {
        this.modalData = data;
        this.isZoomed = false; // Reset zoom al cambiar imagen
        this.isImageLoading = !!data; // Mostrar loading si hay nueva imagen
      }
    );
    
    this.subscriptions.add(isOpenSub);
    this.subscriptions.add(modalDataSub);
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  // Manejo de teclas
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) return;
    
    switch (event.key) {
      case 'Escape':
        this.closeModal();
        break;
      case 'ArrowLeft':
        if (this.imageModalService.hasPrevious()) {
          this.goToPrevious();
        }
        break;
      case 'ArrowRight':
        if (this.imageModalService.hasNext()) {
          this.goToNext();
        }
        break;
    }
  }
  
  closeModal(): void {
    this.imageModalService.closeModal();
  }
  
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
  
  toggleZoom(): void {
    this.isZoomed = !this.isZoomed;
  }
  
  getImageTransform(): string {
    return this.isZoomed ? 'scale(1.5)' : 'scale(1)';
  }
  
  goToPrevious(): void {
    this.imageModalService.goToPrevious();
  }
  
  goToNext(): void {
    this.imageModalService.goToNext();
  }
  
  downloadImage(): void {
    this.imageModalService.downloadImage();
  }
  
  onImageLoad(): void {
    this.isImageLoading = false;
  }
  
  onImageError(): void {
    this.isImageLoading = false;
    console.error('Error al cargar la imagen en el modal');
  }
}