import { supabase } from './lib/supabase';
import { sendPushNotification, setupPushNotifications } from './lib/notifications';
import BurgerMenu from './components/BurgerMenu';
import DogSelectionScreen from './screens/DogSelectionScreen';
import HelpScreen from './screens/HelpScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import TermsScreen from './screens/TermsScreen';
import { Audio, Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer, useNavigationContainerRef, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
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

// ─── Design Tokens ───────────────────────────────────────────────────────────

const T = {
  color: {
    teal:      '#0F6E56',
    charcoal:  '#1F2937',
    offWhite:  '#FAFAF9',
    gray600:   '#9CA3AF',
    gray300:   '#E5E7EB',
    gray100:   '#F3F4F6',
    amber:     '#D97706',
    orange:    '#EA580C',
    red:       '#DC2626',
    green:     '#059669',
  },
  space: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 },
  radius: { btn: 4, card: 8, input: 4, modal: 12 },
};

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VIDEO_URL = 'https://jywodsnqsfakkoyqpdex.supabase.co/storage/v1/object/public/Know-Better%20Ad%20video/Know-better%20ad.mp4';

function WelcomeVideo() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const handlePress = async () => {
    if (!videoRef.current || !isLoaded) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else if (hasFinished) {
        setHasFinished(false);
        await videoRef.current.replayAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (e) {
      console.log('[WelcomeVideo] playback error:', e);
    }
  };

  if (hasError) return null;

  return (
    <View style={welcome.videoWrap}>
      <Video
        ref={videoRef}
        source={{ uri: VIDEO_URL }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.STRETCH}
        useNativeControls
        shouldPlay={false}
        onLoad={() => setIsLoaded(true)}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setHasFinished(true);
          }
        }}
        onError={() => setHasError(true)}
      />
      {!isPlaying && (
        <TouchableOpacity style={welcome.playOverlay} onPress={handlePress} activeOpacity={0.8}>
          <View style={welcome.playBtn}>
            <MaterialCommunityIcons name="play" size={32} color="#0F6E56" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function WelcomeScreen({ navigation }) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const waveAnim   = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Paw pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0,  duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Wave opacity float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 0.30, duration: 2000, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0.15, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={['#0F6E56', '#0d5946']} style={welcome.gradient}>
      <StatusBar style="light" />

      <Animated.View style={[welcome.inner, { opacity: fadeAnim }]}>
        {/* Icon */}
        <Animated.View style={[welcome.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <MaterialCommunityIcons name="paw" size={96} color="#FFFFFF" />
        </Animated.View>

        {/* Copy */}
        <View style={welcome.copy}>
          <Text style={welcome.title}>Welcome to Know Better</Text>
          <Text style={welcome.subtitle}>I would love to get to know your dog.</Text>
        </View>

        {/* Video */}
        <WelcomeVideo />

        {/* Buttons */}
        <View style={welcome.footer}>
          <TouchableOpacity
            style={welcome.button}
            activeOpacity={0.88}
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
      </Animated.View>

      {/* Wave accent */}
      <Animated.View
        pointerEvents="none"
        style={[welcome.wave, { opacity: waveAnim }]}
      />
    </LinearGradient>
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
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[dogName.button, { backgroundColor: name.trim() ? '#0F6E56' : '#E5E7EB' }]}
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
        <View style={dogBreed.inputRow}>
          <TextInput
            style={dogBreed.input}
            placeholder={`What breed is ${dogName}?`}
            placeholderTextColor="#9CA3AF"
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
          {breed.length > 0 && (
            <TouchableOpacity
              style={dogBreed.clearBtn}
              onPress={() => { setBreed(''); setShowSuggestions(true); }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

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
        style={[dogBreed.button, { backgroundColor: breed.trim() && sex ? '#0F6E56' : '#E5E7EB' }]}
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
            color="#9CA3AF"
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
        style={[dogAge.button, { backgroundColor: selectedAge ? '#0F6E56' : '#E5E7EB' }]}
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
              placeholderTextColor="#9CA3AF"
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
          style={[dogMood.button, { backgroundColor: selectedMood ? '#0F6E56' : '#E5E7EB' }]}
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

const SIGNAL_DIMS = ['appetite', 'energy', 'water_intake', 'demeanor', 'vomiting', 'elimination'];

const isLowSignal = (dim, values) => {
  switch (dim) {
    case 'appetite':    return values.some(v => v === 'low' || v === 'skipped');
    case 'energy':      return values.some(v => v === 'low');
    case 'water_intake':return values.some(v => v === 'low' || v === 'absent');
    case 'demeanor':    return values.some(v => v === 'low');
    case 'vomiting':    return values.some(v => v === 'once' || v === 'multiple');
    case 'elimination': return values.some(v => v === 'irregular' || v === 'absent');
    default: return false;
  }
};

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
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (authError) console.log('[OTP] signInWithOtp error:', authError.message);
    setIsLoading(false);
    if (authError) {
      setError('Something went wrong. Please try again.');
    } else {
      navigation.navigate('OtpCode', { email: email.trim(), isNewUser: true });
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
              placeholderTextColor="#9CA3AF"
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
              placeholder="I'll send your code here"
              placeholderTextColor="#9CA3AF"
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
          style={[account.button, { backgroundColor: canSubmit && !isLoading ? '#0F6E56' : '#E5E7EB' }]}
          activeOpacity={0.85}
          disabled={!canSubmit || isLoading}
          onPress={handleSendLink}
        >
          <Text style={account.buttonText}>{isLoading ? 'Sending…' : 'Send my code'}</Text>
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
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    if (authError) console.log('[OTP] signInWithOtp error:', authError.message);
    setIsLoading(false);
    if (authError) {
      setError('Something went wrong. Please try again.');
    } else {
      navigation.navigate('OtpCode', { email: email.trim(), isNewUser: false });
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
          <Text style={signIn.subtext}>I'll send you an 8-digit code.</Text>
        </View>

        <View style={signIn.form}>
          <TextInput
            style={signIn.input}
            placeholder="Your email address"
            placeholderTextColor="#9CA3AF"
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
          style={[signIn.button, { backgroundColor: canSubmit && !isLoading ? '#0F6E56' : '#E5E7EB' }]}
          activeOpacity={0.85}
          disabled={!canSubmit || isLoading}
          onPress={handleSendLink}
        >
          <Text style={signIn.buttonText}>{isLoading ? 'Sending…' : 'Send my code'}</Text>
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
          onPress={async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: dog } = await supabase
              .from('dogs')
              .select('dog_id, dog_name, profile_photo_url')
              .eq('owner_id', session.user.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();
            navigation.navigate('CheckIn', {
              dogId: dog?.dog_id ?? null,
              dogName: dog?.dog_name ?? dogName,
              dogPhotoUrl: dog?.profile_photo_url ?? null,
              userName,
            });
          }}
        >
          <Text style={congrats.buttonText}>Let's hear it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen 10: Daily Check-In ───────────────────────────────────────────────

const DAILY_CHECKIN_LIMIT = 10;

const getCheckInTypeByTime = () => {
  const hour = new Date().getHours();
  return (hour >= 5 && hour < 17) ? 'morning' : 'evening';
};

const ALERT_BANNER_CONFIG = {
  1: { bg: '#FFFBEB', text: 'I noticed a pattern', color: '#D97706' },
  2: { bg: '#FFF7ED', text: 'Worth mentioning to your vet', color: '#EA580C' },
  3: { bg: '#FEE2E2', text: 'Contact your vet today', color: '#DC2626' },
};

function CheckInScreen({ navigation, route }) {
  const { userName: paramUserName, dogName: paramDogName, dogId: paramDogId, dogPhotoUrl: paramDogPhotoUrl } = route.params ?? {};
  const [userName, setUserName] = useState(paramUserName ?? '');
  const [dogName, setDogName] = useState(paramDogName ?? '');
  const [dogPhotoUrl, setDogPhotoUrl] = useState(paramDogPhotoUrl ?? null);
  const [currentDogId, setCurrentDogId] = useState(paramDogId ?? null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [transcription, setTranscription] = useState('');
  const [claudeResponse, setClaudeResponse] = useState('');
  const [activeAlertLevel, setActiveAlertLevel] = useState(null);
  const [activeAlertId, setActiveAlertId] = useState(null);
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [showVetUpdateModal, setShowVetUpdateModal] = useState(false);
  const [vetVisitDate, setVetVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vetFeedback, setVetFeedback] = useState('');
  const [treatmentGiven, setTreatmentGiven] = useState('');
  const [vetNotes, setVetNotes] = useState('');
  const [isSubmittingVetUpdate, setIsSubmittingVetUpdate] = useState(false);
  const [vetSuccessToast, setVetSuccessToast] = useState(false);
  const [isClaudeLoading, setIsClaudeLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'type'
  const [typedText, setTypedText] = useState('');
  const [inputExpanded, setInputExpanded] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [dailyCountLoaded, setDailyCountLoaded] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
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
      fetchDailyCount(userId);

      if (Platform.OS !== 'web') {
        const { token } = await setupPushNotifications();
        if (token) {
          await supabase.from('users').update({ push_token: token }).eq('user_id', userId);
          console.log('[Notifications] push_token saved to users table');
        }
      }

      const [userResult, dogResult] = await Promise.all([
        supabase.from('users').select('first_name').eq('user_id', userId).single(),
        paramDogId
          ? supabase.from('dogs').select('dog_name, dog_id, profile_photo_url').eq('dog_id', paramDogId).single()
          : supabase.from('dogs').select('dog_name, dog_id, profile_photo_url').eq('owner_id', userId).limit(1).single(),
      ]);
      if (userResult.data?.first_name) setUserName(userResult.data.first_name);
      if (dogResult.data?.dog_name) setDogName(dogResult.data.dog_name);
      if (dogResult.data?.profile_photo_url) setDogPhotoUrl(`${dogResult.data.profile_photo_url}?t=${Date.now()}`);
      const dogId = dogResult.data?.dog_id ?? null;
      dogIdRef.current = dogId;
      setCurrentDogId(dogId);

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
    const checkAlertExpiry = async () => {
      const { data: acknowledged } = await supabase
        .from('alerts')
        .select('alert_id, alert_level, acknowledged_at, dog_id')
        .eq('alert_status', 'acknowledged')
        .is('vet_update_logged_at', null);
      if (!acknowledged?.length) return;
      const now = new Date();
      for (const a of acknowledged) {
        if (!a.acknowledged_at) continue;
        const daysSince = (now - new Date(a.acknowledged_at)) / (1000 * 60 * 60 * 24);
        const expiryDays = a.alert_level === 'level_3' ? 3 : 7;
        if (daysSince > expiryDays) {
          await supabase.from('alerts').update({ alert_status: 'expired' }).eq('alert_id', a.alert_id);
          await resetBaseline(a.dog_id);
        }
      }
    };
    checkAlertExpiry();
  }, []);

  useEffect(() => {
    const newDogId = route.params?.dogId;
    if (!newDogId || newDogId === dogIdRef.current) return;

    dogIdRef.current = newDogId;
    setCurrentDogId(newDogId);
    if (route.params?.dogName) setDogName(route.params.dogName);
    setDogPhotoUrl(route.params?.dogPhotoUrl ? `${route.params.dogPhotoUrl}?t=${Date.now()}` : null);
    setTranscription('');
    setClaudeResponse('');
    setActiveAlertLevel(null);
    setActiveAlertId(null);
    setAlertAcknowledged(false);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from('family_members')
        .select('family_member_id')
        .eq('owner_id', session.user.id)
        .eq('dog_id', newDogId)
        .single()
        .then(({ data }) => {
          if (data?.family_member_id) familyMemberIdRef.current = data.family_member_id;
        });
    });
  }, [route.params?.dogId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setTranscription('');
      setClaudeResponse('');
      setTypedText('');
      setInputExpanded(false);
    });
    return unsubscribe;
  }, [navigation]);

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

  const fetchDailyCount = async (userId) => {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: dogs } = await supabase.from('dogs').select('dog_id').eq('owner_id', userId);
    const dogIds = (dogs ?? []).map(d => d.dog_id);
    if (dogIds.length === 0) { setDailyCountLoaded(true); return 0; }
    const { count } = await supabase
      .from('check_ins')
      .select('check_in_id', { count: 'exact', head: true })
      .in('dog_id', dogIds)
      .gte('created_at', todayStart.toISOString());
    const c = count ?? 0;
    setDailyCount(c);
    setDailyCountLoaded(true);
    return c;
  };

  const saveCheckIn = async (blob, mimeType, transcriptionText, inputClassification = 'irrelevant', treatmentActive = false) => {
    const userId = userIdRef.current;
    const dogId = dogIdRef.current;
    const familyMemberId = familyMemberIdRef.current;
    console.log('[CheckIn] saveCheckIn called — dog_id:', dogId, '| treatmentActive:', treatmentActive, '| classification:', inputClassification);
    if (!userId || !dogId || !familyMemberId) {
      console.log('[CheckIn] missing IDs, skipping save:', { userId, dogId, familyMemberId });
      return null;
    }

    // Hard rate limit check (server-side guard)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: userDogs } = await supabase.from('dogs').select('dog_id').eq('owner_id', userId);
    const allDogIds = (userDogs ?? []).map(d => d.dog_id);
    const { count: todayCount } = await supabase
      .from('check_ins')
      .select('check_in_id', { count: 'exact', head: true })
      .in('dog_id', allDogIds)
      .gte('created_at', todayStart.toISOString());
    if ((todayCount ?? 0) >= DAILY_CHECKIN_LIMIT) {
      console.log('[RateLimit] daily limit reached, blocking save');
      setDailyCount(todayCount ?? 0);
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
          contributed_to_baseline: inputClassification === 'health_event' ? 'partial' : (inputClassification === 'normal' || inputClassification === 'concerning') ? (treatmentActive ? 'partial' : 'yes') : 'no',
        })
        .select('check_in_id')
        .single();
      if (checkInError) {
        console.log('[CheckIn] insert error:', checkInError);
        return null;
      }
      console.log('[CheckIn] saved, check_in_id:', checkInData.check_in_id);
      setDailyCount(c => c + 1);
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

  const getActiveTreatment = async (dogId) => {
    try {
      console.log('[HealthEvent] getActiveTreatment — querying dog_id:', dogId);
      const { data, error } = await supabase
        .from('health_events')
        .select('health_event_id, treatment_active')
        .eq('dog_id', dogId)
        .eq('treatment_active', true)
        .limit(1);
      console.log('[HealthEvent] getActiveTreatment — raw response: data:', JSON.stringify(data), '| error:', JSON.stringify(error));
      if (error) { console.log('[HealthEvent] getActiveTreatment error:', error); return false; }
      const result = !!(data && data.length > 0);
      console.log('[HealthEvent] getActiveTreatment — returning:', result);
      return result;
    } catch (err) {
      console.log('[HealthEvent] getActiveTreatment error:', err);
      return false;
    }
  };

  const extractHealthEvent = async (transcriptionText, checkInId, dogId, familyMemberId) => {
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
          system: `You are analyzing a dog owner's check-in that mentions a significant medical event. Extract the following and return as JSON only:
{ "event_title": "brief title of the event", "event_type": "critical, medium, or low", "event_description": "what happened in plain language", "treatment_active": true }
event_type guide: critical = surgery, hospitalization, serious diagnosis. medium = vet visit, new medication, minor procedure. low = routine checkup, vaccination.`,
          messages: [{ role: 'user', content: transcriptionText }],
        }),
      });
      const data = await response.json();
      const rawText = data.content?.[0]?.text ?? '';
      const cleaned = rawText.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
      const extracted = JSON.parse(cleaned);
      console.log('[HealthEvent] extracted:', JSON.stringify(extracted));

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('health_events').insert({
        dog_id: dogId,
        family_member_id: familyMemberId,
        event_title: extracted.event_title,
        event_description: extracted.event_description,
        event_type: extracted.event_type,
        treatment_active: true,
        event_date: today,
        pattern_engine_context: { reason: 'health event detected', classification: 'health_event' },
      });
      if (error) console.log('[HealthEvent] insert error:', error);
      else console.log('[HealthEvent] saved:', extracted.event_title);
    } catch (err) {
      console.log('[HealthEvent] error:', err);
    }
  };

  const checkTreatmentWindowClose = async (dogId) => {
    try {
      const { data: activeEvents } = await supabase
        .from('health_events')
        .select('health_event_id')
        .eq('dog_id', dogId)
        .eq('treatment_active', true)
        .limit(1);
      if (!activeEvents || activeEvents.length === 0) return;

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from('check_ins')
        .select('input_classification, created_at')
        .eq('dog_id', dogId)
        .in('contributed_to_baseline', ['yes', 'partial'])
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (!recent || recent.length === 0) return;

      const dayMap = {};
      for (const row of recent) {
        const day = row.created_at.split('T')[0];
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(row);
      }
      const days = Object.keys(dayMap).sort().reverse();
      if (days.length < 2) return;

      const isDayConcerning = (rows) => rows.some(r => r.input_classification === 'concerning');
      if (isDayConcerning(dayMap[days[0]]) || isDayConcerning(dayMap[days[1]])) return;

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('health_events')
        .update({ treatment_active: false, event_end_date: today })
        .eq('dog_id', dogId)
        .eq('treatment_active', true);
      if (error) console.log('[HealthEvent] close window error:', error);
      else console.log('[HealthEvent] two consecutive normal days — closing treatment window');
    } catch (err) {
      console.log('[HealthEvent] checkTreatmentWindowClose error:', err);
    }
  };

  const getDailySummary = async (dogId) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('signals')
        .select('appetite, energy, water_intake, demeanor, vomiting, elimination')
        .eq('dog_id', dogId)
        .gte('created_at', todayStart.toISOString());
      if (error) { console.log('[DailySummary] query error:', error); return { lowSignals: [], combinationFlag: false, lowSignalCount: 0 }; }
      if (!data || data.length === 0) return { lowSignals: [], combinationFlag: false, lowSignalCount: 0 };

      const lowSignals = SIGNAL_DIMS.filter(dim => {
        const values = data.map(r => r[dim]).filter(v => v != null && v !== 'null');
        return isLowSignal(dim, values);
      });
      const combinationFlag = lowSignals.length >= 2;
      console.log('[Combination] signals low today:', lowSignals, '— combination_flag:', combinationFlag);
      return { lowSignals, combinationFlag, lowSignalCount: lowSignals.length };
    } catch (err) {
      console.log('[DailySummary] error:', err);
      return { lowSignals: [], combinationFlag: false, lowSignalCount: 0 };
    }
  };

  const calculateBaseline = async (dogId) => {
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('check_ins')
        .select('input_classification, created_at')
        .eq('dog_id', dogId)
        .in('contributed_to_baseline', ['yes', 'partial'])
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) { console.log('[Baseline] query error:', error); return; }

      // Group check-ins by calendar day
      const checkInsByDay = {};
      for (const row of data) {
        const day = row.created_at.split('T')[0];
        if (!checkInsByDay[day]) checkInsByDay[day] = [];
        checkInsByDay[day].push(row);
      }

      // Days sorted newest first
      const sortedDays = Object.keys(checkInsByDay).sort().reverse();

      const isDayConcerning = (rows) => rows.some(r => r.input_classification === 'concerning' || r.input_classification === 'health_event');
      const isDayNormal = (rows) => !isDayConcerning(rows) && rows.some(r =>
        r.input_classification === 'normal' || r.input_classification === 'irrelevant'
      );

      const normal_days = sortedDays.filter(day => isDayNormal(checkInsByDay[day])).length;
      const concerning_days = sortedDays.filter(day => isDayConcerning(checkInsByDay[day])).length;
      const total_days = normal_days + concerning_days;
      const normal_rate = total_days > 0 ? normal_days / total_days : 0;
      const concerning_rate = total_days > 0 ? concerning_days / total_days : 0;
      const last_day_classification = sortedDays.length > 0
        ? (isDayConcerning(checkInsByDay[sortedDays[0]]) ? 'concerning' : 'normal')
        : null;
      const baseline_active = total_days >= 3;

      let consecutive_concerning_days = 0;
      for (const day of sortedDays) {
        if (isDayConcerning(checkInsByDay[day])) consecutive_concerning_days++;
        else break;
      }

      const { combinationFlag, lowSignalCount } = await getDailySummary(dogId);

      const { data: signalRows } = await supabase
        .from('signals')
        .select('appetite, energy, water_intake, demeanor, vomiting, elimination, created_at')
        .eq('dog_id', dogId)
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      const signalDayMap = {};
      for (const row of (signalRows ?? [])) {
        const day = row.created_at.split('T')[0];
        if (!signalDayMap[day]) signalDayMap[day] = [];
        signalDayMap[day].push(row);
      }
      let consecutive_combination_days = 0;
      for (let i = 0; i < 7; i++) {
        const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dayRows = signalDayMap[day] ?? [];
        const dayLowCount = SIGNAL_DIMS.filter(dim => {
          const vals = dayRows.map(r => r[dim]).filter(v => v != null && v !== 'null');
          return isLowSignal(dim, vals);
        }).length;
        if (dayLowCount >= 2) consecutive_combination_days++;
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
        combination_flag: combinationFlag,
        low_signal_count_today: lowSignalCount,
        consecutive_combination_days,
      };

      const { error: upsertError } = await supabase
        .from('baselines')
        .upsert({ dog_id: dogId, baseline_data }, { onConflict: 'dog_id' });
      if (upsertError) console.log('[Baseline] upsert error:', upsertError);
      else console.log('[Baseline] calculated and saved:', JSON.stringify(baseline_data));
    } catch (err) {
      console.log('[Baseline] error:', err);
    }
  };

  const detectDeviation = async (dogId, checkInId, treatmentActive = false) => {
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

      // Alert suppression: max one alert per day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayAlerts } = await supabase
        .from('alerts')
        .select('alert_level')
        .eq('dog_id', dogId)
        .gte('created_at', todayStart.toISOString())
        .limit(1);
      if (todayAlerts && todayAlerts.length > 0) {
        console.log('[Deviation] suppressed — alert already fired today');
        return { alertLevel: null, consecutiveDays: 0 };
      }

      // Consecutive concerning days rule (relaxed thresholds during active treatment)
      const ccd = b.consecutive_concerning_days ?? 0;
      const totalDays = b.total_days ?? 0;
      let alertLevel = null;
      if (treatmentActive) {
        console.log('[HealthEvent] treatment context active — using relaxed thresholds');
        if (ccd >= 5) alertLevel = 3;
        else if (ccd >= 3) alertLevel = 2;
        else if (ccd >= 4) alertLevel = 1;
      } else {
        if      (ccd >= 5 && totalDays >= 6) alertLevel = 3;
        else if (ccd >= 3 && totalDays >= 5) alertLevel = 2;
        else if (ccd >= 2 && totalDays >= 5) alertLevel = 1;

        if (alertLevel === null && ccd >= 2) {
          const needed = ccd >= 5 ? 10 : ccd >= 3 ? 7 : 5;
          console.log(`[Deviation] Insufficient baseline data for alerts (${totalDays}/${needed} days)`);
        }
      }
      console.log('[Deviation] consecutive_concerning_days:', ccd, '| total_days:', totalDays, '→ alertLevel:', alertLevel);

      // Combination rule
      const ccfd = b.consecutive_combination_days ?? 0;
      const lowCount = b.low_signal_count_today ?? 0;
      let combinationAlertLevel = null;
      if      (lowCount >= 3 && totalDays >= 7) combinationAlertLevel = 2;
      else if (ccfd >= 3   && totalDays >= 7)  combinationAlertLevel = 2;
      else if (ccfd >= 2   && totalDays >= 5)  combinationAlertLevel = 1;
      console.log('[Deviation] consecutive_combination_days:', ccfd, '| low_signal_count_today:', lowCount, '| total_days:', totalDays, '→ combinationAlertLevel:', combinationAlertLevel);

      // Final: highest level from either rule
      const finalLevel = Math.max(alertLevel ?? 0, combinationAlertLevel ?? 0) || null;
      let savedAlertId = null;

      if (finalLevel !== null) {
        const parts = [];
        if (alertLevel !== null) parts.push(`${ccd} consecutive concerning day${ccd !== 1 ? 's' : ''}`);
        if (combinationAlertLevel !== null) {
          if (lowCount >= 3) parts.push(`${lowCount} low signals today (immediate)`);
          else parts.push(`${ccfd} consecutive combination flag day${ccfd !== 1 ? 's' : ''}`);
        }
        const alert_trigger_reason = parts.join(' + ') + ' detected.';
        const { data: alertData, error: alertError } = await supabase.from('alerts').insert({
          dog_id: dogId,
          check_in_id: checkInId,
          alert_level: `level_${finalLevel}`,
          alert_trigger_reason,
          baseline_snapshot: b,
          alert_status: 'active',
        }).select('alert_id').single();
        if (alertError) console.log('[Deviation] alert insert error:', alertError);
        else { console.log('[Deviation] alert saved — level:', finalLevel, '|', alert_trigger_reason); savedAlertId = alertData?.alert_id ?? null; }
      }

      const consecutiveDays = (alertLevel ?? 0) >= (combinationAlertLevel ?? 0) ? ccd : ccfd;
      return { alertLevel: finalLevel, consecutiveDays, alertId: savedAlertId };
    } catch (err) {
      console.log('[Deviation] error:', err);
      return { alertLevel: null, consecutiveDays: 0, alertId: null };
    }
  };

  const callClaude = async (transcriptionText, checkInId, classification, alertLevel = null, consecutiveDays = 0, alertId = null) => {
    setIsClaudeLoading(true);
    setClaudeResponse('');
    setActiveAlertLevel(null);
    const name = dogName || 'your dog';
    let systemPrompt;
    if (alertLevel === 3) {
      systemPrompt = `You are Know Better, a caring AI companion for dog owners. You speak in first person singular. The owner just shared this about their dog ${name}: ${transcriptionText}. This is the ${consecutiveDays} consecutive day with concerning observations. Respond directly and calmly. Acknowledge what the owner shared. Clearly recommend they contact their vet today. Do not diagnose. Do not alarm. 2 sentences maximum.`;
    } else if (alertLevel === 2) {
      systemPrompt = `You are Know Better, a caring AI companion for dog owners. You speak in first person singular. The owner just shared this about their dog ${name}: ${transcriptionText}. This is the ${consecutiveDays} consecutive day with concerning observations. Respond gently but clearly. Acknowledge what the owner shared. Recommend they mention this pattern to their vet soon — not urgently but within the next day or two. Do not diagnose. Do not alarm. 2 sentences maximum.`;
    } else if (alertLevel === 1) {
      systemPrompt = `You are Know Better, a caring AI companion for dog owners. You speak in first person singular. The owner just shared this about their dog ${name}: ${transcriptionText}. This is the ${consecutiveDays} consecutive day with concerning observations. Respond calmly and warmly. Acknowledge specifically what the owner shared today. Note that you have noticed this pattern over the past few days and will keep watching. Do not diagnose. Do not alarm. 2 sentences maximum.`;
    } else if (classification === 'concerning') {
      systemPrompt = `You are Know Better, a caring AI companion for dog owners. You speak in first person singular. The owner just shared this about their dog ${name}: ${transcriptionText}. Acknowledge specifically what they shared. Let them know you heard it and you are paying close attention. Convey warmth and quiet attentiveness — you are watching alongside them. Do not suggest a vet. Do not diagnose. Do not use alarm. Do not use phrases like "keep an eye on" or "monitor closely". 2 sentences maximum.`;
    } else if (classification === 'irrelevant') {
      systemPrompt = `You are Know Better, a caring companion for dog owners. The owner's message does not contain any information about their dog's health or routine. Respond warmly and briefly — acknowledge what they said, then gently invite them to share how ${name} is doing today. Keep it to 1-2 sentences maximum. Do not ask about their personal life.`;
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
        setActiveAlertLevel(alertLevel);
        setActiveAlertId(alertId);
        saveResponse(checkInId, responseText);
        if (alertLevel === 2 || alertLevel === 3) {
          setTimeout(() => {
            sendPushNotification(userIdRef.current, name, `level_${alertLevel}`, responseText);
          }, 60000);
        }
      }
    } catch (err) {
      console.log('[Claude] error:', err);
    } finally {
      setIsClaudeLoading(false);
    }
  };

  const resetBaseline = async (dogId) => {
    if (!dogId) return;
    await supabase.from('baselines').update({
      baseline_active: false,
      consecutive_concerning_days: 0,
      consecutive_combination_days: 0,
      concerning_rate: 0,
      low_signal_count_today: 0,
    }).eq('dog_id', dogId);
  };

  const acknowledgeAlert = async () => {
    if (!activeAlertId) return;
    await supabase.from('alerts').update({
      alert_status: activeAlertLevel === 1 ? 'resolved' : 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    }).eq('alert_id', activeAlertId);
    if (activeAlertLevel === 1) {
      setActiveAlertLevel(null);
      setActiveAlertId(null);
      setTranscription('');
      setClaudeResponse('');
      await resetBaseline(currentDogId);
    } else {
      setAlertAcknowledged(true);
    }
  };

  const submitVetUpdate = async () => {
    setIsSubmittingVetUpdate(true);
    try {
      await supabase.from('vet_updates').insert({
        alert_id: activeAlertId,
        dog_id: currentDogId,
        vet_visit_date: vetVisitDate || null,
        vet_feedback: vetFeedback || null,
        treatment_given: treatmentGiven || null,
        notes: vetNotes || null,
      });
      await supabase.from('alerts').update({
        alert_status: 'resolved',
        vet_update_logged_at: new Date().toISOString(),
      }).eq('alert_id', activeAlertId);
      await resetBaseline(currentDogId);
      setShowVetUpdateModal(false);
      setActiveAlertLevel(null);
      setActiveAlertId(null);
      setAlertAcknowledged(false);
      setVetVisitDate('');
      setVetFeedback('');
      setTreatmentGiven('');
      setVetNotes('');
      setVetSuccessToast(true);
      setTimeout(() => setVetSuccessToast(false), 3000);
    } catch (err) {
      console.log('[VetUpdate] error:', err);
    } finally {
      setIsSubmittingVetUpdate(false);
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
          const treatmentActive = await getActiveTreatment(dogIdRef.current);
          const checkInId = await saveCheckIn(blob, blob.type, result.text, classification, treatmentActive);
          if (classification === 'health_event') {
            extractHealthEvent(result.text, checkInId, dogIdRef.current, familyMemberIdRef.current);
          }
          if (classification === 'concerning' || classification === 'health_event') {
            await extractSignals(result.text, checkInId, dogIdRef.current);
          }
          await calculateBaseline(dogIdRef.current);
          if (classification !== 'health_event') {
            await checkTreatmentWindowClose(dogIdRef.current);
          }
          const { alertLevel, consecutiveDays, alertId } = await detectDeviation(dogIdRef.current, checkInId, treatmentActive);
          callClaude(result.text, checkInId, classification, alertLevel, consecutiveDays, alertId);
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
          const treatmentActive = await getActiveTreatment(dogIdRef.current);
          const checkInId = await saveCheckIn(nativeBlob, 'audio/m4a', result.text, classification, treatmentActive);
          if (classification === 'health_event') {
            extractHealthEvent(result.text, checkInId, dogIdRef.current, familyMemberIdRef.current);
          }
          if (classification === 'concerning' || classification === 'health_event') {
            await extractSignals(result.text, checkInId, dogIdRef.current);
          }
          await calculateBaseline(dogIdRef.current);
          if (classification !== 'health_event') {
            await checkTreatmentWindowClose(dogIdRef.current);
          }
          const { alertLevel, consecutiveDays, alertId } = await detectDeviation(dogIdRef.current, checkInId, treatmentActive);
          callClaude(result.text, checkInId, classification, alertLevel, consecutiveDays, alertId);
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

  const handleTextSubmit = async () => {
    const text = typedText.trim();
    if (!text) return;
    setRecordingState('processing');
    setTranscription(text);
    setTypedText('');
    const userId = userIdRef.current;
    const dogId = dogIdRef.current;
    const familyMemberId = familyMemberIdRef.current;
    try {
      const classification = await classifyCheckIn(text);
      const treatmentActive = await getActiveTreatment(dogId);
      let checkInId = null;
      if (userId && dogId && familyMemberId) {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const { data: userDogs } = await supabase.from('dogs').select('dog_id').eq('owner_id', userId);
        const allDogIds = (userDogs ?? []).map(d => d.dog_id);
        const { count: todayCount } = await supabase
          .from('check_ins')
          .select('check_in_id', { count: 'exact', head: true })
          .in('dog_id', allDogIds)
          .gte('created_at', todayStart.toISOString());
        if ((todayCount ?? 0) >= DAILY_CHECKIN_LIMIT) {
          setDailyCount(todayCount ?? 0);
        } else {
          const { data: checkInData, error: checkInError } = await supabase
            .from('check_ins')
            .insert({
              dog_id: dogId,
              family_member_id: familyMemberId,
              check_in_type: getCheckInTypeByTime(),
              check_in_text: text,
              transcription_status: 'completed',
              input_classification: classification,
              contributed_to_baseline: classification === 'health_event' ? 'partial' : (classification === 'normal' || classification === 'concerning') ? (treatmentActive ? 'partial' : 'yes') : 'no',
            })
            .select('check_in_id')
            .single();
          if (!checkInError) {
            checkInId = checkInData.check_in_id;
            setDailyCount(c => c + 1);
          } else {
            console.log('[TextCheckIn] insert error:', checkInError);
          }
        }
      }
      if (checkInId) {
        if (classification === 'health_event') {
          extractHealthEvent(text, checkInId, dogId, familyMemberId);
        }
        if (classification === 'concerning' || classification === 'health_event') {
          await extractSignals(text, checkInId, dogId);
        }
        await calculateBaseline(dogId);
        if (classification !== 'health_event') {
          await checkTreatmentWindowClose(dogId);
        }
      }
      const { alertLevel, consecutiveDays, alertId } = await detectDeviation(dogId, checkInId, treatmentActive);
      callClaude(text, checkInId, classification, alertLevel, consecutiveDays, alertId);
    } catch (err) {
      console.log('[TextCheckIn] error:', err);
    } finally {
      setRecordingState('idle');
    }
  };

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  const isAtLimit = dailyCountLoaded && dailyCount >= DAILY_CHECKIN_LIMIT;

  return (
    <View style={checkIn.container}>
      <StatusBar style="dark" />

      <View style={checkIn.topBar}>
        <TouchableOpacity onPress={() => setIsMenuOpen(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="menu" size={26} color="#0F6E56" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="paw" size={18} color="#0F6E56" />
          <Text style={checkIn.brand}>Know Better</Text>
        </View>
      </View>

      {dogName ? (
        <TouchableOpacity
          style={checkIn.dogHeader}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('DogSelection', { mode: 'switch' })}
        >
          {dogPhotoUrl ? (
            <Image source={{ uri: dogPhotoUrl }} style={checkIn.dogHeaderPhoto} />
          ) : (
            <View style={checkIn.dogHeaderPhotoPlaceholder}>
              <MaterialCommunityIcons name="paw" size={24} color="#0F6E56" />
            </View>
          )}
          <Text style={checkIn.dogHeaderName}>{dogName}</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={checkIn.scrollArea}
        contentContainerStyle={[checkIn.scrollContent, inputMode === 'type' && { paddingBottom: 25 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={checkIn.greeting}>Good morning, {userName || 'there'}.</Text>
        <Text style={checkIn.question}>How did {dogName || 'your dog'}'s morning go?</Text>

        <>
            <View style={checkIn.modeToggle}>
              <TouchableOpacity
                style={[checkIn.modeBtn, inputMode === 'voice' && checkIn.modeBtnActive]}
                onPress={() => { setInputMode('voice'); setInputExpanded(false); }}
                activeOpacity={0.8}
              >
                <Text style={[checkIn.modeBtnText, inputMode === 'voice' && checkIn.modeBtnActiveText]}>Voice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[checkIn.modeBtn, inputMode === 'type' && checkIn.modeBtnActive]}
                onPress={() => { setInputMode('type'); setInputExpanded(false); }}
                activeOpacity={0.8}
              >
                <Text style={[checkIn.modeBtnText, inputMode === 'type' && checkIn.modeBtnActiveText]}>Type</Text>
              </TouchableOpacity>
            </View>

            {inputMode === 'voice' ? (
              permissionDenied ? (
                <Text style={checkIn.permissionError}>
                  Microphone access is required. Please enable it in your device settings.
                </Text>
              ) : (
                <>
                  <TouchableOpacity
                    style={checkIn.micOuter}
                    activeOpacity={isProcessing || isAtLimit ? 1 : 0.9}
                    onPress={isProcessing || isAtLimit ? undefined : handleMicPress}
                    disabled={isProcessing || isAtLimit}
                  >
                    {isRecording && (
                      <Animated.View style={[checkIn.ring, { transform: [{ scale: ringPulse }] }]} />
                    )}
                    <Animated.View style={[
                      checkIn.micButton,
                      isRecording && checkIn.micButtonRecording,
                      isProcessing && checkIn.micButtonProcessing,
                      isAtLimit && checkIn.micButtonDisabled,
                      { transform: [{ scale: pulse }] },
                    ]}>
                      <MaterialCommunityIcons name="microphone" size={28} color="#FFFFFF" />
                    </Animated.View>
                  </TouchableOpacity>

                  <Text style={checkIn.listening}>
                    {isAtLimit ? 'Daily limit reached' : isProcessing ? 'Processing…' : isRecording ? 'Recording…' : "I'm listening."}
                  </Text>

                  {isAtLimit ? (
                    <Text style={checkIn.rateLimitMsg}>
                      You've used your {DAILY_CHECKIN_LIMIT} daily check-ins. I will see you tomorrow!
                    </Text>
                  ) : (
                    <>
                      {dailyCountLoaded && dailyCount > 0 && recordingState === 'idle' && !transcription && (
                        <Text style={checkIn.rateCounter}>{dailyCount}/{DAILY_CHECKIN_LIMIT} check-ins used today</Text>
                      )}
                      {recordingState === 'idle' && !transcription && (
                        <Text style={checkIn.hint}>
                          Tap the mic and tell me about {dogName || 'your dog'}'s morning
                        </Text>
                      )}
                    </>
                  )}
                </>
              )
            ) : (
              <>
                <TextInput
                  style={[checkIn.typeInput, { height: inputExpanded ? 120 : 50 }]}
                  multiline
                  placeholder="Describe what you observed..."
                  placeholderTextColor="#9CA3AF"
                  value={typedText}
                  onChangeText={setTypedText}
                  editable={!isProcessing && !isAtLimit}
                  textAlignVertical="top"
                  onFocus={() => {
                    setInputExpanded(true);
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                  }}
                  onBlur={() => setInputExpanded(false)}
                />
                {isAtLimit ? (
                  <Text style={checkIn.rateLimitMsg}>
                    You've used your {DAILY_CHECKIN_LIMIT} daily check-ins. I will see you tomorrow!
                  </Text>
                ) : (
                  <>
                    {dailyCountLoaded && dailyCount > 0 && recordingState === 'idle' && !transcription && (
                      <Text style={checkIn.rateCounter}>{dailyCount}/{DAILY_CHECKIN_LIMIT} check-ins used today</Text>
                    )}
                    <TouchableOpacity
                      style={[checkIn.submitBtn, (!typedText.trim() || isProcessing || isAtLimit) && checkIn.submitBtnDisabled]}
                      onPress={handleTextSubmit}
                      disabled={!typedText.trim() || isProcessing || isAtLimit}
                      activeOpacity={0.85}
                    >
                      <Text style={checkIn.submitBtnText}>
                        {isProcessing ? 'Processing…' : 'Submit'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {!!transcription && (
              <View style={checkIn.transcriptionCard}>
                <Text style={checkIn.transcriptionText}>{transcription}</Text>
              </View>
            )}

            {isClaudeLoading && (
              <View style={checkIn.responseCard}>
                <Text style={checkIn.claudeThinking}>Know Better is thinking…</Text>
              </View>
            )}

            {!!claudeResponse && !isClaudeLoading && (
              <>
                <View style={[
                  checkIn.responseCard,
                  !alertAcknowledged && activeAlertLevel != null && ALERT_BANNER_CONFIG[activeAlertLevel] && {
                    borderLeftWidth: 4,
                    borderLeftColor: ALERT_BANNER_CONFIG[activeAlertLevel].color,
                    backgroundColor: ALERT_BANNER_CONFIG[activeAlertLevel].bg,
                  },
                  alertAcknowledged && { backgroundColor: '#F3F4F6', borderLeftWidth: 4, borderLeftColor: '#E5E7EB' },
                ]}>
                  {activeAlertLevel != null && ALERT_BANNER_CONFIG[activeAlertLevel] && (
                    <>
                      <Text style={[checkIn.alertLabel, { color: alertAcknowledged ? '#9CA3AF' : ALERT_BANNER_CONFIG[activeAlertLevel].color }]}>
                        {ALERT_BANNER_CONFIG[activeAlertLevel].text}
                      </Text>
                      {!alertAcknowledged ? (
                        <TouchableOpacity style={checkIn.acknowledgeBtn} onPress={acknowledgeAlert} activeOpacity={0.85}>
                          <Text style={checkIn.acknowledgeBtnText}>Acknowledge</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <Text style={checkIn.acknowledgedText}>Acknowledged — pending vet update</Text>
                          {(activeAlertLevel === 2 || activeAlertLevel === 3) && (
                            <TouchableOpacity style={checkIn.acknowledgeBtn} onPress={() => setShowVetUpdateModal(true)} activeOpacity={0.85}>
                              <Text style={checkIn.acknowledgeBtnText}>Log Vet Update</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </>
                  )}
                  <Text style={checkIn.claudeText}>{claudeResponse}</Text>
                </View>

                <View style={checkIn.actionRow}>
                  <TouchableOpacity
                    style={[checkIn.actionBtn, checkIn.actionPrimary]}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Report', { dogId: currentDogId, dogName })}
                  >
                    <Text style={checkIn.actionPrimaryText}>View vet report</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
      </ScrollView>
      </KeyboardAvoidingView>

      <BurgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        navigation={navigation}
        dogName={dogName}
        dogId={currentDogId}
      />

      {vetSuccessToast && (
        <View style={checkIn.successToast}>
          <Text style={checkIn.successToastText}>Vet update saved</Text>
        </View>
      )}

      <Modal visible={showVetUpdateModal} transparent animationType="slide" onRequestClose={() => setShowVetUpdateModal(false)}>
        <View style={checkIn.vetModalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowVetUpdateModal(false)} activeOpacity={1} />
          <KeyboardAvoidingView behavior="padding" enabled>
            <View style={checkIn.vetModalSheet}>
              <Text style={checkIn.vetModalHeader}>Vet Update</Text>

              <Text style={checkIn.vetFieldLabel}>Visit date</Text>
              <TextInput
                style={checkIn.vetInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={vetVisitDate}
                onChangeText={setVetVisitDate}
              />

              <Text style={checkIn.vetFieldLabel}>Vet feedback</Text>
              <TextInput
                style={[checkIn.vetInput, checkIn.vetInputMulti]}
                placeholder="What did the vet say?"
                placeholderTextColor="#9CA3AF"
                value={vetFeedback}
                onChangeText={setVetFeedback}
                multiline
                maxLength={500}
              />

              <Text style={checkIn.vetFieldLabel}>Treatment given</Text>
              <TextInput
                style={[checkIn.vetInput, checkIn.vetInputMulti]}
                placeholder="Any treatments or medications?"
                placeholderTextColor="#9CA3AF"
                value={treatmentGiven}
                onChangeText={setTreatmentGiven}
                multiline
                maxLength={500}
              />

              <Text style={checkIn.vetFieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[checkIn.vetInput, checkIn.vetInputMulti]}
                placeholder="Anything else to note"
                placeholderTextColor="#9CA3AF"
                value={vetNotes}
                onChangeText={setVetNotes}
                multiline
              />

              <TouchableOpacity
                style={checkIn.vetSubmitBtn}
                onPress={submitVetUpdate}
                disabled={isSubmittingVetUpdate}
                activeOpacity={0.85}
              >
                <Text style={checkIn.vetSubmitBtnText}>{isSubmittingVetUpdate ? 'Saving…' : 'Save vet update'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={checkIn.vetCancelBtn}
                onPress={() => setShowVetUpdateModal(false)}
                activeOpacity={0.85}
              >
                <Text style={checkIn.vetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Vet Report ──────────────────────────────────────────────────────────────

const ALERT_LEVEL_NUM = { level_1: 1, level_2: 2, level_3: 3 };

const SIGNAL_LABELS = {
  appetite: 'Appetite',
  energy: 'Energy',
  elimination: 'Elimination',
  water_intake: 'Water',
  demeanor: 'Demeanor',
  vomiting: 'Vomiting',
};

const SIGNAL_ICONS = {
  appetite: 'food-drumstick-outline',
  energy: 'lightning-bolt-outline',
  elimination: 'toilet',
  water_intake: 'cup-water',
  demeanor: 'emoticon-outline',
  vomiting: 'emoticon-sick-outline',
};

const STATUS_HERO_CONFIG = {
  all_clear:     { bg: '#059669', label: "Doing well",                 text: (n) => `${n || 'Your dog'}'s doing well` },
  mostly_normal: { bg: '#D97706', label: 'Worth checking up on',       text: () => 'Worth checking up on' },
  patterns_noted:{ bg: '#EA580C', label: 'Worth mentioning to your vet', text: () => 'Worth mentioning to your vet' },
  alert_fired:   { bg: '#DC2626', label: 'Contact your vet today',     text: () => 'Contact your vet today' },
};

const ALERT_CARD_COLORS = {
  1: { border: '#D97706', bg: '#FFFBEB', name: 'Level 1 — Pattern noticed' },
  2: { border: '#EA580C', bg: '#FFF7ED', name: 'Level 2 — Worth mentioning to your vet' },
  3: { border: '#DC2626', bg: '#FEE2E2', name: 'Level 3 — Contact your vet today' },
};

const DOT_SIZE = 30;

const DAY_DOT_COLORS = { 1: '#D97706', 2: '#EA580C', 3: '#DC2626' };

const getDayDotStyle = (day) => {
  switch (day.status) {
    case 'normal':       return { backgroundColor: '#059669' };
    case 'concerning':   return { backgroundColor: '#D97706' };
    case 'alert':        return { backgroundColor: DAY_DOT_COLORS[day.alert_level] ?? '#EA580C' };
    case 'health_event': return { backgroundColor: '#9CA3AF' };
    default:             return { backgroundColor: '#E5E7EB' };
  }
};

// Chunks days into 7-day weeks anchored to the end of the period, so the
// most recent week is always full and any partial week falls at the start.
const chunkIntoWeeks = (days) => {
  const weeks = [];
  let end = days.length;
  while (end > 0) {
    const start = Math.max(0, end - 7);
    weeks.unshift(days.slice(start, end));
    end = start;
  }
  return weeks;
};

const CAPTION_BY_STATUS = {
  all_clear: (name, normalDays, totalDays) =>
    `I've been keeping an eye on ${name}, and the last ${totalDays} days have been steady and normal.`,
  mostly_normal: (name, normalDays, totalDays) =>
    `${name} has mostly been doing well this period, with just a day or two that seemed a little off.`,
  patterns_noted: (name, normalDays, totalDays) =>
    `I've noticed a pattern with ${name} worth mentioning to your vet at your next visit.`,
  alert_fired: (name, normalDays, totalDays) =>
    `I reached out during this period because something about ${name} seemed worth your vet's attention.`,
};

const buildCaption = (overallStatus, dogName, normalDayCount, totalDays) => {
  const name = dogName || 'your dog';
  const fn = CAPTION_BY_STATUS[overallStatus] ?? CAPTION_BY_STATUS.all_clear;
  return fn(name, normalDayCount, totalDays);
};

const formatShortDate = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const describeSignalsPlainly = (signals) => {
  if (!signals) return null;
  const parts = [];
  for (const dim of SIGNAL_DIMS) {
    const val = signals[dim];
    if (!val || val === 'null' || val === 'normal' || val === 'none') continue;
    parts.push(`${SIGNAL_LABELS[dim]} was ${val}.`);
  }
  return parts.length > 0 ? parts.join(' ') : null;
};

const describeDayPlainly = (day) => {
  if (day.status === 'none') return 'No check-in this day.';
  const parts = [];
  if (day.health_event_title) parts.push(`Health event: ${day.health_event_title}.`);
  if (day.status === 'alert' && day.alert_reason) parts.push(day.alert_reason);
  const signalText = describeSignalsPlainly(day.signals);
  if (signalText) parts.push(signalText);
  if (parts.length === 0) parts.push('Normal day — no concerns noted.');
  return parts.join(' ');
};

const generateVetReport = async (dogId, periodDays = 30) => {
  const periodStartDate = new Date(Date.now() - (periodDays - 1) * 24 * 60 * 60 * 1000);
  const period_start = periodStartDate.toISOString().split('T')[0];
  const period_end = new Date().toISOString().split('T')[0];
  const sinceIso = `${period_start}T00:00:00.000Z`;
  const dayKey = (iso) => iso.split('T')[0];

  const [checkInsRes, signalsRes, alertsRes, healthEventsRes] = await Promise.all([
    supabase.from('check_ins').select('check_in_id, input_classification, check_in_text, created_at').eq('dog_id', dogId).gte('created_at', sinceIso).order('created_at', { ascending: true }),
    supabase.from('signals').select('appetite, energy, water_intake, demeanor, vomiting, elimination, created_at').eq('dog_id', dogId).gte('created_at', sinceIso),
    supabase.from('alerts').select('alert_level, alert_trigger_reason, alert_status, created_at').eq('dog_id', dogId).gte('created_at', sinceIso).order('created_at', { ascending: true }),
    supabase.from('health_events').select('event_title, event_type, event_date').eq('dog_id', dogId).gte('event_date', period_start).order('event_date', { ascending: true }),
  ]);

  const checkIns = checkInsRes.data ?? [];
  const signalRows = signalsRes.data ?? [];
  const alertRows = alertsRes.data ?? [];
  const healthEventRows = healthEventsRes.data ?? [];

  const groupByDay = (rows, dateField) => {
    const map = {};
    for (const row of rows) {
      const day = dateField === 'event_date' ? row.event_date : dayKey(row.created_at);
      if (!map[day]) map[day] = [];
      map[day].push(row);
    }
    return map;
  };
  const checkInsByDay = groupByDay(checkIns, 'created_at');
  const signalsByDay = groupByDay(signalRows, 'created_at');
  const alertsByDay = groupByDay(alertRows, 'created_at');
  const healthEventsByDay = groupByDay(healthEventRows, 'event_date');

  const days = [];
  const signal_concerning_counts = { appetite: 0, energy: 0, water_intake: 0, demeanor: 0, vomiting: 0, elimination: 0 };
  let normal_day_count = 0;
  let concerning_day_count = 0;

  for (let i = 0; i < periodDays; i++) {
    const day = new Date(periodStartDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayCheckIns = checkInsByDay[day] ?? [];
    const dayAlerts = alertsByDay[day] ?? [];
    const dayHealthEvents = healthEventsByDay[day] ?? [];
    const daySignalRows = signalsByDay[day] ?? [];

    const isConcerning = dayCheckIns.some(c => c.input_classification === 'concerning' || c.input_classification === 'health_event');
    const hasCheckIn = dayCheckIns.length > 0;

    let status;
    if (dayAlerts.length > 0) status = 'alert';
    else if (isConcerning) status = 'concerning';
    else if (dayHealthEvents.length > 0) status = 'health_event';
    else if (hasCheckIn) status = 'normal';
    else status = 'none';

    if (status === 'normal') normal_day_count++;
    if (status === 'concerning' || status === 'alert') concerning_day_count++;

    const daySignals = {};
    for (const dim of SIGNAL_DIMS) {
      const values = daySignalRows.map(r => r[dim]).filter(v => v != null && v !== 'null');
      daySignals[dim] = values.length > 0 ? values[values.length - 1] : null;
      if (isLowSignal(dim, values)) signal_concerning_counts[dim]++;
    }

    days.push({
      date: day,
      status,
      signals: daySignalRows.length > 0 ? daySignals : null,
      alert_level: dayAlerts[0] ? (ALERT_LEVEL_NUM[dayAlerts[0].alert_level] ?? 1) : null,
      alert_reason: dayAlerts[0]?.alert_trigger_reason ?? null,
      health_event_title: dayHealthEvents[0]?.event_title ?? null,
      check_in_text: dayCheckIns[dayCheckIns.length - 1]?.check_in_text ?? null,
    });
  }

  const alerts = alertRows.map(a => ({
    date: dayKey(a.created_at),
    level: ALERT_LEVEL_NUM[a.alert_level] ?? 1,
    reason: a.alert_trigger_reason,
    status: a.alert_status,
  }));
  const health_events = healthEventRows.map(h => ({
    date: h.event_date,
    title: h.event_title,
    type: h.event_type,
  }));

  const hasActiveAlert = alerts.some(a => a.status === 'active');
  const nonAlertConcerningCount = days.filter(d => d.status === 'concerning').length;
  let overall_status;
  if (hasActiveAlert) overall_status = 'alert_fired';
  else if (alerts.length > 0) overall_status = 'all_clear';
  else if (nonAlertConcerningCount >= 3 || health_events.length > 0) overall_status = 'patterns_noted';
  else if (nonAlertConcerningCount >= 1) overall_status = 'mostly_normal';
  else overall_status = 'all_clear';

  const summary_data = {
    period_start,
    period_end,
    total_days: periodDays,
    normal_day_count,
    concerning_day_count,
    days,
    signal_concerning_counts,
    alerts,
    health_events,
  };

  const { data: inserted, error } = await supabase
    .from('vet_reports')
    .insert({ dog_id: dogId, period_start, period_end, overall_status, summary_data })
    .select('report_id, dog_id, period_start, period_end, overall_status, summary_data, generated_at')
    .single();
  if (error) {
    console.log('[VetReport] insert error:', error);
    return { report_id: null, dog_id: dogId, period_start, period_end, overall_status, summary_data, generated_at: new Date().toISOString() };
  }
  console.log('[VetReport] generated and saved — overall_status:', overall_status);
  return inserted;
};

function ReportScreen({ navigation, route }) {
  const { dogId: paramDogId, dogName: paramDogName, reportId } = route.params ?? {};
  const [dogId, setDogId] = useState(paramDogId ?? null);
  const [dogName, setDogName] = useState(paramDogName ?? '');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekIndex, setWeekIndex] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{ paddingRight: 16 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0F6E56" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        setIsLoading(true);
        setReport(null);
        setSelectedDay(null);
        setWeekIndex(null);
        let resolvedDogId = paramDogId ?? null;
        if (!resolvedDogId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: dogResult } = await supabase.from('dogs').select('dog_id, dog_name').eq('owner_id', session.user.id).limit(1).single();
            resolvedDogId = dogResult?.dog_id ?? null;
            if (!cancelled) { setDogId(resolvedDogId); if (dogResult?.dog_name) setDogName(dogResult.dog_name); }
          }
        }
        if (!resolvedDogId) { if (!cancelled) setIsLoading(false); return; }

        if (reportId) {
          const { data, error } = await supabase
            .from('vet_reports')
            .select('report_id, dog_id, period_start, period_end, overall_status, summary_data, generated_at')
            .eq('report_id', reportId)
            .single();
          if (error) console.log('[Report] load error:', error);
          if (!cancelled) setReport(data ?? null);
        } else {
          const generated = await generateVetReport(resolvedDogId, 30);
          if (!cancelled) setReport(generated);
        }
        if (!cancelled) setIsLoading(false);
      };
      load();
      return () => { cancelled = true; };
    }, [reportId, paramDogId])
  );

  if (isLoading) {
    return (
      <View style={report_.loadingContainer}>
        <Text style={report_.loadingText}>Building report…</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={report_.loadingContainer}>
        <Text style={report_.loadingText}>No report available yet.</Text>
      </View>
    );
  }

  const { summary_data, overall_status: savedStatus } = report;
  const hasActiveAlert = summary_data.alerts.some(a => a.status === 'active');
  const overall_status = (savedStatus === 'alert_fired' || savedStatus === 'patterns_noted' || savedStatus === 'mostly_normal') && !hasActiveAlert && summary_data.alerts.length > 0
    ? 'all_clear'
    : savedStatus;
  const hero = STATUS_HERO_CONFIG[overall_status] ?? STATUS_HERO_CONFIG.all_clear;

  const weeks = chunkIntoWeeks(summary_data.days);
  const activeWeekIndex = weekIndex === null ? weeks.length - 1 : weekIndex;
  const currentWeek = weeks[activeWeekIndex] ?? [];
  const weekRangeLabel = currentWeek.length > 0
    ? `${formatShortDate(currentWeek[0].date)} – ${formatShortDate(currentWeek[currentWeek.length - 1].date)}`
    : '';
  const goToPrevWeek = () => setWeekIndex(Math.max(0, activeWeekIndex - 1));
  const goToNextWeek = () => setWeekIndex(Math.min(weeks.length - 1, activeWeekIndex + 1));

  return (
    <ScrollView style={report_.container} contentContainerStyle={report_.content}>

      {/* 1 — Status Hero */}
      {summary_data.alerts.length > 0 && !hasActiveAlert ? (
        <View style={report_.resolvedBanner}>
          <Text style={report_.resolvedBannerText}>
            Sounds like {dogName || 'your dog'} is in good hands. We're here if anything changes.
          </Text>
        </View>
      ) : (
        <View style={[report_.heroCard, { backgroundColor: hero.bg }]}>
          <Text style={report_.heroText}>{hero.text(dogName)}</Text>
        </View>
      )}

      {/* 2 — Day Count */}
      <View style={report_.card}>
        <Text style={report_.dayNum}>{summary_data.normal_day_count}</Text>
        <Text style={report_.daySubtitle}>of {summary_data.total_days} normal days</Text>
        <Text style={report_.dayHelper}>Last 7 days used to calculate baseline</Text>
      </View>

      {/* 3 — Week Carousel */}
      <View style={report_.card}>
        <Text style={report_.weekRangeLabel}>{weekRangeLabel}</Text>
        <View style={report_.weekRow}>
          <TouchableOpacity
            onPress={goToPrevWeek}
            disabled={activeWeekIndex === 0}
            activeOpacity={0.6}
            style={report_.weekArrow}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={activeWeekIndex === 0 ? '#E5E7EB' : '#0F6E56'} />
          </TouchableOpacity>
          <View style={report_.dotsRow}>
            {currentWeek.map((day) => (
              <TouchableOpacity
                key={day.date}
                style={[report_.dot, getDayDotStyle(day)]}
                activeOpacity={0.7}
                onPress={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={goToNextWeek}
            disabled={activeWeekIndex === weeks.length - 1}
            activeOpacity={0.6}
            style={report_.weekArrow}
          >
            <MaterialCommunityIcons name="chevron-right" size={26} color={activeWeekIndex === weeks.length - 1 ? '#E5E7EB' : '#0F6E56'} />
          </TouchableOpacity>
        </View>
        <Text style={report_.weekPageIndicator}>Week {activeWeekIndex + 1} of {weeks.length}</Text>

        {selectedDay && (
          <View style={report_.popover}>
            <View style={report_.popoverHeader}>
              <Text style={report_.popoverDate}>{formatShortDate(selectedDay.date)}</Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)} activeOpacity={0.6}>
                <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={report_.popoverText}>{describeDayPlainly(selectedDay)}</Text>
          </View>
        )}
      </View>

      {/* 4 — Signal Grid */}
      <View style={report_.card}>
        <Text style={report_.cardSectionTitle}>Health signals</Text>
        <View style={report_.signalGrid}>
          {SIGNAL_DIMS.map((dim) => {
            const count = summary_data.signal_concerning_counts[dim] ?? 0;
            return (
              <View key={dim} style={report_.signalTile}>
                <MaterialCommunityIcons name={SIGNAL_ICONS[dim]} size={26} color="#1F2937" />
                <Text style={report_.signalLabel}>{SIGNAL_LABELS[dim]}</Text>
                {count > 0 && (
                  <View style={report_.signalBadge}>
                    <Text style={report_.signalBadgeText}>{count} {count === 1 ? 'day' : 'days'}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* 5 — Alert History */}
      {summary_data.alerts.length > 0 && (
        <View style={report_.alertStack}>
          {summary_data.alerts.slice().reverse().map((a, i) => {
            const isResolved = a.status === 'resolved';
            const lc = ALERT_CARD_COLORS[a.level] ?? ALERT_CARD_COLORS[1];
            if (isResolved) {
              return (
                <View key={i} style={[report_.alertCard, { borderLeftColor: '#059669', backgroundColor: '#ECFDF5' }]}>
                  <Text style={report_.alertDate}>{formatShortDate(a.date)}</Text>
                  <Text style={[report_.alertLevel, { color: '#059669' }]}>Vet update logged</Text>
                  <Text style={report_.alertReason}>Follow up as needed.</Text>
                </View>
              );
            }
            return (
              <View key={i} style={[report_.alertCard, { borderLeftColor: lc.border, backgroundColor: lc.bg }]}>
                <Text style={report_.alertDate}>{formatShortDate(a.date)}</Text>
                <Text style={report_.alertLevel}>{lc.name}</Text>
                {a.reason ? <Text style={report_.alertReason}>{a.reason}</Text> : null}
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('ReportHistory', { dogId, dogName })}
        activeOpacity={0.7}
        style={report_.historyLinkWrap}
      >
        <Text style={report_.historyLink}>View past reports →</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function ReportHistoryScreen({ navigation, route }) {
  const { dogId: paramDogId, dogName } = route.params ?? {};
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsMenuOpen(true)} activeOpacity={0.7} style={{ paddingLeft: 8 }}>
          <MaterialCommunityIcons name="menu" size={26} color="#0F6E56" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const load = async () => {
      let dogId = paramDogId ?? null;
      if (!dogId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: dogResult } = await supabase.from('dogs').select('dog_id').eq('owner_id', session.user.id).limit(1).single();
          dogId = dogResult?.dog_id ?? null;
        }
      }
      if (!dogId) { setIsLoading(false); return; }
      const { data, error } = await supabase
        .from('vet_reports')
        .select('report_id, period_start, period_end, overall_status, generated_at')
        .eq('dog_id', dogId)
        .order('generated_at', { ascending: false });
      if (error) console.log('[ReportHistory] query error:', error);
      setReports(data ?? []);
      setIsLoading(false);
    };
    load();
  }, []);

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={reportHistory.container} contentContainerStyle={reportHistory.content}>
      <Text style={reportHistory.title}>Report history</Text>
      {isLoading && <Text style={reportHistory.empty}>Loading…</Text>}
      {!isLoading && reports.length === 0 && <Text style={reportHistory.empty}>No reports yet.</Text>}
      {reports.map((r) => {
        const hero = STATUS_HERO_CONFIG[r.overall_status] ?? STATUS_HERO_CONFIG.all_clear;
        return (
          <TouchableOpacity
            key={r.report_id}
            style={reportHistory.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Report', { reportId: r.report_id, dogId: paramDogId, dogName })}
          >
            <View style={[reportHistory.dot, { backgroundColor: hero.bg }]} />
            <View style={{ flex: 1 }}>
              <Text style={reportHistory.rowDate}>{formatShortDate(r.period_start)} – {formatShortDate(r.period_end)}</Text>
              <Text style={reportHistory.rowStatus}>{hero.label}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
    <BurgerMenu
      isOpen={isMenuOpen}
      onClose={() => setIsMenuOpen(false)}
      navigation={navigation}
      dogName={dogName}
    />
    </View>
  );
}

// ─── Screen: Check-in History ────────────────────────────────────────────────

const HISTORY_PAGE_SIZE = 30;

const ALERT_BADGE_COLORS = {
  1: { bg: '#FFFBEB', text: '#D97706' },
  2: { bg: '#FFF7ED', text: '#EA580C' },
  3: { bg: '#FEE2E2', text: '#DC2626' },
};

const ALERT_BADGE_LABELS = { 1: 'Level 1', 2: 'Level 2', 3: 'Level 3' };

const formatCheckInDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

function CheckInHistoryScreen({ navigation, route }) {
  const { dogId: paramDogId, dogName } = route.params ?? {};
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const offsetRef = useRef(0);
  const dogIdsRef = useRef([]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => setIsMenuOpen(true)} activeOpacity={0.7} style={{ paddingRight: 8 }}>
          <MaterialCommunityIcons name="menu" size={26} color="#0F6E56" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const init = async () => {
      let dogIds = [];
      if (paramDogId) {
        dogIds = [paramDogId];
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: dogs } = await supabase.from('dogs').select('dog_id').eq('owner_id', session.user.id);
          dogIds = (dogs ?? []).map(d => d.dog_id);
        }
      }
      dogIdsRef.current = dogIds;
      if (dogIds.length > 0) await fetchPage(dogIds, 0, true);
      setIsLoading(false);
    };
    init();
  }, []);

  const fetchPage = async (dogIds, offset, initial = false) => {
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        check_in_id,
        check_in_text,
        input_classification,
        created_at,
        dogs(dog_name),
        responses(response_text),
        alerts(alert_level)
      `)
      .in('dog_id', dogIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + HISTORY_PAGE_SIZE - 1);
    if (error) { console.log('[CheckInHistory] error:', error); return; }
    const rows = data ?? [];
    setItems(prev => initial ? rows : [...prev, ...rows]);
    setHasMore(rows.length === HISTORY_PAGE_SIZE);
    offsetRef.current = offset + rows.length;
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchPage(dogIdsRef.current, offsetRef.current);
    setIsLoadingMore(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.color.offWhite }}>
      <ScrollView contentContainerStyle={ciHistory.content}>
        {isLoading && <Text style={ciHistory.empty}>Loading…</Text>}
        {!isLoading && items.length === 0 && <Text style={ciHistory.empty}>No check-ins yet.</Text>}
        {items.map((item) => {
          const responseText = item.responses?.[0]?.response_text ?? null;
          const alertLevel = item.alerts?.[0]?.alert_level ?? null;
          const summary = responseText
            ? responseText.substring(0, 50) + (responseText.length > 50 ? '…' : '')
            : (item.check_in_text?.substring(0, 50) ?? '');
          const badge = alertLevel ? ALERT_BADGE_COLORS[alertLevel] : null;
          return (
            <TouchableOpacity
              key={item.check_in_id}
              style={ciHistory.row}
              activeOpacity={0.7}
              onPress={() => setSelectedItem(item)}
            >
              <View style={ciHistory.rowMeta}>
                <Text style={ciHistory.rowDate}>{formatCheckInDate(item.created_at)}</Text>
                {item.dogs?.dog_name ? <Text style={ciHistory.rowDog}>{item.dogs.dog_name}</Text> : null}
              </View>
              <View style={ciHistory.rowBottom}>
                <Text style={ciHistory.rowSummary} numberOfLines={2}>{summary}</Text>
                {badge && (
                  <View style={[ciHistory.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[ciHistory.badgeText, { color: badge.text }]}>{ALERT_BADGE_LABELS[alertLevel]}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        {hasMore && !isLoading && (
          <TouchableOpacity onPress={loadMore} style={ciHistory.loadMore} activeOpacity={0.7} disabled={isLoadingMore}>
            <Text style={ciHistory.loadMoreText}>{isLoadingMore ? 'Loading…' : 'Load more'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {selectedItem && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
          <View style={ciHistory.modalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSelectedItem(null)} />
            <View style={ciHistory.modalSheet}>
              <View style={ciHistory.modalHeader}>
                <View>
                  <Text style={ciHistory.modalDate}>{formatCheckInDate(selectedItem.created_at)}</Text>
                  {selectedItem.dogs?.dog_name ? <Text style={ciHistory.modalDog}>{selectedItem.dogs.dog_name}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => setSelectedItem(null)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="close" size={20} color={T.color.gray600} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
                {selectedItem.check_in_text ? (
                  <>
                    <Text style={ciHistory.modalSectionLabel}>What you said</Text>
                    <Text style={[ciHistory.modalBody, { marginBottom: T.space.sm }]}>{selectedItem.check_in_text}</Text>
                  </>
                ) : null}
                {selectedItem.responses?.[0]?.response_text ? (
                  <>
                    <Text style={ciHistory.modalSectionLabel}>Know Better's response</Text>
                    <Text style={ciHistory.modalBody}>{selectedItem.responses[0].response_text}</Text>
                  </>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <BurgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        navigation={navigation}
        dogName={dogName}
        dogId={paramDogId}
      />
    </View>
  );
}

// ─── Screen: Alerts History ──────────────────────────────────────────────────

const ALERT_TABS = [
  { key: 'active',       label: 'Active' },
  { key: 'acknowledged', label: 'Pending' },
  { key: 'resolved',     label: 'Resolved' },
  { key: 'expired',      label: 'Expired' },
];

const LEVEL_BADGE = {
  1: { label: 'Level 1', color: T.color.amber },
  2: { label: 'Level 2', color: T.color.orange },
  3: { label: 'Level 3', color: T.color.red },
};

function AlertsHistoryScreen({ navigation, route }) {
  const { dogId: paramDogId, dogName: paramDogName } = route.params ?? {};
  const [dogId, setDogId] = useState(paramDogId ?? null);
  const [dogName, setDogName] = useState(paramDogName ?? '');
  const [activeTab, setActiveTab] = useState('active');
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAckModal, setShowAckModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const [showVetModal, setShowVetModal] = useState(false);
  const [vetVisitDate, setVetVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vetFeedback, setVetFeedback] = useState('');
  const [treatmentGiven, setTreatmentGiven] = useState('');
  const [vetNotes, setVetNotes] = useState('');
  const [isSubmittingVet, setIsSubmittingVet] = useState(false);

  const [expandedAlertId, setExpandedAlertId] = useState(null);

  const loadAlerts = useCallback(async (resolvedDogId) => {
    const { data } = await supabase
      .from('alerts')
      .select(`
        alert_id,
        alert_level,
        alert_status,
        alert_trigger_reason,
        created_at,
        acknowledged_at,
        vet_update_logged_at,
        vet_updates(vet_visit_date, vet_feedback, treatment_given, notes)
      `)
      .eq('dog_id', resolvedDogId)
      .order('created_at', { ascending: false });
    setAlerts(data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const init = async () => {
        setIsLoading(true);
        let resolvedDogId = paramDogId ?? null;
        if (!resolvedDogId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: dogResult } = await supabase.from('dogs').select('dog_id, dog_name').eq('owner_id', session.user.id).limit(1).single();
            resolvedDogId = dogResult?.dog_id ?? null;
            if (!cancelled) {
              setDogId(resolvedDogId);
              if (dogResult?.dog_name) setDogName(dogResult.dog_name);
            }
          }
        }
        if (!resolvedDogId) { if (!cancelled) setIsLoading(false); return; }
        if (!cancelled) { await loadAlerts(resolvedDogId); setIsLoading(false); }
      };
      init();
      return () => { cancelled = true; };
    }, [paramDogId, loadAlerts])
  );

  const daysAgo = (isoDate) => {
    const days = Math.floor((Date.now() - new Date(isoDate)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const daysUntilExpiry = (acknowledgedAt, alertLevel) => {
    const expiryDays = alertLevel === 'level_3' ? 3 : 7;
    const elapsed = (Date.now() - new Date(acknowledgedAt)) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(expiryDays - elapsed));
  };

  const resetBaselineForDog = async (id) => {
    await supabase.from('baselines').update({
      baseline_active: false,
      consecutive_concerning_days: 0,
      consecutive_combination_days: 0,
      concerning_rate: 0,
      low_signal_count_today: 0,
    }).eq('dog_id', id);
  };

  const handleAcknowledge = async () => {
    if (!selectedAlert || !dogId) return;
    setIsAcknowledging(true);
    const isLevel1 = (ALERT_LEVEL_NUM[selectedAlert.alert_level] ?? 1) === 1;
    await supabase.from('alerts').update({
      alert_status: isLevel1 ? 'resolved' : 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    }).eq('alert_id', selectedAlert.alert_id);
    if (isLevel1) {
      await resetBaselineForDog(dogId);
    }
    setIsAcknowledging(false);
    setShowAckModal(false);
    setSelectedAlert(null);
    await loadAlerts(dogId);
  };

  const handleSubmitVetUpdate = async () => {
    if (!selectedAlert || !dogId) return;
    setIsSubmittingVet(true);
    try {
      await supabase.from('vet_updates').insert({
        alert_id: selectedAlert.alert_id,
        dog_id: dogId,
        vet_visit_date: vetVisitDate || null,
        vet_feedback: vetFeedback || null,
        treatment_given: treatmentGiven || null,
        notes: vetNotes || null,
      });
      await supabase.from('alerts').update({
        alert_status: 'resolved',
        vet_update_logged_at: new Date().toISOString(),
      }).eq('alert_id', selectedAlert.alert_id);
      await resetBaselineForDog(dogId);
      setShowVetModal(false);
      setSelectedAlert(null);
      setVetVisitDate('');
      setVetFeedback('');
      setTreatmentGiven('');
      setVetNotes('');
      await loadAlerts(dogId);
    } catch (err) {
      console.log('[AlertsHistory] vet update error:', err);
    } finally {
      setIsSubmittingVet(false);
    }
  };

  const filtered = alerts.filter(a => a.alert_status === activeTab);

  const renderCard = (a) => {
    const levelNum = ALERT_LEVEL_NUM[a.alert_level] ?? 1;
    const badge = LEVEL_BADGE[levelNum];
    const vetUpdate = a.vet_updates?.[0] ?? null;
    const isExpanded = expandedAlertId === a.alert_id;

    if (a.alert_status === 'active') {
      return (
        <View key={a.alert_id} style={ah.card}>
          <View style={[ah.badge, { backgroundColor: badge.color }]}>
            <Text style={ah.badgeText}>{badge.label}</Text>
          </View>
          <Text style={ah.alertMsg}>{a.alert_trigger_reason}</Text>
          <Text style={ah.meta}>Triggered {daysAgo(a.created_at)}</Text>
          <TouchableOpacity
            style={ah.actionBtn}
            activeOpacity={0.85}
            onPress={() => { setSelectedAlert(a); setShowAckModal(true); }}
          >
            <Text style={ah.actionBtnText}>Acknowledge</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (a.alert_status === 'acknowledged') {
      const remaining = daysUntilExpiry(a.acknowledged_at, a.alert_level);
      const showExpiry = levelNum >= 2 && remaining <= 2;
      return (
        <View key={a.alert_id} style={ah.card}>
          <View style={[ah.badge, { backgroundColor: T.color.gray600 }]}>
            <Text style={ah.badgeText}>Pending</Text>
          </View>
          <Text style={ah.alertMsg}>{a.alert_trigger_reason}</Text>
          <Text style={ah.meta}>Acknowledged {daysAgo(a.acknowledged_at)}</Text>
          {showExpiry && (
            <Text style={[ah.meta, { color: T.color.orange }]}>
              Expires in {remaining} {remaining === 1 ? 'day' : 'days'}
            </Text>
          )}
          <TouchableOpacity
            style={ah.actionBtn}
            activeOpacity={0.85}
            onPress={() => { setSelectedAlert(a); setShowVetModal(true); }}
          >
            <Text style={ah.actionBtnText}>Log Vet Update</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (a.alert_status === 'resolved') {
      return (
        <View key={a.alert_id} style={[ah.card, ah.cardResolved]}>
          <View style={[ah.badge, { backgroundColor: T.color.green }]}>
            <Text style={ah.badgeText}>Resolved</Text>
          </View>
          <Text style={ah.alertMsg}>{a.alert_trigger_reason}</Text>
          {vetUpdate && (
            <>
              <Text style={[ah.meta, { color: T.color.teal }]}>
                Vet update: {vetUpdate.vet_visit_date ?? daysAgo(a.vet_update_logged_at)}
              </Text>
              {isExpanded ? (
                <>
                  {vetUpdate.vet_feedback ? <Text style={ah.vetDetail}>{vetUpdate.vet_feedback}</Text> : null}
                  {vetUpdate.treatment_given ? <Text style={ah.vetDetail}>Treatment: {vetUpdate.treatment_given}</Text> : null}
                  {vetUpdate.notes ? <Text style={ah.vetDetail}>{vetUpdate.notes}</Text> : null}
                  <TouchableOpacity onPress={() => setExpandedAlertId(null)} activeOpacity={0.7}>
                    <Text style={ah.viewDetails}>Show less</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {vetUpdate.vet_feedback
                    ? <Text style={ah.vetDetail} numberOfLines={2}>{vetUpdate.vet_feedback}</Text>
                    : null}
                  {(vetUpdate.vet_feedback?.length > 100 || vetUpdate.treatment_given || vetUpdate.notes) && (
                    <TouchableOpacity onPress={() => setExpandedAlertId(a.alert_id)} activeOpacity={0.7}>
                      <Text style={ah.viewDetails}>View full details</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}
        </View>
      );
    }

    if (a.alert_status === 'expired') {
      return (
        <View key={a.alert_id} style={ah.card}>
          <View style={[ah.badge, { backgroundColor: '#6B7280' }]}>
            <Text style={ah.badgeText}>Expired</Text>
          </View>
          <Text style={ah.alertMsg}>{a.alert_trigger_reason}</Text>
          <Text style={[ah.meta, { color: T.color.red }]}>Dismissed unresolved</Text>
          <Text style={ah.meta}>Expired {daysAgo(a.created_at)}</Text>
        </View>
      );
    }

    return null;
  };

  const emptyMessages = {
    active:       `No active alerts. ${dogName || 'Your dog'} is doing well!`,
    acknowledged: 'No pending vet updates.',
    resolved:     'No resolved alerts yet.',
    expired:      'No expired alerts.',
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.color.gray100 }}>
      <View style={ah.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={ah.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={T.color.teal} />
        </TouchableOpacity>
        <View>
          <Text style={ah.title}>Alerts</Text>
          <Text style={ah.subtitle}>Active & past alerts for {dogName || 'your dog'}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ah.tabBar} contentContainerStyle={ah.tabBarContent}>
        {ALERT_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[ah.tab, activeTab === t.key && ah.tabActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[ah.tabText, activeTab === t.key && ah.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={ah.center}>
          <Text style={ah.emptyText}>Loading…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={ah.listContent}>
          {filtered.length === 0
            ? <Text style={ah.emptyText}>{emptyMessages[activeTab]}</Text>
            : filtered.map(renderCard)
          }
        </ScrollView>
      )}

      <Modal visible={showAckModal} transparent animationType="fade" onRequestClose={() => setShowAckModal(false)}>
        <View style={ah.modalOverlay}>
          <View style={ah.modalSheet}>
            <Text style={ah.modalTitle}>Acknowledge Alert?</Text>
            <Text style={ah.modalBody}>We'll track this. Let us know when you see your vet.</Text>
            <TouchableOpacity style={ah.modalPrimaryBtn} onPress={handleAcknowledge} disabled={isAcknowledging} activeOpacity={0.85}>
              <Text style={ah.modalPrimaryBtnText}>{isAcknowledging ? 'Acknowledging…' : 'Acknowledge'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ah.modalCancelBtn} onPress={() => { setShowAckModal(false); setSelectedAlert(null); }} activeOpacity={0.85}>
              <Text style={ah.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showVetModal} transparent animationType="slide" onRequestClose={() => setShowVetModal(false)}>
        <View style={ah.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" enabled>
            <View style={ah.modalSheet}>
              <Text style={ah.modalTitle}>
                Vet Update{selectedAlert ? ` — Level ${ALERT_LEVEL_NUM[selectedAlert.alert_level] ?? 1}` : ''}
              </Text>
              <Text style={ah.vetFieldLabel}>Visit date</Text>
              <TextInput style={ah.vetInput} placeholder="YYYY-MM-DD" placeholderTextColor={T.color.gray600} value={vetVisitDate} onChangeText={setVetVisitDate} />
              <Text style={ah.vetFieldLabel}>Vet feedback</Text>
              <TextInput style={[ah.vetInput, ah.vetInputMulti]} placeholder="What did the vet say?" placeholderTextColor={T.color.gray600} value={vetFeedback} onChangeText={setVetFeedback} multiline maxLength={500} />
              <Text style={ah.vetFieldLabel}>Treatment given</Text>
              <TextInput style={[ah.vetInput, ah.vetInputMulti]} placeholder="Any treatments or medications?" placeholderTextColor={T.color.gray600} value={treatmentGiven} onChangeText={setTreatmentGiven} multiline maxLength={500} />
              <Text style={ah.vetFieldLabel}>Notes (optional)</Text>
              <TextInput style={[ah.vetInput, ah.vetInputMulti]} placeholder="Anything else to note" placeholderTextColor={T.color.gray600} value={vetNotes} onChangeText={setVetNotes} multiline />
              <TouchableOpacity style={[ah.modalPrimaryBtn, { marginTop: 16 }]} onPress={handleSubmitVetUpdate} disabled={isSubmittingVet} activeOpacity={0.85}>
                <Text style={ah.modalPrimaryBtnText}>{isSubmittingVet ? 'Saving…' : 'Save vet update'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ah.modalCancelBtn} onPress={() => { setShowVetModal(false); setSelectedAlert(null); setVetVisitDate(''); setVetFeedback(''); setTreatmentGiven(''); setVetNotes(''); }} activeOpacity={0.85}>
                <Text style={ah.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </View>
  );
}

// ─── Screen: Add Dog ─────────────────────────────────────────────────────────

function AddDogScreen({ navigation }) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const [sex, setSex] = useState(null);
  const [age, setAge] = useState(null);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const filteredBreeds = breed.trim()
    ? DOG_BREEDS.filter(b => b.toLowerCase().includes(breed.toLowerCase()))
    : DOG_BREEDS;
  const breedSuggestions = [...SPECIAL_OPTIONS, ...filteredBreeds];

  const canSave = name.trim().length > 0 && breed.trim().length > 0 && sex !== null;

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setLocalPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      const userId = session.user.id;

      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .insert({
          owner_id: userId,
          dog_name: name.trim(),
          breed: breed.trim(),
          sex: sex.toLowerCase(),
          date_of_birth: age ? ageToDOB(age) : null,
        })
        .select('dog_id')
        .single();
      if (dogError) throw dogError;

      const { error: memberError } = await supabase.from('family_members').insert({
        owner_id: userId,
        member_user_id: userId,
        dog_id: dog.dog_id,
        role: 'primary_owner',
        can_log: true,
        can_view: true,
        can_manage: true,
      });
      if (memberError) throw memberError;

      let photoUrl = null;
      if (localPhotoUri) {
        try {
          const res = await fetch(localPhotoUri);
          const blob = await res.blob();
          const mimeType = blob.type || 'image/jpeg';
          const ext = mimeType.includes('png') ? 'png' : 'jpg';
          const path = `${dog.dog_id}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('dog-profiles')
            .upload(path, blob, { contentType: mimeType, upsert: true });
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from('dog-profiles').getPublicUrl(path);
            photoUrl = urlData?.publicUrl ?? null;
            if (photoUrl) {
              await supabase.from('dogs').update({ profile_photo_url: photoUrl }).eq('dog_id', dog.dog_id);
            }
          }
        } catch (photoErr) {
          console.log('[AddDog] photo upload failed (non-fatal):', photoErr);
        }
      }

      navigation.reset({
        index: 0,
        routes: [{
          name: 'CheckIn',
          params: {
            dogId: dog.dog_id,
            dogName: name.trim(),
            dogPhotoUrl: photoUrl ? `${photoUrl}?t=${Date.now()}` : null,
          },
        }],
      });
    } catch (err) {
      console.log('[AddDog] save error:', err);
      setError('Something went wrong. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.color.offWhite }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={addDog.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={addDog.title}>Add a new dog</Text>

        {/* Photo */}
        <TouchableOpacity style={addDog.photoRow} onPress={handlePickPhoto} activeOpacity={0.8}>
          {localPhotoUri ? (
            <Image source={{ uri: localPhotoUri }} style={addDog.photo} />
          ) : (
            <View style={addDog.photoPlaceholder}>
              <MaterialCommunityIcons name="paw" size={28} color={T.color.teal} />
            </View>
          )}
          <View>
            <Text style={addDog.photoLink}>{localPhotoUri ? 'Change photo' : 'Add photo'}</Text>
            <Text style={addDog.photoHint}>Optional</Text>
          </View>
        </TouchableOpacity>

        {/* Name */}
        <View style={addDog.field}>
          <Text style={addDog.label}>Dog's name <Text style={addDog.req}>*</Text></Text>
          <TextInput
            style={addDog.textInput}
            placeholder="Enter your dog's name"
            placeholderTextColor={T.color.gray600}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />
        </View>

        {/* Breed */}
        <View style={addDog.field}>
          <Text style={addDog.label}>Breed <Text style={addDog.req}>*</Text></Text>
          <View style={addDog.inputRow}>
            <TextInput
              style={addDog.inputInner}
              placeholder="Search or select breed"
              placeholderTextColor={T.color.gray600}
              value={breed}
              onChangeText={(text) => { setBreed(text); setShowBreedSuggestions(true); }}
              onFocus={() => setShowBreedSuggestions(true)}
              onBlur={() => setTimeout(() => setShowBreedSuggestions(false), 150)}
              returnKeyType="done"
              onSubmitEditing={() => setShowBreedSuggestions(false)}
            />
            {breed.length > 0 && (
              <TouchableOpacity
                style={addDog.clearBtn}
                onPress={() => { setBreed(''); setShowBreedSuggestions(true); }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close-circle" size={18} color={T.color.gray600} />
              </TouchableOpacity>
            )}
          </View>
          {showBreedSuggestions && (
            <View style={addDog.inlineDropdown}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 200 }}
                nestedScrollEnabled
              >
                {breedSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={item}
                    style={[addDog.dropdownItem, index < SPECIAL_OPTIONS.length && addDog.dropdownSpecial]}
                    onPress={() => { setBreed(item); setShowBreedSuggestions(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[addDog.dropdownText, index < SPECIAL_OPTIONS.length && addDog.dropdownSpecialText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Sex */}
        <View style={addDog.field}>
          <Text style={addDog.label}>Sex <Text style={addDog.req}>*</Text></Text>
          <View style={addDog.segmented}>
            {['Male', 'Female', 'Unknown'].map((opt) => {
              const active = sex === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[addDog.segment, active && addDog.segmentActive]}
                  onPress={() => setSex(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[addDog.segmentText, active && addDog.segmentTextActive]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Age */}
        <View style={addDog.field}>
          <Text style={addDog.label}>Age <Text style={addDog.optional}>(optional)</Text></Text>
          <TouchableOpacity
            style={addDog.ageTrigger}
            onPress={() => setShowAgeDropdown(prev => !prev)}
            activeOpacity={0.8}
          >
            <Text style={[addDog.ageTriggerText, !age && addDog.agePlaceholder]}>
              {age ?? 'Select age'}
            </Text>
            <MaterialCommunityIcons
              name={showAgeDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={T.color.gray600}
            />
          </TouchableOpacity>
          {showAgeDropdown && (
            <View style={addDog.inlineDropdown}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }} nestedScrollEnabled>
                {AGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[addDog.dropdownItem, age === option && addDog.dropdownItemSelected]}
                    onPress={() => { setAge(option); setShowAgeDropdown(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[addDog.dropdownText, age === option && addDog.dropdownTextSelected]}>
                      {option}
                    </Text>
                    {age === option && <MaterialCommunityIcons name="check" size={16} color={T.color.teal} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {error ? <Text style={addDog.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[addDog.saveBtn, { backgroundColor: canSave && !isSaving ? T.color.teal : T.color.gray300 }]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
          activeOpacity={0.85}
        >
          <Text style={addDog.saveBtnText}>{isSaving ? 'Adding…' : 'Add Dog'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={addDog.cancelBtn}>
          <Text style={addDog.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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

        if (event === 'SIGNED_OUT') {
          navigateWhenReady([{ name: 'Welcome' }]);
          return;
        }

        if (event === 'INITIAL_SESSION') {
          if (session) {
            const { data: dogs } = await supabase
              .from('dogs')
              .select('dog_id, dog_name, profile_photo_url')
              .eq('owner_id', session.user.id);

            if (!dogs || dogs.length === 0) return;

            if (dogs.length === 1) {
              navigateWhenReady([{
                name: 'CheckIn',
                params: { dogId: dogs[0].dog_id, dogName: dogs[0].dog_name, dogPhotoUrl: dogs[0].profile_photo_url ?? null },
              }]);
            } else {
              const lastDogId = await AsyncStorage.getItem('last_selected_dog_id');
              const lastDog = lastDogId ? dogs.find(d => d.dog_id === lastDogId) : null;
              if (lastDog) {
                navigateWhenReady([{
                  name: 'CheckIn',
                  params: { dogId: lastDog.dog_id, dogName: lastDog.dog_name, dogPhotoUrl: lastDog.profile_photo_url ?? null },
                }]);
              } else {
                navigateWhenReady([{ name: 'DogSelection' }]);
              }
            }
          }
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          console.log('[DEBUG] SIGNED_IN — querying dogs for owner_id:', session.user.id);
          const { data: dogs } = await supabase
            .from('dogs')
            .select('dog_id, dog_name, profile_photo_url')
            .eq('owner_id', session.user.id);
          console.log('[DEBUG] dogs query result:', JSON.stringify(dogs));

          if (dogs && dogs.length > 0) {
            if (dogs.length === 1) {
              navigateWhenReady([{
                name: 'CheckIn',
                params: { dogId: dogs[0].dog_id, dogName: dogs[0].dog_name, dogPhotoUrl: dogs[0].profile_photo_url ?? null },
              }]);
            } else {
              navigateWhenReady([{ name: 'DogSelection' }]);
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

            navigateWhenReady([{
              name: 'Congratulations',
              params: {
                userName: stored.onboarding_userName ?? 'there',
                dogName: stored.onboarding_dogName ?? 'your dog',
              },
            }]);

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
          headerStyle: { backgroundColor: '#FAFAF9' },
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
        <Stack.Screen name="OtpCode" component={OtpScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Congratulations" component={CongratulationsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DogSelection" component={DogSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ headerTitle: 'Vet Report' }} />
        <Stack.Screen
          name="ReportHistory"
          component={ReportHistoryScreen}
          options={({ navigation }) => ({
            headerTitle: 'Report History',
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#0F6E56" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen name="CheckInHistory" component={CheckInHistoryScreen} options={{ headerTitle: 'Check-in History' }} />
        <Stack.Screen name="AlertsHistory" component={AlertsHistoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddDog" component={AddDogScreen} options={{ headerTitle: 'Add Dog' }} />
        <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Screen: OTP Code Entry ───────────────────────────────────────────────────

function OtpScreen({ navigation, route }) {
  const { email = '', isNewUser = false } = route.params ?? {};
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanResend(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async () => {
    if (code.length !== 8) return;
    setIsVerifying(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setIsVerifying(false);
    if (verifyError) {
      setError('That code is incorrect. Please try again.');
    }
    // Navigation handled by onAuthStateChange SIGNED_IN event
  };

  const handleResend = async () => {
    setIsResending(true);
    setCanResend(false);
    setError('');
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: isNewUser },
    });
    setIsResending(false);
    setTimeout(() => setCanResend(true), 60000);
  };

  const canSubmit = code.length === 8;

  return (
    <KeyboardAvoidingView
      style={otpScreen.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={otpScreen.content}>
        <Text style={otpScreen.emoji}>✉️</Text>

        <Text style={otpScreen.headline}>Check your email.</Text>

        <Text style={otpScreen.subtext}>
          {'We sent an 8-digit code to '}
          <Text style={otpScreen.emailHighlight}>{email}</Text>
          {'. Enter it below.'}
        </Text>

        <TextInput
          style={otpScreen.input}
          value={code}
          onChangeText={(val) => { setCode(val.replace(/[^0-9]/g, '')); setError(''); }}
          keyboardType="number-pad"
          maxLength={8}
          placeholder="00000000"
          placeholderTextColor="#CCCCCC"
          autoFocus
          textAlign="center"
        />

        {error ? <Text style={otpScreen.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[otpScreen.button, { backgroundColor: canSubmit && !isVerifying ? '#0F6E56' : '#E5E7EB' }]}
          activeOpacity={0.85}
          disabled={!canSubmit || isVerifying}
          onPress={handleVerify}
        >
          <Text style={otpScreen.buttonText}>{isVerifying ? 'Verifying…' : 'Verify code'}</Text>
        </TouchableOpacity>

        <View style={otpScreen.links}>
          {canResend && (
            <TouchableOpacity onPress={handleResend} disabled={isResending} activeOpacity={0.7}>
              <Text style={otpScreen.resendLink}>{isResending ? 'Sending…' : 'Resend code'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={otpScreen.backLink}>Wrong email? Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles: Welcome ─────────────────────────────────────────────────────────

const welcome = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  copy: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(245,241,232,0.72)',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F6E56',
  },
  signIn: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.70)',
  },
  signInLink: {
    color: '#F5F1E8',
    textDecorationLine: 'underline',
  },
  wave: {
    position: 'absolute',
    bottom: -40,
    left: -SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 1.2,
    height: 160,
    backgroundColor: '#F5F1E8',
    borderTopLeftRadius: SCREEN_WIDTH,
    borderTopRightRadius: SCREEN_WIDTH,
  },
  videoWrap: {
    width: '90%',
    height: undefined,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginVertical: 24,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
});

// ─── Styles: Dog Name ─────────────────────────────────────────────────────────

const dogName = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 16,
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
    color: '#1F2937',
  },
  step: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FAFAF9',
    minHeight: 44,
  },
  button: {
    backgroundColor: '#0F6E56',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

// ─── Styles: Dog Age ─────────────────────────────────────────────────────────

const dogAge = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
  },
  step: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  question: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '400',
    lineHeight: 24,
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
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAF9',
    minHeight: 44,
  },
  triggerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  triggerPlaceholder: {
    color: '#9CA3AF',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionSelected: {
    backgroundColor: '#F3F4F6',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 15,
    color: '#1F2937',
  },
  optionTextSelected: {
    color: '#0F6E56',
    fontWeight: '600',
  },
  button: {
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

// ─── Styles: OTP Screen ───────────────────────────────────────────────────────

const otpScreen = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    justifyContent: 'center',
    paddingHorizontal: 16,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  emailHighlight: {
    color: '#1F2937',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    backgroundColor: '#FAFAF9',
    width: '100%',
    letterSpacing: 8,
    minHeight: 44,
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  button: {
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
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
    color: '#9CA3AF',
  },
});

// ─── Styles: Account ─────────────────────────────────────────────────────────

const account = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 16,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtext: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
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
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FAFAF9',
    minHeight: 44,
  },
  button: {
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

// ─── Styles: Sign In ─────────────────────────────────────────────────────────

const signIn = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 16,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtext: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
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
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FAFAF9',
    minHeight: 44,
  },
  button: {
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

// ─── Styles: Dog Mood ────────────────────────────────────────────────────────

const dogMood = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 16,
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
    color: '#1F2937',
  },
  step: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  question: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  cards: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF9',
  },
  cardSelected: {
    backgroundColor: '#E1F5EE',
    borderColor: '#0F6E56',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  cardTextSelected: {
    color: '#0F6E56',
    fontWeight: '600',
  },
  button: {
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

// ─── Styles: Dog Health ──────────────────────────────────────────────────────

const dogHealth = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 16,
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
    color: '#1F2937',
  },
  step: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  question: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: '#0F6E56',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FAFAF9',
    minHeight: 110,
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  button: {
    backgroundColor: '#0F6E56',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

// ─── Styles: Dog Breed ────────────────────────────────────────────────────────

const dogBreed = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
  },
  step: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  inputWrapper: {
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    backgroundColor: '#FAFAF9',
    minHeight: 44,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  clearBtn: {
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  specialItem: {
    backgroundColor: '#F3F4F6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 15,
    color: '#1F2937',
  },
  specialText: {
    color: '#0F6E56',
    fontWeight: '500',
  },
  sexGroup: {
    gap: 8,
  },
  sexLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  sexToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  sexOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  sexOptionActive: {
    backgroundColor: '#0F6E56',
  },
  sexText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  sexTextActive: {
    color: '#FFFFFF',
  },
  button: {
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
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
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#085041',
  },
});

// ─── Styles: Check-In ────────────────────────────────────────────────────────

const checkIn = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brand: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F6E56',
    letterSpacing: 0.3,
  },
  dogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 24,
  },
  dogHeaderPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  dogHeaderPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogHeaderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 8,
    width: '100%',
  },
  question: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
    width: '100%',
  },
  micOuter: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F6E56',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F6E56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  micButtonRecording: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  micButtonProcessing: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  micButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  rateCounter: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  rateLimitMsg: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 32,
    marginTop: 4,
  },
  listening: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  permissionError: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  transcriptionCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  alertLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  responseCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  claudeThinking: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  claudeText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  actionPrimary: {
    backgroundColor: '#0F6E56',
  },
  actionSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  actionPrimaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionSecondaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 24,
    width: '100%',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  modeBtnActive: {
    backgroundColor: '#0F6E56',
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  modeBtnActiveText: {
    color: '#FFFFFF',
  },
  typeInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    padding: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  submitBtn: {
    width: '100%',
    minHeight: 44,
    backgroundColor: '#0F6E56',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  acknowledgeBtn: {
    backgroundColor: '#0F6E56',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  acknowledgeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  acknowledgedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 6,
  },
  vetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  vetModalSheet: {
    backgroundColor: '#FAFAF9',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  vetModalHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  vetFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
    marginTop: 12,
  },
  vetInput: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  vetInputMulti: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  vetSubmitBtn: {
    backgroundColor: '#0F6E56',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  vetSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  vetCancelBtn: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  vetCancelBtnText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  successToast: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#0F6E56',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    zIndex: 100,
  },
  successToastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

const report_ = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Hero
  heroCard: {
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resolvedBanner: {
    borderRadius: 8,
    padding: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedBannerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Shared card shell
  card: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },

  // Day count
  dayNum: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -1,
    textAlign: 'center',
  },
  daySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  dayHelper: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },

  // Card section label
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Week carousel
  weekRangeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekArrow: {
    padding: 8,
  },
  dotsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  weekPageIndicator: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },

  // Day popover
  popover: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  popoverDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  popoverText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 19,
  },

  // Signal grid
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  signalTile: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  signalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  signalBadge: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  signalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Alert history
  alertStack: {
    gap: 8,
  },
  alertCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
  },
  alertDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  alertLevel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertReason: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },

  // Footer
  historyLinkWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyLink: {
    fontSize: 14,
    color: '#0F6E56',
    fontWeight: '600',
  },
});

const reportHistory = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  empty: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rowDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  rowStatus: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

const ciHistory = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: T.space.sm,
    paddingBottom: 48,
  },
  empty: {
    fontSize: 14,
    color: T.color.gray600,
    textAlign: 'center',
    marginTop: 24,
  },
  row: {
    backgroundColor: T.color.offWhite,
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.card,
    padding: T.space.sm,
    marginBottom: T.space.xs,
    gap: 4,
  },
  rowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowDate: {
    fontSize: 13,
    color: T.color.gray600,
  },
  rowDog: {
    fontSize: 13,
    color: T.color.gray600,
    fontWeight: '500',
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  rowSummary: {
    flex: 1,
    fontSize: 16,
    color: T.color.charcoal,
    lineHeight: 24,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: T.color.teal,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: T.color.offWhite,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 14,
    color: T.color.gray600,
  },
  modalDog: {
    fontSize: 13,
    color: T.color.gray600,
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: T.color.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalBody: {
    fontSize: 16,
    color: T.color.charcoal,
    lineHeight: 24,
  },
});

const ah = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: T.space.sm,
    paddingBottom: T.space.sm,
    backgroundColor: T.color.offWhite,
    borderBottomWidth: 1,
    borderBottomColor: T.color.gray300,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '600', color: T.color.charcoal },
  subtitle: { fontSize: 12, fontWeight: '500', color: T.color.gray600, marginTop: 2 },
  tabBar: {
    backgroundColor: T.color.gray100,
    borderBottomWidth: 1,
    borderBottomColor: T.color.gray300,
    maxHeight: 48,
  },
  tabBarContent: { paddingHorizontal: T.space.sm },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: T.color.teal },
  tabText: { fontSize: 13, fontWeight: '500', color: T.color.gray600 },
  tabTextActive: { color: T.color.teal },
  listContent: { padding: T.space.sm, paddingBottom: T.space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: T.space.md },
  emptyText: { fontSize: 14, color: T.color.gray600, textAlign: 'center', marginTop: T.space.lg },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.color.gray300,
    padding: T.space.sm,
    marginBottom: T.space.sm,
  },
  cardResolved: { borderLeftWidth: 4, borderLeftColor: T.color.green },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: T.radius.btn,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#FFFFFF' },
  alertMsg: { fontSize: 16, fontWeight: '400', color: T.color.charcoal, marginBottom: 6 },
  meta: { fontSize: 12, fontWeight: '500', color: T.color.gray600, marginBottom: 4 },
  vetDetail: { fontSize: 14, color: T.color.gray600, marginTop: 4, lineHeight: 20 },
  viewDetails: { fontSize: 14, fontWeight: '500', color: T.color.teal, marginTop: 6 },
  actionBtn: {
    marginTop: 12,
    backgroundColor: T.color.teal,
    borderRadius: T.radius.btn,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: T.space.sm,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: T.radius.modal,
    padding: T.space.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: T.color.charcoal, marginBottom: 8 },
  modalBody: { fontSize: 16, color: T.color.gray600, marginBottom: T.space.md },
  modalPrimaryBtn: {
    backgroundColor: T.color.teal,
    borderRadius: T.radius.btn,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPrimaryBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.btn,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelBtnText: { fontSize: 14, color: T.color.charcoal },
  vetFieldLabel: { fontSize: 12, fontWeight: '500', color: T.color.gray600, marginTop: 12, marginBottom: 4 },
  vetInput: {
    backgroundColor: T.color.offWhite,
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.input,
    padding: 12,
    fontSize: 14,
    color: T.color.charcoal,
  },
  vetInputMulti: { height: 80, textAlignVertical: 'top' },
});

const addDog = StyleSheet.create({
  content: {
    padding: T.space.sm,
    paddingTop: T.space.md,
    paddingBottom: T.space.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: T.color.charcoal,
    marginBottom: T.space.md,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: T.space.md,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.card,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLink: {
    fontSize: 15,
    fontWeight: '600',
    color: T.color.teal,
  },
  photoHint: {
    fontSize: 12,
    color: T.color.gray600,
    marginTop: 2,
  },
  field: {
    marginBottom: T.space.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: T.color.charcoal,
    marginBottom: 8,
  },
  req: {
    color: T.color.teal,
  },
  optional: {
    color: T.color.gray600,
    fontWeight: '400',
  },
  textInput: {
    height: 40,
    paddingHorizontal: T.space.sm,
    fontSize: 15,
    color: T.color.charcoal,
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.input,
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.input,
    backgroundColor: '#FFFFFF',
    minHeight: 40,
    paddingRight: 8,
  },
  inputInner: {
    flex: 1,
    height: 40,
    paddingHorizontal: T.space.sm,
    fontSize: 15,
    color: T.color.charcoal,
  },
  clearBtn: {
    padding: 4,
  },
  inlineDropdown: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.card,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.space.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.color.gray300,
  },
  dropdownSpecial: {
    backgroundColor: T.color.gray100,
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F3EF',
  },
  dropdownText: {
    fontSize: 15,
    color: T.color.charcoal,
  },
  dropdownSpecialText: {
    fontWeight: '500',
    color: T.color.teal,
  },
  dropdownTextSelected: {
    fontWeight: '600',
    color: T.color.teal,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.btn,
    backgroundColor: '#FFFFFF',
  },
  segmentActive: {
    backgroundColor: T.color.teal,
    borderColor: T.color.teal,
  },
  segmentText: {
    fontSize: 14,
    color: T.color.charcoal,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ageTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: T.space.sm,
    borderWidth: 1,
    borderColor: T.color.gray300,
    borderRadius: T.radius.input,
    backgroundColor: '#FFFFFF',
  },
  ageTriggerText: {
    fontSize: 15,
    color: T.color.charcoal,
  },
  agePlaceholder: {
    color: T.color.gray600,
  },
  errorText: {
    fontSize: 14,
    color: T.color.red,
    marginBottom: T.space.sm,
  },
  saveBtn: {
    height: 44,
    borderRadius: T.radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: T.space.xs,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 15,
    color: T.color.gray600,
  },
});
