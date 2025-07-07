import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { HeaderComponent } from './components/shared/header/header.component';
import { CopyrightFooterComponent } from './components/shared/copyright-footer/copyright-footer.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, CopyrightFooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  readonly title = 'TIYC - Tú Inspiras, Yo Creo';
  
  isLoading = true;
  isAuthenticated = false;
  
  private readonly subscription = new Subscription();
  
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}
  
  ngOnInit(): void {
    this.initializeApp();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  private initializeApp(): void {
    const authSub = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        this.isLoading = false;
        this.handleAuthRedirect();
      }
    );
    this.subscription.add(authSub);
  }
  
  private handleAuthRedirect(): void {
    const currentUrl = this.router.url;
    
    if (!this.isAuthenticated && currentUrl !== '/login') {
      this.router.navigate(['/login']);
    } else if (this.isAuthenticated && currentUrl === '/login') {
      this.router.navigate(['/biblioteca']);
    }
  }
}