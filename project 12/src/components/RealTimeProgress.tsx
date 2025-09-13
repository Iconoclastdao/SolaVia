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