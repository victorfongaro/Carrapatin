import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { db } from "../firebase/config";
export default function RootLayout() {
  const [riscoTotal, setRiscoTotal] = useState(0);
  const fazendaId = "minha-fazenda-001";

  useEffect(() => {
    const carregarRisco = async () => {
      const docRef = doc(db, "fazendas", fazendaId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setRiscoTotal(docSnap.data().risco || 0);
      } else {
        await setDoc(docRef, {
          nome: "Minha Fazenda",
          risco: 0,
          createdAt: new Date(),
        });
      }
    };

    carregarRisco();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarActiveTintColor: "#059669",
          tabBarInactiveTintColor: "#6B7280",
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
          headerTitleStyle: {
            color: "#065F46",
            fontSize: 18,
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarLabel: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={24} color={color} />
            ),
            headerTitle: "Carrapai",
            headerRight: () => (
              <View className="mr-4">
                <Text
                  className={`text-lg font-bold ${
                    riscoTotal < 30
                      ? "text-green-600"
                      : riscoTotal < 60
                        ? "text-yellow-600"
                        : riscoTotal < 80
                          ? "text-orange-600"
                          : "text-red-600"
                  }`}
                >
                  {riscoTotal}%
                </Text>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="vacas/index"
          options={{
            title: "Vacas",
            tabBarLabel: "Vacas",
            tabBarIcon: ({ color, size }) => (
              <Feather name="camera" size={24} color={color} />
            ),
            headerTitle: "Monitoramento das Vacas",
          }}
        />

        <Tabs.Screen
          name="vacas/camera"
          options={{
            title: "Câmera",
            tabBarButton: () => null, // Esconde da navbar
            tabBarStyle: { display: "none" },
            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="historico/index"
          options={{
            title: "Histórico",
            tabBarLabel: "Histórico",
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={24} color={color} />
            ),
            headerTitle: "Histórico de Infestação",
          }}
        />
      </Tabs>
    </>
  );
}
