export interface PersonaConfig {
  id: string;
  name: string;
  tagline: string;
  sliderName: string;
  sliderLabels: Record<number, string>;
  promptPreviews: Record<number, string>;
  welcomeTitle: string;
  welcomeSubtitle: string;
  inputPlaceholder: string;
  inputLoadingPlaceholder: string;
  disclaimer: string;
  emptyHistory: string;
  typingMessages: string[];
}

export const PERSONAS: Record<string, PersonaConfig> = {
  assistant: {
    id: "assistant",
    name: "Assistant",
    tagline: "general-purpose helpful AI",
    sliderName: "Creativity",
    sliderLabels: {
      1: "Strict",
      2: "Focused",
      3: "Balanced",
      4: "Engaged",
      5: "Curious",
      6: "Exploratory",
      7: "Imaginative",
      8: "Inventive",
      9: "Bold",
      10: "Flowing",
    },
    promptPreviews: {
      1: "Tight, factual, no embellishment",
      2: "Clear, structured, minimal filler",
      3: "Friendly and complete with examples",
      4: "Conversational, light analogies",
      5: "Two-angle answers, small thought experiments",
      6: "Brings in adjacent ideas and alternatives",
      7: "Explores implications and edge cases",
      8: "Cross-domain free association, vivid framing",
      9: "Speculative, unconventional, flags uncertainty",
      10: "Peak creative flow — wide synthesis",
    },
    welcomeTitle: "Assistant",
    welcomeSubtitle:
      "A local AI chat assistant. Ask anything, toggle web search for fresh info, and slide creativity up or down to change how exploratory the responses get.",
    inputPlaceholder: "Ask anything…",
    inputLoadingPlaceholder: "Thinking…",
    disclaimer:
      "Assistant uses a local language model. Verify important details independently.",
    emptyHistory: "No conversations yet. Start a new chat to begin.",
    typingMessages: [
      "Thinking…",
      "Composing a response…",
      "One moment…",
      "Working on it…",
      "Drafting…",
    ],
  },
  tutor: {
    id: "tutor",
    name: "Tutor",
    tagline: "explains concepts step-by-step",
    sliderName: "Creativity",
    sliderLabels: {
      1: "Drill",
      2: "Concise",
      3: "Patient",
      4: "Structured",
      5: "Thoughtful",
      6: "Engaging",
      7: "Socratic",
      8: "Narrative",
      9: "Inventive",
      10: "Master Class",
    },
    promptPreviews: {
      1: "Answer first, one-line justification",
      2: "Definition, answer, one example",
      3: "3-4 short steps then a check-question",
      4: "Named parts, plain language, comprehension check",
      5: "Everyday analogy, intuition then formal definition",
      6: "Motivating question, vivid analogy, follow-ups",
      7: "Socratic chain of small prompts",
      8: "Narrative arc with cross-field metaphors",
      9: "Multiple framings of the same idea",
      10: "Concept as a doorway into wider ideas",
    },
    welcomeTitle: "Tutor",
    welcomeSubtitle:
      "Teaches concepts step-by-step. Pick a topic, set the creativity level for how Socratic or direct you want the explanation, and ask away.",
    inputPlaceholder: "What would you like to learn?",
    inputLoadingPlaceholder: "Preparing the lesson…",
    disclaimer:
      "Tutor uses a local language model. Cross-check key facts with primary sources.",
    emptyHistory: "No lessons yet. Ask a question to start.",
    typingMessages: [
      "Preparing an explanation…",
      "Choosing a clear example…",
      "Thinking it through…",
      "Drafting the lesson…",
    ],
  },
  thinker: {
    id: "thinker",
    name: "Thinker",
    tagline: "divergent ideation",
    sliderName: "Creativity",
    sliderLabels: {
      1: "Safe",
      2: "Practical",
      3: "Balanced",
      4: "Two-Bucket",
      5: "Lateral",
      6: "Divergent",
      7: "Bold",
      8: "Cross-Domain",
      9: "Provocative",
      10: "Wild",
    },
    promptPreviews: {
      1: "3-5 safe, well-trodden suggestions",
      2: "5 concrete options with brief reasoning",
      3: "Mix of obvious and slightly novel ideas",
      4: "Safe bets vs. worth exploring buckets",
      5: "Practical plus a few lateral angles",
      6: "Divergent across domains and constraints",
      7: "Reframes from technical/social/contrarian angles",
      8: "Cross-domain analogies (biology, games, art)",
      9: "Contrarian framings and second-order effects",
      10: "Sci-fi grade speculation, inverted assumptions",
    },
    welcomeTitle: "Thinker",
    welcomeSubtitle:
      "Divergent ideation. Describe a problem or goal, raise the creativity slider for wilder ideas, lower it for safe bets.",
    inputPlaceholder: "Describe what you want ideas for…",
    inputLoadingPlaceholder: "Generating options…",
    disclaimer:
      "Thinker suggests options for you to evaluate, not final answers. Sanity-check before acting.",
    emptyHistory: "No sessions yet. Drop a problem to get started.",
    typingMessages: [
      "Generating options…",
      "Riffing on the problem…",
      "Exploring angles…",
      "Drafting ideas…",
    ],
  },
};

export function getPersona(id: string): PersonaConfig {
  return PERSONAS[id] || PERSONAS.assistant;
}

export const PERSONA_IDS = Object.keys(PERSONAS);
export const DEFAULT_PERSONA_ID = "assistant";
