import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  Timestamp
} from 'firebase/firestore';

// ===========================================
// 1. CARREGAR VACAS DA FAZENDA
// ===========================================
export const carregarVacas = async (fazendaId: string) => {
  try {
    console.log('🟡 Carregando vacas do Firebase...');
    const vacasRef = collection(db, 'fazendas', fazendaId, 'vacas');
    const querySnapshot = await getDocs(vacasRef);
    
    const vacas: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      vacas.push({
        id: doc.id,
        nome: data.nome || `Vaca ${doc.id}`,
        brinco: data.brinco || doc.id,
        fotos: data.fotos || {
          esquerda: null,
          direita: null,
          entrePerdas: null
        },
        nivelInfestacao: data.nivelInfestacao || 0,
        ultimaAnalise: data.ultimaAnalise?.toDate?.() || null
      });
    });
    
    // Se não tiver vacas, cria algumas de exemplo
    if (vacas.length === 0) {
      console.log('🟡 Nenhuma vaca encontrada, criando dados de exemplo...');
      const vacasExemplo = [
        { id: '001', nome: 'Mimosa', brinco: 'BR-001' },
        { id: '002', nome: 'Estrela', brinco: 'BR-002' },
        { id: '003', nome: 'Morena', brinco: 'BR-003' },
      ];
      
      for (const vaca of vacasExemplo) {
        const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vaca.id);
        await setDoc(vacaRef, {
          nome: vaca.nome,
          brinco: vaca.brinco,
          fotos: { esquerda: null, direita: null, entrePerdas: null },
          nivelInfestacao: 0,
          createdAt: new Date(),
          ultimaAtualizacao: new Date()
        });
        vacas.push({
          id: vaca.id,
          nome: vaca.nome,
          brinco: vaca.brinco,
          fotos: { esquerda: null, direita: null, entrePerdas: null },
          nivelInfestacao: 0
        });
      }
    }
    
    console.log('✅ Vacas carregadas:', vacas.length);
    return vacas;
  } catch (error) {
    console.error('❌ Erro ao carregar vacas:', error);
    // Retorna dados mock em caso de erro
    return [
      { id: '001', nome: 'Mimosa', brinco: 'BR-001', fotos: { esquerda: null, direita: null, entrePerdas: null }, nivelInfestacao: 0 },
      { id: '002', nome: 'Estrela', brinco: 'BR-002', fotos: { esquerda: null, direita: null, entrePerdas: null }, nivelInfestacao: 0 },
      { id: '003', nome: 'Morena', brinco: 'BR-003', fotos: { esquerda: null, direita: null, entrePerdas: null }, nivelInfestacao: 0 },
    ];
  }
};

// ===========================================
// 2. SALVAR FOTO DA VACA
// ===========================================
export const salvarFotoVaca = async (
  fazendaId: string,
  vacaId: string,
  posicao: 'esquerda' | 'direita' | 'entrePerdas',
  fotoUri: string
) => {
  try {
    console.log(`🟡 Salvando foto ${posicao} para vaca ${vacaId}...`);
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    const vacaSnap = await getDoc(vacaRef);
    
    if (vacaSnap.exists()) {
      await updateDoc(vacaRef, {
        [`fotos.${posicao}`]: fotoUri,
        ultimaAtualizacao: new Date()
      });
    } else {
      await setDoc(vacaRef, {
        nome: `Vaca ${vacaId}`,
        brinco: vacaId,
        fotos: {
          esquerda: posicao === 'esquerda' ? fotoUri : null,
          direita: posicao === 'direita' ? fotoUri : null,
          entrePerdas: posicao === 'entrePerdas' ? fotoUri : null
        },
        nivelInfestacao: 0,
        createdAt: new Date(),
        ultimaAtualizacao: new Date()
      });
    }
    
    console.log('✅ Foto salva com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar foto:', error);
    return false;
  }
};

// ===========================================
// 3. SALVAR ANÁLISE DE CARRAPATOS
// ===========================================
export const salvarAnalise = async (
  fazendaId: string,
  vacaId: string,
  nivelInfestacao: number
) => {
  try {
    console.log(`🟡 Salvando análise para vaca ${vacaId}: ${nivelInfestacao}%`);
    
    // Atualiza a vaca
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    await updateDoc(vacaRef, {
      nivelInfestacao,
      ultimaAnalise: new Date()
    });
    
    // Salva no histórico da fazenda
    const historicoRef = doc(collection(db, 'fazendas', fazendaId, 'historico'));
    await setDoc(historicoRef, {
      vacaId,
      vacaNome: (await getDoc(vacaRef)).data()?.nome || vacaId,
      nivelInfestacao,
      data: new Date(),
      tipo: 'analise'
    });
    
    // Atualiza o risco total da fazenda
    await atualizarRiscoTotal(fazendaId);
    
    console.log('✅ Análise salva com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar análise:', error);
    return false;
  }
};

// ===========================================
// 4. ATUALIZAR RISCO TOTAL DA FAZENDA
// ===========================================
const atualizarRiscoTotal = async (fazendaId: string) => {
  try {
    const vacasRef = collection(db, 'fazendas', fazendaId, 'vacas');
    const querySnapshot = await getDocs(vacasRef);
    
    let somaRisco = 0;
    let totalVacas = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.nivelInfestacao) {
        somaRisco += data.nivelInfestacao;
        totalVacas++;
      }
    });
    
    const riscoMedio = totalVacas > 0 ? Math.round(somaRisco / totalVacas) : 0;
    
    const fazendaRef = doc(db, 'fazendas', fazendaId);
    await updateDoc(fazendaRef, {
      risco: riscoMedio,
      ultimaAtualizacao: new Date(),
      totalVacas
    });
    
    console.log(`✅ Risco total atualizado: ${riscoMedio}%`);
    return riscoMedio;
  } catch (error) {
    console.error('❌ Erro ao atualizar risco total:', error);
    return 0;
  }
};

// ===========================================
// 5. ATUALIZAR NÚMERO TOTAL DE VACAS
// ===========================================
export const atualizarTotalVacas = async (fazendaId: string, total: number) => {
  try {
    const fazendaRef = doc(db, 'fazendas', fazendaId);
    await updateDoc(fazendaRef, {
      totalVacas: total,
      ultimaAtualizacao: new Date()
    });
    console.log(`✅ Total de vacas atualizado: ${total}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar total de vacas:', error);
    return false;
  }
};