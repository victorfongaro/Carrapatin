import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { 
  db, 
  inicializarFazenda, 
  testFirebaseConnection,
 // ✅ IMPORTAR AQUI
} from "../firebase/config";
import { criarVacasTeste } from '../firebase/services';
export default function RootLayout() {
  const [risco, setRisco] = useState(78);
  const [firebaseStatus, setFirebaseStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const fazendaId = "minha-fazenda-001";

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await testarConexao();
    await inicializarFazenda(fazendaId);
    await criarVacasTeste(fazendaId); // ✅ CRIAR VACAS AUTOMATICAMENTE!
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
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 2,
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          },
          headerTitleStyle: {
            color: '#0F172A',
            fontSize: 20,
            fontWeight: '700',
          },
          headerTitleAlign: 'left',
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "CarrapAI",
            tabBarLabel: "Dashboard",
            headerRight: () => (
              <View style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: getRiscoColor(risco) }} />
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: getRiscoColor(risco) }}>
                    {risco}%
                  </Text>
                </View>
                <TouchableOpacity 
                  style={{ marginLeft: 12, backgroundColor: '#d1fae5', padding: 8, borderRadius: 20 }}
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
          }}
        />

        <Tabs.Screen
          name="vacas/camera"
          options={{
            title: "Câmera",
            href: null,
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