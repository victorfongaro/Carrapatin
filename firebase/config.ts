import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 CONFIGURAÇÃO DO SEU PROJETO
const firebaseConfig = {
  apiKey: "AIzaSyASwjMkj2jRfAFwKsS8uZLhgf41RV6qOww",
  authDomain: "carrapai-9c99e.firebaseapp.com",
  projectId: "carrapai-9c99e",
  storageBucket: "carrapai-9c99e.firebasestorage.app",
  messagingSenderId: "753704455974",
  appId: "1:753704455974:android:a52b7702d91387d2a87be7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Auth - Versão SIMPLES (sem persistência por enquanto)
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

// Habilitar persistência offline (apenas mobile)
if (Platform.OS !== 'web') {
  enableIndexedDbPersistence(db)
    .then(() => console.log('🔥 Persistência offline ativada'))
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.log('⚠️ Persistência offline: múltiplas abas abertas');
      } else if (err.code === 'unimplemented') {
        console.log('⚠️ Persistência offline não suportada');
      }
    });
}

// Função para testar conexão
export const testFirebaseConnection = async () => {
  try {
    const testCollection = collection(db, '_test_');
    const testDoc = doc(testCollection, 'connection-test');
    await setDoc(testDoc, { 
      timestamp: new Date(),
      platform: Platform.OS,
      appName: 'CarrapAI',
      lastPing: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Firebase conectado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão Firebase:', error);
    return false;
  }
};

// Função para inicializar dados da fazenda
export const inicializarFazenda = async (fazendaId: string) => {
  try {
    const docRef = doc(db, 'fazendas', fazendaId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        nome: 'Minha Fazenda',
        risco: 0,
        multiplicadorHistorico: 1.0,
        createdAt: new Date(),
        ultimaAtualizacao: new Date(),
        latitude: -21.244,
        longitude: -45.147
      });
      console.log('✅ Fazenda criada com sucesso!');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar fazenda:', error);
  }
};

console.log('🔥 Firebase inicializado:', firebaseConfig.projectId);