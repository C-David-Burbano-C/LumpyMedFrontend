import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CalendarService } from '../../../services/calendar.service';
import { MedicinesService } from '../../../services/medicines.service';
import { AuthService } from '../../../services/auth.service';
import { CreateEventRequest, CalendarEvent } from '../../../models/calendar.model';
import { Medicine } from '../../../models/medicine.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.css'
})
export class EventFormComponent implements OnInit {
  eventForm!: FormGroup;
  loading = false;
  errorMessage = '';
  medicines: Medicine[] = [];
  isEditMode = false;
  selectedDate: Date | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private calendarService: CalendarService,
    private medicinesService: MedicinesService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { event?: CalendarEvent; selectedDate?: Date }
  ) {
    this.isEditMode = !!data.event;
    this.selectedDate = data.selectedDate || null;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadMedicines();
  }

  initForm(): void {
    const currentUser = this.authService.getCurrentUser();
    const startDate = this.selectedDate || new Date();

    this.eventForm = this.formBuilder.group({
      title: [this.data.event?.title || '', [Validators.required]],
      description: [this.data.event?.description || ''],
      startDate: [this.data.event?.startDate ? new Date(this.data.event.startDate) : startDate, [Validators.required]],
      endDate: [this.data.event?.endDate ? new Date(this.data.event.endDate) : new Date(startDate.getTime() + 60 * 60 * 1000), [Validators.required]],
      medicineId: [this.data.event?.medicineId || null, [Validators.required]]
    });
  }

  loadMedicines(): void {
    this.medicinesService.getAll().subscribe({
      next: (response) => {
        this.medicines = Array.isArray(response) ? response : [];
      },
      error: (error) => {
        // Error loading medicines - silently handle
      }
    });
  }

  get f() {
    return this.eventForm.controls;
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.eventForm.value;
    const currentUser = this.authService.getCurrentUser();

    const eventData: CreateEventRequest = {
      title: formValue.title,
      description: formValue.description,
      startDate: formValue.startDate.toISOString(),
      endDate: formValue.endDate.toISOString(),
      medicineId: formValue.medicineId,
      userId: currentUser?.id || 1
    };

    this.calendarService.createEvent(eventData).subscribe({
      next: (event) => {
        this.loading = false;
        this.dialogRef.close(event);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Error al crear evento.';
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
