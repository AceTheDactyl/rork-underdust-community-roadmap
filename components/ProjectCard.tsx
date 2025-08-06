import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Project } from '@/types/roadmap';
import { Colors } from '@/constants/colors';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

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

  const getCompletedMilestones = () => {
    return project.milestones.filter(m => m.status === 'completed').length;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/project/${project.id}`)}
      testID={`project-card-${project.id}`}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{project.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {project.description}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.lead}>Lead: {project.lead}</Text>
        <Text style={styles.milestones}>
          {getCompletedMilestones()}/{project.milestones.length} milestones
        </Text>
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lead: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  milestones: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});