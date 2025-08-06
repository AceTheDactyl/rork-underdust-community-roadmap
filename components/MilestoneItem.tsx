import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle, Circle, Clock } from 'lucide-react-native';
import { Milestone } from '@/types/roadmap';
import { Colors } from '@/constants/colors';

interface MilestoneItemProps {
  milestone: Milestone;
}

export default function MilestoneItem({ milestone }: MilestoneItemProps) {
  const getStatusIcon = () => {
    switch (milestone.status) {
      case 'completed':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'in-progress':
        return <Clock size={20} color={Colors.primary} />;
      case 'pending':
        return <Circle size={20} color={Colors.textSecondary} />;
      default:
        return <Circle size={20} color={Colors.textSecondary} />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container} testID={`milestone-${milestone.id}`}>
      <View style={styles.iconContainer}>{getStatusIcon()}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{milestone.title}</Text>
        <Text style={styles.description}>{milestone.description}</Text>
        {milestone.dueDate && (
          <Text style={styles.date}>Due: {formatDate(milestone.dueDate)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.primary,
  },
});