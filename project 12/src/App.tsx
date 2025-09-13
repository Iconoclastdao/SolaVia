
import AgoraLucentis from './components/AgoraLucentis';
import { BackAndForthPulse } from './components/BackAndForthPulseComponent';
import { Network, SoulboundId } from './components/Blockchain';
import { Browser } from './components/Browser';
import { CharisVouchers } from './components/CharisVouchers';
import ChatPulseComponent from './components/ChatPulse';
import CodeAnalyzer from './components/CodeAnalyzer';
import CryptoCasino from './components/CryptoCasino';
import LuxMeter from './components/LuxMeter';
import { ProjectGoals } from './components/ProjectGoals';
import { ProjectScheduler } from './components/ProjectScheduler';
import PulseEngineComponent from './components/PulseEngine';
import { RealTimeProgress } from './components/RealTimeProgress';
import SocialFeed from './components/SocialFeed';
import TCCLogger from './components/TCCLogger';
import { Coins, Cpu, Database, MessageSquare, Sun, Zap } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
"use client";
// Styles
import "./styles/global.css";

const BlockchainView: React.FC<{ network: Network | null }> = ({ network }) => {
  if (!network)
    return (
      <div className="text-center text-gray-400 animate-pulse">
        Initializing Secure Blockchain Interface...
      </div>
    );

  const latest = network.blockchain.getLatestBlock();
  return (
    <div className="classified-overlay p-6 rounded-xl bg-gray-900/90 text-gray-200 terminal-text">
      <p>
        <strong>Network ID:</strong> {network.id}
      </p>
      <p>
        <strong>Block Height:</strong> {network.blockchain.blocks.length}
      </p>
      <p>
        <strong>Latest Block:</strong> #{latest?.header?.number ?? 0}
      </p>
      <p>
        <strong>Hash:</strong> {latest?.hash ?? "N/A"}
      </p>
    </div>
  );
};

