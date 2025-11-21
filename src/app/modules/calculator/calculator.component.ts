import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, startWith, map } from 'rxjs';
import { CalculatorService } from '../../services/calculator.service';
import { MedicinesService } from '../../services/medicines.service';
import { AuthService } from '../../services/auth.service';
import { AiService, MedicalAdviceRequest, AiResponse } from '../../services/ai.service';
import { DoseResult } from '../../models/dose.model';
import { Medicine } from '../../models/medicine.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css'],
  host: { class: 'block' }
})
export class CalculatorComponent implements OnInit {
  calculatorForm!: FormGroup;
  loading = false;
  calculating = false;
  errorMessage = '';
  doseResult: DoseResult | null = null;
  medicines: Medicine[] = [];
  filteredMedicines$!: Observable<Medicine[]>;
  selectedMedicine: Medicine | null = null;
  currentUser: any;
  isAdmin = false;
  isSidebarOpen = false;
  isSidebarHovered = false;

  // AI Advice properties
  aiAdvice: AiResponse | null = null;
  aiLoading = false;
  aiError = '';

  constructor(
    private formBuilder: FormBuilder,
    private calculatorService: CalculatorService,
    private medicinesService: MedicinesService,
    private authService: AuthService,
    private aiService: AiService,
    private translate: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'ADMIN';
    this.initForm();
    this.loadMedicines();
  }

