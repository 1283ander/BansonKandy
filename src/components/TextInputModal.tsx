import React, { useState } from "react";
import { X, Send, Loader2, Copy, Check } from "lucide-react";
import { TARGET_LANGUAGES } from "../constants/languages";

interface TextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage: string;
  onAddTranslationTurn: (text: string) => void;
}

export const TextInputModal: React.FC<TextInputModalProps> = ({
  isOpen,
  onClose,
  targetLanguage,
  onAddTranslationTurn,
}) => {
  const [inputText, setInputText] = useState("");
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetLangObj =
    TARGET_LANGUAGES.find((l) => l.code === targetLanguage) || TARGET_LANGUAGES[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim(),
          targetLanguage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Translation failed (Status ${res.status})`);
      }

      const data = await res.json();
      const output = data.translatedText || "";
      setTranslatedResult(output);
      onAddTranslationTurn(output);
    } catch (err: any) {
      setError(err?.message || "Failed to translate text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        id="text-translation-modal"
        className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Drag Handle */}
        <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">
              Type to Translate
            </h3>
            <span className="text-xs text-neutral-400">
              → {targetLangObj.name}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTranslate} className="p-5 space-y-4">
          <div>
            <textarea
              id="text-translate-input"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTranslate();
                }
              }}
              placeholder={`Enter text in English or ${targetLangObj.name} (Press Enter to translate)...`}
              className="w-full p-3.5 text-sm bg-neutral-50 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-neutral-900 resize-none transition-all"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg">{error}</p>
          )}

          {translatedResult && (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Translation Result
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(translatedResult)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 shadow-2xs transition-colors cursor-pointer touch-manipulation"
                  title="Copy translated text"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-base text-neutral-900 leading-relaxed font-medium select-text cursor-text">
                {translatedResult}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-[11px] text-neutral-400 hidden xs:inline">
              Press <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono text-[10px]">Enter</kbd> to translate
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                id="submit-text-translate-btn"
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className={`px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                  !inputText.trim() || isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-neutral-800 active:scale-95"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <span>Translate</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
