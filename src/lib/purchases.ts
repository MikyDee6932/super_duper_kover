import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// RevenueCat API keys — set these after creating your RC account
const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_PLACEHOLDER';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_PLACEHOLDER';

// Product identifiers — must match App Store Connect + Play Console
export const PRODUCT_IDS = {
  MONTHLY: 'kover.monthly',       // $9.99/mo, no trial
  ANNUAL: 'kover.annual',         // $59.99/yr, no trial
  ANNUAL_TRIAL: 'kover.annual2',  // $34.99/yr, 3-day trial
  LIFETIME: 'kover.lifetime',     // $89.99 one-time, 7-day trial
} as const;

export const ENTITLEMENT_ID = 'kover_pro';

/**
 * Initialize RevenueCat on app startup.
 * Called immediately — before any user account exists.
 * RC generates an anonymous $RCAnonymousID automatically when no userId is passed.
 * After a Supabase anonymous session is created, call linkRevenueCatUser() to transfer.
 */
export function initializePurchases(userId?: string) {
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
  const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
  Purchases.configure({ apiKey, appUserID: userId });
}

/**
 * Link RevenueCat's anonymous purchase record to a known Supabase user ID.
 * Call this after supabase.auth.signInAnonymously() or signInWithIdToken() resolves.
 * RC transfers any existing purchase history to the new identity.
 */
export async function linkRevenueCatUser(userId: string): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch {
    return null;
  }
}

export async function getOfferings() {
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string; userCancelled?: boolean }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, userCancelled: true };
    }
    return { success: false, error: error.message };
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export function hasActiveEntitlement(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export async function syncSubscriptionStatus(userId: string) {
  try {
    const info = await Purchases.getCustomerInfo();
    const isActive = hasActiveEntitlement(info);
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];

    await supabase.from('profiles').update({
      subscription_status: isActive ? 'active' : 'expired',
      subscription_product: entitlement?.productIdentifier || null,
      subscription_expires_at: entitlement?.expirationDate || null,
    }).eq('id', userId);

    return isActive;
  } catch {
    return false;
  }
}
