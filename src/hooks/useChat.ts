import { useCallback, useState } from "react";
import { WEBHOOK_URL, getCategoryForWebhook } from "../constants";
import type { CategoryKey, Message } from "../types";
import { logger } from "../utils/logger";

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(
    async (selectedCategory: CategoryKey | null, inputValue: string) => {
      const trimmed = inputValue.trim();
      if (!trimmed || !selectedCategory) {
        return;
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmed,
        translations: {},
      };

      appendMessage(userMessage);
      setIsSending(true);

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category: getCategoryForWebhook(selectedCategory),
            text: trimmed,
          }),
        });

        const parseResponse = async () => {
          const contentType = response.headers.get("Content-Type") || "";

          if (contentType.includes("application/json")) {
            return response.json();
          }

          if (contentType.includes("text/")) {
            const text = await response.text();
            try {
              return JSON.parse(text);
            } catch {
              return { output: text };
            }
          }

          return {};
        };

        const data = await parseResponse();

        if (!response.ok) {
          const errorText =
            typeof data === "object" && data && "error" in data
              ? (data as { error: string }).error
              : null;
          throw new Error(errorText || "Failed to fetch agent response.");
        }

        const agentText =
          typeof data === "object" &&
          data &&
          "output" in data &&
          typeof (data as { output: unknown }).output === "string"
            ? (data as { output: string }).output
            : typeof data === "string"
            ? data
            : "No response received.";

        appendMessage({
          id: crypto.randomUUID(),
          role: "agent",
          text: agentText,
          translations: {},
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unexpected error occurred.";
        logger.error("Failed to send message", { error: errorMessage });
        appendMessage({
          id: crypto.randomUUID(),
          role: "agent",
          text: `Sorry, I ran into an issue: ${errorMessage}`,
          translations: {},
        });
      } finally {
        setIsSending(false);
      }
    },
    [appendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isSending,
    sendMessage,
    appendMessage,
    clearMessages,
  };
};
