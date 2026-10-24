"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Mic, MicOff, Volume2, VolumeX, Sparkles, Loader2 } from "lucide-react";
import { useDeviceId } from "@/lib/deviceId";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatBoxProps {
  sessionId: string;
}

export function ChatBox({ sessionId }: ChatBoxProps) {
  const deviceId = useDeviceId();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Ask me anything about these notes! I can clarify complex formulas, explain derivations step-by-step, or generate additional memory mnemonics.",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Voice speech synthesis
  const readMessageAloud = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (activeSpeechId === id) {
      window.speechSynthesis.cancel();
      setActiveSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setActiveSpeechId(null);
    utterance.onerror = () => setActiveSpeechId(null);

    setActiveSpeechId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Browser speech recognition (Voice STT)
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your question.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !deviceId) return;

    const userQuestion = input.trim();
    setInput("");

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      content: userQuestion,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          question: userQuestion,
          deviceId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: data.answer,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const error = err as Error;
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          role: "assistant",
          content: `Sorry, I couldn't process that question: ${error.message || "Please try again."}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Ask Your Notes
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Grounded exclusively in this session&apos;s lecture content
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
          Gemma AI
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800 text-indigo-400 border border-white/10"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`group relative max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-white/[0.04] border border-white/10 text-slate-200 rounded-tl-sm"
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>

                {/* Read aloud toggle for assistant messages */}
                {!isUser && m.id !== "intro" && (
                  <button
                    type="button"
                    onClick={() => readMessageAloud(m.id, m.content)}
                    className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                  >
                    {activeSpeechId === m.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-rose-400" />
                        <span className="text-rose-400">Stop speech</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-slate-400" />
                        <span>Read aloud</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-slate-800 text-indigo-400 border border-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-sm p-3.5 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Checking your lecture notes...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          {/* Speech-to-text mic button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title={isListening ? "Listening... Speak now" : "Speak question (Voice STT)"}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-rose-400" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the notes..."
            disabled={isLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all ${
              !input.trim() || isLoading
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-indigo-500 hover:scale-105 cursor-pointer"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
