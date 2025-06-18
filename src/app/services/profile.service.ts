import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

import { APP_CONFIG } from '../config/app.config';

export interface ProfileResponse {
  success: boolean;
  profile?: {
    id: string;
    username: string;
    email: string;
    grade?: string;
    created_at: string;
  };
  error?: string;
  message?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  grade?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface FieldValidationResponse {
  success: boolean;
  valid: boolean;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = APP_CONFIG.API_BASE_URL;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getProfile(): Observable<ProfileResponse> {
    const url = `${this.apiUrl}/profile`;
    return this.http.get<ProfileResponse>(url, { headers: this.getHeaders() });
  }

  updateProfile(updateData: UpdateProfileRequest): Observable<ProfileResponse> {
    const url = `${this.apiUrl}/profile`;
    return this.http.put<ProfileResponse>(url, updateData, { headers: this.getHeaders() });
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<{success: boolean, message?: string, error?: string}> {
    const url = `${this.apiUrl}/profile/password`;
    return this.http.put<{success: boolean, message?: string, error?: string}>(url, passwordData, { headers: this.getHeaders() });
  }

  validateField(field: string, value: string): Observable<FieldValidationResponse> {
    const url = `${this.apiUrl}/profile/validate`;
    return this.http.post<FieldValidationResponse>(url, { field, value }, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(APP_CONFIG.AUTH_CONFIG.TOKEN_KEY);
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }
}