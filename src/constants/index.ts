import type { Category, CategoryKey, Language } from "../types";

export const WEBHOOK_URL = (import.meta.env.VITE_WEBHOOK_URL ||
  "https://n8n.srv650558.hstgr.cloud/webhook/3967230f-99b6-4a50-b049-be711b89c3b3") as string;

export const categories: Category[] = [
  {
    key: "share-market",
    title: "Share Market",
    description:
      "Get insights, market trends, and portfolio guidance tailored to you.",
  },
  {
    key: "astrology",
    title: "Astrology",
    description:
      "Explore celestial guidance, horoscope readings, and personalized astrological advice.",
  },
  {
    key: "wellness",
    title: "Wellness",
    description:
      "Receive tips on mindfulness, nutrition, fitness, and holistic wellbeing.",
  },
];

export const languages: Language[] = [
  { code: "en", label: "English", voice: "en-US" },
  { code: "hi", label: "Hindi", voice: "hi-IN" },
  { code: "mr", label: "Marathi", voice: "mr-IN" },
  { code: "bn", label: "Bengali", voice: "bn-IN" },
  { code: "ta", label: "Tamil", voice: "ta-IN" },
  { code: "te", label: "Telugu", voice: "te-IN" },
];

export const getCategoryForWebhook = (categoryKey: CategoryKey): string => {
  const categoryMap: Record<CategoryKey, string> = {
    "share-market": "share-market",
    astrology: "Astrology",
    wellness: "wellness",
  };
  return categoryMap[categoryKey];
};
