import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { getPersona } from "../lib/personas";
import type { Message } from "./ChatLayout";

interface Props {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
  creativityLevel: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedModel: string;
  persona: string;
}

export default function ChatMain({
  messages,
  isLoading,
  onSend,
  creativityLevel,
  sidebarOpen,
  onToggleSidebar,
  selectedModel,
  persona,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const p = getPersona(persona);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-screen relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-accent-500/10 bg-night/60 backdrop-blur-xl">
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-accent-400 transition-colors text-lg"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">
              {selectedModel || "no model"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-400 border border-accent-500/20">
              {p.sliderName} {creativityLevel}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          {messages.length > 0 ? `${messages.length} messages` : ""}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-display font-bold text-gradient mb-2"
            >
              {p.welcomeTitle}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-gray-500 text-sm max-w-md"
            >
              {p.welcomeSubtitle}
            </motion.p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} index={i} persona={persona} />
          ))}
        </AnimatePresence>

        {isLoading && messages.length > 0 && messages[messages.length - 1]?.content === "" && (
          <TypingIndicator persona={persona} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} isLoading={isLoading} persona={persona} />
    </div>
  );
}
