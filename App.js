import { supabase } from './lib/supabase';
import { Audio } from 'expo-av';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import {
  Alert,
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

const AUTH_REDIRECT_URL = Platform.OS === 'web'
  ? 'http://localhost:8081'
  : 'exp://w-kgbem-anonymous-8081.exp.direct';

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

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.7}>
          <Text style={welcome.signIn}>
            Already have an account?{' '}
            <Text style={welcome.signInLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
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
      ['onboarding_dogName', dogData.dogName ?? ''],
      ['onboarding_breed', dogData.breed ?? ''],
      ['onboarding_sex', dogData.sex ?? ''],
      ['onboarding_age', dogData.age ?? ''],
      ['onboarding_hasCondition', dogData.hasCondition ? 'true' : 'false'],
      ['onboarding_notes', dogData.notes ?? ''],
      ['onboarding_mood', dogData.mood ?? ''],
    ]);
    console.log('[OTP] emailRedirectTo:', AUTH_REDIRECT_URL);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: AUTH_REDIRECT_URL,
      },
    });
    if (authError) console.log('[OTP] signInWithOtp error:', authError.message);
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

// ─── Screen: Sign In (returning users) ──────────────────────────────────────

function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = isValidEmail(email);

  const handleSendLink = async () => {
    setIsLoading(true);
    setError('');
    console.log('[OTP] emailRedirectTo:', AUTH_REDIRECT_URL);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: AUTH_REDIRECT_URL,
      },
    });
    if (authError) console.log('[OTP] signInWithOtp error:', authError.message);
    setIsLoading(false);
    if (authError) {
      setError('Something went wrong. Please try again.');
    } else {
      navigation.navigate('MagicLink', { email: email.trim() });
    }
  };

  return (
    <KeyboardAvoidingView
      style={signIn.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={signIn.inner}>
        <View style={signIn.intro}>
          <Text style={signIn.headline}>Welcome back.</Text>
          <Text style={signIn.subtext}>I'll send you a sign-in link.</Text>
        </View>

        <View style={signIn.form}>
          <TextInput
            style={signIn.input}
            placeholder="Your email address"
            placeholderTextColor="#AAAAAA"
            value={email}
            onChangeText={(val) => { setEmail(val); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={canSubmit && !isLoading ? handleSendLink : undefined}
          />
          {error ? <Text style={signIn.error}>{error}</Text> : null}
        </View>
      </View>

      <View style={signIn.footer}>
        <TouchableOpacity
          style={[signIn.button, { backgroundColor: canSubmit && !isLoading ? '#0F6E56' : '#8CB5A8' }]}
          activeOpacity={0.85}
          disabled={!canSubmit || isLoading}
          onPress={handleSendLink}
        >
          <Text style={signIn.buttonText}>{isLoading ? 'Sending…' : 'Send my link'}</Text>
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

// ─── Pattern engine: daily summaries ────────────────────────────────────────

// Worst-state ranking per signal — higher rank wins when merging a day's check-ins.
const SIGNAL_SEVERITY = {
  appetite: { normal: 0, low: 1, skipped: 2 },
  energy: { normal: 0, high: 1, low: 2 },
  elimination: { normal: 0, irregular: 1, absent: 2 },
  water_intake: { normal: 0, low: 1, absent: 2 },
  demeanor: { normal: 0, low: 1 },
  vomiting: { none: 0, once: 1, multiple: 2 },
};

const EMPTY_SIGNALS = { appetite: null, energy: null, elimination: null, water_intake: null, demeanor: null, vomiting: null };

const formatDateUTC = (d) => d.toISOString().slice(0, 10);

const getLastNDates = (n) => {
  const dates = [];
  for (let i = 0; i < n; i++) {
    dates.push(formatDateUTC(new Date(Date.now() - i * 24 * 60 * 60 * 1000)));
  }
  return dates; // most recent first — index 0 is today
};

const getDailySummary = async (dogId, date) => {
  try {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data: checkIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('check_in_id, input_classification')
      .eq('dog_id', dogId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);
    if (checkInsError) {
      console.log('[DailySummary] check_ins query error:', checkInsError);
      return { date, hasAnyCheckin: false, classification: 'normal', signals: { ...EMPTY_SIGNALS }, checkinCount: 0 };
    }
    if (checkIns.length === 0) {
      return { date, hasAnyCheckin: false, classification: 'normal', signals: { ...EMPTY_SIGNALS }, checkinCount: 0 };
    }

    let classification = 'normal';
    if (checkIns.some(c => c.input_classification === 'health_event')) classification = 'health_event';
    else if (checkIns.some(c => c.input_classification === 'concerning')) classification = 'concerning';

    const checkInIds = checkIns.map(c => c.check_in_id);
    const { data: signalRows, error: signalsError } = await supabase
      .from('signals')
      .select('appetite, energy, elimination, water_intake, demeanor, vomiting')
      .in('check_in_id', checkInIds);
    if (signalsError) console.log('[DailySummary] signals query error:', signalsError);

    const signals = { ...EMPTY_SIGNALS };
    for (const key of Object.keys(SIGNAL_SEVERITY)) {
      let worst = null;
      let worstRank = -1;
      for (const row of signalRows ?? []) {
        const val = row[key];
        if (val === null || val === undefined || val === 'null') continue;
        const rank = SIGNAL_SEVERITY[key][val] ?? 0;
        if (rank > worstRank) {
          worstRank = rank;
          worst = val;
        }
      }
      signals[key] = worst;
    }

    return { date, hasAnyCheckin: true, classification, signals, checkinCount: checkIns.length };
  } catch (err) {
    console.log('[DailySummary] error:', err);
    return { date, hasAnyCheckin: false, classification: 'normal', signals: { ...EMPTY_SIGNALS }, checkinCount: 0 };
  }
};

// ─── Screen 10: Daily Check-In ───────────────────────────────────────────────

function CheckInScreen({ navigation, route }) {
  const { userName: paramUserName, dogName: paramDogName } = route.params ?? {};
  const [userName, setUserName] = useState(paramUserName ?? '');
  const [dogName, setDogName] = useState(paramDogName ?? '');
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [transcription, setTranscription] = useState('');
  const [claudeResponse, setClaudeResponse] = useState('');
  const [isClaudeLoading, setIsClaudeLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const autoStopRef = useRef(null);
  const recordingStartRef = useRef(null);
  const userIdRef = useRef(null);
  const dogIdRef = useRef(null);
  const familyMemberIdRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      console.log('[ENV] EXPO_PUBLIC_OPENAI_API_KEY first 10 chars:', key ? key.slice(0, 10) : 'UNDEFINED — restart Metro after .env changes');
      const anthropicKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
      console.log('[ENV] EXPO_PUBLIC_ANTHROPIC_API_KEY first 10 chars:', anthropicKey ? anthropicKey.slice(0, 10) : 'UNDEFINED — restart Metro after .env changes');

      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') setPermissionDenied(true);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      userIdRef.current = userId;
      const [userResult, dogResult] = await Promise.all([
        supabase.from('users').select('first_name').eq('user_id', userId).single(),
        supabase.from('dogs').select('dog_name, dog_id').eq('owner_id', userId).limit(1).single(),
      ]);
      if (userResult.data?.first_name) setUserName(userResult.data.first_name);
      if (dogResult.data?.dog_name) setDogName(dogResult.data.dog_name);
      const dogId = dogResult.data?.dog_id ?? null;
      dogIdRef.current = dogId;

      const { data: familyData } = await supabase
        .from('family_members')
        .select('family_member_id')
        .eq('owner_id', userId)
        .eq('dog_id', dogId)
        .single();
      const familyMemberId = familyData?.family_member_id;
      console.log('[Init] family_members result:', JSON.stringify(familyData));
      if (familyMemberId) familyMemberIdRef.current = familyMemberId;
      console.log('[Init] IDs loaded — userId:', userId, 'dogId:', dogId, 'familyMemberId:', familyMemberId);
    };
    init();

    return () => {
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop()); } catch {}
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (recordingState === 'recording') {
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
  }, [recordingState]);

  const saveCheckIn = async (blob, mimeType, transcriptionText, inputClassification = 'irrelevant') => {
    const userId = userIdRef.current;
    const dogId = dogIdRef.current;
    const familyMemberId = familyMemberIdRef.current;
    if (!userId || !dogId || !familyMemberId) {
      console.log('[CheckIn] missing IDs, skipping save:', { userId, dogId, familyMemberId });
      return null;
    }
    try {
      const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm';
      const path = `${userId}/${dogId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('checkins')
        .upload(path, blob, { contentType: mimeType });
      if (uploadError) {
        console.log('[CheckIn] storage upload error:', uploadError);
        return null;
      }
      const { data: urlData } = supabase.storage.from('checkins').getPublicUrl(path);
      const audioUrl = urlData?.publicUrl;
      console.log('[CheckIn] audio uploaded:', audioUrl);

      const { data: checkInData, error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          dog_id: dogId,
          family_member_id: familyMemberId,
          check_in_type: 'morning',
          audio_file_url: audioUrl,
          whisper_raw_text: transcriptionText,
          check_in_text: transcriptionText,
          transcription_status: 'completed',
          input_classification: inputClassification,
          contributed_to_baseline: inputClassification === 'normal' || inputClassification === 'concerning' ? 'yes' : inputClassification === 'health_event' ? 'partial' : 'no',
        })
        .select('check_in_id')
        .single();
      if (checkInError) {
        console.log('[CheckIn] insert error:', checkInError);
        return null;
      }
      console.log('[CheckIn] saved, check_in_id:', checkInData.check_in_id);
      return checkInData.check_in_id;
    } catch (err) {
      console.log('[CheckIn] error:', err);
      return null;
    }
  };

  const saveResponse = async (checkInId, responseText) => {
    const dogId = dogIdRef.current;
    if (!checkInId || !dogId) return;
    try {
      const { error } = await supabase.from('responses').insert({
        check_in_id: checkInId,
        dog_id: dogId,
        response_text: responseText,
        response_type: 'reassurance',
        response_status: 'delivered',
        was_alert: false,
      });
      if (error) console.log('[Response] insert error:', error);
      else console.log('[Response] saved');
    } catch (err) {
      console.log('[Response] error:', err);
    }
  };

  const calculateBaseline = async (dogId) => {
    try {
      const dailySummaries = [];
      for (const date of getLastNDates(7)) {
        dailySummaries.push(await getDailySummary(dogId, date));
      }

      const activeDays = dailySummaries.filter(d => d.hasAnyCheckin);
      const total_days = activeDays.length;
      const normal_days = activeDays.filter(d => d.classification === 'normal').length;
      const concerning_days = activeDays.filter(d => d.classification === 'concerning').length;
      const normal_rate = total_days > 0 ? normal_days / total_days : 0;
      const concerning_rate = total_days > 0 ? concerning_days / total_days : 0;
      const last_day_classification = dailySummaries.find(d => d.hasAnyCheckin)?.classification ?? null;
      const baseline_active = total_days >= 3;

      let consecutive_concerning_days = 0;
      for (const day of dailySummaries) {
        if (day.classification === 'concerning') consecutive_concerning_days++;
        else break;
      }

      const baseline_data = {
        total_days,
        normal_days,
        concerning_days,
        normal_rate,
        concerning_rate,
        consecutive_concerning_days,
        last_day_classification,
        baseline_active,
      };

      const { error: upsertError } = await supabase
        .from('baselines')
        .upsert({ dog_id: dogId, baseline_data }, { onConflict: 'dog_id' });
      if (upsertError) console.log('[Baseline] upsert error:', upsertError);
      else console.log('[Baseline] calculated and saved:', JSON.stringify(baseline_data));

      return dailySummaries;
    } catch (err) {
      console.log('[Baseline] error:', err);
      return [];
    }
  };

  const detectDeviation = async (dogId, checkInId, todaySummary) => {
    try {
      const { data, error } = await supabase
        .from('baselines')
        .select('baseline_data')
        .eq('dog_id', dogId)
        .single();
      if (error) { console.log('[Deviation] baseline read error:', error); return null; }

      const b = data?.baseline_data;
      if (!b?.baseline_active) {
        console.log('[Deviation] skipped — baseline not active yet (total_days:', b?.total_days, ')');
        return { alertLevel: null, consecutiveDays: 0 };
      }

      const ccd = b.consecutive_concerning_days ?? 0;
      const today = formatDateUTC(new Date());
      const summary = todaySummary ?? await getDailySummary(dogId, today);
      const lowSignals = Object.entries(summary.signals).filter(([, v]) => v === 'low').map(([k]) => k);
      const combinationFlag = lowSignals.length >= 2;

      let alertLevel = null;
      let alert_trigger_reason = null;
      let consecutiveDays = ccd;

      if (ccd >= 5) {
        alertLevel = 3;
        alert_trigger_reason = `${ccd} consecutive concerning days detected in the last 7 days.`;
      } else if (ccd >= 3) {
        alertLevel = 2;
        alert_trigger_reason = `${ccd} consecutive concerning days detected in the last 7 days.`;
      } else if (ccd >= 2) {
        alertLevel = 1;
        alert_trigger_reason = `${ccd} consecutive concerning days detected in the last 7 days.`;
      } else if (combinationFlag) {
        alertLevel = 1;
        consecutiveDays = Math.max(ccd, 1);
        alert_trigger_reason = `Multiple signals (${lowSignals.join(', ')}) showing low today.`;
      }

      console.log('[Deviation] consecutive_concerning_days:', ccd, 'combinationFlag:', combinationFlag, '→ alertLevel:', alertLevel);

      if (alertLevel !== null) {
        const startOfDay = `${today}T00:00:00.000Z`;
        const endOfDay = `${today}T23:59:59.999Z`;
        const { data: existingAlerts, error: existingError } = await supabase
          .from('alerts')
          .select('dog_id')
          .eq('dog_id', dogId)
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
          .limit(1);
        if (existingError) console.log('[Alert] existing alert check error:', existingError);

        if (existingAlerts && existingAlerts.length > 0) {
          console.log('[Alert] suppressed — alert already fired today');
          return { alertLevel: null, consecutiveDays: ccd };
        }
        console.log('[Alert] proceeding — no alert fired today');

        const { error: alertError } = await supabase.from('alerts').insert({
          dog_id: dogId,
          check_in_id: checkInId,
          alert_level: `level_${alertLevel}`,
          alert_trigger_reason,
          baseline_snapshot: b,
        });
        if (alertError) console.log('[Deviation] alert insert error:', alertError);
        else console.log('[Deviation] alert saved — level:', alertLevel, '|', alert_trigger_reason);
      }

      return { alertLevel, consecutiveDays };
    } catch (err) {
      console.log('[Deviation] error:', err);
      return { alertLevel: null, consecutiveDays: 0 };
    }
  };

  const callClaude = async (transcriptionText, checkInId, classification, alertLevel = null, consecutiveDays = 0) => {
    setIsClaudeLoading(true);
    setClaudeResponse('');
    const name = dogName || 'your dog';
    let systemPrompt;
    if (alertLevel === 3) {
      systemPrompt = `You are Know Better, a caring AI companion for dog owners. You speak in first person singular. The owner just shared this about their dog ${name}: ${transcriptionText}. This is the ${consecutiveDays} consecutive day with concerning observations. Respond directly and calmly. Acknowledge what the owner shared. Clearly recommend they contact their vet today. Do not diagnose. Do not alarm. 2 sentences maximum.`;
    } else if (alertLevel === 2) {
      systemPrompt = `You are Know Better, a caring AI companion for dog owners. You speak in first person singular. The owner just shared this about their dog ${name}: ${transcriptionText}. This is the ${consecutiveDays} consecutive day with concerning observations. Respond gently but clearly. Acknowledge what the owner shared. Recommend they mention this pattern to their vet soon — not urgently but within the next day or two. Do not diagnose. Do not alarm. 2 sentences maximum.`;
    } else if (alertLevel === 1) {
      systemPrompt = `You are Know Better, a caring AI companion for dog owners. You speak in first person singular. The owner just shared this about their dog ${name}: ${transcriptionText}. This is the ${consecutiveDays} consecutive day with concerning observations. Respond calmly and warmly. Acknowledge specifically what the owner shared today. Note that you have noticed this pattern over the past few days and will keep watching. Do not diagnose. Do not alarm. 2 sentences maximum.`;
    } else if (classification === 'irrelevant') {
      systemPrompt = `You are Know Better, a caring companion for dog owners. The owner's message does not contain any information about their dog's health or routine. Respond warmly and briefly — acknowledge what they said, then gently invite them to share how ${name} is doing today. Keep it to 1-2 sentences maximum. Do not ask about their personal life.`;
    } else if (classification === 'concerning') {
      systemPrompt = `You are Know Better, a caring AI companion for dog owners. You speak in first person singular. The owner just shared this about their dog ${name}: ${transcriptionText}. Respond calmly and warmly. Acknowledge the concern specifically, express genuine care, and let them know you're keeping an eye on things. Do not diagnose. Do not recommend contacting a vet. Do not alarm. 2 sentences maximum.`;
    } else {
      systemPrompt = 'You are Know Better, a warm and caring AI companion for dog owners. You speak in first person singular. You are caring, calm, and never clinical. Your job is to acknowledge what the owner shared about their dog, reflect back what you heard specifically, and respond with warmth and reassurance. Keep responses to 2-3 sentences maximum. Never use medical language. Never diagnose. Always end with something warm.';
    }
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 256,
          system: systemPrompt,
          messages: [{ role: 'user', content: transcriptionText }],
        }),
      });
      const data = await response.json();
      console.log('[Claude] result:', JSON.stringify(data));
      if (data.content?.[0]?.text) {
        const responseText = data.content[0].text;
        setClaudeResponse(responseText);
        saveResponse(checkInId, responseText);
      }
    } catch (err) {
      console.log('[Claude] error:', err);
    } finally {
      setIsClaudeLoading(false);
    }
  };

  const extractSignals = async (transcriptionText, checkInId, dogId) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 256,
          system: `You are analyzing a dog owner's check-in about their dog. Extract the state of each behavioral dimension mentioned. Return a JSON object only — no other text. Use these exact keys and values:
appetite: normal, low, skipped, or null (if not mentioned)
energy: normal, low, high, or null
elimination: normal, irregular, absent, or null
water_intake: normal, low, absent, or null
demeanor: normal, low, or null
vomiting: none, once, multiple, or null
Example output: {"appetite": "skipped", "energy": "low", "elimination": "null", "water_intake": "null", "demeanor": "low", "vomiting": "none"}`,
          messages: [{ role: 'user', content: transcriptionText }],
        }),
      });
      const data = await response.json();
      const rawText = data.content?.[0]?.text ?? '';
      const cleaned = rawText.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
      const signals = JSON.parse(cleaned);
      console.log('[Signals] extracted:', JSON.stringify(signals));

      const { error } = await supabase.from('signals').insert({
        check_in_id: checkInId,
        dog_id: dogId,
        ...signals,
        raw_signals_response: rawText,
      });
      if (error) console.log('[Signals] insert error:', error);
      else console.log('[Signals] saved');
    } catch (err) {
      console.log('[Signals] error:', err);
    }
  };

  const classifyCheckIn = async (transcriptionText) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 16,
          system: `You are analyzing a dog owner's daily voice check-in about their dog. Classify the text into exactly one of these four categories:
NORMAL — the owner describes routine healthy dog behavior. Examples: dog ate their meal, played outside, did their business, drank water, had good energy, seemed happy.
CONCERNING — the owner mentions something unusual, different from normal, or potentially worrying. Examples: dog skipped a meal, did not drink water, had low energy, did not poop or pee all day, was limping, seemed off.
HEALTH_EVENT — the owner mentions a significant medical event. Examples: vet visit, surgery, new medication, hospitalization, diagnosis.
IRRELEVANT — the text contains no useful information about the dog's health or daily routine. Examples: accidental recording, conversation not about the dog, nonsensical content.
Return only one word: NORMAL, CONCERNING, HEALTH_EVENT, or IRRELEVANT.`,
          messages: [{ role: 'user', content: transcriptionText }],
        }),
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text?.trim().toUpperCase();
      const valid = ['NORMAL', 'CONCERNING', 'HEALTH_EVENT', 'IRRELEVANT'];
      const classification = valid.includes(raw) ? raw.toLowerCase() : 'irrelevant';
      console.log('[Classify] result:', classification);
      return classification;
    } catch (err) {
      console.log('[Classify] error:', err);
      return 'irrelevant';
    }
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[Audio] mic stream obtained, tracks:', stream.getAudioTracks().map(t => t.label));
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          console.log('[Audio] ondataavailable fired, chunk size:', e.data.size, 'bytes');
          if (e.data.size > 0) mediaChunksRef.current.push(e.data);
        };
        mediaRecorderRef.current = mediaRecorder;
        console.log('[Audio] MediaRecorder state before start:', mediaRecorder.state);
        mediaRecorder.start(100);
        console.log('[Audio] MediaRecorder state after start:', mediaRecorder.state);
        recordingStartRef.current = Date.now();
        setRecordingState('recording');
        autoStopRef.current = setTimeout(() => stopAndTranscribe(), 60000);
      } catch (err) {
        console.log('[Audio] startRecording error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
        }
      }
    } else {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        recordingStartRef.current = Date.now();
        setRecordingState('recording');
        autoStopRef.current = setTimeout(() => stopAndTranscribe(), 60000);
      } catch (err) {
        console.log('[Audio] startRecording error:', err);
      }
    }
  };

  const stopAndTranscribe = async () => {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }

    const durationSecs = ((Date.now() - (recordingStartRef.current ?? Date.now())) / 1000).toFixed(1);
    console.log('[Audio] recording duration:', durationSecs, 'seconds');

    if (parseFloat(durationSecs) < 2) {
      setTranscription('Hold the mic button while speaking');
      setRecordingState('idle');
      return;
    }

    setRecordingState('processing');

    if (Platform.OS === 'web') {
      try {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder) return;

        await new Promise((resolve) => {
          mediaRecorder.onstop = resolve;
          mediaRecorder.stop();
          mediaRecorder.stream.getTracks().forEach(t => t.stop());
        });

        const chunks = mediaChunksRef.current;
        console.log('[Audio] total chunks collected:', chunks.length);
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        console.log('[Audio] blob size (bytes):', blob.size, '— expected 50000+ for real voice, <1000 for silent/empty');
        console.log('[Audio] blob MIME type:', blob.type);
        console.log('[Audio] recording duration (seconds):', durationSecs);

        mediaRecorderRef.current = null;
        mediaChunksRef.current = [];

        const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `recording.${ext}`, { type: blob.type });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}` },
          body: formData,
        });
        const result = await response.json();
        console.log('[Whisper] result:', JSON.stringify(result));
        if (result.text) {
          setTranscription(result.text);
          const classification = await classifyCheckIn(result.text);
          const checkInId = await saveCheckIn(blob, blob.type, result.text, classification);
          if (classification === 'concerning' || classification === 'health_event') {
            await extractSignals(result.text, checkInId, dogIdRef.current);
          }
          const dailySummaries = await calculateBaseline(dogIdRef.current);
          const { alertLevel, consecutiveDays } = await detectDeviation(dogIdRef.current, checkInId, dailySummaries?.[0]);
          callClaude(result.text, checkInId, classification, alertLevel, consecutiveDays);
        }
      } catch (err) {
        console.log('[Whisper] error:', err);
      } finally {
        setRecordingState('idle');
      }
    } else {
      try {
        const recording = recordingRef.current;
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const uri = recording.getURI();
        recordingRef.current = null;
        console.log('[Audio] recording URI:', uri);

        if (!uri) { setRecordingState('idle'); return; }

        console.log('[Audio] blob MIME type: audio/m4a (native)');
        console.log('[Audio] recording duration (seconds):', durationSecs);

        // Fetch blob for Supabase storage upload (runs in parallel with Whisper)
        const blobPromise = fetch(uri).then(r => r.blob());

        const formData = new FormData();
        formData.append('file', { uri, name: 'recording.m4a', type: 'audio/m4a' });
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        const [whisperResponse, nativeBlob] = await Promise.all([
          fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}` },
            body: formData,
          }),
          blobPromise,
        ]);
        const result = await whisperResponse.json();
        console.log('[Whisper] result:', JSON.stringify(result));
        if (result.text) {
          setTranscription(result.text);
          const classification = await classifyCheckIn(result.text);
          const checkInId = await saveCheckIn(nativeBlob, 'audio/m4a', result.text, classification);
          if (classification === 'concerning' || classification === 'health_event') {
            await extractSignals(result.text, checkInId, dogIdRef.current);
          }
          const dailySummaries = await calculateBaseline(dogIdRef.current);
          const { alertLevel, consecutiveDays } = await detectDeviation(dogIdRef.current, checkInId, dailySummaries?.[0]);
          callClaude(result.text, checkInId, classification, alertLevel, consecutiveDays);
        }
      } catch (err) {
        console.log('[Whisper] error:', err);
      } finally {
        setRecordingState('idle');
      }
    }
  };

  const handleMicPress = () => {
    if (recordingState === 'idle') startRecording();
    else if (recordingState === 'recording') stopAndTranscribe();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  return (
    <View style={checkIn.container}>
      <StatusBar style="dark" />

      <View style={checkIn.header}>
        <MaterialCommunityIcons name="paw" size={18} color="#0F6E56" />
        <Text style={checkIn.brand}>Know Better</Text>
      </View>

      <View style={checkIn.content}>
        <Text style={checkIn.greeting}>Good morning, {userName || 'there'}.</Text>
        <Text style={checkIn.question}>How did {dogName || 'your dog'}'s morning go?</Text>

        {permissionDenied ? (
          <Text style={checkIn.permissionError}>
            Microphone access is required. Please enable it in your device settings.
          </Text>
        ) : (
          <>
            <TouchableOpacity
              style={checkIn.micOuter}
              activeOpacity={isProcessing ? 1 : 0.9}
              onPress={isProcessing ? undefined : handleMicPress}
              disabled={isProcessing}
            >
              {isRecording && (
                <Animated.View style={[checkIn.ring, { transform: [{ scale: ringPulse }] }]} />
              )}
              <Animated.View style={[
                checkIn.micButton,
                isRecording && checkIn.micButtonRecording,
                isProcessing && checkIn.micButtonProcessing,
                { transform: [{ scale: pulse }] },
              ]}>
                <Text style={checkIn.micEmoji}>🎙️</Text>
              </Animated.View>
            </TouchableOpacity>

            <Text style={checkIn.listening}>
              {isProcessing ? 'Processing…' : isRecording ? 'Recording…' : "I'm listening."}
            </Text>

            {recordingState === 'idle' && !transcription && (
              <Text style={checkIn.hint}>
                Tap the mic and tell me about {dogName || 'your dog'}'s morning
              </Text>
            )}

            {!!transcription && (
              <View style={checkIn.transcriptionCard}>
                <Text style={checkIn.transcriptionText}>{transcription}</Text>
              </View>
            )}

            {isClaudeLoading && (
              <View style={checkIn.claudeCard}>
                <Text style={checkIn.claudeThinking}>Know Better is thinking…</Text>
              </View>
            )}

            {!!claudeResponse && !isClaudeLoading && (
              <View style={checkIn.claudeCard}>
                <Text style={checkIn.claudeText}>{claudeResponse}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <TouchableOpacity onPress={handleSignOut} activeOpacity={0.6}>
        <Text style={checkIn.signOutLink}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Onboarding save helpers ─────────────────────────────────────────────────

const ageToDOB = (ageStr) => {
  const d = new Date();
  if (ageStr === 'Less than 1 year') {
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }
  const num = parseInt(ageStr, 10);
  if (isNaN(num)) return null;
  d.setFullYear(d.getFullYear() - num);
  return d.toISOString().split('T')[0];
};

const saveOnboardingData = async (session, stored) => {
  const userId = session.user.id;
  const email = session.user.email;

  console.log('[DEBUG] saveOnboardingData called');
  console.log('[DEBUG] auth user:', JSON.stringify(session.user, null, 2));
  console.log('[DEBUG] onboarding data from AsyncStorage:', JSON.stringify({
    userName: stored.onboarding_userName,
    dogName: stored.onboarding_dogName,
    breed: stored.onboarding_breed,
    sex: stored.onboarding_sex,
    age: stored.onboarding_age,
    hasCondition: stored.onboarding_hasCondition,
    notes: stored.onboarding_notes,
    mood: stored.onboarding_mood,
    date_of_birth_computed: ageToDOB(stored.onboarding_age),
  }, null, 2));

  console.log('[DEBUG] upserting users table...');
  const { data: userData, error: userError } = await supabase.from('users').upsert({
    user_id: userId,
    first_name: stored.onboarding_userName,
    email,
  }).select();
  console.log('[DEBUG] users upsert response:', JSON.stringify({ data: userData, error: userError }, null, 2));
  if (userError) throw userError;

  const sexDb = (stored.onboarding_sex ?? '').toLowerCase();

  const moodDisplay = stored.onboarding_mood ?? '';
  const moodDb =
    moodDisplay.includes('great') ? 'great' :
    moodDisplay.includes('a little off') ? 'a_little_off' :
    'not_sure';

  console.log('[DEBUG] inserting dogs table...');
  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .insert({
      owner_id: userId,
      dog_name: stored.onboarding_dogName,
      breed: stored.onboarding_breed,
      sex: sexDb,
      date_of_birth: ageToDOB(stored.onboarding_age),
      pre_existing_health_conditions:
        stored.onboarding_hasCondition === 'true'
          ? (stored.onboarding_notes || null)
          : null,
      current_mood_at_onboarding: moodDb,
    })
    .select('dog_id')
    .single();
  console.log('[DEBUG] dogs insert response:', JSON.stringify({ data: dog, error: dogError }, null, 2));
  if (dogError) throw dogError;

  console.log('[DEBUG] inserting family_members table...');
  const { data: memberData, error: memberError } = await supabase.from('family_members').insert({
    owner_id: userId,
    member_user_id: userId,
    dog_id: dog.dog_id,
    role: 'primary_owner',
    can_log: true,
    can_view: true,
    can_manage: true,
  }).select();
  console.log('[DEBUG] family_members insert response:', JSON.stringify({ data: memberData, error: memberError }, null, 2));
  if (memberError) throw memberError;

  console.log('[DEBUG] saveOnboardingData completed successfully');
};

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;
      console.log('[DeepLink] URL received:', url);

      // Supabase puts tokens in the hash fragment on web, query string on some native flows
      const hashPart = url.split('#')[1];
      const queryPart = url.split('?')[1]?.split('#')[0];
      const fragment = hashPart || queryPart;
      if (!fragment) {
        console.log('[DeepLink] no token fragment found in URL');
        return;
      }

      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      console.log('[DeepLink] access_token:', access_token ? 'present' : 'missing', '| refresh_token:', refresh_token ? 'present' : 'missing');

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) console.log('[DeepLink] setSession error:', error.message);
        else console.log('[DeepLink] setSession success — SIGNED_IN will handle navigation');
      }
    };

    // App opened from a cold start via deep link
    Linking.getInitialURL().then(handleDeepLink);

    // App brought to foreground via deep link
    const linkSubscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    const navigateWhenReady = (routes) => {
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes });
      } else {
        setTimeout(() => navigateWhenReady(routes), 50);
      }
    };

    // Single source of truth for auth-driven navigation
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] event:', event, '| session:', session ? 'exists' : 'null');

        if (event === 'INITIAL_SESSION') {
          if (session) {
            navigateWhenReady([{ name: 'CheckIn' }]);
          }
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          console.log('[DEBUG] SIGNED_IN — querying dogs for owner_id:', session.user.id);
          const { data: dog, error: dogQueryError } = await supabase
            .from('dogs')
            .select('dog_id')
            .eq('owner_id', session.user.id)
            .limit(1)
            .maybeSingle();
          console.log('[DEBUG] dogs query result:', JSON.stringify({ data: dog, error: dogQueryError }, null, 2));

          if (dog) {
            if (navigationRef.isReady()) {
              navigationRef.reset({
                index: 0,
                routes: [{ name: 'CheckIn' }],
              });
            }
          } else {
            const pairs = await AsyncStorage.multiGet([
              'onboarding_userName',
              'onboarding_dogName',
              'onboarding_breed',
              'onboarding_sex',
              'onboarding_age',
              'onboarding_hasCondition',
              'onboarding_notes',
              'onboarding_mood',
            ]);
            const stored = Object.fromEntries(pairs);

            if (navigationRef.isReady()) {
              navigationRef.reset({
                index: 0,
                routes: [{
                  name: 'Congratulations',
                  params: {
                    userName: stored.onboarding_userName ?? 'there',
                    dogName: stored.onboarding_dogName ?? 'your dog',
                  },
                }],
              });
            }

            saveOnboardingData(session, stored).catch((err) => {
              console.log('[DEBUG] saveOnboardingData threw:', err?.message ?? err);
              Alert.alert(
                'Sync failed',
                "Your account was created but we couldn't save your dog's info. Please try again later."
              );
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
          headerStyle: { backgroundColor: '#FFFFFF' },
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
        <Stack.Screen name="SignIn" component={SignInScreen} />
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
    paddingTop: 24,
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
    paddingTop: 24,
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
});

// ─── Styles: Account ─────────────────────────────────────────────────────────

const account = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 24,
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

// ─── Styles: Sign In ─────────────────────────────────────────────────────────

const signIn = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 24,
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
  error: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 4,
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
    paddingTop: 24,
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
    paddingTop: 24,
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
    paddingTop: 24,
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
  micButtonProcessing: {
    backgroundColor: '#AAAAAA',
    shadowColor: '#AAAAAA',
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
  permissionError: {
    fontSize: 15,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  transcriptionCard: {
    backgroundColor: '#F0F9F6',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    width: '100%',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#222222',
    lineHeight: 24,
  },
  claudeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D6EDE7',
  },
  claudeThinking: {
    fontSize: 15,
    color: '#7A9E95',
    fontStyle: 'italic',
  },
  claudeText: {
    fontSize: 16,
    color: '#1A3C34',
    lineHeight: 26,
  },
  signOutLink: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
