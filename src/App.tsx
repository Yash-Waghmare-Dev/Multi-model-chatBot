import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
} from "react";
import "./App.css";
import type { CategoryKey } from "./types";
import { CategorySelection } from "./components/CategorySelection";
import { ChatLayout } from "./components/ChatLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useChat } from "./hooks/useChat";
import { useSpeech } from "./hooks/useSpeech";

function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const { messages, isSending, sendMessage, clearMessages } = useChat();
  const { cleanup } = useSpeech(selectedLanguage);

  const handleCategorySelect = (category: CategoryKey) => {
    setSelectedCategory(category);
    clearMessages();
  };

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isSending) {
      void sendMessage(selectedCategory, inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isSending) {
        void sendMessage(selectedCategory, inputValue);
        setInputValue("");
      }
    }
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(event.target.value);
  };

  const handleReset = () => {
    setSelectedCategory(null);
    clearMessages();
    setInputValue("");
    cleanup();
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const isChatActive = Boolean(selectedCategory);

  return (
    <ErrorBoundary>
      <div className="app">
        {!isChatActive ? (
          <CategorySelection onSelectCategory={handleCategorySelect} />
        ) : selectedCategory ? (
          <ChatLayout
            selectedCategory={selectedCategory}
            messages={messages}
            inputValue={inputValue}
            isSending={isSending}
            selectedLanguage={selectedLanguage}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            onLanguageChange={handleLanguageChange}
            onReset={handleReset}
          />
        ) : null}
      </div>
    </ErrorBoundary>
  );
}

export default App;
