export interface OnboardingOption {
  id: string;
  label: string;
  desc?: string;
  icon?: string;
}

export interface OnboardingStep {
  id: string;
  type: 'single' | 'multi' | 'text' | 'celebration' | 'number';
  question?: string;
  subtitle?: string;
  options?: OnboardingOption[];
  placeholder?: string;
  field: string; // profile field key
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'gender',
    type: 'single',
    question: 'What is your gender?',
    subtitle: 'Help us get to know you better to build a personal plan and the best solution possible.',
    field: 'gender',
    options: [
      { id: 'male', label: 'Male', icon: '♂️' },
      { id: 'female', label: 'Female', icon: '♀️' },
    ],
  },
  {
    id: 'age',
    type: 'single',
    question: 'How old are you?',
    field: 'age_range',
    options: [
      { id: 'under_18', label: 'Under 18' },
      { id: '18_29', label: '18–29' },
      { id: '30_39', label: '30–39' },
      { id: '40_49', label: '40–49' },
      { id: '50_59', label: '50–59' },
      { id: '60_plus', label: '60+' },
    ],
  },
  {
    id: 'outcomes',
    type: 'multi',
    question: 'When you think about living your best, which of these outcomes excites you the most?',
    subtitle: 'Multiple selections are allowed.',
    field: 'outcomes',
    options: [
      { id: 'focus', label: 'Enhancing my focus and productivity throughout the day' },
      { id: 'control', label: 'Feeling more in control and confident about my life direction' },
      { id: 'relationships', label: 'Strong and deep relationships with family and friends' },
      { id: 'faith', label: 'Strong faith and feeling close to God daily' },
    ],
  },
  {
    id: 'relationship',
    type: 'single',
    question: "What's your relationship status?",
    field: 'relationship_status',
    options: [
      { id: 'single', label: 'Single', icon: '👤' },
      { id: 'dating', label: 'Dating', icon: '💑' },
      { id: 'married', label: 'Married', icon: '💍' },
      { id: 'common_law', label: 'Common-law', icon: '🏠' },
    ],
  },
  {
    id: 'faith',
    type: 'single',
    question: 'What is your faith denomination?',
    field: 'faith_denomination',
    options: [
      { id: 'protestant', label: 'Protestant' },
      { id: 'catholic', label: 'Catholic' },
      { id: 'other', label: 'Other' },
      { id: 'exploring', label: 'I am still exploring my faith and am not part of a specific denomination.' },
    ],
  },
  {
    id: 'bible_translation',
    type: 'single',
    question: 'What is your Bible translation preference?',
    field: 'bible_translation',
    options: [
      { id: 'NO_PREF', label: 'No preference', desc: 'Will default to The Message' },
      { id: 'NLT', label: 'New Living Translation (NLT)' },
      { id: 'NIV', label: 'New International Version (NIV)' },
      { id: 'MSG', label: 'The Message (MSG)' },
    ],
  },
  {
    id: 'frequency',
    type: 'single',
    question: 'How often do you view pornography?',
    field: 'porn_frequency',
    options: [
      { id: 'multiple_daily', label: 'Multiple times a day' },
      { id: 'once_daily', label: 'Once a day' },
      { id: 'few_weekly', label: 'A few times a week' },
      { id: 'less_weekly', label: 'Less than once a week' },
    ],
  },
  {
    id: 'days_clean',
    type: 'number',
    question: 'How many days since you last looked at porn?',
    field: 'days_since_clean',
    placeholder: '0',
  },
  {
    id: 'celebration',
    type: 'celebration',
    field: '_celebration',
  },
  {
    id: 'first_exposure',
    type: 'single',
    question: 'What age were you first exposed to porn?',
    field: 'first_exposure_age',
    options: [
      { id: '12_under', label: '12 or younger' },
      { id: '13_18', label: '13–18' },
      { id: '19_21', label: '19–21' },
      { id: '21_plus', label: '21 or older' },
    ],
  },
  {
    id: 'triggers',
    type: 'multi',
    question: 'What feelings trigger you to view porn?',
    subtitle: 'Select all that apply.',
    field: 'triggers',
    options: [
      { id: 'stress', label: 'Stress' },
      { id: 'boredom', label: 'Boredom' },
      { id: 'loneliness', label: 'Loneliness' },
      { id: 'anxiety', label: 'Anxiety' },
    ],
  },
  {
    id: 'goals',
    type: 'multi',
    question: 'What additional goals would you like to achieve with Kover?',
    subtitle: 'Select all that apply.',
    field: 'goals',
    options: [
      { id: 'fitness', label: 'Improve my fitness and physical health' },
      { id: 'mental', label: 'Enhance my mental well-being' },
      { id: 'sleep', label: 'Sleep better' },
      { id: 'focus', label: 'Improve my focus and productivity' },
      { id: 'relationships', label: 'Strengthen my relationships' },
      { id: 'faith', label: 'Build a strong faith in God' },
      { id: 'purpose', label: 'Find my purpose' },
      { id: 'hobbies', label: 'Explore new hobbies' },
      { id: 'energy', label: 'Boost my energy' },
      { id: 'eating', label: 'Healthy eating' },
    ],
  },
  {
    id: 'full_name',
    type: 'text',
    question: 'Final question — what should we call you?',
    subtitle: 'Your coach and daily lessons will use this name.',
    field: 'full_name',
    placeholder: 'Your first name',
  },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length; // 13 (includes celebration + name)
