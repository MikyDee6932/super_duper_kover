-- uuid-ossp not needed on PG15+ (gen_random_uuid is built-in)

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  -- Onboarding
  gender text,
  age_range text,
  outcomes text[],
  relationship_status text,
  faith_denomination text,
  bible_translation text default 'NLT',
  porn_frequency text,
  days_since_clean integer default 0,
  first_exposure_age text,
  triggers text[],
  goals text[],
  onboarding_completed boolean default false,
  referral_code_used text,
  conquer_date timestamptz,
  last_mood text,
  current_lesson_day integer default 1,
  -- Subscription
  subscription_status text default 'inactive',
  revenuecat_customer_id text,
  -- DNS Shield
  nextdns_profile_id text,
  shield_activated boolean default false,
  blocker_activated_at timestamptz,
  lockdown_enabled boolean default false,
  -- Push
  expo_push_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- STREAKS
-- ============================================================
create table if not exists streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  lesson_completed boolean default false,
  checkin_completed boolean default false,
  journal_completed boolean default false,
  sos_triggered boolean default false,
  lesson_progress integer default 0,
  unique(user_id, date)
);

alter table streaks enable row level security;
create policy "Users manage own streaks" on streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- SOS EVENTS
-- ============================================================
create table if not exists sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  emotional_state text,
  verse_shown text,
  action_taken text,
  duration_seconds integer,
  created_at timestamptz default now()
);

alter table sos_events enable row level security;
create policy "Users manage own sos_events" on sos_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id integer,
  prompt text,
  content text not null,
  mood text,
  ai_reflection text,
  created_at timestamptz default now()
);

alter table journal_entries enable row level security;
create policy "Users manage own journal_entries" on journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- CHECK-INS
-- ============================================================
create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  feeling text,
  note text,
  verse_shown text,
  created_at timestamptz default now()
);

alter table check_ins enable row level security;
create policy "Users manage own check_ins" on check_ins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  verse_used_in_session boolean default false,
  started_at timestamptz default now(),
  ended_at timestamptz
);

alter table chat_sessions enable row level security;
create policy "Users manage own chat_sessions" on chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;
create policy "Users manage own chat_messages" on chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- DAILY LESSONS
-- ============================================================
create table if not exists daily_lessons (
  id uuid primary key default gen_random_uuid(),
  day_number integer unique not null,
  verse_reference text not null,
  verse_text_niv text,
  verse_text_nlt text,
  verse_text_msg text,
  study_title text not null,
  study_content text not null,
  prayer_text text not null,
  journal_prompt text,
  theme text
);

-- Lessons are publicly readable
alter table daily_lessons enable row level security;
create policy "Lessons are readable by authenticated users" on daily_lessons
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- VERSE MAPPINGS
-- ============================================================
create table if not exists verse_mappings (
  id uuid primary key default gen_random_uuid(),
  emotional_state text not null,
  verse_reference text not null,
  verse_text text not null
);

alter table verse_mappings enable row level security;
create policy "Verse mappings readable by authenticated users" on verse_mappings
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- COACH MEMORY
-- ============================================================
create table if not exists coach_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  key text not null,
  value text,
  updated_at timestamptz default now(),
  unique(user_id, key)
);

alter table coach_memory enable row level security;
create policy "Users manage own coach_memory" on coach_memory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- BLOCKER EVENTS
-- ============================================================
create table if not exists blocker_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_type text not null check (event_type in ('activated', 'disabled', 're-enabled')),
  platform text,
  created_at timestamptz default now()
);

