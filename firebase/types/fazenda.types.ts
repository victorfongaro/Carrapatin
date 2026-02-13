import { Timestamp } from 'firebase/firestore';

export interface Fazenda {
  id: string;
  nome: string;
  proprietario: string;
  risco: number;
  multiplicadorHistorico: number;
  latitude: number;
  longitude: number;
  totalVacas: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}