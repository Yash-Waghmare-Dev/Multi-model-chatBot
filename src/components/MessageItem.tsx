import type { ReactNode } from "react";
import { useTypewriter } from "../hooks/useTypewriter";
import type { Message } from "../types";

interface MessageItemProps {
  message: Message;
  displayText: string;
  speechSynthesisSupported: boolean;
  activeSpeechId: string | null;
  selectedLanguage: string;
  onPlayMessage: (message: Message, displayText: string) => void;
  onPause: () => void;
}

export const MessageItem = ({
  message,
  displayText,
  speechSynthesisSupported,
  activeSpeechId,
  selectedLanguage,
  onPlayMessage,
  onPause,
}: MessageItemProps): ReactNode => {
  const showAudioControls =
    message.role === "agent" && speechSynthesisSupported;

  // Use typing effect for agent messages
  const isAgentMessage = message.role === "agent";
  const { displayedText, isTyping } = useTypewriter(
    displayText,
    isAgentMessage ? 30 : 0
  );

  // For user messages, show full text immediately
  const finalText = isAgentMessage ? displayedText : displayText;

  return (
    <div className={`message ${message.role}`}>
      <div className="message-bubble">
        <div className={`message-text ${isTyping ? "typing" : ""}`}>
          {finalText}
          {isTyping && isAgentMessage && (
            <span className="typing-cursor">▌</span>
          )}
        </div>
        {selectedLanguage !== "en" &&
          message.translations[selectedLanguage] && (
            <span className="translation-badge">Translated</span>
          )}
        {showAudioControls && (
          <div className="audio-controls">
            <button
              type="button"
              className="icon-button"
              onClick={() => onPlayMessage(message, displayText)}
            >
              ▶
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onPause}
              disabled={activeSpeechId !== message.id}
            >
              ⏸
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
