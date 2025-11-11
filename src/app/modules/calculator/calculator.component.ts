import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, startWith, map } from 'rxjs';
import { CalculatorService } from '../../services/calculator.service';
import { MedicinesService } from '../../services/medicines.service';
import { AuthService } from '../../services/auth.service';
import { DoseResponse } from '../../models/dose.model';
import { Medicine } from '../../models/medicine.model';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
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

  constructor(
    private formBuilder: FormBuilder,
    private calculatorService: CalculatorService,
    private medicinesService: MedicinesService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'ADMIN';
    this.initForm();
    this.loadMedicines();
  }

  initForm(): void {
    this.calculatorForm = this.formBuilder.group({
      medicineName: ['', [Validators.required]],
      weightKg: ['', [Validators.required, Validators.min(0.1)]],
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
        this.medicines = response.content;
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
        this.doseResult = result;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
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
