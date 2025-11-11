import { Component } from '@angular/core';
import { MedicineSelectionService } from '../../../services/medicine-selection.service';

@Component({
  selector: 'app-medicine-selections-table',
  template: `
    <div class="modern-card mt-8" *ngIf="(selections$ | async) as selections">
      <div *ngIf="selections.length > 0">
        <h3 class="text-xl font-bold text-text-primary mb-4">Medicamentos Seleccionados</h3>
        
        <div class="overflow-x-auto">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dosaje</th>
                <th>Concentración</th>
                <th>Presentación</th>
                <th class="text-center">Cantidad</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let selection of selections">
                <td class="font-medium text-text-primary">{{ selection.medicineName }}</td>
                <td class="text-text-secondary">{{ selection.dosage }}</td>
                <td class="text-text-secondary">{{ selection.concentration }}</td>
                <td class="text-text-secondary">{{ selection.presentation }}</td>
                <td class="text-center">
                  <span class="badge-primary">{{ selection.quantity }}</span>
                </td>
                <td class="text-right">
                  <button 
                    (click)="removeSelection(selection.medicineId)"
                    class="p-2 bg-dark-elevated hover:bg-accent-danger/10 border border-dark-border hover:border-accent-danger/30 rounded-lg transition-all inline-block">
                    <svg class="w-4 h-4 text-accent-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 p-4 bg-dark-elevated rounded-lg border border-dark-border flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Total de medicamentos seleccionados</p>
            <p class="text-2xl font-bold gradient-text">{{ selections.length }}</p>
          </div>
          <button 
            (click)="clearAllSelections()"
            class="modern-btn-danger">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Limpiar todos
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MedicineSelectionsTableComponent {
  selections$ = this.medicineSelectionService.medicineSelections$;

  constructor(private medicineSelectionService: MedicineSelectionService) {}

  removeSelection(medicineId: number): void {
    this.medicineSelectionService.removeSelection(medicineId);
  }

  clearAllSelections(): void {
    if (confirm('¿Estás seguro de que deseas limpiar todos los medicamentos seleccionados?')) {
      this.medicineSelectionService.clearAllSelections();
    }
  }
}
