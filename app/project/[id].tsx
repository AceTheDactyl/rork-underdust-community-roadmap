import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import MilestoneItem from '@/components/MilestoneItem';
import { useProject, usePillar } from '@/hooks/useRoadmap';
import { Colors } from '@/constants/colors';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const project = useProject(id);
  const pillar = usePillar(project?.pillar || '');

  if (!project || !pillar) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = () => {
    switch (project.status) {
      case 'proposed':
        return Colors.warning;
      case 'active':
        return Colors.primary;
      case 'completed':
        return Colors.success;
      case 'archived':
        return Colors.textSecondary;
      default:
        return Colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCompletedMilestones = () => {
    return project.milestones.filter(m => m.status === 'completed').length;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.projectInfo}>
          <View style={styles.titleContainer}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.projectDescription}>{project.description}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Pillar</Text>
              <TouchableOpacity onPress={() => router.push(`/pillar/${pillar.id}`)}>
                <Text style={[styles.metaValue, { color: pillar.color }]}>{pillar.name}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Lead</Text>
              <Text style={styles.metaValue}>{project.lead}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Created</Text>
              <Text style={styles.metaValue}>{formatDate(project.createdAt)}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.milestonesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Milestones ({getCompletedMilestones()}/{project.milestones.length})
            </Text>
          </View>
          
          {project.milestones.map(milestone => (
            <MilestoneItem key={milestone.id} milestone={milestone} />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectInfo: {},
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 24,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    marginRight: 24,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  milestonesSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
});