import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, Sparkles, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "Hi—I’m the Every Part Guide. I can explain Ministry Profiles, how churches use Every Part, youth pathways, privacy, and next steps. What would you like to know?",
};

const starterQuestions = [
  "What is a Ministry Profile?",
  "How does Every Part help pastors?",
  "Can members complete a profile without an account?",
];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The assistant is unavailable right now. Please try again.";
}

export function PublicAiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const node = conversationRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, isSending]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage].slice(-12);
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setDraft("");
    setError(null);
    setIsSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "The assistant could not answer right now.");
      }
      if (!response.body) throw new Error("The assistant response could not be read.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedContent = false;

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const data = JSON.parse(dataLine.slice(6)) as {
            content?: string;
            error?: string;
            done?: boolean;
          };
          if (data.error) throw new Error(data.error);
          if (data.content) {
            receivedContent = true;
            setMessages((current) => {
              const updated = [...current];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + data.content,
                };
              }
              return updated;
            });
          }
        }

        if (done) break;
      }

      if (!receivedContent) throw new Error("The assistant did not return an answer.");
    } catch (caught) {
      if (controller.signal.aborted) return;
      setMessages((current) => {
        const last = current[current.length - 1];
        return last?.role === "assistant" && !last.content
          ? current.slice(0, -1)
          : current;
      });
      setError(getErrorMessage(caught));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsSending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim()) void sendMessage(draft);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-13 rounded-full border border-primary-foreground/15 px-5 shadow-xl shadow-primary/20 transition hover:-translate-y-0.5"
          style={{ position: "fixed", bottom: "1.25rem", right: "1.25rem", zIndex: 1000 }}
          aria-label="Ask the Every Part Guide"
          data-testid="button-open-public-assistant"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Ask Every Part
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bottom-20 left-auto right-4 top-auto grid h-[min(680px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-md translate-x-0 translate-y-0 grid-rows-[auto_1fr_auto] gap-0 overflow-hidden rounded-3xl border-border/80 bg-card p-0 shadow-2xl sm:right-6"
        data-testid="dialog-public-assistant"
      >
        <DialogHeader className="border-b border-border/70 bg-primary px-5 py-5 pr-12 text-left text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="font-serif text-xl">Every Part Guide</DialogTitle>
              <DialogDescription className="mt-1 text-primary-foreground/70">
                AI help for questions about Every Part
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={conversationRef}
          className="overflow-y-auto px-4 py-5"
          aria-live="polite"
          aria-busy={isSending}
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-start gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    message.role === "assistant"
                      ? "bg-secondary/25 text-primary"
                      : "bg-primary text-primary-foreground"
                  }`}
                  aria-hidden="true"
                >
                  {message.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </span>
                <div
                  className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "rounded-tl-md bg-muted text-foreground"
                      : "rounded-tr-md bg-primary text-primary-foreground"
                  }`}
                >
                  {message.content ||
                    (isSending && index === messages.length - 1 ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Thinking…
                      </span>
                    ) : null)}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-10">
                {starterQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void sendMessage(question)}
                    className="rounded-full border border-border bg-background px-3 py-2 text-left text-xs font-medium text-foreground transition hover:border-accent hover:bg-muted"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="ml-10 rounded-2xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="border-t border-border/70 bg-background/80 p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 1500))}
              onKeyDown={onKeyDown}
              placeholder="Ask about Every Part…"
              rows={2}
              disabled={isSending}
              className="max-h-32 min-h-12 resize-none rounded-2xl bg-card px-3.5 py-3"
              aria-label="Message the Every Part Guide"
              data-testid="textarea-public-assistant"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || isSending}
              className="h-12 w-12 shrink-0 rounded-2xl"
              aria-label="Send message"
              data-testid="button-send-public-assistant"
            >
              {isSending ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="mt-2 px-1 text-[11px] leading-4 text-muted-foreground">
            AI can make mistakes. Don’t share private or sensitive information.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}