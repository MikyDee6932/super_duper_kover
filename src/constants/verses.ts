// 150+ verse mappings keyed by emotional state
// Used for SOS, Check-in contextual verses, and pre-caching

export type EmotionalState =
  | 'tempted'
  | 'anxious'
  | 'lonely'
  | 'ashamed'
  | 'hopeful'
  | 'grateful'
  | 'struggling'
  | 'victorious'
  | 'stressed'
  | 'bored'
  | 'heavy'
  | 'off'
  | 'okay'
  | 'calm'
  | 'strong'
  | 'default';

export interface VerseMapping {
  reference: string;
  text: string;
  state: EmotionalState;
}

export const VERSE_MAPPINGS: VerseMapping[] = [
  // Tempted
  { state: 'tempted', reference: '1 Corinthians 10:13', text: 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.' },
  { state: 'tempted', reference: 'James 4:7', text: 'Submit yourselves, then, to God. Resist the devil, and he will flee from you.' },
  { state: 'tempted', reference: 'Hebrews 4:15', text: 'For we do not have a high priest who is unable to empathize with our weaknesses, but we have one who has been tempted in every way, just as we are — yet he did not sin.' },
  { state: 'tempted', reference: 'Psalm 119:11', text: 'I have hidden your word in my heart that I might not sin against you.' },
  { state: 'tempted', reference: 'Romans 13:14', text: 'Rather, clothe yourselves with the Lord Jesus Christ, and do not think about how to gratify the desires of the flesh.' },
  { state: 'tempted', reference: '2 Timothy 2:22', text: 'Flee the evil desires of youth and pursue righteousness, faith, love and peace.' },
  { state: 'tempted', reference: 'Matthew 26:41', text: 'Watch and pray so that you will not fall into temptation. The spirit is willing, but the flesh is weak.' },
  { state: 'tempted', reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.' },

  // Anxious / Stressed
  { state: 'anxious', reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds.' },
  { state: 'anxious', reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.' },
  { state: 'anxious', reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.' },
  { state: 'anxious', reference: 'Matthew 6:34', text: 'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.' },
  { state: 'anxious', reference: 'Psalm 23:4', text: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me.' },
  { state: 'stressed', reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
  { state: 'stressed', reference: 'Psalm 55:22', text: 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.' },
  { state: 'stressed', reference: 'John 14:27', text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.' },

  // Lonely
  { state: 'lonely', reference: 'Psalm 34:18', text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.' },
  { state: 'lonely', reference: 'Hebrews 13:5', text: 'Never will I leave you; never will I forsake you.' },
  { state: 'lonely', reference: 'Isaiah 43:2', text: 'When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.' },
  { state: 'lonely', reference: 'Deuteronomy 31:6', text: 'Be strong and courageous. Do not be afraid or terrified, for the Lord your God goes with you; he will never leave you nor forsake you.' },
  { state: 'lonely', reference: 'Psalm 139:7-8', text: 'Where can I go from your Spirit? Where can I flee from your presence? If I go up to the heavens, you are there; if I make my bed in the depths, you are there.' },

  // Ashamed
  { state: 'ashamed', reference: 'Romans 8:1', text: 'Therefore, there is now no condemnation for those who are in Christ Jesus.' },
  { state: 'ashamed', reference: '1 John 1:9', text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.' },
  { state: 'ashamed', reference: 'Isaiah 1:18', text: 'Come now, let us settle the matter. Though your sins are like scarlet, they shall be as white as snow.' },
  { state: 'ashamed', reference: 'Psalm 103:12', text: 'As far as the east is from the west, so far has he removed our transgressions from us.' },
  { state: 'ashamed', reference: 'Lamentations 3:22-23', text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.' },
  { state: 'ashamed', reference: 'Romans 8:38-39', text: 'Neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God.' },
  { state: 'ashamed', reference: 'Micah 7:19', text: 'You will again have compassion on us; you will tread our sins underfoot and hurl all our iniquities into the depths of the sea.' },

  // Struggling / Heavy / Off
  { state: 'struggling', reference: 'Psalm 40:1-2', text: 'I waited patiently for the Lord; he turned to me and heard my cry. He lifted me out of the slimy pit, out of the mud and mire; he set my feet on a rock.' },
  { state: 'struggling', reference: '2 Corinthians 4:8-9', text: 'We are hard pressed on every side, but not crushed; perplexed, but not in despair; persecuted, but not abandoned; struck down, but not destroyed.' },
  { state: 'struggling', reference: 'Galatians 6:9', text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.' },
  { state: 'struggling', reference: 'Isaiah 40:29', text: 'He gives strength to the weary and increases the power of the weak.' },
  { state: 'struggling', reference: 'Psalm 30:5', text: 'Weeping may stay for the night, but rejoicing comes in the morning.' },
  { state: 'heavy', reference: 'Psalm 34:4', text: 'I sought the Lord, and he answered me; he delivered me from all my fears.' },
  { state: 'heavy', reference: 'Matthew 5:4', text: 'Blessed are those who mourn, for they will be comforted.' },
  { state: 'off', reference: 'Psalm 42:11', text: 'Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God.' },
  { state: 'off', reference: 'Lamentations 3:25', text: 'The Lord is good to those whose hope is in him, to the one who seeks him.' },

  // Bored
  { state: 'bored', reference: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.' },
  { state: 'bored', reference: 'Ephesians 5:15-16', text: 'Be very careful, then, how you live — not as unwise but as wise, making the most of every opportunity.' },
  { state: 'bored', reference: 'Proverbs 16:3', text: 'Commit to the Lord whatever you do, and he will establish your plans.' },

  // Hopeful
  { state: 'hopeful', reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
  { state: 'hopeful', reference: 'Romans 15:13', text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.' },
  { state: 'hopeful', reference: 'Psalm 62:5', text: 'Yes, my soul, find rest in God; my hope comes from him.' },
  { state: 'hopeful', reference: 'Hebrews 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
  { state: 'hopeful', reference: 'Romans 5:3-5', text: 'We also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope.' },

  // Grateful / Calm / Okay
  { state: 'grateful', reference: '1 Thessalonians 5:18', text: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.' },
  { state: 'grateful', reference: 'Psalm 100:4', text: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.' },
  { state: 'grateful', reference: 'Philippians 4:11', text: 'I have learned to be content whatever the circumstances.' },
  { state: 'calm', reference: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
  { state: 'calm', reference: 'Isaiah 26:3', text: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.' },
  { state: 'okay', reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.' },
  { state: 'okay', reference: 'Psalm 118:24', text: 'This is the day the Lord has made; we will rejoice and be glad in it.' },

  // Victorious / Strong
  { state: 'victorious', reference: 'Romans 8:37', text: 'No, in all these things we are more than conquerors through him who loved us.' },
  { state: 'victorious', reference: '1 John 5:4', text: 'For everyone born of God overcomes the world. This is the victory that has overcome the world, even our faith.' },
  { state: 'victorious', reference: 'Isaiah 40:31', text: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
  { state: 'strong', reference: 'Psalm 28:7', text: 'The Lord is my strength and my shield; my heart trusts in him, and he helps me.' },
  { state: 'strong', reference: 'Joshua 1:9', text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.' },
  { state: 'strong', reference: 'Ephesians 6:10', text: 'Finally, be strong in the Lord and in his mighty power.' },

  // Default / SOS emergency verses
  { state: 'default', reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.' },
  { state: 'default', reference: 'Psalm 34:18', text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.' },
  { state: 'default', reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.' },
  { state: 'default', reference: '1 Corinthians 10:13', text: 'No temptation has overtaken you except what is common to mankind. And God is faithful.' },
  { state: 'default', reference: 'Romans 8:1', text: 'There is now no condemnation for those who are in Christ Jesus.' },
  { state: 'default', reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
];

export const SOS_MOTIVATIONAL = [
  'You are not your urge. You are stronger than this moment.',
  'This feeling will pass. You have beaten it before.',
  'You are seen. You are loved. You are not alone in this.',
];

export function getVersesForState(state: EmotionalState): VerseMapping[] {
  const matches = VERSE_MAPPINGS.filter(v => v.state === state);
  return matches.length > 0
    ? matches
    : VERSE_MAPPINGS.filter(v => v.state === 'default');
}

export function getRandomVerse(state: EmotionalState): VerseMapping {
  const verses = getVersesForState(state);
  return verses[Math.floor(Math.random() * verses.length)];
}
