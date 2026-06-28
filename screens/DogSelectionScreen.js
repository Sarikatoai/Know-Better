import { supabase } from '../lib/supabase';
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

export default function DogSelectionScreen({ navigation }) {
  const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSelect = async (dog) => {
    await AsyncStorage.setItem('last_selected_dog_id', dog.dog_id);
    navigation.reset({
      index: 0,
      routes: [{
        name: 'CheckIn',
        params: {
          dogId: dog.dog_id,
          dogName: dog.dog_name,
          dogPhotoUrl: dog.profile_photo_url ?? null,
        },
      }],
    });
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
