import { useState } from "react";
import { useLiveAudio } from "./hooks/useLiveAudio";
import { LanguageSelector } from "./components/LanguageSelector";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { TranslationFeed } from "./components/TranslationFeed";
import { TARGET_LANGUAGES, PRIMARY_LANGUAGES, PREBUILT_VOICES } from "./constants/languages";
import { AppMode } from "./types";
import {
  Volume2,
  AlertTriangle,
  Check,
  FileText,
  ArrowLeftRight,
  User,
  Users,
} from "lucide-react";

export default function App() {
  const [mode, setMode] = useState<AppMode>("single");
  const [langA, setLangA] = useState<string>("en");
  const [langB, setLangB] = useState<string>("km");
  const [selectedVoice, setSelectedVoice] = useState<string>("Zephyr");
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const activeLangAObj =
    TARGET_LANGUAGES.find((l) => l.code === langA) || TARGET_LANGUAGES[0];
  const activeLangBObj =
    TARGET_LANGUAGES.find((l) => l.code === langB) || TARGET_LANGUAGES[1];

  const {
    connectionState,
    errorMessage,
    userVolume,
    modelVolume,
    translations,
    currentModelTurnText,
    startSession,
    stopSession,
    updateSessionConfig,
    clearHistory,
  } = useLiveAudio({
    mode,
    languageA: activeLangAObj.name,
    languageB: activeLangBObj.name,
    voice: selectedVoice,
  });

  const isLive =
    connectionState === "connected" ||
    connectionState === "speaking" ||
    connectionState === "translating";

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (isLive) {
      updateSessionConfig(newMode, activeLangAObj.name, activeLangBObj.name, selectedVoice);
    }
  };

  const handleLangAChange = (code: string) => {
    setLangA(code);
    const newLangAObj = TARGET_LANGUAGES.find((l) => l.code === code) || TARGET_LANGUAGES[0];
    if (isLive) {
      updateSessionConfig(mode, newLangAObj.name, activeLangBObj.name, selectedVoice);
    }
  };

  const handleLangBChange = (code: string) => {
    setLangB(code);
    const newLangBObj = TARGET_LANGUAGES.find((l) => l.code === code) || TARGET_LANGUAGES[1];
    if (isLive) {
      updateSessionConfig(mode, activeLangAObj.name, newLangBObj.name, selectedVoice);
    }
  };

  const handleSwapLanguages = () => {
    const tempA = langA;
    const tempB = langB;
    setLangA(tempB);
    setLangB(tempA);
    const newLangA = TARGET_LANGUAGES.find((l) => l.code === tempB) || TARGET_LANGUAGES[0];
    const newLangB = TARGET_LANGUAGES.find((l) => l.code === tempA) || TARGET_LANGUAGES[1];
    if (isLive) {
      updateSessionConfig(mode, newLangA.name, newLangB.name, selectedVoice);
    }
  };

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
    setShowVoiceSettings(false);
    if (isLive) {
      updateSessionConfig(mode, activeLangAObj.name, activeLangBObj.name, voice);
    }
  };

  const handleToggleSession = () => {
    if (isLive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] text-[#171717] flex flex-col justify-between font-sans select-none antialiased overflow-x-hidden">
      {/* Mobile-First Header Bar */}
      <header className="flex justify-between items-center px-4 sm:px-8 pt-3 sm:pt-5 pb-2 max-w-2xl w-full mx-auto shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 bg-neutral-900 rounded-sm flex items-center justify-center shadow-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900">
            Echo.Live
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Engine Status Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white border border-neutral-200/80 shadow-2xs">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive
                  ? "bg-emerald-500 animate-pulse"
                  : connectionState === "connecting"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-neutral-300"
              }`}
            />
            <span className="text-[9px] font-bold uppercase tracking-tight text-neutral-600">
              {isLive ? "Live" : "Standby"}
            </span>
          </div>

          {/* Voice Picker Dropdown */}
          <div className="relative">
            <button
              id="voice-settings-button"
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="min-h-[34px] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200/80 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer touch-manipulation"
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
                      className={`w-full min-h-[38px] flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-colors cursor-pointer touch-manipulation ${
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
            className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer touch-manipulation border ${
              showLogs
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 hover:text-neutral-900 border-neutral-200/80 shadow-2xs"
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-1 w-full max-w-lg mx-auto">
        {/* Session Mode Selector: Single User vs Dual User Mode */}
        <div className="w-full max-w-xs mb-3">
          <div
            id="mode-toggle-group"
            className="grid grid-cols-2 p-1 bg-neutral-200/70 rounded-2xl border border-neutral-300/60 shadow-2xs"
          >
            <button
              id="mode-single-user-button"
              type="button"
              onClick={() => handleModeChange("single")}
              className={`min-h-[38px] py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation ${
                mode === "single"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Single User</span>
            </button>

            <button
              id="mode-dual-user-button"
              type="button"
              onClick={() => handleModeChange("dual")}
              className={`min-h-[38px] py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation ${
                mode === "dual"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Dual User</span>
            </button>
          </div>
        </div>

        {/* Dual Language Pair Overview Pill */}
        <div className="mb-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-[11px] font-medium tracking-tight text-neutral-600 flex items-center gap-2 shadow-2xs">
          <div className="flex items-center gap-1">
            <span>{activeLangAObj.flag}</span>
            <span className="text-neutral-900 font-semibold">{activeLangAObj.name}</span>
          </div>
          <span className="text-neutral-300 font-bold">⇄</span>
          <div className="flex items-center gap-1">
            <span>{activeLangBObj.flag}</span>
            <span className="text-neutral-900 font-semibold">{activeLangBObj.name}</span>
          </div>
        </div>

        {/* Central Geometric Concentric Visualizer Button */}
        <AudioVisualizer
          connectionState={connectionState}
          userVolume={userVolume}
          modelVolume={modelVolume}
          onToggleSession={handleToggleSession}
          mode={mode}
          langAName={activeLangAObj.name}
          langBName={activeLangBObj.name}
        />

        {/* Error Notification */}
        {errorMessage && (
          <div
            id="error-banner"
            className="w-full max-w-sm mt-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
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
            targetLanguageName={activeLangBObj.name}
            onClear={clearHistory}
          />
        )}
      </main>

      {/* Mobile-First Language Selection Section with Dual Language Inputs */}
      <footer className="w-full max-w-lg mx-auto px-4 pb-4 sm:pb-6 pt-2 flex flex-col items-center space-y-3 shrink-0">
        {/* Dual Language Pair Selector Inputs */}
        <div className="w-full bg-neutral-100/80 p-2.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.18em]">
              {mode === "dual" ? "Bilingual Mediator Languages" : "Conversation Languages"}
            </span>
            <span className="text-[9px] text-neutral-400 font-medium">
              {mode === "dual" ? "Speaker 1 ⇄ Speaker 2" : "Source ⇄ Target"}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div>
              <div className="text-[9px] font-semibold text-neutral-500 uppercase px-1 mb-1 truncate">
                {mode === "dual" ? "Speaker 1" : "User Native"}
              </div>
              <LanguageSelector
                idPrefix="lang-a"
                label={mode === "dual" ? "Speaker 1 Language" : "Your Native Language"}
                selectedLanguage={langA}
                onSelectLanguage={handleLangAChange}
                compact
              />
            </div>

            <div className="flex flex-col items-center justify-center pt-3">
              <button
                id="swap-languages-button"
                type="button"
                onClick={handleSwapLanguages}
                className="w-8 h-8 rounded-full bg-white border border-neutral-200 hover:border-neutral-300 shadow-2xs flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-transform active:scale-90 cursor-pointer touch-manipulation"
                title="Swap Languages"
                aria-label="Swap Languages"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="text-[9px] font-semibold text-neutral-500 uppercase px-1 mb-1 truncate">
                {mode === "dual" ? "Speaker 2" : "Target Language"}
              </div>
              <LanguageSelector
                idPrefix="lang-b"
                label={mode === "dual" ? "Speaker 2 Language" : "Target Language"}
                selectedLanguage={langB}
                onSelectLanguage={handleLangBChange}
                compact
              />
            </div>
          </div>
        </div>

        {/* 6 Primary Main Options Quick Switcher Bar (Mobile 1-Tap Access for Target Language) */}
        <div className="w-full">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
              Quick Switch Target
            </span>
            <span className="text-[9px] text-neutral-400 font-medium">
              1-Tap Primary
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1 w-full">
            {PRIMARY_LANGUAGES.map((lang) => {
              const isSelected = lang.code === langB;
              return (
                <button
                  key={`quick-${lang.code}`}
                  id={`quick-target-${lang.code}`}
                  type="button"
                  onClick={() => handleLangBChange(lang.code)}
                  className={`min-h-[42px] py-1 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer touch-manipulation ${
                    isSelected
                      ? "bg-neutral-900 text-white shadow-xs scale-[1.02] ring-1 ring-neutral-900"
                      : "bg-white text-neutral-700 hover:bg-neutral-100/80 border border-neutral-200/80 active:scale-95"
                  }`}
                  title={`${lang.name} (${lang.nativeName})`}
                >
                  <span className="text-sm leading-none mb-0.5">{lang.flag}</span>
                  <span
                    className={`text-[8.5px] font-semibold tracking-tight text-center truncate max-w-full px-0.5 leading-tight ${
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
      </footer>
    </div>
  );
}
