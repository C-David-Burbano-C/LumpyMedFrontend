import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CalendarOptions } from '@fullcalendar/core';
import { CalendarService } from '../../../services/calendar.service';
import { MedicinesService } from '../../../services/medicines.service';
import { AiService } from '../../../services/ai.service';
import { CalendarEvent, CreateEventRequest } from '../../../models/calendar.model';
import { Medicine } from '../../../models/medicine.model';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

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

  constructor(
    private calendarService: CalendarService,
    private medicinesService: MedicinesService,
    private aiService: AiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.loadMedicines();
  }

  loadEvents(): void {
    this.loading = true;
    this.calendarService.getAllEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.updateCalendarEvents();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.snackBar.open('Error al cargar eventos', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadMedicines(): void {
    this.medicinesService.getAll().subscribe({
      next: (response) => {
        this.medicines = response.content;
      },
      error: (error) => {
        console.error('Error loading medicines:', error);
        this.snackBar.open('Error al cargar medicamentos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openCreateEventDialog(): void {
    // TODO: Implement dialog for creating events
    console.log('Open create event dialog');
  }

  handleDateClick(arg: any): void {
    // TODO: Open dialog to create new event on clicked date
    console.log('Date clicked:', arg.dateStr);
  }

  handleEventClick(arg: any): void {
    // TODO: Open dialog to edit/delete event
    console.log('Event clicked:', arg.event);
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
}
