import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Loader2 } from 'lucide-react';
import { RefreshCcw } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { useCallback } from 'react';
import { useState } from 'react';
import React from 'react';

interface RepoFile {
  path: string;
  content: string;
  refinedContent?: string;
}

interface PulseEngineComponentProps {
  tasks?: ScheduledTask[];
  onTaskUpdate?: (task: ScheduledTask) => void;
  onPulseComplete?: (results: { taskId: string; files: RepoFile[] }) => void;
  dualMode?: boolean;
}

const managerUrl = "http://localhost:11436/api/chat";

const agentUrls = ["http://localhost:11434/api/chat", "http://localhost:11435/api/chat"];

const PulseEngineComponent: React.FC<PulseEngineComponentProps> = ({
  tasks = [],
  onTaskUpdate,
  onPulseComplete,
  dualMode = false
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<ScheduledTask | null>(null);
  const [lastOutput, setLastOutput] = useState('Idle...');
  const [error, setError] = useState<string | null>(null);
  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [refinementCycles, setRefinementCycles] = useState<number>(2);
  const [chunkSizeKb] = useState<number>(8);

  const safeCompute = async (prompt: string, url: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data?.output ?? '';
  };

  const chunkText = (text: string, kb = chunkSizeKb) => {
    const size = kb * 1024;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
    return chunks;
  };

  const refineFile = async (file: RepoFile, cycles: number, taskDesc: string) => {
    const chunks = chunkText(file.content, chunkSizeKb);
    const refinedChunks: string[] = [];
    setLogs(prev => [...prev, `[RefineStart] ${file.path} (${chunks.length} chunks)`]);

    for (let c = 0; c < chunks.length; c++) {
      let current = chunks[c];
      for (let cycle = 0; cycle < cycles; cycle++) {
        try {
          // Manager guidance
          const managerPrompt = `Task goal: ${taskDesc}\nRefine chunk ${c+1} cycle ${cycle+1}:\n${current}`;
          let refined = await safeCompute(managerPrompt, managerUrl);

          // Agent1 expansion
          refined = await safeCompute(`Expand this:\n${refined}`, agentUrls[0]);

          // Agent2 optimization if dualMode
          if (dualMode) refined = await safeCompute(`Improve and optimize:\n${refined}`, agentUrls[1]);

          if (refined.trim()) current = refined;
          setLogs(prev => [...prev, `[Refine][${file.path}][chunk ${c+1}][cycle ${cycle+1}] done`]);
        } catch (err: any) {
          setLogs(prev => [...prev, `[RefineError][${file.path}] ${err.message || err}`]);
        }
        await new Promise(r => setTimeout(r, 250));
      }
      refinedChunks.push(current);
    }

    try {
      const consolidatedPrompt = `Consolidate ${refinedChunks.length} refined chunks for file ${file.path}:\n${refinedChunks.join('\n\n')}`;
      const final = await safeCompute(consolidatedPrompt, managerUrl);
      return final.trim() || refinedChunks.join('\n\n');
    } catch {
      return refinedChunks.join('\n\n');
    }
  };

  const runPulseTask = useCallback(async (task: ScheduledTask) => {
    setIsRunning(true);
    setCurrentTask(task);
    setError(null);
    setLogs(prev => [...prev, `[Run] Task: ${task.description}`]);

    try {
      const refinedFiles: RepoFile[] = [];
      for (const file of repoFiles) {
        const refinedContent = await refineFile(file, refinementCycles, task.description);
        refinedFiles.push({ ...file, refinedContent });
      }

      if (!refinedFiles.length) throw new Error('No files to refine');

      const zip = new JSZip();
      refinedFiles.forEach(f => zip.file(f.path, f.refinedContent ?? f.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${task.id}_refined.zip`);

      setLastOutput(`[Success] Refined ${refinedFiles.length} files. Download ready.`);
      onTaskUpdate?.({ ...task, status: 'completed' });
      onPulseComplete?.({ taskId: task.id, files: refinedFiles });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setLogs(prev => [...prev, `[Run] Error: ${msg}`]);
      onTaskUpdate?.({ ...task, status: 'failed' });
    } finally {
      setIsRunning(false);
      setCurrentTask(null);
    }
  }, [repoFiles, refinementCycles, onTaskUpdate, onPulseComplete, dualMode]);

  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl border border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">PulseEngine + Repo Refinement</h2>
        {isRunning && (
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400">Running...</span>
          </div>
        )}
      </div>

      <input
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        // @ts-ignore
        directory="true"
        multiple
        disabled={isRunning}
        className="w-full p-2 mb-2 rounded border border-gray-600 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={async (e) => {
          const files = e.target.files;
          if (!files) return;
          const loaded: RepoFile[] = [];
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const content = await f.text();
            loaded.push({ path: (f as any).webkitRelativePath || f.name, content });
          }
          setRepoFiles(loaded);
          setLogs(prev => [...prev, `[Upload] Loaded ${loaded.length} files from folder`]);
        }}
      />

      <div className="mb-2">
        <label className="text-sm text-gray-400 mr-2">Refinement Cycles:</label>
        <input
          type="number"
          min={1}
          max={10}
          value={refinementCycles}
          disabled={isRunning}
          onChange={(e) => setRefinementCycles(Number(e.target.value))}
          className="w-16 p-1 rounded border border-gray-600 bg-gray-800 text-white text-sm"
        />
      </div>

      <pre className="bg-gray-800 p-3 rounded-lg max-h-40 overflow-y-auto text-xs border border-gray-700">
        {logs.join('\n')}
      </pre>

      <div className="mt-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
        <strong>Last Output:</strong>
        <pre className="whitespace-pre-wrap text-green-300 text-xs">{lastOutput}</pre>
      </div>

      {error && (
        <div className="mt-3 bg-red-900/30 border border-red-500/50 p-3 rounded-lg flex items-center space-x-2 text-red-300 text-sm">
          <XCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {currentTask && (
        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => setCurrentTask(null)}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs disabled:opacity-50"
            disabled={!isRunning}
          >Abort Task</button>
          <button
            onClick={() => runPulseTask(currentTask)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs flex items-center space-x-2 disabled:opacity-50"
            disabled={!currentTask || isRunning}
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {tasks.length > 0 && !isRunning && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Run Scheduled Tasks:</h3>
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => runPulseTask(task)}
              className="block w-full px-4 py-2 text-left bg-gray-700 hover:bg-gray-600 rounded-lg text-xs disabled:opacity-50"
              disabled={isRunning || repoFiles.length === 0}
            >
              ▶ {task.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PulseEngineComponent;