import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  increment,
  Timestamp, 
  setDoc
} from 'firebase/firestore';

// ===========================================
// 1. SERVIÇO DE RISCO E CONTAMINAÇÃO
// ===========================================

export const carregarRiscoFazenda = async (fazendaId: string) => {
  try {
    const docRef = doc(db, 'fazendas', fazendaId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        risco: docSnap.data().risco || 0,
        multiplicador: docSnap.data().multiplicadorHistorico || 1.0,
        ultimaAtualizacao: docSnap.data().ultimaAtualizacao || new Date()
      };
    }
    return { risco: 0, multiplicador: 1.0, ultimaAtualizacao: new Date() };
  } catch (error) {
    console.error('Erro ao carregar risco:', error);
    return { risco: 0, multiplicador: 1.0, ultimaAtualizacao: new Date() };
  }
};

export const atualizarRisco = async (fazendaId: string, novoRisco: number) => {
  try {
    const docRef = doc(db, 'fazendas', fazendaId);
    await updateDoc(docRef, {
      risco: novoRisco,
      ultimaAtualizacao: new Date()
    });
    console.log('✅ Risco atualizado:', novoRisco);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar risco:', error);
    return false;
  }
};

// ===========================================
// 2. SERVIÇO DE HISTÓRICO DE INFESTAÇÃO
// ===========================================

export const carregarHistoricoInfestacao = async (fazendaId: string) => {
  try {
    const historicoRef = collection(db, 'fazendas', fazendaId, 'historico');
    const q = query(historicoRef, orderBy('data', 'desc'), limit(12));
    const querySnapshot = await getDocs(q);
    
    const historico: any[] = [];
    querySnapshot.forEach((doc) => {
      historico.push({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data?.toDate?.() || new Date()
      });
    });
    
    return historico;
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    return [];
  }
};

// ===========================================
// 3. SERVIÇO DE PRODUTORES PRÓXIMOS
// ===========================================

export const carregarProdutoresProximos = async (latitude: number, longitude: number) => {
  try {
    // Busca todas as fazendas
    const fazendasRef = collection(db, 'fazendas');
    const querySnapshot = await getDocs(fazendasRef);
    
    const produtores: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      produtores.push({
        id: doc.id,
        nome: data.nome || 'Fazenda sem nome',
        risco: data.risco || Math.floor(Math.random() * 100),
        latitude: data.latitude || -21.244,
        longitude: data.longitude || -45.147,
        ultimaAtualizacao: data.ultimaAtualizacao?.toDate?.() || new Date(),
        vacas: data.totalVacas || Math.floor(Math.random() * 200) + 50,
        area: data.area || `${Math.floor(Math.random() * 500) + 100} ha`,
        contato: data.contato || '(35) 9xxxx-xxxx'
      });
    });
    
    return produtores;
  } catch (error) {
    console.error('Erro ao carregar produtores:', error);
    return [];
  }
};

// ===========================================
// 4. SERVIÇO DE DADOS CLIMÁTICOS (MOCK POR ENQUANTO)
// ===========================================

// SIMULAÇÃO - Depois você substitui por API real
export const carregarDadosClimaticos = async () => {
  // Simulação de dados climáticos
  const hora = new Date().getHours();
  
  // Dados variam conforme horário para parecer real
  return {
    temperatura: Math.floor(Math.random() * 10) + 25, // 25-35°C
    umidade: Math.floor(Math.random() * 30) + 60, // 60-90%
    condicao: ['Ensolarado', 'Parcialmente Nublado', 'Nublado', 'Chuva'][Math.floor(Math.random() * 4)],
    vento: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
    precipitacao: Math.floor(Math.random() * 60), // 0-60%
    alerta: Math.random() > 0.5
  };
};

// ===========================================
// 5. SERVIÇO DE CÁLCULO DE RISCO CLIMÁTICO
// ===========================================

