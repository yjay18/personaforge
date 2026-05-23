import { motion } from "framer-motion";
import { PERSONA_IDS, getPersona } from "../lib/personas";

interface Props {
  current: string;
  onChange: (id: string) => void;
}

export default function PersonaSwitcher({ current, onChange }: Props) {
  return (
    <div className="flex gap-1.5 p-1 rounded-xl bg-white/5">
      {PERSONA_IDS.map((id) => {
        const p = getPersona(id);
        const active = id === current;
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(id)}
            className={`relative flex-1 flex items-center justify-center px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              active
                ? "bg-accent-500/20 text-accent-300 border border-accent-500/30"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
          >
            <span className="truncate">{p.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
