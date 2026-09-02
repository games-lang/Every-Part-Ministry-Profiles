import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  ExternalLink,
  LoaderCircle,
  Puzzle,
  Search,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  useChatWithPartFinder,
  type PartFinderRecommendation,
} from "@workspace/api-client-react";
import { Link } from "wouter";
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

type PartFinderMessage = {
  role: "user" | "assistant";
  content: string;
  recommendations?: PartFinderRecommendation[];
  advisory?: string;
};

const welcomeMessage: PartFinderMessage = {
  role: "assistant",
  content:
    "Meet PartFinder\n\nYour ministry placement assistant.\n\nAsk about your people, ministry needs, volunteer opportunities, leadership development, and church-wide serving trends. PartFinder helps you discover possible connections while leaving final decisions to prayer, pastoral wisdom, and personal conversation.",
};

const starterQuestions = [
  "Find volunteers for kids ministry",
  "Build a potential hospitality team",
  "Who completed a profile but is not serving?",
  "What serving trends do you see in our church?",
];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "PartFinder is unavailable right now. Please try again.";
}

export function PartFinderAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<PartFinderMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const partFinder = useChatWithPartFinder();

  useEffect(() => {
    const node = conversationRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, partFinder.isPending]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || partFinder.isPending) return;

    const userMessage: PartFinderMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage].slice(-10);
    setMessages(nextMessages);
    setDraft("");
    setError(null);

    try {
      const response = await partFinder.mutateAsync({
        data: {
          messages: nextMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        },
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          recommendations: response.recommendations,
          advisory: response.advisory,
        },
      ]);
    } catch (caught) {
      setError(getErrorMessage(caught));
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
          aria-label="Open PartFinder"
          data-testid="button-open-partfinder"
        >
          <span className="relative mr-2">
            <Puzzle className="h-5 w-5" />
            <Search className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary" />
          </span>
          Ask PartFinder
        </Button>
      </DialogTrigger>

      <DialogContent
        className="bottom-20 left-auto right-4 top-auto grid h-[min(760px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-xl translate-x-0 translate-y-0 grid-rows-[auto_1fr_auto] gap-0 overflow-hidden rounded-3xl border-border/80 bg-card p-0 shadow-2xl sm:right-6"
        data-testid="dialog-partfinder"
      >
        <DialogHeader className="border-b border-border/70 bg-primary px-5 py-5 pr-12 text-left text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Puzzle className="h-6 w-6" />
              <Sparkles className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-card p-0.5 text-accent" />
            </span>
            <div>
              <DialogTitle className="font-serif text-xl">PartFinder</DialogTitle>
              <DialogDescription className="mt-1 text-primary-foreground/75">
                Ministry discovery for your church
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={conversationRef}
          className="overflow-y-auto px-4 py-5"
          aria-live="polite"
          aria-busy={partFinder.isPending}
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="space-y-3">
                <div
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
                    className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                      message.role === "assistant"
                        ? "rounded-tl-md bg-muted text-foreground"
                        : "rounded-tr-md bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {message.recommendations?.length ? (
                  <div className="space-y-3 pl-10">
                    {message.recommendations.map((candidate) => (
                      <article
                        key={candidate.id}
                        className="rounded-2xl border border-border/80 bg-background p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">
                              {candidate.memberName}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
                              {candidate.matchLabel}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            asChild
                          >
                            <Link
                              href={`/profiles/${candidate.id}`}
                              onClick={() => setOpen(false)}
                            >
                              View profile
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-muted-foreground">
                          Why PartFinder suggested this person
                        </p>
                        <ul className="mt-1.5 space-y-1 text-sm leading-5 text-foreground">
                          {candidate.reasons.map((reason) => (
                            <li key={reason} className="flex gap-2">
                              <span className="text-accent">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                ) : null}

                {message.advisory ? (
                  <p className="ml-10 rounded-xl border border-secondary/60 bg-secondary/10 px-3 py-2 text-xs leading-5 text-muted-foreground">
                    {message.advisory}
                  </p>
                ) : null}
              </div>
            ))}

            {messages.length === 1 && (
              <div className="grid gap-2 pl-10 sm:grid-cols-2">
                {starterQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void sendMessage(question)}
                    className="rounded-2xl border border-border bg-background px-3 py-2.5 text-left text-xs font-medium leading-5 text-foreground transition hover:border-accent hover:bg-muted"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {partFinder.isPending && (
              <div className="flex items-center gap-2 pl-10 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Looking for helpful connections…
              </div>
            )}

            {error && (
              <div
                className="ml-10 rounded-2xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
                role="alert"
              >
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
              placeholder="Describe a ministry need or ask about your people…"
              rows={2}
              disabled={partFinder.isPending}
              className="max-h-32 min-h-12 resize-none rounded-2xl bg-card px-3.5 py-3"
              aria-label="Message PartFinder"
              data-testid="textarea-partfinder"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || partFinder.isPending}
              className="h-12 w-12 shrink-0 rounded-2xl"
              aria-label="Send message"
              data-testid="button-send-partfinder"
            >
              {partFinder.isPending ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="mt-2 px-1 text-[11px] leading-4 text-muted-foreground">
            Adult profiles only. PartFinder is advisory and never makes placement,
            calling, eligibility, or safeguarding decisions.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}