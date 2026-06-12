/**
 * Local fallback lesson content used when:
 *  - The daily_lessons Supabase table is empty / not yet seeded
 *  - RLS blocks the query (no authenticated session)
 *  - Network is unavailable
 *
 * Covers days 1-30.  Each entry maps to a real scripture passage so the
 * offline verse cache in bible.ts already has the text.
 */

import type { DailyLesson } from '@/lib/supabase';

type FallbackLesson = Omit<DailyLesson, 'id' | 'verse_text_niv' | 'verse_text_msg'> & {
  verse_text_nlt: string;
};

const FALLBACK_DATA: FallbackLesson[] = [
  {
    day_number: 1,
    theme: 'Freedom',
    verse_reference: 'John 8:36',
    verse_text_nlt: 'So if the Son sets you free, you will be free indeed.',
    study_title: 'The Son Who Sets Free',
    study_content:
      'Jesus does not just offer freedom from external chains — He offers liberation at the deepest level of your soul. Pornography creates bonds that feel impossible to break, but Christ\'s freedom is absolute. Today, anchor your hope in this truth: your identity is not defined by your struggle. You are already declared free. Walk in that reality, one moment at a time.',
    journal_prompt:
      'What does real freedom look like in your daily life? Where do you feel most bound, and what would it mean to surrender that specific area to Christ today?',
    prayer_text:
      'Lord Jesus, You said that if the Son sets us free, we are free indeed. I claim that freedom right now. Break every chain of addiction and shame. Renew my mind with Your truth. Help me to walk in the liberty You purchased for me. I surrender my struggle to You today. Amen.',
  },
  {
    day_number: 2,
    theme: 'No Condemnation',
    verse_reference: 'Romans 8:1',
    verse_text_nlt: 'So now there is no condemnation for those who belong to Christ Jesus.',
    study_title: 'Released from the Courtroom',
    study_content:
      'Shame is one of pornography\'s most powerful tools. It whispers that you are too far gone, too broken, too dirty for God\'s love. But Romans 8:1 is a verdict declared from heaven: NO condemnation. The case against you was dismissed the moment Christ paid the penalty. Guilt can lead to repentance, but shame only leads back to the pit. When the accuser speaks, answer with this verse.',
    journal_prompt:
      'How has shame affected your relationship with God and others? Write a prayer releasing specific shame you have been carrying.',
    prayer_text:
      'Father, thank You that there is no condemnation for those in Christ Jesus. I reject the voice of shame and accept Your verdict of "not guilty." Cleanse my conscience and help me to stand before You with confidence, not because of my record, but because of Jesus. Amen.',
  },
  {
    day_number: 3,
    theme: 'Strength',
    verse_reference: 'Philippians 4:13',
    verse_text_nlt: 'For I can do everything through Christ, who gives me strength.',
    study_title: 'Strength for Today',
    study_content:
      'Paul wrote Philippians 4:13 from prison — not from a mountaintop victory lap. His strength was not the absence of hardship but the presence of Christ within hardship. Recovery is not about willpower. It is about plugging into a power source that never fails. When temptation comes today, you do not have to face it in your own strength. Ask Christ for the strength He has promised.',
    journal_prompt:
      'Think of a moment recently when you relied on your own strength. What would it look like to actively rely on Christ\'s strength instead in that situation?',
    prayer_text:
      'Lord, I confess I have tried to overcome this in my own power and failed. Today I receive Your strength. Fill me with the power of the Holy Spirit so that when temptation comes I will stand firm — not by might, not by power, but by Your Spirit. Amen.',
  },
  {
    day_number: 4,
    theme: 'Hope',
    verse_reference: 'Jeremiah 29:11',
    verse_text_nlt:
      '"For I know the plans I have for you," says the Lord. "They are plans for good and not for disaster, to give you a future and a hope."',
    study_title: 'A Future Worth Fighting For',
    study_content:
      'God spoke these words to Israel while they were in captivity in Babylon. He was not saying their situation was good — He was saying He had a plan that went beyond their current chains. You may feel captive to this addiction, but God\'s plans for you have not been cancelled. Every day you choose recovery is a day you are stepping toward that future. Your story is not over.',
    journal_prompt:
      'Describe the future you hope for — relationships, purpose, peace of mind. How does that vision motivate you today?',
    prayer_text:
      'God, I trust that You have a good plan for my life. Even when I cannot see the way forward, I trust Your hand is at work. Give me vision for the future You have prepared and the perseverance to walk toward it day by day. Amen.',
  },
  {
    day_number: 5,
    theme: 'Courage',
    verse_reference: 'Isaiah 41:10',
    verse_text_nlt:
      'Don\'t be afraid, for I am with you. Don\'t be discouraged, for I am your God. I will strengthen you and help you.',
    study_title: 'You Are Not Alone',
    study_content:
      'Fear and loneliness fuel addiction. The shame cycle thrives in isolation. But God promises His presence — not as a distant observer but as the God who strengthens and upholds. Many men return to pornography in moments of loneliness or stress. The antidote is the practiced awareness of God\'s nearness. Throughout today, pause and remind yourself: "I am not alone. God is with me right now."',
    journal_prompt:
      'What situations trigger feelings of loneliness or fear that push you toward unhealthy coping? How can awareness of God\'s presence change your response to those triggers?',
    prayer_text:
      'Lord, thank You that I am never alone. Even in my darkest moments, You are there. Strengthen me with Your presence. When fear or loneliness tempts me to turn to pornography, remind me to turn to You instead. You are enough. Amen.',
  },
];

