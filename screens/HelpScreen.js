import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HelpScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('CheckIn')} activeOpacity={0.7}>
        <MaterialCommunityIcons name="paw" size={18} color="#0F6E56" />
        <Text style={styles.backText}>Know Better</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Help</Text>
        <Text style={styles.intro}>Frequently asked questions about Know Better.</Text>

        <Category heading="Understanding Know Better">
          <QA
            q="What is Know Better?"
            a="Know Better is a behavioral pattern tracking app for dog owners. You log daily observations about your dog, and the app learns what's normal for them so it can flag changes that might be worth a vet visit."
          />
          <QA
            q="Is Know Better a veterinary service?"
            a="No. Know Better is a pattern detection tool, not a veterinary or medical service. Always consult a licensed veterinarian for health concerns — Know Better helps you know when to make that call."
          />
          <QA
            q="Can Know Better diagnose my dog's health problems?"
            a="No. Know Better cannot diagnose, treat, or cure any condition. It identifies behavioral patterns and flags deviations — what you do with that information is always your decision, ideally with your vet."
          />
          <QA
            q="How does Know Better work?"
            a="You log daily check-ins about your dog's behavior, appetite, energy, and anything that seems off. The app builds a baseline over time and sends you an alert if your check-ins start deviating from that baseline."
          />
        </Category>

        <Category heading="Check-ins">
          <QA
            q="How do I log daily check-ins?"
            a="Tap the microphone to record a voice note, or switch to text mode to type. Your check-in is saved automatically when you submit."
          />
          <QA
            q="How often should I check in?"
            a="Once a day is ideal. You can do more if something notable happens, but one thoughtful daily check-in is enough to build a strong pattern."
          />
          <QA
            q="What if I miss a day?"
            a="Missing days won't break the pattern engine — just pick up where you left off. Consistent check-ins over time are more valuable than perfect daily coverage."
          />
          <QA
            q="Can I do voice check-ins and text check-ins?"
            a="Yes. You can speak your check-in or type it — whichever is easier in the moment. Voice notes are transcribed automatically."
          />
          <QA
            q="What should I mention in a check-in?"
            a="Anything notable: energy level, appetite, bathroom habits, mood, sleep, limping, itching, or anything that seemed unusual. The more specific, the better."
          />
          <QA
            q="Can I edit a check-in after I submit it?"
            a="Not currently. If you need to add something, submit a second check-in for the same day — the app handles multiple check-ins per day."
          />
          <QA
            q="What if I forget to do a check-in?"
            a="Just pick up where you left off. Missing a day won't break the pattern engine, though consistent daily check-ins give you the most accurate baseline."
          />
        </Category>

        <Category heading="Baseline & Patterns">
          <QA
            q="What does 'baseline' mean?"
            a="Your dog's baseline is their personal normal — the behavioral patterns they show on typical days. Know Better tracks this over time so it can notice when something changes."
          />
          <QA
            q="How long does it take to build a baseline?"
            a="The baseline activates after at least 3 check-ins. It becomes more accurate with 7 or more days of consistent check-ins."
          />
          <QA
            q="Why do I need to check in daily?"
            a="Daily check-ins give the pattern engine enough data to distinguish a genuine change from a one-off bad day. The more consistent you are, the more reliable the alerts."
          />
        </Category>

        <Category heading="Alerts">
          <QA
            q="What does an alert mean?"
            a="An alert means Know Better has detected a pattern outside your dog's normal baseline — specifically, consecutive days of concerning check-ins. It's a prompt to pay attention, not a diagnosis."
          />
          <QA
            q="Why did I get an alert?"
            a="Your recent check-ins showed a pattern of concern over multiple consecutive days. Review the check-ins listed in the alert to see what triggered it."
          />
          <QA
            q="What are the different alert levels?"
            a={'Level 1: 2 consecutive concerning days — worth monitoring closely.\nLevel 2: 3 consecutive days — consider calling your vet.\nLevel 3: 5 consecutive days — we recommend a vet visit.'}
          />
          <QA
            q="What should I do when I get an alert?"
            a="Read the alert summary, review your recent check-ins, and use your judgment. If you're unsure, contact your vet — they're always the right call for health concerns."
          />
          <QA
            q="How do I acknowledge an alert?"
            a="Tap the alert to open it, then tap Acknowledge. You can also log a vet update directly from the alert screen if you've already spoken to your vet."
          />
          <QA
            q="What is 'Log Vet Update'?"
            a="Log Vet Update lets you record what your vet said after a visit or call. It ties the vet's feedback directly to the alert so you have a complete record in one place."
          />
        </Category>

        <Category heading="Vet Updates">
          <QA
            q="What information should I include in a vet update?"
            a="What the vet observed, any diagnosis or concern they noted, next steps such as medication or a follow-up visit, and any instructions they gave you."
          />
          <QA
            q="Can I edit a vet update after submitting?"
            a="Not currently. If you need to add information, email knowbettersupport@gmail.com and we can assist."
          />
          <QA
            q="Why does Know Better ask for vet updates?"
            a="Vet updates help close the loop on an alert. They give you a record of what was found and what comes next, alongside your full check-in history."
          />
        </Category>

        <Category heading="Multiple Dogs">
          <QA
            q="Can I use Know Better for multiple dogs?"
            a="Yes. You can add multiple dogs to your account. Each dog gets their own check-in history, baseline, and alerts."
          />
          <QA
            q="How do I switch between dogs?"
            a="Tap your dog's name or photo at the top of the home screen to open the dog selector and switch profiles."
          />
          <QA
            q="Can someone else check in on my dog?"
            a="Yes. You can invite family members through your account settings. They can log check-ins on your dog's behalf."
          />
        </Category>

        <Category heading="Data & Privacy">
          <QA
            q="Is my dog's data encrypted?"
            a="Yes. All data is encrypted at rest and in transit. Your data is stored securely with encryption throughout."
          />
          <QA
            q="Who can see my dog's data?"
            a="Only you and family members you've invited can see your dog's data. Know Better staff do not access individual check-in content except as needed to resolve support issues."
          />
          <QA
            q="How long do you keep my data?"
            a="Check-in notes are kept until you delete your account. Audio files are deleted after 30 days. See our Privacy Policy for full details."
          />
          <QA
            q="Can I download my data?"
            a="Yes. Email knowbettersupport@gmail.com and we'll send you a full export of your data within 30 days."
          />
          <QA
            q="How do I delete my account?"
            a={'Email knowbettersupport@gmail.com with the subject "Delete my account." We\'ll remove all your data within 30 days and confirm when it\'s done.'}
          />
        </Category>

        <Category heading="Technical">
          <QA
            q="What should I do if the app crashes?"
            a="Force-close and reopen the app. If it keeps crashing, email knowbettersupport@gmail.com with your device model and what you were doing when it crashed."
          />
          <QA
            q="Why is the app slow?"
            a="A slow connection can affect check-in submission and transcription. Try switching to Wi-Fi. If slowness persists on a good connection, email knowbettersupport@gmail.com."
          />
          <QA
            q="Does Know Better work offline?"
            a="You can open the app offline, but submitting check-ins, loading alerts, and voice transcription all require an internet connection."
          />
          <QA
            q="What phones does Know Better support?"
            a="Know Better works on iOS and Android. For the best experience, keep your OS and app updated to the latest version."
          />
        </Category>

        <Category heading="Troubleshooting">
          <QA
            q="I'm not getting alerts. Why?"
            a="Alerts require at least 3 check-ins to activate your baseline and are only triggered by consecutive concerning days. If your pattern looks normal, that's a good thing — it means your dog is doing well."
          />
          <QA
            q="The app won't let me do a check-in. Help!"
            a="Make sure you're connected to the internet and the correct dog profile is selected. If the issue persists, force-close the app and try again, or email knowbettersupport@gmail.com."
          />
          <QA
            q="My dog switched to the wrong profile. How do I fix it?"
            a="Tap the dog selector at the top of the home screen to switch to the correct profile. If a check-in was submitted under the wrong dog, email knowbettersupport@gmail.com and we can help correct it."
          />
          <QA
            q="I think there's a bug. How do I report it?"
            a="Email knowbettersupport@gmail.com with a description of what happened, your device model, and your app version. Screenshots are helpful if you have them."
          />
        </Category>

        <Text style={styles.contact}>
          Still need help? Email us at knowbettersupport@gmail.com — we aim to respond within 5 business days.
        </Text>
      </ScrollView>
    </View>
  );
}

function Category({ heading, children }) {
  return (
    <View style={styles.category}>
      <Text style={styles.categoryHeading}>{heading}</Text>
      {children}
    </View>
  );
}

function QA({ q, a }) {
  return (
    <View style={styles.qa}>
      <Text style={styles.question}>{q}</Text>
      <Text style={styles.answer}>{a}</Text>
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
    gap: 6,
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  backText: {
    fontSize: 13,
    color: '#0F6E56',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  content: {
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F6E56',
    marginBottom: 6,
  },
  intro: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 32,
  },
  category: {
    marginBottom: 32,
  },
  categoryHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3C34',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EE',
  },
  qa: {
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
  },
  contact: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 22,
    marginTop: 8,
  },
});
