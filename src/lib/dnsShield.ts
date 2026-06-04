import { Platform, NativeModules } from 'react-native';
import { supabase } from './supabase';

const { KoverDNS } = NativeModules;

export interface ShieldStatus {
  isInstalled: boolean;
  isEnabled: boolean;
  platform: 'ios' | 'android' | 'unknown';
}

// Provision a NextDNS profile for the user via Supabase Edge Function
export async function provisionNextDNSProfile(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/provision-nextdns`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (!response.ok) return null;
    const { profile_id } = await response.json();
    return profile_id as string;
  } catch {
    return null;
  }
}

// iOS: Install DNS profile using NEDNSSettingsManager (via native module)
export async function installIOSDNSProfile(nextDNSProfileId: string): Promise<boolean> {
  if (Platform.OS !== 'ios' || !KoverDNS) return false;
  try {
    const result = await KoverDNS.installDNSProfile(nextDNSProfileId);
    return result === 'success';
  } catch {
    return false;
  }
}

// iOS: Check if profile is still enabled
export async function checkIOSProfileEnabled(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !KoverDNS) return true;
  try {
    return await KoverDNS.isProfileEnabled();
  } catch {
    return true;
  }
}

// Android: Start VPN service (via native module)
export async function startAndroidVPN(nextDNSProfileId: string): Promise<boolean> {
  if (Platform.OS !== 'android' || !KoverDNS) return false;
  try {
    const result = await KoverDNS.startVpnService(nextDNSProfileId);
    return result === 'success';
  } catch {
    return false;
  }
}

// Android: Check if VPN service is running
export async function checkAndroidVPNActive(): Promise<boolean> {
  if (Platform.OS !== 'android' || !KoverDNS) return true;
  try {
    return await KoverDNS.isVpnActive();
  } catch {
    return true;
  }
}

export async function getShieldStatus(): Promise<ShieldStatus> {
  const platform = Platform.OS as 'ios' | 'android';

  if (platform === 'ios') {
    const isEnabled = await checkIOSProfileEnabled();
    return { isInstalled: isEnabled, isEnabled, platform };
  } else if (platform === 'android') {
    const isActive = await checkAndroidVPNActive();
    return { isInstalled: isActive, isEnabled: isActive, platform };
  }

  return { isInstalled: false, isEnabled: false, platform: 'unknown' };
}

export async function activateShield(nextDNSProfileId: string): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return installIOSDNSProfile(nextDNSProfileId);
  } else if (Platform.OS === 'android') {
    return startAndroidVPN(nextDNSProfileId);
  }
  return false;
}

export async function logBlockerEvent(
  userId: string,
  eventType: 'activated' | 'disabled' | 're-enabled',
) {
  await supabase.from('blocker_events').insert({
    user_id: userId,
    event_type: eventType,
    platform: Platform.OS,
  });

  if (eventType === 'activated') {
    await supabase.from('profiles').update({
      blocker_activated_at: new Date().toISOString(),
    }).eq('id', userId);
  }
}
