import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { db } from './config';

const storage = getStorage();
// NOVO - usa a API legacy que ainda funciona:
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

// ===========================================
// 1. CARREGAR VACAS DA FAZENDA - ✅ COM CRIAÇÃO AUTOMÁTICA
// ===========================================
export const carregarVacas = async (fazendaId: string) => {
  try {
    console.log('🟡 Carregando vacas do Firebase...');
    const vacasRef = collection(db, 'fazendas', fazendaId, 'vacas');
    const querySnapshot = await getDocs(vacasRef);
    
    // 🚨 SE NÃO TIVER VACAS, CRIA AUTOMATICAMENTE!
    if (querySnapshot.empty) {
      console.log('⚠️ Nenhuma vaca encontrada. Criando vacas iniciais...');
      await criarVacasIniciais(fazendaId);
      
      // Busca novamente após criar
      const novoSnapshot = await getDocs(vacasRef);
      const novasVacas: any[] = [];
      novoSnapshot.forEach((doc) => {
        const data = doc.data();
        novasVacas.push({
          id: doc.id,
          nome: data.nome || `Vaca ${doc.id}`,
          brinco: data.brinco || doc.id,
          fotos: {
            esquerda: data.fotos?.esquerda || null,
            direita: data.fotos?.direita || null,
            entrePerdas: data.fotos?.entrePerdas || null
          },
          fotos_metadata: data.fotos_metadata || {},
          nivelInfestacao: data.nivelInfestacao || 0,
          ultimaAnalise: data.ultimaAnalise?.toDate?.() || null
        });
      });
      
      console.log(`✅ ${novasVacas.length} vacas criadas e carregadas`);
      return novasVacas;
    }
    
    // Se já existirem vacas, carrega normalmente
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
        fotos_metadata: data.fotos_metadata || {},
        nivelInfestacao: data.nivelInfestacao || 0,
        ultimaAnalise: data.ultimaAnalise?.toDate?.() || null
      });
    });
    
    console.log(`✅ ${vacas.length} vacas carregadas do banco`);
    return vacas;
    
  } catch (error) {
    console.error('❌ Erro ao carregar vacas:', error);
    return [];
  }
};

// ===========================================
// 2. SALVAR FOTO DA VACA - ✅ VERSÃO DIAGNÓSTICO
// ===========================================
export const salvarFotoVaca = async (
  fazendaId: string,
  vacaId: string,
  posicao: 'esquerda' | 'direita' | 'entrePerdas',
  imageUri: string
): Promise<boolean> => {
  try {
    console.log('========== INICIANDO UPLOAD ==========');
    console.log(`📸 Parâmetros recebidos:`);
    console.log(`   - fazendaId: ${fazendaId}`);
    console.log(`   - vacaId: ${vacaId}`);
    console.log(`   - posicao: ${posicao}`);
    console.log(`   - imageUri: ${imageUri}`);
    
    // PASSO 1: Verificar se a vaca existe no Firestore
    console.log('\n🔍 PASSO 1: Verificando se a vaca existe...');
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    const vacaSnap = await getDoc(vacaRef);
    
    if (!vacaSnap.exists()) {
      console.error(`❌ Vaca ${vacaId} NÃO EXISTE no Firestore!`);
      console.log(`📋 Document path: fazendas/${fazendaId}/vacas/${vacaId}`);
      
      // Listar todas as vacas disponíveis para diagnóstico
      const vacasRef = collection(db, 'fazendas', fazendaId, 'vacas');
      const todasVacas = await getDocs(vacasRef);
      console.log(`📋 Vacas disponíveis no banco:`);
      todasVacas.forEach(doc => {
        console.log(`   - ID: ${doc.id}, Nome: ${doc.data().nome}`);
      });
      
      Alert.alert('Erro', `Vaca com ID ${vacaId} não encontrada no banco de dados`);
      return false;
    }
    
    console.log(`✅ Vaca encontrada: ${vacaSnap.data().nome} (${vacaId})`);
    
    // PASSO 2: Ler o arquivo
    console.log('\n🔍 PASSO 2: Lendo arquivo de imagem...');
    console.log(`📱 FileSystem.readAsStringAsync iniciado...`);
    
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log(`✅ Base64 lido com sucesso!`);
    console.log(`   - Tamanho: ${base64.length} caracteres`);
    console.log(`   - Primeiros 50 chars: ${base64.substring(0, 50)}...`);
    
    // PASSO 3: Converter para Blob
    console.log('\n🔍 PASSO 3: Convertendo base64 para blob...');
    const blob = await fetch(`data:image/jpeg;base64,${base64}`).then(res => res.blob());
    
    console.log(`✅ Blob criado:`);
    console.log(`   - Tamanho: ${blob.size} bytes`);
    console.log(`   - Tipo: ${blob.type}`);
    
    // PASSO 4: Preparar upload
    console.log('\n🔍 PASSO 4: Preparando upload para Storage...');
    const timestamp = Date.now();
    const filename = `${vacaId}_${posicao}_${timestamp}.jpg`;
    const storagePath = `fazendas/${fazendaId}/vacas/${vacaId}/fotos/${filename}`;
    
    console.log(`   - filename: ${filename}`);
    console.log(`   - storagePath: ${storagePath}`);
    
    // PASSO 5: Fazer upload
    console.log('\n🔍 PASSO 5: Enviando para Firebase Storage...');
    console.log(`📤 Iniciando upload... (isso pode levar alguns segundos)`);
    
    const storageRef = ref(storage, storagePath);
    
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        vacaId,
        fazendaId,
        posicao,
        timestamp: timestamp.toString(),
        app: 'CarrapAI'
      }
    };
    
    console.log(`📤 Metadata:`, metadata);
    
    const uploadResult = await uploadBytes(storageRef, blob, metadata);
    
    console.log(`✅ Upload concluído!`);
    console.log(`   - Tamanho: ${uploadResult.metadata.size} bytes`);
    console.log(`   - Path: ${uploadResult.metadata.fullPath}`);
    
    // PASSO 6: Obter URL
    console.log('\n🔍 PASSO 6: Obtendo URL pública...');
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    
    console.log(`✅ URL obtida: ${downloadUrl}`);
    
    // PASSO 7: Salvar no Firestore
    console.log('\n🔍 PASSO 7: Salvando URL no Firestore...');
    
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
    
    console.log(`📝 Dados a serem salvos:`, fotoData);
    
    await updateDoc(vacaRef, fotoData);
    
    console.log(`✅ URL salva no Firestore com sucesso!`);
    console.log('========== UPLOAD CONCLUÍDO ==========\n');
    
    return true;
    
  } catch (error: any) {
    console.error('========== ERRO NO UPLOAD ==========');
    console.error(`❌ Mensagem:`, error.message);
    console.error(`❌ Código:`, error.code);
    console.error(`❌ Stack:`, error.stack);
    
    if (error.code === 'storage/unauthorized') {
      Alert.alert('Erro de Permissão', 'Verifique as regras do Firebase Storage');
    } else if (error.code === 'storage/canceled') {
      Alert.alert('Upload Cancelado', 'O upload foi cancelado.');
    } else if (error.code === 'storage/unknown') {
      Alert.alert(
        'Erro no Storage', 
        'Erro desconhecido. Verifique:\n\n' +
        '1. Regras do Storage (allow read, write: if true)\n' +
        '2. Conexão com internet\n' +
        '3. Bucket name: carrapai-9c99e.firebasestorage.app'
      );
    } else {
      Alert.alert('Erro', `Falha ao salvar foto: ${error.message}`);
    }
    
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
// 🧪 FUNÇÃO DE TESTE - UPLOAD MÍNIMO
// ===========================================
export const testarStorageBasico = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testando conexão básica com Storage...');
    
    // Criar um blob minúsculo (apenas "teste")
    const blob = new Blob(['teste'], { type: 'text/plain' });
    
    // Tentar upload de um arquivo minúsculo
    const testRef = ref(storage, 'teste_conexao.txt');
    await uploadBytes(testRef, blob);
    
    console.log('✅ Upload de teste funcionou!');
    return true;
    
  } catch (error: any) {
    console.error('❌ Teste falhou:', error.message);
    console.error('Código:', error.code);
    return false;
  }
};