  // Validador personalizado para máximo 4 dígitos
  maxDigitsValidator(maxDigits: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const value = control.value.toString();
      const integerPart = value.split('.')[0];
      
      if (integerPart.length > maxDigits) {
        return { maxDigits: { requiredDigits: maxDigits, actualDigits: integerPart.length } };
      }
      
      return null;
    };
  }

  // Validador condicional: si uno de los campos de concentración tiene valor, el otro es obligatorio
  conditionalConcentrationValidator(control: AbstractControl): ValidationErrors | null {
    const mg = control.get('userConcentrationMg')?.value;
    const ml = control.get('userConcentrationMl')?.value;

    const mgHasValue = mg !== null && mg !== undefined && mg !== '';
    const mlHasValue = ml !== null && ml !== undefined && ml !== '';

    if (mgHasValue && !mlHasValue) {
      return { concentrationMlRequired: true };
    }
    if (mlHasValue && !mgHasValue) {
      return { concentrationMgRequired: true };
    }

    return null;
  }

  initForm(): void {
    this.calculatorForm = this.formBuilder.group({
      medicineName: ['', [Validators.required, Validators.maxLength(20)]],
      weightKg: ['', [Validators.required, Validators.min(0.1), Validators.max(30), Validators.maxLength(2)]],
      userConcentrationMg: ['', [Validators.maxLength(5)]],
      userConcentrationMl: ['', [Validators.maxLength(5)]]
    }, { validators: this.conditionalConcentrationValidator });

    this.filteredMedicines$ = this.calculatorForm.get('medicineName')!.valueChanges.pipe(
      startWith(''),
      map((value: string | Medicine) => {
        // Si es un objeto Medicine (seleccionado), actualizar selectedMedicine
        if (typeof value === 'object' && value && value.name) {
          this.selectedMedicine = value;
        } else if (typeof value === 'string' && value === '') {
          // Si se borra el campo, limpiar selectedMedicine
          this.selectedMedicine = null;
        }
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterMedicines(name) : this.medicines.slice();
      })
    );
  }

  loadMedicines(): void {
    this.loading = true;
    this.medicinesService.getAll().subscribe({
      next: (response) => {
        // Backend returns array directly, not wrapped in object
        this.medicines = Array.isArray(response) ? response : [];
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  private _filterMedicines(value: string): Medicine[] {
    const filterValue = value.toLowerCase();
    // Verificar que medicines esté inicializado
    if (!this.medicines || !Array.isArray(this.medicines)) {
      return [];
    }
    return this.medicines.filter(medicine => 
      medicine.name.toLowerCase().includes(filterValue)
    );
  }

  displayMedicine(medicine: Medicine): string {
    return medicine ? medicine.name : '';
  }

  calculateDose(): void {
    if (this.calculatorForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.doseResult = null;

    const formValue = this.calculatorForm.value;
    const medicine = typeof formValue.medicineName === 'object' ? formValue.medicineName : null;

    if (!medicine || !medicine.name) {
      this.errorMessage = 'Por favor selecciona un medicamento válido';
      this.loading = false;
      return;
    }

    const request: any = {
      medicineName: medicine.name,
      weightKg: formValue.weightKg
    };

    // Solo agregar concentración personalizada si se especificó
    if (formValue.userConcentrationMg && (typeof formValue.userConcentrationMg === 'string' && formValue.userConcentrationMg.trim() !== '') || (typeof formValue.userConcentrationMg === 'number' && formValue.userConcentrationMg > 0)) {
      request.userConcentrationMg = parseFloat(formValue.userConcentrationMg.toString());
    }
    if (formValue.userConcentrationMl && (typeof formValue.userConcentrationMl === 'string' && formValue.userConcentrationMl.trim() !== '') || (typeof formValue.userConcentrationMl === 'number' && formValue.userConcentrationMl > 0)) {
      request.userConcentrationMl = parseFloat(formValue.userConcentrationMl.toString());
    }

    this.calculatorService.calculateDose(request).subscribe({
      next: (result) => {
        // Backend returns medicine as string, find the complete medicine object for display
        const medicineName = result.medicine;
        const completeMedicine = this.medicines.find(m => m.name === medicineName);
        if (completeMedicine) {
          // Create a display object that combines the result with medicine details
          this.doseResult = {
            ...result,
            medicine: completeMedicine // Use complete medicine object for display
          };
        } else {
          // If medicine not found, create a minimal object with the name
          this.doseResult = {
            ...result,
            medicine: { name: medicineName } as Medicine
          };
        }

        this.loading = false;

        // Generate AI advice after successful calculation (async, non-blocking)
        this.generateAiAdvice(this.doseResult);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al calcular la dosis';
        this.loading = false;
      }
    });
  }

  generateAiAdvice(doseResult: DoseResult): void {
    // Don't show loading state for AI advice to avoid blocking UI
    this.aiError = '';
    this.aiAdvice = null;

    const adviceRequest: MedicalAdviceRequest = {
      medicineName: doseResult.medicine?.name || 'Medicamento desconocido',
      patientWeight: doseResult.weightKg,
      dailyDose: doseResult.mgPerDay,
      dosesPerDay: doseResult.dosesPerDay,
      dosePerAdministration: doseResult.mgPerDose,
      volumePerDose: doseResult.mlPerDose,
      safeRange: doseResult.safeRange,
      alert: doseResult.alert,
      medicineDescription: doseResult.medicine?.description
    };

    this.aiService.generateMedicalAdvice(adviceRequest).subscribe({
      next: (advice) => {
        this.aiAdvice = advice;
      },
      error: (error) => {
        // Silently handle AI errors - don't show to user or block functionality
        this.aiAdvice = null;
      }
    });
  }

  get f() {
    return this.calculatorForm.controls;
  }

  limitInput(controlName: string, maxLength: number): void {
    const control = this.calculatorForm.get(controlName);
    if (control) {
      const value = control.value?.toString() || '';
      if (value.length > maxLength) {
        control.setValue(value.substring(0, maxLength));
      }
    }
  }

  retry(): void {
    this.errorMessage = '';
    this.calculateDose();
  }

  isResultSafe(): boolean {
    if (!this.doseResult) return false;
    return this.doseResult.alert.toLowerCase().includes('dentro');
  }

  get formValue() {
    return this.calculatorForm.value;
  }

  // Sidebar methods
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  onSidebarLogout(): void {
    this.closeSidebar();
    this.logout();
  }

  onSidebarHoverChange(isHovered: boolean): void {
    this.isSidebarHovered = isHovered;
  }

  logout(): void {
    this.authService.logout();
  }
}
