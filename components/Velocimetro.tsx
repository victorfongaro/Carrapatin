import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

interface VelocimetroProps {
  risco: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Velocimetro({ risco, size = 'md' }: VelocimetroProps) {
  const valorNormalizado = Math.min(100, Math.max(0, risco));
  
  const dimensoes = {
    sm: { width: 160, height: 100, fontSize: 24, strokeWidth: 12, radius: 70 },
    md: { width: 240, height: 140, fontSize: 32, strokeWidth: 16, radius: 100 },
    lg: { width: 320, height: 180, fontSize: 40, strokeWidth: 20, radius: 130 }
  }[size];

  const angle = (valorNormalizado / 100) * 180;
  
  const centerX = dimensoes.width / 2;
  const centerY = dimensoes.height - 10;
  const radius = dimensoes.radius;
  
  const needleX = centerX + radius * Math.cos((180 - angle) * (Math.PI / 180));
  const needleY = centerY - radius * Math.sin((180 - angle) * (Math.PI / 180));

  const getCor = () => {
    if (valorNormalizado < 30) return '#22c55e';
    if (valorNormalizado < 60) return '#eab308';
    if (valorNormalizado < 80) return '#f97316';
    return '#ef4444';
  };

  const getClassificacao = () => {
    if (valorNormalizado < 30) return { text: 'BAIXO', color: '#22c55e', bg: '#dcfce7' };
    if (valorNormalizado < 60) return { text: 'MÉDIO', color: '#eab308', bg: '#fef9c3' };
    if (valorNormalizado < 80) return { text: 'ALTO', color: '#f97316', bg: '#ffedd5' };
    return { text: 'CRÍTICO', color: '#ef4444', bg: '#fee2e2' };
  };

  const classificacao = getClassificacao();

  return (
    <View className="items-center">
      <Svg width={dimensoes.width} height={dimensoes.height}>
        {/* Fundo */}
        <Path
          d={`M ${centerX - radius}, ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius}, ${centerY}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={dimensoes.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Arco colorido */}
        <Path
          d={`M ${centerX - radius}, ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius}, ${centerY}`}
          fill="none"
          stroke={getCor()}
          strokeWidth={dimensoes.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * Math.PI * radius} ${Math.PI * radius}`}
          strokeDashoffset={Math.PI * radius}
        />
        
        {/* Marcadores */}
        <SvgText x={centerX - radius - 5} y={centerY - 5} fontSize="12" fill="#6b7280" textAnchor="middle">0</SvgText>
        <SvgText x={centerX} y={25} fontSize="12" fill="#6b7280" textAnchor="middle">50</SvgText>
        <SvgText x={centerX + radius + 5} y={centerY - 5} fontSize="12" fill="#6b7280" textAnchor="middle">100</SvgText>
        
        {/* Ponteiro */}
        <Line
          x1={centerX} y1={centerY} x2={needleX} y2={needleY}
          stroke="#1f2937" strokeWidth="4" strokeLinecap="round"
        />
        
        {/* Círculo central */}
        <Circle cx={centerX} cy={centerY} r="12" fill="#1f2937" stroke="white" strokeWidth="3" />
        <Circle cx={centerX} cy={centerY} r="6" fill="white" />
      </Svg>
      
      {/* Valor numérico */}
      <View className="flex-row items-baseline gap-2 mt-4">
        <Text style={{ fontSize: dimensoes.fontSize, color: getCor(), fontWeight: 'bold' }}>
          {Math.round(valorNormalizado)}%
        </Text>
        <Text className="text-gray-400">risco</Text>
      </View>
      
      {/* Badge */}
      <View className="px-4 py-2 rounded-full mt-2" style={{ backgroundColor: classificacao.bg }}>
        <Text style={{ color: classificacao.color, fontWeight: 'bold' }}>
          {classificacao.text}
        </Text>
      </View>

      {/* Barra de progresso SIMPLES (sem animated) */}
      <View className="w-full mt-4 px-4">
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