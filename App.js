import { supabase } from './lib/supabase';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const Stack = createNativeStackNavigator();

// ─── Mood data ───────────────────────────────────────────────────────────────

const getMoodOptions = (sex) => {
  const pronoun = sex === 'Male' ? "He's" : "She's";
  return [
    `${pronoun} been great`,
    `${pronoun} been a little off`,
    "I'm not sure",
  ];
};

// ─── Age data ────────────────────────────────────────────────────────────────

const AGE_OPTIONS = [
  'Less than 1 year',
  '1 year',
  '2 years',
  '3 years',
  '4 years',
  '5 years',
  '6 years',
  '7 years',
  '8 years',
  '9 years',
  '10 years',
  '11 years',
  '12 years',
  '13 years',
  '14 years',
  '15+ years',
];

// ─── Breed data ───────────────────────────────────────────────────────────────

const SPECIAL_OPTIONS = [
  'Mixed breed',
  'Mixed breed — (specify primary breed)',
  'Not sure',
];

const DOG_BREEDS = [
  'Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute',
  'American Bulldog', 'American Eskimo Dog', 'Australian Cattle Dog', 'Australian Shepherd',
  'Basenji', 'Basset Hound', 'Beagle', 'Bearded Collie', 'Belgian Malinois',
  'Bernese Mountain Dog', 'Bichon Frise', 'Bloodhound', 'Border Collie', 'Border Terrier',
  'Boston Terrier', 'Boxer', 'Brittany', 'Brussels Griffon', 'Bull Terrier',
  'Bulldog', 'Bullmastiff', 'Cairn Terrier', 'Cane Corso', 'Cavalier King Charles Spaniel',
  'Chesapeake Bay Retriever', 'Chihuahua', 'Chinese Crested', 'Chinese Shar-Pei', 'Chow Chow',
  'Cocker Spaniel', 'Collie', 'Dachshund', 'Dalmatian', 'Doberman Pinscher',
  'English Setter', 'English Springer Spaniel', 'French Bulldog', 'German Shepherd',
  'German Shorthaired Pointer', 'Golden Retriever', 'Great Dane', 'Great Pyrenees',
  'Greyhound', 'Havanese', 'Irish Setter', 'Irish Wolfhound', 'Italian Greyhound',
  'Jack Russell Terrier', 'Japanese Chin', 'Keeshond', 'Labrador Retriever', 'Leonberger',
  'Lhasa Apso', 'Maltese', 'Mastiff', 'Miniature Pinscher', 'Miniature Schnauzer',
  'Newfoundland', 'Norwegian Elkhound', 'Old English Sheepdog', 'Papillon', 'Pekingese',
  'Pembroke Welsh Corgi', 'Pit Bull Terrier', 'Pointer', 'Pomeranian', 'Poodle',
  'Portuguese Water Dog', 'Pug', 'Rat Terrier', 'Rhodesian Ridgeback', 'Rottweiler',
  'Saint Bernard', 'Samoyed', 'Schipperke', 'Scottish Terrier', 'Shetland Sheepdog',
  'Shih Tzu', 'Siberian Husky', 'Silky Terrier', 'Soft Coated Wheaten Terrier',
  'Staffordshire Bull Terrier', 'Standard Schnauzer', 'Tibetan Mastiff', 'Vizsla',
  'Weimaraner', 'West Highland White Terrier', 'Whippet', 'Wire Fox Terrier',
  'Wirehaired Pointing Griffon', 'Yorkshire Terrier',
];

// ─── Screen 1: Welcome ───────────────────────────────────────────────────────

