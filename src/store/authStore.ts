import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile, getProfile } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => {
    set({ session, user: session?.user || null });
  },

  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await getProfile(user.id);
    set({ profile });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  initialize: async () => {
    set({ isLoading: true });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const profile = await getProfile(session.user.id);
      set({ session, user: session.user, profile });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await getProfile(session.user.id);
        set({ session, user: session.user, profile });
      } else {
        set({ session: null, user: null, profile: null });
      }
    });

    set({ isLoading: false, isInitialized: true });
  },
}));
