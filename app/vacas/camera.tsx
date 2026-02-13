import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { salvarFotoVaca } from '../../firebase/vacasService'; // 👈 IMPORTANTE!

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const { posicao, vacaId, vacaNome } = useLocalSearchParams<{
    posicao: string;
    vacaId: string;
    vacaNome: string;
  }>();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [fotoTirada, setFotoTirada] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const fazendaId = "minha-fazenda-001";
  
  // ANIMAÇÕES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const tirarFoto = async () => {
    if (cameraRef.current) {
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      setFotoTirada(foto.uri);
    }
  };

  // ✅ FUNÇÃO CORRIGIDA - AGORA SALVA A FOTO E VOLTA CORRETAMENTE!
  const confirmarFoto = async () => {
    if (!fotoTirada || !posicao || !vacaId) return;
    
    setIsSaving(true);
    
    try {
      // 1. SALVA A FOTO NO FIREBASE
      await salvarFotoVaca(
        fazendaId,
        vacaId,
        posicao as 'esquerda' | 'direita' | 'entrePerdas',
        fotoTirada
      );
      
      // 2. VOLTA APENAS UMA TELA (para vacas/index)
      router.back();
      
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      Alert.alert('Erro', 'Não foi possível salvar a foto');
    } finally {
      setIsSaving(false);
    }
  };

  const tirarOutraFoto = () => {
    setFotoTirada(null);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#0f766e', '#0d9488']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera" size={48} color="white" />
          </View>
          <Text style={styles.permissionTitle}>Precisamos da sua câmera</Text>
          <Text style={styles.permissionText}>
            Para analisar os carrapatos nas vacas, precisamos acessar sua câmera
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Permitir acesso</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const posicaoInfo = {
    esquerda: { 
      nome: 'Lateral Esquerda', 
      icon: 'arrow-back-circle',
      cor: '#3b82f6',
      desc: 'Posicione a câmera no lado esquerdo do pescoço'
    },
    direita: { 
      nome: 'Lateral Direita', 
      icon: 'arrow-forward-circle',
      cor: '#3b82f6',
      desc: 'Posicione a câmera no lado direito do pescoço'
    },
    entrePerdas: { 
      nome: 'Entre Pernas', 
      icon: 'remove-circle',
      cor: '#8b5cf6',
      desc: 'Posicione a câmera entre as pernas dianteiras'
    },
  }[posicao] || { nome: 'Câmera', icon: 'camera', cor: '#059669', desc: '' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {!fotoTirada ? (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            autofocus="on"
            flash="auto"
          />
          
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <Animated.View 
                style={[
                  styles.scanLine,
                  {
                    transform: [{
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-100, 100]
                      })
                    }]
                  }
                ]}
              />
              
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
              
              <View style={styles.positionIndicator}>
                <Ionicons name={posicaoInfo.icon as any} size={32} color="white" />
                <Text style={styles.positionText}>{posicaoInfo.nome}</Text>
              </View>
            </View>

            <BlurView intensity={80} tint="dark" style={styles.vacaInfoBar}>
              <View style={styles.vacaInfoContent}>
                <View style={styles.vacaIcon}>
                  <Ionicons name="paw" size={20} color="white" />
                </View>
                <View>
                  <Text style={styles.vacaNome}>{vacaNome}</Text>
                  <Text style={styles.vacaBrinco}>ID: {vacaId}</Text>
                </View>
              </View>
            </BlurView>

            <Animated.View 
              style={[
                styles.instructions,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.instructionsText}>
                {posicaoInfo.desc}
              </Text>
            </Animated.View>

            <View style={styles.captureContainer}>
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={tirarFoto}
              >
                <LinearGradient
                  colors={['#ffffff', '#f0f0f0']}
                  style={styles.captureGradient}
                >
                  <View style={styles.captureInner} />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.captureText}>TIRAR FOTO</Text>
            </View>
          </View>
        </>
      ) : (
        <Animated.View style={[styles.previewContainer, { opacity: fadeAnim }]}>
          <Image source={{ uri: fotoTirada }} style={styles.previewImage} />
          
          <BlurView intensity={90} tint="dark" style={styles.previewHeader}>
            <TouchableOpacity 
              style={styles.previewBackButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Visualizar Foto</Text>
            <View style={{ width: 40 }} />
          </BlurView>

          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={styles.previewActionButton}
              onPress={tirarOutraFoto}
              disabled={isSaving}
            >
              <LinearGradient
                colors={['#4b5563', '#374151']}
                style={styles.previewActionGradient}
              >
                <Ionicons name="refresh" size={24} color="white" />
                <Text style={styles.previewActionText}>Tirar outra</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.previewActionButton}
              onPress={confirmarFoto}
              disabled={isSaving}
            >
              <LinearGradient
                colors={isSaving ? ['#9ca3af', '#6b7280'] : ['#059669', '#047857']}
                style={styles.previewActionGradient}
              >
                <Ionicons name={isSaving ? "sync" : "checkmark"} size={24} color="white" />
                <Text style={styles.previewActionText}>
                  {isSaving ? 'Salvando...' : 'Usar foto'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ... (mantenha todos os styles iguais)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 100,
  },
  permissionButtonText: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    width: width * 0.7,
    height: 2,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'white',
  },
  cornerTopRight: {
    position: 'absolute',
    top: '30%',
    right: '15%',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: 'white',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: '30%',
    left: '15%',
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'white',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: '30%',
    right: '15%',
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: 'white',
  },
  positionIndicator: {
    alignItems: 'center',
    marginTop: -40,
  },
  positionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  vacaInfoBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 100,
    overflow: 'hidden',
  },
  vacaInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 20,
  },
  vacaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vacaNome: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vacaBrinco: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  instructions: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    overflow: 'hidden',
  },
  captureContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  captureText: {
    color: 'white',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewActionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  previewActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});