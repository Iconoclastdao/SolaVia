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

  // Initialize vouchers once
  setVouchers(bc.vouchers ?? []);
  setLuxScore(bc.getLuxScore(address));
  setRank(bc.getRank(address).title);

  const handleVoucherIssued = (voucher: Voucher) => {
    setVouchers((prev) => [...prev, voucher]);
    setLogs((prev) => [...prev.slice(-19), `🎁 Voucher forged: ${voucher.from} → ${voucher.to} for ${voucher.value} LUX`]);

    // Update luxScore & rank based on current address
    setLuxScore(bc.getLuxScore(address));
    setRank(bc.getRank(address).title);

    if (voucher.value >= 50) {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    }
  };

  bc.onVoucherIssued = handleVoucherIssued;

  return () => {
    bc.onVoucherIssued = undefined;
  };
  // Only run once when blockchain becomes available
}, [network?.blockchain, address]);


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