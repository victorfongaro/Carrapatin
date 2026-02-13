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
import { getStorage } from 'firebase/storage';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const storage = getStorage();
// NOVO - usa a API legacy que ainda funciona:
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// ===========================================
// 1. CARREGAR VACAS DA FAZENDA ✅
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
        fotos: {
          esquerda: data.fotos?.esquerda || null,
          direita: data.fotos?.direita || null,
          entrePerdas: data.fotos?.entrePerdas || null
        },
        fotos_metadata: data.fotos_metadata || {}, // ✅ Metadata das URLs
        nivelInfestacao: data.nivelInfestacao || 0,
        ultimaAnalise: data.ultimaAnalise?.toDate?.() || null
      });
    });
    
    console.log('✅ Vacas carregadas:', vacas.length);
    return vacas;
  } catch (error) {
    console.error('❌ Erro ao carregar vacas:', error);
    return [];
  }
};

// ===========================================
// 2. SALVAR FOTO DA VACA - ✅ FIREBASE STORAGE!
// ===========================================
export const salvarFotoVaca = async (
  fazendaId: string,
  vacaId: string,
  posicao: 'esquerda' | 'direita' | 'entrePerdas',
  imageUri: string
): Promise<boolean> => {
  try {
    console.log(`🟡 Enviando foto ${posicao} para vaca ${vacaId}...`);
    
    // 🚨 PASSO 1: CONVERTER URI PARA BLOB
    let blob: Blob;
    
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      blob = await response.blob();
    } else {
      // 📱 Mobile: ler como base64 e converter
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      blob = await fetch(`data:image/jpeg;base64,${base64}`).then(res => res.blob());
    }

    // 🚨 PASSO 2: GERAR NOME ÚNICO E CAMINHO
    const timestamp = Date.now();
    const filename = `${vacaId}_${posicao}_${timestamp}.jpg`;
    const storagePath = `fazendas/${fazendaId}/vacas/${vacaId}/fotos/${filename}`;
    
    console.log(`📁 Upload path: ${storagePath}`);

    // 🚨 PASSO 3: UPLOAD PARA FIREBASE STORAGE
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        vacaId,
        fazendaId,
        posicao,
        timestamp: timestamp.toString(),
        app: 'CarrapAI'
      }
    });

    // 🚨 PASSO 4: OBTER URL PÚBLICA
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    console.log(`✅ Upload concluído: ${downloadUrl}`);

    // 🚨 PASSO 5: SALVAR URL NO FIRESTORE
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    const vacaSnap = await getDoc(vacaRef);
    
    const fotoData = {
      [`fotos.${posicao}`]: downloadUrl,
      [`fotos_metadata.${posicao}`]: {
        url: downloadUrl,
        filename,
        timestamp,
        uploadedAt: Timestamp.now()
      },
      ultimaAtualizacao: Timestamp.now()
    };

    if (vacaSnap.exists()) {
      await updateDoc(vacaRef, fotoData);
    } else {
      await setDoc(vacaRef, {
        nome: `Vaca ${vacaId}`,
        brinco: vacaId,
        fotos: {
          esquerda: posicao === 'esquerda' ? downloadUrl : null,
          direita: posicao === 'direita' ? downloadUrl : null,
          entrePerdas: posicao === 'entrePerdas' ? downloadUrl : null
        },
        fotos_metadata: {
          [posicao]: {
            url: downloadUrl,
            filename,
            timestamp,
            uploadedAt: Timestamp.now()
          }
        },
        nivelInfestacao: 0,
        createdAt: Timestamp.now(),
        ultimaAtualizacao: Timestamp.now()
      });
    }
    
    console.log('✅ Foto salva no Storage e URL salva no Firestore!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao salvar foto no Firebase Storage:', error);
    return false;
  }
};

