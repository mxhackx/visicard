"use client";

import { useState } from "react";
import CodeBlock from "@/components/code-block";

/** Exemples de code en onglets : un seul bloc visible à la fois, avec son bouton « Copier ». */
export default function CodeTabs({ tabs }: { tabs: { id: string; label: string; language: string; code: string }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div role="tablist" aria-label="Exemples" className="mb-4 flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${t.id === active ? "border-forest bg-forest text-white shadow-[0_8px_20px_rgba(227,5,29,0.25)]" : "border-line bg-white text-ink/75 hover:border-ink/30"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CodeBlock key={current.id} code={current.code} label={current.language} />
    </div>
  );
}
