import { create } from 'zustand';
import { CustomerInfo } from 'react-native-purchases';
import { getCustomerInfo, hasActiveEntitlement, syncSubscriptionStatus } from '../lib/purchases';

interface SubscriptionState {
  isActive: boolean;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;

  load: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isActive: false,
  customerInfo: null,
  isLoading: true,

  load: async (userId) => {
    set({ isLoading: true });
    try {
      const info = await getCustomerInfo();
      const isActive = hasActiveEntitlement(info);
      set({ customerInfo: info, isActive, isLoading: false });
      await syncSubscriptionStatus(userId);
    } catch {
      set({ isLoading: false });
    }
  },

  refresh: async (userId) => {
    try {
      const info = await getCustomerInfo();
      const isActive = hasActiveEntitlement(info);
      set({ customerInfo: info, isActive });
      await syncSubscriptionStatus(userId);
    } catch {}
  },
}));
