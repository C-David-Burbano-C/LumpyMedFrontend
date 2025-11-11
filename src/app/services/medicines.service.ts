import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Medicine } from '../models/medicine.model';

@Injectable({
  providedIn: 'root'
})
export class MedicinesService {
  // Datos de ejemplo de medicinas (sin backend)
  private mockMedicines: Medicine[] = [
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

  private nextId = 6;

  constructor() {}

  getAll(): Observable<Medicine[]> {
    // Simular delay de red
    return of([...this.mockMedicines]).pipe(delay(300));
  }

  getById(id: number): Observable<Medicine> {
    const medicine = this.mockMedicines.find(m => m.id === id);
    if (!medicine) {
      throw new Error('Medicina no encontrada');
    }
    return of({ ...medicine }).pipe(delay(200));
  }

  create(medicine: Medicine): Observable<Medicine> {
    const newMedicine = { ...medicine, id: this.nextId++ };
    this.mockMedicines.push(newMedicine);
    return of({ ...newMedicine }).pipe(delay(400));
  }

  update(id: number, medicine: Medicine): Observable<Medicine> {
    const index = this.mockMedicines.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error('Medicina no encontrada');
    }
    this.mockMedicines[index] = { ...medicine, id };
    return of({ ...this.mockMedicines[index] }).pipe(delay(400));
  }

  delete(id: number): Observable<any> {
    const index = this.mockMedicines.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error('Medicina no encontrada');
    }
    this.mockMedicines.splice(index, 1);
    return of({ message: 'Medicina eliminada exitosamente' }).pipe(delay(300));
  }
}
