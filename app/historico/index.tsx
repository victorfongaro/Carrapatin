import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { db } from "../../firebase/config";

export default function HistoricoCalendario() {
  const [datasSelecionadas, setDatasSelecionadas] = useState({});
  const [loading, setLoading] = useState(true);
  const [avisoDistante, setAvisoDistante] = useState(false);
  const [mesAnoAtual, setMesAnoAtual] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  const fazendaId = "minha-fazenda-001";
  const hoje = new Date();

  // 🔄 Carregar histórico
  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        const docRef = doc(db, "fazendas", fazendaId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const datasSalvas = snapshot.data().historicoContaminacao || [];

          const datasFormatadas = {};

          datasSalvas.forEach((data) => {
            datasFormatadas[data] = {
              selected: true,
              selectedColor: "#16a34a",
              customStyles: {
                container: {
                  borderRadius: 12,
                },
              },
            };
          });

          setDatasSelecionadas(datasFormatadas);
        }
      } catch (error) {
        console.log("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarHistorico();
  }, []);

  // 📅 Seleção de dia com regras
  const onDayPress = (day) => {
    const dataSelecionada = new Date(day.dateString);

    if (dataSelecionada > hoje) {
      Alert.alert(
        "✨ Data inválida",
        "O futuro ainda não chegou... Selecione uma data válida.",
      );
      return;
    }

    const selected = { ...datasSelecionadas };

    if (selected[day.dateString]) {
      delete selected[day.dateString];
    } else {
      selected[day.dateString] = {
        selected: true,
        selectedColor: "#16a34a",
        customStyles: {
          container: {
            borderRadius: 12,
          },
        },
      };
    }

    setDatasSelecionadas(selected);

    // ⚠️ Verificar se a data é muito distante (mais de 6 meses)
    const limiteDistante = new Date();
    limiteDistante.setMonth(hoje.getMonth() - 6);

    if (dataSelecionada < limiteDistante) {
      setAvisoDistante(true);
    } else {
      setAvisoDistante(false);
    }
  };

  // 💾 Salvar
  const salvarPeriodo = async () => {
    try {
      const datas = Object.keys(datasSelecionadas);

      await setDoc(
        doc(db, "fazendas", fazendaId),
        { historicoContaminacao: datas },
        { merge: true },
      );

      Alert.alert("✨ Sucesso!", "Período salvo com sucesso!");
    } catch (error) {
      Alert.alert("😕 Ops!", "Não foi possível salvar. Tente novamente.");
    }
  };

  const totalDias = Object.keys(datasSelecionadas).length;

  // 📆 Função para mudar o mês
  const onMonthChange = (month) => {
    setMesAnoAtual(`${month.year}-${String(month.month).padStart(2, "0")}`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f0fdf4]">
        <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="mt-4 text-green-800 font-semibold text-lg">
            Carregando seu calendário...
          </Text>
          <Text className="text-green-600 text-sm mt-2">🌱 Um momento</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#f0fdf4]"
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER ENCANTADOR */}
      <LinearGradient
        colors={["#0f6b3a", "#15803d", "#16a34a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-12 px-6 rounded-b-[48px] shadow-lg"
      >
        <View className="items-center">
          <View className="bg-white/20 p-4 rounded-full mb-4">
            <Feather name="calendar" size={32} color="white" />
          </View>
          <Text className="text-white text-3xl font-bold text-center">
            Calendário da Fazenda
          </Text>
          <Text className="text-green-100 text-center mt-2 text-base">
            Registre os dias com contaminação
          </Text>
          <View className="bg-white/10 px-4 py-2 rounded-full mt-4">
            <Text className="text-white font-medium">
              {totalDias} {totalDias === 1 ? "dia" : "dias"} selecionados
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-4 -mt-8">
        {/* CALENDÁRIO INTERATIVO COM DESIGN REFINADO */}
        <View className="bg-white rounded-[32px] shadow-xl p-5">
          <View className="flex-row justify-between items-center mb-4 px-2">
            <Text className="text-lg font-bold text-gray-800">
              📅 Histórico
            </Text>
            <View className="bg-green-50 px-4 py-2 rounded-full">
              <Text className="text-green-700 font-semibold">
                {new Date(mesAnoAtual + "-01")
                  .toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })
                  .replace(/^./, (str) => str.toUpperCase())}
              </Text>
            </View>
          </View>

          <Calendar
            onDayPress={onDayPress}
            onMonthChange={onMonthChange}
            markedDates={datasSelecionadas}
            enableSwipeMonths
            pastScrollRange={100}
            futureScrollRange={0}
            hideExtraDays={false}
            markingType={"custom"}
            theme={{
              backgroundColor: "transparent",
              calendarBackground: "transparent",
              textSectionTitleColor: "#4b5563",
              selectedDayBackgroundColor: "#16a34a",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#15803d",
              dayTextColor: "#1f2937",
              textDisabledColor: "#9ca3af",
              dotColor: "#16a34a",
              selectedDotColor: "#ffffff",
              arrowColor: "#16a34a",
              monthTextColor: "#15803d",
              textMonthFontSize: 18,
              textMonthFontWeight: "700",
              textDayFontSize: 16,
              textDayFontWeight: "500",
              textDayHeaderFontSize: 14,
              textDayHeaderFontWeight: "600",
              arrowWidth: 24,
              arrowHeight: 24,
            }}
          />

          <View className="flex-row justify-end mt-2">
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded-full bg-[#16a34a] mr-2" />
              <Text className="text-gray-600 text-xs">Contaminação</Text>
            </View>
          </View>
        </View>

        {/* ⚠️ AVISO ELEGANTE - APENAS PARA DATAS MUITO DISTANTES */}
        {avisoDistante && (
          <View className="mt-5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-5 rounded-24 shadow-sm">
            <View className="flex-row items-start">
              <View className="bg-amber-100 p-2 rounded-full mr-3">
                <Feather name="alert-circle" size={22} color="#b45309" />
              </View>
              <View className="flex-1">
                <Text className="text-amber-900 font-bold text-base mb-1">
                  ⚡ Atenção
                </Text>
                <Text className="text-amber-800 text-sm leading-5">
                  Datas muito distantes têm menor impacto na predição de risco.
                  Para melhores resultados, priorize registros recentes.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* RESUMO ELEGANTE */}
        <View className="bg-white rounded-24 shadow-lg p-6 mt-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-green-100 p-2 rounded-full mr-3">
                <Feather name="pie-chart" size={20} color="#16a34a" />
              </View>
              <Text className="text-lg font-bold text-gray-800">
                Resumo do Período
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center bg-gray-50 p-4 rounded-xl">
            <Text className="text-gray-600 text-base">📌 Dias registrados</Text>
            <View className="bg-green-600 px-5 py-2 rounded-full">
              <Text className="text-white font-bold text-lg">{totalDias}</Text>
            </View>
          </View>

          {totalDias > 0 && (
            <View className="mt-4 bg-green-50 p-4 rounded-xl">
              <Text className="text-green-800 text-sm">
                🌟 Ótimo! Você já registrou {totalDias}{" "}
                {totalDias === 1 ? "dia" : "dias"}
                de contaminação. Continue mantendo seu histórico atualizado!
              </Text>
            </View>
          )}
        </View>

        {/* BOTÃO FLUTUANTE E ENCANTADOR */}
        <View className="items-center my-8">
          <TouchableOpacity
            onPress={salvarPeriodo}
            disabled={totalDias === 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                totalDias > 0
                  ? ["#16a34a", "#15803d", "#0f6b3a"]
                  : ["#d1d5db", "#9ca3af"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className={`px-10 py-4 rounded-full shadow-lg flex-row items-center`}
            >
              <Feather
                name="save"
                size={22}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-bold text-lg">
                Salvar Histórico
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {totalDias === 0 && (
            <Text className="text-gray-500 text-sm mt-3">
              Selecione pelo menos um dia para salvar
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
