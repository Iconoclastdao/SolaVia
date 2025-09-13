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