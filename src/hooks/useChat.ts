import { useCallback, useRef, useState } from "react";
import { WEBHOOK_URL, getCategoryForWebhook } from "../constants";
import type { CategoryKey, Message, ModelType } from "../types";
import { logger } from "../utils/logger";

export interface ChatModel {
  id: ModelType;
  name: string;
  description: string;
}

// Gemini API configuration
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL_NAME = 'gemini-2.5-flash-lite';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key is not set. Gemini model will not work without it.');
}

// Model configuration
export const CHAT_MODELS: ChatModel[] = [
  {
    id: "n8n",
    name: "N8N Agent",
    description: "Default agent using N8N workflows"
  },
  {
    id: "gemini",
    name: "Gemini 2.5 Flash Lite",
    description: "Google's Gemini 2.5 Flash Lite model for fast and efficient responses"
  }
];

// Request timeout configuration
const REQUEST_TIMEOUT = 60000; // 60 seconds
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 500; // milliseconds

interface UseChatProps {
  selectedModel?: ModelType;
}

export const useChat = ({ selectedModel = "n8n" }: UseChatProps = {}) => {
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
    const text = await response.text();
    console.log('Parsing response text:', text);

    if (!text) {
      console.warn('Empty response received');
      return { output: 'Empty response received from server' };
    }

    try {
      const parsed = JSON.parse(text);
      console.log('Parsed JSON response:', parsed);
      return parsed;
    } catch (e) {
      console.warn('Failed to parse JSON response, treating as plain text');
      return { output: text };
    }
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

  // Function to handle Gemini API call
  const callGeminiAPI = useCallback(async (prompt: string) => {
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
    }

    console.log('Sending request to Gemini API with prompt:', prompt);

    try {
      const response = await fetchWithTimeout(
        `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          }),
        }
      );

      const responseText = await response.text();
      console.log('Gemini API response status:', response.status, response.statusText);
      console.log('Gemini API response body:', responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error?.message || `Gemini API error: ${response.status} ${response.statusText}`);
        } catch (e) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${responseText}`);
        }
      }

      const data = JSON.parse(responseText);
      const responseTextContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseTextContent) {
        console.warn('Unexpected Gemini API response format:', data);
        throw new Error('Received unexpected response format from Gemini API');
      }

      return responseTextContent;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw new Error(`Gemini API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const sendMessage = useCallback(
    async (selectedCategory: CategoryKey | null, inputValue: string, model: ModelType = selectedModel) => {
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

        let responseData: unknown;

        if (model === 'gemini') {
          const prompt = `You are a helpful assistant for the ${selectedCategory} category. The user asks: ${trimmed}`;
          const geminiResponse = await callGeminiAPI(prompt);
          responseData = { output: geminiResponse };
        } else {
          // For N8N webhook
          if (!WEBHOOK_URL) {
            throw new Error('Webhook URL is not configured');
          }

          const requestBody = {
            category: getCategoryForWebhook(selectedCategory as CategoryKey),
            text: trimmed,
          };

          console.log('Sending request to N8N webhook:', {
            url: WEBHOOK_URL,
            method: 'POST',
            body: requestBody
          });

          const response = await fetchWithTimeout(
            WEBHOOK_URL,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
              timeout: REQUEST_TIMEOUT,
            }
          );

          const responseText = await response.text();
          console.log('N8N webhook response status:', response.status, response.statusText);
          console.log('N8N webhook response body:', responseText);

          if (!response.ok) {
            throw new Error(`Webhook error: ${response.status} ${response.statusText} - ${responseText}`);
          }

          try {
            responseData = JSON.parse(responseText);
            console.log('Parsed N8N response data:', responseData);
          } catch (e) {
            console.error('Failed to parse N8N response:', e);
            throw new Error('Received invalid JSON response from N8N webhook');
          }
        }

        const agentText = extractAgentText(responseData);

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
    [fetchWithTimeout, parseResponse, extractAgentText, appendMessage, selectedModel]
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
    models: CHAT_MODELS as ChatModel[],
  };
};
