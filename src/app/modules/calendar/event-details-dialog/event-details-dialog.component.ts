import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface EventDetailsData {
  title: string;
  description: string;
  medicineName: string;
  startDate: Date;
  endDate: Date;
  backgroundColor: string;
}

@Component({
  selector: 'app-event-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './event-details-dialog.component.html',
  styleUrl: './event-details-dialog.component.css'
})
export class EventDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EventDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventDetailsData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
