
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

import { APP_CONFIG } from '../config/app.config';
import { PreviewStoryResponse } from '../models/story.model';

export interface PDFConfiguration {
 format?: 'A4' | 'Letter' | 'A3';
 orientation?: 'portrait' | 'landscape';
 include_images?: boolean;
 include_cover?: boolean;
 include_metadata?: boolean;
 font_family?: string;
 font_size?: number;
 margin_top?: number;
 margin_bottom?: number;
 margin_left?: number;
 margin_right?: number;
 watermark?: string;
}

export interface PDFExportResponse {
 success: boolean;
 pdf_info?: {
   filename: string;
   download_url: string;
   file_size: number;
   pages: number;
   story_title: string;
   generation_date: string;
 };
 message?: string;
 error?: string;
}

export interface PDFValidationResponse {
 success: boolean;
 validation: {
   valid: boolean;
   errors: string[];
   warnings: string[];
   stats: {
     title_length: number;
     content_length: number;
     scenarios_count: number;
     images_count: number;
   };
   recommendations: string[];
 };
 error?: string;
}

export interface PDFTemplatesResponse {
 success: boolean;
 templates: PDFTemplate[];
 error?: string;
}

export interface PDFTemplate {
 id: string;
 name: string;
 description: string;
 features: string[];
 suitable_for: string[];
}

@Injectable({
 providedIn: 'root'
})
export class PdfService {
 private readonly apiUrl = APP_CONFIG.API_BASE_URL;
 
 // Estado reactivo para progreso de exportación
 private readonly exportProgressSubject = new BehaviorSubject<{
   isExporting: boolean;
   progress: number;
   message: string;
 }>({
   isExporting: false,
   progress: 0,
   message: ''
 });
 
 public readonly exportProgress$ = this.exportProgressSubject.asObservable();

 constructor(
   private readonly http: HttpClient,
   @Inject(PLATFORM_ID) private readonly platformId: Object
 ) {}

 /**
  * 📄 EXPORTAR CUENTO GUARDADO A PDF
  * Para cuentos que ya están en la biblioteca
  */
 exportStoryToPdf(storyId: string, config?: PDFConfiguration): Observable<PDFExportResponse> {
   const url = `${this.apiUrl}/stories/${storyId}/export-pdf`;
   
   this.setExportProgress(true, 0, 'Iniciando exportación...');
   
   const body = config ? { config } : {};
   
   return this.http.post<PDFExportResponse>(url, body, {
     headers: this.getHeaders()
   }).pipe(
     map(response => {
       if (response.success) {
         this.setExportProgress(false, 100, 'PDF generado exitosamente');
       } else {
         this.setExportProgress(false, 0, response.error || 'Error en exportación');
       }
       return response;
     }),
     catchError(error => {
       this.setExportProgress(false, 0, 'Error de conexión');
       throw error;
     })
   );
 }

 /**
  * 📄 EXPORTAR PREVIEW A PDF
  * Para cuentos en estado de preview (descarga inmediata)
  */
 exportPreviewToPdf(previewData: PreviewStoryResponse, config?: PDFConfiguration): Observable<Blob> {
   const url = `${this.apiUrl}/stories/preview/export-pdf`;
   
   this.setExportProgress(true, 0, 'Generando PDF del preview...');
   
   const body = {
     preview_data: previewData,
     config: config || this.getDefaultConfig()
   };
   
   return this.http.post(url, body, {
     headers: this.getHeaders(),
     responseType: 'blob',
     observe: 'response'
   }).pipe(
     map((response: HttpResponse<Blob>) => {
       this.setExportProgress(false, 100, 'PDF preview generado');
       
       // Extraer filename del header si está disponible
       const contentDisposition = response.headers.get('Content-Disposition');
       let filename = 'cuento_preview.pdf';
       
       if (contentDisposition) {
         const matches = contentDisposition.match(/filename="(.+)"/);
         if (matches && matches[1]) {
           filename = matches[1];
         }
       }
       
       // Crear blob con metadata
       const blob = response.body!;
       (blob as any).filename = filename;
       
       return blob;
     }),
     catchError(error => {
       this.setExportProgress(false, 0, 'Error generando PDF');
       throw error;
     })
   );
 }

 /**
  * 🔍 VALIDAR CUENTO PARA PDF
  * Verifica si un cuento puede ser exportado correctamente
  */
 validateStoryForPdf(storyId: string): Observable<PDFValidationResponse> {
   const url = `${this.apiUrl}/stories/${storyId}/validate-pdf`;
   
   return this.http.get<PDFValidationResponse>(url, {
     headers: this.getHeaders()
   });
 }

 /**
  * 📋 OBTENER PLANTILLAS DISPONIBLES
  */
 getPdfTemplates(): Observable<PDFTemplatesResponse> {
   const url = `${this.apiUrl}/pdf/templates`;
   
   return this.http.get<PDFTemplatesResponse>(url, {
     headers: this.getHeaders()
   });
 }

