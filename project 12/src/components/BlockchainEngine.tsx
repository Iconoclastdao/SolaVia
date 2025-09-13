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