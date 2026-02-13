export interface DadosClimaticos {
  temperatura: number;
  umidade: number;
  condicao: string;
  vento: number;
  precipitacao: number;
  timestamp: Date;
}

class ClimaService {
  async buscarClimaAtual(): Promise<DadosClimaticos> {
    return {
      temperatura: Math.floor(Math.random() * 10) + 25,
      umidade: Math.floor(Math.random() * 20) + 65,
      condicao: ['Ensolarado', 'Parcialmente Nublado', 'Nublado', 'Chuva Fraca'][Math.floor(Math.random() * 4)],
      vento: Math.floor(Math.random() * 10) + 8,
      precipitacao: Math.floor(Math.random() * 40),
      timestamp: new Date()
    };
  }

  calcularRiscoClimatico(temperatura: number, umidade: number) {
    let fator = 1.0;
    if (temperatura > 28) fator *= 1.3;
    if (umidade > 70) fator *= 1.2;
    
    let nivel = 'Baixo';
    let cor = '#10b981';
    let multiplicador = 1.0;
    
    if (fator > 1.5) {
      nivel = 'Crítico';
      cor = '#ef4444';
      multiplicador = 2.5;
    } else if (fator > 1.3) {
      nivel = 'Alto';
      cor = '#f97316';
      multiplicador = 2.0;
    } else if (fator > 1.1) {
      nivel = 'Médio';
      cor = '#f59e0b';
      multiplicador = 1.5;
    }
    
    return { fator, nivel, cor, multiplicador };
  }
}

export const climaService = new ClimaService();