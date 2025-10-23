import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Target,
  Route,
  Activity,
  PenLine,
  LifeBuoy,
  Clock,
  Flame,
  Zap,
  Trophy,
  Award,
  Sparkle,
  Wand2,
  Sparkles,
  Loader2,
  FileText,
  Wand
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AIInteraction, InteractionMode } from '../types';
import { LLMMessage, VerifiedSmilesBlock } from './LLMResponseBlocks';
import PriorKnowledgePanel from './PriorKnowledgePanel';
import PlanningMindMap from './PlanningMindMap';
import MonitoringDashboard from './MonitoringDashboard';
import ReflectionTimeline from './ReflectionTimeline';
import HelpHub from './HelpHub';
import type {
  AssessmentMode,
  CoachLogEntry,
  HelpChannel,
  HelpLevel,
  HelpRequest,
  MonitoringCheckin,
  PlanEdge,
  PlanLevel,
  PlanNode,
  PlanScenario,
  PriorKnowledgeSnapshot,
  ReflectionEntry,
  SrlPhase,
  PersistedSrlCoachState,
  SrlCoachMetrics
} from '../types/srlCoach';

const SRL_PHASES: Record<
  SrlPhase,
  { label: string; description: string; icon: LucideIcon; accent: string }
> = {
  goal: {
    label: 'Goal-Setting',
    description: 'Turn loose intentions into concrete SMART goals tailored to the current chemistry focus.',
    icon: Target,
    accent: 'text-amber-300'
  },
  plan: {
    label: 'Planning',
    description: 'Break goals into adaptive pathways that weave in MolView, NMR viewer, and practice loops.',
    icon: Route,
    accent: 'text-emerald-300'
  },
  monitor: {
    label: 'Self-Monitoring',
    description: 'Check in on confidence and progress with quick ratings and AI nudges that track growth.',
    icon: Activity,
    accent: 'text-sky-300'
  },
  reflect: {
    label: 'Reflection',
    description: 'Capture takeaways and translate insights into the next chemistry sprint.',
    icon: PenLine,
    accent: 'text-purple-300'
  },
  help: {
    label: 'Help-Seeking',
    description: 'Request scaffolds or hints at the right level so autonomy stays intact.',
    icon: LifeBuoy,
    accent: 'text-rose-300'
  }
};

const SRL_TOOL_OPTIONS = [
  { id: 'molview', label: 'MolView visualizations' },
  { id: 'nmrium', label: 'NMR viewer practice' },
  { id: 'quiz', label: 'Adaptive AI quizzes' },
  { id: 'lab', label: 'Virtual lab simulations' }
];

const SRL_PLAN_PREFERENCES = [
  { id: 'visual', label: 'Visual-first', description: 'Prioritize molecule renderings, orbitals, and reaction schematics.' },
  { id: 'practice', label: 'Problem-first', description: 'Lead with quizzes, worked examples, and NMR peak checks.' },
  { id: 'simulation', label: 'Simulation', description: 'Use virtual labs or quantum chemistry previews to probe mechanisms.' }
];

const SRL_REFLECTION_EMOTIONS = ['Curious', 'Confident', 'Unsure', 'Stretched', 'Motivated'];

const COACH_LOG_LIMIT = 8;
const COACH_STATE_STORAGE_KEY = 'chemcanvas-srl-state-v1';
const COACH_METRICS_STORAGE_KEY = 'chemcanvas-srl-metrics-v1';
const COACH_PRIVACY_STORAGE_KEY = 'chemcanvas-srl-privacy-opt';

const HELP_CHANNEL_LABEL: Record<HelpChannel, string> = {
  ai: 'AI hint',
  community: 'Community forum',
  tutor: 'Tutor session'
};

const HELP_FORECAST_COPY: Record<HelpChannel, string> = {
  ai: 'Expect a scaffolded hint within minutes. Reattempt once before escalating further.',
  community: 'Peers usually respond within a study day. Share a screenshot or molecule ID to accelerate help.',
  tutor: 'Book a 20-minute slot and bring one concrete question plus your attempted solution.'
};

const ASSESSMENT_MODE_LABEL: Record<AssessmentMode, string> = {
  quiz: 'Adaptive quiz',
  flashcards: 'Flash card sprint',
  sketch: 'Interactive sketch'
};

const ASSESSMENT_HIGHLIGHTS: Record<AssessmentMode, { strengths: string[]; improvements: string[] }> = {
  quiz: {
    strengths: ['Quick recall on foundational reactions', 'Agile pattern spotting under timed pressure'],
    improvements: ['Slow down on multi-step mechanisms', 'Revisit confuser questions with worked solutions']
  },
  flashcards: {
    strengths: ['Strong concept tagging across topics', 'Consistent spaced repetition rhythm'],
    improvements: ['Add more applied problem prompts', 'Mix in mechanism-oriented cards for balance']
  },
  sketch: {
    strengths: ['Creative molecule representations', 'Clear sequencing of key reaction moves'],
    improvements: ['Label intermediate states more clearly', 'Align sketches with reagent intent and outcomes']
  }
};

interface SrlMomentumLevel {
  min: number;
  label: string;
  vibe: string;
  gradient: string;
  icon: LucideIcon;
}

const SRL_MOMENTUM_LEVELS: SrlMomentumLevel[] = [
  {
    min: 0,
    label: 'Spark',
    vibe: 'You are just starting to warm up. Pick a quick win to ignite momentum!',
    gradient: 'from-slate-800 via-slate-900 to-slate-950',
    icon: Sparkle
  },
  {
    min: 30,
    label: 'Glow',
    vibe: 'Steady progress detected! Keep stacking mini victories.',
    gradient: 'from-blue-800 via-indigo-900 to-slate-950',
    icon: Wand2
  },
  {
    min: 55,
    label: 'Blaze',
    vibe: 'You are in flow - tough problems are fair game right now.',
    gradient: 'from-purple-800 via-fuchsia-700 to-slate-950',
    icon: Flame
  },
  {
    min: 80,
    label: 'Nova',
    vibe: 'Elite focus unlocked! Channel the energy into a stretch challenge.',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    icon: Zap
  }
];

interface SrlChallenge {
  id: string;
  title: string;
  description: string;
  phase: SrlPhase | 'wildcard';
}

const SRL_CHALLENGE_DECK: SrlChallenge[] = [
  {
    id: 'goal-hype',
    title: 'SMART Remix',
    description: 'Rewrite your current goal with a bold metric (time, score, or research milestone).',
    phase: 'goal'
  },
  {
    id: 'plan-lab',
    title: 'Virtual Lab Sprint',
    description: 'Schedule one simulation block and note the exact data you want to collect.',
    phase: 'plan'
  },
  {
    id: 'monitor-vibes',
    title: 'Confidence Pulse',
    description: 'Rate your confidence before and after a problem set and spot the biggest delta.',
    phase: 'monitor'
  },
  {
    id: 'reflect-story',
    title: 'Story Mode Reflection',
    description: "Write a 3-sentence comic strip of today's study arc (setup, conflict, win).",
    phase: 'reflect'
  },
  {
    id: 'help-swap',
    title: 'Swap-a-Hint',
    description: "Draft a hint you'd give a peer on the same problem, then request one back from the AI.",
    phase: 'help'
  },
  {
    id: 'wild-streak',
    title: 'Wildcard Momentum',
    description: 'Pick any phase you skipped this week and complete it in the next 10 minutes.',
    phase: 'wildcard'
  }
];

