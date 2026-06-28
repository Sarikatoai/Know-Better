import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HelpScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <MaterialCommunityIcons name="chevron-left" size={22} color="#0F6E56" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Help</Text>

        <Text style={styles.sectionTitle}>Getting help with Know Better</Text>

        <Text style={styles.subheading}>Frequently Asked Questions</Text>

        <Text style={styles.question}>How do I log daily check-ins?</Text>
        <Text style={styles.answer}>Use the microphone button to record a quick voice note about your dog's day.</Text>

        <Text style={styles.question}>How often should I check in?</Text>
        <Text style={styles.answer}>Daily check-ins build the strongest patterns, but you can check in anytime.</Text>

        <Text style={styles.question}>What if I miss a day?</Text>
        <Text style={styles.answer}>Missing days won't break the pattern engine — just pick up where you left off.</Text>

        <Text style={styles.contact}>For more support, contact us at support@knowbetter.app</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    fontSize: 15,
    color: '#0F6E56',
    fontWeight: '600',
  },
  content: {
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F6E56',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A3C34',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  answer: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 16,
  },
  contact: {
    fontSize: 14,
    color: '#888888',
    marginTop: 8,
    lineHeight: 22,
  },
});
