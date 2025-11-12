import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CalendarOptions } from '@fullcalendar/core';
import { CalendarService } from '../../../services/calendar.service';
import { MedicinesService } from '../../../services/medicines.service';
import { AiService } from '../../../services/ai.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CalendarEvent, CreateEventRequest, CalendarEventsResponse, CalendarFilters } from '../../../models/calendar.model';
import { Medicine, MedicinePage } from '../../../models/medicine.model';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventFormComponent } from '../event-form/event-form.component';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [],
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    height: 'auto'
  };

  events: CalendarEvent[] = [];
  medicines: Medicine[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 50;
  totalElements = 0;
  totalPages = 0;
  currentUser: any;
  isAdmin = false;

  constructor(
    private calendarService: CalendarService,
    private medicinesService: MedicinesService,
    private aiService: AiService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Inicializar usuario actual y permisos
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'ADMIN';

    // Verificar autenticación antes de cargar datos
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Debes iniciar sesión para acceder al calendario', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }

    this.loadEvents();
    this.loadMedicines();
  }

  loadEvents(filters?: CalendarFilters): void {
    this.loading = true;
    this.calendarService.getAllEvents(filters).subscribe({
      next: (response: CalendarEventsResponse) => {
        this.events = response.content;
        this.currentPage = response.number;
        this.pageSize = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.updateCalendarEvents();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        let errorMessage = 'Error al cargar eventos';
        
        if (error.status === 403) {
          errorMessage = 'No tienes permisos para acceder al calendario. Contacta al administrador.';
        } else if (error.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          this.router.navigate(['/login']);
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  loadMedicines(page: number = 0, size: number = 100): void {
    this.medicinesService.getAll(page, size).subscribe({
      next: (response: MedicinePage) => {
        this.medicines = response.content;
      },
      error: (error) => {
        this.snackBar.open('Error al cargar medicamentos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEvents({ page: this.currentPage, size: this.pageSize });
  }

  onFilterChange(filters: CalendarFilters): void {
    this.loadEvents({ ...filters, page: 0, size: this.pageSize });
  }

  openCreateEventDialog(): void {
    const dialogRef = this.dialog.open(EventFormComponent, {
      width: '600px',
      data: {
        medicines: this.medicines,
        event: null // null indica que es creación
      },
      panelClass: 'dark-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvents(); // Recargar eventos después de crear uno nuevo
      }
    });
  }

  handleDateClick(arg: any): void {
    const dialogRef = this.dialog.open(EventFormComponent, {
      width: '600px',
      data: {
        medicines: this.medicines,
        event: null, // null indica que es creación
        selectedDate: arg.date // Pasar la fecha seleccionada
      },
      panelClass: 'dark-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvents(); // Recargar eventos después de crear uno nuevo
      }
    });
  }

  handleEventClick(arg: any): void {
    const event = arg.event;
    const extendedProps = event.extendedProps || {};

    // Mostrar información del evento
    const title = event.title || 'Sin título';
    const description = extendedProps.description || 'Sin descripción';
    const medicineName = this.getMedicineName(extendedProps.medicineId);

    // Crear mensaje con la información del evento
    let message = `<strong>${title}</strong>`;
    if (medicineName) {
      message += `<br><small>Medicamento: ${medicineName}</small>`;
    }
    if (description && description.trim()) {
      message += `<br><br>${description}`;
    }

    // Mostrar en snackbar con duración más larga
    this.snackBar.open(message, 'Cerrar', {
      duration: 8000,
      panelClass: ['event-info-snackbar']
    });
  }

  private getMedicineName(medicineId?: number): string {
    if (!medicineId || !this.medicines) return '';
    const medicine = this.medicines.find(m => m.id === medicineId);
    return medicine ? medicine.name : '';
  }

  private updateCalendarEvents(): void {
    const calendarEvents = this.events.map(event => ({
      id: event.id?.toString(),
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      backgroundColor: this.getEventColor(event.medicineId),
      extendedProps: {
        description: event.description,
        medicineId: event.medicineId,
        aiSuggestion: event.aiSuggestion
      }
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events: calendarEvents
    };
  }

  private getEventColor(medicineId?: number): string {
    // Return different colors based on medicine
    const colors = ['#3788d8', '#fc6d26', '#7b64ff', '#00d4aa', '#ff6b6b'];
    return colors[(medicineId || 0) % colors.length];
  }

  logout(): void {
    this.authService.logout();
  }
}
