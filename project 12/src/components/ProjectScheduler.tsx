import { Calendar } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Save } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';

export interface ScheduledTask {
  id: string;
  description: string;
  durationMs: number;
  outputFile: string;
  priority: number;
  pulseType: "analysis" | "codegen" | "refactor" | "docgen";
  outputAction: "write" | "append" | "replace";
  injectionPrompts: string[];
  scheduledTime?: Date;
  status?: "pending" | "running" | "completed" | "failed";
  error?: string;
}

interface ProjectSchedulerProps {
  onTasksUpdate?: (tasks: ScheduledTask[]) => void;
  onRunTask?: (task: ScheduledTask) => Promise<void>;
}

export const ProjectScheduler: React.FC<ProjectSchedulerProps> = ({
  onTasksUpdate,
  onRunTask,
}) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [newTask, setNewTask] = useState<Partial<ScheduledTask>>({
    description: "",
    durationMs: 20 * 60 * 1000,
    outputFile: "",
    priority: 5,
    pulseType: "analysis",
    outputAction: "write",
    injectionPrompts: [""],
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pulse-scheduler-tasks");
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("pulse-scheduler-tasks", JSON.stringify(tasks));
    onTasksUpdate?.(tasks);
  }, [tasks]);

  const addTask = () => {
    if (!newTask.description?.trim() || !newTask.outputFile?.trim()) return;
    const task: ScheduledTask = {
      id: `task_${Date.now()}`,
      description: newTask.description.trim(),
      durationMs: newTask.durationMs || 20 * 60 * 1000,
      outputFile: newTask.outputFile.trim(),
      priority: newTask.priority || 5,
      pulseType: newTask.pulseType || "analysis",
      outputAction: newTask.outputAction || "write",
      injectionPrompts: newTask.injectionPrompts?.filter((p) => p.trim()) || [],
      status: "pending",
    };
    setTasks((prev) => [...prev, task]);
    resetForm();
  };

  const resetForm = () => {
    setNewTask({
      description: "",
      durationMs: 20 * 60 * 1000,
      outputFile: "",
      priority: 5,
      pulseType: "analysis",
      outputAction: "write",
      injectionPrompts: [""],
    });
    setShowAddForm(false);
  };

  const updateTask = (id: string, updates: Partial<ScheduledTask>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));

  const deleteTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const runTask = async (task: ScheduledTask) => {
    updateTask(task.id, { status: "running", error: undefined });
    try {
      await onRunTask?.(task);
      updateTask(task.id, { status: "completed" });
    } catch (err: any) {
      updateTask(task.id, { status: "failed", error: err.message });
    }
  };

  const updateInjectionPrompt = (index: number, value: string) => {
    const prompts = [...(newTask.injectionPrompts || [])];
    prompts[index] = value;
    setNewTask({ ...newTask, injectionPrompts: prompts });
  };

  const addInjectionPrompt = () => {
    setNewTask({
      ...newTask,
      injectionPrompts: [...(newTask.injectionPrompts || []), ""],
    });
  };

  const removeInjectionPrompt = (index: number) => {
    const prompts = [...(newTask.injectionPrompts || [])];
    prompts.splice(index, 1);
    setNewTask({ ...newTask, injectionPrompts: prompts });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "running":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-green-400" />
          <span>Project Scheduler</span>
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-600">
          <h3 className="text-lg font-semibold mb-4">New Pulse Task</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Task Description"
              value={newTask.description || ""}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              className="px-3 py-2 bg-gray-700 rounded"
            />
            <input
              type="text"
              placeholder="Output File (e.g. src/App)"
              value={newTask.outputFile || ""}
              onChange={(e) =>
                setNewTask({ ...newTask, outputFile: e.target.value })
              }
              className="px-3 py-2 bg-gray-700 rounded"
            />
            <select
              value={newTask.pulseType}
              onChange={(e) =>
                setNewTask({ ...newTask, pulseType: e.target.value as any })
              }
              className="px-3 py-2 bg-gray-700 rounded"
            >
              <option value="analysis">🔍 Analysis</option>
              <option value="codegen">⚡ Code Generation</option>
              <option value="refactor">♻️ Refactor</option>
              <option value="docgen">📄 Documentation</option>
            </select>
            <select
              value={newTask.outputAction}
              onChange={(e) =>
                setNewTask({ ...newTask, outputAction: e.target.value as any })
              }
              className="px-3 py-2 bg-gray-700 rounded"
            >
              <option value="write">📝 Write New File</option>
              <option value="append">➕ Append</option>
              <option value="replace">♻️ Replace File</option>
            </select>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm text-gray-300">Injection Prompts</label>
            {newTask.injectionPrompts?.map((prompt, idx) => (
              <div key={idx} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. 'Focus on accessibility'"
                  value={prompt}
                  onChange={(e) => updateInjectionPrompt(idx, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 rounded"
                />
                <button
                  onClick={() => removeInjectionPrompt(idx)}
                  className="text-red-400"
                >
                  ✖
                </button>
              </div>
            ))}
            <button
              onClick={addInjectionPrompt}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              + Add Prompt
            </button>
          </div>

          <div className="flex space-x-2 mt-4">
            <button
              onClick={addTask}
              className="px-4 py-2 bg-green-600 rounded-lg flex items-center"
            >
              <Save className="w-4 h-4 mr-2" /> Save Task
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-600 rounded-lg"
            >
              <X className="w-4 h-4 inline-block mr-2" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-gray-800 p-4 rounded-lg border border-gray-600"
          >
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">{task.description}</h4>
                <p className="text-xs text-gray-400">
                  Pulse: {task.pulseType} | Output: {task.outputAction} | File:{" "}
                  {task.outputFile}
                </p>
                <p className={getStatusColor(task.status)}>
                  Status: {task.status}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => runTask(task)}
                  className="p-2 hover:text-green-400"
                >
                  ▶ Run
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {task.injectionPrompts.length > 0 && (
              <ul className="mt-2 text-xs text-gray-400 list-disc ml-4">
                {task.injectionPrompts.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
            {task.error && (
              <p className="text-red-400 text-sm mt-2">Error: {task.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};