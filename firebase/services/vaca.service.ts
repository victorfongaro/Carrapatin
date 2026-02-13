import { storage } from '../config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

import { vacaRepository } from '../repositories/vaca.repository';
import { Vaca, NovaVaca, PosicaoFoto, Turno } from '../types/vaca.types';

class VacaService {
  
  async criarVaca(fazendaId: string, dados: NovaVaca): Promise<Vaca> {
    return await vacaRepository.criar(fazendaId, dados);
  }
  
  async uploadFotoVaca(
    fazendaId: string,
    vacaId: string,
    posicao: PosicaoFoto,
    imageUri: string
  ): Promise<string> {
    
    // Converte URI para Blob
    let blob: Blob;
    
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      blob = await response.blob();
    } else {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      blob = await fetch(`data:image/jpeg;base64,${base64}`).then(res => res.blob());
    }
    
    // Upload
    const filename = `${vacaId}_${posicao}_${Date.now()}.jpg`;
    const storagePath = `fazendas/${fazendaId}/vacas/${vacaId}/${filename}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Salva no Firestore
    await vacaRepository.adicionarFoto(fazendaId, vacaId, posicao, downloadUrl);
    
    return downloadUrl;
  }
}

export const vacaService = new VacaService();