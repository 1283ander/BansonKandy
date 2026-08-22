import { LanguageOption, VoiceOption } from "../types";

export const PRIMARY_LANGUAGES: LanguageOption[] = [
  { code: "es-419", name: "Latin American Spanish", nativeName: "Español (Latinoamérica)", flag: "🇲🇽" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭" },
  { code: "zh-CN", name: "Mainland Chinese", nativeName: "中文 (简体普通话)", flag: "🇨🇳" },
];

export const TARGET_LANGUAGES: LanguageOption[] = [
  // 5 Main Priority Languages
  { code: "es-419", name: "Latin American Spanish", nativeName: "Español (Latinoamérica)", flag: "🇲🇽" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭" },
  { code: "zh-CN", name: "Mainland Chinese", nativeName: "中文 (简体普通话)", flag: "🇨🇳" },

  // Additional Global Languages
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "pt-BR", name: "Brazilian Portuguese", nativeName: "Português (Brasil)", flag: "🇧🇷" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "tl", name: "Tagalog / Filipino", nativeName: "Tagalog", flag: "🇵🇭" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
];

export const PREBUILT_VOICES: VoiceOption[] = [
  { id: "Zephyr", name: "Zephyr", description: "Balanced & expressive" },
  { id: "Puck", name: "Puck", description: "Warm & energetic" },
  { id: "Charon", name: "Charon", description: "Deep & authoritative" },
  { id: "Kore", name: "Kore", description: "Calm & natural" },
  { id: "Fenrir", name: "Fenrir", description: "Dynamic & confident" },
  { id: "Aoede", name: "Aoede", description: "Gentle & melodious" },
];