interface SrlBadge {
  id: string;
  label: string;
  description: string;
  threshold: number;
}

const SRL_BADGES: SrlBadge[] = [
  {
    id: 'starter-pack',
    label: 'Starter Spark',
    description: 'Log 3 coach actions in a single session.',
    threshold: 3
  },
  {
    id: 'balanced-brain',
    label: 'Balanced Brain',
    description: 'Complete at least one action in three different phases.',
    threshold: 3
  },
  {
    id: 'momentum-maker',
    label: 'Momentum Maker',
    description: 'Reach a momentum score of 60+.',
    threshold: 60
  },
  {
    id: 'streak-legend',
    label: 'Streak Legend',
    description: 'Hit a streak of 4 consecutive phases without repeats.',
    threshold: 4
  }
];

const SRL_HYPE_TIPS: Record<SrlPhase | 'wildcard', string[]> = {
  goal: [
    'Aim high: frame your goal as a mission briefing with one must-win objective.',
    'Add a reward: what will you do once the goal is done? Treat yourself!'
  ],
  plan: [
    'Map a momentum ladder: easy task -> chewy task -> boss fight.',
    'Swap mediums: mix diagrams, videos, and your own sketches to keep the plan fresh.'
  ],
  monitor: [
    'Overlay your feelings: rate confidence AND hype to see interesting mismatches.',
    "Snapshot a mistake: jot one misstep and how you'll trap it next time."
  ],
  reflect: [
    'Give future-you a breadcrumb - leave one thing you want to remember next time.',
    'Claim the win: name what skill level-up happened today.'
  ],
  help: [
    'State the block clearly: "I get stuck when..." so the AI can laser-focus help.',
    'Try a tiered escalation: self-remedy -> AI hint -> peer check -> instructor ping.'
  ],
  wildcard: [
    'Mix it up: try a mini whiteboard sprint or record a 2-minute audio recap.',
    'Gamify the next 10 minutes - treat it like a timed escape room puzzle.'
  ]
};

const pickRandom = <T,>(items: T[]): T | null => {
  if (!items.length) {
    return null;
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
};

const pickRandomSubset = <T,>(items: T[], count: number): T[] => {
  if (count <= 0) {
    return [];
  }
  const pool = [...items];
  const selection: T[] = [];
  while (pool.length && selection.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [item] = pool.splice(index, 1);
    if (item !== undefined) {
      selection.push(item);
    }
  }
  return selection;
};

const calculateMomentumStats = (log: CoachLogEntry[]) => {
  if (!log.length) {
    return {
      momentum: 0,
      longestStreak: 0,
      energy: 55,
      uniquePhases: new Set<SrlPhase>(),
      totalActions: 0
    };
  }

  let currentStreak = 1;
  let longestStreak = 1;
  let momentum = 35;
  let energy = 60;
  const uniquePhases = new Set<SrlPhase>();

  log.forEach((entry, index) => {
    uniquePhases.add(entry.phase);
    momentum += 10;
    energy += 4;

    const previous = log[index - 1];
    if (previous && previous.phase !== entry.phase) {
      currentStreak += 1;
      momentum += 4;
      energy += 2;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (index > 0) {
      currentStreak = 1;
    }
  });

  momentum = Math.min(momentum, 100);
  energy = Math.min(95, energy + uniquePhases.size * 2);

  return {
    momentum,
    longestStreak,
    energy,
    uniquePhases,
    totalActions: log.length
  };
};

const deriveBadges = (stats: ReturnType<typeof calculateMomentumStats>) => {
  const earned: string[] = [];

  if (stats.totalActions >= SRL_BADGES[0]?.threshold) {
    earned.push('starter-pack');
  }
  if (stats.uniquePhases.size >= SRL_BADGES[1]?.threshold) {
    earned.push('balanced-brain');
  }
  if (stats.momentum >= SRL_BADGES[2]?.threshold) {
    earned.push('momentum-maker');
  }
  if (stats.longestStreak >= SRL_BADGES[3]?.threshold) {
    earned.push('streak-legend');
  }

  return earned;
};

const formatCoachTimestamp = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Failed to format timestamp', error);
    return '';
  }
};
interface SrlCoachProps {
  onSendMessage: (message: string, options?: { mode?: InteractionMode }) => Promise<void>;
  interactions: AIInteraction[];
  isLoading: boolean;
  documentName?: string;
  onOpenDocument?: () => void;
}