alter table blocker_events enable row level security;
create policy "Users manage own blocker_events" on blocker_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- SEED: 30 Daily Lessons
-- ============================================================
insert into daily_lessons (day_number, verse_reference, verse_text_nlt, study_title, study_content, prayer_text, journal_prompt, theme) values
(1, 'John 8:36', 'So if the Son sets you free, you are truly free.', 'You Were Made for Freedom', 'God created you not for bondage, but for freedom. The chains of pornography feel heavy and permanent — but they are not. Jesus declared freedom as your birthright, not a reward for perfect behavior. Today, receive that truth. You are not defined by what you''ve done or watched. You are defined by who God says you are: beloved, chosen, free.', 'Father, I receive Your truth today. I am not defined by my past. Set me free — truly free — as only You can. Amen.', 'What does freedom mean to you personally? What would your life look like if you were fully free?', 'Identity & Worth'),
(2, 'Romans 8:1', 'So now there is no condemnation for those who belong to Christ Jesus.', 'No Condemnation', 'Shame is one of the enemy''s most effective weapons. It whispers: you''re too far gone, God is disappointed, there''s no hope. But Romans 8:1 cuts through all of it. There is NO condemnation. Not a little. Not conditional. None. God does not look at you with disgust — He looks at you with the same love He had when He sent His Son. Shame drives you away from God. Grace pulls you toward Him.', 'God, silence the voice of shame in my life. I receive Your grace today. I belong to You. Amen.', 'Where does shame show up in your struggle? How does knowing there is no condemnation change how you see yourself?', 'Identity & Worth'),
(3, 'Philippians 4:13', 'For I can do everything through Christ, who gives me strength.', 'Strength Beyond Your Own', 'Paul wrote this from prison. He wasn''t talking about winning sports games — he was talking about enduring impossible circumstances through Christ. You don''t have to white-knuckle your way through recovery. The same resurrection power that raised Jesus lives in you. Today''s battle is real. But you are not fighting alone.', 'Lord, I admit I cannot do this in my own strength. Fill me with Yours. I lean on You today. Amen.', 'In what areas do you try to fight this battle alone? What would it look like to invite God''s strength in?', 'Identity & Worth'),
(4, '1 Corinthians 10:13', 'The temptations in your life are no different from what others experience. God is faithful. He will not allow the temptation to be more than you can stand. When you are tempted, he will show you a way out so that you can endure.', 'There Is Always a Way Out', 'God promises a way of escape. Not "maybe." Not "sometimes." Always. Today, ask God to show you what that escape route looks like in your specific situation. Is it a phone call? Walking outside? Opening your Bible? The way out is real — but you have to look for it.', 'God, open my eyes to see the way out when temptation comes. Give me the courage to take it. Amen.', 'What are your personal "ways out" when temptation hits? What has worked before?', 'Identity & Worth'),
(5, 'James 4:7', 'So humble yourselves before God. Resist the devil, and he will flee from you.', 'Resist and He Will Flee', 'Resistance is not passive. It is an active, faith-filled choice to submit to God and stand firm. The promise is clear: the enemy will flee. Not might. Will. Humility before God — admitting your need, your weakness — is the starting point. Pride says "I can handle this." Humility says "God, I need You."', 'I humble myself before You, Lord. I submit my struggle to You. I resist the enemy in the name of Jesus. Amen.', 'What does humility look like in your recovery? Where is pride keeping you stuck?', 'Identity & Worth'),
(6, 'Psalm 119:11', 'I have hidden your word in my heart, that I might not sin against you.', 'The Power of God''s Word', 'Scripture is not just information — it is a weapon. When Jesus was tempted in the wilderness, He responded with Scripture. The Word of God rewires our minds, fills the empty spaces where temptation grows, and gives us truth to stand on. Memorizing one verse changes your brain. It gives the Holy Spirit something to work with in your moments of weakness.', 'Lord, help me to store Your Word in my heart. Make it my first instinct in moments of temptation. Amen.', 'Which scripture has been most meaningful to you in this fight? Write it out from memory if you can.', 'Identity & Worth'),
(7, '2 Corinthians 5:17', 'This means that anyone who belongs to Christ has become a new person. The old life is gone; a new life has begun!', 'You Are Already New', 'The new creation is not a future promise — it is a present reality. The old you, defined by old patterns, old shame, old identity — that person is gone. You are already new. Recovery is not about becoming someone new; it is about walking in the newness you already have. Today, live as the new creation you already are.', 'Father, help me to live in my new identity today. The old is gone. I walk in newness of life. Amen.', 'How do you still live as if you are the "old" you? What would the "new creation" version of you do differently today?', 'Identity & Worth'),
(8, 'Romans 12:2', 'Don''t copy the behavior and customs of this world, but let God transform you into a new person by changing the way you think.', 'Renewing Your Mind', 'The battle for freedom is won or lost in the mind. Pornography creates deep neural pathways — and the good news is that those pathways can be rewired. Neuroplasticity is real. God said it thousands of years before neuroscience: renew your mind. New thoughts create new patterns. New patterns create new habits. New habits create a new life.', 'Transform my mind, Lord. Let every thought be taken captive. Renew me from the inside out. Amen.', 'What thought patterns keep pulling you back? What new thoughts do you want to replace them with?', 'Breaking Patterns'),
(9, '1 Corinthians 6:18-20', 'Run from sexual immorality... your body is the temple of the Holy Spirit... you were bought at a price.', 'Your Body Is a Temple', 'God took up residence in you. The same Spirit that raised Jesus from the dead lives in you. When you see your body as God''s temple — as something sacred and set apart — it changes how you treat it. You were bought at an enormous price. You have infinite worth. Live accordingly.', 'Holy Spirit, I invite You to fill every part of me. Help me to see my body as sacred and treat it as such. Amen.', 'How does knowing your body is the Holy Spirit''s temple change how you view your struggle?', 'Breaking Patterns'),
(10, 'Matthew 5:8', 'God blesses those whose hearts are pure, for they will see God.', 'The Pure Heart', 'Purity is not just the absence of sin — it is the presence of God. A pure heart sees God more clearly, hears His voice more easily, and experiences His presence more fully. Today, don''t just aim to avoid pornography. Aim for something bigger: a heart so filled with God that there is no room for anything else.', 'God, purify my heart. Not just to be clean, but to see You more clearly. That is what I want most. Amen.', 'What does purity mean to you beyond just "not watching porn"? Paint a picture of what a pure heart looks like in your daily life.', 'Breaking Patterns'),
(11, 'Proverbs 4:23', 'Guard your heart above all else, for it determines the course of your life.', 'Guard Your Heart', 'What we let into our hearts shapes everything. The feeds we scroll, the content we consume, the conversations we have — all of it is forming us. Guarding your heart is not paranoia; it is wisdom. Set up guardrails. Not because you don''t trust yourself — but because you value where you are going too much to leave the path unprotected.', 'Lord, help me to be wise about what I allow in. Give me the wisdom and discipline to guard my heart fiercely. Amen.', 'What are the biggest "inputs" in your life right now? Which ones are building you up? Which ones need to go?', 'Breaking Patterns'),
(12, 'Hebrews 12:1', 'Let us strip off every weight that slows us down, especially the sin that so easily trips us up. And let us run with endurance the race God has set before us.', 'Run With Endurance', 'Recovery is not a sprint. It is a marathon. The writer of Hebrews tells us to strip off the weights — the habits, the apps, the late nights, the isolation — that slow us down. Then run. Not crawl. Not limp. Run, with endurance. God has a race marked out for you. It''s worth running well.', 'Lord, help me to strip off everything that slows me down. I want to run well — with endurance and with my eyes on You. Amen.', 'What are the specific "weights" in your life right now that are slowing you down? What would it take to strip them off?', 'Breaking Patterns'),
(13, 'Galatians 6:2', 'Share each other''s burdens, and in this way obey the law of Christ.', 'You Were Not Made to Carry This Alone', 'Shame thrives in isolation. Recovery accelerates in community. The enemy wants you to believe that you are the only one struggling, that if anyone knew they would abandon you, that you must white-knuckle this alone. That is a lie. God designed us to carry each other''s burdens. Vulnerability is not weakness — it is the path to freedom.', 'Father, give me the courage to let someone in. Help me to be both vulnerable and trustworthy. Amen.', 'Who in your life could you share this struggle with? What is stopping you? What would it feel like to be fully known and fully loved at the same time?', 'Community & Accountability'),
(14, 'Proverbs 27:17', 'As iron sharpens iron, so a friend sharpens a friend.', 'Iron Sharpens Iron', 'Accountability is not about surveillance or shame — it is about sharpening. A good accountability partner asks hard questions not to police you but to help you become who you want to be. They celebrate your wins and hold space for your failures. They point you back to God when you forget who you are. Find your iron today.', 'Lord, bring the right people into my life. Help me to be vulnerable enough to let them in and humble enough to listen. Amen.', 'What qualities do you want in an accountability partner? Are there already people in your life who could fill this role?', 'Community & Accountability'),
(15, '1 John 1:9', 'But if we confess our sins to him, he is faithful and just to forgive us our sins and to cleanse us from all wickedness.', 'The Power of Confession', 'Confession is not about punishment — it is about restoration. When we bring our failures into the light, God''s faithfulness and justice work together to forgive and cleanse. Confession to a trusted brother or sister does the same thing horizontally. Secrets have power. Confession breaks that power. What needs to come into the light today?', 'God, give me the courage to confess what I have hidden. I trust Your faithfulness to forgive and restore. Amen.', 'What have you been hiding that needs to come into the light? Who could you confess to safely?', 'Community & Accountability'),
(16, 'Ecclesiastes 4:9-10', 'Two people are better off than one, for they can help each other succeed. If one person falls, the other can reach out and help.', 'Better Together', 'God''s design for humanity is relational. Two are better than one — not as a nice sentiment, but as a survival truth. In recovery, the person walking beside you may be the one who reaches down when you fall. You will also be the one who reaches down for them. The journey is better together.', 'Lord, I receive Your design for community. Help me to be a good friend and to allow others to be good friends to me. Amen.', 'Describe a time when someone helped you up after a fall. How did that feel? Who could you reach down and help right now?', 'Community & Accountability'),
(17, 'Matthew 18:20', 'For where two or three gather together as my followers, I am there among them.', 'God Shows Up in Community', 'When believers gather — even just two or three — Jesus is there. Recovery groups, accountability partnerships, small groups, honest conversations with a trusted friend: these are not just human support systems. They are places where God promises to show up. You don''t have to fight alone, and you don''t have to find God alone either.', 'Jesus, be present in my relationships. Show up in my conversations about this struggle. I invite You into every honest exchange. Amen.', 'What would it look like to create a "recovery community" — even just one other person — around your journey?', 'Community & Accountability'),
(18, 'Romans 15:7', 'Accept each other just as Christ has accepted you so that God will be given glory.', 'Radical Acceptance', 'Christ accepted you fully, not after you cleaned up your act, but while you were still broken. That same radical acceptance is what we extend to each other in community. No one in your recovery community should feel like they need to perform or hide. Real community — the kind that heals — is a safe place where people can be fully known and fully loved.', 'God, make me a safe person. Help me to extend the same radical acceptance I have received from You. Amen.', 'Do you feel fully accepted in your current communities? What would a truly safe community look like for you?', 'Community & Accountability'),
(19, 'Jeremiah 29:11', '"For I know the plans I have for you," says the Lord. "They are plans for good and not for disaster, to give you a future and a hope."', 'God Has a Plan for Your Life', 'Before the addiction. Before the shame. Before every failure — God had a plan for your life. And that plan has not been cancelled. It has not expired. Pornography addiction wants to tell you that your best days are behind you. God says your best days are ahead. His plans are good. His future for you is filled with hope. Today, choose to believe that.', 'Lord, I believe You have a plan for my life. Help me to walk toward it, one day at a time. Amen.', 'What do you believe God''s purpose and calling is for your life? How does freedom from pornography unlock that calling?', 'Purpose & Freedom'),
(20, 'Isaiah 61:1', 'The Spirit of the Sovereign Lord is upon me, for the Lord has anointed me to bring good news to the poor. He has sent me to comfort the brokenhearted and to proclaim that captives will be released and prisoners will be freed.', 'Freedom Is Your Calling', 'Jesus read these words in the synagogue and declared: "Today this scripture is fulfilled." He came to set captives free — including you. But notice: it is also your calling. The freedom you walk into becomes the testimony that sets others free. Your story matters not just for you, but for everyone who comes after you.', 'Lord, let the freedom I am walking into become a testimony that helps others. Use my story for Your glory. Amen.', 'If you were fully free from pornography, who would you want to help? How could your story impact others?', 'Purpose & Freedom'),
(21, 'Philippians 3:13-14', 'I focus on this one thing: Forgetting the past and looking forward to what lies ahead, I press on to reach the end of the race and receive the heavenly prize for which God, through Christ Jesus, is calling us.', '21 Days: Press On', 'Twenty-one days is significant. Research suggests habits begin to form around this mark. Paul''s advice: forget what lies behind, press on. Don''t camp out in your failures. Don''t pitch a tent in your victories either. Keep moving. The prize is ahead. Press on.', 'God, I press on today. I leave the past behind — the failures and the victories — and I run toward what is ahead. Amen.', 'How has the last 21 days changed you? What old habits or thought patterns have begun to shift? What is ahead that you are running toward?', 'Purpose & Freedom'),
(22, 'Romans 8:28', 'And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for him.', 'God Redeems Everything', 'Not some things. Everything. Even your addiction. Even your failures. Even the years you wish you could take back. God is a master redeemer. He does not waste your pain. He uses it, transforms it, and turns it into something that serves His good purpose. The mess of your past becomes the message of your future.', 'God, redeem my story. Take what the enemy meant for harm and use it for good. I trust You with all of it. Amen.', 'What parts of your story feel hardest to give to God? Can you believe He could redeem even those?', 'Purpose & Freedom'),
(23, 'Isaiah 43:18-19', '"But forget all that — it is nothing compared to what I am going to do. For I am about to do something new. See, I have already begun! Do you not see it?"', 'Something New Is Beginning', 'God is not finished with you. He is doing something new. Even now, in the middle of your process, something is being built. Something is being healed. Something is being prepared. Open your eyes to see it. The new thing God is doing may not look like what you expected — but it will be better.', 'God, open my eyes to see the new thing You are doing in my life. I choose expectation over discouragement today. Amen.', 'What new thing do you sense God doing in your life right now? Even small beginnings — name them.', 'Purpose & Freedom'),
(24, 'Psalm 23:3', 'He renews my strength. He guides me along right paths, bringing honor to his name.', 'He Restores and Guides', 'The Good Shepherd does not abandon broken sheep. He restores. He leads in right paths — not because you deserve it, but for His name''s sake. Your recovery brings glory to God. Every day you choose freedom is a testimony to His power. He is leading you. Trust the Shepherd.', 'Good Shepherd, lead me in right paths today. Where I have gone astray, bring me back. Restore me completely. Amen.', 'In what areas of your life do you need restoration? What would it feel like to be fully restored?', 'Purpose & Freedom'),
(25, 'Micah 7:8', 'Do not gloat over me, my enemies! For though I fall, I will rise again. Though I sit in darkness, the Lord will be my light.', 'When You Fall, Rise', 'Relapse is not the end. It is not proof that you cannot change. It is a stumble in a marathon, not a finish line. The righteous fall seven times and rise. The enemy wants you to believe that falling means you are done. God says: rise. The only failure in recovery is staying down.', 'Lord, when I fall, help me to rise. May I never interpret a stumble as permission to stop. You are my light in the dark. Amen.', 'How do you tend to respond when you fail? What does it look like to rise again with grace and determination instead of shame?', 'Purpose & Freedom'),
(26, '2 Timothy 1:7', 'For God has not given us a spirit of fear and timidity, but of power, love, and self-discipline.', 'Power, Love, and Self-Discipline', 'Fear drives us back to old patterns. Timidity keeps us stuck. But God''s Spirit in us is one of power — the same power that raised Jesus. It is one of love — which covers a multitude of sins. And it is one of self-discipline — the very thing recovery requires. You already have what you need. It is already inside you.', 'God, I receive Your spirit of power, love, and self-discipline today. Let it rise in me and overcome every fearful, timid voice. Amen.', 'Where does fear or timidity most affect your recovery? What would courage look like in those areas?', 'Purpose & Freedom'),
(27, 'Psalm 51:10', 'Create in me a clean heart, O God. Renew a loyal spirit within me.', 'The Prayer That Changes Everything', 'David wrote this after catastrophic failure. And yet — God called David a man after His own heart. Not because David never sinned, but because David always came back. Always sought restoration. Always prayed this prayer. You can pray it too. Right now. A clean heart is not something you achieve; it is something you receive.', 'Create in me a clean heart, O God. Renew a loyal spirit within me. I come to You with nothing but need. Amen.', 'Write out Psalm 51:10 in your own words as a personal prayer. What does a "clean heart" feel like to you?', 'Purpose & Freedom'),
(28, 'Ephesians 3:20', 'Now all glory to God, who is able, through his mighty power at work within us, to accomplish infinitely more than we might ask or think.', 'Immeasurably More', 'What you are asking God for — freedom, restored relationships, a new identity, a meaningful life — God can do infinitely more than that. The power at work in you is not limited by your failures, your history, or your doubts. It is the same power that created the universe. Dare to ask for more.', 'God, I dare to believe You can do immeasurably more than I am asking. I open my life to Your immeasurable power. Amen.', 'What is the biggest, most audacious prayer you have for your life post-recovery? Write it out. Do not hold back.', 'Purpose & Freedom'),
(29, 'Hebrews 10:23', 'Let us hold tightly without wavering to the hope we affirm, for God can be trusted to keep his promise.', 'Hold On to Hope', 'Hope is not wishful thinking. It is confident expectation based on the character of God. He keeps His promises. Every. Single. One. When doubt creeps in, when the journey feels long, when you wonder if freedom is really possible — hold tightly to hope. It is anchored in Someone who cannot lie.', 'Lord, I hold on to hope today. Not because I feel it, but because You are faithful. You keep Your promises. Amen.', 'What promises of God are you holding on to? Which ones have you been tempted to let go of? Re-receive them today.', 'Purpose & Freedom'),
(30, 'Revelation 12:11', 'And they have defeated him by the blood of the Lamb and by their testimony. And they did not love their lives so much that they were afraid to die.', 'Your Testimony Defeats the Enemy', 'Thirty days. You made it to day 30. Your story is a weapon. The blood of Jesus and your testimony together defeat the enemy. What you have walked through — the failures, the fights, the victories — it is all part of a story that overcomes. Tell it. Live it. Let it set others free.', 'Lord, I commit my testimony to You. Use my story. What I have walked through is not wasted. I am an overcomer. Amen.', 'Write out your testimony — where you started, what changed, where you are now. This is your story of freedom. Celebrate it.', 'Purpose & Freedom')
on conflict (day_number) do nothing;

