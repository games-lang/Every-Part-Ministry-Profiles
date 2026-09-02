import { FormEvent, useState } from "react";
import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import { useChatWithProfileHelper } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type HelperMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestedQuestions = [
  "Give me three thoughtful questions for our conversation.",
  "What themes could I explore without making assumptions?",
  "How can I affirm what this person shared?",
];

export function ProfileHelper({
  profileId,
  memberName,
}: {
  profileId: number;
  memberName: string;
}) {
  const [messages, setMessages] = useState<HelperMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const helper = useChatWithProfileHelper();

  function send(content: string) {
    const question = content.trim();
    if (!question || helper.isPending) return;

    const userMessage: HelperMessage = { role: "user", content: question };
    const conversation = [...messages, userMessage].slice(-8);
    setMessages(conversation);
    setDraft("");
    setError(null);
    helper.mutate(
      { id: profileId, data: { messages: conversation } },
      {
        onSuccess: ({ answer }) => {
          setMessages((current) => [
            ...current,
            { role: "assistant", content: answer },
          ]);
        },
        onError: () => {
          setError("The profile helper is unavailable right now. Please try again.");
        },
      },
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  return (
    <section className="no-print space-y-3" aria-labelledby="profile-helper-title">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="profile-helper-title" className="font-serif text-2xl font-medium">
          Profile helper
        </h2>
        <Badge variant="outline" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI-assisted
        </Badge>
      </div>
      <Card className="overflow-hidden border-secondary/35 shadow-sm">
        <div className="bg-secondary/10 px-5 py-5 md:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-medium">Prepare for a conversation with {memberName}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Ask for thoughtful questions, themes to explore, or ways to affirm what
                this person shared. The helper will not make placement or calling decisions.
              </p>
            </div>
          </div>
        </div>
        <CardContent className="space-y-5 p-5 md:p-6">
          {messages.length === 0 ? (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[.08em] text-muted-foreground">
                Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => send(question)}
                    disabled={helper.isPending}
                    className="rounded-full border border-border bg-background px-3.5 py-2 text-left text-sm transition hover:border-secondary hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto rounded-2xl bg-muted/35 p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-2.5 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
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
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                      message.role === "assistant"
                        ? "rounded-tl-md bg-card"
                        : "rounded-tr-md bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
              ))}
              {helper.isPending && (
                <div className="flex items-center gap-2 pl-10 text-sm text-muted-foreground" aria-live="polite">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing a thoughtful response…
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-2">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 1500))}
                placeholder="Ask about conversation themes or questions…"
                rows={2}
                disabled={helper.isPending}
                className="min-h-12 resize-none rounded-xl"
                aria-label={`Ask the profile helper about ${memberName}`}
              />
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-xl"
                disabled={!draft.trim() || helper.isPending}
                aria-label="Send profile helper question"
              >
                {helper.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Uses selected profile signals only—not names, contact details, private notes,
              life experiences, or spiritual-health responses. AI can make mistakes.
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}