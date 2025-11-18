import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MedicinesService } from '../../../services/medicines.service';
import { Medicine, CreateMedicineRequest, UpdateMedicineRequest } from '../../../models/medicine.model';

@Component({
  selector: 'app-medicine-form',
  templateUrl: './medicine-form.component.html',
  styleUrls: ['./medicine-form.component.css'],
  host: { class: 'block' }
})
export class MedicineFormComponent implements OnInit {
  medicineForm!: FormGroup;
  loading = false;
  errorMessage = '';
  isEditMode = false;

  constructor(
    private formBuilder: FormBuilder,
    private medicinesService: MedicinesService,
    public dialogRef: MatDialogRef<MedicineFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { medicine: Medicine | null }
  ) {
    this.isEditMode = !!data.medicine;
  }

  ngOnInit(): void {
    this.medicineForm = this.formBuilder.group({
      name: [this.data.medicine?.name || '', [Validators.required, Validators.maxLength(20)]],
      description: [this.data.medicine?.description || '', [Validators.maxLength(100)]],
      mgKgDay: [this.data.medicine?.mgKgDay || null, [Validators.required, Validators.min(0), Validators.maxLength(4)]],
      dosesPerDay: [this.data.medicine?.dosesPerDay || null, [Validators.required, Validators.min(1), Validators.maxLength(2)]],
      concentrationMg: [this.data.medicine?.concentrationMg || null, [Validators.required, Validators.min(0), Validators.maxLength(4)]],
      concentrationMl: [this.data.medicine?.concentrationMl || null, [Validators.required, Validators.min(0), Validators.maxLength(4)]],
      minSafeMl: [this.data.medicine?.minSafeMl || null, [Validators.required, Validators.min(0), Validators.maxLength(4)]],
      maxSafeMl: [this.data.medicine?.maxSafeMl || null, [Validators.required, Validators.min(0), Validators.maxLength(4)]]
    });
  }

  get f() {
    return this.medicineForm.controls;
  }

  onSubmit(): void {
    if (this.medicineForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    if (this.isEditMode) {
      const updateData: UpdateMedicineRequest = this.medicineForm.value;
      this.medicinesService.update(this.data.medicine!.id!, updateData).subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Error al actualizar medicamento.';
        }
      });
    } else {
      const createData: CreateMedicineRequest = this.medicineForm.value;
      this.medicinesService.create(createData).subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Error al crear medicamento.';
        }
      });
    }
  }

  limitInput(controlName: string, maxLength: number): void {
    const control = this.medicineForm.get(controlName);
    if (control) {
      const value = control.value?.toString() || '';
      if (value.length > maxLength) {
        control.setValue(value.substring(0, maxLength));
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
