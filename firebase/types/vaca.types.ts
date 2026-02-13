import { Timestamp } from 'firebase/firestore';

export type PosicaoFoto = 'esquerda' | 'direita' | 'entrePerdas';
export type Turno = 'manha' | 'tarde';

export interface Vaca {
  id: string;
  fazendaId: string;
  brinco: string;
  nome?: string;
  fotos: {
    esquerda?: string | null;
    direita?: string | null;
    entrePerdas?: string | null;
  };
  nivelInfestacao: number;
  ultimaAnalise?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NovaVaca {
  brinco: string;
  nome?: string;
}

export interface FotoMetadata {
  url: string;
  storagePath: string;
  filename: string;
  timestamp: number;
  uploadedAt: Timestamp;
  turno: Turno;
  data: string;
}

export interface AnaliseVaca {
  id: string;
  vacaId: string;
  fazendaId: string;
  nivelInfestacao: number;
  quantidadeCarrapatos: number;
  turno: Turno;
  data: string;
  timestamp: Timestamp;
}