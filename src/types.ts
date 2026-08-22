export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "speaking"
  | "translating"
  | "error";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

export interface TranslationTurn {
  id: string;
  timestamp: Date;
  speaker: "user" | "model";
  text?: string;
  detectedDirection?: string;
}
