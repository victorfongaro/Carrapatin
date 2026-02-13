import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Velocimetro } from "../components/Velocimetro";
import {
  atualizarRisco,
  calcularRiscoClimatico,
  carregarClimaOpenMeteo,
  carregarDadosUsuario,
  carregarProdutoresProximos,
  carregarRiscoFazenda,
  inicializarDadosTeste,
} from "../firebase/services";
import { styles } from "./styles/styles";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  // Estados
  const [fazendas, setFazendas] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFazenda, setSelectedFazenda] = useState<any>(null);
  const [risco, setRisco] = useState(78);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState({
    nome: "João Mendes",
    fazenda: "Fazenda Boa Vista",
  });

  const [localizacao, setLocalizacao] = useState({
    latitude: -21.244,
    longitude: -45.147,
    cidade: "Lavras",
  });

  const [dadosClimaticos, setDadosClimaticos] = useState({
    temperatura: 28,
    umidade: 75,
    condicao: "Ensolarado",
  });

  const [alertaClimatico, setAlertaClimatico] = useState({
    nivel: "Médio",
    cor: "#f59e0b",
    multiplicador: 1.8,
    mensagem: "Condições climáticas favorecem reprodução",
  });

  const fazendaId = "minha-fazenda-001";

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // ===========================================
  // 1. INICIALIZAÇÃO
  // ===========================================
  useEffect(() => {
    inicializarApp();

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

  const inicializarApp = async () => {
    setLoading(true);

    try {
      await inicializarDadosTeste();
      const dadosUsuario = await carregarDadosUsuario(fazendaId);
      setUsuario(dadosUsuario);
      await carregarLocalizacaoEClima();
      await carregarTodosDados();
    } catch (error) {
      console.error("Erro ao inicializar app:", error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // 2. 🌦️ LOCALIZAÇÃO E CLIMA
  // ===========================================
  const carregarLocalizacaoEClima = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        const clima = await carregarClimaOpenMeteo(
          location.coords.latitude,
          location.coords.longitude,
        );

        setDadosClimaticos({
          temperatura: clima.temperatura,
          umidade: clima.umidade,
          condicao: clima.condicao,
        });

        setLocalizacao({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          cidade: clima.cidade,
        });

        const alerta = calcularRiscoClimatico(clima.temperatura, clima.umidade);
        setAlertaClimatico(alerta);
      }
    } catch (error) {
      console.log("Erro ao carregar localização:", error);
      const clima = await carregarClimaOpenMeteo(-21.244, -45.147);
      setDadosClimaticos({
        temperatura: clima.temperatura,
        umidade: clima.umidade,
        condicao: clima.condicao,
      });
      const alerta = calcularRiscoClimatico(clima.temperatura, clima.umidade);
      setAlertaClimatico(alerta);
    }
  };

  // ===========================================
  // 3. DADOS DO FIREBASE
  // ===========================================
  const carregarTodosDados = async () => {
    try {
      const dadosRisco = await carregarRiscoFazenda(fazendaId);
      setRisco(dadosRisco.risco);

      const produtores = await carregarProdutoresProximos(
        localizacao.latitude,
        localizacao.longitude,
      );
      setFazendas(produtores);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarLocalizacaoEClima();
    await carregarTodosDados();
    setRefreshing(false);
  };

  // ===========================================
  // 4. AÇÕES
  // ===========================================
  const handleImportarRisco = async (fazenda: any) => {
    const novoRisco = Math.min(100, Math.round((risco + fazenda.risco) / 2));
    const sucesso = await atualizarRisco(fazendaId, novoRisco);

    if (sucesso) {
      setRisco(novoRisco);
      Alert.alert("✅ Sucesso!", "Risco importado com sucesso");
      setSelectedFazenda(null);
    } else {
      Alert.alert("❌ Erro", "Não foi possível importar o risco");
    }
  };

  // ===========================================
  // 5. UTILITÁRIOS DE UI
  // ===========================================
  const getMarkerColor = (risco: number) => {
    if (risco < 30) return "#10b981";
    if (risco < 60) return "#f59e0b";
    if (risco < 80) return "#f97316";
    return "#ef4444";
  };

  const getRiscoStatus = (risco: number) => {
    if (risco < 30)
      return {
        label: "Baixo",
        color: "#10b981",
        bg: "#d1fae5",
        icon: "checkmark-circle",
      };
    if (risco < 60)
      return {
        label: "Médio",
        color: "#f59e0b",
        bg: "#fef3c7",
        icon: "alert-circle",
      };
    if (risco < 80)
      return {
        label: "Alto",
        color: "#f97316",
        bg: "#ffedd5",
        icon: "warning",
      };
    return {
      label: "Crítico",
      color: "#ef4444",
      bg: "#fee2e2",
      icon: "skull",
    };
  };

  const getWeatherIcon = () => {
    const condicao = dadosClimaticos.condicao.toLowerCase();
    if (condicao.includes("chuva")) return "rainy";
    if (condicao.includes("nublado")) return "cloudy";
    if (condicao.includes("limpo")) return "sunny";
    if (condicao.includes("nevoeiro")) return "fog";
    if (condicao.includes("tempestade")) return "thunderstorm";
    return "partly-sunny";
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 16, color: "#4b5563" }}>
          Carregando Dashboard...
        </Text>
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
        {/* ✅ HEADER TOTALMENTE REMOVIDO - SÓ O CARD DE BOAS-VINDAS */}

        {/* CARD DE BOAS-VINDAS */}
        <Animated.View
          style={[
            styles.welcomeCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginTop: 20, // 🔥 Ajuste para não ficar colado no topo
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
                  🌱 BEM-VINDO, {usuario.nome.toUpperCase()}
                </Text>
                <Text style={styles.welcomeName}>{usuario.fazenda}</Text>
                <View style={styles.weatherContainer}>
                  <View style={styles.weatherBadge}>
                    <Ionicons name={getWeatherIcon()} size={18} color="white" />
                    <Text style={styles.weatherText}>
                      {dadosClimaticos.temperatura}°C •{" "}
                      {dadosClimaticos.condicao}
                    </Text>
                  </View>
                  <View style={[styles.weatherBadge, { marginLeft: 8 }]}>
                    <Ionicons name="location" size={18} color="white" />
                    <Text style={styles.weatherText}>{localizacao.cidade}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.weatherIcon}>
                <MaterialCommunityIcons
                  name={
                    dadosClimaticos.condicao.includes("Chuva")
                      ? "weather-pouring"
                      : "weather-partly-rainy"
                  }
                  size={32}
                  color="white"
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* VELOCÍMETRO */}
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
                    Nível de Contaminação
                  </Text>
                  <Text style={styles.speedometerSubtitle}>
                    {usuario.fazenda}
                  </Text>
                </View>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRiscoStatus(risco).bg },
                  ]}
                >
                  <Ionicons
                    name={getRiscoStatus(risco).icon as any}
                    size={18}
                    color={getRiscoStatus(risco).color}
                  />
                  <Text
                    style={[
                      styles.riskText,
                      { color: getRiscoStatus(risco).color },
                    ]}
                  >
                    {getRiscoStatus(risco).label}
                  </Text>
                </View>
              </View>

              <View style={styles.velocimetroWrapper}>
                <Velocimetro risco={risco} size="lg" />
              </View>

              {/* STATS */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <View
                    style={[styles.statIcon, { backgroundColor: "#eff6ff" }]}
                  >
                    <Feather name="map-pin" size={22} color="#3b82f6" />
                  </View>
                  <Text style={styles.statLabel}>Fazendas</Text>
                  <Text style={styles.statValue}>{fazendas.length}</Text>
                </View>

                <View style={styles.statItem}>
                  <View
                    style={[styles.statIcon, { backgroundColor: "#fff7ed" }]}
                  >
                    <Feather name="thermometer" size={22} color="#f97316" />
                  </View>
                  <Text style={styles.statLabel}>Temperatura</Text>
                  <Text style={styles.statValue}>
                    {dadosClimaticos.temperatura}°C
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <View
                    style={[styles.statIcon, { backgroundColor: "#e0f2fe" }]}
                  >
                    <Feather name="droplet" size={22} color="#0ea5e9" />
                  </View>
                  <Text style={styles.statLabel}>Umidade</Text>
                  <Text style={styles.statValue}>
                    {dadosClimaticos.umidade}%
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* ALERTA CLIMÁTICO */}
        <Animated.View style={[styles.alertCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[
              alertaClimatico.cor === "#ef4444"
                ? "#991b1b"
                : alertaClimatico.cor === "#f97316"
                  ? "#9a3412"
                  : alertaClimatico.cor === "#f59e0b"
                    ? "#854d0e"
                    : "#0f766e",
              alertaClimatico.cor,
              alertaClimatico.cor,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.alertGradient}
          >
            <View style={styles.alertRow}>
              <View
                style={[
                  styles.alertIcon,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <Ionicons
                  name={
                    alertaClimatico.nivel === "Crítico"
                      ? "warning"
                      : alertaClimatico.nivel === "Alto"
                        ? "alert"
                        : "information-circle"
                  }
                  size={32}
                  color="white"
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  🚨 Alerta de Proliferação - {alertaClimatico.nivel}
                </Text>
                <Text style={styles.alertDescription}>
                  {alertaClimatico.mensagem}
                </Text>
                <View style={styles.alertBadgeContainer}>
                  <View
                    style={[
                      styles.alertBadge,
                      { backgroundColor: "rgba(255,255,255,0.3)" },
                    ]}
                  >
                    <Text style={styles.alertBadgeText}>
                      {dadosClimaticos.temperatura}°C •{" "}
                      {dadosClimaticos.umidade}% • Multiplicador{" "}
                      {alertaClimatico.multiplicador}x
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* MAPA */}
        <Animated.View style={[styles.mapCard, { opacity: fadeAnim }]}>
          <View style={styles.mapContainer}>
            <LinearGradient
              colors={["#ffffff", "#fafafa"]}
              style={styles.mapGradient}
            >
              <View style={styles.mapHeader}>
                <View>
                  <Text style={styles.mapTitle}>🗺️ Produtores Próximos</Text>
                  <Text style={styles.mapSubtitle}>
                    {fazendas.length} propriedades em {localizacao.cidade}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={onRefresh}
                >
                  <Feather name="refresh-cw" size={18} color="#4b5563" />
                </TouchableOpacity>
              </View>

              <View style={styles.mapWrapper}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: localizacao.latitude,
                    longitude: localizacao.longitude,
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
                      onPress={() => setSelectedFazenda(fazenda)}
                    >
                      <View style={styles.markerContainer}>
                        <LinearGradient
                          colors={[
                            getMarkerColor(fazenda.risco),
                            getMarkerColor(fazenda.risco) + "dd",
                          ]}
                          style={styles.marker}
                        >
                          <Text style={styles.markerText}>
                            {fazenda.risco}%
                          </Text>
                        </LinearGradient>
                        <View style={styles.markerLabel}>
                          <Text style={styles.markerLabelText}>
                            {fazenda.nome.split(" ")[0]}
                          </Text>
                        </View>
                      </View>
                    </Marker>
                  ))}
                </MapView>
              </View>

              {/* CARD DA FAZENDA SELECIONADA */}
              {selectedFazenda && (
                <View style={styles.selectedFarmCard}>
                  <View style={styles.selectedFarmHeader}>
                    <View style={styles.selectedFarmInfo}>
                      <LinearGradient
                        colors={[
                          getMarkerColor(selectedFazenda.risco),
                          getMarkerColor(selectedFazenda.risco) + "dd",
                        ]}
                        style={styles.selectedFarmDot}
                      />
                      <View>
                        <Text style={styles.selectedFarmName}>
                          {selectedFazenda.nome}
                        </Text>
                        <Text style={styles.selectedFarmUpdate}>
                          Atualizado agora
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedFazenda(null)}
                      style={styles.closeButton}
                    >
                      <Feather name="x" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.selectedFarmStats}>
                    <View style={styles.selectedFarmStat}>
                      <Text style={styles.statLabel}>Vacas</Text>
                      <Text style={styles.statValueLarge}>
                        {selectedFazenda.vacas}
                      </Text>
                    </View>
                    <View style={styles.selectedFarmStat}>
                      <Text style={styles.statLabel}>Área</Text>
                      <Text style={styles.statValueLarge}>
                        {selectedFazenda.area}
                      </Text>
                    </View>
                    <View style={styles.selectedFarmStat}>
                      <Text style={styles.statLabel}>Risco</Text>
                      <View style={styles.riskRow}>
                        <Text
                          style={[
                            styles.riskValue,
                            { color: getMarkerColor(selectedFazenda.risco) },
                          ]}
                        >
                          {selectedFazenda.risco}%
                        </Text>
                        <View
                          style={[
                            styles.riskBadgeSmall,
                            {
                              backgroundColor: getRiscoStatus(
                                selectedFazenda.risco,
                              ).bg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.riskTextSmall,
                              {
                                color: getRiscoStatus(selectedFazenda.risco)
                                  .color,
                              },
                            ]}
                          >
                            {getRiscoStatus(selectedFazenda.risco).label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.importButton}
                    onPress={() => handleImportarRisco(selectedFazenda)}
                  >
                    <Feather name="download-cloud" size={18} color="white" />
                    <Text style={styles.importButtonText}>
                      Importar dados de risco
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* LEGENDA */}
              <View style={styles.legendContainer}>
                {[
                  { color: "#10b981", label: "Baixo (0-30%)" },
                  { color: "#f59e0b", label: "Médio (31-60%)" },
                  { color: "#f97316", label: "Alto (61-80%)" },
                  { color: "#ef4444", label: "Crítico (81-100%)" },
                ].map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {localizacao.cidade} • {dadosClimaticos.temperatura}°C •{" "}
            {dadosClimaticos.umidade}% • CarrapAI v1.0
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
