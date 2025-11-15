import { useEffect, useState } from "react";

export const useTranslation = (
  messages: { id: string; text: string; translations: Record<string, string> }[],
  selectedLanguage: string
) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState(messages);

  const translateText = async (
    text: string,
    targetLanguage: string
  ): Promise<string> => {
    if (!text.trim()) {
      return text;
    }

    // No translation needed for English
    if (targetLanguage === "en") {
      return text;
    }

    try {
      // Dynamic import of @google-cloud/translate package
      const {
        v2: { Translate },
      } = await import("@google-cloud/translate");
      const translate = new Translate({
        projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID as string | undefined,
      });

      const [translations] = await translate.translate(text, targetLanguage);
      const translated = Array.isArray(translations)
        ? translations[0]
        : translations;
      return typeof translated === "string" ? translated : text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  useEffect(() => {
    setTranslatedMessages((prev) => {
      const prevIds = new Set(prev.map((message) => message.id));
      const mergedMessages = messages.map((message) => {
        const cached = prev.find((item) => item.id === message.id);
        return cached ?? message;
      });

      // Remove stale entries that no longer exist in the source messages
      return mergedMessages.filter((message) => prevIds.has(message.id) || messages.includes(message));
    });

    if (selectedLanguage === "en") {
      setIsTranslating(false);
      return;
    }

    const untranslated = messages.filter(
      (message) => !message.translations[selectedLanguage]
    );

    if (!untranslated.length) {
      setTranslatedMessages(messages);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);

    const translatePending = async () => {
      const updates = await Promise.all(
        untranslated.map(async (message) => ({
          id: message.id,
          translated: await translateText(message.text, selectedLanguage),
        }))
      );

      if (cancelled) {
        return;
      }

      setTranslatedMessages((prev) =>
        prev.map((message) => {
          const update = updates.find((item) => item.id === message.id);
          if (!update) {
            return message;
          }
          return {
            ...message,
            translations: {
              ...message.translations,
              [selectedLanguage]: update.translated,
            },
          };
        })
      );

      setIsTranslating(false);
    };

    void translatePending();

    return () => {
      cancelled = true;
    };
  }, [messages, selectedLanguage]);

  const getDisplayText = (message: {
    id: string;
    text: string;
    translations: Record<string, string>;
  }) => {
    if (selectedLanguage === "en") {
      return message.text;
    }

    const translated = translatedMessages.find((item) => item.id === message.id);
    return translated?.translations[selectedLanguage] ?? message.text;
  };

  return { isTranslating, getDisplayText, translatedMessages };
};
