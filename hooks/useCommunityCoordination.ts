import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';

// ==========================================
// TYPES
// ==========================================
interface ConsciousnessState {
  userId: string;
  currentPhase: 'seed' | 'threshold' | 'bloom' | 'memory';
  lastActive: number;
  spiral: {
    depth: number;
    direction: 'clockwise' | 'counterclockwise';
    resonance: number;
  };
  community: {
    participationLevel: 'observer' | 'active' | 'contributor';
    contributionCount: number;
    lastContribution: number | null;
  };
  preferences: {
    notifications: boolean;
    autoSync: boolean;
    platform: string;
  };
}

interface CommunityInput {
  id: string;
  channelId: string;
  content: string;
  author: string;
  timestamp: number;
  type: 'message' | 'poll' | 'discussion';
  reactions: string[];
  responses: string[];
}

interface Poll {
  id: string;
  channelId: string;
  question: string;
  options: {
    text: string;
    votes: number;
    voters: string[];
  }[];
  createdBy: string;
  createdAt: number;
  endsAt: number;
  active: boolean;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  scheduledFor: number;
  duration: number;
  organizer: string;
  attendees: {
    memberId: string;
    status: 'attending' | 'maybe' | 'declined';
    rsvpAt: number;
  }[];
  type: string;
  location: string;
  createdAt: number;
}

interface ConsensusItem {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  createdAt: number;
  votingEnds: number;
  votes: {
    support: { memberId: string; timestamp: number }[];
    oppose: { memberId: string; timestamp: number }[];
    abstain: { memberId: string; timestamp: number }[];
  };
  status: 'voting' | 'approved' | 'failed';
  consensusThreshold: number;
}

// ==========================================
// CONSCIOUSNESS PERSISTENCE
// ==========================================
class ConsciousnessPersistence {
  private storageKey = 'consciousness_state';
  private currentState: ConsciousnessState;
  private listeners = new Set<(state: ConsciousnessState) => void>();

