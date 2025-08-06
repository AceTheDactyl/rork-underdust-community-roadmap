export type PillarType = 'sanctuary' | 'tower' | 'temple' | 'keep';

export interface Project {
  id: string;
  title: string;
  description: string;
  pillar: PillarType;
  lead: string;
  status: 'proposed' | 'active' | 'completed' | 'archived';
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

export interface Pillar {
  id: PillarType;
  name: string;
  description: string;
  keeper: string;
  icon: string;
  color: string;
}

export interface RoadmapState {
  pillars: Pillar[];
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}