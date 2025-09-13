import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Download } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import React from 'react';
"use client";
// Define interfaces for type safety
interface RepoFileLike {
  name: string;
  path?: string;
  content: string;
  refinedContent?: string;
}

interface LogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  msg: string;
}

interface BackAndForthPulseProps {
  tasks?: ScheduledTask[];
  onTaskUpdate?: (task: ScheduledTask) => void;
  onPulseComplete?: (results: { taskId: string; finalOutput: string; iterations: number }) => void;
  pulseIntervalMs?: number;
  refinementCycles?: number;
  chunkSizeKb?: number;
  dualMode?: boolean;
}

// Configuration constants
const MANAGER_URL = "http://localhost:11436/api/chat";

const AGENT_URLS = ["http://localhost:11434/api/chat", "http://localhost:11435/api/chat"];
const MAX_LOGS = 200;
const DEFAULT_PULSE_INTERVAL_MS = 2000;
const DEFAULT_REFINEMENT_CYCLES = 3;
const DEFAULT_CHUNK_SIZE_KB = 8;
const FETCH_TIMEOUT_MS = 10000;

const BackAndForthPulse: React.FC<BackAndForthPulseProps> = ({
  tasks = [],
  onTaskUpdate,
  onPulseComplete,
  pulseIntervalMs = DEFAULT_PULSE_INTERVAL_MS,
  refinementCycles = DEFAULT_REFINEMENT_CYCLES,
  chunkSizeKb = DEFAULT_CHUNK_SIZE_KB,
  dualMode = false,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<ScheduledTask | null>(null);
  const [lastOutput, setLastOutput] = useState<string>("Idle...");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ step: number; total: number }>({ step: 0, total: 0 });
  const [chainValid, setChainValid] = useState<boolean>(true);

  const addLog = useCallback((msg: string, level: LogEntry["level"] = "info") => {
    setLogs((prev) => [
      ...prev.slice(-MAX_LOGS),
      { ts: new Date().toISOString(), msg, level },
    ]);
  }, []);

  const safeCompute = useCallback(async (prompt: string, url: string): Promise<string> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      return data?.output ?? "";
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addLog(`[ComputeError] ${errorMessage}`, "error");
      return "";
    }
  }, [addLog]);

  const chunkText = useCallback((text: string, kb: number = chunkSizeKb): string[] => {
    const size = kb * 1024;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    return chunks;
  }, [chunkSizeKb]);

  const refineFile = useCallback(
    async (file: RepoFileLike, cycles: number, injections: string[]): Promise<string> => {
      addLog(`[RefineStart] ${file.name} cycles=${cycles}`);
      const chunks = chunkText(file.content);
      const refinedChunks: string[] = [];

      for (let c = 0; c < chunks.length; c++) {
        let current = chunks[c];
        for (let cycle = 0; cycle < cycles; cycle++) {
          try {
            // Manager guidance
            let refined = await safeCompute(
              [`Task refinement: ${file.name}`, ...injections, `Chunk ${c + 1} cycle ${cycle + 1}:\n${current}`].join("\n\n"),
              MANAGER_URL
            );
            // Agent A
            refined = await safeCompute(`Expand:\n${refined}`, AGENT_URLS[0]);
            // Agent B (if dualMode)
            if (dualMode) {
              refined = await safeCompute(`Optimize:\n${refined}`, AGENT_URLS[1]);
            }
            if (refined.trim()) {
              current = refined;
            }
            addLog(`[Refine][${file.name}] chunk ${c + 1} cycle ${cycle + 1} ✅`);
          } catch (err: unknown) {
            addLog(`[RefineError][${file.name}] ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
          }
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        refinedChunks.push(current);
      }

      try {
        const consolidated = await safeCompute(
          `Consolidate ${refinedChunks.length} fragments for ${file.name}:\n${refinedChunks.join("\n\n")}`,
          MANAGER_URL
        );
        return consolidated.trim() || refinedChunks.join("\n\n");
      } catch {
        return refinedChunks.join("\n\n");
      }
    },
    [addLog, safeCompute, chunkText, dualMode]
  );

  const runBackAndForthTask = useCallback(
    async (task: ScheduledTask) => {
      setIsRunning(true);
      setCurrentTask(task);
      setError(null);
      setProgress({ step: 0, total: (task.durationMs ?? 10000) / pulseIntervalMs });
      addLog(`[Run] Task ${task.description}`);
      onTaskUpdate?.({ ...task, status: "in-progress" });

      let agentA = "";
      let agentB = "";
      let iteration = 0;
      const startTime = Date.now();
      const endTime = startTime + (task.durationMs ?? 10000);

      try {
        while (Date.now() < endTime) {
          iteration++;
          setProgress({ step: iteration, total: (task.durationMs ?? 10000) / pulseIntervalMs });

          agentA = await safeCompute(
            `Agent A step ${iteration}, task: ${task.description}. Previous B: ${agentB || "none"}`,
            AGENT_URLS[0]
          );
          agentB = await safeCompute(
            `Agent B reviewing:\n${agentA}`,
            dualMode ? AGENT_URLS[1] : AGENT_URLS[0]
          );
          setLastOutput(agentB);

          if (task.attachedFiles?.length) {
            for (const file of task.attachedFiles as RepoFileLike[]) {
              const refined = await refineFile(file, refinementCycles, [
                `Task: ${task.description}`,
                `Latest A: ${agentA}`,
                `Latest B: ${agentB}`,
              ]);
              file.refinedContent = refined;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, pulseIntervalMs));
        }

        addLog(`[Success] Task ${task.id} completed after ${iteration} iterations ✅`);
        onTaskUpdate?.({ ...task, status: "completed" });
        onPulseComplete?.({ taskId: task.id, finalOutput: agentB, iterations: iteration });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        addLog(`[Error] ${errorMessage}`, "error");
        onTaskUpdate?.({ ...task, status: "failed" });
      } finally {
        setIsRunning(false);
        setCurrentTask(null);
      }
    },
    [addLog, onTaskUpdate, onPulseComplete, pulseIntervalMs, refinementCycles, safeCompute, refineFile, dualMode]
  );

  const abortCurrentTask = useCallback(() => {
    addLog("[Abort] Current task aborted", "warn");
    setIsRunning(false);
    setCurrentTask(null);
    setProgress({ step: 0, total: 0 });
  }, [addLog]);

  const downloadRefinedFiles = useCallback(async () => {
    if (!currentTask?.attachedFiles?.length) {
      addLog("[DownloadError] No files to download", "warn");
      return;
    }

    try {
      const zip = new JSZip();
      for (const file of currentTask.attachedFiles as RepoFileLike[]) {
        zip.file(file.name, file.refinedContent || file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${currentTask.id || "refined"}-files.zip`);
      addLog("[Download] Refined files exported as ZIP");
    } catch (err: unknown) {
      addLog(`[DownloadError] ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
    }
  }, [addLog, currentTask]);

  const progressPercentage = useMemo(() => {
    return progress.total > 0 ? Math.min((progress.step / progress.total) * 100, 100) : 0;
  }, [progress]);

  return (
    <section className="p-4 bg-gray-900 text-white rounded-xl border border-gray-700 shadow-lg space-y-3" aria-labelledby="pulse-engine-title">
      <header className="flex justify-between items-center">
        <h2 id="pulse-engine-title" className="text-lg font-bold flex items-center gap-2">
          Back-and-Forth Pulse Engine
          <ShieldCheck className={`w-4 h-4 ${chainValid ? "text-green-400" : "text-red-400"}`} aria-label={chainValid ? "Chain valid" : "Chain invalid"} />
        </h2>
        {isRunning && <Loader2 className="animate-spin w-4 h-4 text-blue-400" aria-label="Processing" />}
      </header>

      {progress.total > 0 && (
        <div className="w-full bg-gray-700 h-2 rounded-full" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <pre className="bg-gray-800 p-3 rounded-lg max-h-40 overflow-y-auto text-xs font-mono" aria-label="Task logs">
        {logs.map((l, i) => (
          <div key={i} className={`text-${l.level === "error" ? "red-300" : l.level === "warn" ? "yellow-300" : "gray-300"}`}>
            [{l.ts}] [{l.level.toUpperCase()}] {l.msg}
          </div>
        ))}
      </pre>

      <div className="bg-gray-800 p-3 rounded-lg text-xs text-green-300">
        <strong>Last Output:</strong>
        <pre className="whitespace-pre-wrap">{lastOutput}</pre>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 p-2 rounded-lg text-red-300 flex items-center gap-2 text-sm">
          <XCircle className="w-4 h-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        {currentTask && (
          <>
            <button
              onClick={abortCurrentTask}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs"
              aria-label="Abort current task"
            >
              Abort
            </button>
            <button
              onClick={downloadRefinedFiles}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs flex items-center gap-1"
              aria-label="Download refined files"
              disabled={!currentTask.attachedFiles?.length}
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </>
        )}
      </div>

      {!isRunning && tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => runBackAndForthTask(task)}
              className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-left"
              aria-label={`Run task: ${task.description}`}
            >
              ▶ {task.description}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export { BackAndForthPulse };