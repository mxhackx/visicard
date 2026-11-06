"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { searchPlaces, type Place } from "@/lib/geocode";

/**
 * Champ de recherche d'adresse : on tape quelques lettres (quartier, rue, établissement),
 * les propositions s'affichent, un clic remplit l'adresse et la position.
 */
export default function AddressSearch({
  onPick,
  placeholder = "Tapez un quartier, une rue ou le nom de votre établissement",
}: {
  onPick: (place: Place) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Saisie temporisée : une requête par pause de frappe, jamais une par lettre.
  useEffect(() => {
    if (query.trim().length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    const timer = window.setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then((list) => {
          setResults(list);
          setOpen(true);
          if (list.length === 0) setError("Aucune adresse trouvée : essayez un autre mot.");
        })
        .catch((err) => {
          if ((err as Error).name !== "AbortError") setError("Recherche indisponible. Saisissez l’adresse à la main.");
        })
        .finally(() => !controller.signal.aborted && setBusy(false));
    }, 600);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
        <input
          className="field pl-9 pr-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="address-results"
        />
        {busy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sage" />}
      </div>
      {open && results.length > 0 && (
        <ul id="address-results" role="listbox" className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-white shadow-[0_16px_40px_rgba(23,23,26,0.14)]">
          {results.map((p) => (
            <li key={`${p.lat},${p.lng}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onPick(p);
                  setQuery(p.label);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left text-sm text-ink/85 transition-colors hover:bg-cream"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                <span>{p.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && !open && <p className="mt-1.5 text-xs text-sage">{error}</p>}
    </div>
  );
}
