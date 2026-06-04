import { useState, useEffect } from 'react';
import { fetchVerse } from '../lib/bible';
import { useAuthStore } from '../store/authStore';

interface VerseResult {
  reference: string;
  text: string;
  translation: string;
}

const DAILY_REFERENCES = [
  'John 8:36', 'Romans 8:1', 'Philippians 4:13', '1 Corinthians 10:13',
  'James 4:7', 'Psalm 119:11', '2 Corinthians 5:17', 'Romans 12:2',
  'Galatians 5:1', 'Isaiah 41:10', 'Psalm 34:18', '1 John 1:9',
  'Romans 6:14', 'Hebrews 4:15-16', 'Psalm 51:10', 'Matthew 11:28',
];

function getDailyReference(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_REFERENCES[dayOfYear % DAILY_REFERENCES.length];
}

export function useVerse(reference?: string) {
  const { profile } = useAuthStore();
  const [verse, setVerse] = useState<VerseResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const translation = profile?.bible_translation ?? 'NLT';
  const ref = reference ?? getDailyReference();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchVerse(ref, translation).then((text) => {
      if (!cancelled && text) {
        setVerse({ reference: ref, text, translation });
      }
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [ref, translation]);

  return { verse, isLoading };
}
