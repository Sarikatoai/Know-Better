import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TermsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <MaterialCommunityIcons name="chevron-left" size={22} color="#0F6E56" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Terms of Service</Text>

        <Text style={styles.intro}>By using Know Better, you agree to these terms.</Text>

        <Section heading="Know Better is not a medical service">
          Know Better is a behavioral pattern detection tool. It is not a medical diagnostic service, not a veterinary service, and not a substitute for professional veterinary care. Always consult your veterinarian for health concerns.
        </Section>

        <Section heading="Accuracy">
          While we work to provide accurate pattern detection, Know Better makes no guarantees about the accuracy or completeness of its analysis.
        </Section>

        <Section heading="Your responsibility">
          You are responsible for all information you provide to Know Better. Do not share false or misleading information about your dog's behavior or health.
        </Section>

        <Text style={styles.footer}>For the full terms, visit knowbetter.app/terms</Text>
      </ScrollView>
    </View>
  );
}

function Section({ heading, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
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
    marginBottom: 16,
  },
  intro: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 28,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3C34',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
  footer: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 8,
    lineHeight: 20,
  },
});
