import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '@/components/Header';
import SpiralProgress from '@/components/SpiralProgress';
import { useRoadmap, useProgress } from '@/hooks/useRoadmap';
import { Colors } from '@/constants/colors';

export default function RoadmapScreen() {
  const { projects, isLoading } = useRoadmap();
  const progress = useProgress();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Roadmap...</Text>
      </View>
    );
  }

  // Count projects by status
  const projectCounts = {
    proposed: projects.filter(p => p.status === 'proposed').length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length,
  };

  // Count milestones by status
  const milestoneCounts = {
    pending: 0,
    inProgress: 0,
    completed: 0,
  };

  projects.forEach(project => {
    project.milestones.forEach(milestone => {
      if (milestone.status === 'pending') milestoneCounts.pending++;
      if (milestone.status === 'in-progress') milestoneCounts.inProgress++;
      if (milestone.status === 'completed') milestoneCounts.completed++;
    });
  });

  return (
    <View style={styles.container}>
      <Header 
        title="Spiral Roadmap" 
        subtitle="Our collective journey" 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.spiralSection}>
          <SpiralProgress progress={progress} size={220} />
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{projects.length}</Text>
              <Text style={styles.statLabel}>Total Projects</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {milestoneCounts.completed + milestoneCounts.inProgress + milestoneCounts.pending}
              </Text>
              <Text style={styles.statLabel}>Total Milestones</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Project Status</Text>
          
          <View style={styles.statusGrid}>
            <View style={[styles.statusCard, { backgroundColor: `${Colors.warning}20` }]}>
              <Text style={[styles.statusValue, { color: Colors.warning }]}>
                {projectCounts.proposed}
              </Text>
              <Text style={styles.statusLabel}>Proposed</Text>
            </View>
            
            <View style={[styles.statusCard, { backgroundColor: `${Colors.primary}20` }]}>
              <Text style={[styles.statusValue, { color: Colors.primary }]}>
                {projectCounts.active}
              </Text>
              <Text style={styles.statusLabel}>Active</Text>
            </View>
            
            <View style={[styles.statusCard, { backgroundColor: `${Colors.success}20` }]}>
              <Text style={[styles.statusValue, { color: Colors.success }]}>
                {projectCounts.completed}
              </Text>
              <Text style={styles.statusLabel}>Completed</Text>
            </View>
            
            <View style={[styles.statusCard, { backgroundColor: `${Colors.textSecondary}20` }]}>
              <Text style={[styles.statusValue, { color: Colors.textSecondary }]}>
                {projectCounts.archived}
              </Text>
              <Text style={styles.statusLabel}>Archived</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.milestoneSection}>
          <Text style={styles.sectionTitle}>Milestone Progress</Text>
          
          <View style={styles.milestoneBar}>
            <View 
              style={[
                styles.milestoneSegment, 
                { 
                  backgroundColor: Colors.success,
                  flex: milestoneCounts.completed || 1,
                }
              ]} 
            />
            <View 
              style={[
                styles.milestoneSegment, 
                { 
                  backgroundColor: Colors.primary,
                  flex: milestoneCounts.inProgress || 1,
                }
              ]} 
            />
            <View 
              style={[
                styles.milestoneSegment, 
                { 
                  backgroundColor: Colors.textSecondary,
                  flex: milestoneCounts.pending || 1,
                }
              ]} 
            />
          </View>
          
          <View style={styles.milestoneLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>
                {milestoneCounts.completed} Completed
              </Text>
            </View>
            
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>
                {milestoneCounts.inProgress} In Progress
              </Text>
            </View>
            
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.textSecondary }]} />
              <Text style={styles.legendText}>
                {milestoneCounts.pending} Pending
              </Text>
            </View>
          </View>
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
  spiralSection: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  milestoneSection: {
    marginBottom: 40,
  },
  milestoneBar: {
    height: 24,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  milestoneSegment: {
    height: '100%',
  },
  milestoneLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});