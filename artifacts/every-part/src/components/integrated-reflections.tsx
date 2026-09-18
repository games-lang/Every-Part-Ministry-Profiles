import type { IntegratedAnswers, IntegratedQuestionView } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import type { Attempt, DraftConflict } from "@/hooks/use-integrated-attempt";

export const INTEGRATED_ROUND_SIZE = 8;
export const isOptionalReflection = (question: IntegratedQuestionView) => question.responseModel === "specialExperienceLikert";

export function IntegratedReflections({ attempt, questions, answers, offset = 0, onAnswer }: {
  attempt: Attempt;
  questions: IntegratedQuestionView[];
  answers: IntegratedAnswers;
  offset?: number;
  onAnswer: (id: string, value: IntegratedAnswers[string]) => void;
}) {
  const models = attempt.responseModels as Record<string, { anchors?: string[]; na?: string; instructions?: string }>;
  return <div className="space-y-10">
    {questions.map((question, index) => {
      const model = models[question.responseModel];
      const isLegacySocialEnergyQuestion = question.id === "EP-I-58";
      const questionText = isLegacySocialEnergyQuestion
        ? "After a busy week, which usually helps you recover your energy?"
        : question.text;
      const poles = isLegacySocialEnergyQuestion
        ? ["Quiet time by myself", "Time with other people"] as const
        : question.poles;
      const anchors = model?.anchors ?? [];
      const responseLabel = (value: 1 | 2 | 3 | 4 | 5) => {
        if (!poles) return anchors[value - 1] ?? String(value);
        if (value === 1) return `Definitely: ${poles[0]}`;
        if (value === 2) return `Usually: ${poles[0]}`;
        if (value === 3) return "Both equally / it depends";
        if (value === 4) return `Usually: ${poles[1]}`;
        return `Definitely: ${poles[1]}`;
      };
      return <fieldset id={`integrated-question-${question.id}`} key={question.id} className="space-y-4">
        <legend className="text-lg font-serif leading-relaxed">{offset + index + 1}. {questionText}</legend>
        {model?.instructions && <p className="text-sm text-muted-foreground">{model.instructions}</p>}
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Responses to reflection ${offset + index + 1}`}>
          {([1, 2, 3, 4, 5, "na", "skip"] as const).map((value) => {
            const label = value === "skip"
              ? "Skip"
              : value === "na"
                ? question.responseModel === "personalityBipolar" ? "N/A — Not sure" : model?.na ?? "N/A"
                : responseLabel(value);
            return <Button key={value} type="button" variant={answers[question.id] === value ? "default" : "outline"}
              className="h-auto min-h-11 whitespace-normal text-left" aria-pressed={answers[question.id] === value}
              onClick={() => onAnswer(question.id, value)}>{label}</Button>;
          })}
        </div>
      </fieldset>;
    })}
  </div>;
}

export function IntegratedConflict({ conflict, answers, onResolve }: {
  conflict: DraftConflict;
  answers: IntegratedAnswers;
  onResolve: (choice: "local" | "server") => void;
}) {
  const server = conflict.server;
  return <section role="alert" className="space-y-4 rounded-xl border border-destructive/40 p-4">
    <h3 className="font-semibold">Two copies of your draft need your review</h3>
    <p className="text-sm">Nothing has replaced your local answers. Compare both copies below. Choosing a copy is explicit; the other is retained in this device’s backup until you finish or discard this draft.</p>
    {server.status === "completed" ? <>
      <p>This attempt was already submitted. It cannot be edited or submitted as another profile.</p>
      <Button type="button" onClick={() => onResolve("server")}>Clear completed draft</Button>
    </> : <>
      <details>
        <summary className="cursor-pointer font-medium">Compare answers and form progress</summary>
        <div className="mt-3 max-h-80 overflow-auto space-y-3 text-sm">
          {server.questions.filter(q => answers[q.id] !== server.answers[q.id]).map(q => <div key={q.id}>
            <p>{q.text}</p><p>Your device: {answers[q.id] ?? "Unanswered"} · Server: {server.answers[q.id] ?? "Unanswered"}</p>
          </div>)}
          <p className="font-semibold">Your device’s form progress</p>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(conflict.local.formState, null, 2)}</pre>
          <p className="font-semibold">Server form progress</p>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(server.formState, null, 2)}</pre>
        </div>
      </details>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => onResolve("local")}>Keep my local copy and retry</Button>
        <Button type="button" variant="outline" onClick={() => {
          if (window.confirm("Use the server’s answers and form progress instead of the copy currently on this screen?")) onResolve("server");
        }}>Use the server copy</Button>
      </div>
    </>}
  </section>;
}