function WelcomeScreen({ navigation }) {
  return (
    <View style={welcome.container}>
      <StatusBar style="light" />

      <View style={welcome.content}>
        <MaterialCommunityIcons name="paw" size={80} color="#FFFFFF" />
        <Text style={welcome.title} numberOfLines={1} adjustsFontSizeToFit>
          Welcome to Know Better
        </Text>
        <Text style={welcome.subtitle}>
          I would love to get to know your dog.
        </Text>
      </View>

      <View style={welcome.footer}>
        <TouchableOpacity
          style={welcome.button}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DogName')}
        >
          <Text style={welcome.buttonText}>Let's Go</Text>
        </TouchableOpacity>

        <Text style={welcome.signIn}>
          Already have an account?{' '}
          <Text style={welcome.signInLink}>Sign in</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Screen 2: Dog's Name ────────────────────────────────────────────────────

function DogNameScreen({ navigation }) {
  const [name, setName] = useState('');

  return (
    <KeyboardAvoidingView
      style={dogName.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={dogName.inner}>
        <View style={dogName.header}>
          <Text style={dogName.title}>Tell me about your dog</Text>
          <Text style={dogName.step}>Step 1 of 5</Text>
        </View>

        <TextInput
          style={dogName.input}
          placeholder="Enter your dog's name"
          placeholderTextColor="#AAAAAA"
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[dogName.button, { backgroundColor: name.trim() ? '#0F6E56' : '#8CB5A8' }]}
          activeOpacity={0.85}
          disabled={!name.trim()}
          onPress={() => navigation.navigate('DogBreed', { dogName: name.trim() })}
        >
          <Text style={dogName.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Screen 3: Dog's Breed ───────────────────────────────────────────────────

function DogBreedScreen({ navigation, route }) {
  const dogName = route.params?.dogName ?? 'your dog';
  const [breed, setBreed] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sex, setSex] = useState(null);

  const filtered = breed.trim()
    ? DOG_BREEDS.filter(b => b.toLowerCase().includes(breed.toLowerCase()))
    : DOG_BREEDS;
  const suggestions = [...SPECIAL_OPTIONS, ...filtered];

  const handleSelect = (item) => {
    setBreed(item);
    setShowSuggestions(false);
  };

  return (
    <KeyboardAvoidingView
      style={dogBreed.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={dogBreed.header}>
        <Text style={dogBreed.title}>Tell me about your dog</Text>
        <Text style={dogBreed.step}>Step 2 of 5</Text>
      </View>

      <View style={dogBreed.inputWrapper}>
        <TextInput
          style={dogBreed.input}
          placeholder={`What breed is ${dogName}?`}
          placeholderTextColor="#AAAAAA"
          value={breed}
          onChangeText={(text) => {
            setBreed(text);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          returnKeyType="done"
          onSubmitEditing={() => setShowSuggestions(false)}
        />

        {showSuggestions && (
          <View style={dogBreed.dropdown}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 220 }}
            >
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    dogBreed.suggestionItem,
                    index < SPECIAL_OPTIONS.length && dogBreed.specialItem,
                    index === suggestions.length - 1 && dogBreed.lastItem,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    dogBreed.suggestionText,
                    index < SPECIAL_OPTIONS.length && dogBreed.specialText,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={dogBreed.sexGroup}>
        <Text style={dogBreed.sexLabel}>Sex</Text>
        <View style={dogBreed.sexToggle}>
          {['Male', 'Female'].map((opt) => {
            const active = sex === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[dogBreed.sexOption, active && dogBreed.sexOptionActive]}
                onPress={() => setSex(opt)}
                activeOpacity={0.8}
              >
                <Text style={[dogBreed.sexText, active && dogBreed.sexTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[dogBreed.button, { backgroundColor: breed.trim() && sex ? '#0F6E56' : '#8CB5A8' }]}
        activeOpacity={0.85}
        disabled={!breed.trim() || !sex}
        onPress={() => navigation.navigate('DogAge', { dogName, breed: breed.trim(), sex })}
      >
        <Text style={dogBreed.buttonText}>Next</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// ─── Screen 4: Dog's Age ─────────────────────────────────────────────────────

function DogAgeScreen({ navigation, route }) {
  const { dogName = 'your dog', breed, sex } = route.params ?? {};
  const [selectedAge, setSelectedAge] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <View style={dogAge.container}>
      <View style={dogAge.header}>
        <Text style={dogAge.title}>Tell me about your dog</Text>
        <Text style={dogAge.step}>Step 3 of 5</Text>
      </View>

      <Text style={dogAge.question}>How old is {dogName}?</Text>

      <View style={dogAge.dropdownWrapper}>
        <TouchableOpacity
          style={dogAge.trigger}
          onPress={() => setShowDropdown(prev => !prev)}
          activeOpacity={0.8}
        >
          <Text style={[dogAge.triggerText, !selectedAge && dogAge.triggerPlaceholder]}>
            {selectedAge ?? 'Select age'}
          </Text>
          <MaterialCommunityIcons
            name={showDropdown ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#AAAAAA"
          />
        </TouchableOpacity>

        {showDropdown && (
          <View style={dogAge.dropdown}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 240 }}>
              {AGE_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    dogAge.option,
                    selectedAge === option && dogAge.optionSelected,
                    index === AGE_OPTIONS.length - 1 && dogAge.lastOption,
                  ]}
                  onPress={() => {
                    setSelectedAge(option);
                    setShowDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[dogAge.optionText, selectedAge === option && dogAge.optionTextSelected]}>
                    {option}
                  </Text>
                  {selectedAge === option && (
                    <MaterialCommunityIcons name="check" size={16} color="#0F6E56" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[dogAge.button, { backgroundColor: selectedAge ? '#0F6E56' : '#8CB5A8' }]}
        activeOpacity={0.85}
        disabled={!selectedAge}
        onPress={() => navigation.navigate('DogHealth', { dogName, breed, sex, age: selectedAge })}
      >
        <Text style={dogAge.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen 5: Health Conditions ─────────────────────────────────────────────

function DogHealthScreen({ navigation, route }) {
  const { dogName = 'your dog', breed, sex, age } = route.params ?? {};
  const [hasCondition, setHasCondition] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <KeyboardAvoidingView
      style={dogHealth.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={dogHealth.inner}>
        <View style={dogHealth.header}>
          <Text style={dogHealth.title}>Tell me about your dog</Text>
          <Text style={dogHealth.step}>Step 4 of 5</Text>
        </View>

        <Text style={dogHealth.question}>
          Does {dogName} have any health conditions I should know about?
        </Text>

        <View style={dogHealth.toggle}>
          {['No', 'Yes'].map((opt) => {
            const active = hasCondition === (opt === 'Yes');
            return (
              <TouchableOpacity
                key={opt}
                style={[dogHealth.toggleOption, active && dogHealth.toggleOptionActive]}
                onPress={() => setHasCondition(opt === 'Yes')}
                activeOpacity={0.8}
              >
                <Text style={[dogHealth.toggleText, active && dogHealth.toggleTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {hasCondition && (
          <View style={dogHealth.inputGroup}>
            <TextInput
              style={dogHealth.input}
              placeholder="Tell me a little about it — I'll keep it in mind."
              placeholderTextColor="#AAAAAA"
              value={notes}
              onChangeText={setNotes}
              multiline
              blurOnSubmit
              textAlignVertical="top"
            />
            <Text style={dogHealth.hint}>Share as much or as little as you like</Text>
          </View>
        )}
      </View>

      <View style={dogHealth.footer}>
        <TouchableOpacity
          style={dogHealth.button}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DogMood', { dogName, breed, sex, age, hasCondition, notes })}
        >
          <Text style={dogHealth.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Screen 6: Current Mood ──────────────────────────────────────────────────

function DogMoodScreen({ navigation, route }) {
  const { dogName = 'your dog', breed, sex, age, hasCondition, notes } = route.params ?? {};
  const [selectedMood, setSelectedMood] = useState(null);
  const moodOptions = getMoodOptions(sex);

  return (
    <View style={dogMood.container}>
      <View style={dogMood.inner}>
        <View style={dogMood.header}>
          <Text style={dogMood.title}>Tell me about your dog</Text>
          <Text style={dogMood.step}>Step 5 of 5</Text>
        </View>

        <Text style={dogMood.question}>
          How has {dogName} been the past few days?
        </Text>

        <View style={dogMood.cards}>
          {moodOptions.map((option) => {
            const selected = selectedMood === option;
            return (
              <TouchableOpacity
                key={option}
                style={[dogMood.card, selected && dogMood.cardSelected]}
                onPress={() => setSelectedMood(option)}
                activeOpacity={0.75}
              >
                <Text style={[dogMood.cardText, selected && dogMood.cardTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={dogMood.footer}>
        <TouchableOpacity
          style={[dogMood.button, { backgroundColor: selectedMood ? '#0F6E56' : '#8CB5A8' }]}
          activeOpacity={0.85}
          disabled={!selectedMood}
          onPress={() => navigation.navigate('Account', { dogName, breed, sex, age, hasCondition, notes, mood: selectedMood })}
        >
          <Text style={dogMood.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen 7: Account Creation ──────────────────────────────────────────────

const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

function AccountScreen({ navigation, route }) {
  const dogData = route.params ?? {};
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = userName.trim().length > 0 && isValidEmail(email);

  const handleSendLink = async () => {
    setIsLoading(true);
    setError('');
    await AsyncStorage.multiSet([
      ['onboarding_userName', userName.trim()],
      ['onboarding_dogName', dogData.dogName ?? 'your dog'],
    ]);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: Linking.createURL('auth/callback'),
      },
    });
    setIsLoading(false);
    if (authError) {
      setError('Something went wrong. Please try again.');
    } else {
      navigation.navigate('MagicLink', { email: email.trim(), userName, dogName: dogData.dogName });
    }
  };

  return (
    <KeyboardAvoidingView
      style={account.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={account.inner}>
        <View style={account.intro}>
          <Text style={account.headline}>Almost done.</Text>
          <Text style={account.subtext}>Let me know where to reach you.</Text>
        </View>

        <View style={account.form}>
          <View style={account.fieldGroup}>
            <Text style={account.label}>Your name</Text>
            <TextInput
              style={account.input}
              placeholder="What should I call you?"
              placeholderTextColor="#AAAAAA"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={account.fieldGroup}>
            <Text style={account.label}>Email address</Text>
            <TextInput
              style={account.input}
              placeholder="I'll send your sign-in link here"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={(val) => { setEmail(val); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
            {error ? <Text style={account.error}>{error}</Text> : null}
          </View>
        </View>
      </View>

      <View style={account.footer}>
        <TouchableOpacity
          style={[account.button, { backgroundColor: canSubmit && !isLoading ? '#0F6E56' : '#8CB5A8' }]}
          activeOpacity={0.85}
          disabled={!canSubmit || isLoading}
          onPress={handleSendLink}
        >
          <Text style={account.buttonText}>{isLoading ? 'Sending…' : 'Send my link'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Screen 9: Congratulations ───────────────────────────────────────────────

function CongratulationsScreen({ navigation, route }) {
  const { userName = 'there', dogName = 'your dog' } = route.params ?? {};

  return (
    <View style={congrats.container}>
      <StatusBar style="light" />

      {/* Hero: flex:1 + space-between mirrors Screen 1's content block exactly,
          with mic/sample anchored to the bottom of that same space */}
      <View style={congrats.hero}>
        <View style={congrats.heroTop}>
          <MaterialCommunityIcons name="paw" size={80} color="#FFFFFF" />
          <Text style={congrats.headline}>You're all set, {userName}.</Text>
          <Text style={congrats.subtext}>
            I can't wait to hear about {dogName}'s day.
          </Text>
        </View>

        <View style={congrats.heroBottom}>
          <Text style={congrats.mic}>🎙️</Text>
          <Text style={congrats.sample}>
            "{dogName} went out, ate breakfast, lots of energy this morning."
          </Text>
        </View>
      </View>

      <View style={congrats.footer}>
        <TouchableOpacity
          style={congrats.button}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CheckIn', { userName, dogName })}
        >
          <Text style={congrats.buttonText}>Let's hear it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen 10: Daily Check-In ───────────────────────────────────────────────

function CheckInScreen({ route }) {
  const { userName = 'there', dogName = 'your dog' } = route.params ?? {};
  const [isRecording, setIsRecording] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringPulse, { toValue: 1.4, duration: 900, useNativeDriver: true }),
          Animated.timing(ringPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      ringPulse.stopAnimation();
      pulse.setValue(1);
      ringPulse.setValue(1);
    }
  }, [isRecording]);

  return (
    <View style={checkIn.container}>
      <StatusBar style="dark" />

      <View style={checkIn.header}>
        <MaterialCommunityIcons name="paw" size={18} color="#0F6E56" />
        <Text style={checkIn.brand}>Know Better</Text>
      </View>

      <View style={checkIn.content}>
        <Text style={checkIn.greeting}>Good morning, {userName}.</Text>
        <Text style={checkIn.question}>How did {dogName}'s morning go?</Text>

        <TouchableOpacity
          style={checkIn.micOuter}
          activeOpacity={0.9}
          onPress={() => setIsRecording(prev => !prev)}
        >
          {isRecording && (
            <Animated.View style={[checkIn.ring, { transform: [{ scale: ringPulse }] }]} />
          )}
          <Animated.View style={[
            checkIn.micButton,
            isRecording && checkIn.micButtonRecording,
            { transform: [{ scale: pulse }] },
          ]}>
            <Text style={checkIn.micEmoji}>🎙️</Text>
          </Animated.View>
        </TouchableOpacity>

        <Text style={checkIn.listening}>
          {isRecording ? 'Recording…' : "I'm listening."}
        </Text>

        <Text style={checkIn.hint}>
          Tap the mic and tell me about {dogName}'s morning
        </Text>
      </View>
    </View>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;
      const fragment = url.split('#')[1];
      if (!fragment) return;
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    };

    // App opened from a cold start via deep link
    Linking.getInitialURL().then(handleDeepLink);

    // App brought to foreground via deep link
    const linkSubscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // Navigate to Congratulations when Supabase confirms sign-in
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const [storedUserName, storedDogName] = await Promise.all([
            AsyncStorage.getItem('onboarding_userName'),
            AsyncStorage.getItem('onboarding_dogName'),
          ]);
          if (navigationRef.isReady()) {
            navigationRef.reset({
              index: 0,
              routes: [{
                name: 'Congratulations',
                params: {
                  userName: storedUserName ?? 'there',
                  dogName: storedDogName ?? 'your dog',
                },
              }],
            });
          }
        }
      }
    );

    return () => {
      linkSubscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: '#0F6E56',
          headerBackTitle: '',
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DogName" component={DogNameScreen} />
        <Stack.Screen name="DogBreed" component={DogBreedScreen} />
        <Stack.Screen name="DogAge" component={DogAgeScreen} />
        <Stack.Screen name="DogHealth" component={DogHealthScreen} />
        <Stack.Screen name="DogMood" component={DogMoodScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="MagicLink" component={MagicLinkScreen} />
        <Stack.Screen name="Congratulations" component={CongratulationsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Screen 8: Magic Link Sent ────────────────────────────────────────────────

function MagicLinkScreen({ navigation, route }) {
  const { email = '', userName = '', dogName = 'your dog' } = route.params ?? {};
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanResend(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={magicLink.container}>
      <View style={magicLink.content}>
        <Text style={magicLink.emoji}>✉️</Text>

        <Text style={magicLink.headline}>Check your email.</Text>

        <Text style={magicLink.subtext}>
          {'I sent a sign-in link to '}
          <Text style={magicLink.emailHighlight}>{email}</Text>
          {'. Tap it to finish setting up.'}
        </Text>

        <View style={magicLink.links}>
          {canResend && (
            <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
              <Text style={magicLink.resendLink}>Resend link</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={magicLink.backLink}>Wrong email? Go back</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={magicLink.continueButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Congratulations', { userName, dogName })}
        >
          <Text style={magicLink.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles: Welcome ─────────────────────────────────────────────────────────

const welcome = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F6E56',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#085041',
    letterSpacing: 0.3,
  },
  signIn: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  signInLink: {
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});

// ─── Styles: Dog Name ─────────────────────────────────────────────────────────

const dogName = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  inner: {
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F6E56',
  },
  step: {
    fontSize: 13,
    color: '#999999',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#F7F7F7',
  },
  button: {
    backgroundColor: '#0F6E56',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Styles: Dog Age ─────────────────────────────────────────────────────────

const dogAge = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 60,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F6E56',
  },
  step: {
    fontSize: 13,
    color: '#999999',
  },
  question: {
    fontSize: 17,
    color: '#666666',
    fontWeight: '400',
    marginTop: -8,
  },
  dropdownWrapper: {
    zIndex: 10,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F7F7F7',
  },
  triggerText: {
    fontSize: 16,
    color: '#111111',
  },
  triggerPlaceholder: {
    color: '#AAAAAA',
  },
  dropdown: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionSelected: {
    backgroundColor: '#F0F9F6',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 15,
    color: '#222222',
  },
  optionTextSelected: {
    color: '#0F6E56',
    fontWeight: '600',
  },
  button: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Styles: Magic Link ───────────────────────────────────────────────────────

const magicLink = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    gap: 20,
  },
  emoji: {
    fontSize: 72,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F6E56',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 26,
  },
  emailHighlight: {
    color: '#333333',
    fontWeight: '600',
  },
  links: {
    alignItems: 'center',
    gap: 18,
    marginTop: 8,
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F6E56',
  },
  backLink: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  continueButton: {
    marginTop: 16,
    backgroundColor: '#0F6E56',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Styles: Account ─────────────────────────────────────────────────────────

const account = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  inner: {
    gap: 36,
  },
  intro: {
    gap: 10,
  },
  footer: {
    paddingBottom: 48,
    paddingTop: 16,
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F6E56',
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 17,
    color: '#888888',
  },
  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#F7F7F7',
  },
  button: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Styles: Dog Mood ────────────────────────────────────────────────────────

const dogMood = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  inner: {
    gap: 28,
  },
  footer: {
    paddingBottom: 48,
    paddingTop: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F6E56',
  },
  step: {
    fontSize: 13,
    color: '#999999',
  },
  question: {
    fontSize: 17,
    color: '#444444',
    lineHeight: 26,
  },
  cards: {
    gap: 14,
  },
  card: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cardSelected: {
    backgroundColor: '#E1F5EE',
    borderColor: '#0F6E56',
  },
  cardText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333333',
  },
  cardTextSelected: {
    color: '#0F6E56',
    fontWeight: '600',
  },
  button: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Styles: Dog Health ──────────────────────────────────────────────────────

const dogHealth = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  inner: {
    gap: 24,
  },
  footer: {
    paddingBottom: 48,
    paddingTop: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F6E56',
  },
  step: {
    fontSize: 13,
    color: '#999999',
  },
  question: {
    fontSize: 17,
    color: '#444444',
    lineHeight: 26,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 50,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 50,
  },
  toggleOptionActive: {
    backgroundColor: '#0F6E56',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888888',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#111111',
    backgroundColor: '#F7F7F7',
    minHeight: 110,
  },
  hint: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  button: {
    backgroundColor: '#0F6E56',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Styles: Dog Breed ────────────────────────────────────────────────────────

const dogBreed = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 60,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F6E56',
  },
  step: {
    fontSize: 13,
    color: '#999999',
  },
  inputWrapper: {
    zIndex: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#F7F7F7',
  },
  dropdown: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  suggestionItem: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specialItem: {
    backgroundColor: '#F0F9F6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 15,
    color: '#222222',
  },
  specialText: {
    color: '#0F6E56',
    fontWeight: '500',
  },
  sexGroup: {
    gap: 8,
  },
  sexLabel: {
    fontSize: 13,
    color: '#999999',
  },
  sexToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 50,
    padding: 4,
  },
  sexOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 50,
  },
  sexOptionActive: {
    backgroundColor: '#0F6E56',
  },
  sexText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888888',
  },
  sexTextActive: {
    color: '#FFFFFF',
  },
  button: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Styles: Congratulations ──────────────────────────────────────────────────

const congrats = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F6E56',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  // flex:1 + space-between means heroTop is centered in the upper portion,
  // heroBottom sits at the bottom of the same flex block — mirroring Screen 1's layout
  hero: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  heroTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  // Exact match to welcome.title
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  // Exact match to welcome.subtitle
  subtext: {
    fontSize: 18,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 26,
  },
  mic: {
    fontSize: 36,
  },
  sample: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#085041',
    letterSpacing: 0.3,
  },
});

// ─── Styles: Check-In ────────────────────────────────────────────────────────

const checkIn = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 64,
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  brand: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F6E56',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#085041',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  question: {
    fontSize: 17,
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  micOuter: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0F6E56',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F6E56',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  micEmoji: {
    fontSize: 38,
  },
  listening: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#AAAAAA',
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
