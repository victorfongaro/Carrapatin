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
// 4. 🌦️ SERVIÇO DE DADOS CLIMÁTICOS - OPEN-METEO!
// ===========================================
// ✅ GRATUITO - SEM CHAVE - SEM CADASTRO - FUNCIONA AGORA!

// 📍 Buscar clima por coordenadas (Open-Meteo)
export const carregarClimaOpenMeteo = async (lat: number, lon: number) => {
  try {
    // URL da API Open-Meteo - SEM CHAVE!
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    
    console.log('🌤️ Buscando clima Open-Meteo...');
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.current) {
      return {
        temperatura: Math.round(data.current.temperature_2m),
        umidade: data.current.relative_humidity_2m,
        vento: Math.round(data.current.wind_speed_10m),
        condicao: traduzirCodigoTempo(data.current.weather_code),
        codigo: data.current.weather_code,
        cidade: obterCidadePorCoordenadas(lat, lon) // Função auxiliar
      };
    }
    
    throw new Error('Dados não encontrados');
    
  } catch (error) {
    console.error('❌ Erro no Open-Meteo:', error);
    // Fallback: dados simulados
    return {
      temperatura: Math.floor(Math.random() * 10) + 25,
      umidade: Math.floor(Math.random() * 30) + 60,
      vento: Math.floor(Math.random() * 15) + 5,
      condicao: ['Ensolarado', 'Parcialmente Nublado', 'Nublado', 'Chuva'][Math.floor(Math.random() * 4)],
      cidade: 'Sua localização'
    };
  }
};

