// SRL Progress Tracking Component

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { ProgressCheckpoint, SMARTGoal, ProgressAnalysis } from '../types/srl';
import { srlService } from '../services/srlService';

interface SRLProgressTrackingProps {
  currentGoal?: SMARTGoal;
  onCheckpointCreated: (checkpoint: ProgressCheckpoint) => void;
  onClose: () => void;
}

const SRLProgressTracking: React.FC<SRLProgressTrackingProps> = ({ 
  currentGoal, 
  onCheckpointCreated, 
  onClose 
}) => {
  const [confidenceRating, setConfidenceRating] = useState(3);
  const [understandingLevel, setUnderstandingLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [recentCheckpoints, setRecentCheckpoints] = useState<ProgressCheckpoint[]>([]);
  const [progressAnalysis, setProgressAnalysis] = useState<ProgressAnalysis[]>([]);

  useEffect(() => {
    loadRecentCheckpoints();
    loadProgressAnalysis();
  }, [currentGoal]);

  const loadRecentCheckpoints = async () => {
    const profile = await srlService.getUserProfile();
    if (profile && currentGoal) {
      const recent = profile.progressHistory
        .filter(cp => cp.goalId === currentGoal.id)
        .slice(-5)
        .reverse();
      setRecentCheckpoints(recent);
    }
  };

  const loadProgressAnalysis = async () => {
    if (currentGoal) {
      const analysis = await srlService.generateProgressReport('current');
      setProgressAnalysis(analysis.filter(a => a.checkpoint.goalId === currentGoal.id));
    }
  };

  const handleCreateCheckpoint = async () => {
    if (!currentGoal || !notes.trim()) return;
    
    setIsCreating(true);
    try {
      const checkpoint = await srlService.createProgressCheckpoint(
        currentGoal.id,
        currentGoal.title,
        confidenceRating,
        notes
      );
      
      onCheckpointCreated(checkpoint);
      setNotes('');
      setConfidenceRating(3);
      setUnderstandingLevel(3);
      await loadRecentCheckpoints();
      await loadProgressAnalysis();
    } catch (error) {
      console.error('Error creating checkpoint:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getProgressTrend = (checkpoints: ProgressCheckpoint[]) => {
    if (checkpoints.length < 2) return 'stable';
    
    const recent = checkpoints.slice(-3);
    const older = checkpoints.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, cp) => sum + cp.confidenceRating, 0) / recent.length;
    const olderAvg = older.reduce((sum, cp) => sum + cp.confidenceRating, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-400 bg-green-400/10';
      case 'declining': return 'text-red-400 bg-red-400/10';
      default: return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  return (
    <div className="bg-slate-950/95 border border-indigo-800/40 rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/20 p-2 rounded-lg">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-indigo-100">Progress Tracking</h3>
            <p className="text-sm text-indigo-200/80">
              {currentGoal ? `Tracking: ${currentGoal.title}` : 'Monitor your learning progress'}
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
        {/* Progress Checkpoint Form */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-indigo-800/30 rounded-xl p-4">
            <h4 className="text-base font-semibold text-indigo-100 mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-400" />
              Create Progress Checkpoint
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Confidence Rating (1-5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setConfidenceRating(rating)}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${
                        confidenceRating >= rating
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-indigo-400 text-indigo-400 hover:border-indigo-300'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                  <span className="text-sm text-indigo-200/80 ml-2">
                    {confidenceRating === 1 && 'Not confident'}
                    {confidenceRating === 2 && 'Slightly confident'}
                    {confidenceRating === 3 && 'Moderately confident'}
                    {confidenceRating === 4 && 'Confident'}
                    {confidenceRating === 5 && 'Very confident'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Understanding Level (1-5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setUnderstandingLevel(level)}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${
                        understandingLevel >= level
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-green-400 text-green-400 hover:border-green-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                  <span className="text-sm text-indigo-200/80 ml-2">
                    {understandingLevel === 1 && 'Basic understanding'}
                    {understandingLevel === 2 && 'Some understanding'}
                    {understandingLevel === 3 && 'Good understanding'}
                    {understandingLevel === 4 && 'Strong understanding'}
                    {understandingLevel === 5 && 'Mastery level'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Notes & Reflections
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you learn? What challenges did you face? What would you like to focus on next?"
                  className="w-full h-24 px-3 py-2 bg-slate-900/60 border border-indigo-800/40 rounded-lg text-indigo-100 placeholder-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm"
                />
              </div>

              <button
                onClick={handleCreateCheckpoint}
                disabled={!notes.trim() || isCreating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creating Checkpoint...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Create Checkpoint
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Progress History & Analysis */}
        <div className="space-y-6">
          {/* Recent Checkpoints */}
          <div className="bg-slate-900/60 border border-indigo-800/30 rounded-xl p-4">
            <h4 className="text-base font-semibold text-indigo-100 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              Recent Progress
            </h4>

            {recentCheckpoints.length > 0 ? (
              <div className="space-y-3">
                {recentCheckpoints.map((checkpoint, index) => (
                  <div key={checkpoint.id} className="bg-slate-800/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-200">
                        {new Date(checkpoint.timestamp).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <div
                              key={rating}
                              className={`w-3 h-3 rounded-full ${
                                rating <= checkpoint.confidenceRating
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-indigo-200/80">
                          {checkpoint.confidenceRating}/5
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-200/80 mb-2">{checkpoint.notes}</p>
                    {checkpoint.aiAnalysis && (
                      <div className="bg-indigo-900/20 border border-indigo-700/30 rounded p-2">
                        <p className="text-xs text-indigo-300 italic">{checkpoint.aiAnalysis}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-indigo-200/60 italic">No progress checkpoints yet</p>
            )}
          </div>

          {/* Progress Analysis */}
          {progressAnalysis.length > 0 && (
            <div className="bg-slate-900/60 border border-indigo-800/30 rounded-xl p-4">
              <h4 className="text-base font-semibold text-indigo-100 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                Progress Analysis
              </h4>

              <div className="space-y-3">
                {progressAnalysis.slice(-3).map((analysis) => {
                  const trend = getProgressTrend([analysis.checkpoint]);
                  return (
                    <div key={analysis.checkpoint.id} className="bg-slate-800/40 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-200">
                          {analysis.checkpoint.topic}
                        </span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getTrendColor(trend)}`}>
                          {getTrendIcon(trend)}
                          <span className="capitalize">{trend}</span>
                        </div>
                      </div>
                      
                      {analysis.recommendations.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-indigo-200/80 mb-1">Recommendations:</p>
                          <ul className="text-xs text-indigo-300/80 space-y-1">
                            {analysis.recommendations.slice(0, 2).map((rec, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SRLProgressTracking;
