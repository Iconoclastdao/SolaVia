import { PulseEngine } from '../lib/pulse-main-extended.mjs';
import { BookOpen } from 'lucide-react';
import { Brain } from 'lucide-react';
import { Bug } from 'lucide-react';
import { Code } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Globe } from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { Hammer } from 'lucide-react';
import { Lightbulb } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Palette } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { Users } from 'lucide-react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';
"use client";
// ---------- Types ----------
interface LogMessage {
  role: string;
  text: string;
}

interface ChatPulseProps {
  cycles?: number;
}

interface Agent {
  name: string;
  tasks: string[];
  execute: (task: string) => Promise<string>;
  autonomousIteration: (name: string) => Promise<void>;
}

interface AgentFactory {
  agents: Agent[];
  createAgent: (
    name: string,
    strategies: {
      execute_task: (task: string) => Promise<string>;
      autonomous_iteration: (agentName: string) => Promise<void>;
    }
  ) => Promise<Agent>;
  deployAgent: (
    agent: Agent,
    task: string,
    callback: (message: string) => void
  ) => Promise<void>;
}

// ---------- Main Component ----------
export default function ChatPulseComponent({ cycles = 2 }: ChatPulseProps) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [factoryVisible, setFactoryVisible] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [agentsList, setAgentsList] = useState<Agent[]>([]);

  const engineRef = useRef<PulseEngine | null>(null);
  const agentFactoryRef = useRef<AgentFactory | null>(null);

  // ---------- Setup Engine & Factory ----------
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new PulseEngine();
    }

    if (!agentFactoryRef.current) {
      agentFactoryRef.current = {
        agents: [],
        createAgent: async (name, strategies) => {
          const agent: Agent = {
            name,
            tasks: [],
            execute: strategies.execute_task,
            autonomousIteration: strategies.autonomous_iteration,
          };
          agentFactoryRef.current?.agents.push(agent);
          return agent;
        },
        deployAgent: async (agent, task, callback) => {
          callback(`Deploying agent ${agent.name} for task: ${task}`);
          const result = await agent.execute(task);
          callback(result);
          if (agent.autonomousIteration) {
            await agent.autonomousIteration(agent.name);
          }
        },
      };
    }
  }, []);

  const extractText = (res: any): string => {
    if (!res) return "";
    if (typeof res === "string") return res;
    if (res.output_text) return res.output_text;
    if (res.output) return res.output;
    return JSON.stringify(res);
  };

  // ---------- Run Chat ----------
  const runChat = async () => {
    if (!engineRef.current || !input.trim()) return;
    setRunning(true);
    setLogs([{ role: "User", text: input }]);

    const factory = agentFactoryRef.current;

    try {
      let context = input;

      // Run cycles through engine
      for (let i = 0; i < cycles; i++) {
        const res = await engineRef.current!.compute(context, i);
        const text = extractText(res);
        setLogs((prev) => [...prev, { role: `Cycle ${i + 1}`, text }]);
        context += " " + text;
      }

      // Deploy agents if any
      for (const agent of factory!.agents) {
        await factory!.deployAgent(agent, context, (msg) =>
          setLogs((prev) => [...prev, { role: agent.name, text: msg }])
        );
      }

      setLogs((prev) => [...prev, { role: "✅ Final Output", text: context }]);
    } catch (err: any) {
      setLogs((prev) => [...prev, { role: "Error", text: err.message || String(err) }]);
    } finally {
      setRunning(false);
      setInput("");
    }
  };

  // ---------- Render Tabs ----------
  const renderTabs = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
      {[
        { key: "chat", label: "Chat", icon: ShieldCheck },
        { key: "review", label: "Review Code", icon: Bug },
        { key: "think", label: "Brainstorm", icon: Lightbulb },
        { key: "builder", label: "Build Code", icon: Code },
        { key: "ip-generator", label: "Generate Ideas", icon: FileText },
        { key: "research-factory", label: "Research", icon: BookOpen },
        { key: "learning-companion", label: "Learn", icon: GraduationCap },
        { key: "expert-marketplace", label: "Experts", icon: Users },
        { key: "creative-lab", label: "Creative Lab", icon: Palette },
        { key: "decision-engine", label: "Decide", icon: Brain },
        { key: "simulation-sandbox", label: "Simulate", icon: Globe },
        { key: "product-designer", label: "Design", icon: Hammer },
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition
            ${
              activeTab === key
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
        >
          <Icon className="w-4 h-4 mr-1" /> {label}
        </button>
      ))}
    </div>
  );

  // ---------- Render Agent Factory ----------
  const renderAgentFactory = () => (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
      <h3 className="text-sm font-semibold text-green-400 flex justify-between items-center">
        Helpers
        <button
          onClick={() => setFactoryVisible(!factoryVisible)}
          className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 hover:bg-gray-600"
        >
          {factoryVisible ? "Hide" : "Show"}
        </button>
      </h3>
      {factoryVisible && (
        <>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Helper name..."
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              className="flex-1 p-2 rounded bg-gray-900 border border-gray-600 text-xs focus:outline-none"
            />
            <button
              onClick={async () => {
                if (!agentFactoryRef.current || !newAgentName.trim()) return;
                const agent = await agentFactoryRef.current.createAgent(newAgentName, {
                  execute_task: async (task) => {
                    const res = await engineRef.current?.compute(task, 0);
                    return extractText(res);
                  },
                  autonomous_iteration: async (agentName) => {
                    setLogs((prev) => [...prev, { role: agentName, text: "Improving itself..." }]);
                  },
                });
                setAgentsList([...agentFactoryRef.current.agents]);
                setNewAgentName("");
              }}
              className="px-3 bg-green-600 hover:bg-green-700 rounded text-xs"
            >
              Add
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto mt-2 space-y-2">
            {agentsList.map((agent, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-xs bg-gray-900 p-2 rounded"
              >
                <span>
                  {agent.name} ({agent.tasks.length} tasks)
                </span>
                <button
                  onClick={async () => {
                    await agentFactoryRef.current?.deployAgent(agent, "Test Task", (msg) =>
                      setLogs((prev) => [...prev, { role: agent.name, text: msg }])
                    );
                    setAgentsList([...agentFactoryRef.current!.agents]);
                  }}
                  className="px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                >
                  Run Task
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-900 text-white rounded-xl border border-gray-700 shadow-xl space-y-4">
      <h2 className="text-xl font-bold flex items-center space-x-2">
        <ShieldCheck className="w-5 h-5 text-green-400" />
        <span>Pulse Playground</span>
      </h2>

      {renderTabs()}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={running}
        placeholder="Type your task or prompt..."
        className="w-full p-3 rounded border border-gray-600 bg-gray-800 text-white text-sm focus:outline-none"
      />
      <button
        onClick={runChat}
        disabled={running || !input.trim()}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
      >
        {running ? <Loader2 className="animate-spin w-4 h-4 inline mr-1" /> : "Run"}
      </button>

      {renderAgentFactory()}

      <div className="max-h-96 overflow-y-auto space-y-2 text-xs bg-gray-800 p-3 rounded-lg">
        {logs.map((msg, i) => (
          <div key={i}>
            <span className="font-semibold text-blue-300">{msg.role}:</span>{" "}
            <span className="text-gray-200">{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}