// 🌆 Buscar previsão para os próximos dias
export const carregarPrevisaoOpenMeteo = async (lat: number, lon: number) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max&timezone=auto&forecast_days=7`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.daily) {
      const previsao = [];
      for (let i = 0; i < data.daily.time.length; i++) {
        previsao.push({
          data: data.daily.time[i],
          temp_max: Math.round(data.daily.temperature_2m_max[i]),
          temp_min: Math.round(data.daily.temperature_2m_min[i]),
          umidade: data.daily.relative_humidity_2m_max[i],
          condicao: traduzirCodigoTempo(data.daily.weather_code[i])
        });
      }
      return previsao;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Erro ao carregar previsão:', error);
    return [];
  }
};

// 🔤 Tradutor de códigos WMO para português
const traduzirCodigoTempo = (codigo: number): string => {
  // Códigos WMO (World Meteorological Organization)
  const mapa: Record<number, string> = {
    0: 'Céu limpo',
    1: 'Parcialmente nublado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Nevoeiro',
    48: 'Nevoeiro',
    51: 'Chuva leve',
    53: 'Chuva moderada',
    55: 'Chuva forte',
    56: 'Chuva congelante',
    57: 'Chuva congelante',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    66: 'Chuva congelante',
    67: 'Chuva congelante',
    71: 'Neve leve',
    73: 'Neve moderada',
    75: 'Neve forte',
    77: 'Neve',
    80: 'Chuva leve',
    81: 'Chuva moderada',
    82: 'Chuva forte',
    85: 'Neve',
    86: 'Neve',
    95: 'Tempestade',
    96: 'Tempestade',
    99: 'Tempestade'
  };
  
  return mapa[codigo] || 'Condições variadas';
};

// 🗺️ Função auxiliar para nome da cidade (simplificada)
const obterCidadePorCoordenadas = (lat: number, lon: number): string => {
  // Aproximação baseada em coordenadas brasileiras
  if (lat > -25 && lat < -20 && lon > -50 && lon < -40) return 'Sudeste';
  if (lat > -30 && lat < -25 && lon > -55 && lon < -45) return 'Sul';
  if (lat < -30) return 'Sul';
  if (lat > -15) return 'Nordeste';
  return 'Centro-Oeste';
};

// 🧮 Calcular risco climático (APENAS temperatura e umidade)
export const calcularRiscoClimatico = (temperatura: number, umidade: number) => {
  // Temperatura ideal: 25-30°C
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
    multiplicador = 1.8;
  }
  
  return {
    fatorCombinado,
    nivel,
    cor,
    multiplicador,
    mensagem: getMensagemAlerta(temperatura, umidade, fatorCombinado)
  };
};

// 💬 Mensagens de alerta
const getMensagemAlerta = (temp: number, umid: number, fator: number) => {
  if (fator > 1.5) return `🚨 ALERTA MÁXIMO! Calor (${temp}°C) e umidade (${umid}%) criam ambiente IDEAL para proliferação`;
  if (fator > 1.2) return `⚠️ ATENÇÃO! Condições muito favoráveis para reprodução dos carrapatos`;
  if (fator > 0.9) return `📊 Risco moderado. Monitore suas pastagens regularmente`;
  if (temp > 35) return `☀️ Calor intenso! Verifique disponibilidade de água nos pastos`;
  if (umid < 50) return `💨 Clima seco - proliferação reduzida, mas mantenha monitoramento`;
  return `✅ Condições controladas. Continue monitorando suas pastagens`;
};

// ===========================================
// 5. SERVIÇO DE USUÁRIO
// ===========================================

export const carregarDadosUsuario = async (fazendaId: string) => {
  try {
    const docRef = doc(db, 'fazendas', fazendaId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nome: data.nome || 'Produtor',
        fazenda: data.fazenda || data.nome || 'Fazenda',
        email: data.email || '',
        telefone: data.contato || ''
      };
    }
    return {
      id: fazendaId,
      nome: 'Produtor',
      fazenda: 'Fazenda',
      email: '',
      telefone: ''
    };
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    return {
      id: fazendaId,
      nome: 'Produtor',
      fazenda: 'Fazenda',
      email: '',
      telefone: ''
    };
  }
};


// ===========================================
// 7. 🐮 CRIAR VACAS DE TESTE NO BANCO
// ===========================================
export const criarVacasTeste = async (fazendaId: string) => {
  try {
    console.log('🟡 Criando vacas de teste...');
    
    const vacasRef = collection(db, 'fazendas', fazendaId, 'vacas');
    const snapshot = await getDocs(vacasRef);
    
    // Só cria se não existir nenhuma
    if (snapshot.empty) {
      const vacas = [
        { brinco: '001', nome: 'Mimosa', cor: 'Malhada' },
        { brinco: '002', nome: 'Estrela', cor: 'Preta' },
        { brinco: '003', nome: 'Lua', cor: 'Branca' },
        { brinco: '004', nome: 'Flor', cor: 'Marrom' },
        { brinco: '005', nome: 'Bela', cor: 'Malhada' },
        { brinco: '006', nome: 'Rosa', cor: 'Vermelha' },
        { brinco: '007', nome: 'Morena', cor: 'Preta' },
        { brinco: '008', nome: 'Jade', cor: 'Branca' },
        { brinco: '009', nome: 'Ambar', cor: 'Marrom' },
        { brinco: '010', nome: 'Duna', cor: 'Malhada' }
      ];

      for (const vaca of vacas) {
        const id = `vaca_${vaca.brinco}`;
        const vacaRef = doc(vacasRef, id);
        
        await setDoc(vacaRef, {
          id,
          brinco: vaca.brinco,
          nome: vaca.nome,
          cor: vaca.cor,
          fotos: {
            esquerda: null,
            direita: null,
            entrePerdas: null
          },
          fotos_metadata: {},
          nivelInfestacao: Math.floor(Math.random() * 60) + 10, // 10-70%
          createdAt: Timestamp.now(),
          ultimaAtualizacao: Timestamp.now()
        });
        
        console.log(`✅ Vaca ${vaca.nome} (${vaca.brinco}) criada!`);
      }
      
      // Atualiza total de vacas na fazenda
      const fazendaRef = doc(db, 'fazendas', fazendaId);
      await updateDoc(fazendaRef, {
        totalVacas: vacas.length,
        ultimaAtualizacao: Timestamp.now()
      });
      
      console.log(`✅ Total de ${vacas.length} vacas criadas!`);
    } else {
      console.log('ℹ️ Vacas já existem, pulando criação');
    }
  } catch (error) {
    console.error('❌ Erro ao criar vacas:', error);
  }
};


// ===========================================
// 6. INICIALIZAR DADOS DE TESTE
// ===========================================

export const inicializarDadosTeste = async () => {
  const fazendasTeste = [
    {
      id: 'minha-fazenda-001',
      nome: 'Fazenda Boa Vista',
      risco: 78,
      latitude: -21.244,
      longitude: -45.147,
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