// Kover Shield — post-purchase setup flow
// Three states mirror the Quittr UX pattern:
//   intro    → explain what Shield does + "Activate" CTA
//   manual   → step-by-step DNS settings guide (iOS fallback / Android)
//   success  → confirmation screen → route to home

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  ScrollView, Linking, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G } from 'react-native-svg';
import { Colors, Fonts, Spacing, Radius } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { useAuthStore } from '@/store/authStore';
import { provisionNextDNSProfile, activateShield, logBlockerEvent } from '@/lib/dnsShield';
import { updateProfile } from '@/lib/supabase';

type State = 'intro' | 'activating' | 'manual' | 'success';

// ── SVG Icons ────────────────────────────────────────────────────────────────
function ShieldIcon({ color, size = 72 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 4L8 14v18c0 14.4 10.3 27 24 30 13.7-3 24-15.6 24-30V14L32 4z"
        fill={color}
        opacity={0.18}
      />
      <Path
        d="M32 4L8 14v18c0 14.4 10.3 27 24 30 13.7-3 24-15.6 24-30V14L32 4z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path
        d="M24 32l6 6 10-12"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Feature row used on intro screen ─────────────────────────────────────────
function FeatureRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={feat.row}>
      <View style={feat.iconWrap}>
        <Text style={feat.icon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={feat.title}>{title}</Text>
        <Text style={feat.body}>{body}</Text>
      </View>
    </View>
  );
}

const feat = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.bgSurface2,
    borderWidth: 1,
    borderColor: Colors.hairlineEmerald,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 22 },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.fg1,
    marginBottom: 3,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg3,
    lineHeight: 19,
  },
});

