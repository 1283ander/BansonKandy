import React from "react";
import { Mic, Volume2, Loader2, AlertCircle } from "lucide-react";
import { AppMode, ConnectionState } from "../types";

interface AudioVisualizerProps {
  connectionState: ConnectionState;
  userVolume: number;
  modelVolume: number;
  onToggleSession: () => void;
  mode: AppMode;
  langAName: string;
  langBName: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  connectionState,
  userVolume,
  modelVolume,
  onToggleSession,
  mode,
  langAName,
  langBName,
}) => {
  const isConnected =
    connectionState === "connected" ||
    connectionState === "speaking" ||
    connectionState === "translating";
  const isConnecting = connectionState === "connecting";
  const isModelSpeaking = connectionState === "translating" || modelVolume > 0.05;
  const isUserSpeaking = isConnected && !isModelSpeaking && userVolume > 0.03;

  // Audio volume scalar for subtle organic scaling
  const activeVol = isModelSpeaking ? modelVolume : isUserSpeaking ? userVolume : 0;
  const buttonScale = 1 + Math.min(0.12, activeVol * 0.2);
  const ring1Scale = 1 + activeVol * 0.15;
  const ring2Scale = 1 + activeVol * 0.25;
  const ring3Scale = 1 + activeVol * 0.35;

  return (
    <div className="relative flex flex-col items-center justify-center my-2 sm:my-6 w-full max-w-sm mx-auto">
      {/* Concentric Geometric Neutral Rings */}
      <div className="relative flex items-center justify-center w-[250px] h-[250px] xs:w-[280px] xs:h-[280px] sm:w-[340px] sm:h-[340px]">
        {/* Ring 3 (Outer) */}
        <div
          className="absolute w-[230px] h-[230px] xs:w-[260px] xs:h-[260px] sm:w-[320px] sm:h-[320px] border border-neutral-200/50 rounded-full transition-transform duration-100 ease-out pointer-events-none"
          style={{
            transform: `scale(${ring3Scale})`,
            borderColor: isModelSpeaking
              ? "rgba(217, 119, 6, 0.25)"
              : isUserSpeaking
              ? "rgba(16, 185, 129, 0.25)"
              : "rgba(229, 231, 235, 0.6)",
          }}
        />

        {/* Ring 2 (Middle) */}
        <div
          className="absolute w-[185px] h-[185px] xs:w-[210px] xs:h-[210px] sm:w-[260px] sm:h-[260px] border border-neutral-200/70 rounded-full transition-transform duration-100 ease-out pointer-events-none"
          style={{
            transform: `scale(${ring2Scale})`,
            borderColor: isModelSpeaking
              ? "rgba(217, 119, 6, 0.35)"
              : isUserSpeaking
              ? "rgba(16, 185, 129, 0.35)"
              : "rgba(229, 231, 235, 0.8)",
          }}
        />

        {/* Ring 1 (Inner) */}
        <div
          className="absolute w-[145px] h-[145px] xs:w-[165px] xs:h-[165px] sm:w-[200px] sm:h-[200px] border border-neutral-200 rounded-full transition-transform duration-100 ease-out pointer-events-none"
          style={{
            transform: `scale(${ring1Scale})`,
            borderColor: isModelSpeaking
              ? "rgba(217, 119, 6, 0.5)"
              : isUserSpeaking
              ? "rgba(16, 185, 129, 0.5)"
              : "rgba(229, 231, 235, 1)",
          }}
        />

        {/* Dynamic Connecting Rotation Ring */}
        {isConnecting && (
          <div className="absolute w-[155px] h-[155px] xs:w-[175px] xs:h-[175px] sm:w-[210px] sm:h-[210px] rounded-full border border-dashed border-neutral-400 animate-spin pointer-events-none" />
        )}

        {/* Central Minimal Main Action Button (Optimal Mobile Touch Size) */}
        <button
          id="main-voice-toggle-button"
          type="button"
          onClick={onToggleSession}
          disabled={isConnecting}
          style={{
            transform: `scale(${buttonScale})`,
          }}
          className={`group relative z-10 w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-[0_16px_40px_rgba(0,0,0,0.12)] active:scale-95 cursor-pointer select-none focus:outline-none touch-manipulation ${
            isConnected
              ? isModelSpeaking
                ? "bg-[#171717] text-amber-300 ring-2 ring-amber-500/40 shadow-[0_20px_50px_rgba(217,119,6,0.15)]"
                : "bg-[#111111] text-emerald-300 ring-2 ring-emerald-500/40 shadow-[0_20px_50px_rgba(16,185,129,0.15)]"
              : isConnecting
              ? "bg-[#262626] text-neutral-400"
              : connectionState === "error"
              ? "bg-[#171717] text-rose-400 ring-2 ring-rose-500/30"
              : "bg-[#111111] text-white hover:scale-[1.02]"
          }`}
          aria-label={
            isConnected
              ? "Stop voice translation session"
              : "Start voice translation session"
          }
        >
          {isConnecting ? (
            <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 animate-spin text-neutral-300 stroke-[1.25]" />
          ) : isConnected ? (
            isModelSpeaking ? (
              <Volume2 className="w-8 h-8 sm:w-9 sm:h-9 animate-pulse stroke-[1.25]" />
            ) : (
              <Mic className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.25]" />
            )
          ) : connectionState === "error" ? (
            <AlertCircle className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.25]" />
          ) : (
            <Mic className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.25] text-white" />
          )}

          <span className="mt-1.5 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase opacity-80">
            {isConnecting
              ? "Connecting"
              : isConnected
              ? isModelSpeaking
                ? "Speaking"
                : "Live"
              : connectionState === "error"
              ? "Retry"
              : "Tap to Start"}
          </span>
        </button>
      </div>

      {/* Typography and Status Section */}
      <div className="mt-3 sm:mt-5 text-center px-4">
        <h2 className="text-lg sm:text-xl font-medium tracking-tight text-neutral-900 leading-snug">
          {isConnected
            ? isModelSpeaking
              ? mode === "dual"
                ? "Translating Turn..."
                : `Translating to ${langBName}`
              : mode === "dual"
              ? `Listening: ${langAName} ⇄ ${langBName}`
              : `Listening to ${langAName}`
            : mode === "dual"
            ? "Dual-User Bilingual Mediator"
            : "Single-User Linguistic Mirror"}
        </h2>
        <p className="text-neutral-400 text-xs mt-1 leading-relaxed font-light">
          {isConnected
            ? mode === "dual"
              ? `Both speakers can talk freely. Turns translate automatically between ${langAName} and ${langBName}.`
              : `Exact linguistic register, dialect, and nuance preserved into ${langBName}.`
            : mode === "dual"
            ? "Two speakers converse seamlessly with real-time bidirectional translation."
            : "Speak directly in your native language with strict register preservation."}
        </p>
      </div>

      {/* Minimal Status Pill */}
      <div className="mt-2.5 flex items-center justify-center">
        <div
          id="status-indicator-pill"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-white border border-neutral-200 text-neutral-600 shadow-2xs"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected
                ? isModelSpeaking
                  ? "bg-amber-500 animate-ping"
                  : "bg-emerald-500"
                : isConnecting
                ? "bg-amber-400 animate-pulse"
                : connectionState === "error"
                ? "bg-rose-500"
                : "bg-neutral-300"
            }`}
          />
          <span className="text-neutral-500">
            {isConnected
              ? isModelSpeaking
                ? "Voice Synthesizing"
                : isUserSpeaking
                ? "Hearing Voice..."
                : "Continuous Live Session"
              : isConnecting
              ? "Connecting Live Session"
              : connectionState === "error"
              ? "Connection Error"
              : "Ready to Start"}
          </span>
        </div>
      </div>
    </div>
  );
};
