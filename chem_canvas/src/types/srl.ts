// SRL (Self-Regulated Learning) Types

export interface SMARTGoal {
  id: string;
  title: string;
  description: string;
  specific: string;      // What exactly will be accomplished
  measurable: string;    // How success will be measured
  achievable: string;    // Why this is realistic
  relevant: string;      // How this connects to chemistry learning
  timeBound: string;     // When this will be completed
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  targetDate: Date;
  progress: number; // 0-100
  chemistryTopics: string[];
  tools: string[]; // ['MolView', 'NMRium', 'Quiz', etc.]
}

export interface LearningPathway {
  id: string;
  goalId: string;
  title: string;
  steps: PathwayStep[];
  estimatedDuration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  status: 'active' | 'completed' | 'paused';
}

export interface PathwayStep {
  id: string;
  title: string;
  description: string;
  type: 'visualization' | 'simulation' | 'quiz' | 'reading' | 'practice';
  tool: string; // 'MolView', 'NMRium', 'Quiz', etc.
  estimatedTime: number; // minutes
  completed: boolean;
  completedAt?: Date;
  resources: string[];
}

export interface ProgressCheckpoint {
  id: string;
  goalId: string;
  topic: string;
  confidenceRating: number; // 1-5
  understandingLevel: number; // 1-5
  notes: string;
  timestamp: Date;
  aiAnalysis?: string;
}

export interface ReflectionEntry {
  id: string;
  sessionId: string;
  prompt: string;
  response: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  themes: string[];
  insights: string[];
  timestamp: Date;
  aiSummary?: string;
}

export interface HelpSeekingEvent {
  id: string;
  sessionId: string;
  trigger: 'frustration' | 'confusion' | 'timeout' | 'manual';
  context: string;
  assistanceLevel: 'hint' | 'explanation' | 'step-by-step';
  resolved: boolean;
  timestamp: Date;
  aiResponse?: string;
}

export interface UserProfile {
  id: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  preferredTools: string[];
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
  sessionHistory: SessionSummary[];
  currentGoals: SMARTGoal[];
  progressHistory: ProgressCheckpoint[];
  reflectionHistory: ReflectionEntry[];
  helpSeekingHistory: HelpSeekingEvent[];
  aiInsights: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
    lastUpdated: Date;
  };
}

export interface SessionSummary {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  topics: string[];
  tools: string[];
  interactions: number;
  goals: string[];
  confidenceRating: number; // 1-5
  satisfactionRating: number; // 1-5
}

export interface SRLState {
  currentGoal?: SMARTGoal;
  activePathway?: LearningPathway;
  sessionCheckpoints: ProgressCheckpoint[];
  currentSession: {
    startTime: Date;
    topics: string[];
    interactions: number;
    confidenceRatings: number[];
  };
  aiRecommendations: {
    nextSteps: string[];
    resourceSuggestions: string[];
    toolRecommendations: string[];
  };
}

// AI Integration Types
export interface GoalGenerationRequest {
  userInput: string;
  previousGoals: SMARTGoal[];
  learningHistory: SessionSummary[];
  currentTopics: string[];
}

export interface PathwayGenerationRequest {
  goal: SMARTGoal;
  userPreferences: {
    learningStyle: string;
    preferredTools: string[];
    availableTime: number;
  };
  availableTools: string[];
}

export interface ProgressAnalysis {
  checkpoint: ProgressCheckpoint;
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
  nextSteps: string[];
}

export interface ReflectionAnalysis {
  entry: ReflectionEntry;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyThemes: string[];
  actionableInsights: string[];
  suggestedNextGoals: string[];
}
