const baseUrl = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8123";

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

// Status
export const getStatus = () => request("/api/status");

// Models
export const getModels = () => request("/api/models");

// Settings
export const getSettings = () => request("/api/settings");
export const updateSettings = (payload: any) =>
  request("/api/settings", { method: "POST", body: JSON.stringify(payload) });

// Personas
export const getPersonas = () => request("/api/personas");

// Chat (non-streaming)
export const sendChat = (payload: {
  message: string;
  model: string;
  history: { role: string; content: string }[];
  creativity_level: number;
  web_search: boolean;
  conversation_id: string;
  persona: string;
}) => request("/api/chat", { method: "POST", body: JSON.stringify(payload) });

// Chat (streaming) - returns raw Response for SSE
export async function streamChat(payload: {
  message: string;
  model: string;
  history: { role: string; content: string }[];
  creativity_level: number;
  web_search: boolean;
  conversation_id: string;
  persona: string;
}): Promise<Response> {
  return fetch(`${baseUrl}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// TTS
export async function ttsSpeak(text: string, persona: string): Promise<Blob> {
  const resp = await fetch(`${baseUrl}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, persona }),
  });
  if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`);
  return resp.blob();
}

// Conversations
export const getConversations = () => request("/api/conversations");
export const createConversation = () =>
  request("/api/conversations", { method: "POST" });
export const getConversationMessages = (id: string) =>
  request(`/api/conversations/${id}/messages`);
export const deleteConversation = (id: string) =>
  request(`/api/conversations/${id}`, { method: "DELETE" });
export const updateConversation = (id: string, payload: any) =>
  request(`/api/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
