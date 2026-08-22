import React from "react";
import { Mic, Loader2, Keyboard, Trash2, SlidersHorizontal, Square, Volume2 } from "lucide-react";
import { ConnectionState } from "../types";

interface ControlDeckProps {
  connectionState: ConnectionState;
  userVolume: number;
  modelVolume: number;
  onToggleSession: () => void;
  onOpenKeyboard: () => void;
  onOpenSettings: () => void;
  onClearHistory: () => void;
  hasHistory: boolean;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  connectionState,
  userVolume,
  modelVolume,
  onToggleSession,
  onOpenKeyboard,
  onOpenSettings,
  onClearHistory,
  hasHistory,
}) => {
  const isConnected =
    connectionState === "connected" ||
    connectionState === "speaking" ||
    connectionState === "translating";
  const isConnecting = connectionState === "connecting";
  const isModelSpeaking = connectionState === "translating" || modelVolume > 0.05;
  const isUserSpeaking = isConnected && !isModelSpeaking && userVolume > 0.03;

  return (
    <div className="w-full max-w-lg mx-auto px-6 pb-6 pt-2 flex flex-col items-center select-none shrink-0">
      {/* Control Dock Row */}
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left Secondary Action: Keyboard Input */}
        <div className="flex-1 flex justify-end">
          <button
            id="keyboard-mode-button"
            type="button"
            onClick={onOpenKeyboard}
            className="w-12 h-12 rounded-full bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer touch-manipulation"
            title="Text input translation"
            aria-label="Open text translation keyboard"
          >
            <Keyboard className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Center Primary Microphone Button (72px - 80px circular button) */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Active Outer Listening / Speaking Ripple Rings (Pure Tailwind) */}
          {isConnected && (
            <>
              <div
                className={`absolute w-24 h-24 rounded-full pointer-events-none transition-all duration-300 ${
                  isModelSpeaking
                    ? "bg-amber-400/20 animate-ping"
                    : isUserSpeaking
                    ? "bg-emerald-500/20 animate-pulse"
                    : "bg-neutral-900/10 animate-pulse"
                }`}
              />
              <div
                className={`absolute w-20 h-20 rounded-full ring-4 pointer-events-none transition-all ${
                  isModelSpeaking
                    ? "ring-amber-500/30"
                    : isUserSpeaking
                    ? "ring-emerald-500/30"
                    : "ring-neutral-400/20"
                }`}
              />
            </>
          )}

          {/* Primary Action Button */}
          <button
            id="primary-mic-button"
            type="button"
            onClick={onToggleSession}
            disabled={isConnecting}
            className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all duration-200 cursor-pointer touch-manipulation ${
              isConnected
                ? isModelSpeaking
                  ? "bg-neutral-900 text-amber-300"
                  : "bg-neutral-900 text-emerald-400"
                : isConnecting
                ? "bg-neutral-800 text-neutral-400"
                : "bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-xl"
            }`}
            aria-label={isConnected ? "Stop translating" : "Start voice translation"}
          >
            {isConnecting ? (
              <Loader2 className="w-8 h-8 animate-spin text-neutral-300 stroke-[1.5]" />
            ) : isConnected ? (
              isModelSpeaking ? (
                // 4-Bar Audio Waveform (Speaking)
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
                  <span className="w-1 h-6 bg-amber-400 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-4 bg-amber-400 rounded-full animate-pulse delay-150" />
                  <span className="w-1 h-2 bg-amber-400 rounded-full animate-pulse" />
                </div>
              ) : isUserSpeaking ? (
                // 4-Bar Audio Waveform (Listening to user)
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="w-1 h-6 bg-emerald-400 rounded-full animate-pulse delay-100" />
                  <span className="w-1 h-5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                </div>
              ) : (
                <Square className="w-6 h-6 fill-current stroke-none" />
              )
            ) : (
              <Mic className="w-8 h-8 stroke-[1.5]" />
            )}
          </button>
        </div>

        {/* Right Secondary Actions: Settings & Clear History */}
        <div className="flex-1 flex justify-start items-center gap-2">
          <button
            id="voice-style-settings-button"
            type="button"
            onClick={onOpenSettings}
            className="w-12 h-12 rounded-full bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer touch-manipulation"
            title="Voice & style settings"
            aria-label="Open voice and style settings"
          >
            <SlidersHorizontal className="w-5 h-5 stroke-[1.5]" />
          </button>

          {hasHistory && (
            <button
              id="clear-conversation-button"
              type="button"
              onClick={onClearHistory}
              className="w-12 h-12 rounded-full bg-white text-neutral-400 hover:text-rose-600 hover:bg-rose-50 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer touch-manipulation"
              title="Clear conversation"
              aria-label="Clear conversation history"
            >
              <Trash2 className="w-5 h-5 stroke-[1.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
