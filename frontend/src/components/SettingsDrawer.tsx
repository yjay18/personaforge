import { motion } from "framer-motion";
import { updateSettings } from "../lib/api";
import { getPersona } from "../lib/personas";

interface Props {
  temperature: number;
  maxTokens: number;
  creativityLevel: number;
  onTemperatureChange: (v: number) => void;
  onMaxTokensChange: (v: number) => void;
  onClose: () => void;
  persona: string;
}

export default function SettingsDrawer({
  temperature,
  maxTokens,
  creativityLevel,
  onTemperatureChange,
  onMaxTokensChange,
  onClose,
  persona,
}: Props) {
  const p = getPersona(persona);

  const handleSave = () => {
    updateSettings({ temperature, max_tokens: maxTokens }).catch(() => {});
    onClose();
  };

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-[320px] h-screen glass-panel border-l border-accent-500/10 flex flex-col relative z-20"
    >
      <div className="p-5 border-b border-accent-500/10 flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-gray-200">
          Settings
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Temperature */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-gray-400">Temperature</label>
            <span className="text-xs text-accent-400 font-mono">
              {temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            onChange={(e) => onTemperatureChange(Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, var(--accent-500) ${
                (temperature / 2) * 100
              }%, rgba(var(--accent-rgb),0.15) ${(temperature / 2) * 100}%)`,
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-600">Precise</span>
            <span className="text-[10px] text-gray-600">Creative</span>
          </div>
        </div>

        {/* Max tokens */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">
            Max Tokens
          </label>
          <input
            type="number"
            className="field text-sm"
            value={maxTokens}
            onChange={(e) => onMaxTokensChange(Number(e.target.value))}
            min={64}
            max={8192}
            step={64}
          />
        </div>

        {/* Personality Preview */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">
            Style at Level {creativityLevel}
          </label>
          <div className="glass-panel rounded-xl p-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              {p.promptPreviews[creativityLevel] || p.promptPreviews[3]}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-gray-600">Refusal chance:</span>
              <span className="text-[10px] font-mono text-accent-400">
                {creativityLevel * 10}%
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="glass-panel rounded-xl p-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Toggle Web Search in the sidebar to enable retrieval from DuckDuckGo.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-accent-500/10">
        <button onClick={handleSave} className="btn-primary w-full text-sm">
          Save &amp; Close
        </button>
      </div>
    </motion.div>
  );
}
