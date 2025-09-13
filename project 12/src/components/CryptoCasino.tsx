
"use client";

import React, { useState, useEffect, useRef, Component, useCallback } from "react";
import { keccak256, toUtf8Bytes } from "ethers";
import { AlertTriangle, Code2, Coins, Database, Dice5, Download, Search, Star, Trophy, Zap } from "lucide-react";
import { Network } from './Blockchain';

// ---------------------
// Error Boundary
// ---------------------
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-900/50 rounded-2xl text-white">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-lg font-bold">Error in GameHub</h2>
          </div>
          <p className="text-sm">{this.state.error}</p>
          <p className="text-sm mt-2">Please try again or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------
// Interfaces
// ---------------------
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
  game: string;
}

interface GameResult {
  id: string;
  game: string;
  score: number;
  timestamp: string;
}

// ---------------------
// Utility Functions
// ---------------------
const handleSearch = (query: string) => console.log("Search query:", query);

function computeMerkleRoot(transactions: Transaction[]): string {
  if (transactions.length === 0) return keccak256(toUtf8Bytes("empty"));
  let layer = transactions.map((tx) => keccak256(toUtf8Bytes(JSON.stringify(tx))));
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] ?? left;
      next.push(keccak256(toUtf8Bytes(left + right)));
    }
    layer = next;
  }
  return layer[0];
}

