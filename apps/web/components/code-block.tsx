"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Bloc de code sombre avec barre de titre et bouton « Copier ». */
export default function CodeBlock({ code, label, className = "" }: { code: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* presse-papiers indisponible : rien à faire */
    }
  };
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] shadow-[0_18px_40px_-20px_rgba(23,23,26,0.55)] ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-xs font-medium text-white/55">{label}</span>
        </div>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white">
          {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {done ? "Copié" : "Copier"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap p-4 text-[12.5px] leading-6 text-white/90 [overflow-wrap:anywhere] sm:whitespace-pre sm:text-[13px] sm:[overflow-wrap:normal]"><code>{code}</code></pre>
    </div>
  );
}
