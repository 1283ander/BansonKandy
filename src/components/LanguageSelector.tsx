import React, { useState, useRef, useEffect } from "react";
import { TARGET_LANGUAGES } from "../constants/languages";
import { ChevronDown, Search } from "lucide-react";
import { LanguageOption } from "../types";

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (languageCode: string) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang =
    TARGET_LANGUAGES.find((l) => l.code === selectedLanguage) || TARGET_LANGUAGES[0];

  const filteredLanguages = TARGET_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="language-selector-button"
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-3 px-7 py-3 rounded-full text-sm font-medium transition-all duration-150 shadow-xs border bg-white min-w-[280px] sm:min-w-[320px] ${
          isOpen
            ? "border-neutral-900 text-neutral-900 ring-1 ring-neutral-900"
            : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base leading-none">{activeLang.flag}</span>
          <span className="text-neutral-800 font-medium">{activeLang.name}</span>
          <span className="text-xs text-neutral-400 font-normal">({activeLang.nativeName})</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-neutral-800" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-80 max-h-80 overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-50 flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="p-3 border-b border-neutral-100 bg-neutral-50/70">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400" />
              <input
                id="language-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-56 p-1.5 space-y-0.5">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang: LanguageOption) => {
                const isSelected = lang.code === selectedLanguage;
                return (
                  <button
                    key={lang.code}
                    id={`language-option-${lang.code}`}
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-colors ${
                      isSelected
                        ? "bg-neutral-100 font-semibold text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-normal">
                      {lang.nativeName}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-neutral-400">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
