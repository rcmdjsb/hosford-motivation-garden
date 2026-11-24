/**
 * Hosford Motivation Garden — Station Definitions & State Persistence
 */

export const STORAGE_KEY = 'hosford_motivation_garden_v1';

export const PALETTE = {
  navyMidnight: 0x061a22,
  slateTeal: 0x092631,
  slateMid: 0x0f3847,
  primaryTeal: 0x1f7a99,
  cyanGlow: 0x7cc9e8,
  whiteCrisp: 0xffffff,
  hex: {
    navyMidnight: '#061A22',
    slateTeal: '#092631',
    primaryTeal: '#1F7A99',
    cyanGlow: '#7CC9E8',
    whiteCrisp: '#FFFFFF',
  },
};

export const FOUNTAIN = {
  id: 'fountain',
  name: 'Central Fountain',
  shortName: 'Fountain',
  subtitle: 'Garden Blueprint Sanctuary',
  position: { x: 0, y: 0, z: 0 },
  travelPos: { x: 0, y: 1.75, z: 9.2 },
  lookAt: { x: 0, y: 1.5, z: 0 },
  interactionRadius: 6.8,
  collisionRadius: 4.1,
};

export const STATIONS = [
  {
    id: 'observatory',
    zoneNumber: 1,
    name: 'Observatory Overlook',
    shortName: 'Observatory',
    theme: 'Curiosity & Exploration',
    axisLabel: 'Curiosity',
    icon: '✦',
    position: { x: -15, y: 0, z: -15 },
    travelPos: { x: -9.5, y: 1.75, z: -9.5 },
    lookAt: { x: -15, y: 2.1, z: -15 },
    treeOffset: { x: 3.1, z: -2.4 },
    interactionRadius: 8.6,
    collisionRadius: 2.8,
    fuelLabel: 'Curiosity Fuel',
    fuelDescription: 'How energized do you feel about exploring new ideas and figuring things out?',
    habits: [
      "Ask 'Why?' or 'How?' when stuck instead of quitting",
      'Explore topics beyond the minimum rubric',
      'Turn boring assignments into personal challenges',
    ],
    prompt:
      'What is one topic or skill you are genuinely curious to figure out before high school?',
    placeholder:
      'Example: I want to figure out how music production or coding works so I can make my own projects...',
    guide: {
      name: 'Nova the Twilight Owl',
      species: 'owl',
      emoji: '🦉',
      role: 'Curiosity Guide',
      voicePitch: 1.15,
      lines: [
        "Hoo-hoo! Welcome to Observatory Overlook! The brightest learners aren't the ones who already know everything—they're the ones who ask 'Why?' and keep exploring.",
        "Stuck on a confusing assignment? Treat it like a mystery to solve instead of a wall. One curious question can flip the whole problem open!",
        "Tip: You can also tilt your view up at the twilight stars above me to watch real stories of curious minds like Marie Curie and Katherine Johnson.",
      ],
      litLines: [
        "Hoo-hoo! You lit the Observatory lantern! Look at that glowing crystal tree blooming beside us—keep following your curiosity all the way to high school!",
        "Whenever a class feels boring, remember the habit you planted here and turn it into your own mini-challenge!",
      ],
    },
  },
  {
    id: 'hearthfire',
    zoneNumber: 2,
    name: 'Hearthfire Pavilion',
    shortName: 'Hearthfire',
    theme: 'Family Pride',
    axisLabel: 'Family Pride',
    icon: '◈',
    position: { x: 15, y: 0, z: -15 },
    travelPos: { x: 9.5, y: 1.75, z: -9.5 },
    lookAt: { x: 15, y: 2.1, z: -15 },
    treeOffset: { x: 2.5, z: 3.1 },
    interactionRadius: 8.6,
    collisionRadius: 2.9,
    fuelLabel: 'Family-Pride Fuel',
    fuelDescription: 'How strongly does making your family or support circle proud motivate you right now?',
    habits: [
      'Show up consistently even on low-energy days',
      "Share a win or piece of work I'm proud of with someone who cares about me",
      'Keep my word on deadlines and responsibilities',
    ],
    prompt:
      'Who in your family or corner would be proud seeing you succeed in high school, and why?',
    placeholder:
      'Example: My older sister and mom work super hard for me, and I want them to see me thriving...',
    guide: {
      name: 'Koda the Hosford Husky',
      species: 'husky',
      emoji: '🐺',
      role: 'Family Pride Guide',
      voicePitch: 1.0,
      lines: [
        "Woof! Hey fellow Husky! Welcome to Hearthfire Pavilion. Even on low-energy mornings, remembering who's in your corner can power your whole day.",
        "Your pack doesn't expect perfection—they love seeing you show up, keep your word, and share the work you're proud of!",
        "Ready to light the hearthfire? Press E or click the glowing beacon to plant a habit for the people cheering you on.",
      ],
      litLines: [
        "Awooo! Look at the Hearthfire glowing bright cyan! That crystal tree is standing tall—your pack and Hosford are proud of you!",
        "Keep showing up for yourself and the people who believe in you, one day at a time!",
      ],
    },
  },
  {
    id: 'horizon',
    zoneNumber: 3,
    name: 'Horizon Bridge',
    shortName: 'Horizon Bridge',
    theme: 'High School & College Readiness',
    axisLabel: 'Future Ready',
    icon: '⟡',
    position: { x: 15, y: 0, z: 15 },
    travelPos: { x: 9.5, y: 1.75, z: 9.5 },
    lookAt: { x: 15, y: 2.0, z: 15 },
    treeOffset: { x: -2.8, z: 3.0 },
    interactionRadius: 8.6,
    collisionRadius: 3.0,
    fuelLabel: 'Future-Readiness Fuel',
    fuelDescription: 'How ready and motivated do you feel to step into high school and future goals?',
    habits: [
      "Use a planner/checklist to track assignments before they're late",
      'Email or talk to teachers early when I need help',
      'Break big projects into small chunks instead of cramming',
    ],
    prompt:
      'What is one high school habit you want to master this year so freshman year feels easier?',
    placeholder:
      'Example: I want to check my planner every afternoon so big essays never sneak up on me...',
    guide: {
      name: 'Atlas the Silver Stag',
      species: 'stag',
      emoji: '🦌',
      role: 'Future-Readiness Guide',
      voicePitch: 0.88,
      lines: [
        "Welcome to Horizon Bridge. High school might feel like a huge leap, but every big bridge is crossed one steady step at a time.",
        "Future-ready students don't wait until the night before a due date—they use checklists, break projects into small pieces, and ask teachers early.",
        "Step up to the gateway and press E or click the beacon to pick one habit that will make freshman year feel smoother.",
      ],
      litLines: [
        "Horizon Bridge is shining bright! Every small habit you practice this year builds a stronger bridge to high school and beyond.",
        "Steady steps beat last-minute cramming every single time—you've got this!",
      ],
    },
  },
  {
    id: 'maverick',
    zoneNumber: 4,
    name: 'Maverick Grove',
    shortName: 'Maverick Grove',
    theme: 'Thinking for Yourself',
    axisLabel: 'Independence',
    icon: '❖',
    position: { x: -15, y: 0, z: 15 },
    travelPos: { x: -9.5, y: 1.75, z: 9.5 },
    lookAt: { x: -15, y: 2.0, z: 15 },
    treeOffset: { x: -3.0, z: -2.6 },
    interactionRadius: 8.6,
    collisionRadius: 2.8,
    fuelLabel: 'Independent-Thinking Fuel',
    fuelDescription: 'How confident do you feel trusting your own voice and making your own choices in class?',
    habits: [
      'Back up my opinions with real evidence',
      'Focus on my own goals instead of following distractions in class',
      'Question information and check sources before believing them',
    ],
    prompt:
      'When do you feel most confident thinking for yourself in school?',
    placeholder:
      'Example: When I research both sides of a debate topic and can explain my reasoning clearly...',
    guide: {
      name: 'Vega the Twilight Fox',
      species: 'fox',
      emoji: '🦊',
      role: 'Independent-Thinking Guide',
      voicePitch: 1.08,
      lines: [
        "Hey there, trailblazer! Welcome to Maverick Grove. It takes real courage in middle school to follow your own compass instead of the loudest distraction.",
        "Sharp thinkers double-check sources, back up their ideas with real evidence, and stay locked in on their own goals.",
        "Ready to claim your independence? Press E or click the beacon to plant your habit and light Maverick Grove!",
      ],
      litLines: [
        "Brilliant! Maverick Grove is illuminated! Trust your voice, check the facts, and keep forging your own trail.",
        "If all 4 shrines are glowing, head to the Central Fountain to unlock your full Garden Blueprint Card!",
      ],
    },
  },
];

