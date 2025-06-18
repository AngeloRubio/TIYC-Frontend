import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { 
  ProfileService, 
  ProfileResponse, 
  FieldValidationResponse 
} from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { Teacher, GRADE_OPTIONS } from '../../models/story.model';

interface ValidationState {
  [key: string]: {
    isValid: boolean;
    message: string;
    isValidating: boolean;
  };
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit, OnDestroy {
  
  profileData: any = null;
  currentUser: Teacher | null = null;
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  isLoading = true;
  isSaving = false;
  isChangingPassword = false;
  showPasswordForm = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  fieldValidation: ValidationState = {};
  readonly gradeOptions = GRADE_OPTIONS;
  
  private subscriptions = new Subscription();
  
  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormValidation();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  private initializeComponent(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadProfileData();
      } else {
        this.router.navigate(['/login']);
      }
    });
    this.subscriptions.add(userSub);
  }
  
  private initializeForms(): void {
    this.profileForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      grade: ['']
    });
    
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  private setupFormValidation(): void {
    Object.keys(this.profileForm.controls).forEach(field => {
      const control = this.profileForm.get(field);
      if (control) {
        const validationSub = control.valueChanges.pipe(
          debounceTime(500),
          distinctUntilChanged()
        ).subscribe(value => {
          this.validateField(field, value);
        });
        this.subscriptions.add(validationSub);
      }
    });
  }
  
  private loadProfileData(): void {
    this.isLoading = true;
    this.error = null;
    
    const profileSub = this.profileService.getProfile().subscribe({
      next: (response: ProfileResponse) => {
        if (response.success) {
          this.profileData = response.profile!;
          this.populateProfileForm();
        } else {
          this.error = response.error || 'Error al cargar perfil';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = 'Error de conexión al cargar perfil';
        this.isLoading = false;
        console.error('Error loading profile:', error);
      }
    });
    
    this.subscriptions.add(profileSub);
  }
  
  private populateProfileForm(): void {
    if (this.profileData) {
      this.profileForm.patchValue({
        username: this.profileData.username,
        grade: this.profileData.grade || ''
      });
    }
  }
  
  onUpdateProfile(): void {
    if (this.profileForm.invalid || this.isSaving) return;
    
    this.isSaving = true;
    this.error = null;
    this.successMessage = null;
    
    const formData = this.profileForm.value;
    const updatedFields: any = {};
    
    if (formData.username !== this.profileData?.username) {
      updatedFields.username = formData.username;
    }
    if (formData.grade !== this.profileData?.grade) {
      updatedFields.grade = formData.grade;
    }
    
    if (Object.keys(updatedFields).length === 0) {
      this.isSaving = false;
      this.successMessage = 'No hay cambios para guardar';
      return;
    }
    
    const updateSub = this.profileService.updateProfile(updatedFields).subscribe({
      next: (response: ProfileResponse) => {
        if (response.success) {
          this.profileData = response.profile!;
          this.successMessage = response.message || 'Perfil actualizado exitosamente';
          this.authService.updateCurrentUser(response.profile);
          setTimeout(() => this.successMessage = null, 3000);
        } else {
          this.error = response.error || 'Error al actualizar perfil';
        }
        this.isSaving = false;
      },
      error: (error: any) => {
        this.error = 'Error de conexión al actualizar perfil';
        this.isSaving = false;
        console.error('Error updating profile:', error);
      }
    });
    
    this.subscriptions.add(updateSub);
  }
  
  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }
  
  onChangePassword(): void {
    if (this.passwordForm.invalid || this.isChangingPassword) return;
    
    this.isChangingPassword = true;
    this.error = null;
    this.successMessage = null;
    
    const passwordData = {
      current_password: this.passwordForm.value.currentPassword,
      new_password: this.passwordForm.value.newPassword,
      confirm_password: this.passwordForm.value.confirmPassword
    };
    
    const passwordSub = this.profileService.changePassword(passwordData).subscribe({
      next: (response: {success: boolean, message?: string, error?: string}) => {
        if (response.success) {
          this.successMessage = response.message || 'Contraseña cambiada exitosamente';
          this.passwordForm.reset();
          this.showPasswordForm = false;
          setTimeout(() => this.successMessage = null, 3000);
        } else {
          this.error = response.error || 'Error al cambiar contraseña';
        }
        this.isChangingPassword = false;
      },
      error: (error: any) => {
        this.error = 'Error de conexión al cambiar contraseña';
        this.isChangingPassword = false;
        console.error('Error changing password:', error);
      }
    });
    
    this.subscriptions.add(passwordSub);
  }
  
  private validateField(field: string, value: string): void {
    if (!value || value.trim() === '') {
      this.fieldValidation[field] = { isValid: true, message: '', isValidating: false };
      return;
    }
    
    this.fieldValidation[field] = { isValid: false, message: '', isValidating: true };
    
    const validateSub = this.profileService.validateField(field, value).subscribe({
      next: (response: FieldValidationResponse) => {
        this.fieldValidation[field] = {
          isValid: response.valid,
          message: response.valid ? '✓ Válido' : response.error || 'Error de validación',
          isValidating: false
        };
      },
      error: (error: any) => {
        this.fieldValidation[field] = { isValid: false, message: 'Error de validación', isValidating: false };
      }
    });
    
    this.subscriptions.add(validateSub);
  }
  
  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }
  
  getFieldValidationClass(field: string): string {
    const validation = this.fieldValidation[field];
    if (!validation || validation.isValidating) return '';
    return validation.isValid ? 'border-green-500' : 'border-red-500';
  }
  
  getFieldValidationMessage(field: string): string {
    const validation = this.fieldValidation[field];
    if (!validation) return '';
    if (validation.isValidating) return 'Validando...';
    return validation.message;
  }
  
  isFormValid(): boolean {
    return this.profileForm.valid && !this.hasInvalidFields();
  }
  
  private hasInvalidFields(): boolean {
    return Object.values(this.fieldValidation).some(v => !v.isValid && !v.isValidating);
  }
  
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  goToLibrary(): void {
    this.router.navigate(['/biblioteca']);
  }
  
  goToCreateStory(): void {
    this.router.navigate(['/crear']);
  }
}