// Days 6-30: cycle through the 5 core themes with adapted titles
const THEME_CYCLE: Array<Pick<FallbackLesson, 'theme' | 'verse_reference' | 'verse_text_nlt'>> = [
  { theme: 'Renewal',      verse_reference: '2 Corinthians 5:17', verse_text_nlt: 'This means that anyone who belongs to Christ has become a new person. The old life is gone; a new life has begun!' },
  { theme: 'The Word',     verse_reference: 'Psalm 119:11',       verse_text_nlt: 'I have hidden your word in my heart, that I might not sin against you.' },
  { theme: 'Temptation',   verse_reference: '1 Corinthians 10:13', verse_text_nlt: 'The temptations in your life are no different from what others experience. And God is faithful. He will not allow the temptation to be more than you can stand.' },
  { theme: 'Endurance',    verse_reference: 'Hebrews 12:1',       verse_text_nlt: 'Let us strip off every weight that slows us down, especially the sin that so easily trips us up. And let us run with endurance the race God has set before us.' },
  { theme: 'Grace',        verse_reference: 'Romans 6:14',        verse_text_nlt: 'Sin is no longer your master, for you no longer live under the requirements of the law. Instead, you live under the freedom of God\'s grace.' },
];

function buildCycleLesson(dayNumber: number): FallbackLesson {
  const cycle = THEME_CYCLE[(dayNumber - 6) % THEME_CYCLE.length];
  return {
    day_number: dayNumber,
    theme: cycle.theme,
    verse_reference: cycle.verse_reference,
    verse_text_nlt: cycle.verse_text_nlt,
    study_title: `Day ${dayNumber} — ${cycle.theme}`,
    study_content:
      `Today\'s focus is ${cycle.theme}. As you journey through recovery, each day is an opportunity to go deeper with God and build new patterns of thinking and living. Meditate on today\'s verse. Ask the Holy Spirit to make it real in your experience. Small, consistent steps forward accumulate into lasting transformation.`,
    journal_prompt:
      `Reflect on the theme of "${cycle.theme}" in your life today. Where do you see God at work? What is one practical step you can take this week to grow in this area?`,
    prayer_text:
      `Father, thank You for today\'s scripture and its truth about ${cycle.theme.toLowerCase()}. Apply this truth to my heart in a personal way today. I want to know You more deeply and walk in greater freedom. Lead me, guide me, strengthen me. In Jesus\' name, Amen.`,
  };
}

// Build the full 30-day map
const FALLBACK_MAP = new Map<number, FallbackLesson>();
FALLBACK_DATA.forEach((l) => FALLBACK_MAP.set(l.day_number, l));
for (let d = 6; d <= 30; d++) {
  if (!FALLBACK_MAP.has(d)) FALLBACK_MAP.set(d, buildCycleLesson(d));
}

/**
 * Returns local fallback content for a given lesson day.
 * Never returns null — falls back to day 1 content if day is out of range.
 */
export function getFallbackLesson(dayNumber: number): DailyLesson {
  const key = dayNumber >= 1 && dayNumber <= 30 ? dayNumber : 1;
  const raw = FALLBACK_MAP.get(key) ?? FALLBACK_MAP.get(1)!;
  return {
    id: `fallback-day-${raw.day_number}`,
    day_number: raw.day_number,
    verse_reference: raw.verse_reference,
    verse_text_nlt: raw.verse_text_nlt,
    verse_text_niv: raw.verse_text_nlt,
    verse_text_msg: raw.verse_text_nlt,
    study_title: raw.study_title,
    study_content: raw.study_content,
    prayer_text: raw.prayer_text,
    journal_prompt: raw.journal_prompt,
    theme: raw.theme,
  };
}