/**
 * Sky of Stories — Motivational Quotes, Videos & True Stories of Overcoming Challenges
 * Placed overhead in the twilight sky dome (azimuth in degrees, elevation in degrees).
 */
export const SKY_INSPIRATIONS = [
  // --- MOTIVATIONAL QUOTES ---
  {
    id: 'quote-jordan',
    type: 'quote',
    typeLabel: 'Motivational Quote',
    icon: '✦',
    shortLabel: 'Michael Jordan',
    title: 'Missed Shots Build Champions',
    person: 'Michael Jordan',
    role: '6x NBA Champion & Olympic Gold Medalist',
    theme: 'High School & College Readiness',
    azimuthDeg: -22,
    elevationDeg: 40,
    youtubeId: '45mMioJ5szc',
    videoTitle: 'Michael Jordan — "Failure" (1997)',
    duration: '1 min',
    quote:
      "I've missed more than 9,000 shots in my career. I've lost almost 300 games. Twenty-six times, I've been trusted to take the game-winning shot and missed. I've failed over and over and over again in my life. And that is why I succeed.",
    backstory:
      'As a high school sophomore, Michael Jordan was cut from his varsity basketball team. Instead of quitting, he woke up at 6 a.m. every morning before class to shoot hundreds of jump shots and turn disappointment into daily discipline.',
    takeaway:
      'A tough quiz or a setback is data, not a final verdict—use it to decide what to practice next.',
  },
  {
    id: 'quote-curie',
    type: 'quote',
    typeLabel: 'Motivational Quote',
    icon: '✦',
    shortLabel: 'Marie Curie',
    title: 'Replace Fear With Curiosity',
    person: 'Marie Curie',
    role: 'Physicist & First Person to Win Two Nobel Prizes',
    theme: 'Curiosity & Exploration',
    azimuthDeg: -102,
    elevationDeg: 44,
    youtubeId: 'w6JFRi0Qm_s',
    videoTitle: 'TED-Ed: The Genius of Marie Curie',
    duration: '5 min',
    quote:
      'Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.',
    backstory:
      'Growing up when universities in her country barred women from enrolling, Marie Curie studied in secret underground classes, worked for years to pay for college in Paris, and discovered two chemical elements.',
    takeaway:
      'When a subject feels intimidating, ask one honest question about how it works—curiosity shrinks fear.',
  },
  {
    id: 'quote-malala',
    type: 'quote',
    typeLabel: 'Motivational Quote',
    icon: '✦',
    shortLabel: 'Malala Yousafzai',
    title: 'The Power of Your Own Voice',
    person: 'Malala Yousafzai',
    role: 'Education Advocate & Youngest Nobel Prize Laureate',
    theme: 'Thinking for Yourself',
    azimuthDeg: 132,
    elevationDeg: 42,
    youtubeId: '3rNhZu3ttIU',
    videoTitle: 'Malala Yousafzai Addresses the United Nations Youth Assembly',
    duration: '17 min',
    quote:
      'One child, one teacher, one book, one pen can change the world.',
    backstory:
      'When girls in her hometown were banned from attending school, Malala kept writing and speaking up for the right to learn—surviving an attack at age 15 and going on to graduate from Oxford and build schools worldwide.',
    takeaway:
      'Never underestimate what happens when you think independently and stand up for your own learning.',
  },
  {
    id: 'quote-mandela',
    type: 'quote',
    typeLabel: 'Motivational Quote',
    icon: '✦',
    shortLabel: 'Nelson Mandela',
    title: 'Until It Is Done',
    person: 'Nelson Mandela',
    role: 'Anti-Apartheid Leader & Former President of South Africa',
    theme: 'Family Pride',
    azimuthDeg: 58,
    elevationDeg: 46,
    youtubeId: 'R9_MUt-cwtE',
    videoTitle: 'Nelson Mandela — Mini Biography',
    duration: '4 min',
    quote: "It always seems impossible until it's done.",
    backstory:
      'Even during 27 years in prison, Nelson Mandela kept studying, mentoring fellow prisoners, and holding onto hope for his family and community—eventually leading his nation to democracy.',
    takeaway:
      'Big goals—like thriving in high school—always look huge from the starting line. Focus on the next small step.',
  },

  // --- RESILIENCE & MOTIVATION VIDEOS ---
  {
    id: 'video-famous-failures',
    type: 'video',
    typeLabel: 'Motivation Video',
    icon: '▶',
    shortLabel: 'Famous Failures',
    title: 'Famous Failures Before Success',
    person: 'Real-World Icons (3 min)',
    role: 'Short Video • Overcoming Rejection',
    theme: 'High School & College Readiness',
    azimuthDeg: 14,
    elevationDeg: 38,
    youtubeId: 'zLYECIjmnQs',
    duration: '3 min',
    summary:
      'Before becoming legends, Michael Jordan was cut from his high school team, Lionel Messi was told he was too small, Oprah Winfrey was demoted on TV, and Walt Disney was fired for "lacking imagination."',
    takeaways: [
      'Almost every successful person hits walls and rejections early on.',
      'Being told "no" once does not decide your future—what you do next does.',
      '"If you\'ve never failed, you\'ve never tried anything new."',
    ],
  },
  {
    id: 'video-grit',
    type: 'video',
    typeLabel: 'Motivation Video',
    icon: '▶',
    shortLabel: 'Angela Duckworth: Grit',
    title: 'Grit: The Power of Passion & Perseverance',
    person: 'Angela Lee Duckworth • TED Talk (6 min)',
    role: 'Former 7th-Grade Math Teacher & Psychologist',
    theme: 'High School & College Readiness',
    azimuthDeg: 95,
    elevationDeg: 40,
    youtubeId: 'H14bBuluwB8',
    duration: '6 min',
    summary:
      'After years of teaching 7th-grade math, Angela Duckworth noticed her strongest learners were not always the students with the highest test scores—they were the students with grit: sticking with hard challenges day after day.',
    takeaways: [
      'Talent is not the same as effort; sticking with your goals matters more over time.',
      'School and life are marathons, not sprints—consistency beats last-minute cramming.',
      'You can build grit by pairing growth mindset with daily habits.',
    ],
  },
  {
    id: 'video-power-of-yet',
    type: 'video',
    typeLabel: 'Motivation Video',
    icon: '▶',
    shortLabel: 'Carol Dweck: "Not Yet"',
    title: 'The Power of Believing That You Can Improve',
    person: 'Carol Dweck • TED Talk (10 min)',
    role: 'Stanford Psychologist & Growth Mindset Researcher',
    theme: 'Curiosity & Exploration',
    azimuthDeg: -145,
    elevationDeg: 40,
    youtubeId: '_X0mgOOSpLU',
    duration: '10 min',
    summary:
      'Carol Dweck shares a high school that replaced failing grades with "Not Yet"—and explains how believing your brain grows from struggle changes how you handle tough classes.',
    takeaways: [
      'Saying "I can\'t do this YET" keeps your brain on a learning curve instead of shutting down.',
      'Every time you push out of your comfort zone, your brain forms stronger neural connections.',
      'Praise effort, strategy, and asking for help—not just getting things right on the first try.',
    ],
  },

  // --- TRUE STORIES OF OVERCOMING CHALLENGES ---
  {
    id: 'story-jose-hernandez',
    type: 'story',
    typeLabel: 'Story of Resilience',
    icon: '★',
    shortLabel: 'José Hernández',
    title: '11 Rejections Before Orbit',
    person: 'José Hernández',
    role: 'Migrant Farmworker’s Son Turned NASA Astronaut',
    theme: 'Family Pride',
    azimuthDeg: -60,
    elevationDeg: 48,
    youtubeId: 'J-HcUuiLzR8',
    videoTitle: 'A Million Miles Away — José Hernández’s True Story (Official Trailer)',
    duration: '3 min',
    challenge:
      'Growing up moving between California farms with his family, José did not learn to speak English until age 12. Even after earning an engineering degree, NASA rejected his astronaut application 11 times in a row.',
    turningPoint:
      'After each rejection, José asked what skills successful astronauts had that he was missing—so he learned to scuba dive, earned a pilot license, and studied Russian while working full time.',
    breakthrough:
      'On his 12th try, NASA selected him. In 2009, he flew aboard Space Shuttle Discovery and looked down at Earth carrying his family’s pride with him.',
    takeaway:
      'Ask for feedback after a setback and build one missing skill at a time—persistence compounds.',
  },
  {
    id: 'story-katherine-johnson',
    type: 'story',
    typeLabel: 'Story of Resilience',
    icon: '★',
    shortLabel: 'Katherine Johnson',
    title: 'Calculating Paths to the Moon',
    person: 'Katherine Johnson',
    role: 'NASA Mathematician • Presidential Medal of Freedom',
    theme: 'Curiosity & Exploration',
    azimuthDeg: 174,
    elevationDeg: 48,
    youtubeId: 'dm2J75VfNVk',
    videoTitle: 'The Woman Who Put Us in Space — The Story of Katherine Johnson',
    duration: 'Documentary',
    challenge:
      'Katherine loved counting everything as a kid, but her town had no high school for Black students—and later at NASA, women were told they were not allowed into top engineering briefings.',
    turningPoint:
      'Her family moved towns so she could finish high school, and at NASA she politely asked, "Is there a law against me attending?"—then walked into the briefings and proved her math was unmatched.',
    breakthrough:
      'Astronaut John Glenn trusted her calculations so deeply he refused to launch into orbit until Katherine personally checked the electronic computer’s numbers. She also helped plot Apollo 11’s path to the Moon.',
    takeaway:
      'Curiosity paired with courage opens doors that other people assumed were locked.',
  },
  {
    id: 'story-lionel-messi',
    type: 'story',
    typeLabel: 'Story of Resilience',
    icon: '★',
    shortLabel: 'Lionel Messi',
    title: 'Turning "Too Small" Into Unstoppable',
    person: 'Lionel Messi',
    role: 'World Cup Champion & 8x Ballon d’Or Winner',
    theme: 'Thinking for Yourself',
    azimuthDeg: 28,
    elevationDeg: 58,
    youtubeId: '8Y8ao9BGxa4',
    videoTitle: 'Lionel Messi — The Greatest (Career Documentary)',
    duration: 'Mini-Doc',
    challenge:
      'At age 11, Messi was diagnosed with a growth hormone deficiency. Local clubs refused to pay for his medical treatments, and coaches doubted he would ever be big enough for competitive soccer.',
    turningPoint:
      'Instead of playing like bigger defenders, Messi mastered balance, quick feet, and vision—moving across the ocean to Barcelona at age 13 and leaning on his family’s belief when homesickness hit hard.',
    breakthrough:
      'Even after heartbreaking tournament losses early in his international career, he refused to quit and captained Argentina to the 2022 World Cup title.',
    takeaway:
      'What feels like a disadvantage in middle school can become your signature strength when you lean into your own style.',
  },
];

