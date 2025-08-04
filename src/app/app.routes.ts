import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
// Ruta por defecto - redirigir a biblioteca
{
  path: '',
  redirectTo: '/biblioteca',
  pathMatch: 'full'
},

// 🚪 Ruta de LOGIN - Solo accesible si NO está autenticado
{
  path: 'login',
  loadComponent: () => import('./components/auth/login/login.component').then(c => c.LoginComponent),
  canActivate: [LoginGuard] // ✅ Evita acceso si ya está autenticado
},

// 🔑 Ruta de RECUPERACIÓN DE CONTRASEÑA - Solo accesible si NO está autenticado
{
  path: 'forgot-password',
  loadComponent: () => import('./components/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
  canActivate: [LoginGuard] // ✅ Evita acceso si ya está autenticado
},

// 🔒 Rutas PROTEGIDAS - Solo accesibles si está autenticado
{
  path: 'biblioteca',
  loadComponent: () => import('./components/library/library.component').then(c => c.LibraryComponent),
  canActivate: [authGuard] // ✅ Requiere autenticación
},
{
  path: 'crear',
  loadComponent: () => import('./components/create-story/create-story.component').then(c => c.CreateStoryComponent),
  canActivate: [authGuard] // ✅ Requiere autenticación
},
{
  path: 'configuracion',
  loadComponent: () => import('./components/config/config.component').then(c => c.ConfigComponent),
  canActivate: [authGuard] // ✅ Requiere autenticación
},
{
  path: 'cuento/:id',
  loadComponent: () => import('./components/story-detail/story-detail.component').then(c => c.StoryDetailComponent),
  canActivate: [authGuard] // ✅ Requiere autenticación
},

// 👥 Rutas ADMIN - Solo para administradores
{
  path: 'admin',
  loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent),
  canActivate: [authGuard, adminGuard] // ✅ Requiere autenticación + rol admin
},
{
  path: 'admin/usuarios',
  loadComponent: () => import('./components/admin/user-management/user-management.component').then(c => c.UserManagementComponent),
  canActivate: [authGuard, adminGuard] // ✅ Requiere autenticación + rol admin
},

// Ruta de fallback - redirigir a biblioteca (también protegida)
{
  path: '**',
  redirectTo: '/biblioteca'
}
];