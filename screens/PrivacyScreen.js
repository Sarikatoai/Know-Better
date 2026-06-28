import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PrivacyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <MaterialCommunityIcons name="chevron-left" size={22} color="#0F6E56" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy Policy</Text>

        <Section heading="Your data is private">
          Know Better does not sell, share, or rent your personal information or your dog's data.
        </Section>

        <Section heading="What we collect">
          {'- Your email address and authentication data\n- Check-in notes and dog behavioral data\n- Photos you upload'}
        </Section>

        <Section heading="How we use it">
          {'- To provide the Know Better service\n- To improve pattern detection accuracy\n- To show you insights about your dog\'s health'}
        </Section>

        <Section heading="Data storage">
          All data is stored securely in Supabase with encryption at rest and in transit.
        </Section>

        <Text style={styles.footer}>For the full privacy policy, visit knowbetter.app/privacy</Text>
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
    marginBottom: 28,
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
