import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DoseHistoryItem } from '../../../models/dose.model';
import { AuthService } from '../../../services/auth.service';
import { CalculatorService } from '../../../services/calculator.service';
import { MobileSidebarComponent } from '../../../shared/mobile-sidebar/mobile-sidebar.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, MobileSidebarComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  doseHistory: DoseHistoryItem[] = [];
  showHistory = true; // Always show history in dedicated page
  currentUser: any;
  isAdmin = false;
  loading = false;
  errorMessage = '';
  isSidebarOpen = false;
  isSidebarHovered = false;

  constructor(
    private authService: AuthService,
    private calculatorService: CalculatorService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'ADMIN';
    this.loadDoseHistory();
  }

  loadDoseHistory(): void {
    this.loading = true;
    this.errorMessage = '';

    this.calculatorService.getHistory().subscribe({
      next: (history) => {
        this.doseHistory = history || [];
        // Sort by creation date (most recent first) - aunque la API ya lo ordena
        this.doseHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al cargar el historial';
        this.doseHistory = [];
        this.loading = false;
      }
    });
  }

  // History helper methods
  getSafeConsultationsCount(): number {
    return this.doseHistory.filter(h => h.alert.toLowerCase().includes('dentro')).length;
  }

  getAlertConsultationsCount(): number {
    return this.doseHistory.filter(h => !h.alert.toLowerCase().includes('dentro')).length;
  }

  trackByHistoryId(index: number, item: DoseHistoryItem): number {
    return item.id;
  }

  retry(): void {
    this.loadDoseHistory();
  }

  showHistoryInfo(): void {
    alert('El historial se gestiona automáticamente en el servidor. Los cálculos antiguos se mantienen por razones de auditoría médica y no pueden ser eliminados.');
  }

  exportToExcel(): void {
    if (this.doseHistory.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    // Preparar los datos para Excel
    const excelData = this.doseHistory.map(item => ({
      'ID': item.id,
      'Medicamento': item.medicine,
      'Peso (kg)': item.weightKg,
      'Fecha y Hora': new Date(item.createdAt).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      'Alerta': item.alert,
      'Rango Seguro': item.safeRange,
      'mg/día': item.mgPerDay,
      'Dosis/día': item.dosesPerDay,
      'mg/toma': item.mgPerDose,
      'ml/toma': item.mlPerDose,
      'Estado': item.alert.toLowerCase().includes('dentro') ? 'Seguro' : 'Con Alerta'
    }));

    // Crear el libro de trabajo
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);

    // Configurar el ancho de las columnas
    const colWidths = [
      { wch: 8 },  // ID
      { wch: 25 }, // Medicamento
      { wch: 12 }, // Peso
      { wch: 20 }, // Fecha y Hora
      { wch: 40 }, // Alerta
      { wch: 30 }, // Rango Seguro
      { wch: 12 }, // mg/día
      { wch: 12 }, // Dosis/día
      { wch: 12 }, // mg/toma
      { wch: 12 }, // ml/toma
      { wch: 15 }  // Estado
    ];
    ws['!cols'] = colWidths;

    // Crear el libro y agregar la hoja
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial de Consultas');

    // Agregar información adicional en otra hoja
    const summaryData = [
      { 'Métrica': 'Total de Consultas', 'Valor': this.doseHistory.length },
      { 'Métrica': 'Consultas Seguras', 'Valor': this.getSafeConsultationsCount() },
      { 'Métrica': 'Consultas con Alerta', 'Valor': this.getAlertConsultationsCount() },
      { 'Métrica': 'Fecha de Exportación', 'Valor': new Date().toLocaleString('es-ES') },
      { 'Métrica': 'Usuario', 'Valor': this.currentUser?.username || 'N/A' }
    ];

    const wsSummary: XLSX.WorkSheet = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 25 }, // Métrica
      { wch: 15 }  // Valor
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    // Generar el nombre del archivo con fecha
    const fileName = `historial_consultas_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  }

  // Sidebar methods
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  onSidebarLogout(): void {
    this.closeSidebar();
    this.logout();
  }

  onSidebarHoverChange(isHovered: boolean): void {
    this.isSidebarHovered = isHovered;
  }

  logout(): void {
    this.authService.logout();
  }
}
