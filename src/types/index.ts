export type CategoryKey = "share-market" | "astrology" | "wellness";

export type MessageRole = "user" | "agent";

export type ModelType = "n8n" | "gemini";

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  translations: Record<string, string>;
  model?: ModelType;
}

export interface ChatModel {
  id: ModelType;
  name: string;
  description: string;
}

export interface Category {
  key: CategoryKey;
  title: string;
  description: string;
}

export interface Language {
  code: string;
  label: string;
  voice: string;
}
