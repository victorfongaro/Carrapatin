import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { 
  carregarVacas, 
  salvarFotoVaca, 
  salvarAnalise,
  atualizarTotalVacas 
} from '../../firebase/vacasService';

const { width } = Dimensions.get('window');
const fazendaId = "minha-fazenda-001";

interface Vaca {
  id: string;
  nome: string;
  brinco: string;
  fotos: {
    esquerda: string | null;
    direita: string | null;
    entrePerdas: string | null;
  };
  nivelInfestacao?: number;
}

export default function VacasScreen() {
  const [vacas, setVacas] = useState<Vaca[]>([]);
  const [selectedVaca, setSelectedVaca] = useState<Vaca | null>(null);
  const [showVacaSelector, setShowVacaSelector] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [numeroVacas, setNumeroVacas] = useState('0');
  const [isCalculando, setIsCalculando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ANIMAÇÕES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  // Adicione este useEffect ANTES do carregarDados
  useEffect(() => {
    const verificarEInicializar = async () => {
      try {
        // Tenta carregar - se não houver vacas, a função já cria automaticamente
        await carregarDados();
      } catch (error) {
        console.error('Erro ao inicializar:', error);
      }
    };
    
    verificarEInicializar();
  }, []);
  // CARREGAR VACAS DO FIREBASE
  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('🟡 Carregando vacas...');
      const vacasData = await carregarVacas(fazendaId);
      console.log(`✅ ${vacasData.length} vacas carregadas`);
      setVacas(vacasData);
      
      if (vacasData.length > 0 && !selectedVaca) {
        setSelectedVaca(vacasData[0]);
        setNumeroVacas(vacasData.length.toString());
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vacas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ATUALIZAR QUANDO VOLTAR DA CÂMERA
  useFocusEffect(
    useCallback(() => {
      console.log('📸 Tela de vacas em foco - recarregando dados...');
      carregarDados();
    }, [])
  );

  const abrirCamera = (posicao: 'esquerda' | 'direita' | 'entrePerdas') => {
    if (!selectedVaca) return;
    
    console.log('🔍 Abrindo câmera para vaca:', selectedVaca.id);  // 👈 ADICIONE ISSO
    
    router.push({
      pathname: '/vacas/camera',
      params: {
        posicao,
        vacaId: selectedVaca.id,
        vacaNome: selectedVaca.nome
      }
    });
  };
  
  const handleAnalisarCarrapatos = async () => {
    if (!selectedVaca) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCalculando(true);
    
    // ANIMAÇÃO DE CARREGAMENTO
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // SIMULA CÁLCULO DA IA (2.5 segundos)
    setTimeout(async () => {
      // Nível de infestação SIMULADO
      const nivelSimulado = Math.floor(Math.random() * 40) + 30; // 30-70%
      
      // Salva no Firebase
      await salvarAnalise(fazendaId, selectedVaca.id, nivelSimulado);
      
      setIsCalculando(false);
      
      // ANIMAÇÃO DE TRANSIÇÃO
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // ALERTA DE SUCESSO
      Alert.alert(
        '🎉 Análise Concluída!',
        `Nível de infestação: ${nivelSimulado}%\n\nO risco da fazenda foi atualizado.`,
        [
          {
            text: 'Ver Dashboard',
            onPress: () => {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                router.push('/');
              });
            }
          },
          {
            text: 'Continuar',
            style: 'cancel'
          }
        ]
      );
    }, 2500);
  };

  const getFotosCount = () => {
    if (!selectedVaca) return 0;
    const fotos = selectedVaca.fotos;
    return Object.values(fotos).filter(f => f !== null && f !== undefined).length;
  };

  const isProntoParaAnalise = () => {
    return getFotosCount() === 3;
  };

  const FotoPlaceholder = ({ 
    posicao, 
    foto, 
    onPress 
  }: { 
    posicao: string; 
    foto: string | null; 
    onPress: () => void;
  }) => {
    const posicaoConfig = {
      esquerda: {
        titulo: 'Lateral Esquerda',
        icon: 'arrow-back-circle',
        cor: '#3b82f6',
        bg: '#dbeafe',
        desc: 'Pescoço - Lado Esquerdo'
      },
      direita: {
        titulo: 'Lateral Direita',
        icon: 'arrow-forward-circle',
        cor: '#3b82f6',
        bg: '#dbeafe',
        desc: 'Pescoço - Lado Direito'
      },
      entrePerdas: {
        titulo: 'Entre Pernas',
        icon: 'remove-circle',
        cor: '#8b5cf6',
        bg: '#ede9fe',
        desc: 'Região do Úbere'
      },
    }[posicao] || {
      titulo: posicao,
      icon: 'camera',
      cor: '#059669',
      bg: '#d1fae5',
      desc: ''
    };

    return (
      <TouchableOpacity 
        style={styles.fotoContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={foto ? ['#ffffff', '#fafafa'] : [posicaoConfig.bg, '#ffffff']}
          style={styles.fotoGradient}
        >
          {foto ? (
            <View style={styles.fotoPreview}>
              <Image source={{ uri: foto }} style={styles.fotoImage} />
              <View style={styles.fotoCheck}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
            </View>
          ) : (
            <View style={styles.fotoPlaceholder}>
              <View style={[styles.placeholderIcon, { backgroundColor: posicaoConfig.bg }]}>
                <Ionicons name={posicaoConfig.icon as any} size={32} color={posicaoConfig.cor} />
              </View>
              <Text style={styles.placeholderTitle}>{posicaoConfig.titulo}</Text>
              <Text style={styles.placeholderDesc}>{posicaoConfig.desc}</Text>
              <View style={styles.addButton}>
                <Feather name="plus" size={16} color="white" />
                <Text style={styles.addButtonText}>Adicionar foto</Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // LOADING
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 16, color: '#4b5563' }}>Carregando vacas...</Text>
      </View>
    );
  }

  // SEM VACAS
  if (vacas.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <MaterialCommunityIcons name="cow-off" size={64} color="#9ca3af" />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16 }}>
          Nenhuma vaca encontrada
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
          Volte para o dashboard e puxe para baixo para recarregar
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, marginTop: 24 }}
          onPress={() => router.push('/')}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Ir para Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // SE NÃO HOUVER VACA SELECIONADA, SELECIONA A PRIMEIRA
  if (!selectedVaca && vacas.length > 0) {
    setSelectedVaca(vacas[0]);
    return null;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <Animated.View style={[{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => {
                setRefreshing(true);


                
                carregarDados().then(() => setRefreshing(false));
              }}
              tintColor="#10b981"
            />
          }
        >
          {/* HEADER */}
          <LinearGradient
            colors={['#ffffff', '#f9fafb']}
            style={styles.headerGradient}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.push('/')}
                >
                  <Ionicons name="arrow-back" size={24} color="#4b5563" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.headerTitle}>Monitoramento</Text>
                  <Text style={styles.headerSubtitle}>Registro fotográfico</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.configButton}
                onPress={() => setShowConfigModal(true)}
              >
                <Ionicons name="settings-outline" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* SELETOR DE VACA */}
          <Animated.View 
            style={[
              styles.vacaSelector,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <TouchableOpacity 
              style={styles.vacaSelectorButton}
              onPress={() => setShowVacaSelector(true)}
            >
              <LinearGradient
                colors={['#ffffff', '#fafafa']}
                style={styles.vacaSelectorGradient}
              >
                <View style={styles.vacaSelectorContent}>
                  <View style={styles.vacaIconLarge}>
                    <MaterialCommunityIcons name="cow" size={28} color="#059669" />
                  </View>
                  <View style={styles.vacaInfo}>
                    <Text style={styles.vacaNome}>{selectedVaca?.nome || 'Selecione uma vaca'}</Text>
                    <Text style={styles.vacaBrinco}>Brinco: {selectedVaca?.brinco || '000'}</Text>
                  </View>
                  <View style={styles.fotosCount}>
                    <Text style={styles.fotosCountText}>{getFotosCount()}/3</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* MOLDEIRAS DE FOTO - 3 BOTÕES */}
          <View style={styles.fotosGrid}>
            <FotoPlaceholder 
              posicao="esquerda"
              foto={selectedVaca?.fotos?.esquerda || null}
              onPress={() => abrirCamera('esquerda')}
            />
            <FotoPlaceholder 
              posicao="entrePerdas"
              foto={selectedVaca?.fotos?.entrePerdas || null}
              onPress={() => abrirCamera('entrePerdas')}
            />
            <FotoPlaceholder 
              posicao="direita"
              foto={selectedVaca?.fotos?.direita || null}
              onPress={() => abrirCamera('direita')}
            />
          </View>

          {/* PROGRESSO */}
          <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
            <BlurView intensity={80} tint="light" style={styles.progressBlur}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progresso da Análise</Text>
                <Text style={styles.progressPercentage}>{getFotosCount() * 33}%</Text>
              </View>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    {
                      width: `${(getFotosCount() * 33)}%`,
                      backgroundColor: isProntoParaAnalise() ? '#10b981' : '#f59e0b'
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressHint}>
                {isProntoParaAnalise() 
                  ? '✅ Pronto para analisar!'
                  : `📸 Tire mais ${3 - getFotosCount()} foto(s)`}
              </Text>
            </BlurView>
          </Animated.View>

          {/* BOTÃO DE ANÁLISE */}
          <Animated.View style={[styles.analiseContainer, { opacity: fadeAnim }]}>
            <TouchableOpacity 
              style={[
                styles.analiseButton,
                (!isProntoParaAnalise() || isCalculando) && styles.analiseButtonDisabled
              ]}
              disabled={!isProntoParaAnalise() || isCalculando}
              onPress={handleAnalisarCarrapatos}
            >
              <LinearGradient
                colors={isProntoParaAnalise() 
                  ? ['#059669', '#047857'] 
                  : ['#9ca3af', '#6b7280']}
                style={styles.analiseGradient}
              >
                <Animated.View style={{ transform: [{ scale: isCalculando ? pulseAnim : 1 }] }}>
                  {isCalculando ? (
                    <>
                      <Ionicons name="sync" size={32} color="white" style={styles.analiseIcon} />
                      <Text style={styles.analiseText}>Analisando...</Text>
                      <Text style={styles.analiseSubtext}>Contando carrapatos</Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="bug" size={32} color="white" style={styles.analiseIcon} />
                      <Text style={styles.analiseText}>Analisar Carrapatos</Text>
                      <Text style={styles.analiseSubtext}>
                        {isProntoParaAnalise() 
                          ? 'Clique para iniciar a contagem' 
                          : 'Complete as 3 fotos primeiro'}
                      </Text>
                    </>
                  )}
                </Animated.View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* INFORMAÇÕES ADICIONAIS */}
          <View style={styles.infoContainer}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#059669" />
              <Text style={styles.infoText}>
                Tire fotos dos 3 ângulos para uma análise completa
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* MODAL - SELETOR DE VACAS */}
      <Modal
        visible={showVacaSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVacaSelector(false)}
      >
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Vaca</Text>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => setShowVacaSelector(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={vacas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.vacaItem,
                    selectedVaca?.id === item.id && styles.vacaItemSelected
                  ]}
                  onPress={() => {
                    setSelectedVaca(item);
                    setShowVacaSelector(false);
                  }}
                >
                  <View style={styles.vacaItemLeft}>
                    <View style={[
                      styles.vacaItemIcon,
                      { backgroundColor: selectedVaca?.id === item.id ? '#059669' : '#d1fae5' }
                    ]}>
                      <MaterialCommunityIcons 
                        name="cow" 
                        size={24} 
                        color={selectedVaca?.id === item.id ? 'white' : '#059669'} 
                      />
                    </View>
                    <View>
                      <Text style={styles.vacaItemNome}>{item.nome}</Text>
                      <Text style={styles.vacaItemBrinco}>Brinco: {item.brinco}</Text>
                    </View>
                  </View>
                  {selectedVaca?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.vacaList}
            />
          </View>
        </BlurView>
      </Modal>

      {/* MODAL - CONFIGURAÇÕES */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurações</Text>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => setShowConfigModal(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.configContent}>
              <View style={styles.configSection}>
                <Text style={styles.configSectionTitle}>Número de Vacas</Text>
                <View style={styles.configInputContainer}>
                  <MaterialCommunityIcons name="cow" size={24} color="#059669" />
                  <TextInput
                    style={styles.configInput}
                    value={numeroVacas}
                    onChangeText={setNumeroVacas}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.configInputLabel}>vacas</Text>
                </View>
                <Text style={styles.configHint}>
                  Atualize a quantidade de vacas na sua fazenda
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.configSaveButton}
                onPress={async () => {
                  await atualizarTotalVacas(fazendaId, parseInt(numeroVacas) || 0);
                  setShowConfigModal(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  style={styles.configSaveGradient}
                >
                  <Text style={styles.configSaveText}>Salvar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

// ESTILOS (mantive os mesmos do seu código original)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  configButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vacaSelector: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  vacaSelectorButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vacaSelectorGradient: {
    padding: 16,
  },
  vacaSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vacaIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vacaInfo: {
    flex: 1,
  },
  vacaNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  vacaBrinco: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  fotosCount: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginRight: 12,
  },
  fotosCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  fotosGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  fotoContainer: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  fotoGradient: {
    padding: 16,
    aspectRatio: 0.8,
    justifyContent: 'center',
  },
  fotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  placeholderDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  fotoPreview: {
    flex: 1,
    position: 'relative',
  },
  fotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  fotoCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  progressContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  progressBlur: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 12,
  },
  analiseContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  analiseButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  analiseButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  analiseGradient: {
    padding: 32,
    alignItems: 'center',
  },
  analiseIcon: {
    marginBottom: 12,
  },
  analiseText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analiseSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 16,
  },
  infoText: {
    color: '#065f46',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalClose: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vacaList: {
    paddingBottom: 20,
  },
  vacaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    marginBottom: 12,
  },
  vacaItemSelected: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#059669',
  },
  vacaItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vacaItemIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vacaItemNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  vacaItemBrinco: {
    fontSize: 14,
    color: '#6b7280',
  },
  configContent: {
    paddingVertical: 8,
  },
  configSection: {
    marginBottom: 32,
  },
  configSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  configInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  configInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
    paddingVertical: 8,
  },
  configInputLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },
  configHint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    marginLeft: 4,
  },
  configSaveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  configSaveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  configSaveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});