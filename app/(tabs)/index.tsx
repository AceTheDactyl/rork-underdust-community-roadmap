import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import Header from '@/components/Header';
import PillarCard from '@/components/PillarCard';
import SpiralProgress from '@/components/SpiralProgress';
import { useRoadmap, useProgress } from '@/hooks/useRoadmap';
import { Colors } from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { pillars, getProjectsByPillar, isLoading } = useRoadmap();
  const progress = useProgress();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Underdust...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Underdust" 
        subtitle="Community Roadmap" 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome to the Underdust community roadmap. Explore our pillars, projects, and shared vision.
          </Text>
          
          <View style={styles.progressContainer}>
            <SpiralProgress progress={progress} size={180} />
          </View>
          
          <TouchableOpacity 
            style={styles.valuesButton}
            onPress={() => router.push('/values')}
          >
            <Text style={styles.valuesButtonText}>Our Community Values</Text>
            <ArrowRight size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.pillarsSection}>
          <Text style={styles.sectionTitle}>Our Four Pillars</Text>
          
          {pillars.map(pillar => (
            <PillarCard 
              key={pillar.id} 
              pillar={pillar} 
              projectCount={getProjectsByPillar(pillar.id).length} 
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  valuesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 8,
  },
  valuesButtonText: {
    color: Colors.text,
    fontWeight: '600',
    marginRight: 8,
  },
  pillarsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
});