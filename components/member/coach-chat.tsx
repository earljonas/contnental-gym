"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "radix-ui";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CoachContext {
  firstName: string;
  membershipStatus: string | null;
  planName: string | null;
  daysLeft: number | null;
  streak: number;
  sessionsThisWeek: number;
  weeklyGoal: number;
  recentSessions: {
    date: string;
    routineName: string | null;
    totalVolume: number;
    durationMin: number;
    exercises: { name: string; sets: { weight: number; reps: number }[] }[];
  }[];
}

interface CoachChatProps {
  open: boolean;
  onClose: () => void;
  context: CoachContext;
}

const SUGGESTIONS = [
  "What should I train today?",
  "Am I overtraining?",
  "How can I break my plateau?",
  "Review my workout split",
];

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function CoachChat({ open, onClose, context }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsStreaming(true);

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(
            errBody?.error ?? `Request failed (${res.status})`
          );
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const dataLine = line.replace(/^data: /, "");
            if (!dataLine) continue;

            try {
              const parsed = JSON.parse(dataLine);
              if (parsed.token) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.token }
                      : m
                  )
                );
              }
            } catch {
              // skip
            }
          }
        }
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Something went wrong";
        setError(errMsg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, context]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex flex-col bg-card text-foreground shadow-xl outline-none",
            "transition duration-200 ease-in-out",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            // mobile: bottom sheet
            "inset-x-0 bottom-0 h-[85vh] max-h-[85vh] rounded-t-2xl data-open:slide-in-from-bottom-10 data-closed:slide-out-to-bottom-10",
            // desktop: modal
            "md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:h-[680px] md:max-h-[80vh] md:w-[520px] md:rounded-2xl md:border md:border-border"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C9973E]/10">
                <Sparkles className="size-4 text-[#C9973E]" />
              </div>
              <div>
                <Dialog.Title className="font-display text-base font-black uppercase tracking-tight text-foreground">
                  AI Coach
                </Dialog.Title>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Powered by Llama 3.1
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          >
            {messages.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center pt-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C9973E]/10">
                  <Sparkles className="size-8 text-[#C9973E]" />
                </div>
                <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">
                  Hey {context.firstName}
                </p>
                <p className="mt-1 max-w-[280px] text-[13px] text-muted-foreground">
                  I know your workout history. Ask me anything about training,
                  recovery, or your progress.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="rounded-full border border-border bg-card px-3.5 py-2 text-[12px] font-medium text-foreground transition-all hover:border-[#C9973E]/40 hover:bg-[#C9973E]/5 active:scale-[0.97]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-[#C9973E] text-black"
                      : "border border-border bg-muted/30 text-foreground"
                  )}
                >
                  {msg.role === "assistant" && msg.content === "" && isStreaming ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin text-[#C9973E]" />
                      <span className="text-[12px] text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {msg.role === "assistant"
                        ? renderContent(msg.content)
                        : msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-[13px] font-medium text-red-500">
                    Connection Error
                  </p>
                  <p className="mt-0.5 text-[12px] text-red-500/70">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your coach..."
                disabled={isStreaming}
                className="h-11 flex-1 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="h-11 w-11 shrink-0 rounded-xl bg-[#C9973E] p-0 text-black transition-all hover:bg-[#B8882F] disabled:opacity-40"
              >
                {isStreaming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
