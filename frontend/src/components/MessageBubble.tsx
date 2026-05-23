import { useState, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import SearchResultsCard from "./SearchResultsCard";
import { ttsSpeak } from "../lib/api";
import type { Message } from "./ChatLayout";

interface Props {
  message: Message;
  index: number;
  persona: string;
}

export default function MessageBubble({ message, index, persona }: Props) {
  const isUser = message.role === "user";
  const isRefusal = message.type === "refusal" || message.refused;
  const [copied, setCopied] = useState(false);
  const [ttsState, setTtsState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTts = async () => {
    if (ttsState === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setTtsState("idle");
      return;
    }
    if (ttsState === "loading") return;
    setTtsState("loading");
    try {
      const blob = await ttsSpeak(message.content, persona);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setTtsState("idle");
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setTtsState("idle");
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      await audio.play();
      setTtsState("playing");
    } catch {
      setTtsState("idle");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.1) }}
      className={`group/msg flex ${isUser ? "justify-end" : "justify-start"} max-w-4xl mx-auto`}
    >
      <div
        className={`relative max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-gradient-to-br from-accent-600/80 to-accent-700/80 text-white ml-8"
            : isRefusal
            ? "glass-panel border-red-500/20 bg-red-900/10 mr-8"
            : "glass-panel mr-8"
        }`}
      >
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {!isUser && (
            <button
              onClick={handleTts}
              className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded transition-all ${
                ttsState !== "idle"
                  ? "opacity-100 bg-accent-500/20 text-accent-300"
                  : "opacity-0 group-hover/msg:opacity-60 hover:!opacity-100 bg-white/10 text-gray-400 hover:text-white"
              }`}
              title={ttsState === "playing" ? "Stop" : "Speak"}
              disabled={ttsState === "loading"}
            >
              {ttsState === "loading" ? "..." : ttsState === "playing" ? "stop" : "speak"}
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`text-xs px-1.5 py-0.5 rounded transition-all ${
              copied
                ? "opacity-100 bg-accent-500/20 text-accent-300"
                : "opacity-0 group-hover/msg:opacity-60 hover:!opacity-100 bg-white/10 text-gray-400 hover:text-white"
            }`}
            title="Copy"
          >
            {copied ? "copied!" : "copy"}
          </button>
        </div>

        {/* Refusal badge */}
        {isRefusal && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
              refused
            </span>
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <div className="message-content text-sm leading-relaxed whitespace-pre-wrap break-words pr-8 text-white">
            {message.content}
          </div>
        ) : (
          <div
            className={`message-content prose-chat text-sm leading-relaxed break-words pr-6 ${
              isRefusal ? "text-red-300/90" : "text-gray-200"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeStr = String(children).replace(/\n$/, "");

                  if (!match) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-white/8 text-accent-400 text-[12.5px] font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return <CodeBlock language={match[1]} code={codeStr} />;
                },
                pre({ children }) {
                  return <>{children}</>;
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold text-white mb-2 mt-3">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-bold text-white mb-2 mt-3">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-bold text-white mb-1 mt-2">{children}</h3>;
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-400 hover:text-accent-300 underline"
                    >
                      {children}
                    </a>
                  );
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-accent-500/30 pl-3 my-2 text-gray-400 italic">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-2">
                      <table className="min-w-full text-xs border-collapse">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border border-white/10 px-2 py-1 bg-white/5 text-left font-semibold text-gray-300">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border border-white/10 px-2 py-1 text-gray-400">{children}</td>
                  );
                },
                hr() {
                  return <hr className="border-white/10 my-3" />;
                },
                strong({ children }) {
                  return <strong className="font-semibold text-white">{children}</strong>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Search results */}
        {message.searchResults && message.searchResults.length > 0 && (
          <SearchResultsCard results={message.searchResults} />
        )}
      </div>
    </motion.div>
  );
}
