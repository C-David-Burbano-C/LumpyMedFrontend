import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CalendarService } from '../../../services/calendar.service';
import { MedicinesService } from '../../../services/medicines.service';
import { AuthService } from '../../../services/auth.service';
import { CreateEventRequest, CalendarEvent } from '../../../models/calendar.model';
import { Medicine } from '../../../models/medicine.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDateRangePicker, MatDateRangeInput } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, startWith, map, of } from 'rxjs';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTooltipModule,
    MatDateRangePicker,
    MatDateRangeInput
  ],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.css'
})
export class EventFormComponent implements OnInit {
  eventForm!: FormGroup;
  loading = false;
  errorMessage = '';
  medicines: Medicine[] = [];
  filteredMedicines$!: Observable<Medicine[]>;
  selectedMedicines: Medicine[] = [];
  searchText = ''; // Texto actual del campo de búsqueda
  isEditMode = false;
  selectedDate: Date | null = null;
  minDate: Date = new Date();

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

  // Validador personalizado para no permitir solo espacios en blanco
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const value = control.value.toString().trim();
    if (value.length === 0) {
      return { whitespace: true };
    }
    
    return null;
  }

  // Validador personalizado para rango de fechas: end debe ser posterior a start
  dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('start')?.value;
    const end = control.get('end')?.value;

    if (!start || !end) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      return { dateRangeInvalid: true };
    }

    return null;
  }

  // Validador personalizado para fechas futuras: no permitir fechas anteriores a hoy
  futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (selectedDate < today) {
      return { pastDate: true };
    }

    return null;
  }

  initForm(): void {
    const currentUser = this.authService.getCurrentUser();
    const startDate = this.selectedDate || new Date();

    this.eventForm = this.formBuilder.group({
      title: [this.data.event?.title || '', [Validators.required, this.noWhitespaceValidator, Validators.maxLength(50)]],
      description: [this.data.event?.description || '', [Validators.maxLength(200), this.noWhitespaceValidator]],
      dateRange: this.formBuilder.group({
        start: [this.data.event?.startDate ? new Date(this.data.event.startDate) : startDate, [Validators.required, this.futureDateValidator]],
        end: [this.data.event?.endDate ? new Date(this.data.event.endDate) : new Date(startDate.getTime() + 60 * 60 * 1000), [Validators.required, this.futureDateValidator]]
      }, { validators: this.dateRangeValidator })
    });

    // Inicializar medicamentos seleccionados si estamos editando
    if (this.data.event) {
      const medicine = this._findMedicineById(this.data.event.medicineId);
      if (medicine) {
        this.selectedMedicines = [medicine];
      }
    }

    // El filtrado se configura después de cargar los medicamentos
  }

  loadMedicines(): void {
    this.medicinesService.getAll(0, 1000).subscribe({
      next: (response) => {
        this.medicines = Array.isArray(response) ? response : response.content || [];
        // Una vez cargados los medicamentos, configurar el filtrado
        this.setupMedicineFiltering();
      },
      error: (error) => {
        // Error loading medicines - silently handle
      }
    });
  }

  setupMedicineFiltering(): void {
    // Configurar el filtrado inicial
    this.updateFilteredMedicines();
  }

  get f() {
    return this.eventForm.controls;
  }

  get dateRangeFormGroup(): FormGroup {
    return this.eventForm.get('dateRange') as FormGroup;
  }

  get isFormValid(): boolean {
    // Verificar validación del formulario
    if (this.eventForm.invalid) return false;

    // Verificar selección de medicamentos
    if (this.selectedMedicines.length === 0) return false;

    // Verificar validación de rango de fechas
    const dateRange = this.eventForm.get('dateRange');
    if (dateRange?.invalid) return false;

    return true;
  }

  private _findMedicineById(medicineId: number): Medicine | null {
    return this.medicines.find(medicine => medicine.id === medicineId) || null;
  }

  private _filterMedicines(value: string): Medicine[] {
    const filterValue = value.toLowerCase().trim();

    if (!filterValue) {
      return this.medicines.slice(); // Retornar todos si no hay filtro
    }

    // Separar medicamentos que empiecen con el filtro vs los que lo contengan
    const startsWithMatches = this.medicines.filter(medicine =>
      medicine.name.toLowerCase().startsWith(filterValue)
    );

    const containsMatches = this.medicines.filter(medicine =>
      !medicine.name.toLowerCase().startsWith(filterValue) &&
      medicine.name.toLowerCase().includes(filterValue)
    );

    // Combinar resultados: primero los que empiecen con el filtro, luego los que lo contengan
    return [...startsWithMatches, ...containsMatches];
  }

  displayMedicine(medicine: Medicine): string {
    return medicine ? medicine.name : '';
  }

  addMedicine(medicine: Medicine): void {
    if (medicine && !this.selectedMedicines.find(m => m.id === medicine.id)) {
      this.selectedMedicines.push(medicine);
      // Limpiar el campo de búsqueda después de seleccionar
      this.searchText = '';
      // Actualizar el filtrado con lista completa
      this.updateFilteredMedicines();
    }
  }

  onSearchTextChange(): void {
    this.updateFilteredMedicines();
  }

  private updateFilteredMedicines(): void {
    this.filteredMedicines$ = of(this.searchText).pipe(
      map(value => this._filterMedicines(value || ''))
    );
  }

  removeMedicine(index: number): void {
    this.selectedMedicines.splice(index, 1);
  }

  onSubmit(): void {
    // Forzar validación de todos los campos
    Object.keys(this.eventForm.controls).forEach(key => {
      const control = this.eventForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();

      // Si es el grupo de rango de fechas, validar sus controles internos
      if (key === 'dateRange' && control instanceof FormGroup) {
        Object.keys(control.controls).forEach(subKey => {
          control.get(subKey)?.markAsTouched();
          control.get(subKey)?.updateValueAndValidity();
        });
      }
    });

    // Validación adicional para rango de fechas
    const dateRange = this.eventForm.get('dateRange');
    if (dateRange?.invalid) {
      this.errorMessage = 'La fecha de fin debe ser posterior a la fecha de inicio';
      return;
    }

    if (this.eventForm.invalid || this.selectedMedicines.length === 0) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.eventForm.controls).forEach(key => {
        this.eventForm.get(key)?.markAsTouched();
      });
      if (this.selectedMedicines.length === 0) {
        this.errorMessage = 'Debe seleccionar al menos un medicamento';
      }
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.eventForm.value;
    const currentUser = this.authService.getCurrentUser();

    // Crear un evento por cada medicamento seleccionado
    const eventPromises = this.selectedMedicines.map(medicine => {
      if (!medicine.id) {
        throw new Error(`Medicamento ${medicine.name} no tiene ID válido`);
      }

      const eventData: CreateEventRequest = {
        title: formValue.title.trim(),
        description: formValue.description?.trim() || '',
        startDate: formValue.dateRange.start.toISOString(),
        endDate: formValue.dateRange.end.toISOString(),
        medicineId: medicine.id,
        userId: currentUser?.id || 1
      };

      return this.calendarService.createEvent(eventData).toPromise();
    });

    // Ejecutar todas las creaciones de eventos
    Promise.all(eventPromises)
      .then((events) => {
        this.loading = false;
        this.dialogRef.close(events);
      })
      .catch((error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Error al crear eventos.';
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
