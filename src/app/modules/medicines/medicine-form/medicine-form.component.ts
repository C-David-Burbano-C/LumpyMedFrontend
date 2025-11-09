import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MedicinesService } from '../../../services/medicines.service';
import { Medicine } from '../../../models/medicine.model';

@Component({
  selector: 'app-medicine-form',
  templateUrl: './medicine-form.component.html',
  styleUrls: ['./medicine-form.component.css']
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
      name: [this.data.medicine?.name || '', [Validators.required]],
      description: [this.data.medicine?.description || '', [Validators.required]],
      mgKgDay: [this.data.medicine?.mgKgDay || '', [Validators.required, Validators.min(0)]],
      dosesPerDay: [this.data.medicine?.dosesPerDay || '', [Validators.required, Validators.min(1)]],
      concentrationMg: [this.data.medicine?.concentrationMg || '', [Validators.required, Validators.min(0)]],
      concentrationMl: [this.data.medicine?.concentrationMl || '', [Validators.required, Validators.min(0)]],
      minSafeMl: [this.data.medicine?.minSafeMl || '', [Validators.required, Validators.min(0)]],
      maxSafeMl: [this.data.medicine?.maxSafeMl || '', [Validators.required, Validators.min(0)]]
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

    const medicineData: Medicine = this.medicineForm.value;

    const request = this.isEditMode
      ? this.medicinesService.update(this.data.medicine!.id!, medicineData)
      : this.medicinesService.create(medicineData);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Error al guardar medicamento.';
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
