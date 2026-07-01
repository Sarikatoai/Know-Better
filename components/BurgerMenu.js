import { supabase } from '../lib/supabase';
import { pickAndUploadDogPhoto } from '../lib/photoUpload';
import { setupPushNotifications } from '../lib/notifications';
import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TEAL = '#0F6E56';
const RED = '#DC2626';

export default function BurgerMenu({ isOpen, onClose, navigation, dogName: propDogName, dogId: propDogId }) {
  const [dogProfile, setDogProfile] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userId, setUserId] = useState(null);
  const [dogId, setDogId] = useState(propDogId ?? null);
  const [dogName, setDogName] = useState(propDogName ?? '');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [isLoadingNotif, setIsLoadingNotif] = useState(false);
  const slideAnim = useRef(new Animated.Value(-320)).current;

  useEffect(() => {
    if (isOpen) {
      loadData();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(-320);
    }
  }, [isOpen]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    setUserId(uid);

    const dogQuery = propDogId
      ? supabase.from('dogs').select('dog_id, dog_name, breed, sex, date_of_birth, pre_existing_health_conditions, profile_photo_url').eq('dog_id', propDogId).single()
      : supabase.from('dogs').select('dog_id, dog_name, breed, sex, date_of_birth, pre_existing_health_conditions, profile_photo_url').eq('owner_id', uid).limit(1).single();

    const [userRes, dogRes] = await Promise.all([
      supabase.from('users').select('notifications_enabled').eq('user_id', uid).single(),
      dogQuery,
    ]);

    if (userRes.data) setNotificationsEnabled(userRes.data.notifications_enabled ?? false);
    if (dogRes.data) {
      setDogProfile(dogRes.data);
      setDogId(dogRes.data.dog_id);
      if (!propDogName) setDogName(dogRes.data.dog_name ?? '');
      const rawUrl = dogRes.data.profile_photo_url ?? null;
      setPhotoUrl(rawUrl ? `${rawUrl}?t=${Date.now()}` : null);
    }
  };

  const handlePhotoUpload = async () => {
    const id = dogId;
    if (!id) return;
    setPhotoLoading(true);
    setPhotoError('');
    const result = await pickAndUploadDogPhoto(id);
    setPhotoLoading(false);
    if (result.canceled) return;
    if (result.error) {
      setPhotoError(result.message || 'Photo upload failed, try again');
      return;
    }
    setPhotoUrl(result.url);
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(`${dob}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    return years <= 0 ? 'Less than 1 year' : `${years} year${years !== 1 ? 's' : ''}`;
  };

  const handleNotificationsToggle = async (value) => {
    if (isLoadingNotif || !userId) return;
    setIsLoadingNotif(true);
    if (value) {
      const { granted, token } = await setupPushNotifications();
      if (granted) {
        const { error } = await supabase
          .from('users')
          .update({ notifications_enabled: true, push_token: token ?? null })
          .eq('user_id', userId);
        if (!error) setNotificationsEnabled(true);
      } else {
        setNotificationsEnabled(false);
        Alert.alert(
          'Notifications blocked',
          'To enable notifications, go to Settings and allow notifications for Expo Go.',
          [{ text: 'OK' }]
        );
      }
    } else {
      const { error } = await supabase
        .from('users')
        .update({ notifications_enabled: false, push_token: null })
        .eq('user_id', userId);
      if (!error) setNotificationsEnabled(false);
    }
    setIsLoadingNotif(false);
  };

  const handleSignOut = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Sign out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign out',
            style: 'destructive',
            onPress: async () => {
              await supabase.auth.signOut({ scope: 'local' });
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            },
          },
        ]
      );
    }, 300);
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Unable to open link', 'Please try again later.')
    );
  };

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.drawerHeader}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuContent}>

            {/* Section 1 — Vet Report */}
            <TouchableOpacity
              style={styles.section}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                navigation.navigate('Report', { dogId, dogName });
              }}
            >
              <Text style={styles.sectionTitle}>View vet report</Text>
              {dogName ? (
                <Text style={styles.sectionSubtitle}>{dogName}'s vet report</Text>
              ) : null}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Section 2 — Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.toggleRow}>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ false: '#E0E0E0', true: '#7BBFAD' }}
                  thumbColor={notificationsEnabled ? TEAL : '#AAAAAA'}
                  disabled={isLoadingNotif}
                />
                <Text style={styles.toggleLabel}>
                  {notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 3 — Dog Profile */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dog profile</Text>
              <View style={styles.photoSection}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.dogPhoto} />
                ) : (
                  <View style={styles.dogPhotoPlaceholder}>
                    <Text style={styles.pawEmoji}>🐾</Text>
                  </View>
                )}
                <TouchableOpacity onPress={handlePhotoUpload} disabled={photoLoading} activeOpacity={0.7}>
                  <Text style={styles.photoLink}>
                    {photoLoading ? 'Uploading…' : photoUrl ? 'Edit photo' : 'Add photo'}
                  </Text>
                </TouchableOpacity>
                {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}
              </View>
              {dogProfile ? (
                <View style={styles.profileFields}>
                  <ProfileRow label="Name" value={dogProfile.dog_name} />
                  <ProfileRow label="Breed" value={dogProfile.breed} />
                  <ProfileRow label="Sex" value={capitalize(dogProfile.sex)} />
                  <ProfileRow label="Age" value={calculateAge(dogProfile.date_of_birth)} />
                  {dogProfile.pre_existing_health_conditions ? (
                    <ProfileRow
                      label="Health conditions"
                      value={dogProfile.pre_existing_health_conditions}
                    />
                  ) : null}
                </View>
              ) : (
                <Text style={styles.loadingText}>Loading…</Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* Section 4 — Account Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account settings</Text>
              <View style={styles.linkList}>
                <AccountLink label="Help" onPress={() => { onClose(); navigation.navigate('Help'); }} />
                <AccountLink label="Privacy policy" onPress={() => { onClose(); navigation.navigate('Privacy'); }} />
                <AccountLink label="Terms of service" onPress={() => { onClose(); navigation.navigate('Terms'); }} />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 5 — Sign Out */}
            <TouchableOpacity style={styles.section} activeOpacity={0.7} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>

        {/* Tap outside to close */}
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />
      </View>
    </Modal>
  );
}

function ProfileRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value}</Text>
    </View>
  );
}

function AccountLink({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.accountLink} activeOpacity={0.7} onPress={onPress}>
      <Text style={styles.accountLinkText}>{label}</Text>
      <Text style={styles.accountLinkArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  drawerHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  overlayDismiss: {
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#888888',
  },
  menuContent: {
    paddingBottom: 48,
  },
  section: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEAL,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888888',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666666',
  },
  photoSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  dogPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  dogPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawEmoji: {
    fontSize: 24,
  },
  photoLink: {
    fontSize: 13,
    fontWeight: '600',
    color: TEAL,
  },
  photoError: {
    fontSize: 12,
    color: RED,
    textAlign: 'center',
  },
  profileFields: {
    gap: 10,
    marginTop: 4,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  profileLabel: {
    fontSize: 13,
    color: '#888888',
    flex: 1,
  },
  profileValue: {
    fontSize: 13,
    color: '#1A3C34',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  loadingText: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 4,
  },
  linkList: {
    gap: 4,
    marginTop: 4,
  },
  accountLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  accountLinkText: {
    fontSize: 14,
    color: '#333333',
  },
  accountLinkArrow: {
    fontSize: 22,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: RED,
  },
});
