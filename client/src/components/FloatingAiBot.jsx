import React, { useState, useRef, useEffect } from "react";
import API from "../api/client";
import MarkdownContent from "./MarkdownContent";

export default function FloatingAiBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hi there! I'm **PrepAI**, your placement preparation copilot powered by Gemini. Ask me about interview practice questions for **Google, Amazon, Microsoft, TCS, Infosys, or Deloitte**.\n\nI can analyze your **areas of strength** and **areas of weakness**, recommend focus topics, and guide you straight to the right practice sheets!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExamMode, setIsExamMode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleExamMode(e) {
      setIsExamMode(!!e.detail?.active);
      if (e.detail?.active) {
        setIsOpen(false);
      }
    }
    window.addEventListener("exam-mode", handleExamMode);
    return () => window.removeEventListener("exam-mode", handleExamMode);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  if (isExamMode) return null;

  async function handleSend(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage = { sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await API.post("/ai/chat", {
        message: text,
        history: messages,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.data.reply,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I'm having a brief connection issue. You can continue practicing directly from the [Companies Directory](/companies) or your [Candidate Overview](/me).",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const promptSuggestions = [
    "Google interview practice questions",
    "What are my weakest areas and how do I fix them?",
    "Amazon SWE roadmap & high-yield topics",
    "Deloitte Management case interview tips",
  ];

  return (
    <>
      {/* Floating AI Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 rounded-full px-4 py-3 text-sm font-bold shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? "bg-neutral-900 text-white"
              : "bg-emerald-700 text-white hover:bg-emerald-800 shadow-emerald-900/20"
          }`}
          aria-label="Toggle PrepAI Assistant"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
            AI
          </span>
          <span className="font-semibold tracking-tight">
            {isOpen ? "Close AI" : "Ask PrepAI"}
          </span>
          {!isOpen && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-ping"></span>
          )}
        </button>
      </div>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 flex h-[580px] max-h-[calc(100vh-6.5rem)] w-[360px] sm:w-[420px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-sm shadow-xs font-bold">
                AI
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight leading-tight">
                  PrepAI Placement Copilot
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span>Gemini 3.1 Flash Powered</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      sender: "ai",
                      text: "Chat cleared! How can I help you prepare today?",
                    },
                  ])
                }
                title="Clear chat"
                className="rounded-lg p-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="rounded-lg p-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/60 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-2xs ${
                    m.sender === "user"
                      ? "bg-emerald-700 text-white rounded-br-xs"
                      : "bg-white text-neutral-800 border border-neutral-200/80 rounded-bl-xs"
                  }`}
                >
                  {m.sender === "ai" ? (
                    <MarkdownContent
                      text={m.text}
                      actionLinks
                      onInternalLinkClick={() => setIsOpen(false)}
                    />
                  ) : (
                    <span className="whitespace-pre-line">{m.text}</span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 rounded-2xl bg-white p-3 border border-neutral-200/80 max-w-[80%] shadow-2xs">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce"></span>
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-[11px] font-medium text-neutral-500">
                  PrepAI is analyzing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (shown when few messages) */}
          {messages.length <= 2 && (
            <div className="border-t border-neutral-100 bg-white p-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                Suggested Prompts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {promptSuggestions.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSend(prompt)}
                    className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="border-t border-neutral-200 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about companies, roles, practice sheets..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-3 text-white shadow-xs hover:bg-emerald-800 disabled:opacity-40 transition-colors"
                title="Send message"
              >
                Send
              </button>
            </form>
            <div className="mt-1.5 text-center text-[10px] text-neutral-400">
              Only placement & platform interview questions are supported.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
