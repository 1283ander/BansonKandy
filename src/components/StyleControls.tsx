import React, { useState, useMemo } from "react";
import { SlidersHorizontal, Volume2, Check, X, ArrowRight, RefreshCw, Search } from "lucide-react";
import { PREBUILT_VOICES, STYLE_PRESETS } from "../constants/languages";
import { VoiceOption } from "../types";

interface StyleControlsProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  customStyle: string;
  onCustomStyleChange: (style: string) => void;
  isLive: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StyleControlsModal: React.FC<StyleControlsProps> = ({
  selectedVoice,
  onVoiceChange,
  customStyle,
  onCustomStyleChange,
  isLive,
  isOpen,
  onOpenChange,
}) => {
  const [styleInput, setStyleInput] = useState(customStyle);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male" | "neutral">("all");

  const handleApplyStyle = (val: string) => {
    setStyleInput(val);
    onCustomStyleChange(val);
  };

  const handleClearStyle = () => {
    setStyleInput("");
    onCustomStyleChange("");
  };

  const filteredVoices = useMemo(() => {
    const q = voiceSearch.toLowerCase().trim();
    return PREBUILT_VOICES.filter((voice) => {
      const matchesSearch =
        !q ||
        voice.name.toLowerCase().includes(q) ||
        voice.description.toLowerCase().includes(q) ||
        (voice.tone && voice.tone.toLowerCase().includes(q));

      const matchesGender =
        genderFilter === "all" || voice.gender === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [voiceSearch, genderFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />

      <div
        id="style-settings-modal"
        className="relative z-10 w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-xl p-5 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Voice & Style Tuning
              </h3>
              <p className="text-[11px] text-neutral-400 font-normal">
                Gemini Live Voice Library & Behavioral Directives
              </p>
            </div>
          </div>
          <button
            id="close-style-modal-button"
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* Live Re-handshake Notification */}
          {isLive && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" />
              <span className="font-normal leading-tight">
                <strong>Live Session:</strong> Changing voices or styles instantly rebuilds the live connection with new parameters.
              </span>
            </div>
          )}

          {/* 1. Complete Voice Selection Section (30 Voices) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Voice Model ({PREBUILT_VOICES.length} available)
                </label>
              </div>
              <span className="text-[11px] font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full">
                Active: {selectedVoice}
              </span>
            </div>

            {/* Search & Gender Filter Bar */}
            <div className="flex flex-col xs:flex-row gap-1.5 mb-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-voices-input"
                  type="text"
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  placeholder="Search voices (e.g. Sulafat, warm, deep)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs text-neutral-900 bg-neutral-50 rounded-xl focus:outline-none focus:bg-neutral-100 focus:ring-1 focus:ring-neutral-900 transition-all"
                />
                {voiceSearch && (
                  <button
                    type="button"
                    onClick={() => setVoiceSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Gender Filter Pills */}
              <div className="flex items-center gap-1 shrink-0 bg-neutral-100 p-0.5 rounded-xl">
                {(["all", "female", "male", "neutral"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setGenderFilter(filter)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-colors cursor-pointer capitalize ${
                      genderFilter === filter
                        ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* 30 Voices Grid List */}
            <div
              id="voice-select-group"
              className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-neutral-50/70 rounded-2xl"
            >
              {filteredVoices.map((voice: VoiceOption) => {
                const isSelected = selectedVoice === voice.id;
                return (
                  <button
                    key={voice.id}
                    id={`voice-select-${voice.id}`}
                    type="button"
                    onClick={() => onVoiceChange(voice.id)}
                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer touch-manipulation flex flex-col justify-between ${
                      isSelected
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-white text-neutral-700 hover:bg-neutral-100/90"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? "text-white" : "text-neutral-900"
                        }`}
                      >
                        {voice.name}
                      </span>
                      {isSelected ? (
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[9px] text-neutral-400">
                          {voice.gender === "female" ? "♀" : voice.gender === "male" ? "♂" : "⚡"}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] line-clamp-1 leading-tight ${
                        isSelected ? "text-neutral-300" : "text-neutral-400"
                      }`}
                    >
                      {voice.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Style Conditioning Text Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="custom-style-input"
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
              >
                Behavioral Style Instruction
              </label>
              {customStyle && (
                <button
                  id="clear-style-btn"
                  type="button"
                  onClick={handleClearStyle}
                  className="text-[10px] font-medium text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="custom-style-input"
                type="text"
                value={styleInput}
                onChange={(e) => setStyleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApplyStyle(styleInput);
                  }
                }}
                placeholder="e.g. use Chongqing dialect, speak formally, casual slang..."
                className="w-full px-3 py-2 text-xs text-neutral-900 bg-neutral-50 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-neutral-900 transition-all pr-18"
              />
              <button
                id="apply-style-input-button"
                type="button"
                onClick={() => handleApplyStyle(styleInput)}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-neutral-900 text-white rounded-lg text-[10px] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* 3. Style Presets Chips */}
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Style Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_PRESETS.map((preset) => {
                const isActive = customStyle === preset.instruction;
                return (
                  <button
                    key={preset.id}
                    id={`preset-style-${preset.id}`}
                    type="button"
                    onClick={() => handleApplyStyle(preset.instruction)}
                    className={`min-h-[28px] px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer touch-manipulation flex items-center gap-1.5 ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-2xs"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isActive && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Modal Action */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 shrink-0 mt-3">
          <span className="text-xs text-neutral-400">
            Selected: <strong className="text-neutral-900">{selectedVoice}</strong>
          </span>
          <button
            id="done-style-modal-button"
            type="button"
            onClick={() => {
              handleApplyStyle(styleInput);
              onOpenChange(false);
            }}
            className="min-h-[36px] px-5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Done</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
