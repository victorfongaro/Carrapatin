import { historicoRepository } from '../repositories/historico.repository';

class HistoricoService {
  async alternarDiaContaminacao(fazendaId: string, data: string): Promise<boolean> {
    try {
      const dias = await historicoRepository.listarDiasContaminacao(fazendaId);
      const jaMarcado = dias.includes(data);
      
      if (jaMarcado) {
        await historicoRepository.removerDiaContaminacao(fazendaId, data);
      } else {
        await historicoRepository.marcarDiaContaminacao(fazendaId, data);
      }
      
      return !jaMarcado;
    } catch (error) {
      console.error('Erro:', error);
      return false;
    }
  }

  async listarDiasContaminacao(fazendaId: string): Promise<string[]> {
    return await historicoRepository.listarDiasContaminacao(fazendaId);
  }
}

export const historicoService = new HistoricoService();

export const calcularMultiplicadorHistorico = async (fazendaId: string): Promise<number> => {
  try {
    const dias = await historicoRepository.listarDiasContaminacao(fazendaId);
    const ultimos30Dias = dias.filter(d => {
      const diff = (new Date().getTime() - new Date(d).getTime()) / (1000 * 3600 * 24);
      return diff <= 30;
    }).length;
    
    return 1.0 + (ultimos30Dias * 0.03);
  } catch {
    return 1.0;
  }
};