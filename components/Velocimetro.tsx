import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';

interface VelocimetroProps {
  risco: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Velocimetro({ risco, size = 'md' }: VelocimetroProps) {
  // Garantir que risco está entre 0 e 100
  const valorNormalizado = Math.min(100, Math.max(0, risco));
  
  // Tamanhos responsivos
  const dimensoes = {
    sm: { width: 120, height: 70, fontSize: 16, strokeWidth: 8, radius: 45 },
    md: { width: 200, height: 110, fontSize: 24, strokeWidth: 12, radius: 75 },
    lg: { width: 280, height: 150, fontSize: 32, strokeWidth: 16, radius: 105 }
  }[size];

  // Calcular ângulo do ponteiro (0 a 180 graus)
  const angle = (valorNormalizado / 100) * 180;
  
  // Coordenadas
  const centerX = dimensoes.width / 2;
  const centerY = dimensoes.height - 15;
  const radius = dimensoes.radius;
  
  // Calcular posição do ponteiro
  const needleX = centerX + radius * Math.cos((180 - angle) * (Math.PI / 180));
  const needleY = centerY - radius * Math.sin((180 - angle) * (Math.PI / 180));

  // Cor baseada no risco
  const getCor = () => {
    if (valorNormalizado < 30) return '#22c55e'; // Verde
    if (valorNormalizado < 60) return '#eab308'; // Amarelo
    if (valorNormalizado < 80) return '#f97316'; // Laranja
    return '#ef4444'; // Vermelho
  };

  // Texto de classificação
  const getClassificacao = () => {
    if (valorNormalizado < 30) return 'BAIXO';
    if (valorNormalizado < 60) return 'MÉDIO';
    if (valorNormalizado < 80) return 'ALTO';
    return 'CRÍTICO';
  };

  return (
    <View className="items-center">
      {/* SVG do velocímetro */}
      <Svg width={dimensoes.width} height={dimensoes.height}>
        {/* Fundo do velocímetro (arco cinza) */}
        <Path
          d={`M ${centerX - radius}, ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius}, ${centerY}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={dimensoes.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Arco colorido (progresso) */}
        <Path
          d={`M ${centerX - radius}, ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius}, ${centerY}`}
          fill="none"
          stroke={getCor()}
          strokeWidth={dimensoes.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * Math.PI * radius} ${Math.PI * radius}`}
          strokeDashoffset={Math.PI * radius}
        />
        
        {/* Marcador 0% */}
        <SvgText
          x={centerX - radius - 5}
          y={centerY - 5}
          fontSize="10"
          fill="#9ca3af"
          textAnchor="middle"
        >
          0
        </SvgText>
        
        {/* Marcador 50% */}
        <SvgText
          x={centerX}
          y={20}
          fontSize="10"
          fill="#9ca3af"
          textAnchor="middle"
        >
          50
        </SvgText>
        
        {/* Marcador 100% */}
        <SvgText
          x={centerX + radius + 5}
          y={centerY - 5}
          fontSize="10"
          fill="#9ca3af"
          textAnchor="middle"
        >
          100
        </SvgText>
        
        {/* Ponteiro */}
        <Line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#1f2937"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Círculo central do ponteiro */}
        <Circle
          cx={centerX}
          cy={centerY}
          r="6"
          fill="#1f2937"
          stroke="white"
          strokeWidth="2"
        />
      </Svg>
      
      {/* Valor numérico */}
      <View className="flex-row items-baseline gap-1 mt-2">
        <Text style={{ 
          fontSize: dimensoes.fontSize, 
          color: getCor(),
          fontWeight: 'bold'
        }}>
          {Math.round(valorNormalizado)}%
        </Text>
        <Text className="text-sm text-gray-500">
          risco
        </Text>
      </View>
      
      {/* Classificação em badge */}
      <View 
        className="px-3 py-1 rounded-full mt-1"
        style={{ backgroundColor: getCor() + '20' }}
      >
        <Text style={{ color: getCor(), fontWeight: '600', fontSize: 12 }}>
          {getClassificacao()}
        </Text>
      </View>

      {/* Barra de progresso horizontal (alternativa) */}
      <View className="w-full mt-4">
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View 
            className="h-full rounded-full"
            style={{ 
              width: `${valorNormalizado}%`,
              backgroundColor: getCor()
            }}
          />
        </View>
      </View>
    </View>
  );
}