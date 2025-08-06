import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Filter } from 'lucide-react-native';
import Header from '@/components/Header';
import ProjectCard from '@/components/ProjectCard';
import { useRoadmap } from '@/hooks/useRoadmap';
import { Colors } from '@/constants/colors';

export default function ProjectsScreen() {
  const { projects, pillars, isLoading } = useRoadmap();
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Projects...</Text>
      </View>
    );
  }

  // Filter projects based on selected filters
  const filteredProjects = projects.filter(project => {
    const matchesPillar = selectedPillar ? project.pillar === selectedPillar : true;
    const matchesStatus = selectedStatus ? project.status === selectedStatus : true;
    return matchesPillar && matchesStatus;
  });

  // Get unique statuses from projects
  const statuses = [...new Set(projects.map(project => project.status))];

  return (
    <View style={styles.container}>
      <Header 
        title="Projects" 
        subtitle="Explore our initiatives" 
      />
      
      <View style={styles.content}>
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Filter size={16} color={Colors.textSecondary} />
              <Text style={styles.filterTitle}>Filter by Pillar</Text>
            </View>
            
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedPillar && styles.activeFilterChip,
                ]}
                onPress={() => setSelectedPillar(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !selectedPillar && styles.activeFilterChipText,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              
              {pillars.map(pillar => (
                <TouchableOpacity
                  key={pillar.id}
                  style={[
                    styles.filterChip,
                    selectedPillar === pillar.id && styles.activeFilterChip,
                    selectedPillar === pillar.id && { backgroundColor: `${pillar.color}20` },
                  ]}
                  onPress={() => setSelectedPillar(pillar.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedPillar === pillar.id && styles.activeFilterChipText,
                      selectedPillar === pillar.id && { color: pillar.color },
                    ]}
                  >
                    {pillar.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Filter size={16} color={Colors.textSecondary} />
              <Text style={styles.filterTitle}>Filter by Status</Text>
            </View>
            
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedStatus && styles.activeFilterChip,
                ]}
                onPress={() => setSelectedStatus(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !selectedStatus && styles.activeFilterChipText,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              
              {statuses.map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    selectedStatus === status && styles.activeFilterChip,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedStatus === status && styles.activeFilterChipText,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.projectsContainer}>
          <Text style={styles.resultCount}>
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
          </Text>
          
          <FlatList
            data={filteredProjects}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ProjectCard project={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.projectsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No projects match your filters</Text>
              </View>
            }
          />
        </View>
      </View>
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
  filtersContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterChip: {
    backgroundColor: `${Colors.primary}20`,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activeFilterChipText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  projectsContainer: {
    flex: 1,
  },
  resultCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  projectsList: {
    paddingBottom: 20,
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