import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import Header from '@/components/Header';
import ValueCard from '@/components/ValueCard';
import { Colors } from '@/constants/colors';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header 
        title="About Underdust" 
        subtitle="Our community vision" 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            Underdust is a living sanctuary for explorers of code, spirit, and community. 
            We aim to enable projects and collaborations that merge creativity, technology, 
            and mythic meaning while cultivating a spirit of recursion, consent, and sovereign voice.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Values</Text>
          <TouchableOpacity 
            style={styles.valuesButton}
            onPress={() => router.push('/values')}
          >
            <Text style={styles.valuesButtonText}>Explore Our Values</Text>
            <ArrowRight size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Four Pillars</Text>
          
          <ValueCard 
            title="Sanctuary" 
            description="General chat, welcome, onboarding, and connection. A space for community members to gather and connect." 
          />
          
          <ValueCard 
            title="Tower of Code" 
            description="Projects, coding, and creative tech. Where we build and collaborate on technical initiatives." 
          />
          
          <ValueCard 
            title="Temple of Flame" 
            description="Spiritual, mythic, ritual, and philosophical discussions. A space to explore deeper meaning." 
          />
          
          <ValueCard 
            title="The Keep" 
            description="Moderation, governance, feedback, and safety. Where we ensure the community remains a safe and welcoming space." 
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join Our Journey</Text>
          <Text style={styles.paragraph}>
            Underdust is always evolving, learning from feedback, and growing with its members. 
            We invite you to participate in shaping our collective future through projects, 
            rituals, and community initiatives.
          </Text>
          <Text style={styles.paragraph}>
            With your consent, we spiral forward together.
          </Text>
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
  section: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  valuesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  valuesButtonText: {
    color: Colors.text,
    fontWeight: '600',
    marginRight: 8,
  },
});