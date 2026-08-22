import React, { useState, useRef, useEffect } from "react";
import { TARGET_LANGUAGES, PRIMARY_LANGUAGES } from "../constants/languages";
import { ChevronDown, Search, X, Check, Globe } from "lucide-react";

interface LanguageSelectorProps {
  idPrefix?: string;
  label?: string;
  selectedLanguage: string;
  onSelectLanguage: (languageCode: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  idPrefix = "main",
  label = "Target Language",
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onSelectLanguage(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Primary Selector Trigger Button */}
      <button
        id={`${idPrefix}-language-selector-button`}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${
          compact ? "min-h-[42px] px-3.5 py-2 rounded-xl text-xs" : "min-h-[46px] px-4 py-2.5 rounded-2xl text-sm"
        } flex items-center justify-between font-medium transition-all duration-150 shadow-2xs border bg-white cursor-pointer active:scale-[0.99] touch-manipulation ${
          isOpen
            ? "border-neutral-900 text-neutral-900 ring-2 ring-neutral-900/10 shadow-sm"
            : "border-neutral-200 text-neutral-800 hover:border-neutral-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        aria-label={`Select ${label}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="text-lg sm:text-xl shrink-0 leading-none">{activeLang.flag}</span>
          <div className="text-left truncate">
            <span className="font-semibold text-neutral-900 block truncate leading-tight">
              {activeLang.name}
            </span>
            <span className="text-[10px] text-neutral-400 font-normal block truncate">
              {activeLang.nativeName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 pl-1.5">
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-neutral-900" : ""
            }`}
          />
        </div>
      </button>

      {/* Mobile-First Modal / Bottom-Sheet Dropdown */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div
            id={`${idPrefix}-language-dropdown-menu`}
            className="fixed sm:absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-full sm:mt-2 w-full sm:w-80 sm:right-0 sm:left-auto max-h-[85vh] sm:max-h-96 rounded-t-3xl sm:rounded-2xl bg-white border border-neutral-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-hidden"
          >
            {/* Sheet Handle for Mobile */}
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            {/* Header & Search */}
            <div className="p-3.5 border-b border-neutral-100 bg-neutral-50/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    {label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400" />
                <input
                  ref={searchInputRef}
                  id={`${idPrefix}-language-search-input`}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 shadow-2xs font-normal"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Language List */}
            <div className="overflow-y-auto p-2 space-y-3 max-h-[55vh] sm:max-h-64">
              {/* Featured Primary Languages */}
              {!searchQuery && (
                <div>
                  <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 flex items-center justify-between">
                    <span>Main Options</span>
                    <span className="text-[8px] bg-neutral-100 text-neutral-600 px-1 py-0.5 rounded font-semibold">
                      Featured
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {PRIMARY_LANGUAGES.map((lang) => {
                      const isSelected = lang.code === selectedLanguage;
                      return (
                        <button
                          key={`primary-${lang.code}`}
                          id={`${idPrefix}-primary-lang-${lang.code}`}
                          type="button"
                          onClick={() => handleSelect(lang.code)}
                          className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors touch-manipulation cursor-pointer ${
                            isSelected
                              ? "bg-neutral-900 text-white font-medium shadow-xs"
                              : "text-neutral-800 bg-neutral-50/60 hover:bg-neutral-100 border border-neutral-100/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg leading-none">{lang.flag}</span>
                            <div>
                              <span className={`text-xs block ${isSelected ? "text-white font-semibold" : "text-neutral-900"}`}>
                                {lang.name}
                              </span>
                              <span className={`text-[10px] block ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                                {lang.nativeName}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All / Filtered Languages */}
              <div>
                {!searchQuery && (
                  <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    All Languages
                  </div>
                )}
                <div className="mt-1 space-y-0.5">
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((lang) => {
                      const isSelected = lang.code === selectedLanguage;
                      return (
                        <button
                          key={lang.code}
                          id={`${idPrefix}-option-${lang.code}`}
                          type="button"
                          onClick={() => handleSelect(lang.code)}
                          className={`w-full min-h-[38px] flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-colors touch-manipulation cursor-pointer ${
                            isSelected
                              ? "bg-neutral-100 font-semibold text-neutral-900"
                              : "text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{lang.flag}</span>
                            <span className="text-xs">{lang.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-neutral-400 font-normal">
                              {lang.nativeName}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-neutral-900 shrink-0" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-center text-xs text-neutral-400">
                      No matching languages found for "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-4 sm:hidden bg-white shrink-0" />
          </div>
        </>
      )}
    </div>
  );
};
