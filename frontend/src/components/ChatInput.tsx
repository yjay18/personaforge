import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { getPersona } from "../lib/personas";

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
  persona: string;
}

export default function ChatInput({ onSend, isLoading, persona }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const p = getPersona(persona);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [text]);

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSend(text);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="glass-panel rounded-2xl p-3 flex items-end gap-3 max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? p.inputLoadingPlaceholder : p.inputPlaceholder}
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-gray-200 text-sm placeholder-gray-600 font-body"
          style={{ minHeight: "24px", maxHeight: "160px" }}
        />
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              text.trim() && !isLoading
                ? "bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-glow cursor-pointer"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
              />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>
      <p className="text-center text-[10px] text-gray-700 mt-2">
        {p.disclaimer}
      </p>
    </div>
  );
}
