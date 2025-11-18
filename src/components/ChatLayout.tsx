import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef } from "react";
import type { CategoryKey, Message, ModelType, ChatModel } from "../types";
import { categories, languages } from "../constants";
import { useTranslation } from "../hooks/useTranslation";
import { useSpeech } from "../hooks/useSpeech";
import { MessageItem } from "./MessageItem";

interface ChatLayoutProps {
  selectedCategory: CategoryKey;
  messages: Message[];
  inputValue: string;
  isSending: boolean;
  selectedLanguage: string;
  selectedModel: ModelType;
  models: ChatModel[];
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onLanguageChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onModelChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onReset: () => void;
}

export const ChatLayout = ({
  selectedCategory,
  messages,
  inputValue,
  isSending,
  selectedLanguage,
  selectedModel,
  models,
  onInputChange,
  onSubmit,
  onKeyDown,
  onLanguageChange,
  onModelChange,
  onReset,
}: ChatLayoutProps) => {
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const { isTranslating, getDisplayText } = useTranslation(
    messages,
    selectedLanguage
  );
  const {
    activeSpeechId,
    speechSynthesisSupported,
    handlePlayMessage,
    handlePause,
  } = useSpeech(selectedLanguage);

  useEffect(() => {
    if (!chatWindowRef.current) {
      return;
    }

    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages, isSending]);

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <div className="chat-header-left">
          <button type="button" className="link-button" onClick={onReset}>
            ← Choose Category
          </button>
          <div className="chat-topic">
            <span className="chat-topic-label">Category:</span>
            <span className="chat-topic-value">
              {categories.find((item) => item.key === selectedCategory)?.title}
            </span>
          </div>
        </div>
        <div className="chat-header-right">
          <div className="select-group">
            <label className="select-label" htmlFor="model-select">
              Model
            </label>
            <select
              id="model-select"
              className="select-control"
              value={selectedModel}
              onChange={onModelChange}
              disabled={isSending}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <div className="select-group">
            <label className="select-label" htmlFor="language-select">
              Language
            </label>
            <select
              id="language-select"
              className="select-control"
              value={selectedLanguage}
              onChange={onLanguageChange}
              disabled={isSending}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="chat-window" aria-live="polite" ref={chatWindowRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2>Say hello!</h2>
            <p>
              Ask anything related to the selected category to begin the
              conversation.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const displayText = getDisplayText(message);

            return (
              <MessageItem
                key={message.id}
                message={message}
                displayText={displayText}
                speechSynthesisSupported={speechSynthesisSupported}
                activeSpeechId={activeSpeechId}
                selectedLanguage={selectedLanguage}
                onPlayMessage={handlePlayMessage}
                onPause={handlePause}
              />
            );
          })
        )}
        {(isSending || isTranslating) && (
          <div className="chat-status">
            {isSending && <span>Agent is typing…</span>}
            {isTranslating && selectedLanguage !== "en" && (
              <span>Translating…</span>
            )}
          </div>
        )}
      </section>

      <footer className="chat-input">
        <form className="chat-form" onSubmit={onSubmit}>
          <textarea
            className="chat-textarea"
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder="Type your message…"
            rows={1}
            aria-label="Chat message input"
          />
          <button
            type="submit"
            className="primary-button"
            disabled={isSending || !inputValue.trim()}
          >
            Send
          </button>
        </form>
        <p className="input-hint">
          Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd>{" "}
          for a new line
        </p>
      </footer>
    </div>
  );
};
