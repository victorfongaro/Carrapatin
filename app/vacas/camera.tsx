import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebase/config";
import { CameraVacasProps, ResultadoAnalise, Vaca } from "../../types";

export default function CameraVacas({
  risco,
  onRiscoChange,
}: CameraVacasProps) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vaca, setVaca] = useState<Vaca | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState<"manha" | "tarde">("manha");
  const [etapa, setEtapa] = useState<"camera" | "analise">("camera");
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);
  const fazendaId = "minha-fazenda-001";

  useEffect(() => {
    carregarVaca();
    // Determinar período
    const hora = new Date().getHours();
    setPeriodo(hora < 12 ? "manha" : "tarde");
  }, []);

  const carregarVaca = async () => {
    const docRef = doc(db, "fazendas", fazendaId, "dados", "vacas");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const vacaEncontrada = docSnap
        .data()
        .vacas.find((v: Vaca) => v.id === id);
      setVaca(vacaEncontrada);
    }
  };

  const tirarFoto = async () => {
    if (fotos.length >= 3) {
      Alert.alert("Limite atingido", "Você já tirou 3 fotos");
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Precisamos de acesso à câmera");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFotos([...fotos, result.assets[0].uri]);
    }
  };

  const analisarFotos = async () => {
    setEtapa("analise");
    setAnalisando(true);

    // IA FAKE - Loading de 3 segundos
    setTimeout(() => {
      const resultadoFake: ResultadoAnalise = {
        larvas: Math.floor(Math.random() * 30) + 10,
        ninfas: Math.floor(Math.random() * 20) + 5,
        carrapatos: Math.floor(Math.random() * 15) + 3,
      };

      setResultado(resultadoFake);
      setAnalisando(false);

      // Salvar no Firebase
      salvarResultado(resultadoFake);
    }, 3000);
  };

  const salvarResultado = async (resultadoFake: ResultadoAnalise) => {
    const docRef = doc(db, "fazendas", fazendaId, "dados", "vacas");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const vacas = docSnap.data().vacas;
      const novasVacas = vacas.map((v: Vaca) => {
        if (v.id === id) {
          const fotosAtualizadas = {
            ...v.fotos,
            [periodo]: [...(v.fotos[periodo] || []), ...fotos],
          };

          return {
            ...v,
            fotos: fotosAtualizadas,
            carrapatosDetectados: resultadoFake.carrapatos,
            ultimaAnalise: new Date(),
          };
        }
        return v;
      });

      await setDoc(docRef, { vacas: novasVacas }, { merge: true });

      // Atualizar risco global da fazenda
      const totalCarrapatos = novasVacas.reduce(
        (acc: number, v: Vaca) => acc + (v.carrapatosDetectados || 0),
        0,
      );
      const novoRiscoBase = Math.min(100, totalCarrapatos * 2);
      onRiscoChange(novoRiscoBase);
    }
  };

  if (!vaca) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500">Carregando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold">{vaca.nome}</Text>
          <Text className="text-xs text-gray-500">
            {periodo === "manha"
              ? "🌅 Ordenha da manhã"
              : "🌇 Ordenha da tarde"}
          </Text>
        </View>
      </View>

      {etapa === "camera" ? (
        <ScrollView className="flex-1 p-4">
          <Text className="text-sm text-gray-600 mb-4">
            Tire 3 fotos do úbere para análise:
          </Text>

          {/* Grid de fotos */}
          <View className="flex-row flex-wrap justify-between">
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                className="w-[32%] aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                {fotos[index] ? (
                  <Image
                    source={{ uri: fotos[index] }}
                    className="w-full h-full"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Feather name="camera" size={32} color="#9ca3af" />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Botões */}
          <View className="mt-6 space-y-3">
            {fotos.length < 3 && (
              <TouchableOpacity
                onPress={tirarFoto}
                className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center"
              >
                <Feather name="camera" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Tirar Foto ({fotos.length}/3)
                </Text>
              </TouchableOpacity>
            )}

            {fotos.length === 3 && (
              <TouchableOpacity
                onPress={analisarFotos}
                className="bg-emerald-600 py-4 rounded-xl flex-row items-center justify-center"
              >
                <Feather name="cpu" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Analisar Fotos
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 p-4 items-center justify-center">
          {analisando ? (
            <>
              <View className="items-center">
                <Text className="text-6xl mb-4">🔬</Text>
                <Text className="text-2xl font-bold mb-2">
                  Analisando imagens...
                </Text>
                <Text className="text-gray-500">
                  IA processando fotos do úbere
                </Text>

                {/* Barra de progresso */}
                <View className="w-64 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
                  <View
                    className="h-full bg-emerald-600"
                    style={{
                      width: "70%",
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                    }}
                  />
                </View>
              </View>
            </>
          ) : (
            resultado && (
              <ScrollView className="w-full">
                <View className="items-center mb-6">
                  <Text className="text-6xl mb-4">✅</Text>
                  <Text className="text-2xl font-bold">Análise Concluída!</Text>
                </View>

                {/* Resultados */}
                <View className="flex-row justify-around mb-6">
                  <View className="bg-orange-50 p-4 rounded-xl items-center">
                    <Text className="text-2xl">🥚</Text>
                    <Text className="text-2xl font-bold text-orange-700">
                      {resultado.larvas}
                    </Text>
                    <Text className="text-xs text-gray-600">Larvas</Text>
                  </View>
                  <View className="bg-yellow-50 p-4 rounded-xl items-center">
                    <Text className="text-2xl">🐛</Text>
                    <Text className="text-2xl font-bold text-yellow-700">
                      {resultado.ninfas}
                    </Text>
                    <Text className="text-xs text-gray-600">Ninfas</Text>
                  </View>
                  <View className="bg-red-50 p-4 rounded-xl items-center">
                    <Text className="text-2xl">🕷️</Text>
                    <Text className="text-2xl font-bold text-red-700">
                      {resultado.carrapatos}
                    </Text>
                    <Text className="text-xs text-gray-600">Carrapatos</Text>
                  </View>
                </View>

                {/* Alerta */}
                {resultado.carrapatos > 10 && (
                  <View className="bg-red-100 border-l-4 border-red-500 p-4 rounded mb-6">
                    <Text className="font-bold text-red-800">
                      ⚠️ Alerta de Infestação
                    </Text>
                    <Text className="text-sm text-red-600">
                      Alta carga de carrapatos detectada!
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => router.back()}
                  className="bg-emerald-600 py-4 rounded-xl"
                >
                  <Text className="text-white text-center font-semibold">
                    Voltar para lista
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )
          )}
        </View>
      )}
    </View>
  );
}