-- ============================================================
-- SEED: Verse Mappings
-- ============================================================
insert into verse_mappings (emotional_state, verse_reference, verse_text) values
('tempted', '1 Corinthians 10:13', 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.'),
('tempted', 'James 4:7', 'Submit yourselves, then, to God. Resist the devil, and he will flee from you.'),
('tempted', 'Psalm 119:11', 'I have hidden your word in my heart that I might not sin against you.'),
('tempted', 'Hebrews 2:18', 'Because he himself suffered when he was tempted, he is able to help those who are being tempted.'),
('tempted', 'Matthew 26:41', 'Watch and pray so that you will not fall into temptation. The spirit is willing, but the flesh is weak.'),
('anxious', 'Philippians 4:6-7', 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.'),
('anxious', 'Isaiah 41:10', 'So do not fear, for I am with you; do not be dismayed, for I am your God.'),
('anxious', 'Psalm 34:18', 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.'),
('anxious', 'Matthew 11:28', 'Come to me, all you who are weary and burdened, and I will give you rest.'),
('anxious', '1 Peter 5:7', 'Cast all your anxiety on him because he cares for you.'),
('lonely', 'Joshua 1:9', 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.'),
('lonely', 'Psalm 68:6', 'God sets the lonely in families, he leads out the prisoners with singing.'),
('lonely', 'Romans 8:38-39', 'For I am convinced that neither death nor life... will be able to separate us from the love of God.'),
('lonely', 'Hebrews 13:5', 'Never will I leave you; never will I forsake you.'),
('lonely', 'John 15:15', 'I no longer call you servants... Instead, I have called you friends.'),
('ashamed', 'Romans 8:1', 'Therefore, there is now no condemnation for those who are in Christ Jesus.'),
('ashamed', '1 John 1:9', 'If we confess our sins, he is faithful and just and will forgive us our sins.'),
('ashamed', 'Isaiah 43:25', 'I, even I, am he who blots out your transgressions, for my own sake, and remembers your sins no more.'),
('ashamed', 'Psalm 103:12', 'As far as the east is from the west, so far has he removed our transgressions from us.'),
('ashamed', 'Micah 7:19', 'You will again have compassion on us; you will tread our sins underfoot and hurl all our iniquities into the depths of the sea.'),
('hopeful', 'Jeremiah 29:11', 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.'),
('hopeful', 'Romans 15:13', 'May the God of hope fill you with all joy and peace as you trust in him.'),
('hopeful', 'Lamentations 3:22-23', 'Because of the Lord''s great love we are not consumed, for his compassions never fail. They are new every morning.'),
('hopeful', 'Isaiah 40:31', 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles.'),
('grateful', 'Psalm 136:1', 'Give thanks to the Lord, for he is good. His love endures forever.'),
('grateful', '1 Thessalonians 5:18', 'Give thanks in all circumstances; for this is God''s will for you in Christ Jesus.'),
('grateful', 'Psalm 100:4-5', 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.'),
('struggling', 'Romans 8:26', 'In the same way, the Spirit helps us in our weakness.'),
('struggling', '2 Corinthians 12:9', 'My grace is sufficient for you, for my power is made perfect in weakness.'),
('struggling', 'Psalm 46:1', 'God is our refuge and strength, an ever-present help in trouble.'),
('struggling', 'Isaiah 40:29', 'He gives strength to the weary and increases the power of the weak.'),
('struggling', 'Matthew 11:28', 'Come to me, all you who are weary and burdened, and I will give you rest.'),
('victorious', 'Romans 8:37', 'No, in all these things we are more than conquerors through him who loved us.'),
('victorious', '1 Corinthians 15:57', 'But thanks be to God! He gives us the victory through our Lord Jesus Christ.'),
('victorious', 'Philippians 4:13', 'I can do all this through him who gives me strength.'),
('victorious', 'Revelation 12:11', 'They triumphed over him by the blood of the Lamb and by the word of their testimony.'),
('stressed', 'John 14:27', 'Peace I leave with you; my peace I give you. I do not give to you as the world gives.'),
('stressed', 'Psalm 55:22', 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.'),
('stressed', 'Matthew 6:34', 'Therefore do not worry about tomorrow, for tomorrow will worry about itself.'),
('bored', 'Ephesians 5:15-16', 'Be very careful, then, how you live — not as unwise but as wise, making the most of every opportunity.'),
('bored', 'Colossians 3:23', 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.'),
('bored', 'Proverbs 16:3', 'Commit to the Lord whatever you do, and he will establish your plans.'),
('heavy', 'Psalm 34:18', 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.'),
('heavy', 'Matthew 5:4', 'Blessed are those who mourn, for they will be comforted.'),
('heavy', 'Isaiah 61:3', 'He has sent me to comfort the brokenhearted... to give a crown of beauty for ashes.'),
('off', 'Lamentations 3:22-23', 'Because of the Lord''s great love we are not consumed, for his compassions never fail. They are new every morning.'),
('off', 'Psalm 30:5', 'Weeping may stay for the night, but rejoicing comes in the morning.'),
('okay', 'Psalm 23:1', 'The Lord is my shepherd, I lack nothing.'),
('okay', 'Philippians 4:11', 'I have learned, in whatever state I am, to be content.'),
('calm', 'Isaiah 26:3', 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.'),
('calm', 'Psalm 46:10', 'Be still, and know that I am God.'),
('strong', 'Joshua 1:9', 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you.'),
('strong', 'Ephesians 6:10', 'Finally, be strong in the Lord and in his mighty power.'),
('default', 'Psalm 103:2-4', 'Praise the Lord, my soul, and forget not all his benefits — who forgives all your sins and heals all your diseases.'),
('default', 'John 3:16', 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'),
('default', 'Romans 8:28', 'And we know that in all things God works for the good of those who love him.')
on conflict do nothing;
