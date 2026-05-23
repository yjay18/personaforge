import { motion } from "framer-motion";
import { useMemo } from "react";
import { getPersona } from "../lib/personas";

interface Props {
  persona: string;
}

export default function TypingIndicator({ persona }: Props) {
  const p = getPersona(persona);
  const message = useMemo(
    () => p.typingMessages[Math.floor(Math.random() * p.typingMessages.length)],
    [persona]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start max-w-4xl mx-auto"
    >
      <div className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-3 mr-8">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -6, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-2 h-2 rounded-full bg-accent-500"
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">{message}</span>
      </div>
    </motion.div>
  );
}
