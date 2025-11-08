import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatTooltipModule
  ],
  exports: [
    MatTooltipModule
  ]
})
export class SharedModule { }
