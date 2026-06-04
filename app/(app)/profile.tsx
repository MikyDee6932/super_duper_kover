import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KCard } from '@/components/ui/KCard';
import { KEyebrow } from '@/components/ui/KEyebrow';
import { KButton } from '@/components/ui/KButton';
import { useAuthStore } from '@/store/authStore';
import { useStreakStore } from '@/store/streakStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { updateProfile, supabase } from '@/lib/supabase';

const TRANSLATIONS = ['NLT', 'NIV', 'MSG'] as const;

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const { currentStreak } = useStreakStore();
  const { isActive } = useSubscriptionStore();
  const [signingOut, setSigningOut] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linking, setLinking] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  // An anonymous user has no email — show the link card for them
  const isAnonymous = user?.is_anonymous ?? false;

  const handleLinkAccount = async () => {
    if (!linkEmail.trim() || linkPassword.length < 8) {
      Alert.alert('Check your details', 'Enter a valid email and a password of at least 8 characters.');
      return;
    }
    setLinking(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: linkEmail.trim().toLowerCase(),
        password: linkPassword,
      });
      if (error) throw error;
      Alert.alert(
        'Account secured 🎉',
        'Your progress is now linked to your email. You can sign in on any device.',
      );
      setShowLinkForm(false);
      setLinkEmail('');
      setLinkPassword('');
    } catch (e: any) {
      Alert.alert('Could not link account', e.message);
    } finally {
      setLinking(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleTranslation = async (t: string) => {
    if (!user) return;
    await updateProfile(user.id, { bible_translation: t });
    await refreshProfile();
  };

  const name = profile?.full_name ?? 'Friend';
  const cleanDays = profile?.days_since_clean ?? 0;

  const stats = [
    { label: 'Current Streak', value: `${currentStreak} days`, emoji: '🔥' },
    { label: 'Days Clean', value: `${cleanDays} days`, emoji: '✨' },
    { label: 'Plan', value: isActive ? 'Kover Pro' : 'Free', emoji: '👑' },
  ];

  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {stats.map((s) => (
          <KCard key={s.label} style={styles.statCard} padding={12}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </KCard>
        ))}
      </View>

      {/* Bible Translation */}
      <KCard>
        <KEyebrow>Bible Translation</KEyebrow>
        <View style={styles.translations}>
          {TRANSLATIONS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.translationBtn, profile?.bible_translation === t && styles.translationBtnActive]}
              onPress={() => handleTranslation(t)}
            >
              <Text style={[styles.translationText, profile?.bible_translation === t && styles.translationTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </KCard>

      {/* Subscription */}
      <KCard variant={isActive ? 'earned' : 'default'}>
        <KEyebrow color={isActive ? Colors.emerald500 : undefined}>Subscription</KEyebrow>
        <Text style={styles.planText}>{isActive ? 'Kover Pro — Active' : 'Free Plan'}</Text>
        {!isActive && (
          <KButton variant="primary" size="sm" onPress={() => router.push('/paywall')} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            Upgrade to Pro
          </KButton>
        )}
      </KCard>

      {/* Shield status */}
      <KCard>
        <KEyebrow>Kover Shield</KEyebrow>
        <View style={styles.shieldRow}>
          <Text style={styles.shieldStatus}>
            {profile?.shield_activated ? '🛡️ Active' : '⚠️ Not activated'}
          </Text>
          {!profile?.shield_activated && (
            <KButton variant="secondary" size="sm" onPress={() => router.push('/(auth)/onboarding/shield')}>
              Set Up
            </KButton>
          )}
        </View>
      </KCard>

      {/* Conquer Date */}
      {profile?.conquer_date && (
        <KCard>
          <KEyebrow>Conquer Date</KEyebrow>
          <Text style={styles.planText}>
            🎯 {new Date(profile.conquer_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </KCard>
      )}

      {/* Link account — shown only for anonymous (purchase-only) users */}
      {isAnonymous && (
        <KCard>
          <KEyebrow>Secure Your Account</KEyebrow>
          <Text style={styles.linkSub}>
            Add an email and password to back up your progress and sign in on any device.
          </Text>
          {showLinkForm ? (
            <View style={styles.linkForm}>
              <TextInput
                style={styles.linkInput}
                placeholder="Email address"
                placeholderTextColor={Colors.fg4}
                value={linkEmail}
                onChangeText={setLinkEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />
              <TextInput
                style={styles.linkInput}
                placeholder="Password (min. 8 characters)"
                placeholderTextColor={Colors.fg4}
                value={linkPassword}
                onChangeText={setLinkPassword}
                secureTextEntry
                textContentType="newPassword"
              />
              <KButton variant="primary" full loading={linking} onPress={handleLinkAccount}>
                Save Account
              </KButton>
              <KButton variant="text" full onPress={() => setShowLinkForm(false)}>
                Cancel
              </KButton>
            </View>
          ) : (
            <KButton
              variant="secondary"
              full
              style={{ marginTop: 12 }}
              onPress={() => setShowLinkForm(true)}
            >
              Add Email & Password
            </KButton>
          )}
        </KCard>
      )}

      {/* Sign out */}
      <KButton variant="danger" full loading={signingOut} onPress={handleSignOut}>
        Sign Out
      </KButton>

      <Text style={styles.version}>Kover v1.0.0 · Made with ❤️ for freedom</Text>
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, gap: 16 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.emerald500,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.sansBold, fontSize: 36, fontWeight: '700', color: '#fff' },
  name: { fontFamily: Fonts.display, fontSize: 22, fontWeight: '700', color: Colors.fg1, letterSpacing: -0.3 },
  email: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.fg4 },
  stats: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 22 },
  statValue: { fontFamily: Fonts.sansBold, fontSize: 15, fontWeight: '700', color: Colors.fg1 },
  statLabel: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.fg4, textAlign: 'center' },
  translations: { flexDirection: 'row', gap: 10, marginTop: 10 },
  translationBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.sm,
    backgroundColor: Colors.bg1, borderWidth: 1, borderColor: Colors.hairline,
    alignItems: 'center',
  },
  translationBtnActive: { backgroundColor: Colors.emerald500, borderColor: Colors.emerald500 },
  translationText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, fontWeight: '600', color: Colors.fg3 },
  translationTextActive: { color: '#fff' },
  planText: { fontFamily: Fonts.sansSemiBold, fontSize: 16, fontWeight: '600', color: Colors.fg1, marginTop: 6 },
  shieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  shieldStatus: { fontFamily: Fonts.sansSemiBold, fontSize: 15, fontWeight: '600', color: Colors.fg1 },
  version: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.fg4, textAlign: 'center', marginTop: 8 },
  linkSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg3,
    lineHeight: 19,
    marginTop: 6,
  },
  linkForm: { gap: 10, marginTop: 12 },
  linkInput: {
    fontFamily: Fonts.sans,
    backgroundColor: Colors.bgInset,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    color: Colors.fg1,
    fontSize: 15,
  },
});
