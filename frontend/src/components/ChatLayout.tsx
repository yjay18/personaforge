import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatSidebar from "./ChatSidebar";
import ChatMain from "./ChatMain";
import SettingsDrawer from "./SettingsDrawer";
import AmbientBackground from "./AmbientBackground";
import {
  getModels,
  getSettings,
  getConversations,
  streamChat,
  updateConversation,
  updateSettings,
} from "../lib/api";
import { DEFAULT_PERSONA_ID, getPersona } from "../lib/personas";

export interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "refusal" | "search";

  searchResults?: any[];
  refused?: boolean;
}

export interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  persona?: string;
}

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [creativityLevel, setCreativityLevel] = useState(3);
  const [webSearch, setWebSearch] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentConvId, setCurrentConvId] = useState(() => crypto.randomUUID());
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [persona, setPersona] = useState(DEFAULT_PERSONA_ID);
  const streamAbort = useRef<AbortController | null>(null);

  // Persona config is consumed by ChatSidebar/ChatMain/etc via props.
  void getPersona(persona);

  useEffect(() => {
    getModels()
      .then((data: any) => {
        const names = (data.models || []).map((m: any) => m.name);
        setModels(names);
        if (names.length > 0) {
          getSettings().then((s: any) => {
            if (s.default_model && names.includes(s.default_model)) {
              setSelectedModel(s.default_model);
            } else {
              setSelectedModel(names[0]);
            }
            setCreativityLevel(s.creativity_level ?? 3);
            setWebSearch(s.web_search_enabled ?? false);
            setTemperature(s.temperature ?? 0.7);
            setMaxTokens(s.max_tokens ?? 1024);
            if (s.persona) setPersona(s.persona);
          });
        }
      })
      .catch(() => {});

    loadConversations();
  }, []);

  const loadConversations = () => {
    getConversations()
      .then((data: any) => setConversations(data.conversations || []))
      .catch(() => {});
  };

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConvId(crypto.randomUUID());
  }, []);

  const handlePersonaChange = useCallback((id: string) => {
    setPersona(id);
    updateSettings({ persona: id }).catch(() => {});
    // Start a new chat when switching persona
    setMessages([]);
    setCurrentConvId(crypto.randomUUID());
  }, []);

  const handleSelectConversation = useCallback(async (id: string) => {
    setCurrentConvId(id);
    try {
      const resp = await fetch(`http://127.0.0.1:8123/api/conversations/${id}/messages`);
      const data = await resp.json();
      const msgs: Message[] = (data.messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
        type: m.message_type || "text",
        searchResults: m.search_results ? JSON.parse(m.search_results) : undefined,
        refused: m.refused,
      }));
      setMessages(msgs);
      // Restore persona from conversation
      if (data.persona) {
        setPersona(data.persona);
      }
    } catch {
      setMessages([]);
    }
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = { role: "user", content: text };
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
        refused: m.refused || false,
        type: m.type || "text",
      }));
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const assistantMsg: Message = { role: "assistant", content: "", type: "text" };
      setMessages((prev) => [...prev, assistantMsg]);

      const controller = new AbortController();
      streamAbort.current = controller;

      try {
        const resp = await streamChat({
          message: text,
          model: selectedModel,
          history,
          creativity_level: creativityLevel,
          web_search: webSearch,
          conversation_id: currentConvId,
          persona,
        });

        const reader = resp.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let searchResults: any[] | undefined;
        let refused = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.search_results) {
                searchResults = parsed.search_results;
              }
              if (parsed.refused) {
                refused = true;
              }
              if (parsed.token) {
                fullText += parsed.token;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: fullText,
                    type: refused ? "refusal" : "text",
                    searchResults,
                    refused,
                  };
                  return next;
                });
              }
            } catch {}
          }
        }

        // Final update
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: fullText || "(no response)",
            type: refused ? "refusal" : "text",
            searchResults,
            refused,
          };
          return next;
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: `Connection error: ${err.message}`,
              type: "text",
            };
            return next;
          });
        }
      }

      setIsLoading(false);
      streamAbort.current = null;
      loadConversations();
      setTimeout(loadConversations, 3000);
    },
    [messages, isLoading, selectedModel, creativityLevel, webSearch, currentConvId, persona]
  );

  return (
    <div className="app-shell h-screen flex overflow-hidden relative" data-persona={persona}>
      <AmbientBackground intensity={creativityLevel} />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-20"
          >
            <ChatSidebar
              conversations={conversations}
              currentConvId={currentConvId}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={async (id) => {
                await fetch(`http://127.0.0.1:8123/api/conversations/${id}`, { method: "DELETE" });
                if (id === currentConvId) handleNewChat();
                loadConversations();
              }}
              onRenameConversation={async (id, title) => {
                await updateConversation(id, { title });
                loadConversations();
              }}
              creativityLevel={creativityLevel}
              onCreativityChange={setCreativityLevel}
              webSearch={webSearch}
              onWebSearchChange={setWebSearch}
              models={models}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onToggleSettings={() => setShowSettings((v) => !v)}
              persona={persona}
              onPersonaChange={handlePersonaChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ChatMain
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
        creativityLevel={creativityLevel}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        selectedModel={selectedModel}
        persona={persona}
      />

      <AnimatePresence>
        {showSettings && (
          <SettingsDrawer
            temperature={temperature}
            maxTokens={maxTokens}
            creativityLevel={creativityLevel}
            onTemperatureChange={setTemperature}
            onMaxTokensChange={setMaxTokens}
            onClose={() => setShowSettings(false)}
            persona={persona}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
