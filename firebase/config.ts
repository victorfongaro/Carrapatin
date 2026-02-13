import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// 🔥 CONFIGURAÇÃO DIRETA
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

// Auth SIMPLES (funciona em todas as plataformas)
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

// Habilitar persistência offline (apenas native)
if (Platform.OS !== 'web') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('⚠️ Persistência offline: múltiplas abas abertas');
    } else if (err.code === 'unimplemented') {
      console.log('⚠️ Persistência offline não suportada');
    }
  });
}

console.log('🔥 Firebase conectado:', firebaseConfig.projectId);