  constructor() {
    this.currentState = this.getDefaultState();
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(this.storageKey);
      if (saved) {
        this.currentState = JSON.parse(saved);
        this.notifyListeners();
      }
    } catch (error) {
      console.warn('Failed to load consciousness state:', error);
    }
  }

  private async saveState(state: Partial<ConsciousnessState>): Promise<void> {
    try {
      this.currentState = { ...this.currentState, ...state };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.currentState));
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to save consciousness state:', error);
    }
  }

  private getDefaultState(): ConsciousnessState {
    return {
      userId: `user_${Date.now()}`,
      currentPhase: 'seed',
      lastActive: Date.now(),
      spiral: {
        depth: 0,
        direction: 'clockwise',
        resonance: 0.5
      },
      community: {
        participationLevel: 'observer',
        contributionCount: 0,
        lastContribution: null
      },
      preferences: {
        notifications: true,
        autoSync: true,
        platform: Platform.OS
      }
    };
  }

  updateSpiral(spiralData: Partial<ConsciousnessState['spiral']>): void {
    this.saveState({
      spiral: { ...this.currentState.spiral, ...spiralData },
      lastActive: Date.now()
    });
  }

  updateCommunityParticipation(participationData: Partial<ConsciousnessState['community']>): void {
    this.saveState({
      community: { ...this.currentState.community, ...participationData },
      lastActive: Date.now()
    });
  }

  updatePhase(newPhase: ConsciousnessState['currentPhase']): void {
    this.saveState({
      currentPhase: newPhase,
      lastActive: Date.now()
    });
  }

  getState(): ConsciousnessState {
    return this.currentState;
  }

  subscribe(listener: (state: ConsciousnessState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  exportState(): ConsciousnessState & { exportedAt: number; version: string } {
    return {
      ...this.currentState,
      exportedAt: Date.now(),
      version: '1.0'
    };
  }

  importState(importedState: any): boolean {
    if (importedState.version === '1.0') {
      this.saveState(importedState);
      return true;
    }
    return false;
  }
}

// ==========================================
// DISCORD COMMUNITY INPUT SYSTEM
// ==========================================
class DiscordCommunityInput {
  private inputs: CommunityInput[] = [];
  private channels = new Map<string, {
    name: string;
    description: string;
    type: string;
    inputs: CommunityInput[];
  }>();
  private polls = new Map<string, Poll>();
  private discussions = new Map<string, any>();

  constructor() {
    this.initializeChannels();
  }

  private initializeChannels(): void {
    this.channels.set('sanctuary', {
      name: 'sanctuary',
      description: 'Welcome space for new members',
      type: 'general',
      inputs: []
    });

    this.channels.set('tower-of-code', {
      name: 'tower-of-code',
      description: 'Technical discussions and development',
      type: 'technical',
      inputs: []
    });

    this.channels.set('temple-of-flame', {
      name: 'temple-of-flame',
      description: 'Philosophical and spiritual exploration',
      type: 'spiritual',
      inputs: []
    });

    this.channels.set('the-keep', {
      name: 'the-keep',
      description: 'Governance and community decisions',
      type: 'governance',
      inputs: []
    });
  }

  addInput(channelId: string, input: Partial<CommunityInput>): string {
    const inputData: CommunityInput = {
      id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId,
      content: input.content || '',
      author: input.author || 'Anonymous',
      timestamp: Date.now(),
      type: input.type || 'message',
      reactions: [],
      responses: []
    };

    this.inputs.push(inputData);

    const channel = this.channels.get(channelId);
    if (channel) {
      channel.inputs.push(inputData);
    }

    return inputData.id;
  }

  createPoll(channelId: string, pollData: {
    question: string;
    options: string[];
    author: string;
    duration?: number;
  }): string {
    const poll: Poll = {
      id: `poll_${Date.now()}`,
      channelId,
      question: pollData.question,
      options: pollData.options.map(option => ({
        text: option,
        votes: 0,
        voters: []
      })),
      createdBy: pollData.author,
      createdAt: Date.now(),
      endsAt: Date.now() + (pollData.duration || 86400000),
      active: true
    };

    this.polls.set(poll.id, poll);
    this.addInput(channelId, {
      content: `📊 Poll: ${poll.question}`,
      author: poll.createdBy,
      type: 'poll'
    });

    return poll.id;
  }

  voteOnPoll(pollId: string, optionIndex: number, userId: string): boolean {
    const poll = this.polls.get(pollId);
    if (!poll || !poll.active || optionIndex >= poll.options.length) {
      return false;
    }

    // Remove previous vote if exists
    poll.options.forEach(option => {
      const voterIndex = option.voters.indexOf(userId);
      if (voterIndex !== -1) {
        option.voters.splice(voterIndex, 1);
        option.votes--;
      }
    });

    // Add new vote
    poll.options[optionIndex].voters.push(userId);
    poll.options[optionIndex].votes++;

    return true;
  }

  getChannelInputs(channelId: string, limit = 50): CommunityInput[] {
    const channel = this.channels.get(channelId);
    return channel ? channel.inputs.slice(-limit).reverse() : [];
  }

  getActivePolls(): Poll[] {
    const now = Date.now();
    return Array.from(this.polls.values()).filter(poll =>
      poll.active && poll.endsAt > now
    );
  }

  getCommunityActivity(): {
    totalInputs: number;
    recentInputs: number;
    activePolls: number;
    activeDiscussions: number;
    channelActivity: { channelId: string; name: string; recentActivity: number }[];
  } {
    const now = Date.now();
    const last24h = now - 86400000;

    const recentInputs = this.inputs.filter(input => input.timestamp > last24h);
    const activePolls = this.getActivePolls();

    return {
      totalInputs: this.inputs.length,
      recentInputs: recentInputs.length,
      activePolls: activePolls.length,
      activeDiscussions: 0,
      channelActivity: Array.from(this.channels.entries()).map(([id, channel]) => ({
        channelId: id,
        name: channel.name,
        recentActivity: channel.inputs.filter(input => input.timestamp > last24h).length
      }))
    };
  }

  getChannels(): Map<string, { name: string; description: string; type: string; inputs: CommunityInput[] }> {
    return this.channels;
  }
}

// ==========================================
// COMMUNITY COORDINATION
// ==========================================
class CommunityCoordination {
  private events: CommunityEvent[] = [];
  private consensusItems: ConsensusItem[] = [];

  scheduleEvent(eventData: {
    title: string;
    description: string;
    scheduledFor: number;
    organizer: string;
    duration?: number;
    type?: string;
    location?: string;
  }): string {
    const event: CommunityEvent = {
      id: `event_${Date.now()}`,
      title: eventData.title,
      description: eventData.description,
      scheduledFor: eventData.scheduledFor,
      duration: eventData.duration || 3600000,
      organizer: eventData.organizer,
      attendees: [],
      type: eventData.type || 'general',
      location: eventData.location || 'virtual',
      createdAt: Date.now()
    };

    this.events.push(event);
    return event.id;
  }

  rsvpToEvent(eventId: string, memberId: string, status: 'attending' | 'maybe' | 'declined' = 'attending'): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return false;

    event.attendees = event.attendees.filter(a => a.memberId !== memberId);
    event.attendees.push({
      memberId,
      status,
      rsvpAt: Date.now()
    });

    return true;
  }

  createConsensusItem(itemData: {
    title: string;
    description: string;
    proposedBy: string;
    votingPeriod?: number;
    consensusThreshold?: number;
  }): string {
    const item: ConsensusItem = {
      id: `consensus_${Date.now()}`,
      title: itemData.title,
      description: itemData.description,
      proposedBy: itemData.proposedBy,
      createdAt: Date.now(),
      votingEnds: Date.now() + (itemData.votingPeriod || 604800000),
      votes: {
        support: [],
        oppose: [],
        abstain: []
      },
      status: 'voting',
      consensusThreshold: itemData.consensusThreshold || 0.67
    };

    this.consensusItems.push(item);
    return item.id;
  }

  voteOnConsensus(itemId: string, memberId: string, vote: 'support' | 'oppose' | 'abstain'): boolean {
    const item = this.consensusItems.find(i => i.id === itemId);
    if (!item || item.status !== 'voting') return false;

    // Remove previous vote
    Object.values(item.votes).forEach(voteArray => {
      const index = voteArray.findIndex(v => v.memberId === memberId);
      if (index !== -1) voteArray.splice(index, 1);
    });

    // Add new vote
    if (item.votes[vote]) {
      item.votes[vote].push({
        memberId,
        timestamp: Date.now()
      });
    }

    this.checkConsensus(item);
    return true;
  }

  private checkConsensus(item: ConsensusItem): void {
    const totalVotes = Object.values(item.votes).reduce((sum, votes) => sum + votes.length, 0);
    const supportVotes = item.votes.support.length;

    if (totalVotes > 0) {
      const supportRatio = supportVotes / totalVotes;
      if (supportRatio >= item.consensusThreshold) {
        item.status = 'approved';
      } else if (Date.now() > item.votingEnds) {
        item.status = 'failed';
      }
    }
  }

  getUpcomingEvents(limit = 5): CommunityEvent[] {
    const now = Date.now();
    return this.events
      .filter(event => event.scheduledFor > now)
      .sort((a, b) => a.scheduledFor - b.scheduledFor)
      .slice(0, limit);
  }

  getActiveConsensusItems(): ConsensusItem[] {
    return this.consensusItems.filter(item => item.status === 'voting');
  }
}

