import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import './App.css'

type CategoryKey = 'share-market' | 'astrology' | 'wellness'

type MessageRole = 'user' | 'agent'

interface Message {
  id: string
  role: MessageRole
  text: string
  translations: Record<string, string>
}

const getWebhookUrl = () => {
  if (import.meta.env.DEV) {
    return '/api/chat'
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/api/chat'
    }
  }

  return 'https://n8n.srv650558.hstgr.cloud/webhook/3967230f-99b6-4a50-b049-be711b89c3b3'
}

const WEBHOOK_URL = getWebhookUrl()

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY as string | undefined

const categories: { key: CategoryKey; title: string; description: string }[] = [
  {
    key: 'share-market',
    title: 'Share Market',
    description: 'Get insights, market trends, and portfolio guidance tailored to you.',
  },
  {
    key: 'astrology',
    title: 'Astrology',
    description: 'Explore celestial guidance, horoscope readings, and personalized astrological advice.',
  },
  {
    key: 'wellness',
    title: 'Wellness',
    description: 'Receive tips on mindfulness, nutrition, fitness, and holistic wellbeing.',
  },
]

const languages = [
  { code: 'en', label: 'English', voice: 'en-US' },
  { code: 'hi', label: 'Hindi', voice: 'hi-IN' },
  { code: 'mr', label: 'Marathi', voice: 'mr-IN' },
  { code: 'bn', label: 'Bengali', voice: 'bn-IN' },
  { code: 'ta', label: 'Tamil', voice: 'ta-IN' },
  { code: 'te', label: 'Telugu', voice: 'te-IN' },
]

