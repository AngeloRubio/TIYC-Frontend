import { Component } from '@angular/core';

@Component({
  selector: 'app-copyright-footer',
  standalone: true,
  template: `
    <footer class="text-center py-2">
      <p class="text-gray-600 text-tiyc-small">
        Todos los derechos reservados © 2025 - Universidad de Guayaquil
      </p>
    </footer>
  `,
  styles: [`
    footer {
      padding: 0.5rem 0;
      margin: 0;
    }
    
    footer p {
      margin: 0;
      color: #6b7280;
      font-size: 0.75rem;
      font-weight: 400;
    }
    
    @media (max-width: 768px) {
      footer {
        padding: 0.25rem 0;
      }
      
      footer p {
        font-size: 0.7rem;
      }
    }
  `]
})
export class CopyrightFooterComponent {}