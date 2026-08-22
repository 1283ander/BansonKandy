import React, { useEffect, useRef } from "react";
import { TranslationTurn, ConnectionState } from "../types";
import { Sparkles, Copy, Check, Volume2 } from "lucide-react";

interface ConversationCanvasProps {
  translations: TranslationTurn[];
  currentModelTurnText: string;
  targetLanguageName: string;
  connectionState: ConnectionState;
  selectedVoice: string;
  onClear: () => void;
}

export const ConversationCanvas: React.FC<ConversationCanvasProps> = ({
  translations,
  currentModelTurnText,
  targetLanguageName,
  connectionState,
  selectedVoice,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const isConnected =
    connectionState === "connected" ||
    connectionState === "speaking" ||
    connectionState === "translating";

  const isTranslating = connectionState === "translating" || Boolean(currentModelTurnText);

  // Auto-scroll to latest translation turn
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [translations, currentModelTurnText]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasMessages = translations.length > 0 || Boolean(currentModelTurnText);

  return (
    <div
      id="conversation-canvas"
      className="flex-1 w-full max-w-2xl mx-auto flex flex-col justify-start overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
    >
      {!hasMessages ? (
        // Clean Minimalist Idle State (Apple / Anthropic Style)
        <div className="flex-1 flex flex-col items-center justify-center text-center my-auto min-h-[320px] px-6 select-none animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4 shadow-2xs">
            <Sparkles className="w-6 h-6 stroke-[1.5]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-900 leading-snug">
            {isConnected
              ? "Listening continuously..."
              : "Tap the microphone to begin"}
          </h2>

          <p className="mt-2 text-sm text-neutral-500 max-w-sm font-normal leading-relaxed">
            {isConnected
              ? `Speak naturally in English or ${targetLanguageName}. Translations vocalize in real time.`
              : `Bidirectional conversation in English and ${targetLanguageName}.`}
          </p>

          {/* Active Listening Indicator */}
          {isConnected && (
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Voice streaming ready</span>
            </div>
          )}
        </div>
      ) : (
        // Active Conversational Bubbles Feed
        <div className="space-y-4 py-2">
          {translations.map((turn, index) => {
            const isLatest = index === translations.length - 1 && !currentModelTurnText;
            const isCopied = copiedId === turn.id;

            return (
              <div
                key={turn.id}
                id={`translation-turn-${turn.id}`}
                className="group relative flex flex-col p-4 sm:p-5 rounded-2xl bg-white shadow-xs transition-all animate-in slide-in-from-bottom-2 duration-200"
              >
                {/* Header Metadata */}
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-700">
                      {targetLanguageName}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {turn.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Actions (Copy / Replay status) */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopy(turn.id, turn.text)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Copy translated text"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Translated Text */}
                <p className="text-base sm:text-lg font-normal text-neutral-900 leading-relaxed break-words">
                  {turn.text}
                </p>

                {/* Subtle Voice Attribution */}
                <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3 h-3 text-neutral-400" />
                    <span>Voice: {selectedVoice}</span>
                  </span>
                  {isLatest && (
                    <span className="text-neutral-400 font-medium">Delivered</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Active Streaming Model Turn (Live Vocalizing State) */}
          {currentModelTurnText && (
            <div
              id="live-streaming-turn"
              className="p-4 sm:p-5 rounded-2xl bg-neutral-900 text-white shadow-md animate-in slide-in-from-bottom-2 duration-150"
            >
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Speaking ({targetLanguageName})
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400">Live</span>
              </div>

              <p className="text-base sm:text-lg font-normal text-white leading-relaxed">
                {currentModelTurnText}
              </p>
            </div>
          )}

          <div ref={bottomRef} className="h-2" />
        </div>
      )}
    </div>
  );
};
