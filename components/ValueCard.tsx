import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

interface ValueCardProps {
  title: string;
  description: string;
}

export default function ValueCard({ title, description }: ValueCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});