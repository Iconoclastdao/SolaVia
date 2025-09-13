import React, { useState, useEffect, useCallback } from 'react';
import { Network } from './Blockchain';
import { BackAndForthPulse } from './BackAndForthPulseComponent';
import { BlockchainEngine } from './BlockchainEngine';
import { BlockchainInterface } from './BlockchainInterface';
import { Browser } from './Browser';
import { CharisVouchers } from './CharisVouchers';
import ChatPulset from './ChatPulse';
import CodeAnalyzer from './CodeAnalyzer';
import CryptoCasino from './CryptoCasino';
import { ProjectGoals } from './ProjectGoals';
import { ProjectScheduler } from './ProjectScheduler';
import { RealTimeProgress } from './RealTimeProgress';
import SocialFeed from './SocialFeed';
import { Coins, Cpu, MessageSquare, Zap } from 'lucide-react';




'use client';





interface DashboardProps {
  network: Network | null;
}

const Dashboard: React.FC<DashboardProps> = ({ network }) => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('dashboard_tab') || 'command');
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <Zap className="w-16 h-16 mx-auto mb-4 animate-pulse text-blue-400" />
          <p className="text-xl font-mono text-blue-400">Initializing Sovereign Covenant...</p>
          <p className="text-sm mt-2 text-white">The chain is forging its truth</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'command', label: 'Command Center', icon: Zap, description: 'Core operations and system overview' },
    { id: 'agora', label: 'Agora Network', icon: MessageSquare, description: 'Social covenant and revelation sharing' },
    { id: 'blockchain', label: 'Blockchain Hub', icon: Zap, description: 'Immutable truth and chain operations' },
    { id: 'economy', label: 'Charis Economy', icon: Coins, description: 'Aligned value and sovereign rewards' },
    { id: 'gamehub', label: 'Sovereign GameHub', icon: Cpu, description: 'Casino and playground operations' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">
            Sovereign Covenant Dashboard
          </h1>
          <p className="text-white text-sm mt-2">A living system of aligned minds and immutable truth</p>
        </header>

        <nav className="flex space-x-2 mb-6 border-b border-blue-400/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-900/50 border-t border-l border-r border-blue-400 text-blue-400'
                  : 'bg-black hover:bg-gray-900 text-white'
              }`}
            >
              <tab.icon className="w-5 h-5 text-blue-400" />
              <span>{tab.label}</span>
              <span className="text-xs opacity-70">{tab.description}</span>
            </button>
          ))}
        </nav>

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'command' && (
            <>
              <div className="bg-black/80 rounded-xl border border-blue-400/50 p-4">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Agora Lucentis</h2>
                <AgoraLucentis network={network} onSelectAddress={setSelectedAddress} />
              </div>
              <div className="bg-black/80 rounded-xl border border-blue-400/50 p-4">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Social Feed</h2>
                <SocialFeed network={network} address={selectedAddress} />
              </div>
              <div className="bg-black/80 rounded-xl border border-blue-400/50 p-4">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Chat Pulse</h2>
                <ChatPulseComponent network={network} />
              </div>
              <div className="bg-black/80 rounded-xl border border-blue-400/50 p-4">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Blockchain Interface</h2>
                <BlockchainInterface blockchain={network.blockchain} address={selectedAddress} />
              </div>
              <div className="bg-black/80 rounded-xl border border-blue-400/50 p-4">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Charis Vouchers</h2>
                <CharisVouchers network={network} address={selectedAddress} />
              </div>
              <div className="bg-black/80 rounded-xl border border-blue-400/50 p-4">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Lux Meter</h2>
                <LuxMeter network={network} address={selectedAddress} />
              </div>
            </>
          )}

          {activeTab === 'agora' && (
            <>
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <AgoraLucentis network={network} onSelectAddress={setSelectedAddress} />
              </div>
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
            </>
          )}

          {activeTab === 'gamehub' && (
            <>
              <div className="bg-brown-900/80 rounded-xl border border-blue-400/50 p-4">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Crypto Casino</h2>
                <CryptoCasino network={network} selectedAddress={selectedAddress} />
              </div>
              <div className="bg-black/80 rounded-xl border border-blue-400/50 p-4">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Pulse Playground</h2>
                <BackAndForthPulse network={network} />
              </div>
            </>
          )}
        </main>

        <aside className="mt-6 bg-black/80 rounded-xl border border-blue-400/50 p-4">
          <h2 className="text-lg font-semibold text-blue-400 mb-4">Covenant Status</h2>
          <div className="space-y-4 text-sm text-white">
            <p>Network ID: {network.id}</p>
            <p>Block Height: {network.blockchain.chain.length}</p>
            <p>Pending Txns: {network.blockchain.pendingTransactions.length}</p>
            <p>Accounts: {network.blockchain.accounts.size}</p>
            <p>Vouchers: {network.blockchain.vouchers.length}</p>
            <p>Posts: {network.blockchain.posts.length}</p>
            <button
              onClick={syncNetwork}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-400 to-white hover:from-white hover:to-blue-400 text-black rounded-lg transition-all"
            >
              Sync Covenant
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;