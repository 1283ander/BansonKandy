import React, { useState } from "react";
import { useLiveAudio } from "./hooks/useLiveAudio";
import { LanguageSelector } from "./components/LanguageSelector";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { TranslationFeed } from "./components/TranslationFeed";
import { TARGET_LANGUAGES, PRIMARY_LANGUAGES, PREBUILT_VOICES } from "./constants/languages";
import { Volume2, AlertTriangle, Check, FileText } from "lucide-react";

export default function App() {
  const [targetLanguage, setTargetLanguage] = useState<string>("km");
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
    clearHistory,
  } = useLiveAudio({
    targetLanguage,
    voice: selectedVoice,
  });

  const activeLangObj =
    TARGET_LANGUAGES.find((l) => l.code === targetLanguage) || TARGET_LANGUAGES[0];

  const handleLanguageChange = (langCode: string) => {
    setTargetLanguage(langCode);
    if (
      connectionState === "connected" ||
      connectionState === "speaking" ||
      connectionState === "translating"
    ) {
      stopSession();
    }
  };

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
    setShowVoiceSettings(false);
    if (
      connectionState === "connected" ||
      connectionState === "speaking" ||
      connectionState === "translating"
    ) {
      stopSession();
    }
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
    <div className="min-h-[100dvh] bg-[#FAFAFA] text-[#171717] flex flex-col justify-between font-sans select-none antialiased overflow-x-hidden">
      {/* Mobile-First Header Bar */}
      <header className="flex justify-between items-center px-4 sm:px-8 pt-4 sm:pt-6 pb-2 max-w-2xl w-full mx-auto shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 bg-neutral-900 rounded-sm flex items-center justify-center shadow-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900">
            Echo.Live
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Engine Status Badge */}
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-white border border-neutral-200/80 shadow-2xs">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive
                  ? "bg-emerald-500 animate-pulse"
                  : connectionState === "connecting"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-neutral-300"
              }`}
            />
            <span className="text-[9px] font-bold uppercase tracking-tight text-neutral-500">
              {isLive ? "Live" : "Standby"}
            </span>
          </div>

          {/* Voice Picker Toggle (Touch Friendly) */}
          <div className="relative">
            <button
              id="voice-settings-button"
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200/80 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>{selectedVoice}</span>
            </button>

            {showVoiceSettings && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowVoiceSettings(false)}
                />
                <div
                  id="voice-settings-menu"
                  className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-neutral-200 shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100 mb-1">
                    Select Speech Voice
                  </div>
                  {PREBUILT_VOICES.map((v) => (
                    <button
                      key={v.id}
                      id={`voice-option-${v.id}`}
                      onClick={() => handleVoiceChange(v.id)}
                      className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer touch-manipulation ${
                        selectedVoice === v.id
                          ? "bg-neutral-900 text-white font-semibold"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div>
                        <div className={`font-medium text-xs ${selectedVoice === v.id ? "text-white" : "text-neutral-900"}`}>
                          {v.name}
                        </div>
                        <div className={`text-[10px] font-normal ${selectedVoice === v.id ? "text-neutral-300" : "text-neutral-400"}`}>
                          {v.description}
                        </div>
                      </div>
                      {selectedVoice === v.id && (
                        <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Transcript Logs Toggle */}
          <button
            id="toggle-logs-button"
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer touch-manipulation border ${
              showLogs
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-500 hover:text-neutral-900 border-neutral-200/80 shadow-2xs"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{showLogs ? "Hide" : "Logs"}</span>
            {translations.length > 0 && !showLogs && (
              <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Main Translation Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full max-w-lg mx-auto">
        {/* Language Routing Pill */}
        <div className="mb-2 px-3 py-1 rounded-full border border-neutral-200 bg-white text-[10px] font-medium tracking-tight text-neutral-500 flex items-center gap-1.5 shadow-2xs">
          <span className="text-neutral-900 font-semibold">English</span>
          <span className="text-neutral-300">⇄</span>
          <span className="text-neutral-900 font-semibold">{activeLangObj.name}</span>
        </div>

        {/* Central Geometric Concentric Visualizer Button */}
        <AudioVisualizer
          connectionState={connectionState}
          userVolume={userVolume}
          modelVolume={modelVolume}
          onToggleSession={handleToggleSession}
          targetLanguageName={activeLangObj.name}
        />

        {/* Error Notification */}
        {errorMessage && (
          <div
            id="error-banner"
            className="w-full max-w-sm mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <p className="flex-1 font-light leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Live Translation Feed Stream */}
        {(showLogs || translations.length > 0 || currentModelTurnText.length > 0) && (
          <TranslationFeed
            translations={translations}
            currentModelTurnText={currentModelTurnText}
            targetLanguageName={activeLangObj.name}
            onClear={clearHistory}
          />
        )}
      </main>

      {/* Mobile-First Language Selection Section */}
      <footer className="w-full max-w-lg mx-auto px-4 pb-4 sm:pb-8 pt-2 flex flex-col items-center space-y-3 shrink-0">
        {/* 5 Primary Main Options Quick Switcher Bar (Mobile First 1-Tap Access) */}
        <div className="w-full">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
              Main Languages
            </span>
            <span className="text-[9px] text-neutral-400 font-medium">
              1-Tap Quick Switch
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 w-full">
            {PRIMARY_LANGUAGES.map((lang) => {
              const isSelected = lang.code === targetLanguage;
              return (
                <button
                  key={`quick-${lang.code}`}
                  id={`quick-lang-${lang.code}`}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`min-h-[46px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer touch-manipulation ${
                    isSelected
                      ? "bg-neutral-900 text-white shadow-xs scale-[1.02] ring-1 ring-neutral-900"
                      : "bg-white text-neutral-700 hover:bg-neutral-100/80 border border-neutral-200/80 active:scale-95"
                  }`}
                  title={`${lang.name} (${lang.nativeName})`}
                >
                  <span className="text-base leading-none mb-0.5">{lang.flag}</span>
                  <span
                    className={`text-[9px] font-semibold tracking-tight text-center truncate max-w-full px-0.5 leading-tight ${
                      isSelected ? "text-white" : "text-neutral-800"
                    }`}
                  >
                    {lang.code === "es-419"
                      ? "Spanish"
                      : lang.code === "zh-CN"
                      ? "Chinese"
                      : lang.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Language Selector / Modal Sheet Trigger */}
        <div className="w-full">
          <LanguageSelector
            selectedLanguage={targetLanguage}
            onSelectLanguage={handleLanguageChange}
          />
        </div>
      </footer>
    </div>
  );
}