 /**
  * ⚙️ OBTENER CONFIGURACIÓN POR DEFECTO
  */
 getDefaultPdfConfig(): Observable<{
   success: boolean;
   default_config: PDFConfiguration;
   available_options: any;
 }> {
   const url = `${this.apiUrl}/pdf/config/default`;
   
   return this.http.get<any>(url, {
     headers: this.getHeaders()
   });
 }

 /**
  * 💾 DESCARGAR PDF GENERADO
  * Para PDFs que se guardaron en el servidor
  */
 downloadPdf(filename: string): void {
   if (!isPlatformBrowser(this.platformId)) return;
   
   const url = `${this.apiUrl}/pdf/download/${filename}`;
   
   // Crear enlace temporal para descarga
   const link = document.createElement('a');
   link.href = url;
   link.download = filename;
   link.target = '_blank';
   
   // Agregar headers de autenticación si es necesario
   const token = localStorage.getItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
   if (token) {
     // Para descargas con autenticación, usar fetch
     this.downloadWithAuth(url, filename);
     return;
   }
   
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
 }

 /**
  * 💾 DESCARGAR BLOB (para previews)
  */
 downloadBlob(blob: Blob, filename?: string): void {
   if (!isPlatformBrowser(this.platformId)) return;
   
   // Usar filename del blob si está disponible
   const finalFilename = filename || (blob as any).filename || 'cuento.pdf';
   
   // Crear URL temporal para el blob
   const url = window.URL.createObjectURL(blob);
   
   // Crear enlace temporal
   const link = document.createElement('a');
   link.href = url;
   link.download = finalFilename;
   
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   
   // Limpiar URL temporal
   window.URL.revokeObjectURL(url);
 }

 /**
  * 📊 OBTENER CONFIGURACIÓN OPTIMIZADA POR ENFOQUE PEDAGÓGICO
  */
 getOptimizedConfig(pedagogicalApproach: string, targetAge?: string): PDFConfiguration {
   const baseConfig = this.getDefaultConfig();
   
   switch (pedagogicalApproach) {
     case 'montessori':
       return {
         ...baseConfig,
         font_family: 'Arial',
         font_size: 11,
         include_metadata: true,
         watermark: 'Método Montessori - TIYC'
       };
     
     case 'waldorf':
       return {
         ...baseConfig,
         font_family: 'Georgia',
         font_size: 12,
         include_metadata: true,
         watermark: 'Pedagogía Waldorf - TIYC'
       };
     
     case 'traditional':
     default:
       return {
         ...baseConfig,
         font_family: 'Arial',
         font_size: 12,
         watermark: 'Reggio Emilia - TIYC'
       };
   }
 }

 /**
  * ⏳ OBTENER ESTADO DE EXPORTACIÓN
  */
 getExportProgress(): Observable<{isExporting: boolean; progress: number; message: string}> {
   return this.exportProgress$;
 }

 /**
  * 🎨 CREAR CONFIGURACIÓN PERSONALIZADA
  */
 createCustomConfig(overrides: Partial<PDFConfiguration>): PDFConfiguration {
   return {
     ...this.getDefaultConfig(),
     ...overrides
   };
 }

 /**
  * 🔄 ESTABLECER PROGRESO DE EXPORTACIÓN 
  * Permite actualizar el progreso desde componentes externos
  */
 public setExportProgress(isExporting: boolean, progress: number, message: string): void {
   this.exportProgressSubject.next({
     isExporting,
     progress,
     message
   });
 }


 private getDefaultConfig(): PDFConfiguration {
   return {
     format: 'A4',
     orientation: 'portrait',
     include_images: true,
     include_cover: true,
     include_metadata: true,
     font_family: 'Arial',
     font_size: 12,
     margin_top: 1.0,
     margin_bottom: 1.0,
     margin_left: 1.0,
     margin_right: 1.0,
     watermark: 'TIYC - Tú Inspiras, Yo Creo'
   };
 }

 private getHeaders(): HttpHeaders {
   let headers = new HttpHeaders({
     'Content-Type': 'application/json'
   });

   if (isPlatformBrowser(this.platformId)) {
     const token = localStorage.getItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
     if (token) {
       headers = headers.set('Authorization', `Bearer ${token}`);
     }
   }

   return headers;
 }

 private async downloadWithAuth(url: string, filename: string): Promise<void> {
   if (!isPlatformBrowser(this.platformId)) return;
   
   try {
     const token = localStorage.getItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
     
     const response = await fetch(url, {
       headers: {
         'Authorization': `Bearer ${token}`
       }
     });

     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }

     const blob = await response.blob();
     this.downloadBlob(blob, filename);
     
   } catch (error) {
     console.error('Error descargando PDF con autenticación:', error);
     // Fallback: intentar descarga directa
     window.open(url, '_blank');
   }
 }
}