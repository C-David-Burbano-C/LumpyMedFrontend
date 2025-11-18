import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { LogoutConfirmationDialogComponent } from './logout-confirmation-dialog/logout-confirmation-dialog.component';

@NgModule({
  declarations: [
    LogoutConfirmationDialogComponent
  ],
  imports: [
    CommonModule,
    MatTooltipModule,
    MatDialogModule
  ],
  exports: [
    MatTooltipModule,
    MatDialogModule
  ]
})
export class SharedModule { }
