import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

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
export class AppComponent implements OnInit {
  title = 'TIYC - Tú Inspiras, Yo Creo';
  
  isLoading = true;
  isAuthenticated = false;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.initializeApp();
  }
  
  private initializeApp(): void {
    this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        this.isLoading = false;
        this.handleAuthRedirect();
      }
    );
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