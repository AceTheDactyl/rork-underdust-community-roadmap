import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import ValueCard from '@/components/ValueCard';
import { Colors } from '@/constants/colors';

export default function ValuesScreen() {
  const router = useRouter();

  const values = [
    {
      id: '1',
      title: 'Sovereignty',
      description: 'Every member\'s agency is honored. We respect individual choices and perspectives, ensuring that each person has a voice in our community.',
    },
    {
      id: '2',
      title: 'Consent',
      description: 'Participation and decision-making are opt-in and explicit. We believe in clear communication and mutual agreement in all community activities.',
    },
    {
      id: '3',
      title: 'Recursion',
      description: 'The roadmap and community are always evolving, learning from feedback. We embrace continuous improvement and adaptation based on our collective experiences.',
    },
    {
      id: '4',
      title: 'Sanctuary',
      description: 'Emotional and psychological safety are fundamental. We create a space where members feel secure to express themselves and explore ideas without fear.',
    },
    {
      id: '5',
      title: 'Transparency',
      description: 'Decisions and changes are documented and accessible. We maintain open communication about community processes and developments.',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.secondary, Colors.gradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Community Values</Text>
          <Text style={styles.subtitle}>
            The principles that guide our community and shape our interactions
          </Text>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.introduction}>
          At Underdust, our values form the foundation of how we build and nurture our community. 
          They guide our decisions, interactions, and the development of our shared spaces.
        </Text>
        
        <View style={styles.valuesContainer}>
          {values.map(value => (
            <ValueCard 
              key={value.id}
              title={value.title} 
              description={value.description} 
            />
          ))}
        </View>
        
        <View style={styles.closingSection}>
          <Text style={styles.closingText}>
            These values are not just words, but active practices that we embody in all our community spaces: 
            the Sanctuary, the Tower of Code, the Temple of Flame, and the Keep.
          </Text>
          <Text style={styles.closingText}>
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
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.background}40`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introduction: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  valuesContainer: {
    marginBottom: 24,
  },
  closingSection: {
    marginBottom: 40,
  },
  closingText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
});