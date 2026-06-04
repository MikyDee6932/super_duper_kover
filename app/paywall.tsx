import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { getOfferings, purchasePackage, linkRevenueCatUser, restorePurchases, PRODUCT_IDS } from '@/lib/purchases';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { supabase, updateProfile } from '@/lib/supabase';
import type { PurchasesPackage } from 'react-native-purchases';

type PaywallPhase = 'primary' | 'secondary';

function Countdown({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return <Text style={styles.countdown}>{m}:{s}</Text>;
}

/** Radio circle indicator */
function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={[radioStyles.outer, selected && radioStyles.outerSelected]}>
      {selected && <View style={radioStyles.inner} />}
    </View>
  );
}

const radioStyles = StyleSheet.create({
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerSelected: {
    borderColor: Colors.emerald500,
  },
  inner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.emerald500,
  },
});

export default function Paywall() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { refresh: _refresh } = useSubscriptionStore();
  const { answers, reset: resetOnboarding } = useOnboardingStore();

  const [phase, setPhase] = useState<PaywallPhase>('primary');
  const [offering, setOffering] = useState<PurchasesPackage[] | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<'annual' | 'lifetime'>('lifetime');
  const [loading, setLoading] = useState(false);
  const [countdownSecs, setCountdownSecs] = useState(5 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getOfferings().then((o) => {
      if (o?.current) {
        setOffering(o.current.availablePackages);
      }
    });
  }, []);

  useEffect(() => {
    if (phase === 'secondary') {
      timerRef.current = setInterval(() => {
        setCountdownSecs((s) => {
          if (s <= 1) { clearInterval(timerRef.current!); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const primaryPackages = (offering ?? []).filter(
    (p) => p.product.identifier === PRODUCT_IDS.ANNUAL || p.product.identifier === PRODUCT_IDS.LIFETIME,
  );

  const secondaryPackage = (offering ?? []).find(
    (p) => p.product.identifier === PRODUCT_IDS.ANNUAL_TRIAL,
  ) ?? null;

  const handlePurchase = async () => {
    // ── DEV BYPASS ────────────────────────────────────────────────────────────
    // Skips the real purchase flow so the app can be tested without a device.
    // Remove this block (or set DEV_BYPASS = false) before submitting to stores.
    const DEV_BYPASS = __DEV__;
    if (DEV_BYPASS) {
      setLoading(true);
      try {
        // Create an anonymous Supabase session so all app features work
        let uid = user?.id ?? null;
        if (!uid) {
          const { data } = await supabase.auth.signInAnonymously();
          uid = data.user?.id ?? null;
        }
        if (uid && Object.keys(answers).length > 0) {
          await updateProfile(uid, {
            ...answers,
            days_since_clean: answers.days_since_clean != null
              ? parseInt(String(answers.days_since_clean), 10) || 0
              : undefined,
            onboarding_completed: true,
          });
          resetOnboarding();
        }
        // Mock subscription active so the app layout guard passes
        const { useSubscriptionStore: ss } = await import('@/store/subscriptionStore');
        ss.setState({ isActive: true, isLoading: false });
        // Route to Kover Shield setup — final step before the app
        router.replace('/(auth)/onboarding/shield');
      } finally {
        setLoading(false);
      }
      return;
    }
    // ── PRODUCTION PURCHASE FLOW ──────────────────────────────────────────────

    const rcId = selectedPlanId === 'annual' ? PRODUCT_IDS.ANNUAL : PRODUCT_IDS.LIFETIME;
    const pkg = phase === 'secondary'
      ? secondaryPackage
      : (offering ?? []).find((p) => p.product.identifier === rcId) ?? null;

    // If RevenueCat packages aren't loaded yet (e.g. simulator / web preview),
    // inform the user rather than silently failing.
    if (!pkg) {
      Alert.alert('Not available', 'In-app purchases are not available in this environment. Please test on a real device.');
      return;
    }
    setLoading(true);
    try {
      // Step 1 — Apple / Google processes payment via RevenueCat
      const result = await purchasePackage(pkg);
      if (!result.success) {
        if (!result.userCancelled) Alert.alert('Purchase failed', result.error);
        return;
      }

      // Step 2 — Silently create an anonymous Supabase session.
      // No form, no password — the purchase IS the sign-up event.
      let uid = user?.id ?? null;
      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) {
          Alert.alert('Sign-in error', error?.message ?? 'Could not create session.');
          return;
        }
        uid = data.user.id;
      }

      // Step 3 — Transfer RevenueCat's anonymous purchase to the Supabase UID
      await linkRevenueCatUser(uid);

      // Step 4 — Flush quiz answers collected during onboarding to the new profile
      if (Object.keys(answers).length > 0) {
        // Cast days_since_clean to integer for the profiles table column type
        const profileData = {
          ...answers,
          days_since_clean: answers.days_since_clean != null
            ? parseInt(String(answers.days_since_clean), 10) || 0
            : undefined,
          onboarding_completed: true,
        };
        await updateProfile(uid, profileData);
      }
      resetOnboarding();

      // Step 5 — Refresh subscription state, then route to Shield setup
      await _refresh(uid);
      router.replace('/(auth)/onboarding/shield');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restorePurchases();
      if (user) await _refresh(user.id);
      // Existing subscribers go straight to home (shield already configured)
      router.replace('/(app)/home');
    } catch {
      Alert.alert('Restore failed', 'No previous purchases found.');
    } finally {
      setLoading(false);
    }
  };

  // ── Secondary (countdown) paywall ───────────────────────────────────────────
  if (phase === 'secondary') {
    return (
      <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(app)/home')}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.secondaryScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.offerBadge}>ONE TIME OFFER</Text>
            <Text style={styles.secondaryHeadline}>70% Discount</Text>
            <Text style={styles.secondaryTagline}>This offer expires in</Text>
            <Countdown seconds={countdownSecs} />

            {secondaryPackage && (
              <View style={styles.secondaryCard}>
                <Text style={styles.secondaryPrice}>
                  $2.92<Text style={styles.secondaryUnit}>/mo</Text>
                </Text>
                <Text style={styles.secondaryAnnual}>$34.99/year · 3-day free trial</Text>
                <Text style={styles.secondaryOriginal}>Regular price: $59.99/year</Text>
              </View>
            )}

            <View style={styles.perks}>
              {[
                '✓ Unlimited access to all features',
                '✓ AI Coach Sloan — faith-based support',
                '✓ Kover Shield — system-wide blocking',
                '✓ 3-day free trial · Cancel anytime',
              ].map((perk) => (
                <Text key={perk} style={styles.perk}>{perk}</Text>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Text style={styles.noCommitment}>🛡️ No commitment. Cancel anytime.</Text>
            <KButton
              variant="primary"
              full
              loading={loading}
              disabled={!secondaryPackage || countdownSecs === 0}
              onPress={handlePurchase}
            >
              {countdownSecs > 0 ? 'Claim 70% Off Offer' : 'Offer Expired'}
            </KButton>
            <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
              <Text style={styles.restoreText}>Restore purchases</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // ── Primary paywall ─────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.primaryScroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.primaryHeadline}>Choose Your Plan</Text>
        <Text style={styles.primarySub}>Join thousands walking in freedom</Text>

        {/* Perks — shown before the offer band to build value first */}
        <View style={styles.perks}>
          {[
            '✓ Unlimited messaging and daily check-ins with your accountability Coach Sloan',
            '✓ Kover Shield — system-wide content blocking',
            '✓ Daily refresh lessons, prayers and journal',
            '✓ Unlimited SOS button to overcome high-urge moments with effective tools',
          ].map((perk) => (
            <Text key={perk} style={styles.perk}>{perk}</Text>
          ))}
        </View>

        {/* Scarcity row */}
        <View style={styles.scarcityRow}>
          <View style={styles.scarcityBadge}>
            <Text style={styles.scarcityIcon}>✦</Text>
            <Text style={styles.scarcityLeft}>50% Off Sale</Text>
          </View>
          <Text style={styles.scarcityRight}>9 spots remaining</Text>
        </View>

        {/* Plan cards */}
        <View style={styles.packages}>
          {/* Annual */}
          <TouchableOpacity
            style={[styles.packageCard, selectedPlanId === 'annual' && styles.packageCardSelected]}
            onPress={() => setSelectedPlanId('annual')}
            activeOpacity={0.8}
          >
            <View style={styles.cardRow}>
              <Radio selected={selectedPlanId === 'annual'} />
              <View style={styles.cardInfo}>
                <Text style={styles.planName}>Annual</Text>
                <Text style={styles.planPer}>per year</Text>
              </View>
              <View style={styles.cardPricing}>
                <Text style={styles.originalPrice}>$119.99</Text>
                <Text style={styles.currentPrice}>$59.99</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Lifetime */}
          <TouchableOpacity
            style={[styles.packageCard, selectedPlanId === 'lifetime' && styles.packageCardSelected]}
            onPress={() => setSelectedPlanId('lifetime')}
            activeOpacity={0.8}
          >
            {/* Most popular badge */}
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </View>

            <View style={styles.cardRow}>
              <Radio selected={selectedPlanId === 'lifetime'} />
              <View style={styles.cardInfo}>
                <Text style={styles.planName}>Lifetime</Text>
                <Text style={styles.planPer}>pay once</Text>
              </View>
              <View style={styles.cardPricing}>
                <Text style={styles.originalPrice}>$179.99</Text>
                <Text style={styles.currentPrice}>$89.99</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <Text style={styles.noCommitment}>🛡️ No commitment. Cancel anytime.</Text>
          <KButton variant="primary" full loading={loading} onPress={handlePurchase}>
            Get Kovered Today
          </KButton>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          Subscriptions auto-renew. Cancel anytime in App Store or Google Play settings.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    gap: 20,
  },
  primaryScroll: {
    paddingHorizontal: Spacing.xl,
    gap: 20,
  },
  secondaryScroll: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 16,
  },
  closeBtn: { alignSelf: 'flex-end' },
  closeText: {
    fontFamily: Fonts.sans,
    color: Colors.fg4,
    fontSize: 16,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  primaryHeadline: {
    fontFamily: Fonts.display,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.fg1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  primarySub: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.fg3,
    textAlign: 'center',
    marginTop: -8,
  },

  // ── Scarcity row ────────────────────────────────────────────────────────────
  scarcityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgSurface2,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.hairlineEmerald,
  },
  scarcityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scarcityIcon: {
    fontSize: 14,
    color: Colors.emerald400,
  },
  scarcityLeft: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.emerald400,
  },
  scarcityRight: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg3,
  },

  // ── Plan cards ───────────────────────────────────────────────────────────────
  packages: { gap: 20 },
  packageCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    paddingVertical: 18,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'visible',
  },
  packageCardSelected: {
    borderColor: Colors.emerald500,
    backgroundColor: Colors.emerald500 + '0d',
  },
  popularBadge: {
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -52,
    backgroundColor: Colors.emerald500,
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 999,
    zIndex: 1,
  },
  popularBadgeText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.cream50,
    letterSpacing: 1.2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  planName: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.fg1,
  },
  planPer: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg4,
  },
  cardPricing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  originalPrice: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg4,
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: -0.3,
  },

  // ── Perks ────────────────────────────────────────────────────────────────────
  perks: { gap: 10 },
  perk: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.fg2,
    lineHeight: 20,
  },

  // ── CTA area ─────────────────────────────────────────────────────────────────
  actions: { gap: 12 },
  noCommitment: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.fg3,
    textAlign: 'center',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  restoreText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg4,
  },
  legal: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.fg4,
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Secondary phase ──────────────────────────────────────────────────────────
  offerBadge: {
    fontFamily: Fonts.sansExtraBold,
    backgroundColor: Colors.sosRed,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
    overflow: 'hidden',
  },
  secondaryHeadline: {
    fontFamily: Fonts.display,
    fontSize: 40,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: -0.5,
  },
  secondaryTagline: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.fg3,
  },
  countdown: {
    fontFamily: Fonts.mono,
    fontSize: 48,
    fontWeight: '700',
    color: Colors.sosRed,
    letterSpacing: 4,
  },
  secondaryCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.emerald500,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  secondaryPrice: {
    fontFamily: Fonts.display,
    fontSize: 40,
    fontWeight: '800',
    color: Colors.fg1,
  },
  secondaryUnit: {
    fontFamily: Fonts.sans,
    fontSize: 20,
    color: Colors.fg3,
  },
  secondaryAnnual: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.emerald500,
    fontWeight: '600',
  },
  secondaryOriginal: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.fg4,
    textDecorationLine: 'line-through',
  },
});
