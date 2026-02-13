import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';
import { Fazenda } from '../types/fazenda.types';

export class FazendaRepository {
  
  async criar(fazenda: Omit<Fazenda, 'id' | 'createdAt' | 'updatedAt'>): Promise<Fazenda> {
    const id = `fazenda_${Date.now()}`;
    const docRef = doc(db, 'fazendas', id);
    const timestamp = Timestamp.now();
    
    const novaFazenda: Fazenda = {
      ...fazenda,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await setDoc(docRef, novaFazenda);
    return novaFazenda;
  }
  
  async buscarPorId(id: string): Promise<Fazenda | null> {
    const docRef = doc(db, 'fazendas', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Fazenda) : null;
  }
  
  async atualizar(id: string, updates: Partial<Fazenda>): Promise<void> {
    const docRef = doc(db, 'fazendas', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }
  
  async listarTodos(): Promise<Fazenda[]> {
    const querySnapshot = await getDocs(collection(db, 'fazendas'));
    return querySnapshot.docs.map(doc => doc.data() as Fazenda);
  }
}

export const fazendaRepository = new FazendaRepository();