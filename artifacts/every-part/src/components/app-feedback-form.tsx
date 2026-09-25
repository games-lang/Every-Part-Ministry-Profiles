import { useState } from "react";
import { useCreateAppFeedback, type AppFeedbackInput } from "@workspace/api-client-react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppFeedbackFormProps = {
  sourcePage: string;
  className?: string;
};

export function AppFeedbackForm({ sourcePage, className = "" }: AppFeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<"suggestion" | "fix">("suggestion");
  const [category, setCategory] = useState<NonNullable<AppFeedbackInput["category"]>>("other");
  const [feedback, setFeedback] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const feedbackMutation = useCreateAppFeedback();

  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 ${className}`}
      aria-labelledby={`${sourcePage}-feedback-title`}
      data-testid={`card-${sourcePage}-feedback`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-primary" aria-hidden="true">
          <MessageSquarePlus className="h-5 w-5" />
        </span>
        <div>
          <h2 id={`${sourcePage}-feedback-title`} className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Help us make Every Part better
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Have a suggestion or something that needs fixing? Share it with the Every Part team.
          </p>
        </div>
      </div>
      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!feedback.trim() || feedbackMutation.isPending) return;
          feedbackMutation.mutate(
            {
              data: {
                type: feedbackType,
                category,
                message: feedback.trim(),
                contactEmail: contactEmail.trim() || undefined,
                sourcePage,
              },
            },
            {
              onSuccess: () => {
                setFeedback("");
                setContactEmail("");
              },
            },
          );
        }}
      >
        <div>
          <label htmlFor={`${sourcePage}-feedback-type`} className="text-sm font-medium text-foreground">
            What would you like to share?
          </label>
          <select
            id={`${sourcePage}-feedback-type`}
            value={feedbackType}
            onChange={(event) => setFeedbackType(event.target.value as "suggestion" | "fix")}
            className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            data-testid={`select-${sourcePage}-feedback-type`}
          >
            <option value="suggestion">A suggestion</option>
            <option value="fix">A problem to fix</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${sourcePage}-feedback-category`} className="text-sm font-medium text-foreground">
            What is this about?
          </label>
          <select
            id={`${sourcePage}-feedback-category`}
            value={category}
            onChange={(event) => setCategory(event.target.value as NonNullable<AppFeedbackInput["category"]>)}
            className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            data-testid={`select-${sourcePage}-feedback-category`}
          >
            <option value="other">Something else</option>
            <option value="ministry-profile">Ministry Profile</option>
            <option value="pastor-dashboard">Dashboard</option>
            <option value="part-finder">PartFinder</option>
            <option value="church-setup">Church setup</option>
            <option value="member-experience">Member experience</option>
            <option value="privacy-permissions">Privacy or permissions</option>
            <option value="confusing-ux">Something was confusing</option>
            <option value="bug">A technical problem</option>
            <option value="feature-request">Feature request</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${sourcePage}-feedback-email`} className="text-sm font-medium text-foreground">
            Email for a reply{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`${sourcePage}-feedback-email`}
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
            data-testid={`input-${sourcePage}-feedback-email`}
          />
        </div>
        <div>
          <label htmlFor={`${sourcePage}-feedback-message`} className="text-sm font-medium text-foreground">
            Tell us what you’re thinking
          </label>
          <textarea
            id={`${sourcePage}-feedback-message`}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="What would make Every Part more useful or easier to use?"
            rows={4}
            required
            className="mt-2 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
            data-testid={`textarea-${sourcePage}-feedback-message`}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`text-xs leading-5 ${feedbackMutation.isError ? "text-destructive" : feedbackMutation.isSuccess ? "text-primary" : "text-muted-foreground"}`}
            role={feedbackMutation.isError || feedbackMutation.isSuccess ? "status" : undefined}
            data-testid={`status-${sourcePage}-feedback`}
          >
            {feedbackMutation.isError
              ? "We couldn’t save that yet. Please try again."
              : feedbackMutation.isSuccess
                ? "Thanks—your feedback is now with the Every Part team."
                : "Your note goes directly to the Every Part team."}
          </p>
          <Button
            type="submit"
            disabled={!feedback.trim() || feedbackMutation.isPending}
            className="h-11 shrink-0 rounded-full px-5"
            data-testid={`button-send-${sourcePage}-feedback`}
          >
            {feedbackMutation.isPending ? "Saving…" : "Send feedback"}
          </Button>
        </div>
      </form>
    </section>
  );
}