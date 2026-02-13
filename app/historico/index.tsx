import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { db } from "../../firebase/config";
import { styles } from "../styles/styles";

const { width } = Dimensions.get("window");

// 🔧 Interface para o tipo do mês
interface MonthType {
  year: number;
  month: number;
}

// 🔧 Interface para o tipo do dia
interface DayType {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

// 🔧 Interface para o marking customizado
interface MarkedDateType {
  selected: boolean;
  selectedColor: string;
  customStyles?: {
    container: {
      borderRadius: number;
    };
  };
}

export default function HistoricoCalendario() {
  const [datasSelecionadas, setDatasSelecionadas] = useState<
    Record<string, MarkedDateType>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avisoDistante, setAvisoDistante] = useState(false);
  const [mesAnoAtual, setMesAnoAtual] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  const fazendaId = "minha-fazenda-001";
  const hoje = new Date();

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // 🔧 Ajustar hora para comparar apenas datas
  hoje.setHours(0, 0, 0, 0);

  useEffect(() => {
    carregarHistorico();

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

  // 🔄 Carregar histórico
  const carregarHistorico = async () => {
    try {
      const docRef = doc(db, "fazendas", fazendaId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const datasSalvas = data?.historicoContaminacao || [];

        const datasFormatadas: Record<string, MarkedDateType> = {};

        datasSalvas.forEach((data: string) => {
          datasFormatadas[data] = {
            selected: true,
            selectedColor: "#10b981", // 🔥 Verde igual ao Dashboard
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
      Alert.alert("Erro", "Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarHistorico();
    setRefreshing(false);
  };

  // 📅 Seleção de dia com regras
  const onDayPress = (day: DayType) => {
    const dataSelecionada = new Date(day.dateString);
    dataSelecionada.setHours(0, 0, 0, 0);

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
        selectedColor: "#10b981", // 🔥 Verde igual ao Dashboard
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
    limiteDistante.setMonth(limiteDistante.getMonth() - 6);
    limiteDistante.setHours(0, 0, 0, 0);

    setAvisoDistante(dataSelecionada < limiteDistante);
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
      console.log("Erro ao salvar:", error);
      Alert.alert("😕 Ops!", "Não foi possível salvar. Tente novamente.");
    }
  };

  const totalDias = Object.keys(datasSelecionadas).length;

  // 📆 Função para mudar o mês
  const onMonthChange = (month: MonthType) => {
    setMesAnoAtual(`${month.year}-${String(month.month).padStart(2, "0")}`);
  };

  // 🎨 Função para status de registro
  const getRegistroStatus = () => {
    if (totalDias === 0)
      return {
        label: "Sem registros",
        color: "#6b7280",
        bg: "#f3f4f6",
        icon: "calendar-outline",
      };
    if (totalDias < 10)
      return {
        label: "Poucos registros",
        color: "#f59e0b",
        bg: "#fef3c7",
        icon: "alert-circle-outline",
      };
    return {
      label: "Bom histórico",
      color: "#10b981",
      bg: "#d1fae5",
      icon: "checkmark-circle-outline",
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <View style={styles.speedometerContainer}>
            <LinearGradient
              colors={["#ffffff", "#fafafa"]}
              style={styles.speedometerGradient}
            >
              <View style={{ alignItems: "center", padding: 32 }}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={[styles.speedometerTitle, { marginTop: 16 }]}>
                  Carregando seu calendário...
                </Text>
                <Text style={[styles.speedometerSubtitle, { marginTop: 8 }]}>
                  🌱 Um momento
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  }

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
            colors={["#10b981"]}
          />
        }
      >
        {/* HEADER */}
        <LinearGradient
          colors={["#ffffff", "#f9fafb"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <Animated.View
              style={[
                styles.headerLeft,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Ionicons name="calendar" size={28} color="#059669" />
                </View>
                <View>
                  <Text style={styles.logoText}>
                    Histórico<Text style={styles.logoHighlight}>CarrapAI</Text>
                  </Text>
                  <Text style={styles.dateText}>
                    {new Date().toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() =>
                  Alert.alert("Em breve", "Estatísticas detalhadas")
                }
              >
                <Ionicons
                  name="stats-chart-outline"
                  size={24}
                  color="#4b5563"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>

        {/* CARD DE BOAS-VINDAS - CALENDÁRIO */}
        <Animated.View
          style={[
            styles.welcomeCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#0f766e", "#0d9488"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeRow}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeBadge}>
                  📅 CONTROLE DE CONTAMINAÇÃO
                </Text>
                <Text style={styles.welcomeName}>Registro de Dias</Text>
                <View style={styles.weatherContainer}>
                  <View
                    style={[
                      styles.weatherBadge,
                      { backgroundColor: "rgba(255,255,255,0.2)" },
                    ]}
                  >
                    <Ionicons name="time-outline" size={18} color="white" />
                    <Text style={styles.weatherText}>
                      {totalDias}{" "}
                      {totalDias === 1 ? "dia registrado" : "dias registrados"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.weatherIcon}>
                <Ionicons
                  name={
                    totalDias > 0 ? "checkmark-done-circle" : "calendar-outline"
                  }
                  size={32}
                  color="white"
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* CALENDÁRIO */}
        <Animated.View
          style={[
            styles.speedometerCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.speedometerContainer}>
            <LinearGradient
              colors={["#ffffff", "#fafafa"]}
              style={styles.speedometerGradient}
            >
              <View style={styles.speedometerHeader}>
                <View>
                  <Text style={styles.speedometerTitle}>
                    📆 Calendário da Fazenda
                  </Text>
                  <Text style={styles.speedometerSubtitle}>
                    Selecione os dias com contaminação
                  </Text>
                </View>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRegistroStatus().bg },
                  ]}
                >
                  <Ionicons
                    name={getRegistroStatus().icon as any}
                    size={18}
                    color={getRegistroStatus().color}
                  />
                  <Text
                    style={[
                      styles.riskText,
                      { color: getRegistroStatus().color },
                    ]}
                  >
                    {getRegistroStatus().label}
                  </Text>
                </View>
              </View>

              <View style={{ padding: 8, marginTop: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    {(() => {
                      try {
                        const date = new Date(mesAnoAtual + "-01");
                        return date
                          .toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          })
                          .replace(/^./, (str) => str.toUpperCase());
                      } catch {
                        return "Mês atual";
                      }
                    })()}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#10b981",
                        marginRight: 6,
                      }}
                    />
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      Contaminação
                    </Text>
                  </View>
                </View>

                <Calendar
                  onDayPress={onDayPress}
                  onMonthChange={onMonthChange}
                  markedDates={datasSelecionadas}
                  enableSwipeMonths={true}
                  pastScrollRange={9999}
                  futureScrollRange={0}
                  hideExtraDays={false}
                  markingType="custom"
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: "#4b5563",
                    selectedDayBackgroundColor: "#10b981",
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: "#0d9488",
                    dayTextColor: "#1f2937",
                    textDisabledColor: "#9ca3af",
                    dotColor: "#10b981",
                    selectedDotColor: "#ffffff",
                    arrowColor: "#10b981",
                    monthTextColor: "#0f766e",
                    textMonthFontSize: 18,
                    textMonthFontWeight: "bold",
                    textDayFontSize: 16,
                    textDayFontWeight: "500",
                    textDayHeaderFontSize: 14,
                    textDayHeaderFontWeight: "600",
                  }}
                />
              </View>

              {/* STATS - DIAS REGISTRADOS */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: getRegistroStatus().bg },
                    ]}
                  >
                    <Ionicons
                      name="calendar"
                      size={22}
                      color={getRegistroStatus().color}
                    />
                  </View>
                  <Text style={styles.statLabel}>Dias registrados</Text>
                  <Text style={styles.statValue}>{totalDias}</Text>
                </View>

                <View style={styles.statItem}>
                  <View
                    style={[
                      styles.statIcon,
                      {
                        backgroundColor: avisoDistante ? "#fee2e2" : "#d1fae5",
                      },
                    ]}
                  >
                    <Ionicons
                      name={avisoDistante ? "warning" : "time"}
                      size={22}
                      color={avisoDistante ? "#ef4444" : "#10b981"}
                    />
                  </View>
                  <Text style={styles.statLabel}>Registros</Text>
                  <Text style={styles.statValue}>
                    {avisoDistante ? "Antigos" : "Recentes"}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <View
                    style={[
                      styles.statIcon,
                      {
                        backgroundColor: totalDias > 0 ? "#d1fae5" : "#f3f4f6",
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={totalDias > 0 ? "#10b981" : "#9ca3af"}
                    />
                  </View>
                  <Text style={styles.statLabel}>Status</Text>
                  <Text style={styles.statValue}>
                    {totalDias > 0 ? "Ativo" : "Pendente"}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* ⚠️ AVISO DE DATAS DISTANTES */}
        {avisoDistante && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={[styles.alertCard, { marginTop: 0 }]}>
              <LinearGradient
                colors={["#b45309", "#c2410c", "#9a3412"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.alertGradient}
              >
                <View style={styles.alertRow}>
                  <View style={styles.alertIcon}>
                    <Ionicons name="warning" size={32} color="white" />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>⚠️ Atenção</Text>
                    <Text style={styles.alertDescription}>
                      Datas muito distantes têm menor impacto na predição de
                      risco.
                    </Text>
                    <View style={styles.alertBadgeContainer}>
                      <View
                        style={[
                          styles.alertBadge,
                          { backgroundColor: "rgba(255,255,255,0.2)" },
                        ]}
                      >
                        <Text style={styles.alertBadgeText}>
                          Priorize registros recentes
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* RESUMO DO PERÍODO */}
        <Animated.View style={[styles.mapCard, { opacity: fadeAnim }]}>
          <View style={styles.mapContainer}>
            <LinearGradient
              colors={["#ffffff", "#fafafa"]}
              style={styles.mapGradient}
            >
              <View style={styles.mapHeader}>
                <View>
                  <Text style={styles.mapTitle}>📊 Resumo do Período</Text>
                  <Text style={styles.mapSubtitle}>
                    {totalDias}{" "}
                    {totalDias === 1 ? "dia selecionado" : "dias selecionados"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={carregarHistorico}
                >
                  <Feather name="refresh-cw" size={18} color="#4b5563" />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 16 }}>
                <View
                  style={{
                    backgroundColor: totalDias > 0 ? "#f0fdf4" : "#f9fafb",
                    borderRadius: 16,
                    padding: 20,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: totalDias > 0 ? "#10b98120" : "#e5e7eb",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 48,
                      fontWeight: "bold",
                      color: totalDias > 0 ? "#10b981" : "#9ca3af",
                      marginBottom: 8,
                    }}
                  >
                    {totalDias}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      color: totalDias > 0 ? "#047857" : "#6b7280",
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    {totalDias === 0
                      ? "Nenhum dia registrado"
                      : totalDias === 1
                        ? "Dia registrado"
                        : "Dias registrados"}
                  </Text>
                  {totalDias > 0 && (
                    <View
                      style={{
                        backgroundColor: "#d1fae5",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        marginTop: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: "#065f46",
                          fontSize: 14,
                          fontWeight: "500",
                        }}
                      >
                        🌟 Continue mantendo seu histórico atualizado!
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* BOTÃO FLUTUANTE */}
        <View style={{ alignItems: "center", marginVertical: 32 }}>
          <TouchableOpacity
            onPress={salvarPeriodo}
            disabled={totalDias === 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                totalDias > 0
                  ? ["#0f766e", "#0d9488", "#10b981"]
                  : ["#d1d5db", "#9ca3af"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: totalDias > 0 ? "#0f766e" : "#6b7280",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Feather
                name="save"
                size={22}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
              >
                Salvar Histórico
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {totalDias === 0 && (
            <Text style={[styles.footerText, { marginTop: 12 }]}>
              Selecione pelo menos um dia para salvar
            </Text>
          )}
        </View>

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