// ===========================================
// 🚨 FUNÇÃO PARA CRIAR VACAS DE TESTE
// ===========================================
export const criarVacasIniciais = async (fazendaId: string) => {
  try {
    console.log('🟡 Verificando se existem vacas...');
    
    const vacasRef = collection(db, 'fazendas', fazendaId, 'vacas');
    const snapshot = await getDocs(vacasRef);
    
    // Se já existirem vacas, não faz nada
    if (!snapshot.empty) {
      console.log(`✅ ${snapshot.size} vacas já existem`);
      return;
    }
    
    console.log('🟡 Criando vacas iniciais...');
    
    // Lista de vacas para criar
    const vacasIniciais = [
      { id: 'vaca_001', nome: 'Mimosa', brinco: '001' },
      { id: 'vaca_002', nome: 'Estrela', brinco: '002' },
      { id: 'vaca_003', nome: 'Morena', brinco: '003' },
      { id: 'vaca_004', nome: 'Lua', brinco: '004' },
      { id: 'vaca_005', nome: 'Flor', brinco: '005' },
      { id: 'vaca_006', nome: 'Pérola', brinco: '006' },
      { id: 'vaca_007', nome: 'Safira', brinco: '007' },
      { id: 'vaca_008', nome: 'Jade', brinco: '008' },
    ];

    for (const vaca of vacasIniciais) {
      const vacaRef = doc(vacasRef, vaca.id);
      
      await setDoc(vacaRef, {
        id: vaca.id,
        brinco: vaca.brinco,
        nome: vaca.nome,
        fotos: {
          esquerda: null,
          direita: null,
          entrePerdas: null
        },
        fotos_metadata: {},
        nivelInfestacao: Math.floor(Math.random() * 30) + 20, // 20-50%
        createdAt: Timestamp.now(),
        ultimaAtualizacao: Timestamp.now()
      });
      
      console.log(`✅ Vaca ${vaca.nome} (${vaca.brinco}) criada!`);
    }
    
    // Atualiza total de vacas na fazenda
    const fazendaRef = doc(db, 'fazendas', fazendaId);
    await updateDoc(fazendaRef, {
      totalVacas: vacasIniciais.length,
      ultimaAtualizacao: Timestamp.now()
    });
    
    console.log(`✅ ${vacasIniciais.length} vacas criadas com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao criar vacas iniciais:', error);
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