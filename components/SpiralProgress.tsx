import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/colors';

interface SpiralProgressProps {
  progress: number; // 0 to 1
  size?: number;
}

export default function SpiralProgress({ progress, size = 200 }: SpiralProgressProps) {
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Calculate the number of spiral turns based on progress
  const turns = 2 + clampedProgress * 1.5; // 2 to 3.5 turns
  
  // Generate spiral path
  const generateSpiralPath = () => {
    const center = size / 2;
    const maxRadius = (size / 2) * 0.85;
    const startRadius = maxRadius * 0.2;
    const points = 100;
    
    let path = `M ${center + startRadius} ${center}`;
    
    for (let i = 1; i <= points; i++) {
      const t = (i / points) * turns * 2 * Math.PI;
      const completionRatio = i / points;
      
      // Only draw up to the progress point
      if (completionRatio > clampedProgress) break;
      
      // Spiral radius grows as we go outward
      const radius = startRadius + (maxRadius - startRadius) * (t / (turns * 2 * Math.PI));
      const x = center + radius * Math.cos(t);
      const y = center + radius * Math.sin(t);
      
      path += ` L ${x} ${y}`;
    }
    
    return path;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) * 0.85}
          stroke={Colors.border}
          strokeWidth={1}
          fill="transparent"
        />
        
        {/* Spiral path */}
        <Path
          d={generateSpiralPath()}
          stroke={Colors.primary}
          strokeWidth={3}
          fill="transparent"
          strokeLinecap="round"
        />
      </Svg>
      
      <View style={styles.textContainer}>
        <Text style={styles.progressText}>{Math.round(clampedProgress * 100)}%</Text>
        <Text style={styles.label}>Spiral Progress</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});