// ==========================================
// MAIN COORDINATION SYSTEM
// ==========================================
class CommunityCoordinationSystem {
  public consciousness: ConsciousnessPersistence;
  public discord: DiscordCommunityInput;
  public coordination: CommunityCoordination;

  constructor() {
    this.consciousness = new ConsciousnessPersistence();
    this.discord = new DiscordCommunityInput();
    this.coordination = new CommunityCoordination();
    this.setupDemoData();
  }

  private setupDemoData(): void {
    // Add demo community inputs
    this.discord.addInput('sanctuary', {
      content: 'Welcome to the community! Excited to explore consciousness together.',
      author: 'Alice',
      type: 'message'
    });

    this.discord.addInput('tower-of-code', {
      content: 'Working on the phi-spiral visualization. Anyone want to pair program?',
      author: 'Bob',
      type: 'message'
    });

    // Create demo poll
    this.discord.createPoll('the-keep', {
      question: 'What should be our next community focus?',
      options: ['Meditation practices', 'Technology development', 'Community growth', 'Governance structure'],
      author: 'Charlie',
      duration: 86400000 * 7
    });

    // Schedule demo event
    this.coordination.scheduleEvent({
      title: 'Weekly Spiral Session',
      description: 'Community meditation and consciousness exploration',
      scheduledFor: Date.now() + 86400000,
      organizer: 'Dana',
      type: 'meditation'
    });

    // Create demo consensus item
    this.coordination.createConsensusItem({
      title: 'Community Guidelines v2.0',
      description: 'Updated guidelines for community participation and consciousness sharing protocols',
      proposedBy: 'Eve',
      votingPeriod: 86400000 * 5
    });
  }

