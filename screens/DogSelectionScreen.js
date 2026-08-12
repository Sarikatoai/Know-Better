import { supabase } from '../lib/supabase';
import BurgerMenu from '../components/BurgerMenu';
import { useState, useEffect } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function DogSelectionScreen({ navigation, route }) {
  const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('dogs')
        .select('dog_id, dog_name, profile_photo_url')
        .eq('owner_id', session.user.id);
      const ts = Date.now();
      setDogs((data ?? []).map(d => ({
        ...d,
        profile_photo_url: d.profile_photo_url ? `${d.profile_photo_url}?t=${ts}` : null,
      })));
      setIsLoading(false);
    };
    load();
  }, []);

  const { mode } = route.params ?? {};

  const handleSelect = async (dog) => {
    await AsyncStorage.setItem('last_selected_dog_id', dog.dog_id);
    const params = {
      dogId: dog.dog_id,
      dogName: dog.dog_name,
      dogPhotoUrl: dog.profile_photo_url ?? null,
    };
    if (mode === 'switch') {
      navigation.navigate('CheckIn', params);
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'CheckIn', params }] });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsMenuOpen(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="menu" size={26} color="#0F6E56" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('CheckIn')} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="paw" size={18} color="#0F6E56" />
          <Text style={styles.brand}>Know Better</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Which dog are you{'\n'}checking in on today?</Text>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {dogs.map((dog) => (
          <TouchableOpacity
            key={dog.dog_id}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => handleSelect(dog)}
          >
            {dog.profile_photo_url ? (
              <Image source={{ uri: dog.profile_photo_url }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="paw" size={36} color="#0F6E56" />
              </View>
            )}
            <Text style={styles.dogName}>{dog.dog_name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BurgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  brand: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F6E56',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F6E56',
    marginBottom: 32,
    lineHeight: 34,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 48,
  },
  card: {
    width: '46%',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 12,
    gap: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3C34',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 100,
  },
});
