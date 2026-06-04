import { create } from 'zustand';

export interface OnboardingAnswers {
  gender?: string;
  age_range?: string;
  outcomes?: string[];
  relationship_status?: string;
  faith_denomination?: string;
  bible_translation?: string;
  porn_frequency?: string;
  days_since_clean?: number;
  first_exposure_age?: string;
  triggers?: string[];
  goals?: string[];
  full_name?: string;
}

interface OnboardingStore {
  answers: OnboardingAnswers;
  setAnswer: (field: string, value: any) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  answers: {},
  setAnswer: (field, value) =>
    set((s) => ({ answers: { ...s.answers, [field]: value } })),
  reset: () => set({ answers: {} }),
}));
