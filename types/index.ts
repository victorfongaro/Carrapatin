// Tipos para Fazendas
export interface Fazenda {
  id: string;
  nome: string;
  risco: number;
  latitude: number;
  longitude: number;
  ultimaAtualizacao?: string;
  vacas?: number;
  area?: string;
  contato?: string;
}

export interface Vaca {
  id: string;
  nome: string;
  brinco: string;
  fotos?: {
    esquerda?: string;
    direita?: string;
    entrePerdas?: string;
  };
  ultimaAnalise?: Date;
  nivelInfestacao?: number;
}
export interface VacaState {
  selectedVaca: Vaca | null;
  vacas: Vaca[];
  fotos: {
    esquerda: string | null;
    direita: string | null;
    entrePerdas: string | null;
  };
}
// Tipos para Resultado da IA
export interface ResultadoAnalise {
  larvas: number;
  ninfas: number;
  carrapatos: number;
}

// Tipos para Props
export interface DashboardProps {
  risco: number;
  onRiscoChange: (novoRisco: number) => void;
}

export interface CameraVacasProps {
  risco: number;
  onRiscoChange: (novoRisco: number) => void;
}

export interface HistoricoProps {
  multiplicador: number;
  onMultiplicadorChange: (valor: number) => void;
  onRiscoChange: (novoRisco: number) => void;
}