// ===========================================
// 3. SALVAR ANÁLISE DE CARRAPATOS ✅
// ===========================================
export const salvarAnalise = async (
  fazendaId: string,
  vacaId: string,
  nivelInfestacao: number
): Promise<boolean> => {
  try {
    console.log(`🟡 Salvando análise para vaca ${vacaId}: ${nivelInfestacao}%`);
    
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    const timestamp = Timestamp.now();
    const dataStr = new Date().toISOString().split('T')[0];
    
    // Atualiza a vaca
    await updateDoc(vacaRef, {
      nivelInfestacao,
      ultimaAnalise: timestamp,
      ultimaAnaliseData: dataStr
    });
    
    // Salva no histórico de análises da vaca
    const analiseRef = doc(collection(db, 'fazendas', fazendaId, 'vacas', vacaId, 'analises'));
    await setDoc(analiseRef, {
      nivel: nivelInfestacao,
      timestamp,
      data: dataStr,
      createdAt: timestamp
    });
    
    // Salva no histórico geral da fazenda
    const historicoRef = doc(collection(db, 'fazendas', fazendaId, 'historico'));
    const vacaData = (await getDoc(vacaRef)).data();
    await setDoc(historicoRef, {
      vacaId,
      vacaNome: vacaData?.nome || vacaId,
      nivelInfestacao,
      data: timestamp,
      dataStr,
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
// 4. ATUALIZAR RISCO TOTAL DA FAZENDA ✅
// ===========================================
export const atualizarRiscoTotal = async (fazendaId: string): Promise<number> => {
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
      ultimaAtualizacao: Timestamp.now(),
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
// 5. ATUALIZAR NÚMERO TOTAL DE VACAS ✅
// ===========================================
export const atualizarTotalVacas = async (fazendaId: string, total: number): Promise<boolean> => {
  try {
    const fazendaRef = doc(db, 'fazendas', fazendaId);
    await updateDoc(fazendaRef, {
      totalVacas: total,
      ultimaAtualizacao: Timestamp.now()
    });
    console.log(`✅ Total de vacas atualizado: ${total}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar total de vacas:', error);
    return false;
  }
};

// ===========================================
// 6. EXCLUIR FOTO DA VACA ✅
// ===========================================
export const excluirFotoVaca = async (
  fazendaId: string,
  vacaId: string,
  posicao: 'esquerda' | 'direita' | 'entrePerdas'
): Promise<boolean> => {
  try {
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    const vacaSnap = await getDoc(vacaRef);
    
    if (vacaSnap.exists()) {
      const data = vacaSnap.data();
      const fotoUrl = data.fotos?.[posicao];
      
      // Deletar do Storage se existir
      if (fotoUrl && fotoUrl.includes('firebasestorage')) {
        try {
          const storageRef = ref(storage, fotoUrl);
          await deleteObject(storageRef);
          console.log(`🗑️ Arquivo deletado do Storage: ${posicao}`);
        } catch (storageError) {
          console.error('Erro ao deletar do Storage:', storageError);
        }
      }
      
      // Remover referência do Firestore
      await updateDoc(vacaRef, {
        [`fotos.${posicao}`]: null,
        [`fotos_metadata.${posicao}`]: null,
        ultimaAtualizacao: Timestamp.now()
      });
      
      console.log(`✅ Foto ${posicao} excluída com sucesso`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao excluir foto:', error);
    return false;
  }
};

// ===========================================
// 7. CRIAR NOVA VACA ✅
// ===========================================
export const criarVaca = async (
  fazendaId: string,
  vacaId: string,
  nome: string,
  brinco: string
): Promise<boolean> => {
  try {
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    
    await setDoc(vacaRef, {
      nome,
      brinco,
      fotos: {
        esquerda: null,
        direita: null,
        entrePerdas: null
      },
      fotos_metadata: {},
      nivelInfestacao: 0,
      createdAt: Timestamp.now(),
      ultimaAtualizacao: Timestamp.now()
    });
    
    console.log(`✅ Vaca ${nome} (${brinco}) criada com sucesso!`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar vaca:', error);
    return false;
  }
};