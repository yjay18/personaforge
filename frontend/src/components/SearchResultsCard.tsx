import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
  source?: string;
}

interface Props {
  results: SearchResult[];
}

export default function SearchResultsCard({ results }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (!results.length) return null;

  return (
    <div className="mt-3 border-t border-secondary-500/15 pt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-xs text-purp-400 hover:text-purp-300 transition-colors"
      >
        <span className="uppercase tracking-wide text-[10px]">Sources</span>
        <span>
          {results.length}
        </span>
        <span className="text-[10px]">{expanded ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-secondary-500/5 border border-secondary-500/10 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-purp-400 hover:text-purp-300 transition-colors block truncate flex-1"
                    >
                      {r.title}
                    </a>
                    {r.source && (
                      <span className="text-[10px] text-gray-500 shrink-0">{r.source}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                    {r.snippet}
                  </p>
                  {r.date && (
                    <p className="text-[10px] text-gray-600 mt-1">{new Date(r.date).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
