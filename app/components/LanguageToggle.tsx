"use client";

import { Languages } from "lucide-react";

interface LanguageToggleProps {
  language: "bn" | "en";
  onChange: (lang: "bn" | "en") => void;
  disabled?: boolean;
}

export function LanguageToggle({
  language,
  onChange,
  disabled = false,
}: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <Languages className="w-4 h-4 text-indigo-400" />
        <span>Language:</span>
      </div>
      <div className="inline-flex rounded-xl p-1 bg-white/5 border border-white/10 shadow-inner">
        <button
          type="button"
          onClick={() => onChange("bn")}
          disabled={disabled}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            language === "bn"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
              : "text-slate-400 hover:text-slate-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          বাংলা (Bangla)
        </button>
        <button
          type="button"
          onClick={() => onChange("en")}
          disabled={disabled}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            language === "en"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
              : "text-slate-400 hover:text-slate-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          English
        </button>
      </div>
    </div>
  );
}
