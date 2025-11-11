import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DoseRequest, DoseResponse } from '../models/dose.model';
import { Medicine } from '../models/medicine.model';

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {
  // Base de datos de medicinas para cálculos (debe coincidir con MedicinesService)
  private medicines: Medicine[] = [
    {
      id: 1,
      name: 'Paracetamol',
      description: 'Analgésico y antipirético',
      mgKgDay: 15,
      dosesPerDay: 3,
      concentrationMg: 100,
      concentrationMl: 1,
      minSafeMl: 0.5,
      maxSafeMl: 5
    },
    {
      id: 2,
      name: 'Ibuprofeno',
      description: 'Antiinflamatorio no esteroideo',
      mgKgDay: 10,
      dosesPerDay: 3,
      concentrationMg: 100,
      concentrationMl: 1,
      minSafeMl: 0.3,
      maxSafeMl: 4
    },
    {
      id: 3,
      name: 'Amoxicilina',
      description: 'Antibiótico de amplio espectro',
      mgKgDay: 20,
      dosesPerDay: 2,
      concentrationMg: 250,
      concentrationMl: 5,
      minSafeMl: 1,
      maxSafeMl: 10
    },
    {
      id: 4,
      name: 'Cetirizina',
      description: 'Antihistamínico',
      mgKgDay: 0.25,
      dosesPerDay: 1,
      concentrationMg: 1,
      concentrationMl: 1,
      minSafeMl: 2.5,
      maxSafeMl: 10
    },
    {
      id: 5,
      name: 'Salbutamol',
      description: 'Broncodilatador',
      mgKgDay: 0.1,
      dosesPerDay: 4,
      concentrationMg: 2,
      concentrationMl: 5,
      minSafeMl: 0.5,
      maxSafeMl: 2.5
    }
  ];

  constructor() {}

  calculateDose(request: DoseRequest): Observable<DoseResponse> {
    // Buscar la medicina en la base de datos mock
    const medicine = this.medicines.find(
      m => m.name.toLowerCase() === request.medicineName.toLowerCase()
    );

    if (!medicine) {
      throw new Error('Medicina no encontrada');
    }

    // Usar concentración del usuario o la predeterminada
    const concentrationMg = request.userConcentrationMg || medicine.concentrationMg;
    const concentrationMl = request.userConcentrationMl || medicine.concentrationMl;

    // Cálculos de dosis
    const mgPerDay = medicine.mgKgDay * request.weightKg;
    const mgPerDose = mgPerDay / medicine.dosesPerDay;
    const mlPerDose = (mgPerDose * concentrationMl) / concentrationMg;

    // Determinar alerta de seguridad
    let alert = 'SEGURA';
    if (mlPerDose < medicine.minSafeMl) {
      alert = 'DOSIS BAJA - Verificar con médico';
    } else if (mlPerDose > medicine.maxSafeMl) {
      alert = 'DOSIS ALTA - Verificar con médico';
    }

    const response: DoseResponse = {
      medicine,
      weightKg: request.weightKg,
      mgPerDay: parseFloat(mgPerDay.toFixed(2)),
      dosesPerDay: medicine.dosesPerDay,
      mgPerDose: parseFloat(mgPerDose.toFixed(2)),
      mlPerDose: parseFloat(mlPerDose.toFixed(2)),
      alert,
      safeRange: `${medicine.minSafeMl} - ${medicine.maxSafeMl} ml`
    };

    // Simular delay de red
    return of(response).pipe(delay(400));
  }
}
