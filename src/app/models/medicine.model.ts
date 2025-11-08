export interface Medicine {
  id?: number;
  name: string;
  description: string;
  mgKgDay: number;
  dosesPerDay: number;
  concentrationMg: number;
  concentrationMl: number;
  minSafeMl: number;
  maxSafeMl: number;
}
