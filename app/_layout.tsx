import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { db, inicializarFazenda, testFirebaseConnection } from "../firebase/config";

export default function RootLayout() {
  const [risco, setRisco] = useState(78); // Começa com 78
  const [firebaseStatus, setFirebaseStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const fazendaId = "minha-fazenda-001";

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await testarConexao();
    await inicializarFazenda(fazendaId);
    await carregarRisco();
  };

  const testarConexao = async () => {
    const isConnected = await testFirebaseConnection();
    setFirebaseStatus(isConnected ? 'online' : 'offline');
  };

  const carregarRisco = async () => {
    try {
      const docRef = doc(db, "fazendas", fazendaId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setRisco(docSnap.data().risco || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar risco:', error);
    }
  };

  const getRiscoColor = (risco: number): string => {
    if (risco < 30) return '#22c55e';
    if (risco < 60) return '#eab308';
    if (risco < 80) return '#f97316';
    return '#ef4444';
  };

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'index') {
              return focused ? 
                <MaterialCommunityIcons name="gauge" size={26} color={color} /> :
                <MaterialCommunityIcons name="gauge-low" size={26} color={color} />;
            } else if (route.name === 'vacas/index') {
              return <MaterialCommunityIcons name="cow" size={24} color={color} />;
            } else if (route.name === 'historico/index') {
              return <Feather name="calendar" size={24} color={color} />;
            }
            return <Feather name="circle" size={24} color={color} />;
          },
          tabBarActiveTintColor: '#059669',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            height: 85,
            paddingBottom: 25,
            paddingTop: 12,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 2,
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          },
          headerTitleStyle: {
            color: '#0F172A',
            fontSize: 20,
            fontWeight: '700',
          },
          headerTitleAlign: 'left',
          headerShadowVisible: false,
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "CarrapAI",
            tabBarLabel: "Dashboard",
            headerRight: () => (
              <View className="mr-4 flex-row items-center">
                <View className="bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center">
                  <View 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: getRiscoColor(risco) }}
                  />
                  <Text 
                    className="text-sm font-bold"
                    style={{ color: getRiscoColor(risco) }}
                  >
                    {risco}%
                  </Text>
                </View>
                <TouchableOpacity 
                  className="ml-3 bg-emerald-50 p-2 rounded-full"
                  onPress={() => router.push('/vacas')}
                >
                  <FontAwesome5 name="cow" size={18} color="#059669" solid />
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="vacas/index"
          options={{
            title: "Monitoramento",
            tabBarLabel: "Vacas",
            headerRight: () => (
              <View className="mr-4">
                <View className={`px-3 py-1.5 rounded-full flex-row items-center ${
                  firebaseStatus === 'online' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <View className={`w-2 h-2 rounded-full mr-2 ${
                    firebaseStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <Text className={`text-xs font-semibold ${
                    firebaseStatus === 'online' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {firebaseStatus === 'online' ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="vacas/camera"
          options={{
            title: "Câmera",
            href: null,  // 👈 MUDE DE tabBarButton: () => null PARA href: null
            headerShown: true,
          }}
        />

        <Tabs.Screen
          name="historico/index"
          options={{
            title: "Histórico de Infestação",
            tabBarLabel: "Histórico",
          }}
        />
      </Tabs>
    </>
  );
}