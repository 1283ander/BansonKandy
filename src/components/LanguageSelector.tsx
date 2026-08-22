import React, { useState, useRef, useEffect } from "react";
import { TARGET_LANGUAGES, PRIMARY_LANGUAGES } from "../constants/languages";
import { ChevronDown, Search, X, Check, Globe } from "lucide-react";
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
      // Auto focus search input when opened
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
    <div className="relative w-full max-w-sm mx-auto" ref={dropdownRef}>
      {/* Primary Selector Trigger Button (Optimized for Mobile Touch) */}
      <button
        id="language-selector-button"
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[48px] px-5 py-3 rounded-2xl flex items-center justify-between text-sm font-medium transition-all duration-150 shadow-xs border bg-white cursor-pointer active:scale-[0.99] touch-manipulation ${
          isOpen
            ? "border-neutral-900 text-neutral-900 ring-2 ring-neutral-900/10 shadow-md"
            : "border-neutral-200 text-neutral-800 hover:border-neutral-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        aria-label="Select target translation language"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-xl shrink-0 leading-none">{activeLang.flag}</span>
          <div className="text-left truncate">
            <span className="font-semibold text-neutral-900 block truncate leading-tight">
              {activeLang.name}
            </span>
            <span className="text-[11px] text-neutral-400 font-normal block truncate">
              {activeLang.nativeName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 hidden sm:inline">
            Change
          </span>
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
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
            id="language-dropdown-menu"
            className="fixed sm:absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-full sm:mt-2 w-full max-h-[85vh] sm:max-h-96 rounded-t-3xl sm:rounded-2xl bg-white border sm:border border-neutral-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-hidden"
          >
            {/* Sheet Handle for Mobile */}
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            {/* Header & Search */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/70">
              <div className="flex items-center justify-between mb-3 sm:hidden">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Select Target Language
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-neutral-400" />
                <input
                  ref={searchInputRef}
                  id="language-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search languages (e.g. Khmer, Thai, Spanish)..."
                  className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 shadow-2xs font-normal"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Language List */}
            <div className="overflow-y-auto p-2 space-y-4 max-h-[60vh] sm:max-h-72">
              {/* Primary Main Options Section (Always highlighted if no search query) */}
              {!searchQuery && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 flex items-center justify-between">
                    <span>Main Language Options</span>
                    <span className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-semibold">
                      Featured
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {PRIMARY_LANGUAGES.map((lang) => {
                      const isSelected = lang.code === selectedLanguage;
                      return (
                        <button
                          key={`primary-${lang.code}`}
                          id={`primary-lang-option-${lang.code}`}
                          type="button"
                          onClick={() => handleSelect(lang.code)}
                          className={`w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors touch-manipulation cursor-pointer ${
                            isSelected
                              ? "bg-neutral-900 text-white font-medium shadow-xs"
                              : "text-neutral-800 bg-neutral-50/60 hover:bg-neutral-100 border border-neutral-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl leading-none">{lang.flag}</span>
                            <div>
                              <span className={`text-sm block ${isSelected ? "text-white font-semibold" : "text-neutral-900"}`}>
                                {lang.name}
                              </span>
                              <span className={`text-xs block ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                                {lang.nativeName}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All / Filtered Languages Section */}
              <div>
                {!searchQuery && (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    All Supported Languages
                  </div>
                )}
                <div className="mt-1 space-y-0.5">
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((lang) => {
                      const isSelected = lang.code === selectedLanguage;
                      return (
                        <button
                          key={lang.code}
                          id={`language-option-${lang.code}`}
                          type="button"
                          onClick={() => handleSelect(lang.code)}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2 rounded-xl text-left transition-colors touch-manipulation cursor-pointer ${
                            isSelected
                              ? "bg-neutral-100 font-semibold text-neutral-900"
                              : "text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg leading-none">{lang.flag}</span>
                            <span className="text-xs sm:text-sm">{lang.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400 font-normal">
                              {lang.nativeName}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8 text-center text-xs text-neutral-400">
                      No matching languages found for "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Safe Area Padding for Mobile */}
            <div className="h-4 sm:hidden bg-white shrink-0" />
          </div>
        </>
      )}
    </div>
  );
};
