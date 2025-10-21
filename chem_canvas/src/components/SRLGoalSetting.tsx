// SRL Goal Setting Component

import React, { useState, useEffect } from 'react';
import { Target, Calendar, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { SMARTGoal } from '../types/srl';
import { srlService } from '../services/srlService';

interface SRLGoalSettingProps {
  onGoalCreated: (goal: SMARTGoal) => void;
  onClose: () => void;
}

const SRLGoalSetting: React.FC<SRLGoalSettingProps> = ({ onGoalCreated, onClose }) => {
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGoal, setGeneratedGoal] = useState<SMARTGoal | null>(null);
  const [customizing, setCustomizing] = useState(false);

  const handleGenerateGoal = async () => {
    if (!userInput.trim()) return;
    
    setIsGenerating(true);
    try {
      const goal = await srlService.generateSMARTGoal({
        userInput: userInput.trim(),
        previousGoals: [],
        learningHistory: [],
        currentTopics: []
      });
      setGeneratedGoal(goal);
    } catch (error) {
      console.error('Error generating goal:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptGoal = async () => {
    if (!generatedGoal) return;
    
    // Save to user profile
    const profile = await srlService.getUserProfile();
    if (profile) {
      profile.currentGoals.push(generatedGoal);
      await srlService.saveUserProfile(profile);
    }
    
    onGoalCreated(generatedGoal);
    onClose();
  };

  const handleCustomizeGoal = () => {
    setCustomizing(true);
  };

  const handleSaveCustomGoal = () => {
    if (!generatedGoal) return;
    handleAcceptGoal();
  };

  const goalExamples = [
    "I want to learn about organic reaction mechanisms",
    "Master NMR spectroscopy interpretation",
    "Understand molecular orbital theory",
    "Learn about acid-base chemistry",
    "Practice stoichiometry calculations"
  ];

  return (
    <div className="bg-slate-950/95 border border-indigo-800/40 rounded-2xl shadow-2xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/20 p-2 rounded-lg">
            <Target className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-indigo-100">SMART Goal Setting</h3>
            <p className="text-sm text-indigo-200/80">Create a specific, measurable chemistry learning goal</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-indigo-200 hover:text-indigo-100 transition-colors"
        >
          ✕
        </button>
      </div>

      {!generatedGoal ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-indigo-100 mb-3">
              What chemistry topic would you like to learn?
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe what you want to achieve in your chemistry learning..."
              className="w-full h-24 px-4 py-3 bg-slate-900/60 border border-indigo-800/40 rounded-lg text-indigo-100 placeholder-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
          </div>

          <div>
            <p className="text-sm text-indigo-200/80 mb-3">Or try these examples:</p>
            <div className="grid grid-cols-1 gap-2">
              {goalExamples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setUserInput(example)}
                  className="text-left p-3 bg-slate-900/40 border border-indigo-800/30 rounded-lg hover:bg-slate-800/40 hover:border-indigo-700/50 transition-colors text-sm text-indigo-200"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateGoal}
            disabled={!userInput.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Generating SMART Goal...
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                Generate SMART Goal
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-indigo-800/30 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-indigo-100 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Your SMART Goal
            </h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="text-base font-medium text-indigo-200 mb-2">{generatedGoal.title}</h5>
                <p className="text-sm text-indigo-200/80">{generatedGoal.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-200">Specific</span>
                  </div>
                  <p className="text-xs text-indigo-200/80">{generatedGoal.specific}</p>
                </div>

                <div className="bg-slate-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-200">Measurable</span>
                  </div>
                  <p className="text-xs text-indigo-200/80">{generatedGoal.measurable}</p>
                </div>

                <div className="bg-slate-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-200">Achievable</span>
                  </div>
                  <p className="text-xs text-indigo-200/80">{generatedGoal.achievable}</p>
                </div>

                <div className="bg-slate-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-200">Time-bound</span>
                  </div>
                  <p className="text-xs text-indigo-200/80">{generatedGoal.timeBound}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-200/80">Topics:</span>
                  <div className="flex gap-1">
                    {generatedGoal.chemistryTopics.map((topic, index) => (
                      <span key={index} className="px-2 py-1 bg-indigo-700/30 text-indigo-200 rounded-md text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-200/80">Tools:</span>
                  <div className="flex gap-1">
                    {generatedGoal.tools.map((tool, index) => (
                      <span key={index} className="px-2 py-1 bg-green-700/30 text-green-200 rounded-md text-xs">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAcceptGoal}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Accept Goal
            </button>
            <button
              onClick={handleCustomizeGoal}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Customize
            </button>
            <button
              onClick={() => setGeneratedGoal(null)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SRLGoalSetting;
