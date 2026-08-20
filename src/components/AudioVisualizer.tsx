import React from "react";
import { Mic, Volume2, Loader2, AlertCircle } from "lucide-react";
import { ConnectionState } from "../types";

interface AudioVisualizerProps {
  connectionState: ConnectionState;
  userVolume: number;
  modelVolume: number;
  onToggleSession: () => void;
  targetLanguageName: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  connectionState,
  userVolume,
  modelVolume,
  onToggleSession,
  targetLanguageName,
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
  const buttonScale = 1 + Math.min(0.15, activeVol * 0.25);
  const ring1Scale = 1 + activeVol * 0.18;
  const ring2Scale = 1 + activeVol * 0.28;
  const ring3Scale = 1 + activeVol * 0.38;

  return (
    <div className="relative flex flex-col items-center justify-center my-6 sm:my-10">
      {/* Concentric Geometric Neutral Rings */}
      <div className="relative flex items-center justify-center w-[340px] h-[340px] sm:w-[480px] sm:h-[480px]">
        {/* Ring 3 (Outer) */}
        <div
          className="absolute w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] border border-neutral-200/50 rounded-full transition-transform duration-100 ease-out pointer-events-none"
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
          className="absolute w-[250px] h-[250px] sm:w-[360px] sm:h-[360px] border border-neutral-200/70 rounded-full transition-transform duration-100 ease-out pointer-events-none"
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
          className="absolute w-[190px] h-[190px] sm:w-[260px] sm:h-[260px] border border-neutral-200 rounded-full transition-transform duration-100 ease-out pointer-events-none"
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
          <div className="absolute w-[200px] h-[200px] sm:w-[270px] sm:h-[270px] rounded-full border border-dashed border-neutral-400 animate-spin pointer-events-none" />
        )}

        {/* Central Clean Minimal Button */}
        <button
          id="main-voice-toggle-button"
          type="button"
          onClick={onToggleSession}
          disabled={isConnecting}
          style={{
            transform: `scale(${buttonScale})`,
          }}
          className={`group relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-[0_20px_50px_rgba(0,0,0,0.12)] active:scale-95 cursor-pointer select-none focus:outline-none ${
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
          {/* Subtle Outer Hover Pill Ring */}
          <div className="absolute inset-0 rounded-full border border-neutral-400 scale-125 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />

          {isConnecting ? (
            <Loader2 className="w-10 h-10 sm:w-11 sm:h-11 animate-spin text-neutral-300 stroke-[1.25]" />
          ) : isConnected ? (
            isModelSpeaking ? (
              <Volume2 className="w-10 h-10 sm:w-11 sm:h-11 animate-pulse stroke-[1.25]" />
            ) : (
              <Mic className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.25]" />
            )
          ) : connectionState === "error" ? (
            <AlertCircle className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.25]" />
          ) : (
            <Mic className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.25] text-white" />
          )}

          <span className="mt-2 text-[10px] font-bold tracking-[0.2em] uppercase opacity-75">
            {isConnecting
              ? "Syncing"
              : isConnected
              ? isModelSpeaking
                ? "Speaking"
                : "Live"
              : connectionState === "error"
              ? "Retry"
              : "Start"}
          </span>
        </button>
      </div>

      {/* Typography and Instructions Section */}
      <div className="mt-6 sm:mt-8 text-center max-w-sm px-4">
        <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-900">
          {isConnected
            ? isModelSpeaking
              ? `Translating to ${targetLanguageName}`
              : "Conversation Active"
            : "Start Conversation"}
        </h2>
        <p className="text-neutral-400 text-xs sm:text-sm mt-2 leading-relaxed font-light">
          {isConnected
            ? isModelSpeaking
              ? "Model is vocalizing translation in natural prosody."
              : "Speak in English or any foreign language anytime."
            : "High-fidelity real-time translation mirroring tone, intent, and nuance."}
        </p>
      </div>

      {/* Minimal Status Pill */}
      <div className="mt-4 flex items-center justify-center">
        <div
          id="status-indicator-pill"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-white border border-neutral-200 text-neutral-600 shadow-2xs"
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
                ? "Translating Voice"
                : isUserSpeaking
                ? "Listening to User"
                : "Continuous Live Link"
              : isConnecting
              ? "Establishing Live Session"
              : connectionState === "error"
              ? "Session Error"
              : "Ready to Stream"}
          </span>
        </div>
      </div>
    </div>
  );
};
