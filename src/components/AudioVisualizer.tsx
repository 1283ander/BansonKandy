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
  const buttonScale = 1 + Math.min(0.12, activeVol * 0.2);
  const ring1Scale = 1 + activeVol * 0.15;
  const ring2Scale = 1 + activeVol * 0.25;
  const ring3Scale = 1 + activeVol * 0.35;

  return (
    <div className="relative flex flex-col items-center justify-center my-3 sm:my-8 w-full max-w-sm mx-auto">
      {/* Concentric Geometric Neutral Rings */}
      <div className="relative flex items-center justify-center w-[270px] h-[270px] xs:w-[300px] xs:h-[300px] sm:w-[380px] sm:h-[380px]">
        {/* Ring 3 (Outer) */}
        <div
          className="absolute w-[250px] h-[250px] xs:w-[280px] xs:h-[280px] sm:w-[360px] sm:h-[360px] border border-neutral-200/50 rounded-full transition-transform duration-100 ease-out pointer-events-none"
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
          className="absolute w-[200px] h-[200px] xs:w-[225px] xs:h-[225px] sm:w-[290px] sm:h-[290px] border border-neutral-200/70 rounded-full transition-transform duration-100 ease-out pointer-events-none"
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
          className="absolute w-[155px] h-[155px] xs:w-[175px] xs:h-[175px] sm:w-[220px] sm:h-[220px] border border-neutral-200 rounded-full transition-transform duration-100 ease-out pointer-events-none"
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
          <div className="absolute w-[165px] h-[165px] xs:w-[185px] xs:h-[185px] sm:w-[230px] sm:h-[230px] rounded-full border border-dashed border-neutral-400 animate-spin pointer-events-none" />
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
          className={`group relative z-10 w-32 h-32 xs:w-36 xs:h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-[0_16px_40px_rgba(0,0,0,0.12)] active:scale-95 cursor-pointer select-none focus:outline-none touch-manipulation ${
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
            <Loader2 className="w-9 h-9 sm:w-10 sm:h-10 animate-spin text-neutral-300 stroke-[1.25]" />
          ) : isConnected ? (
            isModelSpeaking ? (
              <Volume2 className="w-9 h-9 sm:w-10 sm:h-10 animate-pulse stroke-[1.25]" />
            ) : (
              <Mic className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.25]" />
            )
          ) : connectionState === "error" ? (
            <AlertCircle className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.25]" />
          ) : (
            <Mic className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.25] text-white" />
          )}

          <span className="mt-2 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase opacity-75">
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
      <div className="mt-4 sm:mt-6 text-center px-4">
        <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-neutral-900 leading-snug">
          {isConnected
            ? isModelSpeaking
              ? `Translating to ${targetLanguageName}`
              : "Live & Listening"
            : "Live Voice Translator"}
        </h2>
        <p className="text-neutral-400 text-xs mt-1 sm:mt-1.5 leading-relaxed font-light">
          {isConnected
            ? isModelSpeaking
              ? "Voice synthesized naturally with matched prosody"
              : "Speak in English or your target language"
            : "Natural bidirectional conversational translation"}
        </p>
      </div>

      {/* Minimal Status Pill */}
      <div className="mt-3 flex items-center justify-center">
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
                ? "Translating Voice"
                : isUserSpeaking
                ? "Listening..."
                : "Listening continuously"
              : isConnecting
              ? "Connecting Live Session"
              : connectionState === "error"
              ? "Connection Error"
              : "Ready to Stream"}
          </span>
        </div>
      </div>
    </div>
  );
};
