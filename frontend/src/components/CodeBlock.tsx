import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  language: string;
  code: string;
}

export default function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-white/5 bg-[#1a1d23]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2a2d35] border-b border-white/5">
        <span className="text-[11px] text-gray-400 font-mono">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className={`text-[11px] px-2 py-0.5 rounded transition-all ${
            copied
              ? "text-accent-400 bg-accent-500/15"
              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
          }`}
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>

      {/* Code content */}
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "14px 16px",
          background: "transparent",
          fontSize: "12.5px",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: { fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace" },
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
