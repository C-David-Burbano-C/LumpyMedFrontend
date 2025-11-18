import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  host: { class: 'block' }
})
export class LandingPageComponent implements OnInit {
  readonly currentYear = new Date().getFullYear();
  isLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  goToCalculator(): void {
    this.router.navigate(['/calculator']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
  }
  benefits = [
    {
      title: 'Cálculos precisos',
      description: 'Algoritmos verificados para determinar dosis pediátricas seguras en segundos.'
    },
    {
      title: 'Agenda inteligente',
      description: 'Organiza recordatorios de medicación y compromisos clínicos en un calendario centralizado.'
    },
    {
      title: 'IA especializada',
      description: 'Recibe recomendaciones contextuales respaldadas por datos farmacológicos oficiales.'
    }
  ];
}
