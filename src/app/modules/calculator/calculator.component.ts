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
  filteredMedicines!: Observable<Medicine[]>;
  currentUser: any;

  constructor(
    private formBuilder: FormBuilder,
    private calculatorService: CalculatorService,
    private medicinesService: MedicinesService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
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

    this.filteredMedicines = this.calculatorForm.get('medicineName')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterMedicines(value || ''))
    );
  }

  loadMedicines(): void {
    this.loading = true;
    this.medicinesService.getAll().subscribe({
      next: (data) => {
        this.medicines = data;
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

  onSubmit(): void {
    if (this.calculatorForm.invalid) {
      return;
    }

    this.calculating = true;
    this.errorMessage = '';
    this.doseResult = null;

    const formValue = this.calculatorForm.value;
    const medicineName = typeof formValue.medicineName === 'string' 
      ? formValue.medicineName 
      : formValue.medicineName.name;

    const request = {
      medicineName: medicineName,
      weightKg: formValue.weightKg,
      userConcentrationMg: formValue.userConcentrationMg || undefined,
      userConcentrationMl: formValue.userConcentrationMl || undefined
    };

    this.calculatorService.calculateDose(request).subscribe({
      next: (result) => {
        this.doseResult = result;
        this.calculating = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.calculating = false;
      }
    });
  }

  retry(): void {
    this.errorMessage = '';
    this.onSubmit();
  }

  isResultSafe(): boolean {
    if (!this.doseResult) return false;
    return this.doseResult.alert.toLowerCase().includes('dentro');
  }

  logout(): void {
    this.authService.logout();
  }
}
