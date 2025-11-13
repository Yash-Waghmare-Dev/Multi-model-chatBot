import { useCallback, useRef, useState } from "react";
import { WEBHOOK_URL, getCategoryForWebhook } from "../constants";
import type { CategoryKey, Message } from "../types";
import { logger } from "../utils/logger";

// Request timeout configuration
const REQUEST_TIMEOUT = 60000; // 60 seconds
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 500; // milliseconds

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Optimized fetch with timeout and retry logic
  const fetchWithTimeout = useCallback(
    async (
      url: string,
      options: RequestInit & { timeout?: number },
      retryCount = 0
    ): Promise<Response> => {
      const { timeout = REQUEST_TIMEOUT, ...fetchOptions } = options;
      
      // Create abort controller for timeout
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        timeout
      );

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: abortControllerRef.current.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Retry logic for network failures
        if (retryCount < RETRY_ATTEMPTS && error instanceof Error && error.name !== "AbortError") {
          logger.warn(`Retrying request (attempt ${retryCount + 1}/${RETRY_ATTEMPTS})`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return fetchWithTimeout(url, options, retryCount + 1);
        }
        
        throw error;
      }
    },
    []
  );

  // Optimized response parsing
  const parseResponse = useCallback(async (response: Response) => {
    const contentType = response.headers.get("Content-Type") || "";

    // Fast path for JSON responses
    if (contentType.includes("application/json")) {
      return (await response.json()) as unknown;
    }

    // Handle text responses
    if (contentType.includes("text/")) {
      const text = await response.text();
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return { output: text };
      }
    }

    // Default empty object
    return {};
  }, []);

  // Extract agent text from response
  const extractAgentText = useCallback((data: unknown): string => {
    if (typeof data === "string") {
      return data;
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "output" in data &&
      typeof (data as { output: unknown }).output === "string"
    ) {
      return (data as { output: string }).output;
    }

    return "No response received.";
  }, []);

  const sendMessage = useCallback(
    async (selectedCategory: CategoryKey | null, inputValue: string) => {
      const trimmed = inputValue.trim();
      if (!trimmed || !selectedCategory) {
        return;
      }

      const userMessageId = crypto.randomUUID();
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        text: trimmed,
        translations: {},
      };

      // Add user message immediately for instant feedback
      appendMessage(userMessage);
      setIsSending(true);

      try {
        // Add loading indicator message immediately
        const loadingMessageId = crypto.randomUUID();
        appendMessage({
          id: loadingMessageId,
          role: "agent",
          text: "Thinking...",
          translations: {},
        });

        const response = await fetchWithTimeout(
          WEBHOOK_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              category: getCategoryForWebhook(selectedCategory),
              text: trimmed,
            }),
            timeout: REQUEST_TIMEOUT,
          }
        );

        const data = await parseResponse(response);

        if (!response.ok) {
          const errorText =
            typeof data === "object" && data && "error" in data
              ? (data as { error: string }).error
              : `Server error: ${response.status}`;
          throw new Error(errorText);
        }

        const agentText = extractAgentText(data);

        // Replace loading message with actual response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessageId
              ? {
                  ...msg,
                  text: agentText,
                }
              : msg
          )
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.name === "AbortError"
              ? "Request timed out. Please try again."
              : error.message
            : "Unexpected error occurred.";

        logger.error("Failed to send message", { error: errorMessage });

        // Replace loading message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.text === "Thinking..."
              ? {
                  ...msg,
                  text: `Sorry, I ran into an issue: ${errorMessage}`,
                }
              : msg
          )
        );
      } finally {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    },
    [fetchWithTimeout, parseResponse, extractAgentText, appendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages,
    isSending,
    sendMessage,
    appendMessage,
    clearMessages,
  };
};
