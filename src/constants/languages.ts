import { LanguageOption, VoiceOption, StylePreset } from "../types";

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
  // Flagship / Popular Voices
  { id: "Puck", name: "Puck", description: "Upbeat & playful", gender: "male", tone: "Upbeat" },
  { id: "Sulafat", name: "Sulafat", description: "Warm & articulate", gender: "female", tone: "Warm" },
  { id: "Kore", name: "Kore", description: "Firm & youthful", gender: "female", tone: "Youthful" },
  { id: "Aoede", name: "Aoede", description: "Breezy & conversational", gender: "female", tone: "Conversational" },
  { id: "Fenrir", name: "Fenrir", description: "Excitable & dynamic", gender: "male", tone: "Dynamic" },
  { id: "Charon", name: "Charon", description: "Informative & assured", gender: "male", tone: "Assured" },
  { id: "Zephyr", name: "Zephyr", description: "Balanced & expressive", gender: "neutral", tone: "Balanced" },

  // Full Extended Gemini Voice Library (A-Z)
  { id: "Achernar", name: "Achernar", description: "Deep & authoritative", gender: "male", tone: "Authoritative" },
  { id: "Achird", name: "Achird", description: "Warm & friendly", gender: "female", tone: "Friendly" },
  { id: "Algenib", name: "Algenib", description: "Clear & professional", gender: "male", tone: "Professional" },
  { id: "Algieba", name: "Algieba", description: "Soft & melodious", gender: "female", tone: "Melodious" },
  { id: "Alnilam", name: "Alnilam", description: "Deep & resonant", gender: "male", tone: "Resonant" },
  { id: "Autonoe", name: "Autonoe", description: "Calm & composed", gender: "female", tone: "Calm" },
  { id: "Callirrhoe", name: "Callirrhoe", description: "Expressive & gentle", gender: "female", tone: "Gentle" },
  { id: "Despina", name: "Despina", description: "Crisp & energetic", gender: "female", tone: "Energetic" },
  { id: "Enceladus", name: "Enceladus", description: "Youthful & bright", gender: "male", tone: "Bright" },
  { id: "Erinome", name: "Erinome", description: "Relaxed & natural", gender: "female", tone: "Relaxed" },
  { id: "Gacrux", name: "Gacrux", description: "Steady & confident", gender: "male", tone: "Confident" },
  { id: "Iapetus", name: "Iapetus", description: "Deep & reflective", gender: "male", tone: "Reflective" },
  { id: "Laomedeia", name: "Laomedeia", description: "Elegant & precise", gender: "female", tone: "Elegant" },
  { id: "Leda", name: "Leda", description: "Warm & engaging", gender: "female", tone: "Engaging" },
  { id: "Orus", name: "Orus", description: "Energetic & punchy", gender: "male", tone: "Punchy" },
  { id: "Pulcherrima", name: "Pulcherrima", description: "Rich & articulate", gender: "female", tone: "Articulate" },
  { id: "Rasalgethi", name: "Rasalgethi", description: "Low & calm", gender: "male", tone: "Calm" },
  { id: "Sadachbia", name: "Sadachbia", description: "Bright & cheerful", gender: "female", tone: "Cheerful" },
  { id: "Sadaltager", name: "Sadaltager", description: "Direct & focused", gender: "male", tone: "Focused" },
  { id: "Schedar", name: "Schedar", description: "Balanced & clear", gender: "female", tone: "Clear" },
  { id: "Umbriel", name: "Umbriel", description: "Smooth & soothing", gender: "male", tone: "Soothing" },
  { id: "Vindemiatrix", name: "Vindemiatrix", description: "Polished & clear", gender: "female", tone: "Polished" },
  { id: "Zubenelgenubi", name: "Zubenelgenubi", description: "Bold & commanding", gender: "male", tone: "Commanding" },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "chongqing",
    label: "Chongqing Dialect",
    instruction: "use Chongqing dialect",
    badge: "Dialect",
  },
  {
    id: "vulgar_humor",
    label: "Vulgar / Humorous",
    instruction: "keep vulgar/humorous tone",
    badge: "Register",
  },
  {
    id: "formal",
    label: "Speak Formally",
    instruction: "speak formally",
    badge: "Register",
  },
  {
    id: "slang_street",
    label: "Street Slang",
    instruction: "use authentic urban street slang and casual idioms",
    badge: "Slang",
  },
  {
    id: "fast_energetic",
    label: "Fast & Energetic",
    instruction: "fast-paced, high energy with punchy delivery",
    badge: "Pacing",
  },
  {
    id: "calm_whisper",
    label: "Calm & Gentle",
    instruction: "calm, soothing, soft and gentle tone",
    badge: "Tone",
  },
];
