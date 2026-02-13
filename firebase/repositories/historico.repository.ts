import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';

export class HistoricoRepository {
  
  async marcarDiaContaminacao(fazendaId: string, data: string): Promise<void> {
    const docRef = doc(db, 'fazendas', fazendaId, 'diasContaminacao', data);
    await setDoc(docRef, {
      data,
      timestamp: Timestamp.now()
    });
  }
  
  async removerDiaContaminacao(fazendaId: string, data: string): Promise<void> {
    const docRef = doc(db, 'fazendas', fazendaId, 'diasContaminacao', data);
    await deleteDoc(docRef);
  }
  
  async listarDiasContaminacao(fazendaId: string): Promise<string[]> {
    const diasRef = collection(db, 'fazendas', fazendaId, 'diasContaminacao');
    const snapshot = await getDocs(diasRef);
    return snapshot.docs.map(d => d.id).sort().reverse();
  }
  
  async contarDiasContaminacaoNoPeriodo(
    fazendaId: string, 
    dataInicio: string, 
    dataFim: string
  ): Promise<number> {
    const dias = await this.listarDiasContaminacao(fazendaId);
    return dias.filter(d => d >= dataInicio && d <= dataFim).length;
  }
}

export const historicoRepository = new HistoricoRepository();