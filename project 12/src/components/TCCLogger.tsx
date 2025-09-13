import { Network } from './Blockchain';
import { Brain, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

  // Initialize logs when network changes
  useEffect(() => {
    if (!network?.blockchain) {
      setLogs([]); // fallback if network not ready
      return;
    }

    setLogs(network.blockchain.logs ?? []);

    // Subscribe to new logs
    network.blockchain.onLogEntryAdded = (log) => {
      setLogs((prev) => [...(prev ?? []), log]);
    };

    return () => {
      if (network?.blockchain) network.blockchain.onLogEntryAdded = undefined;
    };
  }, [network]);

  // Verify hashes whenever logs change
  useEffect(() => {
    if (!logs || logs.length === 0) {
      setVerifications({});
      return;
    }

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

  // Filtered logs for search
  const filteredLogs = useMemo(() => {
    if (!logs?.length) return [];
    if (!searchQuery) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(l.data).toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.hash.includes(searchQuery)
    );
  }, [logs, searchQuery]);

  // Reverse trace of logs
  const reverseTrace = useMemo(() => {
    if (!logs?.length) return [];

    const map = new Map<string, LogEntry>();
    logs.forEach((log) => map.set(log.hash, log));

    const chain: LogEntry[] = [];
    let current: LogEntry | null = logs[logs.length - 1];
    while (current) {
      chain.push(current);
      current = current.previousHash ? map.get(current.previousHash) ?? null : null;
    }
    return chain.reverse();
  }, [logs]);

  const analyzeLogs = async () => {
    if (!logs?.length) {
      setAiSummary("No logs to analyze.");
      return;
    }

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
              <p><strong>Action:</strong> {log.action}</p>
              <p><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</p>
              <p>
                <strong>Hash:</strong>{" "}
                <span className={verifications[log.id] ? "text-green-400" : "text-red-400"}>
                  {log.hash?.substring(0, 24) ?? ""}...
                </span>
              </p>
              <p><strong>Prev Hash:</strong> {log.previousHash?.substring(0, 24) ?? "GENESIS"}</p>
              <p className="break-all">
                <strong>Data:</strong> {JSON.stringify(log.data ?? {}, null, 2).slice(0, 80)}...
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
            {reverseTrace.length > 0 ? (
              reverseTrace.map((log) => (
                <p key={log.id} className="truncate">
                  → {log.action} ({new Date(log.timestamp).toLocaleTimeString()})
                </p>
              ))
            ) : (
              <p className="text-gray-500">No trace available.</p>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default TCCLogger;