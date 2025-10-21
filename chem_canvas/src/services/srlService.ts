// SRL (Self-Regulated Learning) Service

import { 
  SMARTGoal, 
  LearningPathway, 
  ProgressCheckpoint, 
  ReflectionEntry, 
  HelpSeekingEvent,
  UserProfile,
  SessionSummary,
  GoalGenerationRequest,
  PathwayGenerationRequest,
  ProgressAnalysis,
  ReflectionAnalysis
} from '../types/srl';

class SRLService {
  private storageKey = 'srl_user_profile';
  private sessionKey = 'srl_current_session';

  // Goal Management
  async generateSMARTGoal(request: GoalGenerationRequest): Promise<SMARTGoal> {
    const goalPrompt = `
    Based on the user input: "${request.userInput}"
    Previous goals: ${JSON.stringify(request.previousGoals.map(g => g.title))}
    Learning history: ${JSON.stringify(request.learningHistory.slice(-3).map(s => s.topics))}
    Current topics: ${request.currentTopics.join(', ')}

    Generate a SMART goal for chemistry learning that is:
    - Specific: Clearly defined chemistry concept or skill
    - Measurable: Quantifiable outcomes (e.g., "complete 5 quizzes", "master 3 reaction types")
    - Achievable: Realistic given the user's level and available tools
    - Relevant: Connected to chemistry education and user interests
    - Time-bound: Clear completion date

    Format your response as JSON with these fields:
    {
      "title": "Brief goal title",
      "description": "Detailed description",
      "specific": "What exactly will be accomplished",
      "measurable": "How success will be measured",
      "achievable": "Why this is realistic",
      "relevant": "How this connects to chemistry learning",
      "timeBound": "When this will be completed",
      "chemistryTopics": ["topic1", "topic2"],
      "tools": ["MolView", "NMRium", "Quiz"]
    }
    `;

    // This would integrate with your existing Gemini service
    // For now, returning a mock response
    return {
      id: Date.now().toString(),
      title: "Master Organic Reaction Mechanisms",
      description: "Learn and practice fundamental organic reaction mechanisms through visualization and problem-solving",
      specific: "Study 5 key organic reaction mechanisms: SN1, SN2, E1, E2, and addition reactions",
      measurable: "Complete 20 practice problems with 80% accuracy and create 3 mechanism diagrams",
      achievable: "Available tools include MolView for visualization and practice quizzes for assessment",
      relevant: "Essential for understanding organic chemistry and preparing for advanced topics",
      timeBound: "Complete within 2 weeks",
      status: 'active',
      createdAt: new Date(),
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      progress: 0,
      chemistryTopics: ['organic-chemistry', 'reaction-mechanisms'],
      tools: ['MolView', 'Quiz', 'Practice']
    };
  }

  async createLearningPathway(request: PathwayGenerationRequest): Promise<LearningPathway> {
    const pathwayPrompt = `
    Create a learning pathway for the goal: "${request.goal.title}"
    Goal details: ${request.goal.description}
    User preferences: ${JSON.stringify(request.userPreferences)}
    Available tools: ${request.availableTools.join(', ')}

    Generate 5-7 steps that progressively build understanding, incorporating:
    - Visualization steps using MolView or similar tools
    - Practice exercises and quizzes
    - Application and synthesis activities
    - Progress checkpoints

    Format as JSON with steps array containing:
    {
      "title": "Step title",
      "description": "What the student will do",
      "type": "visualization|simulation|quiz|reading|practice",
      "tool": "Tool name",
      "estimatedTime": 15,
      "resources": ["resource1", "resource2"]
    }
    `;

    // Mock pathway generation
    return {
      id: Date.now().toString(),
      goalId: request.goal.id,
      title: `Learning Pathway: ${request.goal.title}`,
      steps: [
        {
          id: '1',
          title: 'Visualize Basic Mechanisms',
          description: 'Use MolView to explore the structure and electron movement in SN1 reactions',
          type: 'visualization',
          tool: 'MolView',
          estimatedTime: 20,
          completed: false,
          resources: ['SN1 Mechanism Guide', 'MolView Tutorial']
        },
        {
          id: '2',
          title: 'Practice SN1 Problems',
          description: 'Complete 10 practice problems on SN1 reaction predictions',
          type: 'practice',
          tool: 'Quiz',
          estimatedTime: 25,
          completed: false,
          resources: ['SN1 Practice Set']
        }
      ],
      estimatedDuration: 120,
      difficulty: 'intermediate',
      createdAt: new Date(),
      status: 'active'
    };
  }

