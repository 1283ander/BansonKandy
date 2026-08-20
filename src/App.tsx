import React, { useState } from "react";
import { useLiveAudio } from "./hooks/useLiveAudio";
import { LanguageSelector } from "./components/LanguageSelector";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { TranslationFeed } from "./components/TranslationFeed";
import { TARGET_LANGUAGES, PREBUILT_VOICES } from "./constants/languages";
import { Volume2, AlertTriangle, Check, FileText } from "lucide-react";

export default function App() {
  const [targetLanguage, setTargetLanguage] = useState<string>("es");
  const [selectedVoice, setSelectedVoice] = useState<string>("Zephyr");
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const {
    connectionState,
    errorMessage,
    userVolume,
    modelVolume,
    translations,
    currentModelTurnText,
    startSession,
    stopSession,
    updateTargetLanguage,
    updateVoice,
    clearHistory,
  } = useLiveAudio({
    targetLanguage,
    voice: selectedVoice,
  });

  const activeLangObj =
    TARGET_LANGUAGES.find((l) => l.code === targetLanguage) || TARGET_LANGUAGES[0];

  const handleLanguageChange = (newCode: string) => {
    setTargetLanguage(newCode);
    updateTargetLanguage(newCode);
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    updateVoice(voiceId);
    setShowVoiceSettings(false);
  };

  const handleToggleSession = () => {
    if (
      connectionState === "connected" ||
      connectionState === "speaking" ||
      connectionState === "translating"
    ) {
      stopSession();
    } else {
      startSession();
    }
  };

  const isLive =
    connectionState === "connected" ||
    connectionState === "speaking" ||
    connectionState === "translating";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] flex flex-col justify-between font-sans select-none antialiased">
      {/* Navigation Header */}
      <nav className="flex justify-between items-center px-6 sm:px-12 pt-6 sm:pt-10 max-w-7xl w-full mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center shadow-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900">
            Echo.Live
          </span>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Engine Status Badge */}
          <div className="flex items-center space-x-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive
                  ? "bg-emerald-500 animate-pulse"
                  : connectionState === "connecting"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-neutral-300"
              }`}
            />
            <span className="text-[10px] font-semibold uppercase tracking-tight text-neutral-400 hidden sm:inline">
              {isLive ? "Gemini Live Active" : "Gemini Engine Standby"}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-200" />

          {/* Voice Selector Toggle */}
          <div className="relative">
            <button
              id="voice-settings-button"
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer py-1"
            >
              <Volume2 className="w-3 h-3 opacity-60" />
              <span>Voice: {selectedVoice}</span>
            </button>

            {showVoiceSettings && (
              <div
                id="voice-settings-menu"
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200 shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 mb-1">
                  Select Output Voice
                </div>
                {PREBUILT_VOICES.map((v) => (
                  <button
                    key={v.id}
                    id={`voice-option-${v.id}`}
                    onClick={() => handleVoiceChange(v.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      selectedVoice === v.id
                        ? "bg-neutral-100 font-semibold text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-xs text-neutral-800">{v.name}</div>
                      <div className="text-[10px] text-neutral-400 font-normal">{v.description}</div>
                    </div>
                    {selectedVoice === v.id && (
                      <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-neutral-200" />

          {/* Interface Logs Toggle Button */}
          <button
            id="toggle-logs-button"
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className={`text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer py-1 ${
              showLogs ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <FileText className="w-3 h-3 opacity-60" />
            <span>{showLogs ? "Hide Stream" : "Stream Logs"}</span>
            {translations.length > 0 && (
              <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full ml-0.5" />
            )}
          </button>
        </div>
      </nav>

      {/* Main Focus Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl w-full mx-auto">
        {/* Direction Rule Badge */}
        <div className="mb-4 px-3.5 py-1 rounded-full border border-neutral-200/80 bg-white/80 text-[10px] font-medium tracking-wide uppercase text-neutral-400 flex items-center gap-2 shadow-2xs">
          <span className="text-neutral-700">English ➔ {activeLangObj.name}</span>
          <span className="text-neutral-200">|</span>
          <span className="text-neutral-700">Foreign ➔ English</span>
        </div>

        {/* Central Geometric Concentric Visualizer Button */}
        <AudioVisualizer
          connectionState={connectionState}
          userVolume={userVolume}
          modelVolume={modelVolume}
          onToggleSession={handleToggleSession}
          targetLanguageName={activeLangObj.name}
        />

        {/* Error Notice */}
        {errorMessage && (
          <div
            id="error-banner"
            className="w-full max-w-sm mt-4 p-3 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <p className="flex-1 font-light leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Live Translation Stream Drawer/Feed */}
        {(showLogs || translations.length > 0 || currentModelTurnText.length > 0) && (
          <TranslationFeed
            translations={translations}
            currentModelTurnText={currentModelTurnText}
            targetLanguageName={activeLangObj.name}
            onClear={clearHistory}
          />
        )}
      </main>

      {/* Footer Section */}
      <footer className="flex flex-col items-center pb-8 sm:pb-12 space-y-6 sm:space-y-8 max-w-3xl w-full mx-auto px-4">
        {/* Target Language Dropdown */}
        <div className="flex flex-col items-center space-y-3">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.4em]">
            Target Output Language
          </span>

          <LanguageSelector
            selectedLanguage={targetLanguage}
            onSelectLanguage={handleLanguageChange}
          />
        </div>

        {/* Telemetry Indicator Strip */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 sm:gap-x-10 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-300">
          <div className="flex items-center space-x-2">
            <span className="text-neutral-300">Input</span>
            <span className="text-neutral-500">Auto-Sense Enabled</span>
          </div>
          <div className="w-1 h-1 bg-neutral-300 rounded-full hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span className="text-neutral-300">Latency</span>
            <span className="text-neutral-500">Low-Latency Live</span>
          </div>
          <div className="w-1 h-1 bg-neutral-300 rounded-full hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span className="text-neutral-300">Prosody</span>
            <span className="text-neutral-500">Mirror Mode On</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
