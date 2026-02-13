import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';
import { Vaca, NovaVaca, PosicaoFoto, FotoMetadata } from '../types/vaca.types';

export class VacaRepository {
  
  async criar(fazendaId: string, dados: NovaVaca): Promise<Vaca> {
    const id = `vaca_${Date.now()}`;
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', id);
    const timestamp = Timestamp.now();
    
    const novaVaca: Vaca = {
      id,
      fazendaId,
      brinco: dados.brinco,
      nome: dados.nome,
      fotos: {},
      nivelInfestacao: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await setDoc(vacaRef, novaVaca);
    return novaVaca;
  }
  
  async buscarPorId(fazendaId: string, vacaId: string): Promise<Vaca | null> {
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    const vacaSnap = await getDoc(vacaRef);
    return vacaSnap.exists() ? (vacaSnap.data() as Vaca) : null;
  }
  
  async listarPorFazenda(fazendaId: string): Promise<Vaca[]> {
    const vacasRef = collection(db, 'fazendas', fazendaId, 'vacas');
    const q = query(vacasRef, orderBy('brinco', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Vaca);
  }
  
  async atualizar(fazendaId: string, vacaId: string, updates: Partial<Vaca>): Promise<void> {
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    await updateDoc(vacaRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }
  
  async adicionarFoto(
    fazendaId: string, 
    vacaId: string, 
    posicao: PosicaoFoto, 
    url: string
  ): Promise<void> {
    const vacaRef = doc(db, 'fazendas', fazendaId, 'vacas', vacaId);
    await updateDoc(vacaRef, {
      [`fotos.${posicao}`]: url,
      updatedAt: Timestamp.now()
    });
  }
}

export const vacaRepository = new VacaRepository();