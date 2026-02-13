import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Velocimetro } from '../components/Velocimetro';
import { Fazenda } from '../types/index';
import {styles} from './styles/styles';
const { width } = Dimensions.get('window');

export default function Dashboard({ risco = 78, onRiscoChange = (value: number) => {} }) {
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFazenda, setSelectedFazenda] = useState<Fazenda | null>(null);
  const [mapRegion] = useState({
    latitude: -21.244,
    longitude: -45.147,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    carregarFazendas();
    
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
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const carregarFazendas = async () => {
    setFazendas([
      { 
        id: '1', 
        nome: 'Fazenda Boa Vista', 
        risco: 78, 
        latitude: -21.24, 
        longitude: -45.15,
        ultimaAtualizacao: '2 min atrás',
        vacas: 145,
        area: '320 ha'
      },
      { 
        id: '2', 
        nome: 'Sítio Esperança', 
        risco: 92, 
        latitude: -21.25, 
        longitude: -45.16,
        ultimaAtualizacao: '5 min atrás',
        vacas: 78,
        area: '180 ha'
      },
      { 
        id: '3', 
        nome: 'Fazenda Santa Fé', 
        risco: 34, 
        latitude: -21.23, 
        longitude: -45.14,
        ultimaAtualizacao: '15 min atrás',
        vacas: 210,
        area: '450 ha'
      },
      { 
        id: '4', 
        nome: 'Rancho Alegre', 
        risco: 45, 
        latitude: -21.22, 
        longitude: -45.13,
        ultimaAtualizacao: '1 min atrás',
        vacas: 92,
        area: '200 ha'
      },
      { 
        id: '5', 
        nome: 'Fazenda São José', 
        risco: 67, 
        latitude: -21.26, 
        longitude: -45.14,
        ultimaAtualizacao: '8 min atrás',
        vacas: 167,
        area: '380 ha'
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarFazendas();
    setRefreshing(false);
  };

  const getMarkerColor = (risco: number) => {
    if (risco < 30) return '#10b981';
    if (risco < 60) return '#f59e0b';
    if (risco < 80) return '#f97316';
    return '#ef4444';
  };

  const getRiscoStatus = (risco: number) => {
    if (risco < 30) return { 
      label: 'Baixo', 
      color: '#10b981', 
      bg: '#d1fae5',
      icon: 'checkmark-circle',
    };
    if (risco < 60) return { 
      label: 'Médio', 
      color: '#f59e0b', 
      bg: '#fef3c7',
      icon: 'alert-circle',
    };
    if (risco < 80) return { 
      label: 'Alto', 
      color: '#f97316', 
      bg: '#ffedd5',
      icon: 'warning',
    };
    return { 
      label: 'Crítico', 
      color: '#ef4444', 
      bg: '#fee2e2',
      icon: 'skull',
    };
  };

  const getWeatherIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return 'sunny';
    return 'moon';
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
        {/* HEADER */}
        <LinearGradient
          colors={['#ffffff', '#f9fafb']}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <Animated.View 
              style={[
                styles.headerLeft,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }]
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <MaterialCommunityIcons name="cow" size={28} color="#059669" />
                </View>
                <View>
                  <Text style={styles.logoText}>
                    Carrap<Text style={styles.logoHighlight}>AI</Text>
                  </Text>
                  <Text style={styles.dateText}>
                    {new Date().toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => router.push('/vacas')}
              >
                <Ionicons name="settings-outline" size={24} color="#4b5563" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>

        {/* CARD DE BOAS-VINDAS */}
        <Animated.View 
          style={[
            styles.welcomeCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#0f766e', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeRow}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeBadge}>
                  🌱 BEM-VINDO, PRODUTOR
                </Text>
                <Text style={styles.welcomeName}>
                  João Mendes
                </Text>
                <View style={styles.weatherContainer}>
                  <View style={styles.weatherBadge}>
                    <Ionicons name={getWeatherIcon()} size={18} color="white" />
                    <Text style={styles.weatherText}>
                      28°C • Umidade 85%
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.weatherIcon}>
                <MaterialCommunityIcons name="weather-pouring" size={32} color="white" />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* VELOCÍMETRO */}
        <Animated.View 
          style={[
            styles.speedometerCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.speedometerContainer}>
            <LinearGradient
              colors={['#ffffff', '#fafafa']}
              style={styles.speedometerGradient}
            >
              <View style={styles.speedometerHeader}>
                <View>
                  <Text style={styles.speedometerTitle}>
                    Nível de Contaminação
                  </Text>
                  <Text style={styles.speedometerSubtitle}>
                    Fazenda Boa Vista
                  </Text>
                </View>
                <View 
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRiscoStatus(risco).bg }
                  ]}
                >
                  <Ionicons 
                    name={getRiscoStatus(risco).icon as any} 
                    size={18} 
                    color={getRiscoStatus(risco).color} 
                  />
                  <Text 
                    style={[
                      styles.riskText,
                      { color: getRiscoStatus(risco).color }
                    ]}
                  >
                    {getRiscoStatus(risco).label}
                  </Text>
                </View>
              </View>
              
              <View style={styles.velocimetroWrapper}>
                <Velocimetro risco={risco} size="lg" />
              </View>

              {/* STATS */}
              <View style={styles.statsContainer}>
                {[
                  { icon: 'map-pin', label: 'Fazendas', value: fazendas.length, color: '#3b82f6', bg: '#eff6ff' },
                  { icon: 'thermometer', label: 'Temperatura', value: '28°C', color: '#f97316', bg: '#fff7ed' },
                  { icon: 'droplet', label: 'Umidade', value: '85%', color: '#3b82f6', bg: '#eff6ff' },
                ].map((item, index) => (
                  <View key={index} style={styles.statItem}>
                    <View 
                      style={[
                        styles.statIcon,
                        { backgroundColor: item.bg }
                      ]}
                    >
                      <Feather name={item.icon as any} size={22} color={item.color} />
                    </View>
                    <Text style={styles.statLabel}>{item.label}</Text>
                    <Text style={styles.statValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* ALERTA CLIMÁTICO */}
        <Animated.View 
          style={[
            styles.alertCard,
            { opacity: fadeAnim }
          ]}
        >
          <LinearGradient
            colors={['#1e40af', '#2563eb', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.alertGradient}
          >
            <View style={styles.alertRow}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={32} color="white" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  🚨 Alerta de Proliferação
                </Text>
                <Text style={styles.alertDescription}>
                  Chuva prevista + calor intenso = risco 3.5x maior
                </Text>
                <View style={styles.alertBadgeContainer}>
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>
                      Próximas 48h • Crítico
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* MAPA */}
        <Animated.View 
          style={[
            styles.mapCard,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.mapContainer}>
            <LinearGradient
              colors={['#ffffff', '#fafafa']}
              style={styles.mapGradient}
            >
              <View style={styles.mapHeader}>
                <View>
                  <Text style={styles.mapTitle}>
                    🗺️ Produtores Próximos
                  </Text>
                  <Text style={styles.mapSubtitle}>
                    {fazendas.length} propriedades na região
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={onRefresh}
                >
                  <Feather name="refresh-cw" size={18} color="#4b5563" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.mapWrapper}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={mapRegion}
                >
                  {fazendas.map((fazenda) => (
                    <Marker
                      key={fazenda.id}
                      coordinate={{
                        latitude: fazenda.latitude,
                        longitude: fazenda.longitude,
                      }}
                      onPress={() => setSelectedFazenda(fazenda)}
                    >
                      <View style={styles.markerContainer}>
                        <LinearGradient
                          colors={[getMarkerColor(fazenda.risco), getMarkerColor(fazenda.risco) + 'dd']}
                          style={styles.marker}
                        >
                          <Text style={styles.markerText}>
                            {fazenda.risco}%
                          </Text>
                        </LinearGradient>
                        <BlurView 
                          intensity={80} 
                          tint="light"
                          style={styles.markerLabel}
                        >
                          <Text style={styles.markerLabelText}>
                            {fazenda.nome.split(' ')[0]}
                          </Text>
                        </BlurView>
                      </View>
                    </Marker>
                  ))}
                </MapView>
              </View>

              {/* CARD DA FAZENDA SELECIONADA */}
              {selectedFazenda && (
                <View style={styles.selectedFarmCard}>
                  <View style={styles.selectedFarmHeader}>
                    <View style={styles.selectedFarmInfo}>
                      <LinearGradient
                        colors={[getMarkerColor(selectedFazenda.risco), getMarkerColor(selectedFazenda.risco) + 'dd']}
                        style={styles.selectedFarmDot}
                      />
                      <View>
                        <Text style={styles.selectedFarmName}>
                          {selectedFazenda.nome}
                        </Text>
                        <Text style={styles.selectedFarmUpdate}>
                          Atualizado {selectedFazenda.ultimaAtualizacao}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setSelectedFazenda(null)}
                      style={styles.closeButton}
                    >
                      <Feather name="x" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.selectedFarmStats}>
                    <View style={styles.selectedFarmStat}>
                      <Text style={styles.statLabel}>Vacas</Text>
                      <Text style={styles.statValueLarge}>
                        {selectedFazenda.vacas}
                      </Text>
                    </View>
                    <View style={styles.selectedFarmStat}>
                      <Text style={styles.statLabel}>Área</Text>
                      <Text style={styles.statValueLarge}>
                        {selectedFazenda.area}
                      </Text>
                    </View>
                    <View style={styles.selectedFarmStat}>
                      <Text style={styles.statLabel}>Risco</Text>
                      <View style={styles.riskRow}>
                        <Text 
                          style={[
                            styles.riskValue,
                            { color: getMarkerColor(selectedFazenda.risco) }
                          ]}
                        >
                          {selectedFazenda.risco}%
                        </Text>
                        <View 
                          style={[
                            styles.riskBadgeSmall,
                            { backgroundColor: getRiscoStatus(selectedFazenda.risco).bg }
                          ]}
                        >
                          <Text 
                            style={[
                              styles.riskTextSmall,
                              { color: getRiscoStatus(selectedFazenda.risco).color }
                            ]}
                          >
                            {getRiscoStatus(selectedFazenda.risco).label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.importButton}
                    onPress={() => {
                      if (onRiscoChange) {
                        const novoRisco = Math.min(100, Math.round(risco + selectedFazenda.risco * 0.15));
                        onRiscoChange(novoRisco);
                      }
                      setSelectedFazenda(null);
                    }}
                  >
                    <Feather name="download-cloud" size={18} color="white" />
                    <Text style={styles.importButtonText}>
                      Importar dados de risco
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* LEGENDA */}
              <View style={styles.legendContainer}>
                {[
                  { color: '#10b981', label: 'Baixo (0-30%)' },
                  { color: '#f59e0b', label: 'Médio (31-60%)' },
                  { color: '#f97316', label: 'Alto (61-80%)' },
                  { color: '#ef4444', label: 'Crítico (81-100%)' },
                ].map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View 
                      style={[
                        styles.legendDot,
                        { backgroundColor: item.color }
                      ]}
                    />
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Atualizado em tempo real • CarrapAI v1.0
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
