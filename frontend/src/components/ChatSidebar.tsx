import { useState } from "react";
import { motion } from "framer-motion";
import CreativitySlider from "./CreativitySlider";
import ModelSelector from "./ModelSelector";
import PersonaSwitcher from "./PersonaSwitcher";
import { getPersona } from "../lib/personas";
import type { ConversationItem } from "./ChatLayout";

interface Props {
  conversations: ConversationItem[];
  currentConvId: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  creativityLevel: number;
  onCreativityChange: (v: number) => void;
  webSearch: boolean;
  onWebSearchChange: (v: boolean) => void;
  models: string[];
  selectedModel: string;
  onModelChange: (v: string) => void;
  onToggleSettings: () => void;
  persona: string;
  onPersonaChange: (id: string) => void;
}

export default function ChatSidebar({
  conversations,
  currentConvId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  creativityLevel,
  onCreativityChange,
  webSearch,
  onWebSearchChange,
  models,
  selectedModel,
  onModelChange,
  onToggleSettings,
  persona,
  onPersonaChange,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const p = getPersona(persona);

  const startRename = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const submitRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitRename();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditTitle("");
    }
  };

  return (
    <div className="w-[280px] h-screen flex flex-col glass-panel border-r border-accent-500/10">
      {/* Brand */}
      <div className="p-5 border-b border-accent-500/10">
        <h1 className="text-xl font-display font-bold text-gradient">{p.name}</h1>
        <p className="text-xs text-accent-500/60 mt-0.5">{p.tagline}</p>
      </div>

      {/* Persona Switcher */}
      <div className="px-3 pt-3">
        <PersonaSwitcher current={persona} onChange={onPersonaChange} />
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <span>+</span>
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.map((conv) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-all text-sm ${
              conv.id === currentConvId
                ? "bg-accent-500/15 text-accent-300 border border-accent-500/20"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent"
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            {editingId === conv.id ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={submitRename}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="flex-1 bg-white/10 text-white text-sm px-1.5 py-0.5 rounded border border-accent-500/30 outline-none focus:border-accent-400/50 min-w-0"
              />
            ) : (
              <span
                className="flex-1 truncate"
                onDoubleClick={(e) => startRename(e, conv)}
              >
                {conv.title}
              </span>
            )}
            {editingId !== conv.id && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-60 transition-opacity">
                <button
                  onClick={(e) => startRename(e, conv)}
                  className="hover:!opacity-100 text-accent-400 text-[10px] uppercase tracking-wide"
                  title="Rename"
                >
                  edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="hover:!opacity-100 text-red-400 text-xs"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            )}
          </motion.div>
        ))}
        {conversations.length === 0 && (
          <p className="text-center text-gray-600 text-xs mt-8 px-4">
            {p.emptyHistory}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-accent-500/10 p-4 space-y-4">
        <CreativitySlider value={creativityLevel} onChange={onCreativityChange} persona={persona} />

        {/* Web Search Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Web Search</span>
          <button
            onClick={() => onWebSearchChange(!webSearch)}
            className={`w-10 h-5 rounded-full transition-all relative ${
              webSearch ? "bg-accent-500" : "bg-gray-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                webSearch ? "left-5.5 left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <ModelSelector
          models={models}
          selected={selectedModel}
          onChange={onModelChange}
        />

        <button
          onClick={onToggleSettings}
          className="btn-ghost w-full text-xs flex items-center justify-center"
        >
          Settings
        </button>
      </div>
    </div>
  );
}
