import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MedicinesService } from '../../../services/medicines.service';
import { AuthService } from '../../../services/auth.service';
import { Medicine } from '../../../models/medicine.model';
import { MedicineFormComponent } from '../medicine-form/medicine-form.component';

@Component({
  selector: 'app-medicines-list',
  templateUrl: './medicines-list.component.html',
  styleUrls: ['./medicines-list.component.css']
})
export class MedicinesListComponent implements OnInit {
  medicines: Medicine[] = [];
  loading = false;
  errorMessage = '';
  displayedColumns: string[] = ['name', 'description', 'mgKgDay', 'dosesPerDay', 'actions'];

  constructor(
    private medicinesService: MedicinesService,
    private authService: AuthService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadMedicines();
  }

  loadMedicines(): void {
    this.loading = true;
    this.errorMessage = '';
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

  openAddDialog(): void {
    const dialogRef = this.dialog.open(MedicineFormComponent, {
      width: '600px',
      data: { medicine: null }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMedicines();
      }
    });
  }

  openEditDialog(medicine: Medicine): void {
    const dialogRef = this.dialog.open(MedicineFormComponent, {
      width: '600px',
      data: { medicine: { ...medicine } }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMedicines();
      }
    });
  }

  deleteMedicine(medicine: Medicine): void {
    this.translate.get('MEDICINES.DELETE_CONFIRM').subscribe((message: string) => {
      if (confirm(message)) {
        this.medicinesService.delete(medicine.id!).subscribe({
          next: () => {
            this.loadMedicines();
          },
          error: (error) => {
            this.errorMessage = error.message;
          }
        });
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
