import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { 
  Path, Circle, G, Line, 
  Text as SvgText, Defs, LinearGradient, Stop 
} from 'react-native-svg';

interface VelocimetroProps {
  risco: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Velocimetro({ risco, size = 'md' }: VelocimetroProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const valorNormalizado = Math.min(100, Math.max(0, risco));
  
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: valorNormalizado,
      useNativeDriver: true,
      tension: 30,
      friction: 8,
    }).start();
  }, [valorNormalizado]);

  const dimensoes = {
    sm: { width: 160, height: 100, fontSize: 24, strokeWidth: 12, radius: 70 },
    md: { width: 240, height: 140, fontSize: 32, strokeWidth: 16, radius: 100 },
    lg: { width: 320, height: 180, fontSize: 40, strokeWidth: 20, radius: 130 }
  }[size];

  const centerX = dimensoes.width / 2;
  const centerY = dimensoes.height - 10;
  const radius = dimensoes.radius;

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

  // Calcular posição do ponteiro baseado no valor animado
  const angle = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 0]
  });

  const needleX = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [
      centerX + radius * Math.cos(180 * (Math.PI / 180)),
      centerX + radius * Math.cos(0)
    ]
  });

  const needleY = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [
      centerY - radius * Math.sin(180 * (Math.PI / 180)),
      centerY - radius * Math.sin(0)
    ]
  });

  return (
    <View className="items-center">
      <Svg width={dimensoes.width} height={dimensoes.height}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={getCor()} />
            <Stop offset="100%" stopColor={getCor() + '80'} />
          </LinearGradient>
        </Defs>
        
        {/* Fundo - Arco cinza */}
        <Path
          d={`M ${centerX - radius}, ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius}, ${centerY}`}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={dimensoes.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Arco colorido animado */}
        <AnimatedPath
          d={`M ${centerX - radius}, ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius}, ${centerY}`}
          fill="none"
          stroke="url(#grad)"
          strokeWidth={dimensoes.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${animatedValue.interpolate({
            inputRange: [0, 100],
            outputRange: [0, Math.PI * radius]
          })} ${Math.PI * radius}`}
          strokeDashoffset={Math.PI * radius}
        />
        
        {/* Marcadores de referência */}
        {[0, 25, 50, 75, 100].map((value, index) => {
          const ang = (value / 100) * 180;
          const x = centerX + (radius - 15) * Math.cos((180 - ang) * (Math.PI / 180));
          const y = centerY - (radius - 15) * Math.sin((180 - ang) * (Math.PI / 180));
          
          let color = '#94a3b8';
          let size = value % 25 === 0 ? 4 : 2;
          
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r={size}
              fill={color}
            />
          );
        })}
        
        {/* Marcadores de texto */}
        <SvgText 
          x={centerX - radius - 5} 
          y={centerY - 5} 
          fontSize="12" 
          fill="#64748b"
          fontWeight="600"
          textAnchor="middle"
        >
          0
        </SvgText>
        <SvgText 
          x={centerX} 
          y={25} 
          fontSize="12" 
          fill="#64748b"
          fontWeight="600"
          textAnchor="middle"
        >
          50
        </SvgText>
        <SvgText 
          x={centerX + radius + 5} 
          y={centerY - 5} 
          fontSize="12" 
          fill="#64748b"
          fontWeight="600"
          textAnchor="middle"
        >
          100
        </SvgText>
        
        {/* Ponteiro animado */}
        <AnimatedLine
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Círculo central */}
        <Circle
          cx={centerX}
          cy={centerY}
          r="14"
          fill="#0f172a"
          stroke="white"
          strokeWidth="3"
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r="6"
          fill="white"
        />
      </Svg>
      
      {/* Valor numérico */}
      <View className="flex-row items-baseline gap-2 mt-4">
        <Text style={{ 
          fontSize: dimensoes.fontSize, 
          color: getCor(),
          fontWeight: '800'
        }}>
          {Math.round(valorNormalizado)}%
        </Text>
        <Text className="text-base text-gray-400 font-medium">
          risco
        </Text>
      </View>
      
      {/* Badge de classificação */}
      <View 
        className="px-4 py-2 rounded-full mt-2"
        style={{ backgroundColor: classificacao.bg }}
      >
        <Text style={{ 
          color: classificacao.color, 
          fontWeight: '700', 
          fontSize: 14 
        }}>
          {classificacao.text}
        </Text>
      </View>

      {/* Barra de progresso */}
      <View className="w-full mt-6 px-4">
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <Animated.View 
            className="h-full rounded-full"
            style={{ 
              width: animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }),
              backgroundColor: getCor()
            }}
          />
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-xs text-gray-400">0%</Text>
          <Text className="text-xs text-gray-400">50%</Text>
          <Text className="text-xs text-gray-400">100%</Text>
        </View>
      </View>
    </View>
  );
}

// Componente animado
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);