function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const chatWindowRef = useRef<HTMLDivElement | null>(null)

  const speechSynthesisSupported = useMemo(() => typeof window !== 'undefined' && 'speechSynthesis' in window, [])

  const handleCategorySelect = (category: CategoryKey) => {
    setSelectedCategory(category)
    setMessages([])
  }

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value)
  }

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const sendMessage = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || !selectedCategory) {
      return
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      translations: {},
    }

    appendMessage(userMessage)
    setInputValue('')
    setIsSending(true)

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: selectedCategory, text: trimmed }),
      })

      const parseResponse = async () => {
        const contentType = response.headers.get('Content-Type') || ''

        if (contentType.includes('application/json')) {
          return response.json()
        }

        if (contentType.includes('text/')) {
          const text = await response.text()
          try {
            return JSON.parse(text)
          } catch {
            return { output: text }
          }
        }

        return {}
      }

      const data = await parseResponse()

      if (!response.ok) {
        const errorText = typeof data === 'object' && data && 'error' in data ? (data as { error: string }).error : null
        throw new Error(errorText || 'Failed to fetch agent response.')
      }

      const agentText = typeof data === 'object' && data && 'output' in data && typeof (data as { output: unknown }).output === 'string'
        ? (data as { output: string }).output
        : typeof data === 'string'
          ? data
          : 'No response received.'

      appendMessage({
        id: crypto.randomUUID(),
        role: 'agent',
        text: agentText,
        translations: {},
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred.'
      appendMessage({
        id: crypto.randomUUID(),
        role: 'agent',
        text: `Sorry, I ran into an issue: ${errorMessage}`,
        translations: {},
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isSending) {
      void sendMessage()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!isSending) {
        void sendMessage()
      }
    }
  }

  const translateText = async (text: string, targetLanguage: string) => {
    if (!text.trim()) {
      return text
    }

    if (!GOOGLE_TRANSLATE_API_KEY || targetLanguage === 'en') {
      return text
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            target: targetLanguage,
            format: 'text',
          }),
        },
      )

      const data = await response.json()
      const translated = data?.data?.translations?.[0]?.translatedText
      return typeof translated === 'string' ? translated : text
    } catch (error) {
      console.error('Translation error', error)
      return text
    }
  }

  useEffect(() => {
    if (selectedLanguage === 'en') {
      return
    }

    const untranslated = messages.filter((message) => !message.translations[selectedLanguage])

    if (!untranslated.length) {
      return
    }

    let cancelled = false
    setIsTranslating(true)

    const translatePending = async () => {
      const updates = await Promise.all(
        untranslated.map(async (message) => ({
          id: message.id,
          translated: await translateText(message.text, selectedLanguage),
        })),
      )

      if (cancelled) {
        return
      }

      setMessages((prev) =>
        prev.map((message) => {
          const update = updates.find((item) => item.id === message.id)
          if (!update) {
            return message
          }
          return {
            ...message,
            translations: {
              ...message.translations,
              [selectedLanguage]: update.translated,
            },
          }
        }),
      )

      setIsTranslating(false)
    }

    void translatePending()

    return () => {
      cancelled = true
    }
  }, [messages, selectedLanguage])

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const language = event.target.value
    setSelectedLanguage(language)
    if (language === 'en') {
      setIsTranslating(false)
    }
  }

  const getDisplayText = (message: Message) => {
    if (selectedLanguage === 'en') {
      return message.text
    }
    return message.translations[selectedLanguage] ?? message.text
  }

  const getVoiceLocale = (languageCode: string) => {
    const language = languages.find((item) => item.code === languageCode)
    return language?.voice ?? 'en-US'
  }

  const handlePlayMessage = (message: Message) => {
    if (!speechSynthesisSupported) {
      return
    }

    const synth = window.speechSynthesis

    if (activeSpeechId === message.id && synth.paused) {
      synth.resume()
      return
    }

    const textToSpeak = getDisplayText(message)
    if (!textToSpeak.trim()) {
      return
    }

    if (synth.speaking) {
      synth.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = getVoiceLocale(selectedLanguage)
    utterance.onend = () => {
      setActiveSpeechId(null)
      utteranceRef.current = null
    }
    utterance.onerror = () => {
      setActiveSpeechId(null)
      utteranceRef.current = null
    }

    utteranceRef.current = utterance
    setActiveSpeechId(message.id)
    synth.speak(utterance)
  }

  const handlePause = () => {
    if (!speechSynthesisSupported) {
      return
    }

    const synth = window.speechSynthesis
    if (synth.speaking && !synth.paused) {
      synth.pause()
    }
  }

  const resetConversation = () => {
    setSelectedCategory(null)
    setMessages([])
    setInputValue('')
    setIsSending(false)
    setActiveSpeechId(null)
    if (speechSynthesisSupported) {
      window.speechSynthesis.cancel()
    }
  }

  useEffect(() => {
    if (!chatWindowRef.current) {
      return
    }

    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
  }, [messages, isSending])

  useEffect(() => {
    return () => {
      if (speechSynthesisSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [speechSynthesisSupported])

  const isChatActive = Boolean(selectedCategory)

  return (
    <div className="app">
      {!isChatActive ? (
        <section className="category-selection">
          <header className="section-header">
            <h1>n8n Agent Assistant</h1>
            <p>Select a category to start chatting with a specialized agent.</p>
          </header>
          <div className="category-grid">
            {categories.map((category) => (
              <article key={category.key} className="category-card">
                <div className="card-body">
                  <h2>{category.title}</h2>
                  <p>{category.description}</p>
                </div>
                <button type="button" className="primary-button" onClick={() => handleCategorySelect(category.key)}>
                  Start Chat
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className="chat-layout">
          <header className="chat-header">
            <div className="chat-header-left">
              <button type="button" className="link-button" onClick={resetConversation}>
                ← Choose Category
              </button>
              <div className="chat-topic">
                <span className="chat-topic-label">Category:</span>
                <span className="chat-topic-value">{categories.find((item) => item.key === selectedCategory)?.title}</span>
              </div>
            </div>
            <div className="chat-header-right">
              <label className="language-label" htmlFor="language-select">
                Language
              </label>
              <select id="language-select" className="language-select" value={selectedLanguage} onChange={handleLanguageChange}>
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <section className="chat-window" aria-live="polite" ref={chatWindowRef}>
            {messages.length === 0 ? (
              <div className="empty-state">
                <h2>Say hello!</h2>
                <p>Ask anything related to the selected category to begin the conversation.</p>
              </div>
            ) : (
              messages.map((message) => {
                const displayText = getDisplayText(message)
                const showAudioControls = message.role === 'agent' && speechSynthesisSupported

                return (
                  <div key={message.id} className={`message ${message.role}`}>
                    <div className="message-bubble">
                      <div className="message-text">{displayText}</div>
                      {selectedLanguage !== 'en' && message.translations[selectedLanguage] && (
                        <span className="translation-badge">Translated</span>
                      )}
                      {showAudioControls && (
                        <div className="audio-controls">
                          <button type="button" className="icon-button" onClick={() => handlePlayMessage(message)}>
                            ▶
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={handlePause}
                            disabled={activeSpeechId !== message.id}
                          >
                            ⏸
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            {(isSending || isTranslating) && (
              <div className="chat-status">
                {isSending && <span>Agent is typing…</span>}
                {isTranslating && selectedLanguage !== 'en' && <span>Translating…</span>}
              </div>
            )}
          </section>

          <footer className="chat-input">
            <form className="chat-form" onSubmit={handleSubmit}>
              <textarea
                className="chat-textarea"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message…"
                rows={1}
                aria-label="Chat message input"
              />
              <button type="submit" className="primary-button" disabled={isSending || !inputValue.trim()}>
                Send
              </button>
            </form>
            <p className="input-hint">
              Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
            </p>
          </footer>
        </div>
      )}
    </div>
  )
}

export default App
