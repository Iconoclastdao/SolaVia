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