import { PulseEngine } from '../lib/pulse-main-extended.mjs';
import { Edit3 } from 'lucide-react';
import { File } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Save } from 'lucide-react';
import { Target } from 'lucide-react';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';

interface AttachedFile {
  name: string;
  content: string;
  refinedContent?: string;
}

interface ProjectGoal {
  id: string;
  title: string;
  description: string;
  type: 'functional' | 'technical' | 'design' | 'performance';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  refinementCycles?: number;
  attachedFiles?: AttachedFile[];
  sovereignRules?: string[];
}

interface ProjectGoalsProps {
  onGoalsUpdate?: (goals: ProjectGoal[]) => void;
  autoSyncWithPulse?: boolean;
}

export const ProjectGoals: React.FC<ProjectGoalsProps> = ({ onGoalsUpdate, autoSyncWithPulse = true }) => {
  const [goals, setGoals] = useState<ProjectGoal[]>([]);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<ProjectGoal>>({
    title: '',
    description: '',
    type: 'functional',
    priority: 'medium',
    status: 'pending',
    refinementCycles: 2,
    attachedFiles: [{
      name: "demo.txt",
      content: "This is a demo file. Ollama will refine this content automatically."
    }],
  });

  const [pulseEngine] = useState(() => (autoSyncWithPulse ? new PulseEngine() : null));

  useEffect(() => {
    const saved = localStorage.getItem("projectGoals");
    if (saved) setGoals(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("projectGoals", JSON.stringify(goals));
    if (onGoalsUpdate) onGoalsUpdate(goals);
    if (pulseEngine && autoSyncWithPulse) {
      pulseEngine.runTask({
        id: "goals-sync",
        prompt: `Current project goals:\n${goals.map(
          g => `- [${g.status}] (${g.priority}) ${g.title}: ${g.description}`
        ).join("\n")}`
      }).catch(console.error);
    }
  }, [goals]);

  const addGoal = () => {
    if (!newGoal.title || !newGoal.description) return;
    const goal: ProjectGoal = {
      id: `goal_${Date.now()}`,
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type || 'functional',
      priority: newGoal.priority || 'medium',
      status: 'pending',
      refinementCycles: newGoal.refinementCycles || 2,
      attachedFiles: newGoal.attachedFiles || [],
      sovereignRules: [],
    };
    setGoals(prev => [...prev, goal]);
    resetNewGoal();
  };

  const resetNewGoal = () => {
    setNewGoal({
      title: '',
      description: '',
      type: 'functional',
      priority: 'medium',
      status: 'pending',
      refinementCycles: 2,
      attachedFiles: [{
        name: "demo.txt",
        content: "This is a demo file. Ollama will refine this content automatically."
      }],
    });
    setShowAddForm(false);
  };

  const updateGoal = (id: string, updates: Partial<ProjectGoal>) => {
    setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal));
  };

  const handleFileUpload = (goalId: string, files: FileList | null) => {
    if (!files) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        goal.attachedFiles = [...(goal.attachedFiles || []), { name: file.name, content }];
        updateGoal(goalId, { attachedFiles: goal.attachedFiles });
      };
      reader.readAsText(file);
    });
  };

  const getTypeColor = (type: ProjectGoal['type']) => {
    switch (type) {
      case 'functional': return 'text-blue-400 bg-blue-900/30 border-blue-500';
      case 'technical': return 'text-purple-400 bg-purple-900/30 border-purple-500';
      case 'design': return 'text-green-400 bg-green-900/30 border-green-500';
      case 'performance': return 'text-orange-400 bg-orange-900/30 border-orange-500';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500';
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Project Goals</h2>
            <p className="text-gray-400 text-sm">Define objectives, rules, and attach files for refinement</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-600 animate-fadeIn">
          <h3 className="text-lg font-semibold mb-4">Add New Goal</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Title</label>
              <input
                type="text"
                value={newGoal.title || ''}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                value={newGoal.description || ''}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-20 resize-none"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-2">Refinement Cycles</label>
              <input
                type="number"
                min={1} max={10}
                value={newGoal.refinementCycles || 2}
                onChange={(e) => setNewGoal({ ...newGoal, refinementCycles: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-2">Attach Files</label>
              <input
                type="file"
                multiple
                onChange={(e) => setNewGoal({
                  ...newGoal,
                  attachedFiles: Array.from(e.target.files || []).map(f => ({
                    name: f.name,
                    content: "Placeholder content, will be read when running task"
                  }))
                })}
                className="w-full text-xs"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={addGoal} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save Goal</span>
            </button>
            <button onClick={resetNewGoal} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg flex items-center space-x-2">
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className={`p-4 rounded-lg border ${getTypeColor(goal.type)}`}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-lg">{goal.title}</h4>
              <button onClick={() => setEditingGoal(editingGoal === goal.id ? null : goal.id)}>
                <Edit3 className="w-4 h-4 text-gray-400 hover:text-blue-400"/>
              </button>
            </div>
            <p className="text-gray-300">{goal.description}</p>
            <div className="mt-2 text-sm text-gray-400">Refinement cycles: {goal.refinementCycles || 2}</div>
            {goal.attachedFiles && goal.attachedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {goal.attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs bg-gray-800 p-1 rounded border border-gray-700">
                    <File className="w-3 h-3"/>
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};