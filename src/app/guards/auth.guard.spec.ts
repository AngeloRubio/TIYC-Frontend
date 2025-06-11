import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let guard: authGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated$: of(true)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        authGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    guard = TestBed.inject(authGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated', (done) => {
    // Simular usuario autenticado
    Object.defineProperty(authService, 'isAuthenticated$', {
      value: of(true)
    });

    const mockRoute: any = {};
    const mockState: any = { url: '/biblioteca' };

    guard.canActivate(mockRoute, mockState).subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should deny access and redirect when user is not authenticated', (done) => {
    // Simular usuario no autenticado
    Object.defineProperty(authService, 'isAuthenticated$', {
      value: of(false)
    });

    const mockRoute: any = {};
    const mockState: any = { url: '/biblioteca' };

    guard.canActivate(mockRoute, mockState).subscribe(result => {
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/biblioteca' }
      });
      done();
    });
  });
});