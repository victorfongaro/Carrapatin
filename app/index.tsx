import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  RefreshControl, Dimensions 
} from 'react-native';
import { Velocimetro } from '../components/Velocimetro';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { db, testFirebaseConnection } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Fazenda, DashboardProps } from './types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Dashboard({ risco, onRiscoChange }: DashboardProps) {
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFazenda, setSelectedFazenda] = useState<Fazenda | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [mapRegion, setMapRegion] = useState({
    latitude: -21.244,
    longitude: -45.147,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    checkFirebase();
    carregarFazendas();
  }, []);

  const checkFirebase = async () => {
    const isConnected = await testFirebaseConnection();
    setFirebaseStatus(isConnected ? 'online' : 'offline');
  };

  const carregarFazendas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'fazendas'));
      const lista: Fazenda[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        lista.push({
          id: doc.id,
          nome: data.nome || 'Fazenda sem nome',
          risco: data.risco || Math.floor(Math.random() * 100),
          latitude: data.latitude || -21.244 + (Math.random() * 0.1 - 0.05),
          longitude: data.longitude || -45.147 + (Math.random() * 0.1 - 0.05),
        });
      });
      
      if (lista.length === 0) {
        // Dados mock se não houver dados
        setFazendas([
          { id: '1', nome: 'Fazenda Boa Vista', risco: 78, latitude: -21.24, longitude: -45.15 },
          { id: '2', nome: 'Sítio Esperança', risco: 92, latitude: -21.25, longitude: -45.16 },
          { id: '3', nome: 'Fazenda Santa Fé', risco: 34, latitude: -21.23, longitude: -45.14 },
          { id: '4', nome: 'Rancho Alegre', risco: 45, latitude: -21.22, longitude: -45.13 },
          { id: '5', nome: 'Fazenda São José', risco: 67, latitude: -21.26, longitude: -45.14 },
        ]);
      } else {
        setFazendas(lista);
      }
    } catch (error) {
      console.error('Erro ao carregar fazendas:', error);
      // Dados mock em caso de erro
      setFazendas([
        { id: '1', nome: 'Fazenda Boa Vista', risco: 78, latitude: -21.24, longitude: -45.15 },
        { id: '2', nome: 'Sítio Esperança', risco: 92, latitude: -21.25, longitude: -45.16 },
        { id: '3', nome: 'Fazenda Santa Fé', risco: 34, latitude: -21.23, longitude: -45.14 },
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkFirebase();
    await carregarFazendas();
    setRefreshing(false);
  };

  const getMarkerColor = (risco: number) => {
    if (risco < 30) return '#22c55e';
    if (risco < 60) return '#eab308';
    if (risco < 80) return '#f97316';
    return '#ef4444';
  };

  const getRiscoStatus = (risco: number) => {
    if (risco < 30) return { label: 'Baixo', color: '#22c55e', bg: '#dcfce7' };
    if (risco < 60) return { label: 'Médio', color: '#eab308', bg: '#fef9c3' };
    if (risco < 80) return { label: 'Alto', color: '#f97316', bg: '#ffedd5' };
    return { label: 'Crítico', color: '#ef4444', bg: '#fee2e2' };
  };

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Firebase */}
      <View className="px-4 pt-4">
        <View className={`flex-row items-center justify-between p-3 rounded-xl ${
          firebaseStatus === 'online' ? 'bg-green-50' : 
          firebaseStatus === 'offline' ? 'bg-red-50' : 'bg-yellow-50'
        }`}>
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${
              firebaseStatus === 'online' ? 'bg-green-500' :
              firebaseStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <Text className={`text-sm font-medium ${
              firebaseStatus === 'online' ? 'text-green-700' :
              firebaseStatus === 'offline' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {firebaseStatus === 'online' ? 'Firebase Online' :
               firebaseStatus === 'offline' ? 'Firebase Offline' : 'Verificando...'}
            </Text>
          </View>
          {firebaseStatus === 'offline' && (
            <TouchableOpacity onPress={checkFirebase}>
              <Feather name="refresh-cw" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Header com Saudação */}
      <View className="bg-white px-6 pt-6 pb-4 mt-2">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-800">
              Olá, Produtor 👋
            </Text>
            <Text className="text-gray-500 mt-1">
              Acompanhe o status da sua fazenda
            </Text>
          </View>
          <TouchableOpacity 
            className="bg-emerald-50 p-3 rounded-full"
            onPress={() => router.push('/vacas')}
          >
            <MaterialCommunityIcons name="cow" size={24} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Card do Velocímetro */}
      <View className="mx-4 mt-2">
        <View className="bg-white rounded-3xl shadow-lg p-6">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-lg font-semibold text-gray-800">
                Nível de Contaminação
              </Text>
              <Text className="text-sm text-gray-500">
                Fazenda São João
              </Text>
            </View>
            <View 
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: getRiscoStatus(risco).bg }}
            >
              <Text style={{ color: getRiscoStatus(risco).color }} className="font-bold">
                {getRiscoStatus(risco).label}
              </Text>
            </View>
          </View>
          
          <View className="items-center py-2">
            <Velocimetro risco={risco} size="lg" />
          </View>

          {/* Stats Rápidos */}
          <View className="flex-row justify-between mt-6 pt-4 border-t border-gray-100">
            <View className="items-center flex-1">
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-1">
                <Feather name="map-pin" size={20} color="#3b82f6" />
              </View>
              <Text className="text-xs text-gray-500">Fazendas</Text>
              <Text className="text-lg font-bold text-gray-800">{fazendas.length}</Text>
            </View>
            <View className="items-center flex-1">
              <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center mb-1">
                <Feather name="thermometer" size={20} color="#f97316" />
              </View>
              <Text className="text-xs text-gray-500">Temperatura</Text>
              <Text className="text-lg font-bold text-gray-800">28°C</Text>
            </View>
            <View className="items-center flex-1">
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-1">
                <Feather name="droplet" size={20} color="#3b82f6" />
              </View>
              <Text className="text-xs text-gray-500">Umidade</Text>
              <Text className="text-lg font-bold text-gray-800">85%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Alerta Climático */}
      <View className="mx-4 mt-4">
        <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg">
          <View className="flex-row items-center">
            <View className="bg-white/20 rounded-full p-3 mr-4">
              <Feather name="cloud-rain" size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">
                Alerta Climático
              </Text>
              <Text className="text-white/90 text-sm mt-1">
                Alta probabilidade de proliferação de carrapatos
              </Text>
              <View className="flex-row items-center mt-2">
                <View className="bg-white/30 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    Risco amplificado em 1.5x
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Mapa */}
      <View className="mx-4 mt-6 mb-4">
        <View className="bg-white rounded-3xl shadow-lg p-5">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-lg font-bold text-gray-800">
                Produtores Próximos
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {fazendas.length} fazendas na região
              </Text>
            </View>
            <TouchableOpacity 
              className="bg-gray-100 p-2 rounded-full"
              onPress={onRefresh}
            >
              <Feather name="refresh-cw" size={18} color="#4b5563" />
            </TouchableOpacity>
          </View>
          
          <View className="h-80 w-full rounded-2xl overflow-hidden border border-gray-200">
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={mapRegion}
              onRegionChangeComplete={setMapRegion}
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
                  <View className="items-center">
                    <View style={{
                      backgroundColor: getMarkerColor(fazenda.risco),
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      borderWidth: 3,
                      borderColor: 'white',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text className="text-white font-bold text-xs">
                        {fazenda.risco}%
                      </Text>
                    </View>
                    <View className="bg-white px-2 py-1 rounded-full mt-1 shadow-sm">
                      <Text className="text-xs font-medium text-gray-700">
                        {fazenda.nome.split(' ')[0]}
                      </Text>
                    </View>
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>

          {/* Card da Fazenda Selecionada */}
          {selectedFazenda && (
            <View className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center">
                  <View 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getMarkerColor(selectedFazenda.risco) }}
                  />
                  <View>
                    <Text className="font-bold text-gray-800">
                      {selectedFazenda.nome}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Última atualização: agora
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedFazenda(null)}>
                  <Feather name="x" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              
              <View className="flex-row justify-between items-center mt-3">
                <View>
                  <Text className="text-xs text-gray-500">Nível de risco</Text>
                  <View className="flex-row items-center">
                    <Text 
                      className="text-2xl font-bold mr-2"
                      style={{ color: getMarkerColor(selectedFazenda.risco) }}
                    >
                      {selectedFazenda.risco}%
                    </Text>
                    <View 
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: getRiscoStatus(selectedFazenda.risco).bg }}
                    >
                      <Text 
                        className="text-xs font-semibold"
                        style={{ color: getRiscoStatus(selectedFazenda.risco).color }}
                      >
                        {getRiscoStatus(selectedFazenda.risco).label}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  className="bg-emerald-600 px-4 py-2.5 rounded-lg flex-row items-center"
                  onPress={() => {
                    const novoRisco = Math.min(100, Math.round(risco + selectedFazenda.risco * 0.15));
                    onRiscoChange(novoRisco);
                    setSelectedFazenda(null);
                  }}
                >
                  <Feather name="download" size={16} color="white" />
                  <Text className="text-white text-xs font-semibold ml-1">
                    Importar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Legenda */}
          <View className="flex-row flex-wrap gap-3 mt-4 pt-2">
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-green-500" />
              <Text className="text-xs text-gray-600">Baixo (0-30%)</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-yellow-500" />
              <Text className="text-xs text-gray-600">Médio (31-60%)</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-orange-500" />
              <Text className="text-xs text-gray-600">Alto (61-80%)</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-red-500" />
              <Text className="text-xs text-gray-600">Crítico (81-100%)</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}