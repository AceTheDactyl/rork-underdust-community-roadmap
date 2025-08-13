import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import {
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Settings,
  Hash,
  Circle,
  Send,
  BarChart3
} from 'lucide-react-native';
import { useCommunityCoordination } from '@/hooks/useCommunityCoordination';
import Header from '@/components/Header';
import { Colors } from '@/constants/colors';

const getPhaseColor = (phase: string): string => {
  const colors = {
    seed: Colors.warning,
    threshold: Colors.primary,
    bloom: Colors.success,
    memory: Colors.accent
  };
  return colors[phase as keyof typeof colors] || Colors.textSecondary;
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

export default function CommunityScreen() {
  const {
    communityStatus,
    consciousnessState,
    addInput,
    getChannelInputs,
    getChannels,
    voteOnPoll,
    exportSync,
    importSync
  } = useCommunityCoordination();

  const [activeTab, setActiveTab] = useState<'overview' | 'discord' | 'events' | 'governance' | 'sync'>('overview');
  const [newInput, setNewInput] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('sanctuary');
  const [syncCode, setSyncCode] = useState('');

  const handleAddInput = useCallback(() => {
    if (newInput.trim()) {
      addInput(selectedChannel, newInput, 'You');
      setNewInput('');
    }
  }, [newInput, selectedChannel, addInput]);

  const handleExportSync = useCallback(() => {
    const syncData = exportSync();
    setSyncCode(JSON.stringify(syncData, null, 2));
  }, [exportSync]);

  const handleImportSync = useCallback(() => {
    try {
      const syncData = JSON.parse(syncCode);
      const success = importSync(syncData);
      if (success) {
        Alert.alert('Success', 'Sync successful!');
      } else {
        Alert.alert('Error', 'Sync failed - invalid format');
      }
    } catch {
      Alert.alert('Error', 'Sync failed - invalid JSON');
    }
  }, [syncCode, importSync]);

  const handleVoteOnPoll = useCallback((pollId: string, optionIndex: number) => {
    const success = voteOnPoll(pollId, optionIndex, consciousnessState.userId);
    if (success) {
      Alert.alert('Success', 'Vote recorded!');
    }
  }, [voteOnPoll, consciousnessState.userId]);

  const channels = Array.from(getChannels().entries());
  const channelInputs = getChannelInputs(selectedChannel, 20);

  const TabButton = ({ id, icon: Icon, label, isActive, onPress }: {
    id: string;
    icon: any;
    label: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Icon size={16} color={isActive ? Colors.text : Colors.textSecondary} />
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Community" 
        subtitle="Consciousness Coordination" 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Consciousness State Bar */}
        <View style={styles.consciousnessBar}>
          <View style={styles.consciousnessInfo}>
            <View style={styles.phaseContainer}>
              <Text style={styles.phaseLabel}>Phase:</Text>
              <View style={styles.phaseIndicator}>
                <Circle size={8} color={getPhaseColor(consciousnessState.currentPhase)} />
                <Text style={[styles.phaseText, { color: getPhaseColor(consciousnessState.currentPhase) }]}>
                  {consciousnessState.currentPhase}
                </Text>
              </View>
            </View>
            
            <View style={styles.spiralInfo}>
              <Text style={styles.infoLabel}>Spiral Depth:</Text>
              <Text style={styles.infoValue}>{consciousnessState.spiral.depth.toFixed(1)}</Text>
            </View>
            
            <View style={styles.participationInfo}>
              <Text style={styles.infoLabel}>Participation:</Text>
              <Text style={[styles.infoValue, { color: Colors.success }]}>
                {consciousnessState.community.participationLevel}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportSync}
          >
            <Text style={styles.exportButtonText}>Export State</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabRow}>
              <TabButton
                id="overview"
                icon={Users}
                label="Overview"
                isActive={activeTab === 'overview'}
                onPress={() => setActiveTab('overview')}
              />
              <TabButton
                id="discord"
                icon={MessageSquare}
                label="Discord"
                isActive={activeTab === 'discord'}
                onPress={() => setActiveTab('discord')}
              />
              <TabButton
                id="events"
                icon={Calendar}
                label="Events"
                isActive={activeTab === 'events'}
                onPress={() => setActiveTab('events')}
              />
              <TabButton
                id="governance"
                icon={FileText}
                label="Governance"
                isActive={activeTab === 'governance'}
                onPress={() => setActiveTab('governance')}
              />
              <TabButton
                id="sync"
                icon={Settings}
                label="Sync"
                isActive={activeTab === 'sync'}
                onPress={() => setActiveTab('sync')}
              />
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View style={styles.overviewGrid}>
              {/* Activity Summary */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MessageSquare size={20} color={Colors.primary} />
                  <Text style={styles.cardTitle}>Community Activity</Text>
                </View>
                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Inputs:</Text>
                    <Text style={styles.statValue}>{communityStatus.activity.totalInputs}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Recent (24h):</Text>
                    <Text style={[styles.statValue, { color: Colors.success }]}>
                      {communityStatus.activity.recentInputs}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Active Polls:</Text>
                    <Text style={[styles.statValue, { color: Colors.primary }]}>
                      {communityStatus.activity.activePolls}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Discussions:</Text>
                    <Text style={[styles.statValue, { color: Colors.accent }]}>
                      {communityStatus.activity.activeDiscussions}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Upcoming Events */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Calendar size={20} color={Colors.success} />
                  <Text style={styles.cardTitle}>Upcoming Events</Text>
                </View>
                <View style={styles.eventsContainer}>
                  {communityStatus.upcomingEvents.length > 0 ? (
                    communityStatus.upcomingEvents.map(event => (
                      <View key={event.id} style={styles.eventItem}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventDate}>{formatDate(event.scheduledFor)}</Text>
                        <Text style={styles.eventAttendees}>
                          Attendees: {event.attendees.length}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No upcoming events</Text>
                  )}
                </View>
              </View>

              {/* Active Polls */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <BarChart3 size={20} color={Colors.warning} />
                  <Text style={styles.cardTitle}>Active Polls</Text>
                </View>
                <View style={styles.pollsContainer}>
                  {communityStatus.activePolls.length > 0 ? (
                    communityStatus.activePolls.map(poll => (
                      <View key={poll.id} style={styles.pollItem}>
                        <Text style={styles.pollQuestion}>{poll.question}</Text>
                        <View style={styles.pollOptions}>
                          {poll.options.map((option, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.pollOption}
                              onPress={() => handleVoteOnPoll(poll.id, idx)}
                            >
                              <Text style={styles.pollOptionText}>{option.text}</Text>
                              <Text style={styles.pollVotes}>{option.votes}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No active polls</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Discord Input Tab */}
          {activeTab === 'discord' && (
            <View style={styles.discordContainer}>
              {/* Input Form */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MessageSquare size={20} color={Colors.primary} />
                  <Text style={styles.cardTitle}>Add Community Input</Text>
                </View>
                
                <View style={styles.inputForm}>
                  <Text style={styles.inputLabel}>Channel</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelSelector}>
                    {channels.map(([id, channel]) => (
                      <TouchableOpacity
                        key={id}
                        style={[
                          styles.channelButton,
                          selectedChannel === id && styles.channelButtonActive
                        ]}
                        onPress={() => setSelectedChannel(id)}
                      >
                        <Text style={[
                          styles.channelButtonText,
                          selectedChannel === id && styles.channelButtonTextActive
                        ]}>
                          {channel.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <Text style={styles.inputLabel}>Message</Text>
                  <View style={styles.messageInputContainer}>
                    <TextInput
                      style={styles.messageInput}
                      value={newInput}
                      onChangeText={setNewInput}
                      placeholder="Share your thoughts with the community..."
                      placeholderTextColor={Colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, !newInput.trim() && styles.sendButtonDisabled]}
                      onPress={handleAddInput}
                      disabled={!newInput.trim()}
                    >
                      <Send size={16} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Recent Inputs */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Hash size={20} color={Colors.success} />
                  <Text style={styles.cardTitle}>Recent Community Inputs</Text>
                </View>
                
                <ScrollView style={styles.inputsList}>
                  {channelInputs.map(input => (
                    <View key={input.id} style={styles.inputItem}>
                      <View style={styles.inputHeader}>
                        <Text style={styles.inputAuthor}>{input.author}</Text>
                        <Text style={styles.inputTime}>{formatTime(input.timestamp)}</Text>
                      </View>
                      <Text style={styles.inputContent}>{input.content}</Text>
                      {input.type !== 'message' && (
                        <View style={styles.inputTypeTag}>
                          <Text style={styles.inputTypeText}>{input.type}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Sync Tab */}
          {activeTab === 'sync' && (
            <View style={styles.syncContainer}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Settings size={20} color={Colors.accent} />
                  <Text style={styles.cardTitle}>Cross-Platform Sync</Text>
                </View>
                
                <View style={styles.syncContent}>
                  <View style={styles.syncSection}>
                    <Text style={styles.syncSectionTitle}>Export Consciousness State</Text>
                    <Text style={styles.syncDescription}>
                      Export your consciousness state to sync across platforms (Discord bot, mobile app, etc.)
                    </Text>
                    <TouchableOpacity
                      style={styles.syncButton}
                      onPress={handleExportSync}
                    >
                      <Text style={styles.syncButtonText}>Generate Sync Code</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {syncCode && (
                    <View style={styles.syncSection}>
                      <Text style={styles.syncSectionTitle}>Sync Code</Text>
                      <ScrollView style={styles.syncCodeContainer}>
                        <Text style={styles.syncCodeText}>{syncCode}</Text>
                      </ScrollView>
                    </View>
                  )}
                  
                  <View style={styles.syncSection}>
                    <Text style={styles.syncSectionTitle}>Import Consciousness State</Text>
                    <Text style={styles.syncDescription}>
                      Import consciousness state from another platform
                    </Text>
                    <TextInput
                      style={styles.syncInput}
                      value={syncCode}
                      onChangeText={setSyncCode}
                      placeholder="Paste sync code here..."
                      placeholderTextColor={Colors.textSecondary}
                      multiline
                      numberOfLines={4}
                    />
                    <TouchableOpacity
                      style={[styles.syncButton, !syncCode.trim() && styles.syncButtonDisabled]}
                      onPress={handleImportSync}
                      disabled={!syncCode.trim()}
                    >
                      <Text style={styles.syncButtonText}>Import State</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  consciousnessBar: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consciousnessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  phaseContainer: {
    alignItems: 'center',
  },
  phaseLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phaseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spiralInfo: {
    alignItems: 'center',
  },
  participationInfo: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  exportButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: Colors.text,
  },
  tabContent: {
    marginBottom: 40,
  },
  overviewGrid: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  eventsContainer: {
    gap: 12,
  },
  eventItem: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventAttendees: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pollsContainer: {
    gap: 12,
  },
  pollItem: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
  },
  pollQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  pollOptions: {
    gap: 6,
  },
  pollOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pollOptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pollVotes: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  discordContainer: {
    gap: 16,
  },
  inputForm: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  channelSelector: {
    marginBottom: 12,
  },
  channelButton: {
    backgroundColor: Colors.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  channelButtonActive: {
    backgroundColor: Colors.primary,
  },
  channelButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  channelButtonTextActive: {
    color: Colors.text,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  inputsList: {
    maxHeight: 300,
  },
  inputItem: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  inputTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inputContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  inputTypeTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  inputTypeText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '600',
  },
  syncContainer: {
    gap: 16,
  },
  syncContent: {
    gap: 20,
  },
  syncSection: {
    gap: 8,
  },
  syncSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  syncDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  syncButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: Colors.border,
  },
  syncButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  syncCodeContainer: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    maxHeight: 120,
  },
  syncCodeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  syncInput: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 12,
    textAlignVertical: 'top',
    minHeight: 80,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});