const AgoraGroup: React.FC<{ network: Network | null }> = ({ network }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
        <AgoraLucentis network={network} />
      </div>
    </div>
    <div className="space-y-6">
      <Suspense fallback={<LoadingFallback label="Loading Social Feed..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <SocialFeed network={network} />
        </div>
      </Suspense>
      <Suspense fallback={<LoadingFallback label="Loading Chat..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <ChatPulseComponent cycles={2} />
        </div>
      </Suspense>
    </div>
  </div>
);

const BlockchainGroup: React.FC<{ network: Network | null }> = ({ network }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="space-y-6">
      <Suspense fallback={<LoadingFallback label="Loading Blockchain Interface..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <BlockchainView network={network} />
        </div>
      </Suspense>
    </div>
    <div className="space-y-6">
      <Suspense fallback={<LoadingFallback label="Loading Chain Browser..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <Browser network={network} />
        </div>
      </Suspense>
    </div>
  </div>
);

const EconomyGroup: React.FC<{ network: Network | null }> = ({ network }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <Suspense fallback={<LoadingFallback label="Loading Charis Vouchers..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <CharisVouchers network={network} />
        </div>
      </Suspense>
    </div>
    <div className="space-y-6">
      <Suspense fallback={<LoadingFallback label="Loading Lux Analytics..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <LuxMeter network={network} />
        </div>
      </Suspense>
    </div>
  </div>
);

const GameHubGroup: React.FC<{ network: Network | null; tasks: any[]; onTaskUpdate: (tasks: any[]) => void }> = ({ network, tasks, onTaskUpdate }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="space-y-6">
      <Suspense fallback={<LoadingFallback label="Loading Crypto Casino..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-brown-900/80 glow-effect">
          <CryptoCasino network={network} />
        </div>
      </Suspense>
    </div>
    <div className="space-y-6">
      <Suspense fallback={<LoadingFallback label="Loading Pulse Playground..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <BackAndForthPulse tasks={tasks} onTaskUpdate={onTaskUpdate} />
        </div>
      </Suspense>
    </div>
  </div>
);

const PulseGroup: React.FC<{ network: Network | null; tasks: any[]; onTaskUpdate: (tasks: any[]) => void }> = ({ network, tasks, onTaskUpdate }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Suspense fallback={<LoadingFallback label="Loading Pulse Core..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <PulseEngineComponent tasks={tasks} onTaskUpdate={onTaskUpdate} />
        </div>
      </Suspense>
      <Suspense fallback={<LoadingFallback label="Loading Code Intelligence..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <CodeAnalyzer />
        </div>
      </Suspense>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Suspense fallback={<LoadingFallback label="Loading TCC Archives..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <TCCLogger network={network} />
        </div>
      </Suspense>
      <Suspense fallback={<LoadingFallback label="Loading Real-Time Ops..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <RealTimeProgress isActive={true} />
        </div>
      </Suspense>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Suspense fallback={<LoadingFallback label="Loading Strategic Objectives..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <ProjectGoals />
        </div>
      </Suspense>
      <Suspense fallback={<LoadingFallback label="Loading Mission Scheduler..." />}>
        <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
          <ProjectScheduler onTasksUpdate={() => {}} />
        </div>
      </Suspense>
    </div>
  </div>
);

const LoadingFallback: React.FC<{ label?: string }> = ({ label = "Loading..." }) => (
  <div className="py-16 flex items-center justify-center text-gray-400 terminal-text">
    <div className="flex items-center space-x-4">
      <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse glow-effect" />
      <span>{label}</span>
    </div>
  </div>
);

const Dashboard: React.FC<{ network: Network | null; tasks: any[]; onTasksUpdate: (tasks: any[]) => void }> = ({ network, tasks, onTasksUpdate }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
      <h2 className="text-lg font-semibold text-blue-400 mb-4">Agora Lucentis</h2>
      <AgoraLucentis network={network} />
    </div>
    <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
      <h2 className="text-lg font-semibold text-blue-400 mb-4">Social Feed</h2>
      <Suspense fallback={<LoadingFallback label="Loading Social Feed..." />}>
        <SocialFeed network={network} />
      </Suspense>
    </div>
    <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
      <h2 className="text-lg font-semibold text-blue-400 mb-4">Chat Pulse</h2>
      <Suspense fallback={<LoadingFallback label="Loading Chat..." />}>
        <ChatPulseComponent cycles={2} />
      </Suspense>
    </div>
    <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
      <h2 className="text-lg font-semibold text-blue-400 mb-4">Blockchain View</h2>
      <Suspense fallback={<LoadingFallback label="Loading Blockchain Interface..." />}>
        <BlockchainView network={network} />
      </Suspense>
    </div>
    <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
      <h2 className="text-lg font-semibold text-blue-400 mb-4">Charis Vouchers</h2>
      <Suspense fallback={<LoadingFallback label="Loading Charis Vouchers..." />}>
        <CharisVouchers network={network} />
      </Suspense>
    </div>
    <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
      <h2 className="text-lg font-semibold text-blue-400 mb-4">Lux Meter</h2>
      <Suspense fallback={<LoadingFallback label="Loading Lux Analytics..." />}>
        <LuxMeter network={network} />
      </Suspense>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("command");
  const [tasks, setTasks] = useState<any[]>([]);
  const [network1, setNetwork1] = useState<Network | null>(null);
  const [address] = useState<string>("0x1");
  const [soulboundId, setSoulboundId] = useState<SoulboundId | null>(null);
  const [luxScore, setLuxScore] = useState<number>(0);
  const [rank, setRank] = useState<string>("");

  const handleTasksUpdate = useCallback((updatedTasks: any[]) => setTasks(updatedTasks), []);
  const handleError = useCallback((err: any) => console.error(err), []);

  const tabs = [
    { id: "command", label: "Command Center", icon: Zap, component: Dashboard, description: "Core operations and system overview" },
    { id: "agora", label: "Agora Network", icon: MessageSquare, component: AgoraGroup, description: "Social covenant and revelation sharing" },
    { id: "blockchain", label: "Blockchain Hub", icon: Database, component: BlockchainGroup, description: "Immutable truth and chain operations" },
    { id: "economy", label: "Charis Economy", icon: Coins, component: EconomyGroup, description: "Aligned value and sovereign rewards" },
    { id: "gamehub", label: "Sovereign GameHub", icon: Cpu, component: () => <GameHubGroup network={network1} tasks={tasks} onTaskUpdate={handleTasksUpdate} />, description: "Casino and playground operations" },
    { id: "pulse", label: "Pulse Control", icon: Cpu, component: () => <PulseGroup network={network1} tasks={tasks} onTaskUpdate={handleTasksUpdate} />, description: "System orchestration and project alignment" },
  ];

  const componentProps: Record<string, any> = {
    command: { network: network1, tasks, onTasksUpdate: handleTasksUpdate },
    agora: { network: network1 },
    blockchain: { network: network1 },
    economy: { network: network1 },
    gamehub: { network: network1, tasks, onTaskUpdate: handleTasksUpdate },
    pulse: { network: network1, tasks, onTaskUpdate: handleTasksUpdate },
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const n1 = await Network.create("network1");
        const n2 = await Network.create("network2");
        n1.addPeer(n2);

        if (n1.blockchain.onBlockMined) {
          n1.blockchain.onBlockMined = () => n1.syncState();
        }
        n1.blockchain.onSoulboundIdCreated = (id) => {
          if (cancelled) return;
          setSoulboundId(id);
          setLuxScore(n1.blockchain.getLuxScore(address));
          setRank(n1.blockchain.getRank(address).title);
        };

        if (!cancelled) {
          setNetwork1(n1);
          setSoulboundId(n1.blockchain.getSoulboundId(address) || null);
          setLuxScore(n1.blockchain.getLuxScore(address));
          setRank(n1.blockchain.getRank(address).title);
        }
      } catch (err) {
        handleError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, handleError]);

  const createSoulboundId = async () => {
    if (!network1) return;
    try {
      const personalData = { username: `agent_${address}`, timestamp: Date.now() };
      const id = await network1.blockchain.createSoulboundId(address, personalData);
      setSoulboundId(id);
    } catch (err) {
      handleError(err);
    }
  };

  const renderComponent = (tabId: string) => {
    const Tab = tabs.find((tab) => tab.id === tabId)?.component;
    if (!Tab) return null;
    const props = componentProps[tabId] || {};
    return <Tab {...props} />;
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="w-72 bg-gray-900/95 backdrop-blur-2xl border-r border-blue-900/30 classified-overlay flex flex-col">
        <div className="flex items-center justify-center h-20 border-b border-blue-900/50">
          <div className="w-16 h-16 holographic rounded-2xl flex items-center justify-center glow-effect">
            <Sun className="w-8 h-8 text-white" />
          </div>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-left space-x-4 terminal-text ${
                  activeTab === tab.id
                    ? "bg-blue-900/50 text-blue-300 font-bold glow-effect"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/70 social-pulse"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="truncate">{tab.label}</span>
                <div className="ml-auto text-xs opacity-70">{tab.description}</div>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-blue-900/50 text-center text-xs text-gray-400 terminal-text">
          SovereignOS v2.7.3 | Classified Access
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900/70 backdrop-blur-xl border-b border-blue-900/50 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white terminal-text">SovereignOS</h1>
            <span className="text-xs text-gray-400">[SECURE NODE ACTIVE]</span>
          </div>
          {soulboundId ? (
            <div className="flex flex-col items-end text-sm text-gray-200 terminal-text">
              <span>
                <strong>Agent ID:</strong> {address}
              </span>
              <span>
                <strong>LuxScore:</strong> {luxScore.toFixed(2)}
              </span>
              <span>
                <strong>Clearance:</strong> {rank}
              </span>
            </div>
          ) : (
            <button
              onClick={createSoulboundId}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300 glow-effect terminal-text"
            >
              Initialize Soulbound ID
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-10 space-y-10 bg-gradient-to-br from-gray-900/80 to-gray-800/80">
          <Suspense
            key={activeTab}
            fallback={<LoadingFallback label={`Initializing ${tabs.find((t) => t.id === activeTab)?.label ?? "Module"}...`} />}
          >
            <div className="classified-overlay p-6 rounded-2xl bg-gray-900/90 glow-effect">
              {renderComponent(activeTab)}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;