// ---------------------
// UI Components
// ---------------------
const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-blue-900/30 shadow-xl glow-effect space-y-4 ${className}`}>
    {title && (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-6 bg-gradient-to-b from-blue-400 to-purple-600 rounded" />
        <h2 className="text-xl font-bold text-white terminal-text">{title}</h2>
      </div>
    )}
    {children}
  </div>
);

const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "secondary" | "danger" }> = ({
  children,
  onClick,
  disabled,
  variant = "primary",
}) => {
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

// ---------------------
// Dice Game Component
// ---------------------
interface DiceGameProps {
  selectedPlayer: string;
  betAmount: string;
  onBet: (bet: { player: string; wager: number; game: string }) => void;
  setBetAmount: (amt: string) => void;
  network: Network | null;
  setSelectedPlayer: (addr: string) => void;
}

const DiceGame: React.FC<DiceGameProps> = ({ selectedPlayer, betAmount, onBet, setBetAmount, network }) => {
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>("");

  const rollDice = () => {
    if (!selectedPlayer || !betAmount || parseFloat(betAmount) <= 0) {
      setResultMessage("Please select a player and enter a valid bet amount.");
      return;
    }
    setRolling(true);
    setResultMessage("");
    setTimeout(() => {
      const result = Math.floor(Math.random() * 6) + 1;
      setDiceValue(result);
      const win = result >= 4; // Win if roll is 4, 5, or 6
      onBet({ player: selectedPlayer, wager: parseFloat(betAmount), game: "Dice" });
      setResultMessage(win ? "🎉 You won!" : "😔 You lost.");
      setRolling(false);
    }, 1000);
  };

  return (
    <Card className="bg-brown-900/80">
      <h3 className="text-lg font-semibold text-blue-400 mb-4">Dice Roll</h3>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-24 p-2 rounded bg-gray-900/80 border border-blue-900/50 text-white text-sm"
            placeholder="Bet amount"
          />
          <Button onClick={rollDice} disabled={rolling}>
            {rolling ? "Rolling..." : <><Dice5 className="w-5 h-5 inline mr-2" /> Roll Dice</>}
          </Button>
        </div>
        <div className="text-center text-white text-3xl font-bold terminal-text animate-pulse">
          {diceValue !== null ? `🎲 Rolled: ${diceValue}` : rolling ? "Rolling..." : "Roll to play!"}
        </div>
        {resultMessage && (
          <div className={`text-center text-sm ${resultMessage.includes("won") ? "text-green-400" : "text-red-400"}`}>
            {resultMessage}
          </div>
        )}
      </div>
    </Card>
  );
};

// ---------------------
// Slots Game Component
// ---------------------
const SlotsGame: React.FC<DiceGameProps> = ({ selectedPlayer, betAmount, onBet, setBetAmount, network }) => {
  const [reels, setReels] = useState<string[]>(["?", "?", "?"]);
  const [spinning, setSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>("");
  const symbols = ["🍒", "🍋", "🍊", "⭐", "🔔", "7"];

  const spinReels = () => {
    if (!selectedPlayer || !betAmount || parseFloat(betAmount) <= 0) {
      setResultMessage("Please select a player and enter a valid bet amount.");
      return;
    }
    setSpinning(true);
    setResultMessage("");
    setTimeout(() => {
      const newReels = Array(3).fill("").map(() => symbols[Math.floor(Math.random() * symbols.length)]);
      setReels(newReels);
      const win = newReels.every((val, i, arr) => val === arr[0]); // Win if all reels match
      onBet({ player: selectedPlayer, wager: parseFloat(betAmount), game: "Slots" });
      setResultMessage(win ? "🎉 Jackpot! You won!" : "😔 No match. Try again.");
      setSpinning(false);
    }, 1500);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-blue-400 mb-4">Slot Machine</h3>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-24 p-2 rounded bg-gray-900/80 border border-blue-900/50 text-white text-sm"
            placeholder="Bet amount"
          />
          <Button onClick={spinReels} disabled={spinning}>
            {spinning ? "Spinning..." : <><Star className="w-5 h-5 inline mr-2" /> Spin Reels</>}
          </Button>
        </div>
        <div className="flex justify-center space-x-4 text-4xl font-bold text-white terminal-text">
          {reels.map((symbol, i) => (
            <div key={i} className={`w-16 h-16 flex items-center justify-center bg-gray-800/50 rounded-lg ${spinning ? "animate-spin" : ""}`}>
              {symbol}
            </div>
          ))}
        </div>
        {resultMessage && (
          <div className={`text-center text-sm ${resultMessage.includes("won") ? "text-green-400" : "text-red-400"}`}>
            {resultMessage}
          </div>
        )}
      </div>
    </Card>
  );
};

// ---------------------
// Jackpot Game Component
// ---------------------
const JackpotGame: React.FC<DiceGameProps> = ({ selectedPlayer, betAmount, onBet, setBetAmount, network }) => {
  const [jackpot, setJackpot] = useState(1000); // Simulated progressive jackpot
  const [spinning, setSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>("");

  const tryJackpot = () => {
    if (!selectedPlayer || !betAmount || parseFloat(betAmount) <= 0) {
      setResultMessage("Please select a player and enter a valid bet amount.");
      return;
    }
    setSpinning(true);
    setResultMessage("");
    setTimeout(() => {
      const win = Math.random() < 0.1; // 10% chance to win jackpot
      onBet({ player: selectedPlayer, wager: parseFloat(betAmount), game: "Jackpot" });
      if (win) {
        setJackpot(1000); // Reset jackpot on win
        setResultMessage("🎉 You hit the jackpot!");
      } else {
        setJackpot((prev) => prev + parseFloat(betAmount)); // Add wager to jackpot
        setResultMessage("😔 No jackpot this time.");
      }
      setSpinning(false);
    }, 1000);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-blue-400 mb-4">Progressive Jackpot</h3>
      <div className="flex flex-col space-y-4">
        <div className="text-center text-yellow-400 text-2xl font-bold">Jackpot: {jackpot.toFixed(2)} ETH</div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-24 p-2 rounded bg-gray-900/80 border border-blue-900/50 text-white text-sm"
            placeholder="Bet amount"
          />
          <Button onClick={tryJackpot} disabled={spinning}>
            {spinning ? "Spinning..." : <><Trophy className="w-5 h-5 inline mr-2" /> Try Jackpot</>}
          </Button>
        </div>
        {resultMessage && (
          <div className={`text-center text-sm ${resultMessage.includes("won") ? "text-green-400" : "text-red-400"}`}>
            {resultMessage}
          </div>
        )}
      </div>
    </Card>
  );
};

// ---------------------
// Main Component
// ---------------------
export default function SovereignGameHub({ network }: { network: Network | null }) {
  const [activeTab, setActiveTab] = useState<"casino" | "browser" | "mining" | "contracts" | "analysis">("casino");
  const [activeGame, setActiveGame] = useState<"dice" | "slots" | "jackpot">("dice");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [betAmount, setBetAmount] = useState("0.01");
  const [bets, setBets] = useState<Bet[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [verifiedBlocks, setVerifiedBlocks] = useState<{ number: number; valid: boolean }[]>([]);

  const placeBet = useCallback((bet: { player: string; wager: number; game: string }) => {
    const id = Math.random().toString(36).slice(2);
    const result = Math.random() > 0.5 ? "win" : "lose";
    const payout = result === "win" ? bet.wager * 2 : 0;
    setBets((prev) => [...prev, { id, player: bet.player, wager: bet.wager, result, payout, timestamp: new Date().toISOString(), game: bet.game }]);
    setLogs((prev) => [...prev, `${bet.game} bet: ${bet.wager} ETH by ${bet.player}`]);
  }, []);

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6 bg-gradient-to-br from-gray-900/90 to-black rounded-2xl border border-blue-900/50 shadow-2xl glow-effect min-h-[600px]">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white terminal-text flex items-center">
            <Trophy className="w-8 h-8 mr-2 text-yellow-400 animate-pulse" /> Sovereign GameHub
          </h1>
          <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
            {["casino", "browser", "mining", "contracts", "analysis"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
                  activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "casino" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Game Selection" className="lg:col-span-2">
              <div className="flex space-x-2 mb-4">
                <Button onClick={() => setActiveGame("dice")} variant={activeGame === "dice" ? "primary" : "secondary"}>
                  <Dice5 className="w-5 h-5 inline mr-2" /> Dice
                </Button>
                <Button onClick={() => setActiveGame("slots")} variant={activeGame === "slots" ? "primary" : "secondary"}>
                  <Star className="w-5 h-5 inline mr-2" /> Slots
                </Button>
                <Button onClick={() => setActiveGame("jackpot")} variant={activeGame === "jackpot" ? "primary" : "secondary"}>
                  <Trophy className="w-5 h-5 inline mr-2" /> Jackpot
                </Button>
              </div>
              <div className="flex flex-col space-y-4">
                {activeGame === "dice" && (
                  <DiceGame
                    selectedPlayer={selectedPlayer}
                    betAmount={betAmount}
                    onBet={placeBet}
                    setBetAmount={setBetAmount}
                    network={network}
                    setSelectedPlayer={setSelectedPlayer}
                  />
                )}
                {activeGame === "slots" && (
                  <SlotsGame
                    selectedPlayer={selectedPlayer}
                    betAmount={betAmount}
                    onBet={placeBet}
                    setBetAmount={setBetAmount}
                    network={network}
                    setSelectedPlayer={setSelectedPlayer}
                  />
                )}
                {activeGame === "jackpot" && (
                  <JackpotGame
                    selectedPlayer={selectedPlayer}
                    betAmount={betAmount}
                    onBet={placeBet}
                    setBetAmount={setBetAmount}
                    network={network}
                    setSelectedPlayer={setSelectedPlayer}
                  />
                )}
              </div>
            </Card>
            <div className="space-y-6">
              <Card title="Player">
                <input
                  type="text"
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  placeholder="Enter player address"
                  className="w-full p-2 rounded bg-gray-900/80 border border-blue-900/50 text-white text-sm"
                />
                <div className="mt-2 text-sm text-gray-400">
                  Balance: {network?.blockchain?.accounts?.get(selectedPlayer)?.balance?.toFixed(2) || "0.00"} ETH
                </div>
              </Card>
              <Card title="Bet History">
                <div className="bg-gray-900/50 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono">
                  {bets.length === 0 ? (
                    <div className="text-gray-400">No bets yet</div>
                  ) : (
                    bets.map((b) => (
                      <div key={b.id} className={b.result === "win" ? "text-green-400" : "text-red-400"}>
                        {b.game}: {b.player} wagered {b.wager} ETH → {b.result.toUpperCase()} (Payout: {b.payout} ETH)
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "browser" && <Card title="Chain Browser"><div className="text-gray-400 text-sm italic">Chain Browser placeholder</div></Card>}
        {activeTab === "mining" && <Card title="Mining"><div className="text-gray-400 text-sm italic">Mining placeholder</div></Card>}
        {activeTab === "contracts" && <Card title="Contracts"><div className="text-gray-400 text-sm italic">Contracts placeholder</div></Card>}
        {activeTab === "analysis" && <Card title="Analysis"><div className="text-gray-400 text-sm italic">Analysis placeholder</div></Card>}
      </div>
    </ErrorBoundary>
  );
}
