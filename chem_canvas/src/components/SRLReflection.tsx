// SRL Reflection Component

import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, TrendingUp, MessageSquare, Calendar, Star } from 'lucide-react';
import { ReflectionEntry, SMARTGoal } from '../types/srl';
import { srlService } from '../services/srlService';

interface SRLReflectionProps {
  currentGoal?: SMARTGoal;
  onReflectionCreated: (entry: ReflectionEntry) => void;
  onClose: () => void;
}

const SRLReflection: React.FC<SRLReflectionProps> = ({ 
  currentGoal, 
  onReflectionCreated, 
  onClose 
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [reflectionResponse, setReflectionResponse] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [recentReflections, setRecentReflections] = useState<ReflectionEntry[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    loadRecentReflections();
  }, [currentGoal]);

  const loadRecentReflections = async () => {
    const profile = await srlService.getUserProfile();
    if (profile) {
      const recent = profile.reflectionHistory.slice(-5).reverse();
      setRecentReflections(recent);
    }
  };

  const reflectionPrompts = [
    "What surprised you most about what you learned today?",
    "How did your understanding change from the beginning to the end of this session?",
    "What connections did you make between different chemistry concepts?",
    "What strategies worked best for your learning today?",
    "What challenges did you face and how did you overcome them?",
    "How confident do you feel about applying what you learned?",
    "What would you do differently next time you study this topic?",
    "What questions do you still have about this topic?",
    "How does what you learned today connect to your overall chemistry goals?",
    "What would you like to explore further about this topic?"
  ];

  const handleCreateReflection = async () => {
    if (!selectedPrompt || !reflectionResponse.trim()) return;
    
    setIsCreating(true);
    try {
      const entry = await srlService.createReflectionEntry(
        `session_${Date.now()}`,
        selectedPrompt,
        reflectionResponse
      );
      
      onReflectionCreated(entry);
      setSelectedPrompt('');
      setReflectionResponse('');
      await loadRecentReflections();
    } catch (error) {
      console.error('Error creating reflection:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'negative': return <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 bg-green-400/10';
      case 'negative': return 'text-red-400 bg-red-400/10';
      default: return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'Positive';
      case 'negative': return 'Negative';
      default: return 'Neutral';
    }
  };

  return (
    <div className="bg-slate-950/95 border border-indigo-800/40 rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/20 p-2 rounded-lg">
            <Brain className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-indigo-100">Reflection & Insights</h3>
            <p className="text-sm text-indigo-200/80">
              Reflect on your learning and discover insights for improvement
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-indigo-200 hover:text-indigo-100 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reflection Form */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-indigo-800/30 rounded-xl p-4">
            <h4 className="text-base font-semibold text-indigo-100 mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              Create Reflection
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-3">
                  Choose a reflection prompt:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reflectionPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                        selectedPrompt === prompt
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100'
                          : 'bg-slate-800/40 border-indigo-800/30 text-indigo-200 hover:bg-slate-700/40 hover:border-indigo-700/50'
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPrompt && (
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    Your reflection:
                  </label>
                  <textarea
                    value={reflectionResponse}
                    onChange={(e) => setReflectionResponse(e.target.value)}
                    placeholder="Share your thoughts, insights, and reflections..."
                    className="w-full h-32 px-3 py-2 bg-slate-900/60 border border-indigo-800/40 rounded-lg text-indigo-100 placeholder-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm"
                  />
                </div>
              )}

              <button
                onClick={handleCreateReflection}
                disabled={!selectedPrompt || !reflectionResponse.trim() || isCreating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creating Reflection...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4" />
                    Create Reflection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Reflections & Insights */}
        <div className="space-y-6">
          {/* Recent Reflections */}
          <div className="bg-slate-900/60 border border-indigo-800/30 rounded-xl p-4">
            <h4 className="text-base font-semibold text-indigo-100 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Recent Reflections
            </h4>

            {recentReflections.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentReflections.map((reflection) => (
                  <div key={reflection.id} className="bg-slate-800/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-indigo-200/80">
                        {new Date(reflection.timestamp).toLocaleDateString()}
                      </span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getSentimentColor(reflection.sentiment)}`}>
                        {getSentimentIcon(reflection.sentiment)}
                        <span>{getSentimentText(reflection.sentiment)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-indigo-200/90 mb-2">{reflection.prompt}</p>
                    <p className="text-xs text-indigo-200/80 mb-2">{reflection.response}</p>
                    
                    {reflection.themes.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {reflection.themes.slice(0, 3).map((theme, index) => (
                          <span key={index} className="px-2 py-1 bg-indigo-700/30 text-indigo-200 rounded-md text-xs">
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}

                    {reflection.aiSummary && (
                      <div className="bg-indigo-900/20 border border-indigo-700/30 rounded p-2">
                        <p className="text-xs text-indigo-300 italic">{reflection.aiSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-indigo-200/60 italic">No reflections yet</p>
            )}
          </div>

          {/* Insights Toggle */}
          <div className="bg-slate-900/60 border border-indigo-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-indigo-100 flex items-center gap-2">
                <Star className="h-4 w-4 text-indigo-400" />
                Learning Insights
              </h4>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                {showInsights ? 'Hide' : 'Show'} Insights
              </button>
            </div>

            {showInsights && (
              <div className="space-y-3">
                {recentReflections.length > 0 ? (
                  recentReflections.slice(0, 3).map((reflection) => (
                    <div key={reflection.id} className="bg-slate-800/40 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-indigo-200 mb-2">Key Insights:</h5>
                      {reflection.insights.length > 0 ? (
                        <ul className="space-y-1">
                          {reflection.insights.map((insight, index) => (
                            <li key={index} className="text-xs text-indigo-300 flex items-start gap-2">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-indigo-200/60 italic">No insights generated yet</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-indigo-200/60 italic">
                    Create reflections to see AI-generated insights about your learning patterns
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SRLReflection;
