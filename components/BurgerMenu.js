import { supabase } from '../lib/supabase';
import { pickAndUploadDogPhoto } from '../lib/photoUpload';
import { setupPushNotifications } from '../lib/notifications';
import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const C = {
  teal:     '#0F6E56',
  charcoal: '#1F2937',
  offWhite: '#FAFAF9',
  gray600:  '#9CA3AF',
  gray300:  '#E5E7EB',
  red:      '#DC2626',
};

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
    if (!dogId) return;
    setPhotoLoading(true);
    setPhotoError('');
    const result = await pickAndUploadDogPhoto(dogId);
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

  const handleSignOut = async () => {
    onClose();
    await supabase.auth.signOut({ scope: 'local' });
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Know Better</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={18} color={C.teal} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* 1 — Vet Report */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => { onClose(); navigation.navigate('Report', { dogId, dogName }); }}
            >
              <MaterialCommunityIcons name="clipboard-pulse-outline" size={20} color={C.charcoal} style={styles.rowIcon} />
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>View vet report</Text>
                {dogName ? <Text style={styles.rowSub}>{dogName}'s report</Text> : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={C.gray300} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 1b — Check-in History */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => { onClose(); navigation.navigate('CheckInHistory', { dogId, dogName }); }}
            >
              <MaterialCommunityIcons name="history" size={20} color={C.charcoal} style={styles.rowIcon} />
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Check-in history</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={C.gray300} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 1c — Alerts */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => { onClose(); navigation.navigate('AlertsHistory', { dogId, dogName }); }}
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color={C.charcoal} style={styles.rowIcon} />
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Alerts</Text>
                {dogName ? <Text style={styles.rowSub}>{dogName}'s alert history</Text> : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={C.gray300} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 1d — Add Dog */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => { onClose(); navigation.navigate('AddDog'); }}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={C.teal} style={styles.rowIcon} />
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Add Dog</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={C.gray300} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 2 — Notifications */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Notifications</Text>
              <View style={styles.toggleRow}>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ false: C.gray300, true: '#7BBFAD' }}
                  thumbColor={notificationsEnabled ? C.teal : C.gray600}
                  disabled={isLoadingNotif}
                  style={styles.toggle}
                />
                <Text style={styles.toggleLabel}>
                  {notificationsEnabled ? 'On' : 'Off'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 3 — Dog Profile */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Dog profile</Text>
              <View style={styles.profileCard}>
                <View style={styles.photoRow}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.dogPhoto} />
                  ) : (
                    <View style={styles.dogPhotoPlaceholder}>
                      <MaterialCommunityIcons name="paw" size={22} color={C.teal} />
                    </View>
                  )}
                  <TouchableOpacity onPress={handlePhotoUpload} disabled={photoLoading} activeOpacity={0.7}>
                    <Text style={styles.photoLink}>
                      {photoLoading ? 'Uploading…' : photoUrl ? 'Edit photo' : 'Add photo'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}
                {dogProfile ? (
                  <View style={styles.profileFields}>
                    <ProfileRow label="Name"  value={dogProfile.dog_name} />
                    <ProfileRow label="Breed" value={dogProfile.breed} />
                    <ProfileRow label="Sex"   value={capitalize(dogProfile.sex)} />
                    <ProfileRow label="Age"   value={calculateAge(dogProfile.date_of_birth)} />
                    {dogProfile.pre_existing_health_conditions ? (
                      <ProfileRow label="Conditions" value={dogProfile.pre_existing_health_conditions} />
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.loadingText}>Loading…</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* 4 — Account Settings */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Account settings</Text>
              <View style={styles.linkList}>
                <AccountLink label="Help"            onPress={() => { onClose(); navigation.navigate('Help'); }} />
                <AccountLink label="Privacy policy"  onPress={() => { onClose(); navigation.navigate('Privacy'); }} />
                <AccountLink label="Terms of service" onPress={() => { onClose(); navigation.navigate('Terms'); }} />
              </View>
            </View>

            <View style={styles.divider} />

            {/* 5 — Sign Out */}
            <View style={styles.sectionBlock}>
              <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.85} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>

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
      <MaterialCommunityIcons name="chevron-right" size={18} color={C.gray300} />
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
    backgroundColor: C.offWhite,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  overlayDismiss: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.gray300,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.charcoal,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3EF',
  },

  scrollContent: {
    paddingBottom: 48,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: C.gray300,
  },

  // Generic section block
  sectionBlock: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: C.charcoal,
    marginBottom: 12,
  },

  // Vet Report row
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: C.charcoal,
  },
  rowSub: {
    fontSize: 13,
    color: C.gray600,
    marginTop: 2,
  },

  // Notifications
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggle: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  toggleLabel: {
    fontSize: 14,
    color: C.gray600,
  },

  // Dog Profile card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.gray300,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dogPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  dogPhotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLink: {
    fontSize: 14,
    fontWeight: '600',
    color: C.teal,
  },
  photoError: {
    fontSize: 12,
    color: C.red,
  },
  profileFields: {
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  profileLabel: {
    fontSize: 14,
    color: C.gray600,
    flex: 1,
  },
  profileValue: {
    fontSize: 14,
    color: C.charcoal,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  loadingText: {
    fontSize: 14,
    color: C.gray600,
  },

  // Account links
  linkList: {
    gap: 0,
  },
  accountLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  accountLinkText: {
    fontSize: 16,
    fontWeight: '400',
    color: C.charcoal,
  },

  // Sign Out button
  signOutBtn: {
    backgroundColor: C.red,
    borderRadius: 4,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
