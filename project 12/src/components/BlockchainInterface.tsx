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