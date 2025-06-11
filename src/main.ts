import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http'; // ✅ NUEVO: Importar provideHttpClient y withFetch
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    // Proveedor de HttpClient con Fetch
    provideHttpClient(withFetch()),

    // Configuración de Router
    importProvidersFrom(
      RouterModule.forRoot(routes, {
        enableTracing: false,
        scrollPositionRestoration: 'top',
      })
    ),

    // Animaciones
    importProvidersFrom(BrowserAnimationsModule),
  ],
}).catch((err) => console.error(err));