  // Progress Tracking
  async createProgressCheckpoint(
    goalId: string, 
    topic: string, 
    confidenceRating: number,
    notes: string
  ): Promise<ProgressCheckpoint> {
    const checkpoint: ProgressCheckpoint = {
      id: Date.now().toString(),
      goalId,
      topic,
      confidenceRating,
      understandingLevel: confidenceRating, // Simplified for now
      notes,
      timestamp: new Date()
    };

    // Analyze progress with AI
    checkpoint.aiAnalysis = await this.analyzeProgress(checkpoint);
    
    await this.saveProgressCheckpoint(checkpoint);
    return checkpoint;
  }

  private async analyzeProgress(checkpoint: ProgressCheckpoint): Promise<string> {
    const analysisPrompt = `
    Analyze this progress checkpoint:
    Topic: ${checkpoint.topic}
    Confidence Rating: ${checkpoint.confidenceRating}/5
    Notes: ${checkpoint.notes}
    
    Provide a brief analysis (2-3 sentences) of the student's progress and suggestions for improvement.
    `;

    // This would integrate with Gemini service
    return `Great progress on ${checkpoint.topic}! Your confidence rating of ${checkpoint.confidenceRating}/5 shows solid understanding. Consider practicing with more complex examples to solidify your knowledge.`;
  }

  // Reflection Management
  async createReflectionEntry(
    sessionId: string,
    prompt: string,
    response: string
  ): Promise<ReflectionEntry> {
    const entry: ReflectionEntry = {
      id: Date.now().toString(),
      sessionId,
      prompt,
      response,
      sentiment: await this.analyzeSentiment(response),
      themes: await this.extractThemes(response),
      insights: [],
      timestamp: new Date()
    };

    entry.insights = await this.generateInsights(entry);
    entry.aiSummary = await this.generateReflectionSummary(entry);

    await this.saveReflectionEntry(entry);
    return entry;
  }

  private async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    // Simple sentiment analysis - in production, use a proper NLP service
    const positiveWords = ['good', 'great', 'excellent', 'learned', 'understand', 'clear', 'helpful'];
    const negativeWords = ['difficult', 'confusing', 'hard', 'struggle', 'problem', 'issue'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private async extractThemes(text: string): Promise<string[]> {
    // Simple theme extraction - in production, use NLP
    const themes = [];
    if (text.toLowerCase().includes('mechanism')) themes.push('reaction-mechanisms');
    if (text.toLowerCase().includes('structure')) themes.push('molecular-structure');
    if (text.toLowerCase().includes('nmr')) themes.push('spectroscopy');
    if (text.toLowerCase().includes('quiz')) themes.push('assessment');
    return themes;
  }

  private async generateInsights(entry: ReflectionEntry): Promise<string[]> {
    const insightPrompt = `
    Based on this reflection:
    Prompt: ${entry.prompt}
    Response: ${entry.response}
    Themes: ${entry.themes.join(', ')}
    
    Generate 2-3 actionable insights for the student's learning journey.
    `;

    // Mock insights
    return [
      'Focus on connecting theoretical concepts with practical applications',
      'Consider using more visual tools to reinforce understanding'
    ];
  }

  private async generateReflectionSummary(entry: ReflectionEntry): Promise<string> {
    return `Reflection summary: The student showed ${entry.sentiment} sentiment while discussing ${entry.themes.join(' and ')}. Key insights include focusing on practical applications and visual learning tools.`;
  }

  // Help-Seeking Management
  async detectHelpSeekingNeed(
    sessionId: string,
    context: string,
    interactionHistory: any[]
  ): Promise<HelpSeekingEvent | null> {
    // Simple frustration detection
    const recentInteractions = interactionHistory.slice(-5);
    const repeatedQuestions = recentInteractions.filter(
      (interaction, index, arr) => 
        arr.slice(0, index).some(prev => prev.text === interaction.text)
    );

    if (repeatedQuestions.length >= 2) {
      return {
        id: Date.now().toString(),
        sessionId,
        trigger: 'frustration',
        context,
        assistanceLevel: 'hint',
        resolved: false,
        timestamp: new Date()
      };
    }

    return null;
  }

  async provideAdaptiveHelp(event: HelpSeekingEvent): Promise<string> {
    const helpPrompts = {
      hint: `Provide a subtle hint for: ${event.context}. Don't give the full answer.`,
      explanation: `Provide a clear explanation for: ${event.context}.`,
      'step-by-step': `Provide a step-by-step walkthrough for: ${event.context}.`
    };

    return helpPrompts[event.assistanceLevel];
  }

  // User Profile Management
  async getUserProfile(): Promise<UserProfile | null> {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : null;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(profile));
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getUserProfile() || this.createDefaultProfile();
    const updated = { ...current, ...updates };
    await this.saveUserProfile(updated);
    return updated;
  }

