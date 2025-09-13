import { PulseEngine } from '../lib/pulse-main-extended.mjs';
import { Bug } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';

type CodeAnalysisMessage = { role: string; text: string };
type CodeAnalyzerProps = { cycles?: number; dualMode?: boolean };

export default function CodeAnalyzer({ cycles = 2, dualMode = false }: CodeAnalyzerProps) {
  const engineRef = useRef<PulseEngine | null>(null);
  const [logs, setLogs] = useState<CodeAnalysisMessage[]>([]);
  const [inputCode, setInputCode] = useState("");
  const [running, setRunning] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string[]>([]);
  const [testScripts, setTestScripts] = useState<string>("");

  useEffect(() => {
    if (!engineRef.current) {
      const engine = new PulseEngine({
        ollamaUrls: dualMode
          ? ["http://localhost:11434/api/chat", "http://localhost:11435/api/chat"]
          : ["http://localhost:11434/api/chat"],
      });
      engineRef.current = engine;

      engine.on("dialogue", ({ index, reply }) => {
        setLogs((prev) => [...prev, { role: `Agent ${index}`, text: reply || "" }]);
      });

      engine.on("error", (err: any) =>
        setLogs((prev) => [...prev, { role: "Error", text: err.message || String(err) }])
      );
    }
  }, [dualMode]);

  const cleanText = (text: string) =>
    text ? text.replace(/\/\/\/ Local fallback\.?\n?/g, "").replace(/\/\/\/ Rules\.?\n?/g, "").trim() : "";

  const extractText = (res: any) => {
    if (!res) return "";
    if (typeof res === "string") return cleanText(res);
    if (res.text) return cleanText(res.text);
    if (res.reply) return cleanText(res.reply);
    if (Array.isArray(res.messages)) return cleanText(res.messages.map((m) => m.text || "").join("\n"));
    return cleanText(JSON.stringify(res));
  };

  const safeCompute = async (prompt: string, index: number) => {
    if (!engineRef.current) return "";
    try {
      const res = await engineRef.current.compute(prompt, index);
      return extractText(res);
    } catch (err: any) {
      setLogs((prev) => [...prev, { role: "Error", text: err.message || String(err) }]);
      return "";
    }
  };

  const analyzeCode = async () => {
    if (!inputCode.trim()) return;
    setRunning(true);
    setLogs([{ role: "User", text: inputCode }]);
    setHighlightedCode([]);
    setTestScripts("");

    try {
      let previousOutput = "";

      // Agent 0
      const res0 = await safeCompute(`Analyze code for bugs:\n${inputCode}`, 0);
      previousOutput = res0;
      setLogs((prev) => [...prev, { role: "Agent 0", text: res0 }]);

      // Agent 1
      const res1 = await safeCompute(
        `Suggest improvements, upgrades, and fixes for the following code analysis:\n${previousOutput}`,
        dualMode ? 1 : 0
      );
      previousOutput = res1;
      setLogs((prev) => [...prev, { role: "Agent 1", text: res1 }]);

      // Manager cycles
      for (let i = 1; i <= cycles; i++) {
        const resM = await safeCompute(
          `Manager cycle ${i}: refine, improve, and upgrade previous analysis, including suggested code changes and test scripts:\n${previousOutput}`,
          0
        );
        previousOutput = resM;
        setLogs((prev) => [...prev, { role: `Manager cycle ${i}`, text: resM }]);

        try {
          const parsed = JSON.parse(resM);
          if (parsed.vulnerableLines && Array.isArray(parsed.vulnerableLines))
            setHighlightedCode(parsed.vulnerableLines);
          if (parsed.testScripts) setTestScripts(parsed.testScripts);
        } catch {
          // ignore JSON parse errors
        }
      }

      setLogs((prev) => [...prev, { role: "✅ Final Output", text: previousOutput }]);
    } catch (err: any) {
      setLogs((prev) => [...prev, { role: "Error", text: err.message || String(err) }]);
    } finally {
      setRunning(false);
    }
  };

  const renderCodeWithHighlights = () =>
    inputCode.split("\n").map((line, i) => {
      const isVulnerable = highlightedCode.includes((i + 1).toString());
      return (
        <div
          key={i}
          className={`font-mono text-sm ${isVulnerable ? "bg-red-700/30" : ""} p-[1px]`}
        >
          <span className="text-gray-400">{i + 1}</span> {line}
        </div>
      );
    });

  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl border border-gray-700 shadow-lg space-y-3">
      <h2 className="text-lg font-bold flex items-center space-x-2">
        <span>Code Vulnerability Analyzer</span>
        <Bug className="w-4 h-4 text-red-400" />
      </h2>

      <textarea
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        disabled={running}
        placeholder="Paste your code here..."
        className="w-full p-2 rounded border border-gray-600 bg-gray-800 text-white text-sm focus:outline-none font-mono"
      />

      <button
        onClick={analyzeCode}
        disabled={running || !inputCode.trim()}
        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
      >
        {running ? <Loader2 className="animate-spin w-4 h-4 inline" /> : "Analyze & Improve"}
      </button>

      <div className="max-h-64 overflow-y-auto bg-gray-800 rounded p-2">
        {renderCodeWithHighlights()}
      </div>

      {testScripts && (
        <div className="mt-2 bg-gray-800 p-2 rounded">
          <h3 className="font-bold text-sm">Generated Test Scripts:</h3>
          <pre className="text-xs font-mono">{testScripts}</pre>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-1 mt-2">
        {logs.map((msg, i) => (
          <div key={i} className="text-xs font-mono">
            <strong>{msg.role}:</strong> <span>{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}