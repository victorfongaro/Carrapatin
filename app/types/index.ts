// Tipos para Fazendas
export interface Fazenda {
  id: string;
  nome: string;
  risco: number;
  latitude: number;
  longitude: number;
}

// Tipos para Vacas
export interface Vaca {
  id: string;
  nome: string;
  numero: string;
  fotos: {
    manha: string[];
    tarde: string[];
  };
  carrapatosDetectados: number;
  ultimaAnalise: Date | null;
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