// ── DNS step row (Quittr-style: numbered bubble + icon-prefixed settings row) ─
function StepRow({
  num, title, label, sublabel, rowIcon, onPress, isLast = false,
}: {
  num: number;
  title: string;
  label: string;
  sublabel?: string;
  rowIcon?: string;       // emoji shown in the left square of the settings row
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <View style={step.section}>
      {/* Connector line above (not on first step) */}
      {num > 1 && <View style={step.connectorTop} />}

      <View style={step.header}>
        <View style={step.bubble}>
          <Text style={step.bubbleText}>{num}</Text>
        </View>
        <Text style={step.heading}>{title}</Text>
      </View>

      {/* Settings-style row with icon */}
      <TouchableOpacity
        style={step.row}
        onPress={onPress}
        activeOpacity={onPress ? 0.75 : 1}
      >
        {rowIcon && (
          <View style={step.rowIconWrap}>
            <Text style={step.rowIcon}>{rowIcon}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={step.label}>{label}</Text>
          {sublabel && <Text style={step.sublabel}>{sublabel}</Text>}
        </View>
        {onPress && <Text style={step.chevron}>›</Text>}
      </TouchableOpacity>

      {/* Connector line below (not on last step) */}
      {!isLast && <View style={step.connectorBottom} />}
    </View>
  );
}

const step = StyleSheet.create({
  section: { position: 'relative', paddingBottom: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.emerald500,
    borderWidth: 1.5,
    borderColor: Colors.emerald400,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  bubbleText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.cream50,
  },
  heading: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.fg1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgSurface2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginLeft: 44,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.bgSurface3,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIcon: { fontSize: 17 },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.fg1,
  },
  sublabel: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.fg4,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: Colors.fg3,
    lineHeight: 26,
    marginLeft: 4,
  },
  connectorTop: {
    position: 'absolute',
    left: 15,
    top: -16,
    width: 2,
    height: 20,
    backgroundColor: Colors.emerald500,
    opacity: 0.4,
  },
  connectorBottom: {
    position: 'absolute',
    left: 15,
    bottom: -16,
    width: 2,
    height: 20,
    backgroundColor: Colors.emerald500,
    opacity: 0.4,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ShieldSetup() {
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuthStore();
  const [state, setState] = useState<State>('intro');
  const [loading, setLoading] = useState(false);

  // Platform flags — resolved once at mount, never change
  const isIOS     = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  const isWeb     = Platform.OS === 'web'; // Expo web / dev preview

  // Auto-trigger activation 800ms after screen mounts (production only).
  // Disabled in __DEV__ because the native VPN module requires a signed app
  // build — it is not available in emulator/Expo Go dev sessions.
  const activatedRef = useRef(false);
  useEffect(() => {
    if (__DEV__) return;            // ← skip auto-trigger in dev/emulator
    if (activatedRef.current) return;
    activatedRef.current = true;
    const timer = setTimeout(() => handleActivate(), 800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleActivate = async () => {
    // Web/simulator: native modules unavailable → skip to manual guide
    if (isWeb) { setState('manual'); return; }
    if (!user)  { setState('manual'); return; }

    setLoading(true);
    setState('activating');

    try {
      // Step 1: Provision a per-user NextDNS profile via Supabase Edge Function
      let profileId = profile?.nextdns_profile_id;
      if (!profileId) {
        profileId = await provisionNextDNSProfile();
        if (profileId) {
          await updateProfile(user.id, { nextdns_profile_id: profileId });
        }
      }

      // Step 2: Platform-specific activation
      //   iOS     → NEDNSSettingsManager.saveToPreferences() (one system dialog, no VPN icon)
      //   Android → VpnService.prepare() + startService() (local TUN, traffic never leaves device)
      const success = profileId ? await activateShield(profileId) : false;

      if (success) {
        await logBlockerEvent(user.id, 'activated');
        await updateProfile(user.id, { shield_activated: true });
        await refreshProfile();
        setState('success');
      } else {
        // Permission dismissed or native module unavailable → show manual guide
        setState('manual');
      }
    } catch {
      setState('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleManualDone = async () => {
    if (user) {
      await updateProfile(user.id, { shield_activated: true }).catch(() => {});
      await refreshProfile().catch(() => {});
    }
    setState('success');
  };

  const handleSkip = async () => {
    if (user) {
      await updateProfile(user.id, { shield_activated: false }).catch(() => {});
      await refreshProfile().catch(() => {});
    }
    router.replace('/(app)/home');
  };

  const handleDone = () => router.replace('/(app)/home');

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <LinearGradient
        colors={['#02100C', '#051A14', '#083028']}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        <View style={[success.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
          <View style={success.content}>
            {/* Shield glow */}
            <View style={success.glowWrap}>
              <View style={success.glow} />
              <ShieldIcon color={Colors.emerald400} size={80} />
            </View>

            <Text style={success.title}>Shield Active</Text>
            <Text style={success.sub}>
              Your content blocker is live. Every browser, every app — Kover Shield has you covered 24/7.
            </Text>
          </View>

          <KButton variant="earned" full onPress={handleDone}>
            ✓  Let's go
          </KButton>
        </View>
      </LinearGradient>
    );
  }

  // ── MANUAL DNS STEPS ──────────────────────────────────────────────────────
  if (state === 'manual') {
    return (
      <LinearGradient
        colors={['#0E3A2E', '#051A14', '#02100C']}
        locations={[0, 0.55, 1]}
        style={{ flex: 1 }}
      >
        <View style={[manual.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

          {/* Back button */}
          <TouchableOpacity style={manual.backBtn} onPress={() => setState('intro')}>
            <Text style={manual.backArrow}>←</Text>
          </TouchableOpacity>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={manual.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={manual.title}>
              {isIOS ? 'DNS Content Protection' : isAndroid ? 'Enable VPN Shield' : 'Enable Kover Shield'}
            </Text>
            <Text style={manual.sub}>
              {isIOS
                ? 'Blocks adult content system-wide — every browser, every app, every time.'
                : isAndroid
                  ? 'A local VPN filter that blocks content on-device. Your traffic never leaves your phone.'
                  : 'On your device, follow the steps below to activate Kover Shield.'}
            </Text>

            <View style={manual.card}>
              {isIOS ? (
                // ── iOS: NEDNSSettingsManager via Settings ────────────────────
                <>
                  <StepRow
                    num={1}
                    title="Open Settings"
                    label="Settings"
                    rowIcon="⚙️"
                    onPress={() => Linking.openURL('App-Prefs:root=General&path=Network/VPN')}
                  />
                  <StepRow
                    num={2}
                    title="Tap General"
                    label="General › VPN, DNS & Device"
                    sublabel="Scroll down if you don't see it"
                    rowIcon="ℹ️"
                  />
                  <StepRow
                    num={3}
                    title="Enable Kover Shield"
                    label="Kover Shield Protection"
                    sublabel="Tap it, then tap 'Allow' when prompted"
                    rowIcon="🛡️"
                    isLast
                  />
                </>
              ) : isAndroid ? (
                // ── Android: VpnService local TUN ────────────────────────────
                <>
                  <StepRow
                    num={1}
                    title="Allow VPN access"
                    label="Tap 'Allow' on the system prompt"
                    sublabel="Local-only — your traffic never leaves your device"
                    rowIcon="🔒"
                    onPress={handleActivate}
                  />
                  <StepRow
                    num={2}
                    title="Shield activates"
                    label="Kover Shield starts automatically"
                    sublabel="No further action needed"
                    rowIcon="🛡️"
                  />
                  <StepRow
                    num={3}
                    title="Stay protected"
                    label="Shield restarts after every reboot"
                    rowIcon="✅"
                    isLast
                  />
                </>
              ) : (
                // ── Web / simulator fallback ──────────────────────────────────
                <>
                  <StepRow num={1} title="Install on device" label="Shield requires iOS or Android" sublabel="Not available in the web preview" rowIcon="📱" />
                  <StepRow num={2} title="Build to device" label="npx expo run:ios --device" rowIcon="💻" />
                  <StepRow num={3} title="Tap 'I want Kover Shield'" label="Follow the on-device prompt" rowIcon="🛡️" isLast />
                </>
              )}
            </View>

            {/* Android: retry CTA to re-trigger VPN permission dialog */}
            {isAndroid && (
              <KButton variant="secondary" full loading={loading} onPress={handleActivate}>
                Re-trigger VPN Permission
              </KButton>
            )}

            <View style={manual.note}>
              <Text style={manual.noteText}>
                🔒 Kover Shield only filters DNS requests. Your browsing data is never seen or stored.
              </Text>
            </View>
          </ScrollView>

          <View style={manual.actions}>
            <KButton variant="primary" full onPress={handleManualDone}>
              ✓  Done
            </KButton>
            <KButton variant="text" full onPress={handleSkip}>
              Set Up Later
            </KButton>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // ── INTRO (+ activating) ──────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#02100C', '#051A14', '#0B3D32']}
      locations={[0, 0.45, 1]}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[intro.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={intro.header}>
          <View style={intro.shieldWrap}>
            <View style={intro.shieldGlow} />
            <ShieldIcon color={Colors.emerald500} size={64} />
          </View>
          <Text style={intro.title}>Kover Shield</Text>
          <View style={intro.badge}>
            <Text style={intro.badgeText}>24/7 PROTECTION</Text>
          </View>
        </View>

        {/* Feature card */}
        <View style={intro.card}>
          <FeatureRow
            icon="🔒"
            title="Can never be turned off"
            body="Blocks adult content across all browsers and every app on your device — even in private mode."
          />
          <View style={intro.divider} />
          <FeatureRow
            icon="🤚"
            title="Always-on blocking"
            body={isIOS
              ? 'Installed via iOS DNS settings — no VPN key icon, no battery drain, no gaps.'
              : isAndroid
                ? 'Uses a local VPN tunnel to filter DNS only. Your traffic never leaves your device.'
                : 'Available on iOS and Android — install on your device to activate.'}
          />
          <View style={intro.divider} />
          <FeatureRow
            icon="🛡️"
            title="Maximum protection"
            body="Configured by Kover on your behalf — no manual blocklist management needed."
          />
          <View style={intro.divider} />
          <FeatureRow
            icon="🙏"
            title="Remove device temptation option"
            body="Willpower can only get you so far. Kover Shield helps reduce the need for it."
          />
        </View>

        {/* CTA area */}
        <View style={intro.actions}>
          {/* DEV-only bypass — visible on emulator/Expo Go where VPN native
              module is unavailable. Tap this to skip to the home screen. */}
          {__DEV__ && (
            <TouchableOpacity style={intro.devBypass} onPress={handleSkip}>
              <Text style={intro.devBypassText}>
                ⚡ Skip Shield — Dev Testing Only
              </Text>
            </TouchableOpacity>
          )}

          <KButton
            variant="primary"
            full
            loading={loading || state === 'activating'}
            onPress={handleActivate}
          >
            🛡️  I want Kover Shield
          </KButton>
          <KButton variant="text" full onPress={handleSkip}>
            Set Up Later
          </KButton>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const intro = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.xl,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  shieldWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.emerald500,
    opacity: 0.12,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 34,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: Colors.emerald500 + '22',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.hairlineEmerald,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.emerald400,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.lg,
    gap: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.hairline,
  },
  actions: {
    gap: 12,
  },
  devBypass: {
    backgroundColor: '#F59E0B22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B88',
    paddingVertical: 12,
    alignItems: 'center',
  },
  devBypassText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
});

const manual = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgSurface2,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  backArrow: {
    fontSize: 18,
    color: Colors.fg2,
    lineHeight: 22,
  },
  scroll: {
    gap: 22,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.fg3,
    lineHeight: 23,
    marginTop: -10,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.lg,
    gap: 24,
  },
  note: {
    backgroundColor: Colors.emerald500 + '11',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairlineEmerald,
    padding: 14,
  },
  noteText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg3,
    lineHeight: 19,
  },
  actions: {
    gap: 12,
  },
});

const success = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 60,
  },
  glowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.emerald500,
    opacity: 0.18,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 36,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 32,
  },
  sub: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.fg3,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 320,
  },
});
