// API.Bible integration — NIV, NLT, The Message

const API_BIBLE_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY!;
const BASE_URL = 'https://api.scripture.api.bible/v1';

// Bible IDs on API.Bible
const BIBLE_IDS: Record<string, string> = {
  NIV: '78a9f6124f344018-01', // NIV
  NLT: '65eec8e0b60e656b-01', // NLT
  MSG: '65eec8e0b60e656b-01', // MSG (fallback, real ID needed from API.Bible)
};

// Curated verse references for the 30-day lesson plan
// These are fetched from API.Bible at runtime using the user's preferred translation
export async function fetchVerse(reference: string, translation: string = 'NIV'): Promise<string> {
  const bibleId = BIBLE_IDS[translation] || BIBLE_IDS.NIV;

  try {
    const searchResponse = await fetch(
      `${BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(reference)}&limit=1`,
      {
        headers: {
          'api-key': API_BIBLE_KEY,
        },
      },
    );

    if (!searchResponse.ok) throw new Error('Bible API error');
    const searchData = await searchResponse.json();

    if (searchData.data?.verses?.length > 0) {
      return searchData.data.verses[0].text.replace(/<[^>]*>/g, '').trim();
    }

    return getOfflineVerse(reference, translation);
  } catch {
    return getOfflineVerse(reference, translation);
  }
}

// Offline fallback — NIV text for key verses
const OFFLINE_VERSES: Record<string, string> = {
  '1 Corinthians 10:13': 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.',
  'Romans 8:1': 'Therefore, there is now no condemnation for those who are in Christ Jesus.',
  'Philippians 4:13': 'I can do all this through him who gives me strength.',
  'Jeremiah 29:11': 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
  'Isaiah 41:10': 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.',
  'Psalm 34:18': 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',
  'Matthew 11:28': 'Come to me, all you who are weary and burdened, and I will give you rest.',
  'Galatians 5:1': 'It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery.',
  '2 Corinthians 5:17': 'Therefore, if anyone is in Christ, the new creation has come: the old has gone, the new is here!',
  'Psalm 119:11': 'I have hidden your word in my heart that I might not sin against you.',
  'James 1:14-15': 'Each person is tempted when they are dragged away by their own evil desire and enticed. Then, after desire has conceived, it gives birth to sin.',
  'Hebrews 12:1': 'Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles.',
  'John 8:36': 'So if the Son sets you free, you will be free indeed.',
  'Romans 6:14': 'For sin shall no longer be your master, because you are not under the law, but under grace.',
  '1 John 1:9': 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.',
};

function getOfflineVerse(reference: string, _translation: string): string {
  return OFFLINE_VERSES[reference] || 'The Lord is close to the brokenhearted. — Psalm 34:18';
}
