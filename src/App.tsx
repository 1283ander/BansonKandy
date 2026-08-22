import React, { useState } from "react";
import { useLiveAudio } from "./hooks/useLiveAudio";
import { UnifiedLanguagePicker } from "./components/UnifiedLanguagePicker";
import { ConversationCanvas } from "./components/ConversationCanvas";
import { ControlDeck } from "./components/ControlDeck";
import { StyleControlsModal } from "./components/StyleControls";
import { TextInputModal } from "./components/TextInputModal";
import { TARGET_LANGUAGES } from "./constants/languages";
import { SlidersHorizontal, AlertCircle, Sparkles } from "lucide-react";

export default function App() {
  const [targetLanguage, setTargetLanguage] = useState<string>("km");
  const [selectedVoice, setSelectedVoice] = useState<string>("Puck");
  const [customStyle, setCustomStyle] = useState<string>("");
  const [isStyleModalOpen, setIsStyleModalOpen] = useState<boolean>(false);
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState<boolean>(false);

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
    addManualTurn,
  } = useLiveAudio({
    targetLanguage,
    voiceName: selectedVoice,
    customStyle,
  });

  const activeLangObj =
    TARGET_LANGUAGES.find((l) => l.code === targetLanguage) || TARGET_LANGUAGES[0];

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
    <div className="min-h-[100dvh] bg-[#FBFBFB] text-neutral-900 flex flex-col justify-between font-sans antialiased select-none overflow-hidden">
      {/* 1. Header Zone (Top) */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-2 flex items-center justify-between gap-2 shrink-0">
        {/* Brand Title (Muted, Clean Sans-Serif) */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-2xs">
            <span className="text-[10px] font-bold tracking-tighter">E</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hidden xs:inline">
            Echo
          </span>
        </div>

        {/* Centered Unified Language Switcher Pill */}
        <div className="flex-1 flex justify-center">
          <UnifiedLanguagePicker
            targetLanguage={targetLanguage}
            onSelectLanguage={setTargetLanguage}
          />
        </div>

        {/* Header Right Actions (Ghost Style) */}
        <div className="flex items-center gap-1.5">
          <button
            id="header-style-settings-btn"
            type="button"
            onClick={() => setIsStyleModalOpen(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer touch-manipulation ${
              customStyle
                ? "bg-amber-100 text-amber-900"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
            title="Voice & style settings"
            aria-label="Open voice and style settings"
          >
            {customStyle ? (
              <Sparkles className="w-4 h-4 text-amber-700" />
            ) : (
              <SlidersHorizontal className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Error Alert Bar (if connection error occurs) */}
      {errorMessage && (
        <div
          id="error-notification"
          className="mx-auto my-2 max-w-md w-[calc(100%-2rem)] px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="flex-1 font-normal leading-snug">{errorMessage}</p>
        </div>
      )}

      {/* 2. Main Conversational Canvas Zone (Center) */}
      <main className="flex-1 flex flex-col justify-center overflow-hidden w-full">
        <ConversationCanvas
          translations={translations}
          currentModelTurnText={currentModelTurnText}
          targetLanguageName={activeLangObj.name}
          connectionState={connectionState}
          selectedVoice={selectedVoice}
          onClear={clearHistory}
        />
      </main>

      {/* 3. Control Deck Zone (Bottom) */}
      <footer className="w-full shrink-0">
        <ControlDeck
          connectionState={connectionState}
          userVolume={userVolume}
          modelVolume={modelVolume}
          onToggleSession={handleToggleSession}
          onOpenKeyboard={() => setIsKeyboardModalOpen(true)}
          onOpenSettings={() => setIsStyleModalOpen(true)}
          onClearHistory={clearHistory}
          hasHistory={translations.length > 0}
        />
      </footer>

      {/* Modals */}
      <StyleControlsModal
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        customStyle={customStyle}
        onCustomStyleChange={setCustomStyle}
        isLive={isLive}
        isOpen={isStyleModalOpen}
        onOpenChange={setIsStyleModalOpen}
      />

      <TextInputModal
        isOpen={isKeyboardModalOpen}
        onClose={() => setIsKeyboardModalOpen(false)}
        targetLanguage={targetLanguage}
        onAddTranslationTurn={addManualTurn}
      />
    </div>
  );
}