  private createDefaultProfile(): UserProfile {
    return {
      id: 'user_' + Date.now(),
      learningStyle: 'visual',
      preferredTools: ['MolView', 'NMRium'],
      difficultyPreference: 'intermediate',
      sessionHistory: [],
      currentGoals: [],
      progressHistory: [],
      reflectionHistory: [],
      helpSeekingHistory: [],
      aiInsights: {
        strengths: [],
        challenges: [],
        recommendations: [],
        lastUpdated: new Date()
      }
    };
  }

  // Storage helpers
  private async saveProgressCheckpoint(checkpoint: ProgressCheckpoint): Promise<void> {
    const profile = await this.getUserProfile();
    if (profile) {
      profile.progressHistory.push(checkpoint);
      await this.saveUserProfile(profile);
    }
  }

  private async saveReflectionEntry(entry: ReflectionEntry): Promise<void> {
    const profile = await this.getUserProfile();
    if (profile) {
      profile.reflectionHistory.push(entry);
      await this.saveUserProfile(profile);
    }
  }

  // Analytics and Insights
  async generateProgressReport(userId: string): Promise<ProgressAnalysis[]> {
    const profile = await this.getUserProfile();
    if (!profile) return [];

    return profile.progressHistory
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(checkpoint => ({
        checkpoint,
        trend: this.calculateTrend(profile.progressHistory, checkpoint),
        recommendations: this.generateRecommendations(checkpoint),
        nextSteps: this.generateNextSteps(checkpoint)
      }));
  }

  private calculateTrend(history: ProgressCheckpoint[], current: ProgressCheckpoint): 'improving' | 'stable' | 'declining' {
    const recent = history
      .filter(h => h.topic === current.topic)
      .slice(-3);
    
    if (recent.length < 2) return 'stable';
    
    const avgRecent = recent.reduce((sum, h) => sum + h.confidenceRating, 0) / recent.length;
    const avgOlder = history
      .filter(h => h.topic === current.topic && h.timestamp < recent[0].timestamp)
      .slice(-3)
      .reduce((sum, h) => sum + h.confidenceRating, 0) / 3;
    
    if (avgRecent > avgOlder + 0.5) return 'improving';
    if (avgRecent < avgOlder - 0.5) return 'declining';
    return 'stable';
  }

  private generateRecommendations(checkpoint: ProgressCheckpoint): string[] {
    if (checkpoint.confidenceRating >= 4) {
      return ['Consider tackling more advanced topics', 'Share your knowledge with others'];
    } else if (checkpoint.confidenceRating <= 2) {
      return ['Review fundamental concepts', 'Try different learning approaches'];
    }
    return ['Continue practicing current topics', 'Set specific practice goals'];
  }

  private generateNextSteps(checkpoint: ProgressCheckpoint): string[] {
    return [
      'Complete related practice problems',
      'Explore advanced applications',
      'Connect with study groups or tutors'
    ];
  }
}

export const srlService = new SRLService();
