import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, startWith, map } from 'rxjs';
import { CalculatorService } from '../../services/calculator.service';
import { MedicinesService } from '../../services/medicines.service';
import { AuthService } from '../../services/auth.service';
import { AiService, MedicalAdviceRequest, AiResponse } from '../../services/ai.service';
import { DoseResponse } from '../../models/dose.model';
import { Medicine } from '../../models/medicine.model';

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
  doseResult: DoseResponse | null = null;
  medicines: Medicine[] = [];
  filteredMedicines$!: Observable<Medicine[]>;
  currentUser: any;
  isAdmin = false;

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
    private translate: TranslateService
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

  initForm(): void {
    this.calculatorForm = this.formBuilder.group({
      medicineName: ['', [Validators.required, Validators.maxLength(20)]],
      weightKg: ['', [Validators.required, Validators.min(0.1), Validators.maxLength(3)]],
      userConcentrationMg: [''],
      userConcentrationMl: ['']
    });

    this.filteredMedicines$ = this.calculatorForm.get('medicineName')!.valueChanges.pipe(
      startWith(''),
      map((value: string | Medicine) => {
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

    const request = {
      medicineName: medicine.name,
      weightKg: formValue.weightKg,
      userConcentrationMg: formValue.userConcentrationMg || medicine.concentrationMg,
      userConcentrationMl: formValue.userConcentrationMl || medicine.concentrationMl
    };

    this.calculatorService.calculateDose(request).subscribe({
      next: (result) => {
        // Fix: Backend returns medicine as string, find the complete medicine object
        if (typeof result.medicine === 'string') {
          const medicineName = result.medicine;
          const completeMedicine = this.medicines.find(m => m.name === medicineName);
          if (completeMedicine) {
            result.medicine = completeMedicine;
          } else {
            // If medicine not found, create a minimal object with the name
            result.medicine = { name: medicineName } as unknown as Medicine;
          }
        }

        this.doseResult = result;
        this.loading = false;

        // Generate AI advice after successful calculation
        this.generateAiAdvice(result);
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  generateAiAdvice(doseResult: DoseResponse): void {
    this.aiLoading = true;
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
        this.aiLoading = false;
      },
      error: (error) => {
        this.aiError = error.message;
        this.aiLoading = false;
      }
    });
  }

  get f() {
    return this.calculatorForm.controls;
  }

  retry(): void {
    this.errorMessage = '';
    this.calculateDose();
  }

  isResultSafe(): boolean {
    if (!this.doseResult) return false;
    return this.doseResult.alert.toLowerCase().includes('dentro');
  }

  logout(): void {
    this.authService.logout();
  }
}