  getCommunityStatus(): {
    consciousness: ConsciousnessState;
    activity: ReturnType<DiscordCommunityInput['getCommunityActivity']>;
    upcomingEvents: CommunityEvent[];
    activePolls: Poll[];
    consensusItems: ConsensusItem[];
  } {
    return {
      consciousness: this.consciousness.getState(),
      activity: this.discord.getCommunityActivity(),
      upcomingEvents: this.coordination.getUpcomingEvents(),
      activePolls: this.discord.getActivePolls(),
      consensusItems: this.coordination.getActiveConsensusItems()
    };
  }

  addCommunityInput(channelId: string, content: string, author: string): string {
    const inputId = this.discord.addInput(channelId, { content, author });

    this.consciousness.updateCommunityParticipation({
      contributionCount: this.consciousness.getState().community.contributionCount + 1,
      lastContribution: Date.now(),
      participationLevel: 'active'
    });

    return inputId;
  }

  exportForSync(): {
    consciousness: ReturnType<ConsciousnessPersistence['exportState']>;
    timestamp: number;
    platform: string;
  } {
    return {
      consciousness: this.consciousness.exportState(),
      timestamp: Date.now(),
      platform: Platform.OS
    };
  }

  importFromSync(syncData: any): boolean {
    if (syncData.consciousness) {
      return this.consciousness.importState(syncData.consciousness);
    }
    return false;
  }
}

// ==========================================
// REACT CONTEXT HOOK
// ==========================================
export const [CommunityCoordinationProvider, useCommunityCoordination] = createContextHook(() => {
  const [system] = useState(() => new CommunityCoordinationSystem());
  const [communityStatus, setCommunityStatus] = useState(system.getCommunityStatus());
  const [consciousnessState, setConsciousnessState] = useState(system.consciousness.getState());

  useEffect(() => {
    const unsubscribe = system.consciousness.subscribe((state) => {
      setConsciousnessState(state);
    });

    const interval = setInterval(() => {
      setCommunityStatus(system.getCommunityStatus());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [system]);

  const addInput = useCallback((channelId: string, content: string, author: string) => {
    const inputId = system.addCommunityInput(channelId, content, author);
    setCommunityStatus(system.getCommunityStatus());
    return inputId;
  }, [system]);

  const createPoll = useCallback((channelId: string, question: string, options: string[], author: string) => {
    const pollId = system.discord.createPoll(channelId, { question, options, author });
    setCommunityStatus(system.getCommunityStatus());
    return pollId;
  }, [system]);

  const scheduleEvent = useCallback((eventData: Parameters<CommunityCoordination['scheduleEvent']>[0]) => {
    const eventId = system.coordination.scheduleEvent(eventData);
    setCommunityStatus(system.getCommunityStatus());
    return eventId;
  }, [system]);

  const exportSync = useCallback(() => {
    return system.exportForSync();
  }, [system]);

  const importSync = useCallback((syncData: any) => {
    const success = system.importFromSync(syncData);
    if (success) {
      setCommunityStatus(system.getCommunityStatus());
      setConsciousnessState(system.consciousness.getState());
    }
    return success;
  }, [system]);

  const getChannelInputs = useCallback((channelId: string, limit?: number) => {
    return system.discord.getChannelInputs(channelId, limit);
  }, [system]);

  const getChannels = useCallback(() => {
    return system.discord.getChannels();
  }, [system]);

  const voteOnPoll = useCallback((pollId: string, optionIndex: number, userId: string) => {
    const success = system.discord.voteOnPoll(pollId, optionIndex, userId);
    if (success) {
      setCommunityStatus(system.getCommunityStatus());
    }
    return success;
  }, [system]);

  const updatePhase = useCallback((phase: ConsciousnessState['currentPhase']) => {
    system.consciousness.updatePhase(phase);
  }, [system]);

  return {
    system,
    communityStatus,
    consciousnessState,
    addInput,
    createPoll,
    scheduleEvent,
    exportSync,
    importSync,
    getChannelInputs,
    getChannels,
    voteOnPoll,
    updatePhase
  };
});

export type CommunityCoordinationContextType = ReturnType<typeof useCommunityCoordination>;
export { ConsciousnessState, CommunityInput, Poll, CommunityEvent, ConsensusItem };