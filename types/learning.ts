export interface Language {
  id: string; // e.g. "es", "fr"
  name: string; // e.g. "Spanish", "French"
  nativeName: string; // e.g. "Español", "Français"
  flagEmoji: string; // e.g. "🇪🇸", "🇫🇷"
  tagline: string; // e.g. "Learn the language of romance and travel"
  imageKey?: string; // Reference to images in constants/images.ts if any
}

export interface Unit {
  id: string; // e.g. "es-unit-1"
  languageId: string; // e.g. "es"
  number: number; // e.g. 1
  title: string; // e.g. "Basics & Greetings"
  description: string; // e.g. "Learn to introduce yourself and say hello/goodbye."
  xpReward: number; // e.g. 100
}

export type LessonType =
  | "vocabulary-review"
  | "audio-lesson"
  | "chat-tutor"
  | "video-lesson";

export type ActivityType =
  | "multiple-choice"
  | "match-cards"
  | "sentence-builder"
  | "speak"
  | "listen-write";

export interface Activity {
  id: string;
  type: ActivityType;
  question: string;
  options?: string[]; // Used for multiple choice or word selection
  correctAnswer: string | string[]; // Exact answer text or array of words
  audioUrl?: string; // Placeholder or relative path for audio playback
  explanation?: string;
}

export interface VocabularyWord {
  id: string; // e.g. "es-hola"
  languageId: string; // e.g. "es"
  word: string; // "hola"
  translation: string; // "hello"
  pronunciation?: string; // "/ˈola/"
  partOfSpeech: string; // "noun", "verb", "interjection", etc.
  exampleSentence: string; // "¡Hola! ¿Cómo estás?"
  exampleTranslation: string; // "Hello! How are you?"
}

export interface Phrase {
  id: string; // e.g. "es-como-estas"
  languageId: string; // e.g. "es"
  phrase: string; // "¿Cómo estás?"
  translation: string; // "How are you?"
  context?: string; // "Used informally to ask how someone is doing"
}

export interface Lesson {
  id: string;
  unitId: string; // e.g. "es-unit-1"
  number: number; // e.g. 1
  title: string; // e.g. "Greetings"
  description: string; // e.g. "Saying hello and asking how someone is."
  xp: number; // e.g. 20
  type: LessonType;
  imageKey?: string; // Reference to images in constants/images.ts if any
  goals: string[]; // e.g. ["Greet someone politely", "Ask someone how they are"]
  vocabularyIds: string[]; // References to VocabularyWord.id
  phraseIds: string[]; // References to Phrase.id
  activities?: Activity[]; // List of interactive exercises (optional depending on lesson type)
  aiTeacherPrompt?: string; // Prompt for audio-based Vision Agent lessons
}