export const calcularRiscoClimatico = (temperatura: number, umidade: number) => {
  // Fórmula baseada em condições ideais para carrapatos
  // Temperatura ideal: 25-35°C
  // Umidade ideal: >70%
  
  let fatorTemperatura = 0;
  if (temperatura < 15) fatorTemperatura = 0.2;
  else if (temperatura < 20) fatorTemperatura = 0.4;
  else if (temperatura < 25) fatorTemperatura = 0.7;
  else if (temperatura < 30) fatorTemperatura = 1.0;
  else if (temperatura < 35) fatorTemperatura = 1.2;
  else fatorTemperatura = 1.0;
  
  let fatorUmidade = 0;
  if (umidade < 40) fatorUmidade = 0.3;
  else if (umidade < 60) fatorUmidade = 0.6;
  else if (umidade < 70) fatorUmidade = 0.8;
  else if (umidade < 80) fatorUmidade = 1.0;
  else fatorUmidade = 1.1;
  
  const fatorCombinado = fatorTemperatura * fatorUmidade;
  
  let nivel = 'Baixo';
  let cor = '#10b981';
  let multiplicador = 1.0;
  
  if (fatorCombinado > 1.5) {
    nivel = 'Crítico';
    cor = '#ef4444';
    multiplicador = 3.5;
  } else if (fatorCombinado > 1.2) {
    nivel = 'Alto';
    cor = '#f97316';
    multiplicador = 2.5;
  } else if (fatorCombinado > 0.9) {
    nivel = 'Médio';
    cor = '#f59e0b';
    multiplicador = 1.5;
  }
  
  return {
    fatorCombinado,
    nivel,
    cor,
    multiplicador,
    mensagem: getMensagemAlerta(temperatura, umidade, fatorCombinado)
  };
};

const getMensagemAlerta = (temp: number, umid: number, fator: number) => {
  if (fator > 1.5) return `🚨 Alerta Máximo! Calor (${temp}°C) e umidade (${umid}%) criam ambiente ideal para proliferação`;
  if (fator > 1.2) return `⚠️ Atenção! Condições climáticas favorecem reprodução dos carrapatos`;
  if (fator > 0.9) return `📊 Risco moderado. Monitore suas pastagens`;
  return `✅ Condições controladas. Mantenha o monitoramento`;
};

// ===========================================
// 6. SERVIÇO PARA INICIALIZAR DADOS DE TESTE
// ===========================================

export const inicializarDadosTeste = async () => {
  const fazendasTeste = [
    {
      id: 'fazenda-boa-vista',
      nome: 'Fazenda Boa Vista',
      risco: 78,
      latitude: -21.24,
      longitude: -45.15,
      totalVacas: 145,
      area: '320 ha',
      contato: '(35) 98888-1111',
      ultimaAtualizacao: new Date()
    },
    {
      id: 'sitio-esperanca',
      nome: 'Sítio Esperança',
      risco: 92,
      latitude: -21.25,
      longitude: -45.16,
      totalVacas: 78,
      area: '180 ha',
      contato: '(35) 98888-2222',
      ultimaAtualizacao: new Date()
    },
    {
      id: 'fazenda-santa-fe',
      nome: 'Fazenda Santa Fé',
      risco: 34,
      latitude: -21.23,
      longitude: -45.14,
      totalVacas: 210,
      area: '450 ha',
      contato: '(35) 98888-3333',
      ultimaAtualizacao: new Date()
    },
    {
      id: 'rancho-alegre',
      nome: 'Rancho Alegre',
      risco: 45,
      latitude: -21.22,
      longitude: -45.13,
      totalVacas: 92,
      area: '200 ha',
      contato: '(35) 98888-4444',
      ultimaAtualizacao: new Date()
    },
    {
      id: 'fazenda-sao-jose',
      nome: 'Fazenda São José',
      risco: 67,
      latitude: -21.26,
      longitude: -45.14,
      totalVacas: 167,
      area: '380 ha',
      contato: '(35) 98888-5555',
      ultimaAtualizacao: new Date()
    }
  ];

  for (const fazenda of fazendasTeste) {
    const docRef = doc(db, 'fazendas', fazenda.id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await setDoc(docRef, fazenda);
      console.log(`✅ Fazenda ${fazenda.nome} criada!`);
    }
  }
};