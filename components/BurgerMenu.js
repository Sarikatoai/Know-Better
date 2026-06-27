import { supabase } from '../lib/supabase';
import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
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

export default function BurgerMenu({ isOpen, onClose, navigation, dogName: propDogName }) {
  const [dogProfile, setDogProfile] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userId, setUserId] = useState(null);
  const [dogId, setDogId] = useState(null);
  const [dogName, setDogName] = useState(propDogName ?? '');
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

    const [userRes, dogRes] = await Promise.all([
      supabase.from('users').select('notifications_enabled').eq('user_id', uid).single(),
      supabase
        .from('dogs')
        .select('dog_id, dog_name, breed, sex, date_of_birth, pre_existing_health_conditions')
        .eq('owner_id', uid)
        .limit(1)
        .single(),
    ]);

    if (userRes.data) setNotificationsEnabled(userRes.data.notifications_enabled ?? false);
    if (dogRes.data) {
      setDogProfile(dogRes.data);
      setDogId(dogRes.data.dog_id);
      if (!propDogName) setDogName(dogRes.data.dog_name ?? '');
    }
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
      const { error } = await supabase
        .from('users')
        .update({ notifications_enabled: true })
        .eq('user_id', userId);
      if (!error) setNotificationsEnabled(true);
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
    Alert.alert(
      'Are you sure?',
      'You will be logged out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await supabase.auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
        },
      ]
    );
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
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

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
                <AccountLink label="Help" onPress={() => openLink('https://support.knowbetter.app')} />
                <AccountLink label="Privacy policy" onPress={() => openLink('https://knowbetter.app/privacy')} />
                <AccountLink label="Terms of service" onPress={() => openLink('https://knowbetter.app/terms')} />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  overlayDismiss: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 16,
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
