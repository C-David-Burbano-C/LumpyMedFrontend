import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  host: { class: 'block min-h-screen' }
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Estados de validación en tiempo real - REMOVIDOS
  // usernameChecking = false;
  // emailChecking = false;
  // usernameError = '';
  // emailError = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // MÉTODOS DE VERIFICACIÓN REMOVIDOS
  // private checkUsernameAvailability(username: string): Observable<boolean> { ... }
  // private checkEmailAvailability(email: string): Observable<boolean> { ... }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registerData = {
      username: this.registerForm.value.username?.trim(),
      email: this.registerForm.value.email?.trim(),
      password: this.registerForm.value.password?.trim(),
      rol: 'USER' as const  // Campo requerido por el backend
    };

    this.authService.register(registerData).subscribe({
      next: (response: string) => {
        this.loading = false;
        this.successMessage = 'Usuario registrado exitosamente. Iniciando sesión...';

        // Hacer login automático con las credenciales del registro
        const loginData = {
          username: registerData.username,
          password: registerData.password
        };

        this.authService.login(loginData).subscribe({
          next: (authResponse) => {
            // Login exitoso, redirigir al dashboard o página principal
            this.router.navigate(['/']);
          },
          error: (loginError) => {
            // Si falla el login automático, redirigir al login manual
            this.successMessage = 'Usuario registrado exitosamente. Por favor inicia sesión.';
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          }
        });
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Error al registrar usuario.';
      }
    });
  }
}
