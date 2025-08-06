import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Code, Flame, Home, Shield } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import ProjectCard from '@/components/ProjectCard';
import { usePillar, useProjectsByPillar } from '@/hooks/useRoadmap';
import { Colors } from '@/constants/colors';

export default function PillarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pillar = usePillar(id);
  const projects = useProjectsByPillar(id);

  if (!pillar) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pillar not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getIcon = () => {
    switch (pillar.icon) {
      case 'home':
        return <Home size={32} color={Colors.text} />;
      case 'code':
        return <Code size={32} color={Colors.text} />;
      case 'flame':
        return <Flame size={32} color={Colors.text} />;
      case 'shield':
        return <Shield size={32} color={Colors.text} />;
      default:
        return <Home size={32} color={Colors.text} />;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[pillar.color, Colors.gradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.pillarInfo}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <Text style={styles.pillarName}>{pillar.name}</Text>
          <Text style={styles.pillarDescription}>{pillar.description}</Text>
          <Text style={styles.keeperText}>Keeper: {pillar.keeper}</Text>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.projectsSection}>
          <Text style={styles.sectionTitle}>
            Projects ({projects.length})
          </Text>
          
          {projects.length > 0 ? (
            projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No projects in this pillar yet</Text>
            </View>
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 16,
  },
  backLink: {
    fontSize: 16,
    color: Colors.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.background}40`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pillarInfo: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.background}40`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pillarName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  pillarDescription: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
  },
  keeperText: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  projectsSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});