import React, { useState, useRef, useEffect, useMemo } from "react";
import { ArrowRightLeft, ChevronDown, Search, X, Check } from "lucide-react";
import { TARGET_LANGUAGES, PRIMARY_LANGUAGES } from "../constants/languages";

interface UnifiedLanguagePickerProps {
  targetLanguage: string;
  onSelectLanguage: (code: string) => void;
  disabled?: boolean;
}

export const UnifiedLanguagePicker: React.FC<UnifiedLanguagePickerProps> = ({
  targetLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeLang = useMemo(() => {
    return TARGET_LANGUAGES.find((l) => l.code === targetLanguage) || TARGET_LANGUAGES[0];
  }, [targetLanguage]);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return TARGET_LANGUAGES;
    return TARGET_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onSelectLanguage(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* Centered Minimal Language Switcher Pill */}
      <div className="inline-flex items-center gap-1.5 p-1 bg-neutral-100/90 rounded-full shadow-xs transition-all">
        {/* Source Language (Fixed English for Bidirectional Speech) */}
        <span
          id="source-language-badge"
          className="px-3 py-1.5 text-xs font-medium text-neutral-600 select-none"
        >
          English
        </span>

        {/* Bidirectional Arrow Icon */}
        <div className="w-5 h-5 flex items-center justify-center text-neutral-400 select-none">
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </div>

        {/* Target Language Dropdown Trigger */}
        <button
          id="target-language-picker-button"
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full bg-white text-xs font-semibold text-neutral-900 shadow-xs hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer touch-manipulation ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
          aria-label={`Current target language: ${activeLang.name}. Tap to change.`}
        >
          <span className="truncate max-w-[120px] sm:max-w-[160px]">
            {activeLang.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        </button>
      </div>

      {/* Clean iOS / Apple-Style Language Selection Sheet / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div
            id="language-picker-modal"
            className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] sm:max-h-[580px] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
          >
            {/* Sheet Drag Pill for Mobile */}
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="px-5 pt-3 pb-3 border-b border-neutral-100 shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-base font-semibold tracking-tight text-neutral-900">
                  Select Language
                </h3>
                <button
                  id="close-language-modal-btn"
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Minimal Search Bar (No flags, clean typography) */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-neutral-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  id="search-languages-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-neutral-100/80 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-neutral-100 focus:ring-1 focus:ring-neutral-900 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Language Options List */}
            <div className="overflow-y-auto p-3 flex-1 space-y-3">
              {/* Popular Languages (When no search query) */}
              {!searchQuery && (
                <div>
                  <span className="block px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Frequently Used
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {PRIMARY_LANGUAGES.map((lang) => {
                      const isSelected = lang.code === targetLanguage;
                      return (
                        <button
                          key={`pref-${lang.code}`}
                          id={`lang-option-${lang.code}`}
                          type="button"
                          onClick={() => handleSelect(lang.code)}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer touch-manipulation ${
                            isSelected
                              ? "bg-neutral-900 text-white"
                              : "text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100"
                          }`}
                        >
                          <div>
                            <span
                              className={`text-sm block ${
                                isSelected ? "font-semibold text-white" : "font-medium text-neutral-900"
                              }`}
                            >
                              {lang.name}
                            </span>
                            <span
                              className={`text-xs block ${
                                isSelected ? "text-neutral-300" : "text-neutral-400"
                              }`}
                            >
                              {lang.nativeName}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Supported Languages */}
              <div>
                {!searchQuery && (
                  <span className="block px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    All Languages
                  </span>
                )}
                <div className="mt-1 space-y-0.5">
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((lang) => {
                      const isSelected = lang.code === targetLanguage;
                      return (
                        <button
                          key={lang.code}
                          id={`lang-item-${lang.code}`}
                          type="button"
                          onClick={() => handleSelect(lang.code)}
                          className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer touch-manipulation ${
                            isSelected
                              ? "bg-neutral-100 text-neutral-900 font-semibold"
                              : "text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
                          }`}
                        >
                          <span className="text-sm font-medium">{lang.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400 font-normal">
                              {lang.nativeName}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-xs text-neutral-400">
                      No languages found for "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Safe Area Padding */}
            <div className="h-3 sm:h-2 shrink-0" />
          </div>
        </div>
      )}
    </>
  );
};
