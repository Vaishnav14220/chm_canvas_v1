// Professional SRL Coach Panel

import React, { useState } from 'react';
import { Brain, Target, Map, TrendingUp, MessageCircle, HelpCircle, X, ChevronRight } from 'lucide-react';

interface SRLCoachPanelProps {
  onGoalSettingClick: () => void;
  onPlanningClick: () => void;
  onMonitoringClick: () => void;
  onReflectionClick: () => void;
  onHelpSeekingClick: () => void;
  onClose: () => void;
}

const SRLCoachPanel: React.FC<SRLCoachPanelProps> = ({
  onGoalSettingClick,
  onPlanningClick,
  onMonitoringClick,
  onReflectionClick,
  onHelpSeekingClick,
  onClose
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const srlPhases = [
    {
      id: 'goal-setting',
      title: 'Goal Setting',
      icon: Target,
      color: 'from-purple-600 to-indigo-600',
      description: 'Craft SMART chemistry learning goals',
      steps: [
        'Define what you want to learn',
        'Break it into measurable steps',
        'Set a realistic timeline'
      ],
      action: onGoalSettingClick
    },
    {
      id: 'planning',
      title: 'Planning Pathways',
      icon: Map,
      color: 'from-blue-600 to-cyan-600',
      description: 'Create your learning journey',
      steps: [
        'Choose learning tools (MolView, NMRium)',
        'Organize study materials',
        'Plan practice sessions'
      ],
      action: onPlanningClick
    },
    {
      id: 'monitoring',
      title: 'Self-Monitoring',
      icon: TrendingUp,
      color: 'from-green-600 to-emerald-600',
      description: 'Track your understanding',
      steps: [
        'Rate your confidence',
        'Log learning checkpoints',
        'Review progress'
      ],
      action: onMonitoringClick
    },
    {
      id: 'reflection',
      title: 'Reflection',
      icon: MessageCircle,
      color: 'from-orange-600 to-red-600',
      description: 'Learn from your experience',
      steps: [
        'Answer guided questions',
        'Identify key insights',
        'Plan next steps'
      ],
      action: onReflectionClick
    },
    {
      id: 'help-seeking',
      title: 'Help & Support',
      icon: HelpCircle,
      color: 'from-pink-600 to-rose-600',
      description: 'Get assistance when needed',
      steps: [
        'Ask AI for hints',
        'Request step-by-step help',
        'Escalate to full explanations'
      ],
      action: onHelpSeekingClick
    }
  ];

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col rounded-2xl border border-indigo-800/30 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 border-b border-indigo-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">SRL Coach</h2>
              <p className="text-sm text-indigo-100">Self-Regulated Learning Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <p className="text-sm text-indigo-100 ml-11">Master chemistry with guided learning phases</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {srlPhases.map((phase) => {
          const Icon = phase.icon;
          const isExpanded = expandedSection === phase.id;

          return (
            <div
              key={phase.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <button
                onClick={() => {
                  setExpandedSection(isExpanded ? null : phase.id);
                }}
                className="w-full px-4 py-4 flex items-start gap-3 hover:bg-slate-700/30 transition-colors"
              >
                <div className={`bg-gradient-to-br ${phase.color} p-2 rounded-lg flex-shrink-0 mt-1`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-white text-sm">{phase.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{phase.description}</p>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-slate-500 flex-shrink-0 mt-1 transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="bg-slate-900/50 border-t border-slate-700/30 px-4 py-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                      Steps in this phase:
                    </p>
                    <ul className="space-y-2">
                      {phase.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="bg-indigo-600/30 text-indigo-300 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-semibold mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-xs text-slate-300">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      phase.action();
                      setExpandedSection(null);
                    }}
                    className={`w-full py-2 px-3 bg-gradient-to-r ${phase.color} text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    <span>Start {phase.title}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-700/50 bg-slate-800/30 px-4 py-3">
        <p className="text-xs text-slate-400 text-center">
          Tip: Complete phases in order for best results. Start with goal-setting!
        </p>
      </div>
    </div>
  );
};

export default SRLCoachPanel;
