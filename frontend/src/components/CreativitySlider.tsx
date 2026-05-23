import { motion } from "framer-motion";
import { getPersona } from "../lib/personas";

interface Props {
  value: number;
  onChange: (v: number) => void;
  persona: string;
}

export default function CreativitySlider({ value, onChange, persona }: Props) {
  const p = getPersona(persona);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{p.sliderName}</span>
        <motion.span
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-bold text-accent-400"
        >
          {value}
        </motion.span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, var(--accent-500) ${
            ((value - 1) / 9) * 100
          }%, rgba(var(--accent-rgb),0.15) ${((value - 1) / 9) * 100}%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-600">1</span>
        <motion.span
          key={`${persona}-${value}`}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-[10px] text-accent-500/70"
        >
          {p.sliderLabels[value]}
        </motion.span>
        <span className="text-[10px] text-gray-600">10</span>
      </div>
    </div>
  );
}
