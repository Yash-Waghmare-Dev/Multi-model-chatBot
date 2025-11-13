import { useCallback, useMemo, useRef, useState } from "react";
import { languages } from "../constants";
import type { Message } from "../types";

export const useSpeech = (selectedLanguage: string) => {
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speechSynthesisSupported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    []
  );

  const getVoiceLocale = useCallback((languageCode: string) => {
    const language = languages.find((item) => item.code === languageCode);
    return language?.voice ?? "en-US";
  }, []);

  const handlePlayMessage = useCallback(
    (message: Message, displayText: string) => {
      if (!speechSynthesisSupported) {
        return;
      }

      const synth = window.speechSynthesis;

      if (activeSpeechId === message.id && synth.paused) {
        synth.resume();
        return;
      }

      if (!displayText.trim()) {
        return;
      }

      if (synth.speaking) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(displayText);
      utterance.lang = getVoiceLocale(selectedLanguage);
      utterance.onend = () => {
        setActiveSpeechId(null);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setActiveSpeechId(null);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      setActiveSpeechId(message.id);
      synth.speak(utterance);
    },
    [activeSpeechId, selectedLanguage, speechSynthesisSupported, getVoiceLocale]
  );

  const handlePause = useCallback(() => {
    if (!speechSynthesisSupported) {
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
    }
  }, [speechSynthesisSupported]);

  const cleanup = useCallback(() => {
    if (speechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
  }, [speechSynthesisSupported]);

  return {
    activeSpeechId,
    speechSynthesisSupported,
    handlePlayMessage,
    handlePause,
    cleanup,
  };
};
