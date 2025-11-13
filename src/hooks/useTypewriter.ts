import { useEffect, useState } from "react";

/**
 * Hook for typing animation effect
 * Gradually displays text character by character
 */
export const useTypewriter = (
  text: string,
  speed: number = 30
) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Combined effect that handles both animation and reset
  useEffect(() => {
    // Reset state when text changes
    setDisplayedText("");
    setIsTyping(true);

    // If text is empty, stop immediately
    if (!text) {
      setIsTyping(false);
      return;
    }

    // Set up animation loop
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex <= text.length) {
        setDisplayedText(text.substring(0, currentIndex));
      }
      if (currentIndex >= text.length) {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return {
    displayedText,
    isTyping,
  };
};
