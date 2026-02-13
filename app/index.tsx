import { View, Text, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Velocimetro } from '../components/Velocimetro';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Fazenda, DashboardProps } from './types';

export default function Dashboard({ risco, onRiscoChange }: DashboardProps) {
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarFazendas();
  }, []);

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
      
      setFazendas(lista);
    } catch (error) {
      // Dados mock
      setFazendas([
        { id: '1', nome: 'Fazenda Boa Vista', risco: 78, latitude: -21.24, longitude: -45.15 },
        { id: '2', nome: 'Sítio Esperança', risco: 92, latitude: -21.25, longitude: -45.16 },
        { id: '3', nome: 'Fazenda Santa Fé', risco: 34, latitude: -21.23, longitude: -45.14 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (risco: number) => {
    if (risco < 30) return '#22c55e';
    if (risco < 60) return '#eab308';
    if (risco < 80) return '#f97316';
    return '#ef4444';
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* VELOCÍMETRO */}
      <View className="bg-white m-4 p-6 rounded-2xl shadow-lg">
        <Text className="text-xl font-bold text-gray-800 mb-2">
          Nível de Contaminação
        </Text>
        <Text className="text-sm text-gray-500 mb-4">
          Fazenda São João
        </Text>
        
        <View className="items-center">
          <Velocimetro risco={risco} size="lg" />
        </View>

        {/* Alerta climático */}
        <View className="mt-4 p-3 bg-blue-50 rounded-lg">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl">🌧️☀️</Text>
            <View className="flex-1">
              <Text className="text-sm font-medium text-blue-800">
                Clima quente pós-chuva detectado
              </Text>
              <Text className="text-xs text-blue-600">
                Alta probabilidade de proliferação - Risco amplificado em 1.5x
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* MAPA */}
      <View className="bg-white m-4 p-4 rounded-2xl shadow-lg">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold text-gray-800">
            Produtores Próximos
          </Text>
          <View className="bg-gray-100 px-3 py-1 rounded-full">
            <Text className="text-xs">
              {fazendas.length} fazendas
            </Text>
          </View>
        </View>
        
        <View className="h-96 w-full rounded-xl overflow-hidden border border-gray-200">
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: -21.244,
              longitude: -45.147,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {fazendas.map((fazenda) => (
              <Marker
                key={fazenda.id}
                coordinate={{
                  latitude: fazenda.latitude,
                  longitude: fazenda.longitude,
                }}
              >
                <View className="items-center">
                  <View style={{
                    backgroundColor: getMarkerColor(fazenda.risco),
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 3,
                    borderColor: 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }} />
                  <View className="bg-white px-2 py-1 rounded-full mt-1">
                    <Text className="text-xs font-semibold">
                      {fazenda.risco}%
                    </Text>
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Legenda */}
        <View className="flex-row flex-wrap gap-3 mt-3">
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 rounded-full bg-green-500" />
            <Text className="text-xs">Baixo (0-30%)</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 rounded-full bg-yellow-500" />
            <Text className="text-xs">Médio (31-60%)</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 rounded-full bg-orange-500" />
            <Text className="text-xs">Alto (61-80%)</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 rounded-full bg-red-500" />
            <Text className="text-xs">Crítico (81-100%)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}