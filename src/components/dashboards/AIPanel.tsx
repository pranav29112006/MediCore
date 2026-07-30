import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BrainCircuit, Sparkles, Send, X, MessageSquare, Loader2,
  ChevronRight, Bot, User, Zap, AlertCircle, KeyRound, Check,
} from "lucide-react";
import { summarizePatient, chatWithAI, isGeminiConfigured, setGeminiApiKey, getGeminiApiKey } from "../../lib/gemini-service";
import type { PatientContext } from "../../lib/gemini-service";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-base mt-4 mb-2">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-2">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>')
    .replace(/⚠️/g, '<span class="text-amber-500">⚠️</span>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// ─── API Key Input ────────────────────────────────────────────────────────────

function ApiKeyInput({ onKeySet }: { onKeySet: () => void }) {
  const [keyInput, setKeyInput] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const key = keyInput.trim();
    if (key) {
      setGeminiApiKey(key);
      // Also save to localStorage for persistence across page reloads
      try { localStorage.setItem("medicore_gemini_key", key); } catch {}
      setSaved(true);
      onKeySet();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="size-3.5 text-violet-500" />
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
          Connect Gemini AI
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2.5">
        Enter your Google AI Studio API key to enable live AI responses.
        Get one at{" "}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-500 underline hover:text-violet-400"
        >
          aistudio.google.com
        </a>
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="Paste API key..."
          className="flex-1 px-3 py-1.5 text-xs bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-muted-foreground/40"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.95 }}
          disabled={!keyInput.trim()}
          className="px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          {saved ? <Check className="size-3" /> : <Zap className="size-3" />}
          {saved ? "Saved!" : "Connect"}
        </motion.button>
      </div>
    </div>
  );
}

// ─── AI Panel ─────────────────────────────────────────────────────────────────

export function AIPanel({
  patientContext,
  isOpen,
  onClose,
}: {
  patientContext: PatientContext;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [configured, setConfigured] = useState(isGeminiConfigured());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Try to restore API key from localStorage on mount
  useEffect(() => {
    if (!isGeminiConfigured()) {
      try {
        const savedKey = localStorage.getItem("medicore_gemini_key");
        if (savedKey) {
          setGeminiApiKey(savedKey);
          setConfigured(true);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, activeTab]);

  // Reset on patient change
  useEffect(() => {
    setSummary(null);
    setChatMessages([]);
    setChatInput("");
  }, [patientContext.patient.id]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizePatient(patientContext);
      setSummary(result);
    } catch (err) {
      setSummary("⚠️ Failed to generate summary. Please try again.");
    }
    setIsSummarizing(false);
  };

  const handleSendChat = async () => {
    const msg = chatInput.trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      const response = await chatWithAI(msg, patientContext, history);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: "⚠️ Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errMsg]);
    }
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const quickPrompts = [
    "What drug interactions should I watch for?",
    "Suggest discharge criteria for this patient",
    "Summarize the latest vitals trend",
    "Any alternative medications to consider?",
    "What follow-up tests are recommended?",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 z-[90] w-full max-w-md bg-background/95 backdrop-blur-2xl border-l border-border/50 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                <BrainCircuit className="size-5 text-violet-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Clinical Assistant</h3>
                <p className="text-[10px] text-muted-foreground">
                  Powered by Gemini AI{" "}
                  {configured ? (
                    <span className="text-emerald-500">● Connected</span>
                  ) : (
                    <span className="text-amber-500">● Offline Mode</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 p-2 mx-4 mt-3 bg-muted/50 rounded-xl">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "summary"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3.5" /> Summarize
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "chat"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="size-3.5" /> Chat
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "summary" ? (
              <div className="flex flex-col gap-4">
                {/* Patient Context Badge */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Analyzing:{" "}
                    <span className="font-semibold text-foreground">
                      {patientContext.patient.fullName}
                    </span>
                  </span>
                </div>

                {/* API Key Input (only show when not configured) */}
                {!configured && (
                  <ApiKeyInput onKeySet={() => setConfigured(true)} />
                )}

                {/* Summarize Button */}
                <motion.button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSummarizing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      ✨ Summarize Patient
                    </>
                  )}
                </motion.button>

                {/* Summary Result */}
                <AnimatePresence mode="wait">
                  {isSummarizing && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3 py-12"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                        <div className="relative p-3 rounded-full bg-violet-500/10">
                          <BrainCircuit className="size-6 text-violet-500 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground animate-pulse">
                        AI is analyzing patient data...
                      </p>
                    </motion.div>
                  )}

                  {summary && !isSummarizing && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="size-4 text-violet-500" />
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                          AI Clinical Summary
                        </span>
                      </div>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* API Key Input for chat tab too */}
                {!configured && (
                  <div className="mb-4">
                    <ApiKeyInput onKeySet={() => setConfigured(true)} />
                  </div>
                )}

                {/* Chat Messages */}
                <div className="flex-1 flex flex-col gap-3 mb-4">
                  {chatMessages.length === 0 && !isTyping && (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10">
                        <Bot className="size-8 text-violet-500/70" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">
                          Ask me about this patient
                        </p>
                        <p className="text-xs text-muted-foreground/70 max-w-xs">
                          I can help with medication interactions, treatment suggestions, dosage adjustments, and more.
                        </p>
                      </div>

                      {/* Quick Prompts */}
                      <div className="w-full flex flex-col gap-1.5 mt-2">
                        <p className="text-[10px] text-muted-foreground/50 uppercase font-semibold tracking-wider px-1">
                          Quick Prompts
                        </p>
                        {quickPrompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setChatInput(prompt);
                              setTimeout(() => inputRef.current?.focus(), 50);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                          >
                            <ChevronRight className="size-3 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          msg.role === "user"
                            ? "bg-primary/10"
                            : "bg-gradient-to-br from-violet-500/10 to-purple-600/10"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="size-3.5 text-primary" />
                        ) : (
                          <Bot className="size-3.5 text-violet-500" />
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted/50 border border-border/30 rounded-bl-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdown(msg.content),
                            }}
                          />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2.5"
                    >
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-600/10">
                        <Bot className="size-3.5 text-violet-500" />
                      </div>
                      <div className="p-3 rounded-xl rounded-bl-sm bg-muted/50 border border-border/30">
                        <div className="flex gap-1.5 items-center">
                          <div className="size-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms]" />
                          <div className="size-2 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
                          <div className="size-2 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input (only for chat tab) */}
          {activeTab === "chat" && (
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this patient..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-2.5 text-sm bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder:text-muted-foreground/50 disabled:opacity-60"
                />
                <motion.button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isTyping}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {isTyping ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── AI Panel Toggle Button ───────────────────────────────────────────────────

export function AIPanelButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
    >
      <BrainCircuit className="size-5" />
      <span>AI Assistant</span>
      <div className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
    </motion.button>
  );
}
