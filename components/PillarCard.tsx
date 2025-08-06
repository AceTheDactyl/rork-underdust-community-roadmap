import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Code, Flame, Home, Shield } from 'lucide-react-native';
import { Pillar } from '@/types/roadmap';
import { Colors } from '@/constants/colors';

interface PillarCardProps {
  pillar: Pillar;
  projectCount: number;
}

export default function PillarCard({ pillar, projectCount }: PillarCardProps) {
  const router = useRouter();

  const getIcon = () => {
    switch (pillar.icon) {
      case 'home':
        return <Home size={24} color={pillar.color} />;
      case 'code':
        return <Code size={24} color={pillar.color} />;
      case 'flame':
        return <Flame size={24} color={pillar.color} />;
      case 'shield':
        return <Shield size={24} color={pillar.color} />;
      default:
        return <Home size={24} color={pillar.color} />;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/pillar/${pillar.id}`)}
      testID={`pillar-card-${pillar.id}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${pillar.color}20` }]}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{pillar.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {pillar.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.keeper}>Keeper: {pillar.keeper}</Text>
          <Text style={styles.projectCount}>{projectCount} projects</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keeper: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  projectCount: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});