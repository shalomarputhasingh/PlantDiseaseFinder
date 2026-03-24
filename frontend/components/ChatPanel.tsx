"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  classificationResult: {
    cleanDiseaseName: string;
    healthLevel: string;
    confidence: number;
  };
  language: "en" | "ta";
}

const STARTER_QUESTIONS = [
  "What caused this?",
  "How do I treat it?",
  "Is it serious?",
  "How do I prevent it?",
];

export default function ChatPanel({ classificationResult, language }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function scrollToBottom() {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          classificationResult,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Add empty assistant message that will be filled by stream
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + chunk,
            };
          }
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "600px",
        minHeight: "500px",
        maxHeight: "700px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          backgroundColor: "#1a3c2b",
          color: "#ffffff",
          padding: "16px",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            margin: "0 0 4px 0",
            lineHeight: 1.3,
          }}
        >
          🌿 Plant Assistant
        </p>
        <p
          style={{
            fontSize: "0.8125rem",
            margin: 0,
            opacity: 0.8,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {classificationResult.healthLevel} · {classificationResult.confidence}%
        </p>
      </div>

      {/* ── Messages area ── */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "scroll",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.length === 0 ? (
          /* Starter chips */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flex: 1,
              paddingTop: "16px",
              paddingBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                margin: 0,
                textAlign: "center",
              }}
            >
              Ask me anything about this condition
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              {STARTER_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  disabled={isLoading}
                  style={{
                    border: "1px solid #2d5a40",
                    color: "#1a3c2b",
                    backgroundColor: "#ffffff",
                    borderRadius: "999px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    fontSize: "0.875rem",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    transition: "background-color 0.15s",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f0fdf4";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    backgroundColor: msg.role === "user" ? "#1a3c2b" : "#f3f4f6",
                    color: msg.role === "user" ? "#ffffff" : "#1a1a1a",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    maxWidth: msg.role === "user" ? "75%" : "85%",
                    padding: "10px 14px",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: "999px",
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  aria-label="Loading response"
                  role="status"
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "9999px",
                      backgroundColor: "#6b7280",
                      animation: "dotBounce 0.9s ease-in-out infinite",
                      animationDelay: "0s",
                    }}
                  />
                  <span
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "9999px",
                      backgroundColor: "#6b7280",
                      animation: "dotBounce 0.9s ease-in-out infinite",
                      animationDelay: "0.15s",
                    }}
                  />
                  <span
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "9999px",
                      backgroundColor: "#6b7280",
                      animation: "dotBounce 0.9s ease-in-out infinite",
                      animationDelay: "0.3s",
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Input area ── */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "12px",
          flexShrink: 0,
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-grow textarea
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this condition..."
          rows={1}
          style={{
            flex: 1,
            border: "1px solid #d1d5db",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "14px",
            fontFamily: "inherit",
            resize: "none",
            maxHeight: "100px",
            outline: "none",
            lineHeight: 1.5,
            color: "#1a1a1a",
            backgroundColor: "#ffffff",
            transition: "border-color 0.15s",
            overflow: "auto",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLTextAreaElement).style.borderColor = "#7ab648";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLTextAreaElement).style.borderColor = "#d1d5db";
          }}
          disabled={isLoading}
          aria-label="Message input"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          style={{
            backgroundColor: "#1a3c2b",
            color: "#ffffff",
            borderRadius: "12px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "10px",
            paddingBottom: "10px",
            border: "none",
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "inherit",
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            transition: "opacity 0.15s, background-color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isLoading && input.trim()) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2d5a40";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1a3c2b";
          }}
          aria-label="Send message"
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
