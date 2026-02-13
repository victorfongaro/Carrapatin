import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../firebase/config";
import { HistoricoProps } from "../types";

type MesId = "jan" | "fev" | "mar" | "abr" | "mai" | "jun";

interface Mes {
  id: MesId;
  nome: string;
  infestacao: number;
  cor: string;
  nivel: string;
}

export function Historico({
  multiplicador,
  onMultiplicadorChange,
  onRiscoChange,
}: HistoricoProps) {
  const [mesesSelecionados, setMesesSelecionados] = useState<MesId[]>([]);
  const fazendaId = "minha-fazenda-001";

  const meses: Mes[] = [
    {
      id: "jan",
      nome: "Janeiro/2026",
      infestacao: 85,
      cor: "bg-red-500",
      nivel: "Crítico",
    },
    {
      id: "fev",
      nome: "Fevereiro/2026",
      infestacao: 72,
      cor: "bg-red-400",
      nivel: "Alto",
    },
    {
      id: "mar",
      nome: "Março/2026",
      infestacao: 45,
      cor: "bg-yellow-500",
      nivel: "Médio",
    },
    {
      id: "abr",
      nome: "Abril/2026",
      infestacao: 30,
      cor: "bg-green-500",
      nivel: "Baixo",
    },
    {
      id: "mai",
      nome: "Maio/2026",
      infestacao: 28,
      cor: "bg-green-500",
      nivel: "Baixo",
    },
    {
      id: "jun",
      nome: "Junho/2026",
      infestacao: 15,
      cor: "bg-green-400",
      nivel: "Baixo",
    },
  ];

  const toggleMes = (mesId: MesId) => {
    setMesesSelecionados((prev) => {
      if (prev.includes(mesId)) {
        return prev.filter((m) => m !== mesId);
      } else {
        if (prev.length >= 3) {
          Alert.alert("Limite atingido", "Selecione no máximo 3 meses");
          return prev;
        }
        return [...prev, mesId];
      }
    });
  };

  const calcularMultiplicador = (): number => {
    if (mesesSelecionados.length === 0) {
      return 1.0;
    }

    const mediaInfestacao =
      mesesSelecionados.reduce((acc, mesId) => {
        const mes = meses.find((m) => m.id === mesId);
        return acc + (mes?.infestacao || 0);
      }, 0) / mesesSelecionados.length;

    if (mediaInfestacao > 70) return 2.0;
    if (mediaInfestacao > 50) return 1.7;
    if (mediaInfestacao > 30) return 1.4;
    if (mediaInfestacao > 15) return 1.2;
    return 1.0;
  };

  const aplicarMultiplicador = async () => {
    const novoMultiplicador = calcularMultiplicador();

    // Salvar multiplicador no Firebase
    const docRef = doc(db, "fazendas", fazendaId);
    await setDoc(
      docRef,
      { multiplicadorHistorico: novoMultiplicador },
      { merge: true },
    );

    // Atualizar estado global
    onMultiplicadorChange(novoMultiplicador);

    // Recalcular risco com novo multiplicador
    const fazendaDoc = await getDoc(docRef);
    const riscoAtual = fazendaDoc.data()?.risco || 0;
    onRiscoChange(riscoAtual);

    Alert.alert(
      "Multiplicador aplicado!",
      `Risco histórico: ${novoMultiplicador.toFixed(1)}x\n${mesesSelecionados.length} meses selecionados.`,
    );

    router.back();
  };

  const multiplicadorAtual = calcularMultiplicador();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            📅 Histórico de Infestação
          </Text>
          <Text className="text-gray-600 mb-4">
            Selecione meses com alta infestação no passado para amplificar o
            alerta atual
          </Text>

          <View className="bg-blue-50 p-4 rounded-lg">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-blue-800">
                🎯 Meses selecionados: {mesesSelecionados.length}/3
              </Text>
              <Text className="text-lg font-bold text-blue-800">
                {multiplicadorAtual.toFixed(1)}x
              </Text>
            </View>
          </View>
        </View>

        {/* Lista de meses */}
        <View className="bg-white rounded-2xl shadow-sm p-6">
          <Text className="font-semibold text-gray-700 mb-3">
            Últimos 6 meses:
          </Text>

          {meses.map((mes) => {
            const selecionado = mesesSelecionados.includes(mes.id);
            return (
              <TouchableOpacity
                key={mes.id}
                onPress={() => toggleMes(mes.id)}
                className={`flex-row items-center justify-between p-4 mb-2 rounded-xl border-2 ${
                  selecionado
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className={`w-3 h-3 rounded-full ${mes.cor}`} />
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${
                        selecionado ? "text-emerald-800" : "text-gray-700"
                      }`}
                    >
                      {mes.nome}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {mes.nivel} • {mes.infestacao} carrapatos/dia
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  {selecionado && (
                    <Feather name="check-circle" size={20} color="#059669" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Como funciona */}
        <View className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <Text className="font-semibold text-gray-700 mb-3">
            📊 Multiplicadores:
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-gray-400" />
                <Text className="text-sm text-gray-600">1 mês infestação</Text>
              </View>
              <Text className="text-sm font-bold text-emerald-600">1.4x</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-gray-400" />
                <Text className="text-sm text-gray-600">
                  2 meses infestação
                </Text>
              </View>
              <Text className="text-sm font-bold text-yellow-600">1.7x</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-gray-400" />
                <Text className="text-sm text-gray-600">
                  3 meses infestação
                </Text>
              </View>
              <Text className="text-sm font-bold text-orange-600">2.0x</Text>
            </View>
          </View>

          <View className="mt-4 p-3 bg-gray-50 rounded-lg">
            <Text className="text-xs text-gray-500">
              ⚡ Quanto mais meses com alta infestação, maior o multiplicador
              aplicado ao risco atual.
            </Text>
          </View>
        </View>

        {/* Botão aplicar */}
        <TouchableOpacity
          onPress={aplicarMultiplicador}
          disabled={mesesSelecionados.length === 0}
          className={`py-4 rounded-xl mt-6 ${
            mesesSelecionados.length > 0 ? "bg-emerald-600" : "bg-gray-300"
          }`}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Aplicar Multiplicador{" "}
            {multiplicadorAtual > 1
              ? `(${multiplicadorAtual.toFixed(1)}x)`
              : ""}
          </Text>
        </TouchableOpacity>

        {/* Botão limpar */}
        {mesesSelecionados.length > 0 && (
          <TouchableOpacity
            onPress={() => setMesesSelecionados([])}
            className="py-3 mt-2"
          >
            <Text className="text-gray-500 text-center text-sm">
              Limpar seleção
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
