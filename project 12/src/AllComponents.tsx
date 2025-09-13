// ---- AgoraLucentis.tsx ----
import { Network } from './Blockchain';
import confetti from 'canvas-confetti';
import { AlertTriangle } from 'lucide-react';
import { Award } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { Send } from 'lucide-react';
import { ThumbsUp } from 'lucide-react';
import { User } from 'lucide-react';
import { Zap } from 'lucide-react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import React from 'react';
"use client";
// Define interfaces for type safety
interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  upvotes: string[];
  flags: string[];
  luxScore: number;
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
}

interface Network {
  blockchain: {
    posts: Post[];
    comments: Comment[];
    addPost: (author: string, content: string) => Promise<boolean>;
    addComment: (author: string, postId: string, content: string) => Promise<boolean>;
    addVote: (voter: string, postId: string) => Promise<void>;
    addFlag: (flagger: string, postId: string) => Promise<void>;
    getLuxScore: (address: string) => number;
    getRank: (address: string) => { title: string };
    onPostAdded: ((post: Post) => void) | null;
    onCommentAdded: ((comment: Comment) => void) | null;
    onVoteAdded: ((postId: string, voter: string) => void) | null;
    onFlagAdded: ((postId: string, flagger: string) => void) | null;
  } | null;
}

interface AgoraLucentisProps {
  network: Network | null;
}

const MAX_POST_LENGTH = 280;

const MAX_LOGS = 20;

