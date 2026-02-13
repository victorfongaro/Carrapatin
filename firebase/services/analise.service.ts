import { Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { vacaRepository } from '../repositories/vaca.repository';
import { AnaliseVaca, Turno } from '../types/vaca.types';

class AnaliseService {
  
  async analisarVaca(
    fazendaId: string,
    vacaId: string,
    data: string,
    turno: Turno
  ): Promise<AnaliseVaca> {
    
    const vaca = await vacaRepository.buscarPorId(fazendaId, vacaId);
    if (!vaca) throw new Error('Vaca não encontrada');
    
    // Simulação de análise
    const quantidadeCarrapatos = Math.floor(Math.random() * 40) + 10;
    const nivelInfestacao = Math.min(100, quantidadeCarrapatos * 1.5);
    
    const analise: AnaliseVaca = {
      id: uuidv4(),
      vacaId,
      fazendaId,
      nivelInfestacao: Math.round(nivelInfestacao),
      quantidadeCarrapatos,
      turno,
      data,
      timestamp: Timestamp.now()
    };
    
    // Atualiza a vaca
    await vacaRepository.atualizar(fazendaId, vacaId, {
      nivelInfestacao: analise.nivelInfestacao,
      ultimaAnalise: Timestamp.now()
    });
    
    return analise;
  }
}

export const analiseService = new AnaliseService();