const SrlCoach: React.FC<SrlCoachProps> = ({
  onSendMessage,
  interactions,
  isLoading,
  documentName,
  onOpenDocument
}) => {
  const [activePhase, setActivePhase] = useState<SrlPhase>('goal');
  const [goalTopic, setGoalTopic] = useState('');
  const [goalTimeframe, setGoalTimeframe] = useState('this week');
  const [preferredTools, setPreferredTools] = useState<string[]>(['molview', 'nmrium']);
  const [planFocus, setPlanFocus] = useState('');
  const [planLevel, setPlanLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [planPreference, setPlanPreference] = useState<string>('visual');
  const [monitorFocus, setMonitorFocus] = useState('');
  const [monitorRating, setMonitorRating] = useState<number | null>(null);
  const [monitorNotes, setMonitorNotes] = useState('');
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [reflectionEmotion, setReflectionEmotion] = useState<string>(SRL_REFLECTION_EMOTIONS[0]);
  const [helpTopic, setHelpTopic] = useState('');
  const [helpAttempts, setHelpAttempts] = useState(1);
  const [helpLevel, setHelpLevel] = useState<'hint' | 'guided' | 'explanation'>('hint');
  const [coachLog, setCoachLog] = useState<CoachLogEntry[]>([]);
  const [momentumScore, setMomentumScore] = useState(0);
  const [phaseStreak, setPhaseStreak] = useState(0);
  const [coachEnergy, setCoachEnergy] = useState(55);
  const [activeChallenge, setActiveChallenge] = useState<SrlChallenge | null>(() => pickRandom(SRL_CHALLENGE_DECK));
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [hypeTip, setHypeTip] = useState<string>(() => {
    const initialTip = pickRandom(SRL_HYPE_TIPS.goal);
    return initialTip ?? 'Ready to chart your next chemistry quest?';
  });
  const [selectedAssessmentMode, setSelectedAssessmentMode] = useState<AssessmentMode | null>(null);
  const [isAssessmentRunning, setIsAssessmentRunning] = useState(false);
  const [priorKnowledgeSnapshots, setPriorKnowledgeSnapshots] = useState<PriorKnowledgeSnapshot[]>([]);
  const [goalBuddySummary, setGoalBuddySummary] = useState('');
  const [planNodesState, setPlanNodesState] = useState<PlanNode[]>([]);
  const [planEdgesState, setPlanEdgesState] = useState<PlanEdge[]>([]);
  const [planScenariosState, setPlanScenariosState] = useState<PlanScenario[]>([]);
  const [monitoringCheckins, setMonitoringCheckins] = useState<MonitoringCheckin[]>([]);
  const [experiencePoints, setExperiencePoints] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [reflectionEntries, setReflectionEntries] = useState<ReflectionEntry[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [shareCoachData, setShareCoachData] = useState(true);
  const [insightBulletin, setInsightBulletin] = useState<string | null>(null);
  const [isArPreviewActive, setIsArPreviewActive] = useState(false);

  const coachInteractions = useMemo(
    () => interactions.filter((interaction) => interaction.mode === 'coach'),
    [interactions]
  );

  const outputEndRef = useRef<HTMLDivElement>(null);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedPreference = window.localStorage.getItem(COACH_PRIVACY_STORAGE_KEY);
    if (storedPreference === 'false') {
      setShareCoachData(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isHydratedRef.current) {
      return;
    }

    try {
      const storedState = window.localStorage.getItem(COACH_STATE_STORAGE_KEY);
      if (storedState) {
        const parsed = JSON.parse(storedState) as Partial<PersistedSrlCoachState>;
        if (parsed.activePhase) {
          setActivePhase(parsed.activePhase);
        }
        setGoalTopic(parsed.goalTopic ?? '');
        setGoalTimeframe(parsed.goalTimeframe ?? 'this week');
        setPreferredTools(Array.isArray(parsed.preferredTools) ? parsed.preferredTools : ['molview', 'nmrium']);
        if (Array.isArray(parsed.priorKnowledge)) {
          setPriorKnowledgeSnapshots(parsed.priorKnowledge);
        }
        setGoalBuddySummary(parsed.goalBuddySummary ?? '');
        setPlanFocus(parsed.planFocus ?? '');
        setPlanLevel(parsed.planLevel ?? 'beginner');
        setPlanPreference(parsed.planPreference ?? 'visual');
        if (Array.isArray(parsed.planNodes)) {
          setPlanNodesState(parsed.planNodes);
        }
        if (Array.isArray(parsed.planEdges)) {
          setPlanEdgesState(parsed.planEdges);
        }
        if (Array.isArray(parsed.planScenarios)) {
          setPlanScenariosState(parsed.planScenarios);
        }
        setMonitorFocus(parsed.monitorFocus ?? '');
        setMonitorRating(typeof parsed.monitorRating === 'number' ? parsed.monitorRating : null);
        setMonitorNotes(parsed.monitorNotes ?? '');
        if (Array.isArray(parsed.monitoringCheckins)) {
          setMonitoringCheckins(parsed.monitoringCheckins);
        }
        setReflectionNotes(parsed.reflectionNotes ?? '');
        setReflectionEmotion(parsed.reflectionEmotion ?? SRL_REFLECTION_EMOTIONS[0]);
        if (Array.isArray(parsed.reflectionEntries)) {
          setReflectionEntries(parsed.reflectionEntries);
        }
        setHelpTopic(parsed.helpTopic ?? '');
        setHelpAttempts(parsed.helpAttempts ?? 1);
        setHelpLevel(parsed.helpLevel ?? 'hint');
        if (Array.isArray(parsed.helpRequests)) {
          setHelpRequests(parsed.helpRequests);
        }
        if (Array.isArray(parsed.coachLog)) {
          setCoachLog(parsed.coachLog);
        }
      }

      const storedMetrics = window.localStorage.getItem(COACH_METRICS_STORAGE_KEY);
      if (storedMetrics) {
        const parsedMetrics = JSON.parse(storedMetrics) as Partial<SrlCoachMetrics>;
        if (typeof parsedMetrics.momentumScore === 'number') {
          setMomentumScore(parsedMetrics.momentumScore);
        }
        if (typeof parsedMetrics.phaseStreak === 'number') {
          setPhaseStreak(parsedMetrics.phaseStreak);
        }
        if (typeof parsedMetrics.coachEnergy === 'number') {
          setCoachEnergy(parsedMetrics.coachEnergy);
        }
        if (Array.isArray(parsedMetrics.unlockedBadgeIds)) {
          setUnlockedBadgeIds(parsedMetrics.unlockedBadgeIds);
        }
        if (typeof parsedMetrics.experiencePoints === 'number') {
          setExperiencePoints(parsedMetrics.experiencePoints);
        }
        if (typeof parsedMetrics.streakBonus === 'number') {
          setStreakBonus(parsedMetrics.streakBonus);
        }
      }
    } catch (error) {
      console.error('Failed to hydrate SRL coach state', error);
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(COACH_PRIVACY_STORAGE_KEY, shareCoachData ? 'true' : 'false');

    if (!shareCoachData) {
      window.localStorage.removeItem(COACH_STATE_STORAGE_KEY);
      window.localStorage.removeItem(COACH_METRICS_STORAGE_KEY);
      return;
    }

    const statePayload: PersistedSrlCoachState = {
      activePhase,
      goalTopic,
      goalTimeframe,
      preferredTools,
      priorKnowledge: priorKnowledgeSnapshots,
      goalBuddySummary,
      planFocus,
      planLevel,
      planPreference,
      planNodes: planNodesState,
      planEdges: planEdgesState,
      planScenarios: planScenariosState,
      monitorFocus,
      monitorRating,
      monitorNotes,
      monitoringCheckins,
      reflectionNotes,
      reflectionEmotion,
      reflectionEntries,
      helpTopic,
      helpAttempts,
      helpLevel,
      helpRequests,
      coachLog,
      updatedAt: new Date().toISOString()
    };

    const metricsPayload: SrlCoachMetrics = {
      momentumScore,
      phaseStreak,
      coachEnergy,
      unlockedBadgeIds,
      experiencePoints,
      streakBonus,
      updatedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(COACH_STATE_STORAGE_KEY, JSON.stringify(statePayload));
      window.localStorage.setItem(COACH_METRICS_STORAGE_KEY, JSON.stringify(metricsPayload));
    } catch (error) {
      console.error('Failed to persist SRL coach state', error);
    }
  }, [
    shareCoachData,
    activePhase,
    goalTopic,
    goalTimeframe,
    preferredTools,
    priorKnowledgeSnapshots,
    goalBuddySummary,
    planFocus,
    planLevel,
    planPreference,
    planNodesState,
    planEdgesState,
    planScenariosState,
    monitorFocus,
    monitorRating,
    monitorNotes,
    monitoringCheckins,
    reflectionNotes,
    reflectionEmotion,
    reflectionEntries,
    helpTopic,
    helpAttempts,
    helpLevel,
    helpRequests,
    coachLog,
    momentumScore,
    phaseStreak,
    coachEnergy,
    unlockedBadgeIds,
    experiencePoints,
    streakBonus
  ]);

  useEffect(() => {
    const stats = calculateMomentumStats(coachLog);
    setMomentumScore(stats.momentum);
    setPhaseStreak(stats.longestStreak);
    setCoachEnergy(stats.energy);
    setUnlockedBadgeIds(deriveBadges(stats));
    setStreakBonus(Math.min(40, stats.longestStreak * 6 + stats.uniquePhases.size * 4));
  }, [coachLog]);

  const learningJourney = useMemo(() => {
    if (!coachLog.length) {
      return (Object.keys(SRL_PHASES) as SrlPhase[]).map((phase) => ({ phase, count: 0 }));
    }
    const tally = new Map<SrlPhase, number>();
    coachLog.forEach((entry) => {
      tally.set(entry.phase, (tally.get(entry.phase) ?? 0) + 1);
    });
    return (Object.keys(SRL_PHASES) as SrlPhase[]).map((phase) => ({
      phase,
      count: tally.get(phase) ?? 0
    }));
  }, [coachLog]);

  useEffect(() => {
    const pool = [
      ...SRL_HYPE_TIPS[activePhase],
      ...SRL_HYPE_TIPS.wildcard
    ];
    const nextTip = pickRandom(pool);
    if (nextTip) {
      setHypeTip(nextTip);
    }

    const challengePool = SRL_CHALLENGE_DECK.filter(
      (challenge) => challenge.phase === activePhase || challenge.phase === 'wildcard'
    );
    const nextChallenge = pickRandom(challengePool);
    if (nextChallenge) {
      setActiveChallenge(nextChallenge);
    }
  }, [activePhase]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachInteractions, isLoading]);

  const togglePreferredTool = (toolId: string) => {
    setPreferredTools(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const logCoachAction = (phase: SrlPhase, note: string) => {
    const entry: CoachLogEntry = {
      id: `${phase}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      phase,
      note,
      timestamp: new Date().toISOString()
    };
    setCoachLog(prev => {
      const next = [entry, ...prev];
      return next.slice(0, COACH_LOG_LIMIT);
    });
  };

  const sendCoachPrompt = async (phase: SrlPhase, prompt: string, note: string, xpReward = 0) => {
    if (!prompt.trim() || isLoading) {
      return;
    }
    try {
      await onSendMessage(prompt, { mode: 'coach' });
      logCoachAction(phase, note);
      if (xpReward > 0) {
        setExperiencePoints((prev) => Math.min(999, prev + xpReward));
      }
    } catch (error) {
      console.error('SRL coach prompt failed:', error);
    }
  };

  const selectedToolLabels = preferredTools
    .map(id => SRL_TOOL_OPTIONS.find(option => option.id === id)?.label)
    .filter((label): label is string => Boolean(label));
  const handleGenerateGoal = () => {
    const trimmedTopic = goalTopic.trim();
    if (!trimmedTopic || isLoading) {
      return;
    }

    const toolSummary = selectedToolLabels.length
      ? selectedToolLabels.join(', ')
      : 'MolView visualizations, the NMR viewer, and adaptive chemistry quizzes';

  const prompt = [
    'You are ChemCanvas\'s self-regulated learning coach for chemistry students.',
    `The learner wants support creating a SMART goal about "${trimmedTopic}".`,
    `Draft a SMART goal that fits a ${goalTimeframe} horizon and weave in ChemCanvas features such as ${toolSummary}.`,
    'Reference prior struggles only if relevant and keep the learner in the driver seat by offering choices, not mandates.',
    'Close by asking the learner to confirm or tweak the goal.'
  ].join(' ');

    setInsightBulletin('SMART goal drafted - hop into planning to turn it into checkpoints.');
    void sendCoachPrompt('goal', prompt, `SMART goal drafted for ${trimmedTopic}`, 28);
  };

  const handleBuildPlan = () => {
    const focus = (planFocus || goalTopic).trim();
    if (!focus || isLoading) {
      return;
    }

    const preferenceMeta = SRL_PLAN_PREFERENCES.find(option => option.id === planPreference);
    const preferenceDescriptor = preferenceMeta
      ? `${preferenceMeta.label.toLowerCase()} approach (${preferenceMeta.description.toLowerCase()})`
      : 'balanced mix of visuals and practice';

    const toolSummary = selectedToolLabels.length
      ? selectedToolLabels.join(', ')
      : 'MolView, NMR viewer, virtual lab activities, and quick AI check-ins';

  const prompt = [
    'Act as the ChemCanvas SRL planning coach.',
    `Design a branching learning pathway for the topic "${focus}" tailored to a ${planLevel} learner.`,
    `Prioritize a ${preferenceDescriptor}.`,
    `Use ChemCanvas assets like ${toolSummary} and note when to leverage the AI chat versus hands-on tools.`,
    'Include 3-4 checkpoints with self-monitoring cues and optional extension challenges.',
    'End by inviting the learner to choose their next step.'
  ].join(' ');

    setInsightBulletin(`Adaptive pathway ready - start activating milestones for ${focus}.`);
    void sendCoachPrompt('plan', prompt, `Adaptive pathway generated for ${focus}`, 24);
  };

  const handleMonitoringFeedback = () => {
    const trimmedFocus = monitorFocus.trim();
    if (!trimmedFocus || monitorRating === null || isLoading) {
      return;
    }

  const prompt = [
    'Respond as the ChemCanvas SRL self-monitoring coach.',
    `The learner rated their understanding of "${trimmedFocus}" as ${monitorRating}/5.`,
    `Notes from the learner: ${monitorNotes.trim() || 'No additional notes provided.'}`,
    selectedToolLabels.length
      ? `Preferred tools at the moment: ${selectedToolLabels.join(', ')}.`
      : 'Use relevant ChemCanvas tools such as MolView, the NMR viewer, and AI-generated quizzes as needed.',
    'Acknowledge their self-assessment, highlight what the rating suggests, and recommend one short action plus a follow-up checkpoint.',
    'Close with a metacognitive question that encourages tracking progress without taking agency away.'
  ].join(' ');

    setInsightBulletin('Monitoring insight queued - check the dashboard for coach nudges.');
    void sendCoachPrompt(
      'monitor',
      prompt,
      `Confidence check logged for ${trimmedFocus} (${monitorRating}/5)`,
      18
    );
  };

  const handleReflectionSummary = () => {
    if (!reflectionNotes.trim() || isLoading) {
      return;
    }

  const prompt = [
    'You are wrapping up a chemistry study session as the ChemCanvas SRL reflection coach.',
    `Learner emotion: ${reflectionEmotion}.`,
    `Learner reflection: ${reflectionNotes.trim()}.`,
    'Summarise key insights, connect them back to earlier goals or checkpoints when possible, and suggest one actionable carry-over goal for the next session.',
    'Offer an optional advanced extension and remind the learner they can revisit their AI chat history for continuity.'
  ].join(' ');

    setInsightBulletin('Reflection summary queued - capture a highlight reel if you want to share it forward.');
    void sendCoachPrompt('reflect', prompt, 'Reflection synthesized for current session', 20);
  };

  const handleHelpRequest = () => {
    const trimmedTopic = helpTopic.trim();
    if (!trimmedTopic || isLoading) {
      return;
    }

    const attemptLabel = helpAttempts === 1 ? 'first' : `${helpAttempts} attempts`;
    const helpLevelDescription = (() => {
      switch (helpLevel) {
        case 'hint':
          return 'Offer a nudge or hint that keeps the learner in the driver seat.';
        case 'guided':
          return 'Walk through the first chunk and then return control to the learner.';
        case 'explanation':
          return 'Deliver a concise explanation with rationale and link out to the right ChemCanvas tools.';
        default:
          return '';
      }
    })();

    const prompt = [
      'Switch to the ChemCanvas SRL help-seeking coach voice.',
      `The learner is stuck on "${trimmedTopic}" after ${attemptLabel}.`,
      helpLevelDescription,
      selectedToolLabels.length
        ? `Recommend when to lean on ${selectedToolLabels.join(', ')} or escalate to a human mentor if progress stalls.`
        : 'Recommend when to use MolView, the NMR viewer, virtual labs, or reach out to a mentor.',
      'Keep the tone encouraging and emphasise autonomy by offering tiered support options.'
    ].join(' ');

    setInsightBulletin('Coach support is on the way - review previous attempts while you wait.');
    void sendCoachPrompt('help', prompt, `Support requested for ${trimmedTopic}`, 14);
  };

  const handleChallengeSpin = () => {
    const challengePool = SRL_CHALLENGE_DECK.filter(
      (challenge) => challenge.phase === activePhase || challenge.phase === 'wildcard'
    );
    const nextChallenge = pickRandom(challengePool);
    if (nextChallenge) {
      setActiveChallenge(nextChallenge);
    }
  };

  const handleEnergyBoost = () => {
    setCoachEnergy((prev) => Math.min(100, prev + 7));
    const bonusTip = pickRandom([
      ...SRL_HYPE_TIPS[activePhase],
      ...SRL_HYPE_TIPS.wildcard
    ]);
    if (bonusTip) {
      setHypeTip(bonusTip);
    }
  };

  const handleRunAssessment = async () => {
    if (!selectedAssessmentMode || isAssessmentRunning) {
      return;
    }

    setIsAssessmentRunning(true);
    setInsightBulletin(null);

    const focus = goalTopic.trim() || planFocus.trim() || 'your current chemistry focus';
    const modeLabel = ASSESSMENT_MODE_LABEL[selectedAssessmentMode];

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const highlightBank = ASSESSMENT_HIGHLIGHTS[selectedAssessmentMode];
      const strengths = pickRandomSubset(highlightBank.strengths, 2);
      const improvements = pickRandomSubset(highlightBank.improvements, 2);
      const score = Math.max(40, Math.min(100, Math.round(55 + Math.random() * 40)));
      const snapshot: PriorKnowledgeSnapshot = {
        id: `snapshot-${Date.now()}`,
        mode: selectedAssessmentMode,
        score,
        summary: `${modeLabel} baseline for ${focus} landed at ${score}% confidence.`,
        strengths,
        improvements,
        aiRecommendation:
          score >= 75
            ? `Momentum is strong. Stretch with a virtual lab or advanced quiz on ${focus}.`
            : `Rebuild fundamentals on ${focus} using MolView visuals and a short quiz loop.`,
        completedAt: new Date().toISOString()
      };
      setPriorKnowledgeSnapshots((prev) => [snapshot, ...prev].slice(0, 5));
      logCoachAction('goal', `${modeLabel} baseline captured (${score}%)`);
      setExperiencePoints((prev) => Math.min(999, prev + 25));
      setInsightBulletin(`Baseline captured - Goal Buddy now has fresh data for ${focus}.`);
    } catch (error) {
      console.error('Failed to run prior knowledge assessment', error);
    } finally {
      setIsAssessmentRunning(false);
    }
  };

  const handleGenerateGoalBuddy = () => {
    if (!shareCoachData) {
      setGoalBuddySummary('Enable anonymous sharing in the privacy controls to unlock Goal Buddy insights.');
      return;
    }

    if (!priorKnowledgeSnapshots.length) {
      setGoalBuddySummary('Complete a baseline check-in to see how similar learners approached this goal.');
      return;
    }

    const focus = goalTopic.trim() || planFocus.trim() || 'this chemistry focus';
    const aggregates = priorKnowledgeSnapshots.reduce(
      (acc, snapshot) => {
        acc.total += snapshot.score ?? 60;
        acc.count += 1;
        acc.modeCounts[snapshot.mode] = (acc.modeCounts[snapshot.mode] ?? 0) + 1;
        return acc;
      },
      { total: 0, count: 0, modeCounts: {} as Record<AssessmentMode, number> }
    );
    const averageScore = Math.round(aggregates.total / Math.max(1, aggregates.count));
    const topMode = (Object.entries(aggregates.modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as AssessmentMode) ?? 'quiz';
    const topModeLabel = ASSESSMENT_MODE_LABEL[topMode];
    const pacing =
      averageScore >= 75 ? 'two focused sessions and a simulation recap' : 'three shorter check-ins spread across the week';

    setGoalBuddySummary(
      `Goal Buddy pulse: learners with a similar ${focus} goal average ${averageScore}% after ${pacing}. The most popular warm-up is the ${topModeLabel.toLowerCase()}; try pairing it with MolView before your next quiz.`
    );
    logCoachAction('goal', 'Goal Buddy insight refreshed');
    setExperiencePoints((prev) => Math.min(999, prev + 10));
  };

  const handleAddPlanNode = () => {
    const focus = (planFocus || goalTopic).trim() || 'ChemCanvas sprint';
    setPlanNodesState((prev) => {
      const newId = `plan-node-${Date.now()}`;
      const toolLabel =
        selectedToolLabels.length > 0
          ? selectedToolLabels[prev.length % selectedToolLabels.length]
          : 'Custom reflection';
      const newNode: PlanNode = {
        id: newId,
        title: `Milestone ${prev.length + 1}`,
        description: `Advance ${focus.toLowerCase()} with a ${toolLabel.toLowerCase()} block.`,
        toolId: toolLabel,
        durationMinutes: 20 + prev.length * 5,
        status: 'pending',
        resources: [`${toolLabel} walkthrough`, 'Log a confidence rating once finished']
      };
      setPlanEdgesState((prevEdges) => {
        if (!prev.length) {
          return prevEdges;
        }
        const lastNode = prev[prev.length - 1];
        return [
          ...prevEdges,
          { id: `edge-${lastNode.id}-${newId}`, source: lastNode.id, target: newId, label: 'next step' }
        ];
      });
      return [...prev, newNode];
    });
    setExperiencePoints((prev) => Math.min(999, prev + 15));
    logCoachAction('plan', 'Added a new milestone to the roadmap');
  };

  const handleUpdatePlanNodeStatus = (nodeId: string, status: PlanNode['status']) => {
    const existingNode = planNodesState.find((node) => node.id === nodeId);
    if (!existingNode) {
      return;
    }
    setPlanNodesState((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, status } : node))
    );
    logCoachAction('plan', `${existingNode.title} marked ${status.replace('-', ' ')}`);
    if (existingNode.status !== 'completed' && status === 'completed') {
      setExperiencePoints((prev) => Math.min(999, prev + 18));
    }
  };

  const handleRunPlanSimulation = () => {
    if (!planNodesState.length) {
      setInsightBulletin('Add at least one milestone before running the what-if simulator.');
      return;
    }
    const focus = (planFocus || goalTopic).trim() || 'your chemistry target';
    const completed = planNodesState.filter((node) => node.status === 'completed').length;
    const remaining = planNodesState.length - completed;
    const scenario: PlanScenario = {
      id: `scenario-${Date.now()}`,
      title: remaining === 0 ? 'Victory Lap Projection' : 'Momentum vs Reset',
      description:
        remaining === 0
          ? 'Everything is checked off! Channel the energy into an extension challenge or deep reflection.'
          : `Staying consistent with ${planNodesState[0]?.title ?? 'your opening milestone'} keeps you on track while ${remaining} checkpoints remain.`,
      impactSummary: `Prediction: maintain this cadence to boost confidence on ${focus} by about ${Math.min(25, 12 + completed * 5)}%.`,
      createdAt: new Date().toISOString()
    };
    setPlanScenariosState((prev) => [scenario, ...prev].slice(0, 3));
    logCoachAction('plan', 'Ran a what-if simulation');
    setExperiencePoints((prev) => Math.min(999, prev + 12));
    setInsightBulletin(
      `Simulation suggests a ${Math.min(25, 12 + completed * 5)}% confidence lift if you honour the next milestone on ${focus}.`
    );
  };

  const handleRequestCheckin = () => {
    const focus = monitorFocus.trim() || goalTopic.trim() || 'General progress';
    const rating = monitorRating ?? Math.max(1, Math.min(5, Math.round(coachEnergy / 20)));
    const confidence = Math.max(1, Math.min(5, Math.round(rating + (coachEnergy - 50) / 25)));
    const checkin: MonitoringCheckin = {
      id: `checkin-${Date.now()}`,
      createdAt: new Date().toISOString(),
      focus,
      rating,
      confidence,
      note: monitorNotes.trim() || undefined,
      aiNudge:
        rating >= 4
          ? `Momentum is high on ${focus}. Add a stretch question or simulate a trickier scenario.`
          : `Take a breath and revisit the foundation of ${focus} with MolView or a quick quiz before retrying.`
    };
    setMonitoringCheckins((prev) => [checkin, ...prev].slice(0, 8));
    logCoachAction('monitor', `Check-in logged for ${focus} (${rating}/5)`);
    setExperiencePoints((prev) => Math.min(999, prev + 12));
  };

  const handleOpenMonitoringInsights = () => {
    if (!monitoringCheckins.length) {
      setInsightBulletin('Log a check-in to unlock your weekly insights.');
      return;
    }
    const average =
      Math.round(
        (monitoringCheckins.reduce((total, entry) => total + entry.rating, 0) / monitoringCheckins.length) * 10
      ) / 10;
    const focusCounts = monitoringCheckins.reduce((acc, entry) => {
      const key = entry.focus || 'General';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topFocus = Object.entries(focusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'your core concept';
    setInsightBulletin(
      `Weekly insights: average confidence ${average}/5. ${topFocus} has been your most tracked focus - plan a reflection or mini-quiz around it.`
    );
  };

  const handleCreateReflectionEntry = () => {
    const response = reflectionNotes.trim();
    if (!response) {
      setInsightBulletin('Jot a quick note above before logging it into your reflection timeline.');
      return;
    }
    const entry: ReflectionEntry = {
      id: `reflection-${Date.now()}`,
      createdAt: new Date().toISOString(),
      prompt: `Reflection on ${goalTopic.trim() || 'today'}`,
      response,
      mood: reflectionEmotion
    };
    setReflectionEntries((prev) => [entry, ...prev]);
    setReflectionNotes('');
    logCoachAction('reflect', 'Reflection entry captured');
    setExperiencePoints((prev) => Math.min(999, prev + 22));
  };

  const handleGenerateHighlightReel = () => {
    if (!reflectionEntries.length) {
      setInsightBulletin('Capture at least one reflection to build a highlight reel.');
      return;
    }
    const highlightUrls = [
      'https://chemcanvas.netlify.app/tools/molview',
      'https://chemcanvas.netlify.app/tools/nmr-viewer'
    ];
    setReflectionEntries((prev) =>
      prev.map((entry, index) =>
        index === 0 ? { ...entry, highlightMediaUrls: highlightUrls } : entry
      )
    );
    setExperiencePoints((prev) => Math.min(999, prev + 10));
    setInsightBulletin('Highlight reel ready - your latest reflection now includes quick share links.');
  };

  const handleRequestHelp = (channel: HelpChannel) => {
    const topic = helpTopic.trim() || goalTopic.trim() || 'General chemistry support';
    const request: HelpRequest = {
      id: `help-${Date.now()}`,
      channel,
      topic,
      createdAt: new Date().toISOString(),
      status: 'open',
      aiForecast: HELP_FORECAST_COPY[channel]
    };
    setHelpRequests((prev) => [request, ...prev].slice(0, 6));
    logCoachAction('help', `${HELP_CHANNEL_LABEL[channel]} request queued`);
  };

  const handleResolveHelpRequest = (requestId: string) => {
    setHelpRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, status: 'resolved' } : request))
    );
    logCoachAction('help', 'Help request marked resolved');
    setExperiencePoints((prev) => Math.min(999, prev + 10));
  };

  const handleHelpForecast = () => {
    if (!helpRequests.length) {
      setInsightBulletin('No active support threads. Log a new request to receive forecasts.');
      return;
    }

    setHelpRequests((prev) =>
      prev.map((request) =>
        request.status === 'open'
          ? { ...request, aiForecast: request.aiForecast ?? HELP_FORECAST_COPY[request.channel] }
          : request
      )
    );

    const oldestOpen = helpRequests.find((request) => request.status === 'open');
    setInsightBulletin(
      oldestOpen
        ? `Forecast refreshed. Prioritise your ${HELP_CHANNEL_LABEL[oldestOpen.channel]} request about "${oldestOpen.topic}".`
        : 'All support threads are resolved. Consider logging what you learned in a reflection.'
    );
  };
  return (
    <div className="h-full w-full overflow-y-auto rounded-3xl border border-slate-800/60 bg-gray-900/95 p-4 md:p-6 shadow-2xl">
      {documentName && (
        <div className="mb-4 rounded-xl border border-blue-700/40 bg-blue-900/30 px-4 py-3 text-sm text-blue-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-300" />
              <span>
                Reference: <strong>{documentName}</strong>
              </span>
            </div>
            {onOpenDocument && (
              <button
                onClick={onOpenDocument}
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-500"
              >
                Open
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-blue-100/80">
            Coach outputs will include citations when document context is used.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div
            className={`relative rounded-2xl border border-blue-700/40 p-5 md:p-6 text-white shadow-lg bg-gradient-to-br ${
              ([...SRL_MOMENTUM_LEVELS].reverse().find((level) => momentumScore >= level.min) ?? SRL_MOMENTUM_LEVELS[0]).gradient
            }`}
          >
            <div className="absolute -top-10 -right-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {(() => {
                    const tier =
                      [...SRL_MOMENTUM_LEVELS].reverse().find((level) => momentumScore >= level.min) ??
                      SRL_MOMENTUM_LEVELS[0];
                    const TierIcon = tier.icon;
                    return (
                      <>
                        <TierIcon size={14} className="text-yellow-200" />
                        {tier.label} Momentum
                      </>
                    );
                  })()}
                </div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  Momentum Score <span className="text-amber-200">{momentumScore}</span>
                </h3>
                <p className="text-sm text-white/80">
                  {
                    (
                      [...SRL_MOMENTUM_LEVELS].reverse().find((level) => momentumScore >= level.min) ??
                      SRL_MOMENTUM_LEVELS[0]
                    ).vibe
                  }
                </p>
                <p className="text-xs text-white/70">{SRL_PHASES[activePhase].description}</p>
                <div className="space-y-2 pt-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/70">
                      <span>Momentum Progress</span>
                      <span>{Math.min(100, Math.round(momentumScore))}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-amber-300 transition-all"
                        style={{ width: `${Math.min(100, Math.round(momentumScore))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/70">
                      <span>Energy</span>
                      <span>{Math.min(100, Math.round(coachEnergy))}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-emerald-300 transition-all"
                        style={{ width: `${Math.min(100, Math.round(coachEnergy))}%` }}
                      />
                    </div>
                  </div>
                </div>
                <label className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/70">
                  <input
                    type="checkbox"
                    checked={shareCoachData}
                    onChange={(event) => setShareCoachData(event.target.checked)}
                    className="h-4 w-4 rounded border-white/40 bg-transparent text-amber-200 focus:ring-amber-200"
                  />
                  Share anonymous progress for Goal Buddy insights
                </label>
                <div className="pt-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-white/70">Learning Journey Map</p>
                  <div className="flex flex-wrap gap-2">
                    {learningJourney.map(({ phase, count }) => (
                      <span
                        key={phase}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide ${
                          count > 0 ? 'border-white/35 bg-white/15 text-white' : 'border-white/15 text-white/60'
                        }`}
                      >
                        {SRL_PHASES[phase].label}
                        <span className="font-semibold text-amber-200">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl bg-white/10 p-4 backdrop-blur min-w-[220px]">
                <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-white/80">
                  <span>XP Tracker</span>
                  <Trophy size={18} className="text-yellow-200" />
                </div>
                <div className="text-3xl font-bold text-yellow-100">
                  {Math.min(999, experiencePoints)}
                </div>
                <p className="text-xs text-white/70">
                  Streak: <strong className="text-white">{phaseStreak}</strong> phases | Actions logged: <strong className="text-white">{coachLog.length}</strong>
                </p>
                <p className="text-[11px] text-white/60">
                  Streak bonus {streakBonus}% | Coach energy {Math.min(100, Math.round(coachEnergy))}%
                </p>
                <button
                  type="button"
                  onClick={handleEnergyBoost}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/30"
                >
                  <Sparkle size={14} />
                  Boost Energy
                </button>
              </div>
            </div>
            {insightBulletin && (
              <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-white/80">
                {insightBulletin}
              </div>
            )}
          </div>

          <div className="bg-gray-800/70 border border-blue-700/40 rounded-xl p-4 md:p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">SRL Coach Phases</p>
                <p className="text-sm text-gray-300">Choose your focus lane and launch a fresh interaction.</p>
              </div>
              <div className="text-xs text-blue-200 bg-blue-900/40 px-3 py-1 rounded-full border border-blue-700/40 uppercase tracking-wide">
                Current vibe: {SRL_PHASES[activePhase].label}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SRL_PHASES) as SrlPhase[]).map((phase) => {
                const meta = SRL_PHASES[phase];
                const Icon = meta.icon;
                const isActivePhase = phase === activePhase;
                return (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => setActivePhase(phase)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      isActivePhase
                        ? 'border-blue-500 bg-blue-600/30 text-blue-100 shadow'
                        : 'border-blue-500/40 bg-blue-900/20 text-blue-200 hover:border-blue-500/60 hover:text-blue-100'
                    }`}
                  >
                    <Icon size={16} className={isActivePhase ? 'text-blue-100' : meta.accent} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg border border-blue-700/30 bg-blue-900/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Hype Tip</p>
              <p className="mt-1 text-sm text-blue-100">{hypeTip}</p>
            </div>
            <div className="space-y-4">
              {(() => {
                switch (activePhase) {
                  case 'goal':
                    return (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                            Focus Area
                            <input
                              value={goalTopic}
                              onChange={(event) => setGoalTopic(event.target.value)}
                              placeholder="e.g., Alkane reaction mechanisms or NMR peak assignments"
                              className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                            Timeframe
                            <select
                              value={goalTimeframe}
                              onChange={(event) => setGoalTimeframe(event.target.value)}
                              className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                              <option value="today">Today</option>
                              <option value="this week">This week</option>
                              <option value="this month">This month</option>
                              <option value="before my next exam">Before my next exam</option>
                            </select>
                          </label>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                            ChemCanvas Tools to Highlight
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {SRL_TOOL_OPTIONS.map((option) => {
                              const isActive = preferredTools.includes(option.id);
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => togglePreferredTool(option.id)}
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                    isActive
                                      ? 'border-blue-500 bg-blue-600/30 text-blue-100'
                                      : 'border-gray-700 bg-gray-900/60 text-gray-300 hover:border-blue-500/40 hover:text-blue-100'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateGoal}
                          disabled={isLoading || !goalTopic.trim()}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Target size={16} />
                          Draft SMART Goal with AI
                        </button>
                        <PriorKnowledgePanel
                          selectedMode={selectedAssessmentMode}
                          onSelectMode={setSelectedAssessmentMode}
                          onLaunchAssessment={handleRunAssessment}
                          onGenerateGoalBuddy={handleGenerateGoalBuddy}
                          snapshots={priorKnowledgeSnapshots}
                          isBusy={isLoading || isAssessmentRunning}
                        />
                        {goalBuddySummary ? (
                          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-100">
                            <p className="font-semibold uppercase tracking-wide text-blue-200">Goal Buddy Insight</p>
                            <p className="mt-1 text-blue-100/80">{goalBuddySummary}</p>
                          </div>
                        ) : null}
                      </div>
                    );
                  case 'plan':
                    return (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-3">
                          <label className="md:col-span-2 flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                            Topic to Map
                            <input
                              value={planFocus}
                              onChange={(event) => setPlanFocus(event.target.value)}
                              placeholder="e.g., Resonance in benzene or acid-base titrations"
                              className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                            Learner Level
                            <select
                              value={planLevel}
                              onChange={(event) => setPlanLevel(event.target.value as typeof planLevel)}
                              className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                          </label>
                        </div>
                        <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                          Preferred Format
                          <select
                            value={planPreference}
                            onChange={(event) => setPlanPreference(event.target.value)}
                            className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          >
                            {SRL_PLAN_PREFERENCES.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={handleBuildPlan}
                          disabled={isLoading || (!planFocus.trim() && !goalTopic.trim())}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Route size={16} />
                          Generate Adaptive Pathway
                        </button>
                        <PlanningMindMap
                          nodes={planNodesState}
                          edges={planEdgesState}
                          scenarios={planScenariosState}
                          onAddStep={handleAddPlanNode}
                          onUpdateStatus={handleUpdatePlanNodeStatus}
                          onRunSimulation={handleRunPlanSimulation}
                          isBusy={isLoading}
                        />
                      </div>
                    );
                  case 'monitor':
                    return (
                      <div className="space-y-4">
                        <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                          Concept or Skill
                          <input
                            value={monitorFocus}
                            onChange={(event) => setMonitorFocus(event.target.value)}
                            placeholder="e.g., Predicting NMR splitting patterns"
                            className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                          />
                        </label>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                            Confidence Rating
                          </p>
                          <div className="mt-2 flex gap-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setMonitorRating(rating)}
                                className={`h-9 w-9 rounded-lg border text-xs font-semibold transition ${
                                  monitorRating === rating
                                    ? 'border-sky-500 bg-sky-600/40 text-sky-100'
                                    : 'border-gray-700 bg-gray-900/60 text-gray-400 hover:border-sky-500/40 hover:text-sky-100'
                                }`}
                              >
                                {rating}
                              </button>
                            ))}
                          </div>
                        </div>
                        <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                          Notes
                          <textarea
                            value={monitorNotes}
                            onChange={(event) => setMonitorNotes(event.target.value)}
                            rows={3}
                            placeholder="Where exactly did confidence dip or spike?"
                            className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleMonitoringFeedback}
                          disabled={isLoading || monitorRating === null || !monitorFocus.trim()}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Activity size={16} />
                          Generate Monitoring Feedback
                        </button>
                        <MonitoringDashboard
                          momentumScore={momentumScore}
                          phaseStreak={phaseStreak}
                          coachEnergy={coachEnergy}
                          experiencePoints={experiencePoints}
                          streakBonus={streakBonus}
                          checkins={monitoringCheckins}
                          onRequestCheckin={handleRequestCheckin}
                          onOpenInsights={handleOpenMonitoringInsights}
                          isBusy={isLoading}
                        />
                      </div>
                    );
                  case 'reflect':
                    return (
                      <div className="space-y-4">
                        <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                          Session Emotion
                          <select
                            value={reflectionEmotion}
                            onChange={(event) => setReflectionEmotion(event.target.value)}
                            className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          >
                            {SRL_REFLECTION_EMOTIONS.map((emotion) => (
                              <option key={emotion} value={emotion}>
                                {emotion}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                          Reflection Notes
                          <textarea
                            value={reflectionNotes}
                            onChange={(event) => setReflectionNotes(event.target.value)}
                            rows={4}
                            placeholder="What clicked, what still feels fuzzy, and what surprised you?"
                            className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleReflectionSummary}
                          disabled={isLoading || !reflectionNotes.trim()}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-purple-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <PenLine size={16} />
                          Synthesize Reflection
                        </button>
                        <ReflectionTimeline
                          entries={reflectionEntries}
                          onCreateReflection={handleCreateReflectionEntry}
                          onGenerateHighlightReel={handleGenerateHighlightReel}
                          isBusy={isLoading}
                        />
                      </div>
                    );
                  case 'help':
                    return (
                      <div className="space-y-4">
                        <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                          Topic
                          <input
                            value={helpTopic}
                            onChange={(event) => setHelpTopic(event.target.value)}
                            placeholder="e.g., Assigning stereochemistry for 2-bromobutane"
                            className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                          Attempts Made
                          <input
                            type="number"
                            min={1}
                            value={helpAttempts}
                            onChange={(event) => setHelpAttempts(Math.max(1, Number(event.target.value) || 1))}
                            className="mt-1 w-24 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-rose-500 focus:outline-none focus:ring-2  focus:ring-rose-500/30"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-gray-400 uppercase tracking-wide">
                          Support Level
                          <select
                            value={helpLevel}
                            onChange={(event) => setHelpLevel(event.target.value as typeof helpLevel)}
                            className="mt-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                          >
                            <option value="hint">Hint</option>
                            <option value="guided">Guided Step</option>
                            <option value="explanation">Explanation</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={handleHelpRequest}
                          disabled={isLoading || !helpTopic.trim()}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-rose-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <LifeBuoy size={16} />
                          Request Tiered Support
                        </button>
                        <HelpHub
                          requests={helpRequests}
                          onRequestHelp={handleRequestHelp}
                          onResolve={handleResolveHelpRequest}
                          onForecastSupport={handleHelpForecast}
                          isBusy={isLoading}
                        />
                      </div>
                    );
                  default:
                    return null;
                }
              })()}
            </div>
          </div>

          {coachLog.length > 0 && (
            <div className="bg-gray-800/70 border border-indigo-700/40 rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                <Clock size={14} className="text-indigo-300" />
                Coach Activity Log
              </div>
              <div className="mt-3 space-y-3">
                {coachLog.map((entry) => {
                  const meta = SRL_PHASES[entry.phase];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 rounded-lg border border-indigo-700/30 bg-indigo-900/10 p-3 text-xs text-gray-200"
                    >
                      <Icon size={16} className={`${meta.accent} mt-[2px]`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{meta.label}</span>
                          <span className="text-[11px] text-gray-400">{formatCoachTimestamp(entry.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-gray-300">{entry.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-gray-800/70 border border-indigo-700/40 rounded-xl p-4 md:p-5 flex flex-col gap-3 min-h-[280px] xl:max-h-[620px]">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-indigo-200">
              <span className="flex items-center gap-2">
                <Sparkles size={14} />
                Coach Output
              </span>
              {isLoading && (
                <div className="inline-flex items-center gap-2 text-indigo-100">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating...</span>
                </div>
              )}
            </div>
            <div className="text-[11px] text-indigo-100/80">
              Gemini responses for the SRL coach appear here. They are independent from the main chat assistant.
            </div>
            <div className="flex-1 overflow-y-auto rounded-lg border border-indigo-700/30 bg-indigo-900/10 p-3 space-y-4">
              {coachInteractions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-indigo-200/70">
                  <Wand size={28} className="mb-2 text-indigo-200" />
                  <p className="text-sm font-semibold">Ready when you are!</p>
                  <p className="text-xs text-indigo-100/70">Pick a phase and launch an AI-powered coaching move to see the response here.</p>
                </div>
              ) : (
                coachInteractions.map((interaction) => (
                  <div key={interaction.id} className="space-y-2">
                    {interaction.prompt?.trim() && (
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70ch] shadow-lg text-sm">
                          <p className="text-xs font-semibold mb-1 opacity-80">Coach Prompt</p>
                          <p>{interaction.prompt}</p>
                        </div>
                      </div>
                    )}
                    {interaction.response?.trim() && (
                      <div className="flex justify-start">
                        <div className="bg-indigo-950/70 border border-indigo-700/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[70ch] shadow-md space-y-3 text-sm text-indigo-100">
                          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200 uppercase tracking-wide">
                            <Sparkles size={14} className="text-indigo-300" />
                            Gemini SRL Coach
                          </div>
                          <LLMMessage content={interaction.response} onCitationClick={onOpenDocument} />
                          <VerifiedSmilesBlock sourceText={interaction.response} />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={outputEndRef} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-600/40 bg-emerald-900/20 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Mini Challenge</p>
                <h4 className="text-sm font-semibold text-emerald-100">
                  {activeChallenge?.title ?? 'Pick a surprise quest'}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleChallengeSpin}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/60 bg-emerald-800/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-50 transition hover:bg-emerald-700/50"
              >
                <Wand2 size={14} />
                Spin
              </button>
            </div>
            <p className="mt-2 text-xs text-emerald-100">
              {activeChallenge?.description ?? 'Spin the wheel to get a quick quest aligned with your current phase.'}
            </p>
            {activeChallenge && (
              <p className="mt-2 text-[11px] text-emerald-200 uppercase tracking-wide">
                Focus: {activeChallenge.phase === 'wildcard' ? 'Wildcard creativity' : SRL_PHASES[activeChallenge.phase].label}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-blue-500/40 bg-blue-900/15 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">AR Molecule Preview</p>
                <h4 className="text-sm font-semibold text-blue-100">Bring MolView into your space</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsArPreviewActive((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-400/60 bg-blue-500/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-50 transition hover:bg-blue-500/30"
              >
                {isArPreviewActive ? 'Close' : 'Launch'}
              </button>
            </div>
            <p className="text-xs text-blue-100">
              Use your mobile device to project molecules onto your desk for deeper spatial reasoning while you study.
            </p>
            {isArPreviewActive ? (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 space-y-2 text-[11px] text-blue-100">
                <p>1. Open the AR scene, then point your camera at a flat surface.</p>
                <p>2. Explore bond angles, annotations, and align the model with your current goal.</p>
                <a
                  href="https://chemcanvas.netlify.app/tools/molview?mode=ar"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-blue-400/60 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/30"
                >
                  Launch MolView AR Beta
                </a>
                <p className="text-blue-200/80">
                  Tip: Capture a screenshot and drop it into your reflection timeline or share with your study group.
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-amber-500/40 bg-amber-900/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200">
              <Award size={16} />
              Badges
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SRL_BADGES.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-lg border px-3 py-2 text-xs transition ${
                    unlockedBadgeIds.includes(badge.id)
                      ? 'border-amber-400 bg-amber-500/20 text-amber-50 shadow-sm'
                      : 'border-amber-500/20 bg-transparent text-amber-200/60'
                  }`}
                >
                  <p className="font-semibold flex items-center gap-1">
                    {badge.label}
                    {unlockedBadgeIds.includes(badge.id) && <Sparkle size={12} className="text-amber-100" />}
                  </p>
                  <p className="mt-1 text-[11px] text-amber-100/80">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SrlCoach;