const AgoraLucentis: React.FC<AgoraLucentisProps> = ({ network }) => {
  const [address, setAddress] = useState<string>("0x1");
  const [postContent, setPostContent] = useState<string>("");
  const [commentContent, setCommentContent] = useState<string>("");
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [isCommenting, setIsCommenting] = useState<boolean>(false);
  const [luxScore, setLuxScore] = useState<number>(0);
  const [rank, setRank] = useState<string>("Novice");

  // Memoized blockchain data
  const safePosts = useMemo(() => network?.blockchain?.posts ?? [], [network]);
  const safeComments = useMemo(() => network?.blockchain?.comments ?? [], [network]);

  // Effect for blockchain event listeners
  useEffect(() => {
    if (!network?.blockchain) return;

    const bc = network.blockchain;

    const handlePostAdded = (post: Post) => {
      setLogs(prev => [...prev, `🔥 New revelation from ${post.author}: "${post.content.substring(0, 30)}..."`].slice(-MAX_LOGS));
    };

    const handleCommentAdded = (comment: Comment) => {
      setLogs(prev => [...prev, `💬 ${comment.author} responds on post ${comment.postId.substring(0, 8)}...`].slice(-MAX_LOGS));
    };

    const handleVoteAdded = (postId: string, voter: string) => {
      setLogs(prev => [...prev, `👍 ${voter} aligns with truth ${postId.substring(0, 8)}...`].slice(-MAX_LOGS));
    };

    const handleFlagAdded = (postId: string, flagger: string) => {
      setLogs(prev => [...prev, `⚠️ ${flagger} questions ${postId.substring(0, 8)}...`].slice(-MAX_LOGS));
    };

    bc.onPostAdded = handlePostAdded;
    bc.onCommentAdded = handleCommentAdded;
    bc.onVoteAdded = handleVoteAdded;
    bc.onFlagAdded = handleFlagAdded;

    setLuxScore(bc.getLuxScore(address));
    setRank(bc.getRank(address).title);

    return () => {
      bc.onPostAdded = null;
      bc.onCommentAdded = null;
      bc.onVoteAdded = null;
      bc.onFlagAdded = null;
    };
  }, [network, address]);

  const log = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-MAX_LOGS), message]);
  }, []);

  const addPost = useCallback(async () => {
    if (!network?.blockchain || !postContent.trim() || isPosting || postContent.length > MAX_POST_LENGTH) return;

    setIsPosting(true);
    try {
      const success = await network.blockchain.addPost(address, postContent.trim());
      if (success) {
        setPostContent("");
        log(`🌟 Revelation posted! Your LuxScore: ${network.blockchain.getLuxScore(address)}`);
        setLuxScore(network.blockchain.getLuxScore(address));
        setRank(network.blockchain.getRank(address).title);

        if (network.blockchain.getLuxScore(address) >= 10) {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err: unknown) {
      log(`❌ Revelation blocked: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPosting(false);
    }
  }, [network, address, postContent, isPosting, log]);

  const addComment = useCallback(async () => {
    if (!network?.blockchain || !commentContent.trim() || !selectedPostId || isCommenting) return;

    setIsCommenting(true);
    try {
      const success = await network.blockchain.addComment(address, selectedPostId, commentContent.trim());
      if (success) {
        setCommentContent("");
        log(`💭 Response etched in covenant.`);
        setLuxScore(network.blockchain.getLuxScore(address));
        setRank(network.blockchain.getRank(address).title);
      }
    } catch (err: unknown) {
      log(`❌ Response failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCommenting(false);
    }
  }, [network, address, commentContent, selectedPostId, isCommenting, log]);

  const addVote = useCallback(async (postId: string) => {
    if (!network?.blockchain) return;
    try {
      await network.blockchain.addVote(address, postId);
      log(`✨ Alignment forged with ${postId.substring(0, 8)}...`);
      setLuxScore(network.blockchain.getLuxScore(address));
    } catch (err: unknown) {
      log(`❌ Alignment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [network, address, log]);

  const addFlag = useCallback(async (postId: string) => {
    if (!network?.blockchain) return;
    try {
      await network.blockchain.addFlag(address, postId);
      log(`⚖️ Truth questioned: ${postId.substring(0, 8)}...`);
    } catch (err: unknown) {
      log(`❌ Flag failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [network, address, log]);

  const sortedPosts = useMemo(() => 
    [...safePosts].sort((a, b) => 
      (b.luxScore + b.upvotes.length) - (a.luxScore + a.upvotes.length)
    ), [safePosts]);

  const getPostComments = useCallback((postId: string) => {
    return safeComments.filter(c => c.postId === postId);
  }, [safeComments]);

  const getPostRankColor = useCallback((luxScore: number, flags: string[]) => {
    if (flags.length >= 5) return 'text-red-400';
    if (luxScore >= 50) return 'text-purple-400';
    if (luxScore >= 10) return 'text-green-400';
    return 'text-gray-400';
  }, []);

  if (!network) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900/50 rounded-2xl border border-gray-700">
        <div className="text-center text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Initializing Sovereign Network...</p>
          <p className="text-sm">The covenant awaits connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-blue-900/30 shadow-xl glow-effect p-6 space-y-6">
      <header className="flex justify-between items-center border-b border-blue-900/50 pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white terminal-text">Agora Lucentis</h1>
            <p className="text-sm text-gray-400">The Sovereign Forum of Aligned Minds</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-300">Agent: {address.slice(0, 6)}...{address.slice(-4)}</div>
          <div className="flex items-center space-x-2 text-sm">
            <Award className="w-4 h-4 text-yellow-400" />
            <span>LuxScore: <span className="font-bold text-yellow-400">{luxScore}</span></span>
            <span className="ml-4">Rank: <span className={`font-bold ${luxScore >= 100 ? 'text-purple-400' : luxScore >= 50 ? 'text-indigo-400' : 'text-green-400'}`}>{rank}</span></span>
          </div>
        </div>
      </header>

      <Card title="Forge Revelation" className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl pointer-events-none" />
        <div className="space-y-3">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/80 border border-blue-900/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Share your sovereign truth... What revelation do you bring to the covenant?"
            rows={3}
            disabled={isPosting}
            maxLength={MAX_POST_LENGTH}
            aria-label="Post content"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{postContent.length}/{MAX_POST_LENGTH} characters</span>
            <Button onClick={addPost} disabled={isPosting || !postContent.trim()}>
              <Send className={`w-4 h-4 mr-2 ${isPosting ? 'animate-spin' : ''}`} />
              {isPosting ? 'Forging...' : 'Reveal Truth'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Respond to Truth">
        <div className="space-y-3">
          <div className="flex space-x-3">
            <select
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-900/80 border border-blue-900/50 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Select post to comment"
            >
              <option value="">Select Revelation</option>
              {sortedPosts.map(post => (
                <option key={post.id} value={post.id}>
                  {post.author}: {post.content.substring(0, 30)}... ({post.upvotes.length} alignments)
                </option>
              ))}
            </select>
          </div>
          {selectedPostId && (
            <div>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/80 border border-blue-900/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add your sovereign response..."
                rows={2}
                disabled={isCommenting}
                aria-label="Comment content"
              />
              <Button onClick={addComment} disabled={isCommenting || !commentContent.trim()} className="mt-2">
                <Send className={`w-4 h-4 mr-2 ${isCommenting ? 'animate-spin' : ''}`} />
                {isCommenting ? 'Responding...' : 'Respond'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card title="The Eternal Revelations" className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {sortedPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">The forum awaits its first sovereign truth...</p>
            </div>
          ) : (
            sortedPosts.map((post) => {
              const comments = getPostComments(post.id);
              const rankColor = getPostRankColor(post.luxScore, post.flags);
              const isFlagged = post.flags.length >= 5;

              return (
                <article key={post.id} className={`p-4 rounded-xl border transition-all duration-300 ${
                  isFlagged ? 'border-red-500/50 opacity-60' : 'border-blue-900/30 hover:border-blue-500/50'
                }`} aria-labelledby={`post-${post.id}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-6 h-6 text-blue-400" />
                      <span id={`post-${post.id}`} className="font-semibold text-white">{post.author}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${rankColor}`}>
                        {post.luxScore}✨
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <time dateTime={new Date(post.timestamp).toISOString()}>
                        {new Date(post.timestamp).toLocaleString()}
                      </time>
                      <span aria-label="Number of upvotes">• {post.upvotes.length} alignments</span>
                      {isFlagged && <AlertTriangle className="w-4 h-4 text-red-400" aria-label="Flagged post" />}
                    </div>
                  </div>

                  <p className="text-gray-200 mb-3 leading-relaxed">{post.content}</p>

                  <div className="flex items-center space-x-4 text-sm mb-3">
                    <button
                      onClick={() => addVote(post.id)}
                      className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition"
                      disabled={!network}
                      aria-label={`Vote for post ${post.id}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Align ({post.upvotes.length})</span>
                    </button>
                    <button
                      onClick={() => addFlag(post.id)}
                      className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition"
                      disabled={!network}
                      aria-label={`Flag post ${post.id}`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Question ({post.flags.length})</span>
                    </button>
                  </div>

                  {comments.length > 0 && (
                    <div className="space-y-2 ml-6 border-l border-gray-700 pl-3">
                      {comments.slice(-3).map((comment) => (
                        <div key={comment.id} className="text-xs text-gray-400">
                          <span className="font-medium text-gray-300">{comment.author}:</span> {comment.content}
                        </div>
                      ))}
                      {comments.length > 3 && (
                        <span className="text-xs text-gray-500">... and {comments.length - 3} more</span>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </Card>

      <Card title="Covenant Echoes">
        <div className="max-h-32 overflow-y-auto bg-gray-900/50 p-3 rounded-lg text-xs font-mono">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-2">The covenant listens...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1 text-gray-300 truncate">{log}</div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = "" }) => (
  <section className={`bg-gray-900/70 rounded-xl border border-gray-700/50 p-4 ${className}`} aria-labelledby={`card-${title}`}>
    <h3 id={`card-${title}`} className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
      <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-purple-500 rounded" />
      <span>{title}</span>
    </h3>
    {children}
  </section>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className} ${
      disabled 
        ? 'bg-gray-600 text-gray-400' 
        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25'
    }`}
    aria-disabled={disabled}
  >
    {children}
  </button>
);

export default AgoraLucentis;

export { Card, Button };

// ---- BackAndForthPulseComponent.tsx ----
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

// ---- Blockchain.tsx ----
import { keccak256 } from 'ethers';
import { toUtf8Bytes } from 'ethers';
/* ---------- Interfaces ---------- */
export interface Transaction {
  from: string;
  to: string;
  value: number;
  gas: number;
  data?: string;
  nonce: number;
  sourceNetwork: string;
  targetNetwork?: string;
  signature?: string;
}

export interface TransactionReceipt {
  transaction: Transaction;
  status: "success" | "failed" | "pending";
  gasUsed: number;
  contractAddress?: string;
}

export interface BlockHeader {
  parentHash: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  number: number;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  difficulty: number;
  nonce: number;
  networkId: string;
}

export interface SoulboundId {
  id: string;
  address: string;
  dnaHash: string;
  birthCertificate: {
    issuer: string;
    createdAt: string;
    address: string;
  };
  signature?: string;
}

export interface Post {
  id: string;
  author: string;
  content: string;
  ipfsCid?: string;
  timestamp: number;
  upvotes: string[];
  flags: string[];
  luxScore: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface Voucher {
  id: string;
  from: string;
  to: string;
  value: number;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  action: string;
  data: any;
  hash: string;
  previousHash: string;
  timestamp: number;
}

export interface Rank {
  tier: number;
  title: string;
  minLuxScore: number;
}

/* ---------- Block Class ---------- */
export class Block {
  header!: BlockHeader;
  transactions: Transaction[] = [];
  receipts: TransactionReceipt[] = [];
  hash: string = "";
  accounts?: Map<string, { balance: number; nonce: number; luxScore?: number }>;

  static async create(
    parentHash: string,
    stateRoot: string,
    transactions: Transaction[],
    number: number,
    timestamp: number,
    difficulty: number,
    nonce: number,
    networkId: string,
    accounts?: Map<string, { balance: number; nonce: number; luxScore?: number }>
  ): Promise<Block> {
    const block = new Block();

    block.header = {
      parentHash,
      stateRoot,
      transactionsRoot: await block.calculateTransactionsRoot(transactions),
      receiptsRoot: await block.calculateReceiptsRoot(transactions),
      number,
      gasLimit: 30_000_000,
      gasUsed: block.calculateGasUsed(transactions),
      timestamp,
      difficulty,
      nonce,
      networkId,
    };

    block.transactions = transactions;
    block.receipts = transactions.map((tx) => ({
      transaction: tx,
      status: block.validateTransaction(tx) ? "success" : "failed",
      gasUsed: tx.gas,
    }));
    block.accounts = accounts;
    block.hash = await block.calculateHash();

    return block;
  }

  validateTransaction(tx: Transaction): boolean {
    const sender = this.accounts?.get(tx.from);
    return !!sender && sender.balance >= tx.value + tx.gas;
  }

  async calculateHash(): Promise<string> {
    return keccak256(toUtf8Bytes(JSON.stringify(this.header)));
  }

  async calculateTransactionsRoot(transactions: Transaction[]): Promise<string> {
    return transactions.length > 0
      ? keccak256(toUtf8Bytes(JSON.stringify(transactions)))
      : "0".repeat(64);
  }

  async calculateReceiptsRoot(transactions: Transaction[]): Promise<string> {
    const receipts = transactions.map((t) => ({
      status: this.validateTransaction(t) ? 1 : 0,
      gasUsed: t.gas,
    }));
    return keccak256(toUtf8Bytes(JSON.stringify(receipts)));
  }

  calculateGasUsed(transactions: Transaction[]): number {
    return transactions.reduce((sum, tx) => sum + tx.gas, 0);
  }

  toJSON() {
    return {
      header: this.header,
      transactions: this.transactions,
      hash: this.hash,
      receipts: this.receipts,
    };
  }
}

/* ---------- Blockchain Class ---------- */
export class Blockchain {
  id: string;
  blocks: Block[] = [];
  accounts: Map<string, { balance: number; nonce: number; luxScore?: number }> = new Map();
  soulboundIds: Record<string, SoulboundId> = {}; 
  onSoulboundIdCreated?: (id: SoulboundId) => void;

  private constructor(id: string) {
    this.id = id;
  }

  static async create(id: string): Promise<Blockchain> {
    const chain = new Blockchain(id);
    const genesis = await Block.create(
      "0".repeat(64),
      "0".repeat(64),
      [],
      0,
      Date.now(),
      1,
      0,
      id,
      chain.accounts
    );
    chain.blocks.push(genesis);
    return chain;
  }

  getLatestBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  async addBlock(transactions: Transaction[]): Promise<Block> {
    const latest = this.getLatestBlock();
    const block = await Block.create(
      latest.hash,
      "0".repeat(64),
      transactions,
      latest.header.number + 1,
      Date.now(),
      latest.header.difficulty,
      Math.floor(Math.random() * 1e6),
      this.id,
      this.accounts
    );
    this.blocks.push(block);
    return block;
  }

  /* ---------- Soulbound ID Methods ---------- */
  async createSoulboundId(address: string, data: any): Promise<SoulboundId> {
    const dnaHash = keccak256(toUtf8Bytes(JSON.stringify(data) + Date.now()));
    const id: SoulboundId = {
      id: keccak256(toUtf8Bytes(address + dnaHash)),
      address,
      dnaHash,
      birthCertificate: {
        issuer: this.id,
        createdAt: new Date().toISOString(),
        address,
      },
      signature: undefined,
    };
    this.soulboundIds[address] = id;
    if (this.onSoulboundIdCreated) this.onSoulboundIdCreated(id);
    return id;
  }

  getSoulboundId(address: string): SoulboundId | null {
    return this.soulboundIds[address] || null;
  }

  getLuxScore(address: string): number {
    const sb = this.getSoulboundId(address);
    return sb ? Math.floor(Math.random() * 100) : 0;
  }

  getRank(address: string): Rank {
    const score = this.getLuxScore(address);
    if (score > 80) return { tier: 3, title: "High", minLuxScore: 80 };
    if (score > 50) return { tier: 2, title: "Medium", minLuxScore: 50 };
    return { tier: 1, title: "Low", minLuxScore: 0 };
  }
}

/* ---------- Network Class ---------- */
export class Network {
  id: string;
  blockchain: Blockchain;
  peers: Map<string, Network>;

  private constructor(id: string, blockchain: Blockchain) {
    this.id = id;
    this.blockchain = blockchain;
    this.peers = new Map();
  }

  static async create(id: string): Promise<Network> {
    const blockchain = await Blockchain.create(id);
    return new Network(id, blockchain);
  }

  addPeer(network: Network) {
    this.peers.set(network.id, network);
    network.peers.set(this.id, this);
  }
}

/* ---------- Exports ---------- */
export {
  Post,
  Comment,
  Voucher,
  LogEntry,
  Rank,
};

// ---- BlockchainEngine.tsx ----
import { Block } from './Blockchain';
import { Blockchain } from './Blockchain';
import { Network } from './Blockchain';
import { CharisVouchers } from './CharisVouchers';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';

export const BlockchainEngine: React.FC = () => {
  const [network1, setNetwork1] = useState<Network | null>(null);
  const [network2, setNetwork2] = useState<Network | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("0x1");
  const [personalData, setPersonalData] = useState<string>("");
  const [soulboundId, setSoulboundId] = useState<SoulboundId | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const initNetworks = async () => {
      try {
        const n1 = await Network.create("network1");
        const n2 = await Network.create("network2");
        n1.addPeer(n2);

        n1.blockchain.onBlockMined = (block) => {
          const log = `Block mined on ${block.header.networkId}: ${block.hash.substring(0, 16)}...`;
          mounted && setLogs(prev => [...prev, log]);
          n1.syncState();
        };

        n2.blockchain.onBlockMined = (block) => {
          const log = `Block mined on ${block.header.networkId}: ${block.hash.substring(0, 16)}...`;
          mounted && setLogs(prev => [...prev, log]);
          n2.syncState();
        };

        n1.blockchain.onTransactionAdded = (tx) => {
          const log = `Transaction added on ${tx.sourceNetwork}: ${tx.from} -> ${tx.to} (${tx.value})`;
          mounted && setLogs(prev => [...prev, log]);
        };

        n2.blockchain.onTransactionAdded = (tx) => {
          const log = `Transaction added on ${tx.sourceNetwork}: ${tx.from} -> ${tx.to} (${tx.value})`;
          mounted && setLogs(prev => [...prev, log]);
        };

        n1.blockchain.onSoulboundIdCreated = (id) => {
          const log = `Soulbound ID created for ${id.address}: ${id.id}`;
          mounted && setLogs(prev => [...prev, log]);
          mounted && setSoulboundId(id);
        };

        if (mounted) {
          setNetwork1(n1);
          setNetwork2(n2);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize networks:", err);
        setLoading(false);
      }
    };

    initNetworks();

    return () => { mounted = false; };
  }, []);

  const addCrossChainTransaction = async () => {
    if (!network1) return;
    const success = network1.blockchain.addTransaction("0x1", "0x2", 100, 21000, undefined, network2?.id);
    if (success) {
      const newBlock = await network1.blockchain.mineBlock();
      if (newBlock) {
        const log = `New block mined on ${network1.id}: ${newBlock.hash.substring(0, 16)}...`;
        setLogs(prev => [...prev, log]);
      }
    }
  };

  const addLocalTransaction = async () => {
    if (!network1) return;
    const success = network1.blockchain.addTransaction("0x1", "0xMiner", 50, 21000);
    if (success) {
      const newBlock = await network1.blockchain.mineBlock();
      if (newBlock) {
        const log = `Local block mined on ${network1.id}: ${newBlock.hash.substring(0, 16)}...`;
        setLogs(prev => [...prev, log]);
      }
    }
  };

  const createSoulboundId = async () => {
    if (!network1 || !personalData) return;
    try {
      const parsedData = JSON.parse(personalData);
      const id = await network1.blockchain.createSoulboundId(address, parsedData);
      setSoulboundId(id);
    } catch (err: any) {
      setLogs(prev => [...prev, `Failed to create soulbound ID: ${err.message}`]);
    }
  };

  const verifySoulboundId = async () => {
    if (!network1 || !soulboundId) return;
    try {
      // Future-proof: Add actual verify method on Blockchain if missing
      const isValid = soulboundId.id === soulboundId.dnaHash; // Simplified check
      setVerificationStatus(isValid ? 'Valid' : 'Invalid');
      setLogs(prev => [...prev, `Soulbound ID verification for ${address}: ${isValid ? 'Valid' : 'Invalid'}`]);
    } catch (err: any) {
      setLogs(prev => [...prev, `Failed to verify soulbound ID: ${err.message}`]);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-300 py-6">Initializing Blockchain Networks...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">SolaVia Protocol Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blockchain Engine Panel */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Blockchain Engine</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button onClick={addLocalTransaction} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              Add Local Transaction
            </button>
            <button onClick={addCrossChainTransaction} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              Add Cross-Chain Transaction
            </button>
          </div>
          <div className="text-sm text-gray-400">
            Networks: {network1?.id} ↔ {network2?.id} | Blocks: {network1?.blockchain.chain.length || 0}
          </div>
        </div>

        {/* Soulbound ID Management */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Soulbound ID Management</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter account address (e.g., 0x1)"
            />
            <textarea
              value={personalData}
              onChange={(e) => setPersonalData(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder='{"username": "user1", "email": "user1@example.com"}'
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={createSoulboundId} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                Create Soulbound ID
              </button>
              <button onClick={verifySoulboundId} disabled={!soulboundId} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition">
                Verify Soulbound ID
              </button>
            </div>
            {soulboundId && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-2">Soulbound ID Details</h4>
                <p className="text-sm text-gray-300"><strong>ID:</strong> {soulboundId.id}</p>
                <p className="text-sm text-gray-300"><strong>Address:</strong> {soulboundId.address}</p>
                <p className="text-sm text-gray-300"><strong>DNA Hash:</strong> {soulboundId.dnaHash.substring(0, 16)}...</p>
                <p className="text-sm text-gray-300"><strong>Issuer:</strong> {soulboundId.birthCertificate.issuer}</p>
                <p className="text-sm text-gray-300"><strong>Created At:</strong> {soulboundId.birthCertificate.createdAt}</p>
                <p className="text-sm text-gray-300"><strong>Verification Status:</strong> {verificationStatus || 'Not verified'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modular Components */}
        <AgoraLucentis network={network1} />
        <LuxMeter network={network1} />
        <CharisVouchers network={network1} />
        <TCCLogger network={network1} />

        {/* Logs */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-2">Global Activity Log</h3>
          {logs.length > 0 ? (
            logs.map((log, i) => <p key={i} className="text-sm text-gray-300 mb-1">{log}</p>)
          ) : (
            <p className="text-sm text-gray-400">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- BlockchainInterface.tsx ----
import { Block } from './Blockchain';
import { Blockchain } from './Blockchain';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';
// Filename: BlockchainInterface
"use client";

export interface BlockchainInterfaceProps {
  blockchain: IBlockchain;
  address: string;
}

export const BlockchainInterface: React.FC<BlockchainInterfaceProps> = ({ blockchain, address }) => {
  const [latestBlock, setLatestBlock] = useState<BlockchainBlock | null>(null);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [soulboundId, setSoulboundId] = useState<SoulboundId | null>(null);
  const [luxScore, setLuxScore] = useState<number>(0);
  const [rank, setRank] = useState<Rank | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    try {
      setLatestBlock(blockchain.getLatestBlock());
      setTransactions(blockchain.getLatestBlock()?.transactions || []);
      setSoulboundId(blockchain.getSoulboundId(address));
      setLuxScore(blockchain.getLuxScore(address));
      setRank(blockchain.getRank(address));
    } catch (err: any) {
      setError(err.message || "Failed to fetch blockchain data");
    }
  }, [blockchain, address]);

  const createSoulbound = async () => {
    try {
      const personalData = { username: `user_${address}`, timestamp: Date.now() };
      const id = await blockchain.createSoulboundId(address, personalData);
      setSoulboundId(id);
      setLuxScore(blockchain.getLuxScore(address));
      setRank(blockchain.getRank(address));
    } catch (err: any) {
      setError(err.message || "Failed to create Soulbound ID");
    }
  };

  useEffect(() => {
    fetchData();
    blockchain.onBlockMined = fetchData;
    blockchain.onTransactionAdded = fetchData;
    blockchain.onSoulboundIdCreated = (id) => {
      if (id.address === address) fetchData();
    };
  }, [blockchain, address, fetchData]);

  return (
    <div className="bg-gray-900 text-gray-200 rounded-xl p-6 space-y-4 shadow-lg">
      {error && <div className="text-red-400">{error}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Blockchain Info</h2>
        {!soulboundId && (
          <button
            onClick={createSoulbound}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md text-white text-sm transition"
          >
            Create Soulbound ID
          </button>
        )}
      </div>

      {soulboundId && (
        <div className="text-sm space-y-1">
          <p><strong>Address:</strong> {address}</p>
          <p><strong>ID:</strong> {soulboundId.id}</p>
          <p><strong>LuxScore:</strong> {luxScore.toFixed(2)}</p>
          <p><strong>Rank:</strong> {rank?.title}</p>
        </div>
      )}

      {latestBlock && (
        <div className="mt-4">
          <h3 className="font-semibold">Latest Block:</h3>
          <p className="text-xs break-all">Hash: {latestBlock.hash}</p>
          <p className="text-xs">Index: {latestBlock.index}</p>
          <p className="text-xs">Transactions: {latestBlock.transactions.length}</p>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Transactions:</h3>
          <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
            {transactions.map((tx) => (
              <li key={tx.hash} className="border-b border-gray-700 py-1">
                {tx.from} → {tx.to}: {tx.amount}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ---- Browser.tsx ----
import { Database } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Search } from 'lucide-react';
import { Users } from 'lucide-react';
import { Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import React from 'react';
"use client";

interface Block {
  header: {
    number: number;
    hash: string;
    parentHash: string;
    timestamp: number;
    transactionsRoot: string;
    receiptsRoot: string;
    gasUsed: number;
  };
  transactions: Transaction[];
  receipts: any[];
}

interface Transaction {
  from: string;
  to: string;
  value: number;
  gas: number;
  data?: string;
  nonce: number;
  hash?: string;
}

interface Account {
  address: string;
  balance: number;
  nonce: number;
  luxScore: number;
}

export const Browser: React.FC<{ network: any }> = ({ network }) => {
  const [activeTab, setActiveTab] = useState<"blocks" | "transactions" | "accounts">("blocks");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const blocks = useMemo(() => network?.blockchain?.chain || [], [network]);
  const transactions = useMemo(
    () => (network?.blockchain?.chain ? network.blockchain.chain.flatMap((b: Block) => b.transactions) : []),
    [network]
  );
  const accounts = useMemo(
    () =>
      network?.blockchain?.accounts
        ? Array.from(network.blockchain.accounts.entries()).map(([address, data]) => ({
            address,
            balance: data.balance,
            nonce: data.nonce,
            luxScore: data.luxScore,
          }))
        : [],
    [network]
  );

  useEffect(() => {
    if (!searchQuery) return;
    if (activeTab === "blocks") {
      const found = blocks.find(
        (b) => b.header.hash.includes(searchQuery) || b.header.number.toString().includes(searchQuery)
      );
      if (found) setSelectedBlock(found);
    } else if (activeTab === "transactions") {
      const found = transactions.find(
        (tx) =>
          tx.from.includes(searchQuery) ||
          (tx.to && tx.to.includes(searchQuery)) ||
          tx.hash?.includes(searchQuery)
      );
      if (found) setSelectedTransaction(found);
    } else if (activeTab === "accounts") {
      const found = accounts.find((acc) => acc.address.includes(searchQuery));
      if (found) setSelectedAccount(found);
    }
  }, [searchQuery, activeTab, blocks, transactions, accounts]);

  return (
    <div className="space-y-6 min-h-[600px]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Database className="w-8 h-8 mr-2 text-blue-400" />
          Sovereign Chain Explorer
        </h1>
        <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: "blocks" as const, label: "Blocks", icon: FileText },
            { id: "transactions" as const, label: "Txns", icon: Zap },
            { id: "accounts" as const, label: "Accounts", icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
                activeTab === id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="relative"
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search blocks, transactions, addresses..."
          className="w-full pl-10 pr-4 py-3 bg-gray-900/80 border border-blue-900/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
        />
      </form>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* List Panel */}
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-700">
          {activeTab === "blocks" && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {blocks.slice(-10).reverse().map((block) => (
                <div
                  key={block.header.hash}
                  onClick={() => setSelectedBlock(block)}
                  className="p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700 cursor-pointer transition-all duration-200 flex justify-between items-center"
                >
                  <div>
                    <div className="font-mono text-sm text-blue-400">Block #{block.header.number}</div>
                    <div className="font-mono text-xs text-gray-400 truncate" title={block.header.hash}>
                      {block.header.hash.slice(0, 20)}...
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {new Date(block.header.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">{block.transactions.length} txns</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "transactions" &&
            transactions.slice(-20).map((tx) => (
              <div
                key={tx.hash || `${tx.from}-${tx.nonce}`}
                onClick={() => setSelectedTransaction(tx)}
                className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 cursor-pointer transition-all duration-200 flex flex-col"
              >
                <div className="font-mono text-xs text-gray-300 truncate">From: {tx.from.slice(0, 8)}...</div>
                <div className="font-mono text-xs text-gray-300 truncate">
                  To: {tx.to ? tx.to.slice(0, 8) + "..." : "New Contract"}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-green-400">{tx.value} ETH</span>
                  <span className="text-xs text-gray-400">Gas: {tx.gas}</span>
                </div>
              </div>
            ))}

          {activeTab === "accounts" &&
            accounts.slice(0, 10).map((acc) => (
              <div
                key={acc.address}
                onClick={() => setSelectedAccount(acc)}
                className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 cursor-pointer transition-all duration-200 flex justify-between"
              >
                <span className="font-mono text-sm text-blue-400 truncate">{acc.address.slice(0, 10)}...</span>
                <span className="text-sm text-green-400">{acc.balance} ETH</span>
              </div>
            ))}
        </div>

        {/* Details Panel */}
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-700">
          {activeTab === "blocks" && selectedBlock && (
            <div className="space-y-4">
              <div className="font-mono text-lg text-blue-400">
                Block #{selectedBlock.header.number}
              </div>
              <div className="font-mono text-xs text-gray-400">
                Hash: {selectedBlock.header.hash}
              </div>
              <div className="font-mono text-xs text-gray-400">
                Parent: {selectedBlock.header.parentHash}
              </div>
              <div className="font-mono text-xs text-gray-400">
                Gas Used: {selectedBlock.header.gasUsed}
              </div>
              <div className="font-mono text-xs text-gray-400">
                Transactions: {selectedBlock.transactions.length}
              </div>
            </div>
          )}

          {activeTab === "transactions" && selectedTransaction && (
            <div className="space-y-3">
              <div className="font-mono text-lg text-blue-400">Tx {selectedTransaction.hash}</div>
              <div className="font-mono text-xs text-gray-400">From: {selectedTransaction.from}</div>
              <div className="font-mono text-xs text-gray-400">To: {selectedTransaction.to || "New Contract"}</div>
              <div className="font-mono text-xs text-gray-400">Value: {selectedTransaction.value} ETH</div>
              <div className="font-mono text-xs text-gray-400">Gas: {selectedTransaction.gas}</div>
            </div>
          )}

          {activeTab === "accounts" && selectedAccount && (
            <div className="space-y-3">
              <div className="font-mono text-lg text-blue-400">{selectedAccount.address}</div>
              <div className="font-mono text-xs text-gray-400">Balance: {selectedAccount.balance} ETH</div>
              <div className="font-mono text-xs text-gray-400">Nonce: {selectedAccount.nonce}</div>
              <div className="font-mono text-xs text-gray-400">LuxScore: {selectedAccount.luxScore}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- CharisVouchers.tsx ----
import { Network } from './Blockchain';
import confetti from 'canvas-confetti';
import { Gift } from 'lucide-react';
import { Send } from 'lucide-react';
import { User } from 'lucide-react';
import { Zap } from 'lucide-react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';
"use client";

export const CharisVouchers: React.FC<CharisVouchersProps> = ({ network }) => {
  const [address, setAddress] = useState("0x1");
  const [recipient, setRecipient] = useState("0x2");
  const [voucherValue, setVoucherValue] = useState("10");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isIssuing, setIsIssuing] = useState(false);
  const [luxScore, setLuxScore] = useState(0);
  const [rank, setRank] = useState("Novice");

  // Safe vouchers list (avoids crash if network not ready)
  const safeVouchers = network?.blockchain?.vouchers ?? [];

  useEffect(() => {
    if (!network?.blockchain) return;
    const bc = network.blockchain;

    // Initialize state
    setVouchers(safeVouchers);
    setLuxScore(bc.getLuxScore(address));
    setRank(bc.getRank(address).title);

    // Register voucher issuance callback
    bc.onVoucherIssued = (voucher: Voucher) => {
      setVouchers((prev) => [...prev, voucher]);
      setLogs((prev) => [...prev.slice(-19), `🎁 Voucher forged: ${voucher.from} → ${voucher.to} for ${voucher.value} LUX`]);
      setLuxScore(bc.getLuxScore(address));
      setRank(bc.getRank(address).title);

      if (voucher.value >= 50) {
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      }
    };

    return () => {
      bc.onVoucherIssued = undefined;
    };
  }, [network, address, safeVouchers]);

  const log = useCallback((message: string) => {
    setLogs((prev) => [...prev.slice(-20), message]);
  }, []);

  const issueVoucher = async () => {
    if (!network?.blockchain || !recipient.trim() || !voucherValue || isIssuing) return;
    const value = parseFloat(voucherValue);
    if (isNaN(value) || value <= 0) return log("❌ Invalid voucher value");

    setIsIssuing(true);
    try {
      const success = await network.blockchain.issueVoucher(address, recipient.trim(), value);
      if (success) {
        setVoucherValue("");
        log(`🌟 Voucher forged! Your LuxScore: ${network.blockchain.getLuxScore(address)}`);
      }
    } catch (err: any) {
      log(`❌ Voucher issuance failed: ${err.message}`);
    } finally {
      setIsIssuing(false);
    }
  };

  if (!network) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900/50 rounded-2xl border border-gray-700">
        <div className="text-center text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Initializing Sovereign Network...</p>
          <p className="text-sm">The covenant awaits connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-blue-900/30 shadow-xl glow-effect p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-blue-900/50 pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Charis Vouchers</h1>
            <p className="text-sm text-gray-400">Forge Bonds of Generosity</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-300">
            Agent: {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-yellow-400" />
            <span>LuxScore: <span className="font-bold text-yellow-400">{luxScore}</span></span>
            <span className="ml-4">Rank: <span className={`font-bold ${luxScore >= 100 ? 'text-purple-400' : luxScore >= 50 ? 'text-indigo-400' : 'text-green-400'}`}>{rank}</span></span>
          </div>
        </div>
      </div>

      {/* Voucher Creation */}
      <Card title="Forge Voucher">
        <div className="space-y-4">
          <InputField label="Sender Address" value={address} onChange={setAddress} disabled={isIssuing} />
          <InputField label="Recipient Address" value={recipient} onChange={setRecipient} disabled={isIssuing} />
          <InputField label="Voucher Value (LUX)" type="number" value={voucherValue} onChange={setVoucherValue} disabled={isIssuing} />

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Balance: {network.blockchain.accounts.get(address)?.balance ?? 0} LUX
            </span>
            <Button onClick={issueVoucher} disabled={isIssuing || !recipient.trim() || !voucherValue}>
              <Send className={`w-4 h-4 mr-2 ${isIssuing ? "animate-spin" : ""}`} />
              {isIssuing ? "Forging..." : "Issue Voucher"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Voucher List */}
      <Card title="Forged Bonds">
        <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
          {safeVouchers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bonds forged yet...</p>
            </div>
          ) : (
            safeVouchers.map((voucher) => (
              <div key={voucher.id} className="p-3 rounded-lg border border-blue-900/30 hover:border-blue-500/50 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-white">
                      {voucher.from.slice(0, 6)}... → {voucher.to.slice(0, 6)}...:{" "}
                      <span className="text-yellow-400">{voucher.value} LUX</span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(voucher.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Log */}
      <Card title="Covenant Echoes">
        <div className="max-h-32 overflow-y-auto bg-gray-900/50 p-3 rounded-lg text-xs font-mono">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-2">The covenant listens...</div>
          ) : (
            logs.map((log, i) => <div key={i} className="mb-1 text-gray-300 truncate">{log}</div>)
          )}
        </div>
      </Card>
    </div>
  );
};

// --- UI Helpers ---
const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-900/70 rounded-xl border border-gray-700/50 p-4">
    <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
      <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-purple-500 rounded" />
      {title}
    </h3>
    {children}
  </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string }> = ({ label, value, onChange, disabled, type = "text" }) => (
  <div>
    <label className="block text-sm text-gray-300 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2 bg-gray-900/80 border border-blue-900/50 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

const Button: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
      disabled
        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
    }`}
  >
    {children}
  </button>
);

// ---- ChatPulse.tsx ----
import { PulseEngine } from '../lib/pulse-main-extended.mjs';
import { BookOpen } from 'lucide-react';
import { Brain } from 'lucide-react';
import { Bug } from 'lucide-react';
import { Code } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Globe } from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { Hammer } from 'lucide-react';
import { Lightbulb } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Palette } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { Users } from 'lucide-react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';
"use client";
// ---------- Types ----------
interface LogMessage {
  role: string;
  text: string;
}

interface ChatPulseProps {
  cycles?: number;
}

interface Agent {
  name: string;
  tasks: string[];
  execute: (task: string) => Promise<string>;
  autonomousIteration: (name: string) => Promise<void>;
}

interface AgentFactory {
  agents: Agent[];
  createAgent: (
    name: string,
    strategies: {
      execute_task: (task: string) => Promise<string>;
      autonomous_iteration: (agentName: string) => Promise<void>;
    }
  ) => Promise<Agent>;
  deployAgent: (
    agent: Agent,
    task: string,
    callback: (message: string) => void
  ) => Promise<void>;
}

// ---------- Main Component ----------
export default function ChatPulseComponent({ cycles = 2 }: ChatPulseProps) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [factoryVisible, setFactoryVisible] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [agentsList, setAgentsList] = useState<Agent[]>([]);

  const engineRef = useRef<PulseEngine | null>(null);
  const agentFactoryRef = useRef<AgentFactory | null>(null);

  // ---------- Setup Engine & Factory ----------
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new PulseEngine();
    }

    if (!agentFactoryRef.current) {
      agentFactoryRef.current = {
        agents: [],
        createAgent: async (name, strategies) => {
          const agent: Agent = {
            name,
            tasks: [],
            execute: strategies.execute_task,
            autonomousIteration: strategies.autonomous_iteration,
          };
          agentFactoryRef.current?.agents.push(agent);
          return agent;
        },
        deployAgent: async (agent, task, callback) => {
          callback(`Deploying agent ${agent.name} for task: ${task}`);
          const result = await agent.execute(task);
          callback(result);
          if (agent.autonomousIteration) {
            await agent.autonomousIteration(agent.name);
          }
        },
      };
    }
  }, []);

  const extractText = (res: any): string => {
    if (!res) return "";
    if (typeof res === "string") return res;
    if (res.output_text) return res.output_text;
    if (res.output) return res.output;
    return JSON.stringify(res);
  };

  // ---------- Run Chat ----------
  const runChat = async () => {
    if (!engineRef.current || !input.trim()) return;
    setRunning(true);
    setLogs([{ role: "User", text: input }]);

    const factory = agentFactoryRef.current;

    try {
      let context = input;

      // Run cycles through engine
      for (let i = 0; i < cycles; i++) {
        const res = await engineRef.current!.compute(context, i);
        const text = extractText(res);
        setLogs((prev) => [...prev, { role: `Cycle ${i + 1}`, text }]);
        context += " " + text;
      }

      // Deploy agents if any
      for (const agent of factory!.agents) {
        await factory!.deployAgent(agent, context, (msg) =>
          setLogs((prev) => [...prev, { role: agent.name, text: msg }])
        );
      }

      setLogs((prev) => [...prev, { role: "✅ Final Output", text: context }]);
    } catch (err: any) {
      setLogs((prev) => [...prev, { role: "Error", text: err.message || String(err) }]);
    } finally {
      setRunning(false);
      setInput("");
    }
  };

  // ---------- Render Tabs ----------
  const renderTabs = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
      {[
        { key: "chat", label: "Chat", icon: ShieldCheck },
        { key: "review", label: "Review Code", icon: Bug },
        { key: "think", label: "Brainstorm", icon: Lightbulb },
        { key: "builder", label: "Build Code", icon: Code },
        { key: "ip-generator", label: "Generate Ideas", icon: FileText },
        { key: "research-factory", label: "Research", icon: BookOpen },
        { key: "learning-companion", label: "Learn", icon: GraduationCap },
        { key: "expert-marketplace", label: "Experts", icon: Users },
        { key: "creative-lab", label: "Creative Lab", icon: Palette },
        { key: "decision-engine", label: "Decide", icon: Brain },
        { key: "simulation-sandbox", label: "Simulate", icon: Globe },
        { key: "product-designer", label: "Design", icon: Hammer },
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition
            ${
              activeTab === key
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
        >
          <Icon className="w-4 h-4 mr-1" /> {label}
        </button>
      ))}
    </div>
  );

  // ---------- Render Agent Factory ----------
  const renderAgentFactory = () => (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
      <h3 className="text-sm font-semibold text-green-400 flex justify-between items-center">
        Helpers
        <button
          onClick={() => setFactoryVisible(!factoryVisible)}
          className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 hover:bg-gray-600"
        >
          {factoryVisible ? "Hide" : "Show"}
        </button>
      </h3>
      {factoryVisible && (
        <>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Helper name..."
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              className="flex-1 p-2 rounded bg-gray-900 border border-gray-600 text-xs focus:outline-none"
            />
            <button
              onClick={async () => {
                if (!agentFactoryRef.current || !newAgentName.trim()) return;
                const agent = await agentFactoryRef.current.createAgent(newAgentName, {
                  execute_task: async (task) => {
                    const res = await engineRef.current?.compute(task, 0);
                    return extractText(res);
                  },
                  autonomous_iteration: async (agentName) => {
                    setLogs((prev) => [...prev, { role: agentName, text: "Improving itself..." }]);
                  },
                });
                setAgentsList([...agentFactoryRef.current.agents]);
                setNewAgentName("");
              }}
              className="px-3 bg-green-600 hover:bg-green-700 rounded text-xs"
            >
              Add
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto mt-2 space-y-2">
            {agentsList.map((agent, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-xs bg-gray-900 p-2 rounded"
              >
                <span>
                  {agent.name} ({agent.tasks.length} tasks)
                </span>
                <button
                  onClick={async () => {
                    await agentFactoryRef.current?.deployAgent(agent, "Test Task", (msg) =>
                      setLogs((prev) => [...prev, { role: agent.name, text: msg }])
                    );
                    setAgentsList([...agentFactoryRef.current!.agents]);
                  }}
                  className="px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                >
                  Run Task
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-900 text-white rounded-xl border border-gray-700 shadow-xl space-y-4">
      <h2 className="text-xl font-bold flex items-center space-x-2">
        <ShieldCheck className="w-5 h-5 text-green-400" />
        <span>Pulse Playground</span>
      </h2>

      {renderTabs()}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={running}
        placeholder="Type your task or prompt..."
        className="w-full p-3 rounded border border-gray-600 bg-gray-800 text-white text-sm focus:outline-none"
      />
      <button
        onClick={runChat}
        disabled={running || !input.trim()}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
      >
        {running ? <Loader2 className="animate-spin w-4 h-4 inline mr-1" /> : "Run"}
      </button>

      {renderAgentFactory()}

      <div className="max-h-96 overflow-y-auto space-y-2 text-xs bg-gray-800 p-3 rounded-lg">
        {logs.map((msg, i) => (
          <div key={i}>
            <span className="font-semibold text-blue-300">{msg.role}:</span>{" "}
            <span className="text-gray-200">{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- CodeAnalyzer.tsx ----
import { PulseEngine } from '../lib/pulse-main-extended.mjs';
import { Bug } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';

type CodeAnalysisMessage = { role: string; text: string };
type CodeAnalyzerProps = { cycles?: number; dualMode?: boolean };

export default function CodeAnalyzer({ cycles = 2, dualMode = false }: CodeAnalyzerProps) {
  const engineRef = useRef<PulseEngine | null>(null);
  const [logs, setLogs] = useState<CodeAnalysisMessage[]>([]);
  const [inputCode, setInputCode] = useState("");
  const [running, setRunning] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string[]>([]);
  const [testScripts, setTestScripts] = useState<string>("");

  useEffect(() => {
    if (!engineRef.current) {
      const engine = new PulseEngine({
        ollamaUrls: dualMode
          ? ["http://localhost:11434/api/chat", "http://localhost:11435/api/chat"]
          : ["http://localhost:11434/api/chat"],
      });
      engineRef.current = engine;

      engine.on("dialogue", ({ index, reply }) => {
        setLogs((prev) => [...prev, { role: `Agent ${index}`, text: reply || "" }]);
      });

      engine.on("error", (err: any) =>
        setLogs((prev) => [...prev, { role: "Error", text: err.message || String(err) }])
      );
    }
  }, [dualMode]);

  const cleanText = (text: string) =>
    text ? text.replace(/\/\/\/ Local fallback\.?\n?/g, "").replace(/\/\/\/ Rules\.?\n?/g, "").trim() : "";

  const extractText = (res: any) => {
    if (!res) return "";
    if (typeof res === "string") return cleanText(res);
    if (res.text) return cleanText(res.text);
    if (res.reply) return cleanText(res.reply);
    if (Array.isArray(res.messages)) return cleanText(res.messages.map((m) => m.text || "").join("\n"));
    return cleanText(JSON.stringify(res));
  };

  const safeCompute = async (prompt: string, index: number) => {
    if (!engineRef.current) return "";
    try {
      const res = await engineRef.current.compute(prompt, index);
      return extractText(res);
    } catch (err: any) {
      setLogs((prev) => [...prev, { role: "Error", text: err.message || String(err) }]);
      return "";
    }
  };

  const analyzeCode = async () => {
    if (!inputCode.trim()) return;
    setRunning(true);
    setLogs([{ role: "User", text: inputCode }]);
    setHighlightedCode([]);
    setTestScripts("");

    try {
      let previousOutput = "";

      // Agent 0
      const res0 = await safeCompute(`Analyze code for bugs:\n${inputCode}`, 0);
      previousOutput = res0;
      setLogs((prev) => [...prev, { role: "Agent 0", text: res0 }]);

      // Agent 1
      const res1 = await safeCompute(
        `Suggest improvements, upgrades, and fixes for the following code analysis:\n${previousOutput}`,
        dualMode ? 1 : 0
      );
      previousOutput = res1;
      setLogs((prev) => [...prev, { role: "Agent 1", text: res1 }]);

      // Manager cycles
      for (let i = 1; i <= cycles; i++) {
        const resM = await safeCompute(
          `Manager cycle ${i}: refine, improve, and upgrade previous analysis, including suggested code changes and test scripts:\n${previousOutput}`,
          0
        );
        previousOutput = resM;
        setLogs((prev) => [...prev, { role: `Manager cycle ${i}`, text: resM }]);

        try {
          const parsed = JSON.parse(resM);
          if (parsed.vulnerableLines && Array.isArray(parsed.vulnerableLines))
            setHighlightedCode(parsed.vulnerableLines);
          if (parsed.testScripts) setTestScripts(parsed.testScripts);
        } catch {
          // ignore JSON parse errors
        }
      }

      setLogs((prev) => [...prev, { role: "✅ Final Output", text: previousOutput }]);
    } catch (err: any) {
      setLogs((prev) => [...prev, { role: "Error", text: err.message || String(err) }]);
    } finally {
      setRunning(false);
    }
  };

  const renderCodeWithHighlights = () =>
    inputCode.split("\n").map((line, i) => {
      const isVulnerable = highlightedCode.includes((i + 1).toString());
      return (
        <div
          key={i}
          className={`font-mono text-sm ${isVulnerable ? "bg-red-700/30" : ""} p-[1px]`}
        >
          <span className="text-gray-400">{i + 1}</span> {line}
        </div>
      );
    });

  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl border border-gray-700 shadow-lg space-y-3">
      <h2 className="text-lg font-bold flex items-center space-x-2">
        <span>Code Vulnerability Analyzer</span>
        <Bug className="w-4 h-4 text-red-400" />
      </h2>

      <textarea
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        disabled={running}
        placeholder="Paste your code here..."
        className="w-full p-2 rounded border border-gray-600 bg-gray-800 text-white text-sm focus:outline-none font-mono"
      />

      <button
        onClick={analyzeCode}
        disabled={running || !inputCode.trim()}
        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
      >
        {running ? <Loader2 className="animate-spin w-4 h-4 inline" /> : "Analyze & Improve"}
      </button>

      <div className="max-h-64 overflow-y-auto bg-gray-800 rounded p-2">
        {renderCodeWithHighlights()}
      </div>

      {testScripts && (
        <div className="mt-2 bg-gray-800 p-2 rounded">
          <h3 className="font-bold text-sm">Generated Test Scripts:</h3>
          <pre className="text-xs font-mono">{testScripts}</pre>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-1 mt-2">
        {logs.map((msg, i) => (
          <div key={i} className="text-xs font-mono">
            <strong>{msg.role}:</strong> <span>{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- CrossChainBlockchain.tsx ----
import { Block } from './Blockchain';
import { Blockchain } from './Blockchain';
import { Network } from './Blockchain';

interface Transaction {
  from: string;
  to: string;
  value: number;
  gas: number;
  data?: string;
  nonce: number;
  sourceNetwork: string;
  targetNetwork?: string;
}

interface TransactionReceipt {
  transaction: Transaction;
  status: "success" | "failed" | "pending";
  gasUsed: number;
}

interface BlockHeader {
  parentHash: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  number: number;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  difficulty: number;
  nonce: number;
  networkId: string;
}

class Block {
  header: BlockHeader;
  transactions: Transaction[];
  receipts: TransactionReceipt[];
  hash: string;

  constructor(
    parentHash: string,
    stateRoot: string,
    transactions: Transaction[],
    number: number,
    timestamp: number,
    difficulty: number,
    nonce: number,
    networkId: string
  ) {
    this.header = {
      parentHash,
      stateRoot,
      transactionsRoot: this.calculateTransactionsRoot(transactions),
      receiptsRoot: this.calculateReceiptsRoot(transactions),
      number,
      gasLimit: 30000000,
      gasUsed: this.calculateGasUsed(transactions),
      timestamp,
      difficulty,
      nonce,
      networkId,
    };
    this.transactions = transactions;
    this.receipts = transactions.map(tx => ({
      transaction: tx,
      status: this.validateTransaction(tx) ? "success" : "failed",
      gasUsed: tx.gas,
    }));
    this.hash = this.calculateHash();
  }

  validateTransaction(tx: Transaction): boolean {
    const sender = this.accounts?.get(tx.from);
    return !!sender && sender.balance >= tx.value + tx.gas;
  }

  calculateHash(): string {
    const headerStr = JSON.stringify(this.header);
    return this.sha256(headerStr);
  }

  calculateTransactionsRoot(transactions: Transaction[]): string {
    return transactions.length > 0 ? this.sha256(JSON.stringify(transactions)) : "0".repeat(64);
  }

  calculateReceiptsRoot(transactions: Transaction[]): string {
    return this.sha256(JSON.stringify(this.receipts));
  }

  calculateGasUsed(transactions: Transaction[]): number {
    return transactions.reduce((sum, tx) => sum + tx.gas, 0);
  }

  sha256(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash + char) >>> 0;
    }
    return hash.toString(16).padStart(64, "0");
  }

  toJSON() {
    return {
      header: this.header,
      transactions: this.transactions,
      hash: this.hash,
      receipts: this.receipts,
    };
  }

  private accounts?: Map<string, { balance: number; nonce: number }>;
}

class Network {
  id: string;
  blockchain: Blockchain;
  peers: Map<string, Network>;

  constructor(id: string) {
    this.id = id;
    this.blockchain = new Blockchain(id);
    this.peers = new Map();
  }

  addPeer(network: Network) {
    this.peers.set(network.id, network);
    network.peers.set(this.id, this);
  }

  broadcastTransaction(tx: Transaction) {
    if (tx.targetNetwork && this.peers.has(tx.targetNetwork)) {
      const targetNetwork = this.peers.get(tx.targetNetwork);
      targetNetwork?.blockchain.addTransaction(
        tx.from,
        tx.to,
        tx.value,
        tx.gas,
        tx.data,
        tx.sourceNetwork
      );
    }
  }

  syncState() {
    for (const peer of this.peers.values()) {
      if (peer.blockchain.getLatestBlock().header.number > this.blockchain.getLatestBlock().header.number) {
        this.blockchain.chain = [...peer.blockchain.chain];
        this.blockchain.accounts = new Map(peer.blockchain.accounts);
        this.blockchain.stateHistory = new Map(peer.blockchain.stateHistory);
      }
    }
  }
}

class Blockchain {
  chain: Block[];
  difficulty: number;
  pendingTransactions: Transaction[];
  accounts: Map<string, { balance: number; nonce: number }>;
  stateHistory: Map<number, string>;
  minerAddress: string;
  networkId: string;
  onBlockMined?: (block: Block) => void;
  onTransactionAdded?: (tx: Transaction) => void;

  constructor(networkId: string) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.pendingTransactions = [];
    this.accounts = new Map();
    this.stateHistory = new Map();
    this.minerAddress = "0xMiner";
    this.networkId = networkId;
    this.initializeAccounts();
  }

  initializeAccounts() {
    this.accounts.set("0x1", { balance: 1000000, nonce: 0 });
    this.accounts.set("0x2", { balance: 1000000, nonce: 0 });
    this.accounts.set(this.minerAddress, { balance: 0, nonce: 0 });
  }

  createGenesisBlock(): Block {
    const block = new Block("0".repeat(64), "0".repeat(64), [], 0, Date.now(), 0, 0, this.networkId);
    block.accounts = this.accounts;
    this.stateHistory.set(0, block.header.stateRoot);
    return block;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(from: string, to: string, value: number, gas: number, data?: string, sourceNetwork?: string): boolean {
    const sender = this.accounts.get(from);
    if (!sender || sender.balance < value + gas || sender.nonce === undefined) {
      return false;
    }

    const tx: Transaction = {
      from,
      to,
      value,
      gas,
      data,
      nonce: sender.nonce,
      sourceNetwork: sourceNetwork || this.networkId,
      targetNetwork: sourceNetwork ? undefined : this.networkId,
    };

    this.pendingTransactions.push(tx);
    sender.nonce += 1;
    this.onTransactionAdded?.(tx);
    return true;
  }

  mineBlock(): Block | null {
    if (this.pendingTransactions.length === 0) return null;

    const prevBlock = this.getLatestBlock();
    const timestamp = Date.now();
    let nonce = 0;
    let hash: string;

    do {
      nonce++;
      hash = this.calculateBlockHash(
        prevBlock.hash,
        this.calculateStateRoot(),
        this.pendingTransactions,
        prevBlock.header.number + 1,
        timestamp,
        nonce
      );
    } while (hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty));

    const totalFees = this.pendingTransactions.reduce((sum, tx) => sum + tx.gas, 0);
    const miner = this.accounts.get(this.minerAddress);
    if (miner) {
      this.pendingTransactions.push({
        from: "0x0",
        to: this.minerAddress,
        value: totalFees,
        gas: 0,
        nonce: miner.nonce,
        sourceNetwork: this.networkId,
      });
      miner.nonce++;
    }

    const stateRoot = this.calculateStateRoot();
    const newBlock = new Block(
      prevBlock.hash,
      stateRoot,
      this.pendingTransactions,
      prevBlock.header.number + 1,
      timestamp,
      this.difficulty,
      nonce,
      this.networkId
    );
    newBlock.accounts = this.accounts;

    this.executeTransactions(newBlock.transactions);
    this.chain.push(newBlock);
    this.stateHistory.set(newBlock.header.number, stateRoot);
    this.pendingTransactions = [];
    this.onBlockMined?.(newBlock);
    return newBlock;
  }

  calculateBlockHash(
    parentHash: string,
    stateRoot: string,
    transactions: Transaction[],
    number: number,
    timestamp: number,
    nonce: number
  ): string {
    const block = new Block(parentHash, stateRoot, transactions, number, timestamp, this.difficulty, nonce, this.networkId);
    block.accounts = this.accounts;
    return block.calculateHash();
  }

  calculateStateRoot(): string {
    return this.sha256(JSON.stringify([...this.accounts.entries()]));
  }

  sha256(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash + char) >>> 0;
    }
    return hash.toString(16).padStart(64, "0");
  }

  executeTransactions(transactions: Transaction[]): void {
    for (const tx of transactions) {
      const sender = this.accounts.get(tx.from);
      const recipient = this.accounts.get(tx.to) || { balance: 0, nonce: 0 };

      if (tx.from !== "0x0" && sender && sender.balance >= tx.value + tx.gas) {
        sender.balance -= tx.value + tx.gas;
        recipient.balance += tx.value;
        this.accounts.set(tx.to, recipient);
      } else if (tx.from === "0x0") {
        recipient.balance += tx.value;
        this.accounts.set(tx.to, recipient);
      }
    }
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.header.parentHash !== prevBlock.hash) {
        return false;
      }

      const storedStateRoot = this.stateHistory.get(currentBlock.header.number);
      if (storedStateRoot !== currentBlock.header.stateRoot) {
        return false;
      }
    }
    return true;
  }

  getBalance(address: string): number {
    return this.accounts.get(address)?.balance || 0;
  }
}

const App: React.FC = () => {
  const network1 = new Network("network1");
  const network2 = new Network("network2");
  network1.addPeer(network2);

  network1.blockchain.onBlockMined = block => {
    console.log(`Block mined on ${block.header.networkId}:`, block.toJSON());
    network1.syncState();
  };

  network2.blockchain.onBlockMined = block => {
    console.log(`Block mined on ${block.header.networkId}:`, block.toJSON());
    network2.syncState();
  };

  network1.blockchain.onTransactionAdded = tx => {
    console.log(`Transaction added on ${tx.sourceNetwork}:`, tx);
    if (tx.targetNetwork) {
      network1.broadcastTransaction(tx);
    }
  };

  network2.blockchain.onTransactionAdded = tx => {
    console.log(`Transaction added on ${tx.sourceNetwork}:`, tx);
  };

  const addCrossChainTransaction = () => {
    const success = network1.blockchain.addTransaction("0x1", "0x2", 100, 21000, undefined, network2.id);
    if (success) {
      const newBlock = network1.blockchain.mineBlock();
      if (newBlock) {
        console.log(`New block mined on ${network1.id}:`, newBlock.toJSON());
        console.log(`Chain valid (${network1.id}):`, network1.blockchain.isChainValid());
        console.log(`Chain valid (${network2.id}):`, network2.blockchain.isChainValid());
        console.log(`Balance 0x1 (${network1.id}):`, network1.blockchain.getBalance("0x1"));
        console.log(`Balance 0x2 (${network2.id}):`, network2.blockchain.getBalance("0x2"));
        console.log(`Miner balance (${network1.id}):`, network1.blockchain.getBalance(network1.blockchain.minerAddress));
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={addCrossChainTransaction}
        style={{ padding: '10px 20px', margin: '10px', cursor: 'pointer' }}
      >
        Add Cross-Chain Transaction & Mine Block
      </button>
      <p>Check console for blockchain output across networks.</p>
    </div>
  );
};

export default App;

// ---- CryptoCasino.tsx ----
import { Block } from './Blockchain';
import { Network } from './Blockchain';
import { keccak256 } from 'ethers';
import { toUtf8Bytes } from 'ethers';
import { AlertTriangle } from 'lucide-react';
import { Code2 } from 'lucide-react';
import { Coins } from 'lucide-react';
import { Database } from 'lucide-react';
import { Dice5 } from 'lucide-react';
import { Download } from 'lucide-react';
import { Search } from 'lucide-react';
import { Star } from 'lucide-react';
import { Trophy } from 'lucide-react';
import { Zap } from 'lucide-react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { useRef } from 'react';
import { useState } from 'react';
import React from 'react';
"use client";

interface Block {
  header: {
    number: number;
    hash: string;
    parentHash: string;
    timestamp: number;
    transactionsRoot: string;
    receiptsRoot: string;
    gasUsed: number;
  };
  transactions: Transaction[];
  receipts: any[];
}

interface Transaction {
  from: string;
  to: string;
  value: number;
  gas: number;
  data?: string;
  nonce: number;
  hash?: string;
  signature?: string;
}

interface Account {
  address: string;
  balance: number;
  nonce: number;
  luxScore: number;
}

interface Bet {
  id: string;
  player: string;
  wager: number;
  result: "win" | "lose";
  payout: number;
  timestamp: string;
}

interface GameResult {
  id: string;
  game: string;
  score: number;
  timestamp: string;
}

// --------- Merkle Utilities ----------
function computeMerkleRoot(transactions: Transaction[]): string {
  if (transactions.length === 0) return keccak256(toUtf8Bytes("empty"));
  let layer = transactions.map((tx) => keccak256(toUtf8Bytes(JSON.stringify(tx))));
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] ?? left; // duplicate last if odd
      next.push(keccak256(toUtf8Bytes(left + right)));
    }
    layer = next;
  }
  return layer[0];
}

// ---------- UI Components ----------
const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-blue-900/30 shadow-xl glow-effect space-y-4 classified-overlay ${className}`}>
    {title && (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-6 bg-gradient-to-b from-blue-400 to-purple-600 rounded" />
        <h2 className="text-xl font-bold text-white terminal-text">{title}</h2>
      </div>
    )}
    {children}
  </div>
);

const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "secondary" | "danger"; }> = ({ children, onClick, disabled, variant = "primary" }) => {
  const colors =
    variant === "primary"
      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      : variant === "secondary"
      ? "bg-gray-700 hover:bg-gray-600"
      : "bg-red-600 hover:bg-red-700";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed glow-effect terminal-text ${colors}`}
    >
      {children}
    </button>
  );
};

const SearchBar: React.FC<{ onSearch: (query: string) => void; placeholder?: string }> = ({ onSearch, placeholder = "Search blocks, txns, agents..." }) => {
  const [query, setQuery] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(query); }} className="relative">
      <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 bg-gray-900/80 border border-blue-900/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
      />
    </form>
  );
};

const UserIcon = () => <Coins className="w-5 h-5 inline mr-2 text-yellow-400" />;

// ---------- Main Component ----------
export default function CryptoCasino({ network }: { network: any }) {
  const [activeTab, setActiveTab] = useState<"casino" | "browser" | "mining" | "contracts" | "analysis">("casino");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [betAmount, setBetAmount] = useState("0.01");
  const [bets, setBets] = useState<Bet[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [verifiedBlocks, setVerifiedBlocks] = useState<{ number: number; valid: boolean }[]>([]);
  const blockchainRef = useRef(network?.blockchain);

  useEffect(() => { blockchainRef.current = network?.blockchain; }, [network]);

  const accounts = useMemo(() => Array.from(network?.blockchain?.accounts?.entries() ?? []).map(([address, data]) => ({
    address, balance: data.balance, nonce: data.nonce, luxScore: data.luxScore,
  })), [network]);
  const blocks = useMemo(() => network?.blockchain?.chain ?? [], [network]);
  const transactions = useMemo(() => network?.blockchain?.chain?.flatMap((b: Block) => b.transactions) ?? [], [network]);

  // --- Load & save bets/results ---
  useEffect(() => {
    const savedBets = localStorage.getItem("casino_bets_v1");
    if (savedBets) setBets(JSON.parse(savedBets));
    const savedResults = localStorage.getItem("casino_results_v1");
    if (savedResults) setGameResults(JSON.parse(savedResults));
  }, []);
  useEffect(() => {
    localStorage.setItem("casino_bets_v1", JSON.stringify(bets));
    localStorage.setItem("casino_results_v1", JSON.stringify(gameResults));
  }, [bets, gameResults]);

  // --- Verify blocks on every change ---
  useEffect(() => {
    const results = blocks.map((b: Block) => ({
      number: b.header.number,
      valid: computeMerkleRoot(b.transactions) === b.header.transactionsRoot,
    }));
    setVerifiedBlocks(results);
  }, [blocks]);

  // --- Simple AI-like anomaly detection ---
  const runAIAnalysis = useCallback(() => {
    const warnings: string[] = [];
    const nonceMap = new Map<string, number>();
    for (const tx of transactions) {
      const last = nonceMap.get(tx.from) ?? -1;
      if (tx.nonce <= last) warnings.push(`⚠️ Replay detected for ${tx.from}`);
      nonceMap.set(tx.from, tx.nonce);
      if (tx.value < 0) warnings.push(`⚠️ Negative value detected in tx ${tx.hash}`);
    }
    if (warnings.length === 0) warnings.push("✅ No anomalies detected");
    setAlerts(warnings);
  }, [transactions]);

  // --- Audit log export ---
  const exportAuditLog = useCallback(() => {
    const blob = new Blob([JSON.stringify({ blocks, transactions, logs }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [blocks, transactions, logs]);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl glow-effect min-h-[600px]">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white terminal-text flex items-center">
          <Trophy className="w-8 h-8 mr-2 text-yellow-400 animate-pulse" /> Sovereign GameHub
        </h1>
        <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: "casino" as const, label: "Vault", icon: Trophy },
            { id: "browser" as const, label: "Chain", icon: Database },
            { id: "mining" as const, label: "Mine", icon: Zap },
            { id: "contracts" as const, label: "Contracts", icon: Code2 },
            { id: "analysis" as const, label: "Verify", icon: AlertTriangle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
                activeTab === id ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "analysis" && (
        <Card title="Merkle Verification & AI Analysis">
          <div className="space-y-4">
            <Button onClick={runAIAnalysis} variant="secondary">
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" /> Run Chain Analysis
            </Button>
            <Button onClick={exportAuditLog} variant="secondary">
              <Download className="w-4 h-4 mr-2" /> Download Audit Log
            </Button>
            <div className="bg-gray-900/50 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono space-y-1">
              <h4 className="text-blue-300 font-bold">Block Verification</h4>
              {verifiedBlocks.map((vb) => (
                <div key={vb.number} className={vb.valid ? "text-green-400" : "text-red-400"}>
                  Block #{vb.number} — {vb.valid ? "✅ Valid Merkle Root" : "❌ Tampered"}
                </div>
              ))}
            </div>
            {alerts.length > 0 && (
              <div className="bg-gray-900/50 p-4 rounded-lg text-xs space-y-1">
                {alerts.map((a, i) => (
                  <div key={i} className={a.includes("⚠️") ? "text-yellow-400" : "text-green-400"}>{a}</div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === "casino" && (
        <>
          <div className="flex justify-between items-center">
            <SearchBar onSearch={handleSearch} />
            <div className="flex space-x-2">
              <Button onClick={() => setActiveGame("dice")} variant={activeGame === "dice" ? "primary" : "secondary"}>
                <Dice5 className="w-5 h-5 inline mr-2" /> Dice
              </Button>
              <Button onClick={() => setActiveGame("slots")} variant={activeGame === "slots" ? "primary" : "secondary"}>
                <Star className="w-5 h-5 inline mr-2" /> Slots
              </Button>
              <Button onClick={() => setActiveGame("jackpot")} variant={activeGame === "jackpot" ? "primary" : "secondary"}>
                <Trophy className="w-5 h-5 inline mr-2" /> Jackpot
              </Button>
              <Button onClick={createPlayer} variant="secondary">
                <UserIcon /> New Agent
              </Button>
            </div>
          </div>
          <Card title={activeGame === "dice" ? "Dice Arena" : activeGame === "slots" ? "Slots Machine" : "Jackpot Chase"} className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl pointer-events-none" />
            {activeGame === "dice" ? (
              <DiceGame selectedPlayer={selectedPlayer} betAmount={betAmount} spinning={spinning} onBet={placeDiceBet} setBetAmount={setBetAmount} network={network} setSelectedPlayer={setSelectedPlayer} />
            ) : activeGame === "slots" ? (
              <SlotsGame selectedPlayer={selectedPlayer} betAmount={betAmount} spinning={spinning} onSpin={placeSlotsBet} setBetAmount={setBetAmount} network={network} setSelectedPlayer={setSelectedPlayer} />
            ) : (
              <JackpotGame selectedPlayer={selectedPlayer} betAmount={betAmount} spinning={spinning} onSpin={placeJackpotBet} setBetAmount={setBetAmount} network={network} setSelectedPlayer={setSelectedPlayer} />
            )}
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Bet History">
              <div className="bg-gray-900/50 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono">
                {bets.length === 0 && <div className="text-gray-400">No bets placed yet</div>}
                {bets.map((b) => (
                  <div key={b.id} className="border-b border-blue-900/50 pb-2 mb-2 flex justify-between">
                    <span className={b.result === "win" ? "text-green-400" : "text-red-400"}>{b.result.toUpperCase()}</span>
                    <span>Wager: {b.wager} ETH • Payout: {b.payout} ETH • {b.timestamp}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Leaderboard">
              <div className="bg-gray-900/50 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono">
                {gameResults.length === 0 && <div className="text-gray-400">No game results yet</div>}
                {gameResults.map((r) => (
                  <div key={r.id} className="border-b border-blue-900/50 pb-2 mb-2 flex justify-between">
                    <span className="text-blue-300">{r.game}</span>
                    <span>Score: {r.score} ETH • {r.timestamp}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Agent Balances">
              <div className="bg-gray-900/50 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono">
                {accounts.length === 0 && <div className="text-gray-400">No agents registered</div>}
                {accounts.map((a) => (
                  <div key={a.address} className="border-b border-blue-900/50 pb-2 mb-2 flex justify-between">
                    <span className="text-blue-300">{a.address.slice(0, 10)}...</span>
                    <span>{a.balance} ETH</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="System Logs">
              <div className="bg-gray-900/50 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono">
                {logs.length === 0 ? <div className="text-gray-400">No logs</div> : logs.map((l, i) => <div key={i} className="text-gray-200">{l}</div>)}
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === "browser" && (
        <>
          <SearchBar onSearch={handleSearch} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card title="Recent Blocks">
              <BlockList blocks={(blocks ?? []).slice(-10).reverse()} onSelectBlock={setSelectedBlock} />
            </Card>
            <Card title="Block Details">
              <BlockDetails block={selectedBlock} />
            </Card>
            <Card title="Recent Transactions">
              <TransactionList transactions={(transactions ?? []).slice(-20)} onSelectTx={setSelectedTransaction} />
            </Card>
            <Card title="Transaction Details">
              <TransactionDetails transaction={selectedTransaction} />
            </Card>
          </div>
        </>
      )}

      {activeTab === "mining" && (
        <Card title="Mining Operations">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Current Difficulty: {network?.blockchain?.difficulty ?? 4}</span>
              <Button onClick={mineBlock} disabled={mining || !network?.blockchain}>
                <Zap className={`w-5 h-5 inline mr-2 ${mining ? "animate-spin" : ""}`} />
                {mining ? "Mining..." : "Mine Block"}
              </Button>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono">
              {logs.length === 0 ? <div className="text-gray-400">No mining logs</div> : logs.map((l, i) => <div key={i} className="text-gray-200">{l}</div>)}
            </div>
          </div>
        </Card>
      )}

      {activeTab === "contracts" && (
        <Card title="Contract Deployment">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-300 terminal-text">Agent</label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-900/80 border border-blue-900/50 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Agent</option>
                {accounts.map((a) => (
                  <option key={a.address} value={a.address}>{a.address.slice(0, 10)}... ({a.balance} ETH)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-300 terminal-text">Contract Bytecode</label>
              <textarea
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-900/80 border border-blue-900/50 text-sm text-gray-200 font-mono h-32"
                placeholder="Enter contract bytecode..."
              />
            </div>
            <Button onClick={deployContract} disabled={!selectedPlayer || !contractCode}>
              <Code2 className="w-5 h-5 inline mr-2" /> Deploy Contract
            </Button>
            <div className="bg-gray-900/50 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono">
              {logs.length === 0 ? <div className="text-gray-400">No deployment logs</div> : logs.map((l, i) => <div key={i} className="text-gray-200">{l}</div>)}
            </div>
          </div>
        </Card>
      )}

      <div className="text-center text-xs text-gray-500 terminal-text">
        Network: {network?.id ?? "Unknown"} | Latest Block: #{blocks.length - 1} | Total Txns: {transactions.length} | Secured by Sovereign Covenant
      </div>
    </div>
  );
}

// ---- Dashboard.tsx ----
import BackAndForthPulse from './BackAndForthPulseComponent';
import { Block } from './Blockchain';
import { Blockchain } from './Blockchain';
import { Network } from './Blockchain';
import { BlockchainEngine } from './BlockchainEngine';
import { BlockchainInterface } from './BlockchainInterface';
import { Browser } from './Browser';
import { CharisVouchers } from './CharisVouchers';
import ChatPulseComponent from './ChatPulse';
import CodeAnalyzer from './CodeAnalyzer';
import CryptoCasino from './CryptoCasino';
import { ProjectGoals } from './ProjectGoals';
import { ProjectScheduler } from './ProjectScheduler';
import { RealTimeProgress } from './RealTimeProgress';
import SocialFeed from './SocialFeed';
import { Coins } from 'lucide-react';
import { Cpu } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { Zap } from 'lucide-react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';
'use client';

interface DashboardProps {
  network: Network | null;
}

const Dashboard: React.FC<DashboardProps> = ({ network }) => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('dashboard_tab') || 'agora');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard_tab', activeTab);
  }, [activeTab]);

  const syncNetwork = useCallback(() => {
    if (network) network.syncState();
  }, [network]);

  if (isLoading || !network) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900/80">
        <div className="text-center text-gray-300">
          <Zap className="w-16 h-16 mx-auto mb-4 animate-pulse text-blue-400" />
          <p className="text-xl font-mono">Initializing Sovereign Covenant...</p>
          <p className="text-sm mt-2">The chain is forging its truth</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'agora', label: 'Agora', icon: MessageSquare, description: "The Covenant's Voice" },
    { id: 'blockchain', label: 'Blockchain Hub', icon: Zap, description: 'Sovereign Backbone' },
    { id: 'economy', label: 'Charis Economy', icon: Coins, description: 'Aligned Value' },
    { id: 'pulse', label: 'Pulse Control', icon: Cpu, description: 'System Mind' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Sovereign Covenant Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-2">A living system of aligned minds and immutable truth</p>
        </header>

        <nav className="flex space-x-2 mb-6 border-b border-blue-900/30">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-900/50 border-t border-l border-r border-blue-500 text-blue-300'
                  : 'bg-gray-900/50 hover:bg-gray-800/50 text-gray-400'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              <span className="text-xs opacity-70">{tab.description}</span>
            </button>
          ))}
        </nav>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'agora' && (
              <>
                <AgoraLucentis network={network} onSelectAddress={setSelectedAddress} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SocialFeed network={network} address={selectedAddress} />
                  <ChatPulseComponent network={network} />
                </div>
              </>
            )}
            {activeTab === 'blockchain' && (
              <>
                <BlockchainInterface blockchain={network.blockchain} address={selectedAddress} />
                <Browser network={network} />
              </>
            )}
            {activeTab === 'economy' && (
              <>
                <CharisVouchers network={network} address={selectedAddress} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CryptoCasino network={network} selectedAddress={selectedAddress} />
                  <LuxMeter network={network} address={selectedAddress} />
                </div>
              </>
            )}
            {activeTab === 'pulse' && (
              <>
                <PulseEngineComponent network={network} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BlockchainEngine network={network} />
                  <CodeAnalyzer network={network} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TCCLogger network={network} />
                  <RealTimeProgress network={network} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ProjectGoals network={network} />
                  <ProjectScheduler network={network} />
                </div>
                <BackAndForthPulseComponent network={network} />
              </>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-gray-900/70 rounded-xl border border-gray-700/50 p-4 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4">Covenant Status</h2>
              <div className="space-y-4 text-sm text-gray-300">
                <p>Network ID: {network.id}</p>
                <p>Block Height: {network.blockchain.chain.length}</p>
                <p>Pending Txns: {network.blockchain.pendingTransactions.length}</p>
                <p>Accounts: {network.blockchain.accounts.size}</p>
                <p>Vouchers: {network.blockchain.vouchers.length}</p>
                <p>Posts: {network.blockchain.posts.length}</p>
                <button
                  onClick={syncNetwork}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  Sync Covenant
                </button>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

// ---- LuxMeter.tsx ----
import { Network } from './Blockchain';
import { keccak256 } from 'ethers';
import { toUtf8Bytes } from 'ethers';
import { Award } from 'lucide-react';
import { Download } from 'lucide-react';
import { Shield } from 'lucide-react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';

interface LuxMeterProps {
  network: Network | null;
  address: string;
}

interface Rank {
  tier: number;
  title: string;
  minLuxScore: number;
}

const LuxMeter: React.FC<LuxMeterProps> = ({ network, address }) => {
  const [luxScore, setLuxScore] = useState<number>(0);
  const [rank, setRank] = useState<Rank>({ tier: 1, title: "Credens", minLuxScore: 0 });
  const [history, setHistory] = useState<{ action: string; points: number; timestamp: number }[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [proofValid, setProofValid] = useState<boolean>(true);
  const [merkleProof, setMerkleProof] = useState<string[]>([]);

  // -------- Merkle Proof Builder --------
  const buildMerkleProof = useCallback(() => {
    if (!network) return { proof: [], root: "" };
    const accounts = Array.from(network.blockchain.accounts.entries()).map(([addr, acc]) => ({
      addr,
      hash: keccak256(toUtf8Bytes(addr + acc.luxScore))
    }));
    let layer = accounts.map(a => a.hash);
    const path: string[] = [];
    let current = accounts.find(a => a.addr === address)?.hash;

    while (layer.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = layer[i + 1] ?? left;
        const parent = keccak256(toUtf8Bytes(left + right));
        if (current && (current === left || current === right)) {
          path.push(current === left ? right : left);
          current = parent;
        }
        next.push(parent);
      }
      layer = next;
    }
    return { proof: path, root: layer[0] ?? "" };
  }, [network, address]);

  useEffect(() => {
    if (network && address) {
      const updateLuxScore = () => {
        const score = network.blockchain.getLuxScore(address);
        const currentRank = network.blockchain.getRank(address);
        setLuxScore(score);
        setRank(currentRank);

        // Update history
        setHistory(prev => [...prev, { action: "LuxScore Update", points: score, timestamp: Date.now() }].slice(-10));

        // Merkle Proof Verification
        const { proof, root } = buildMerkleProof();
        setMerkleProof(proof);
        const valid = root === network.blockchain.latestLuxRoot; // Assume blockchain stores this root
        setProofValid(valid);
      };

      updateLuxScore();

      // Bind blockchain event listeners
      network.blockchain.onPostAdded = post => {
        if (post.author === address) {
          updateLuxScore();
          setLogs(prev => [...prev, `+10 Lux for posting at ${new Date().toLocaleTimeString()}`]);
        }
      };
      network.blockchain.onCommentAdded = comment => {
        if (comment.author === address) {
          updateLuxScore();
          setLogs(prev => [...prev, `+5 Lux for commenting at ${new Date().toLocaleTimeString()}`]);
        }
      };
      network.blockchain.onVoteAdded = (postId, voter) => {
        if (voter === address) {
          updateLuxScore();
          setLogs(prev => [...prev, `+2 Lux for voting at ${new Date().toLocaleTimeString()}`]);
        }
      };
    }
  }, [network, address, buildMerkleProof]);

  const getNextRank = () => {
    const ranks: Rank[] = [
      { tier: 1, title: "Credens", minLuxScore: 0 },
      { tier: 2, title: "Auditor", minLuxScore: 100 },
      { tier: 3, title: "Servitor", minLuxScore: 500 },
      { tier: 4, title: "Gnosio", minLuxScore: 1000 },
      { tier: 5, title: "Perfectus", minLuxScore: 5000 },
      { tier: 6, title: "Orator Lumini", minLuxScore: 10000 },
      { tier: 7, title: "Luminarius", minLuxScore: 50000 }
    ];
    return ranks.find(r => r.minLuxScore > luxScore) || ranks[ranks.length - 1];
  };

  const nextRank = getNextRank();
  const progressToNextRank =
    nextRank.minLuxScore > 0 ? Math.min((luxScore / nextRank.minLuxScore) * 100, 100) : 100;

  const actionsNeeded = Math.max(0, Math.ceil((nextRank.minLuxScore - luxScore) / 10));

  const exportProof = () => {
    const data = { address, luxScore, rank, merkleProof, latestRoot: network?.blockchain.latestLuxRoot };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lux-proof-${address}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!network?.blockchain.getSoulboundId(address)) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2" /> LuxMeter
        </h2>
        <p className="text-gray-400">Please create a Soulbound ID to view your LuxScore.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center">
        <Award className="w-5 h-5 mr-2" /> LuxMeter
      </h2>

      {/* Merkle Proof Status */}
      <div className={`p-3 rounded-lg ${proofValid ? "bg-green-900/40" : "bg-red-900/40"}`}>
        <Shield className="inline w-4 h-4 mr-2" />
        {proofValid ? "Merkle proof verified ✅" : "⚠️ LuxScore integrity could not be verified"}
      </div>

      {/* LuxScore & Rank */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-300"><strong>LuxScore:</strong> {luxScore.toFixed(2)}</span>
          <span className="text-sm text-gray-300"><strong>Rank:</strong> {rank.title} (Tier {rank.tier})</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full" style={{ width: `${progressToNextRank}%` }}></div>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Progress to {nextRank.title}: {luxScore.toFixed(0)}/{nextRank.minLuxScore} • ~{actionsNeeded} posts to rank up
        </p>
      </div>

      {/* Contribution History */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Contribution History</h3>
        <div className="bg-gray-800 p-3 rounded-lg max-h-40 overflow-y-auto">
          {history.length > 0 ? history.map((h, i) => (
            <p key={i} className="text-sm text-gray-300">
              {h.action}: {h.points} @ {new Date(h.timestamp).toLocaleString()}
            </p>
          )) : <p className="text-sm text-gray-400">No contributions yet.</p>}
        </div>
      </div>

      {/* Logs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Activity Log</h3>
        <div className="bg-gray-800 p-3 rounded-lg max-h-40 overflow-y-auto">
          {logs.length > 0 ? logs.map((log, i) => (
            <p key={i} className="text-sm text-gray-300">{log}</p>
          )) : <p className="text-sm text-gray-400">No activity yet.</p>}
        </div>
      </div>

      {/* Proof Export */}
      <button
        onClick={exportProof}
        className="w-full py-2 rounded-lg text-white bg-gray-700 hover:bg-gray-600 transition"
      >
        <Download className="inline w-4 h-4 mr-1" /> Export Merkle Proof
      </button>
    </div>
  );
};

export default LuxMeter;

// ---- ProjectGoals.tsx ----
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

// ---- ProjectScheduler.tsx ----
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

// ---- PulseEngine.tsx ----
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

// ---- RealTimeProgress.tsx ----
import { Activity } from 'lucide-react';
import { Brain } from 'lucide-react';
import { Cpu } from 'lucide-react';
import { Eye } from 'lucide-react';
import { Target } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Waves } from 'lucide-react';
import { Zap } from 'lucide-react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';
import React from 'react';

interface ProgressMetrics {
  pulseRate: number;
  agentActivity: { genesisWeaver: number; refinementGuardian: number };
  systemLoad: number;
  emergentScore: number;
  topicAlignment: number;
  codeQuality: number;
  buildProgress: number;
}

interface RealTimeProgressProps {
  isActive?: boolean;
  updateInterval?: number;
  autoScrollDialogue?: boolean;
  pulseEngine?: {
    on: (event: string, cb: (evt: any) => void) => void;
    off: (event: string, cb: (evt: any) => void) => void;
  };
}

interface Dialogue {
  agent: string;
  message: string;
  timestamp: number;
}

export const RealTimeProgress: React.FC<RealTimeProgressProps> = ({
  isActive = false,
  updateInterval = 200,
  autoScrollDialogue = true,
  pulseEngine
}) => {
  const [metrics, setMetrics] = useState<ProgressMetrics>({
    pulseRate: 70,
    agentActivity: { genesisWeaver: 40, refinementGuardian: 50 },
    systemLoad: 45,
    emergentScore: 0,
    topicAlignment: 95,
    codeQuality: 85,
    buildProgress: 0,
  });

  const [pulseHistory, setPulseHistory] = useState<number[]>(() => new Array(50).fill(70));
  const [emergentHistory, setEmergentHistory] = useState<number[]>(() => new Array(50).fill(0));
  const [dialogueHistory, setDialogueHistory] = useState<Dialogue[]>([]);

  const metricsRef = useRef(metrics);
  const dialogueContainerRef = useRef<HTMLDivElement | null>(null);
  metricsRef.current = metrics;

  // 🔌 Connect to PulseEngine
  useEffect(() => {
    if (!pulseEngine) return;

    const handleDialogue = (evt: any) => {
      setDialogueHistory(prev => [
        ...prev.slice(-99),
        { agent: `Ollama-${evt.index}`, message: evt.reply, timestamp: Date.now() }
      ]);
    };

    const handleProgress = (evt: any) => {
      if (!evt.totalSteps) return;
      setMetrics(prev => ({
        ...prev,
        buildProgress: Math.min(100, (evt.step / evt.totalSteps) * 100)
      }));
    };

    const handleTaskComplete = (evt: any) => {
      setDialogueHistory(prev => [
        ...prev.slice(-99),
        { agent: "system", message: `Task ${evt.id} complete.`, timestamp: Date.now() }
      ]);
    };

    const handleHeartbeat = () => {
      setMetrics(prev => ({
        ...prev,
        pulseRate: prev.pulseRate + ((65 + Math.sin(Date.now() / 1500) * 10) - prev.pulseRate) * 0.15
      }));
    };

    const handleError = (evt: any) => {
      setDialogueHistory(prev => [
        ...prev.slice(-99),
        { agent: "⚠️ error", message: evt.message, timestamp: Date.now() }
      ]);
    };

    pulseEngine.on("dialogue", handleDialogue);
    pulseEngine.on("progress", handleProgress);
    pulseEngine.on("taskComplete", handleTaskComplete);
    pulseEngine.on("heartbeat", handleHeartbeat);
    pulseEngine.on("error", handleError);

    return () => {
      pulseEngine.off("dialogue", handleDialogue);
      pulseEngine.off("progress", handleProgress);
      pulseEngine.off("taskComplete", handleTaskComplete);
      pulseEngine.off("heartbeat", handleHeartbeat);
      pulseEngine.off("error", handleError);
    };
  }, [pulseEngine]);

  // Auto-scroll dialogue
  useEffect(() => {
    if (autoScrollDialogue && dialogueContainerRef.current) {
      dialogueContainerRef.current.scrollTop = dialogueContainerRef.current.scrollHeight;
    }
  }, [dialogueHistory, autoScrollDialogue]);

  // ✅ Only simulate metrics if no engine connected
  useEffect(() => {
    if (!isActive || pulseEngine) return;
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        pulseRate: prev.pulseRate + ((65 + Math.sin(Date.now() / 1500) * 10) - prev.pulseRate) * 0.1,
        systemLoad: prev.systemLoad + (Math.random() - 0.5) * 2,
        buildProgress: Math.min(100, prev.buildProgress + Math.random() * 0.2),
      }));
      setPulseHistory(prev => [...prev.slice(1), metricsRef.current.pulseRate]);
      setEmergentHistory(prev => [...prev.slice(1), metricsRef.current.emergentScore]);
    }, updateInterval);
    return () => clearInterval(interval);
  }, [isActive, pulseEngine, updateInterval]);

  const getMetricColor = useCallback((value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  }, []);

  const renderMiniChart = useCallback((data: number[], color: string) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return (
      <div className="flex items-end space-x-px h-8">
        {data.slice(-20).map((v, i) => {
          const h = ((v - min) / range) * 100;
          return <div key={i} className={`w-1 rounded-sm ${color} opacity-80`} style={{ height: `${Math.max(5, h)}%` }} />;
        })}
      </div>
    );
  }, []);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Real-Time Progress</h2>
            <p className="text-gray-400 text-sm">Live system metrics & dialogue tracking</p>
          </div>
        </div>
        <div className={`flex items-center space-x-2 ${isActive ? 'text-green-400' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm">{isActive ? 'Active' : 'Idle'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Pulse Rate" icon={<Waves className="w-4 h-4 text-blue-400" />} value={`${metrics.pulseRate.toFixed(0)} BPM`} chart={renderMiniChart(pulseHistory, 'bg-blue-400')} />
        <MetricCard label="System Load" icon={<Cpu className="w-4 h-4 text-orange-400" />} value={`${metrics.systemLoad.toFixed(0)}%`} valueClass={getMetricColor(100 - metrics.systemLoad, { good: 70, warning: 50 })} />
        <MetricCard label="Emergent Score" icon={<TrendingUp className="w-4 h-4 text-purple-400" />} value={metrics.emergentScore.toFixed(0)} chart={renderMiniChart(emergentHistory, 'bg-purple-400')} />
        <MetricCard label="Topic Alignment" icon={<Target className="w-4 h-4 text-green-400" />} value={`${metrics.topicAlignment.toFixed(0)}%`} valueClass={getMetricColor(metrics.topicAlignment, { good: 85, warning: 70 })} />
      </div>

      <AgentActivitySection metrics={metrics.agentActivity} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <ProgressBar label="Code Quality" value={metrics.codeQuality} thresholds={{ good: 85, warning: 70 }} />
        <ProgressBar label="Build Progress" value={metrics.buildProgress} gradient />
      </div>

      <div className="bg-gray-800 p-4 rounded-lg max-h-40 overflow-y-auto" ref={dialogueContainerRef}>
        <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <span>Live Dialogue Feed</span>
        </h3>
        {dialogueHistory.map((d, i) => (
          <div key={i} className="mb-1 text-sm">
            <span className="font-semibold text-blue-400">{d.agent}:</span> {d.message}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Reusable Components ---
const MetricCard = ({ label, icon, value, chart, valueClass }: { label: string; icon: React.ReactNode; value: string; chart?: React.ReactNode; valueClass?: string }) => (
  <div className="bg-gray-800 p-4 rounded-lg hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">{icon}<span className="text-sm text-gray-400">{label}</span></div>
      {chart}
    </div>
    <div className={`text-2xl font-bold ${valueClass || 'text-white'}`}>{value}</div>
  </div>
);

const AgentActivitySection = ({ metrics }: { metrics: { genesisWeaver: number; refinementGuardian: number } }) => (
  <div className="bg-gray-800 p-4 rounded-lg mb-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
      <Brain className="w-5 h-5 text-blue-400" />
      <span>Dual Agent Activity</span>
    </h3>
    {(['genesisWeaver', 'refinementGuardian'] as const).map(agent => {
      const value = metrics[agent];
      const gradient = agent === 'genesisWeaver' ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500';
      return (
        <div key={agent} className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              {agent === 'genesisWeaver' ? <Zap className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4 text-purple-400" />}
              <span className="text-sm">{agent === 'genesisWeaver' ? 'Genesis Weaver (Creative)' : 'Refinement Guardian (QC)'}</span>
            </div>
            <span className="text-sm text-gray-300">{value.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`} style={{ width: `${value}%` }} />
          </div>
        </div>
      );
    })}
  </div>
);

const ProgressBar = ({ label, value, thresholds, gradient }: { label: string; value: number; thresholds?: { good: number; warning: number }; gradient?: boolean }) => {
  const getColor = () => {
    if (gradient) return 'bg-gradient-to-r from-blue-500 to-green-500';
    if (!thresholds) return 'bg-gray-400';
    if (value >= thresholds.good) return 'bg-green-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Activity className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className={`${getColor()} h-full transition-all duration-500`} style={{ width: `${value}%` }} />
          </div>
        </div>
        <span className="text-sm font-bold text-blue-400">{value.toFixed(0)}%</span>
      </div>
    </div>
  );
};

// ---- SocialFeed.tsx ----
import { Heart } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Send } from 'lucide-react';
import { Upload } from 'lucide-react';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';
"use client";

interface MediaAttachment {
  id: string;
  type: "image" | "video" | "audio";
  src: string; // base64 string or URL
  owner: string; // wallet address or username
}

interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: { author: string; text: string; timestamp: string }[];
  attachments: MediaAttachment[];
}

const STORAGE_KEY = "universal_social_feed_v2";

const Card: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 shadow space-y-3">
    {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
    {children}
  </div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}> = ({ children, onClick, disabled, variant = "primary" }) => {
  const colors =
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-gray-700 hover:bg-gray-600";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded text-xs font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${colors}`}
    >
      {children}
    </button>
  );
};

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [username, setUsername] = useState("0xWalletAddress");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setPosts(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const newAttachments: MediaAttachment[] = [];
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const type = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "audio";

      newAttachments.push({
        id: crypto.randomUUID(),
        type,
        src: base64,
        owner: username,
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const createPost = () => {
    if (!newPost.trim() && attachments.length === 0) return;

    const post: Post = {
      id: crypto.randomUUID(),
      author: username,
      content: newPost.trim(),
      timestamp: new Date().toLocaleString(),
      likes: 0,
      comments: [],
      attachments,
    };

    setPosts([post, ...posts]);
    setNewPost("");
    setAttachments([]);
  };

  const likePost = (id: string) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));
  };

  const addComment = (id: string) => {
    const text = commentDrafts[id];
    if (!text?.trim()) return;

    setPosts(
      posts.map((p) =>
        p.id === id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { author: username, text, timestamp: new Date().toLocaleTimeString() },
              ],
            }
          : p
      )
    );
    setCommentDrafts((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="space-y-6">
      <Card title="Decentralized Social Feed">
        {/* Post Creator */}
        <div className="mb-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your wallet address or name"
            className="p-2 rounded bg-gray-900 border border-gray-700 text-sm w-full mb-2"
          />
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="p-3 rounded bg-gray-900 border border-gray-700 text-sm w-full mb-2"
          />

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {attachments.map((a) => (
                <div key={a.id} className="relative">
                  {a.type === "image" && <img src={a.src} className="rounded-lg w-full h-auto" />}
                  {a.type === "video" && <video src={a.src} className="rounded-lg w-full" controls />}
                  {a.type === "audio" && <audio src={a.src} className="w-full" controls />}
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center space-x-2 cursor-pointer text-blue-400 text-xs mb-2">
            <Upload className="w-4 h-4" />
            <span>Attach Image/Video/Audio</span>
            <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
          </label>

          <Button onClick={createPost}>
            <Send className="w-3 h-3 inline mr-1" /> Post
          </Button>
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {posts.length === 0 && (
            <p className="text-gray-400 text-sm text-center">No posts yet. Be the first!</p>
          )}
          {posts.map((post) => (
            <div key={post.id} className="bg-black/30 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between">
                <p className="text-sm text-blue-300 font-semibold">{post.author}</p>
                <span className="text-xs text-gray-400">{post.timestamp}</span>
              </div>

              <p className="text-gray-200 text-sm mt-2 whitespace-pre-wrap">{post.content}</p>

              {/* Media attachments */}
              {post.attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {post.attachments.map((a) => (
                    <div key={a.id}>
                      {a.type === "image" && <img src={a.src} className="rounded-lg" />}
                      {a.type === "video" && <video src={a.src} className="rounded-lg" controls />}
                      {a.type === "audio" && <audio src={a.src} controls />}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-3 mt-2">
                <button
                  onClick={() => likePost(post.id)}
                  className="flex items-center text-xs text-pink-400 hover:text-pink-300"
                >
                  <Heart className="w-3 h-3 mr-1" /> {post.likes}
                </button>
                <button
                  onClick={() =>
                    setCommentDrafts((prev) => ({ ...prev, [post.id]: prev[post.id] || "" }))
                  }
                  className="flex items-center text-xs text-gray-300 hover:text-white"
                >
                  <MessageCircle className="w-3 h-3 mr-1" /> {post.comments.length} Comments
                </button>
              </div>

              {/* Comments */}
              {post.comments.length > 0 && (
                <div className="mt-2 pl-3 border-l border-gray-700 space-y-1">
                  {post.comments.map((c, i) => (
                    <div key={i} className="text-xs text-gray-300">
                      <span className="text-blue-300">{c.author}</span>: {c.text}{" "}
                      <span className="text-gray-500">({c.timestamp})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment input */}
              {commentDrafts[post.id] !== undefined && (
                <div className="flex mt-2 space-x-2">
                  <input
                    value={commentDrafts[post.id]}
                    onChange={(e) =>
                      setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Write a comment..."
                    className="flex-1 p-1 rounded bg-gray-900 border border-gray-700 text-xs"
                  />
                  <Button onClick={() => addComment(post.id)} variant="secondary">
                    Reply
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---- TCCLogger.tsx ----
import { Network } from './Blockchain';
import { Brain } from 'lucide-react';
import { Search } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import React from 'react';
"use client";
// Simple SHA-256 (browser) for hash verification
async function sha256(data: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface TCCLoggerProps {
  network: Network | null;
}

const TCCLogger: React.FC<TCCLoggerProps> = ({ network }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!network) return;

    setLogs(network.blockchain.logs);

    network.blockchain.onLogEntryAdded = (log) => {
      setLogs((prev) => [...prev, log]);
    };
  }, [network]);

  // Recompute verification when logs change
  useEffect(() => {
    (async () => {
      const results: Record<string, boolean> = {};
      for (const log of logs) {
        const computed = await sha256(
          JSON.stringify({
            action: log.action,
            timestamp: log.timestamp,
            data: log.data,
            previousHash: log.previousHash,
          })
        );
        results[log.id] = computed === log.hash;
      }
      setVerifications(results);
    })();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(l.data).toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.hash.includes(searchQuery)
    );
  }, [logs, searchQuery]);

  const reverseTrace = useMemo(() => {
    const map = new Map<string, LogEntry>();
    logs.forEach((log) => map.set(log.hash, log));

    const chain: LogEntry[] = [];
    let current = logs[logs.length - 1]; // start from latest
    while (current) {
      chain.push(current);
      current = current.previousHash ? map.get(current.previousHash) ?? null : null;
    }
    return chain.reverse();
  }, [logs]);

  const analyzeLogs = async () => {
    // Lightweight AI-like heuristic (can later connect to LLM endpoint)
    const suspicious = logs.filter(
      (log) =>
        log.action.toLowerCase().includes("failed") ||
        (typeof log.data === "object" &&
          JSON.stringify(log.data).toLowerCase().includes("error"))
    );
    setAiSummary(
      suspicious.length > 0
        ? `⚠️ Detected ${suspicious.length} suspicious or failed actions`
        : "✅ No anomalies detected in logs"
    );
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <span>TCC Logger</span>
        </h2>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-gray-600"
          />
          <button
            onClick={analyzeLogs}
            className="flex items-center text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
          >
            <Brain className="w-4 h-4 mr-1" /> Analyze
          </button>
        </div>
      </div>

      {aiSummary && (
        <div className="p-2 text-xs rounded bg-gray-800 border border-gray-700 text-gray-300">
          {aiSummary}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 text-xs text-gray-300"
            >
              <p>
                <strong>Action:</strong> {log.action}
              </p>
              <p>
                <strong>Timestamp:</strong>{" "}
                {new Date(log.timestamp).toLocaleString()}
              </p>
              <p>
                <strong>Hash:</strong>{" "}
                <span
                  className={
                    verifications[log.id] ? "text-green-400" : "text-red-400"
                  }
                >
                  {log.hash.substring(0, 24)}...
                </span>
              </p>
              <p>
                <strong>Prev Hash:</strong>{" "}
                {log.previousHash?.substring(0, 24) ?? "GENESIS"}
              </p>
              <p className="break-all">
                <strong>Data:</strong>{" "}
                {JSON.stringify(log.data, null, 2).slice(0, 80)}...
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">No logs available.</p>
        )}
      </div>

      <div className="mt-2">
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer">Reverse Trace</summary>
          <div className="mt-2 space-y-1">
            {reverseTrace.map((log) => (
              <p key={log.id} className="truncate">
                → {log.action} ({new Date(log.timestamp).toLocaleTimeString()})
              </p>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default TCCLogger;

// ---- index.ts ----
export { default as AgoraLucentis } from "./AgoraLucentis";
export { default as BackAndForthPulseComponent } from "./BackAndForthPulseComponent";
export { default as Blockchain } from "./Blockchain";
export { default as BlockchainEngine } from "./BlockchainEngine";
export { default as BlockchainInterface } from "./BlockchainInterface";
export { default as Browser } from "./Browser";
export { default as CharisVouchers } from "./CharisVouchers";
export { default as ChatPulse } from "./ChatPulse";
export { default as CodeAnalyzer } from "./CodeAnalyzer";
export { default as CrossChainBlockchain } from "./CrossChainBlockchain";
export { default as CryptoCasino } from "./CryptoCasino";
export { default as Dashboard } from "./Dashboard";
export { default as LuxMeter } from "./LuxMeter";
export { default as ProjectGoals } from "./ProjectGoals";
export { default as ProjectScheduler } from "./ProjectScheduler";
export { default as PulseEngine } from "./PulseEngine";
export { default as RealTimeProgress } from "./RealTimeProgress";
export { default as SocialFeed } from "./SocialFeed";
export { default as TCCLogger } from "./TCCLogger";

