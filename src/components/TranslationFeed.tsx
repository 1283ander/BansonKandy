import React from "react";
import { TranslationTurn } from "../types";
import { Trash2 } from "lucide-react";

interface TranslationFeedProps {
  translations: TranslationTurn[];
  currentModelTurnText: string;
  targetLanguageName: string;
  onClear: () => void;
}

export const TranslationFeed: React.FC<TranslationFeedProps> = ({
  translations,
  currentModelTurnText,
  targetLanguageName,
  onClear,
}) => {
  const hasContent = translations.length > 0 || currentModelTurnText.length > 0;

  return (
    <div className="w-full max-w-md mx-auto mt-6 px-4">
      {/* Header Info / Clear */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
          Live Translation Stream
        </span>
        {hasContent && (
          <button
            id="clear-feed-button"
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3 stroke-[1.5]" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Content Container */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 min-h-[110px] max-h-56 overflow-y-auto space-y-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-20 text-center text-neutral-400 text-xs px-2">
            <p className="font-light text-neutral-600">
              Awaiting conversational speech
            </p>
            <p className="mt-1 text-[11px] text-neutral-400 font-light leading-relaxed max-w-xs">
              English speech translates to {targetLanguageName}. Foreign speech translates to English.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {translations.map((turn) => (
              <div
                key={turn.id}
                className="flex flex-col p-3 rounded-xl bg-neutral-50/80 border border-neutral-100 text-xs"
              >
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1">
                  <span>Translation</span>
                  <span>
                    {turn.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-neutral-900 font-normal text-xs sm:text-sm leading-relaxed">
                  {turn.text}
                </p>
              </div>
            ))}

            {/* Current Active Streaming Turn */}
            {currentModelTurnText && (
              <div className="flex flex-col p-3 rounded-xl bg-neutral-900 text-white text-xs animate-pulse">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1">
                  <span className="text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Vocalizing
                  </span>
                </div>
                <p className="text-white font-normal text-xs sm:text-sm leading-relaxed">
                  {currentModelTurnText}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
