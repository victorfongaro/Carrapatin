// components/Skeleton.tsx
import React from 'react';
import { View, Dimensions } from 'react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export const Skeleton = () => {
  return (
    <View className="flex-1 bg-[#f9fafb] px-4">
      {/* Header Skeleton */}
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ loop: true, type: 'timing', duration: 1000 }}
        style={{ width: '100%', height: 100, backgroundColor: '#e5e7eb', borderRadius: 24, marginTop: 20 }}
      />
      
      {/* Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <MotiView
          key={i}
          from={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ loop: true, type: 'timing', duration: 1000, delay: i * 200 }}
          style={{ width: '100%', height: 200, backgroundColor: '#e5e7eb', borderRadius: 24, marginTop: 16 }}
        />
      ))}
    </View>
  );
};