export function getSkyInspirationById(id) {
  return SKY_INSPIRATIONS.find((item) => item.id === id) || null;
}

export function createDefaultStationData() {
  return {
    fuel: 7,
    energyState: 'Running High', // 'Running High' | 'Battery Low'
    habit: '',
    reflection: '',
    completed: false,
    updatedAt: null,
  };
}

export function createDefaultState() {
  const stations = {};
  for (const station of STATIONS) {
    stations[station.id] = createDefaultStationData();
  }
  return {
    studentName: '',
    hasSeenWelcome: false,
    celebratedAll: false,
    exploredSkyIds: [],
    stations,
  };
}

export function loadState() {
  const fallback = createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const merged = createDefaultState();
    if (typeof parsed.studentName === 'string') {
      merged.studentName = parsed.studentName;
    }
    merged.hasSeenWelcome = Boolean(parsed.hasSeenWelcome);
    merged.celebratedAll = Boolean(parsed.celebratedAll);
    if (Array.isArray(parsed.exploredSkyIds)) {
      merged.exploredSkyIds = parsed.exploredSkyIds.filter((id) => typeof id === 'string');
    }
    if (parsed.stations && typeof parsed.stations === 'object') {
      for (const station of STATIONS) {
        const saved = parsed.stations[station.id];
        if (saved && typeof saved === 'object') {
          const fuelNum = Number(saved.fuel);
          merged.stations[station.id] = {
            fuel: Number.isFinite(fuelNum) ? Math.min(10, Math.max(1, Math.round(fuelNum))) : 7,
            energyState: saved.energyState === 'Battery Low' ? 'Battery Low' : 'Running High',
            habit: typeof saved.habit === 'string' ? saved.habit : '',
            reflection: typeof saved.reflection === 'string' ? saved.reflection : '',
            completed: Boolean(saved.completed),
            updatedAt: typeof saved.updatedAt === 'string' ? saved.updatedAt : null,
          };
        }
      }
    }
    return merged;
  } catch {
    return fallback;
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetState() {
  const fresh = createDefaultState();
  fresh.hasSeenWelcome = true;
  saveState(fresh);
  return fresh;
}

export function getStationById(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

export function getCompletedCount(state) {
  return STATIONS.reduce((count, station) => {
    return count + (state.stations[station.id]?.completed ? 1 : 0);
  }, 0);
}

export function isAllComplete(state) {
  return getCompletedCount(state) === STATIONS.length;
}

export function buildClassroomSummaryText(state) {
  const completedCount = getCompletedCount(state);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const lines = [
    '========================================',
    'HOSFORD MOTIVATION GARDEN — BLUEPRINT',
    '========================================',
  ];

  if (state.studentName && state.studentName.trim()) {
    lines.push(`Student: ${state.studentName.trim()}`);
  }
  lines.push(`Date: ${dateStr}`);
  lines.push(`Shrines Illuminated: ${completedCount} / ${STATIONS.length}`);
  lines.push('');
  lines.push('--- MOTIVATION FUEL SCORES ---');

  for (const station of STATIONS) {
    const data = state.stations[station.id];
    if (data.completed) {
      lines.push(
        `• ${station.theme} (${station.name}): ${data.fuel}/10 [${data.energyState}]`
      );
    } else {
      lines.push(`• ${station.theme} (${station.name}): Not yet completed`);
    }
  }

  lines.push('');
  lines.push('--- PLANTED HIGH SCHOOL READINESS HABITS & REFLECTIONS ---');

  for (const station of STATIONS) {
    const data = state.stations[station.id];
    lines.push('');
    lines.push(`Zone ${station.zoneNumber}: ${station.name} — ${station.theme}`);
    if (data.completed) {
      lines.push(`  Fuel: ${data.fuel}/10 (${data.energyState})`);
      lines.push(`  Planted Habit: ${data.habit || 'None selected'}`);
      lines.push(`  Prompt: ${station.prompt}`);
      lines.push(`  Reflection: ${data.reflection.trim() || '(No response entered)'}`);
    } else {
      lines.push('  Status: Shrine not illuminated yet.');
    }
  }

  lines.push('');
  lines.push('Created in the Hosford Motivation Garden');
  return lines.join('\n');
}
