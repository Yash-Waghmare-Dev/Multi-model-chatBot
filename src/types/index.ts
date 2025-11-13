export type CategoryKey = "share-market" | "astrology" | "wellness";

export type MessageRole = "user" | "agent";

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  translations: Record<string, string>;
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
