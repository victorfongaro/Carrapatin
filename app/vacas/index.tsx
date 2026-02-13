import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../firebase/config";
import { Vaca } from "../../types";

export default function VacasLista() {
  const [numeroVacas, setNumeroVacas] = useState("");
  const [vacas, setVacas] = useState<Vaca[]>([]);
  const [etapa, setEtapa] = useState<"config" | "lista">("config");
  const fazendaId = "minha-fazenda-001";

  useEffect(() => {
    carregarVacas();
  }, []);

  const carregarVacas = async () => {
    const docRef = doc(db, "fazendas", fazendaId, "dados", "vacas");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setVacas(data.vacas || []);
      if (data.vacas?.length > 0) {
        setEtapa("lista");
      }
    }
  };

  const salvarNumeroVacas = async () => {
    const quantidade = parseInt(numeroVacas);
    if (quantidade <= 0) return;

    const novasVacas: Vaca[] = [];
    for (let i = 1; i <= quantidade; i++) {
      novasVacas.push({
        id: `vaca-${Date.now()}-${i}`,
        nome: `Vaca ${i}`,
        numero: i.toString(),
        fotos: { manha: [], tarde: [] },
        carrapatosDetectados: 0,
        ultimaAnalise: null,
      });
    }

    setVacas(novasVacas);

    const docRef = doc(db, "fazendas", fazendaId, "dados", "vacas");
    await setDoc(docRef, { vacas: novasVacas });

    setEtapa("lista");
  };

  const atualizarApelido = async (vacaId: string, novoNome: string) => {
    const novasVacas = vacas.map((v) =>
      v.id === vacaId ? { ...v, nome: novoNome } : v,
    );
    setVacas(novasVacas);

    const docRef = doc(db, "fazendas", fazendaId, "dados", "vacas");
    await setDoc(docRef, { vacas: novasVacas }, { merge: true });
  };

  if (etapa === "config") {
    return (
      <View className="flex-1 bg-white p-6">
        <View className="items-center mt-10">
          <Text className="text-6xl mb-4">🐄</Text>
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Primeiro acesso
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Quantas vacas você tem na fazenda?
          </Text>

          <TextInput
            className="w-full border-2 border-gray-200 rounded-xl p-4 text-2xl text-center mb-4"
            keyboardType="numeric"
            value={numeroVacas}
            onChangeText={setNumeroVacas}
            placeholder="0"
          />

          <TouchableOpacity
            className={`w-full py-4 rounded-xl ${
              numeroVacas ? "bg-emerald-600" : "bg-gray-300"
            }`}
            disabled={!numeroVacas}
            onPress={salvarNumeroVacas}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Cadastrar Vacas
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-2xl font-bold text-gray-800">Suas Vacas</Text>
        <View className="bg-emerald-100 px-3 py-1 rounded-full">
          <Text className="text-emerald-800 text-sm">{vacas.length} vacas</Text>
        </View>
      </View>

      <FlatList
        data={vacas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: vaca }) => (
          <View className="bg-white rounded-xl shadow-sm p-4 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-3xl">🐂</Text>
                <View>
                  <TextInput
                    className="font-semibold text-gray-800 border-b border-gray-200"
                    value={vaca.nome}
                    onChangeText={(text) => atualizarApelido(vaca.id, text)}
                  />
                  <Text className="text-xs text-gray-500">
                    Nº {vaca.numero}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                {vaca.carrapatosDetectados > 0 && (
                  <View className="bg-red-100 px-2 py-1 rounded-full">
                    <Text className="text-xs text-red-700">
                      {vaca.carrapatosDetectados} carrapatos
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  className="bg-emerald-600 p-3 rounded-full"
                  onPress={() =>
                    router.push({
                      pathname: "/vacas/camera" as any,
                      params: { id: vaca.id },
                    })
                  }
                >
                  <Feather name="camera" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Status das fotos */}
            <View className="flex-row gap-2 mt-2">
              <View
                className={`px-2 py-1 rounded ${
                  vaca.fotos.manha.length >= 3 ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs ${
                    vaca.fotos.manha.length >= 3
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  🌅 Manhã: {vaca.fotos.manha.length}/3
                </Text>
              </View>
              <View
                className={`px-2 py-1 rounded ${
                  vaca.fotos.tarde.length >= 3 ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs ${
                    vaca.fotos.tarde.length >= 3
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  🌇 Tarde: {vaca.fotos.tarde.length}/3
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}
