import { fazendaRepository } from '../repositories/fazenda.repository';
import { vacaRepository } from '../repositories/vaca.repository';
import { Timestamp } from 'firebase/firestore';
import { calcularMultiplicadorHistorico } from './historico.service';

class FazendaService {
  
  async inicializarFazendaPadrao(fazendaId: string): Promise<void> {
    const existente = await fazendaRepository.buscarPorId(fazendaId);
    
    if (!existente) {
      await fazendaRepository.criar({
        nome: 'Fazenda Boa Vista',
        proprietario: 'João Mendes',
        risco: 0,
        multiplicadorHistorico: 1.0,
        latitude: -21.244,
        longitude: -45.147,
        totalVacas: 0
      });
    }
  }
  
  async recalcularRiscoTotal(fazendaId: string): Promise<number> {
    const vacas = await vacaRepository.listarPorFazenda(fazendaId);
    
    if (vacas.length === 0) {
      await fazendaRepository.atualizar(fazendaId, { risco: 0 });
      return 0;
    }
    
    let soma = 0;
    let count = 0;
    
    vacas.forEach(vaca => {
      if (vaca.nivelInfestacao) {
        soma += vaca.nivelInfestacao;
        count++;
      }
    });
    
    const mediaBase = count > 0 ? soma / count : 0;
    const multiplicador = await calcularMultiplicadorHistorico(fazendaId);
    const riscoFinal = Math.min(100, Math.round(mediaBase * multiplicador));
    
    await fazendaRepository.atualizar(fazendaId, {
      risco: riscoFinal,
      updatedAt: Timestamp.now()
    });
    
    return riscoFinal;
  }
}

export const fazendaService = new FazendaService();