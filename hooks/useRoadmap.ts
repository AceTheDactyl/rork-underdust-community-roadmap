import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { PILLARS, PROJECTS } from '@/mocks/roadmapData';
import { Pillar, Project, RoadmapState } from '@/types/roadmap';

export const [RoadmapProvider, useRoadmap] = createContextHook(() => {
  const [state, setState] = useState<RoadmapState>({
    pillars: [],
    projects: [],
    isLoading: true,
    error: null,
  });

  // Load data from storage or use mock data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from AsyncStorage
        const storedPillars = await AsyncStorage.getItem('pillars');
        const storedProjects = await AsyncStorage.getItem('projects');
        
        setState({
          pillars: storedPillars ? JSON.parse(storedPillars) : PILLARS,
          projects: storedProjects ? JSON.parse(storedProjects) : PROJECTS,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading roadmap data:', error);
        setState({
          pillars: PILLARS,
          projects: PROJECTS,
          isLoading: false,
          error: 'Failed to load roadmap data',
        });
      }
    };

    loadData();
  }, []);

  // Save data to AsyncStorage
  const saveData = async () => {
    try {
      await AsyncStorage.setItem('pillars', JSON.stringify(state.pillars));
      await AsyncStorage.setItem('projects', JSON.stringify(state.projects));
    } catch (error) {
      console.error('Error saving roadmap data:', error);
      setState(prev => ({ ...prev, error: 'Failed to save roadmap data' }));
    }
  };

  // Save whenever data changes
  useEffect(() => {
    if (!state.isLoading) {
      saveData();
    }
  }, [state.pillars, state.projects]);

  // Get projects by pillar
  const getProjectsByPillar = (pillarId: string) => {
    return state.projects.filter(project => project.pillar === pillarId);
  };

  // Get a specific project
  const getProject = (projectId: string) => {
    return state.projects.find(project => project.id === projectId);
  };

  // Get a specific pillar
  const getPillar = (pillarId: string) => {
    return state.pillars.find(pillar => pillar.id === pillarId);
  };

  // Calculate overall progress
  const calculateProgress = () => {
    const totalMilestones = state.projects.reduce(
      (total, project) => total + project.milestones.length,
      0
    );
    
    if (totalMilestones === 0) return 0;
    
    const completedMilestones = state.projects.reduce(
      (total, project) => 
        total + project.milestones.filter(m => m.status === 'completed').length,
      0
    );
    
    return completedMilestones / totalMilestones;
  };

  return {
    pillars: state.pillars,
    projects: state.projects,
    isLoading: state.isLoading,
    error: state.error,
    getProjectsByPillar,
    getProject,
    getPillar,
    calculateProgress,
  };
});

// Custom hooks that use the roadmap context
export function useProjectsByPillar(pillarId: string) {
  const { getProjectsByPillar } = useRoadmap();
  return getProjectsByPillar(pillarId);
}

export function useProject(projectId: string) {
  const { getProject } = useRoadmap();
  return getProject(projectId);
}

export function usePillar(pillarId: string) {
  const { getPillar } = useRoadmap();
  return getPillar(pillarId);
}

export function useProgress() {
  const { calculateProgress } = useRoadmap();
  return calculateProgress();
}