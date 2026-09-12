import { useState, useEffect } from "react";
import {
  useGetPastorNote,
  useUpdatePastorNote,
  getGetPastorNoteQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Lock, CheckCircle2, Save } from "lucide-react";

const emptyNote = {
  whatIHeard: "",
  bringsLife: "",
  areasToExplore: "",
  areasToAvoidForNow: "",
  trainingNeeded: "",
  nextStep: "",
  followUpDate: "",
};

export function PastorNotesEditor({ profileId }: { profileId: number }) {
  const queryClient = useQueryClient();
  const { data: note, isLoading, isError } = useGetPastorNote(profileId);
  const updateNote = useUpdatePastorNote();

  const [formData, setFormData] = useState(emptyNote);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    if (note) {
      setFormData({
        whatIHeard: note.whatIHeard || "",
        bringsLife: note.bringsLife || "",
        areasToExplore: note.areasToExplore || "",
        areasToAvoidForNow: note.areasToAvoidForNow || "",
        trainingNeeded: note.trainingNeeded || "",
        nextStep: note.nextStep || "",
        followUpDate: note.followUpDate || "",
      });
      setDirty(false);
      setSaveStatus("idle");
    }
  }, [note, profileId]);

  function saveNote() {
    if (!dirty || updateNote.isPending) return;
    setSaveStatus("saving");
    updateNote.mutate(
      {
        id: profileId,
        data: { ...formData, followUpDate: formData.followUpDate || null },
      },
      {
        onSuccess: (updatedNote) => {
          queryClient.setQueryData(
            getGetPastorNoteQueryKey(profileId),
            updatedNote,
          );
          setDirty(false);
          setSaveStatus("saved");
        },
        onError: () => setSaveStatus("error"),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-card shadow-sm no-print">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 text-sm text-destructive shadow-sm no-print">
        Unable to load notes. Please refresh the page.
      </div>
    );
  }

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setDirty(true);
    setSaveStatus("idle");
  };

  return (
    <Card className="border-border/60 bg-card shadow-sm no-print">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lock className="h-4 w-4" />
          Private Pastor Notes
        </div>
        <div className="flex items-center gap-2 text-xs">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          {dirty && saveStatus === "idle" && (
            <span className="text-muted-foreground">Unsaved changes</span>
          )}
        </div>
      </div>
      <CardContent className="space-y-6 p-5">
        <p className="text-sm text-muted-foreground">
          These notes are private to you. They are never visible to the profile owner or included in printed materials.
          Saving them does not change any assessment answer.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatIHeard">What I Heard</Label>
            <Textarea
              id="whatIHeard"
              placeholder="Key takeaways from your conversation..."
              className="min-h-[100px] resize-y"
              value={formData.whatIHeard}
              onChange={handleChange("whatIHeard")}
              maxLength={5000}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bringsLife">What Brings Them Life?</Label>
              <Textarea
                id="bringsLife"
                placeholder="Where do they seem energized?"
                className="min-h-[80px] resize-y"
                value={formData.bringsLife}
                onChange={handleChange("bringsLife")}
                maxLength={5000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areasToExplore">Areas to Explore</Label>
              <Textarea
                id="areasToExplore"
                placeholder="Specific teams or ministries..."
                className="min-h-[80px] resize-y"
                value={formData.areasToExplore}
                onChange={handleChange("areasToExplore")}
                maxLength={5000}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="areasToAvoidForNow">Areas to Avoid For Now</Label>
              <Textarea
                id="areasToAvoidForNow"
                placeholder="Not a great fit or poor timing..."
                className="min-h-[80px] resize-y"
                value={formData.areasToAvoidForNow}
                onChange={handleChange("areasToAvoidForNow")}
                maxLength={5000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainingNeeded">Training or Development Needed</Label>
              <Textarea
                id="trainingNeeded"
                placeholder="Skills, shadowing, or discipleship..."
                className="min-h-[80px] resize-y"
                value={formData.trainingNeeded}
                onChange={handleChange("trainingNeeded")}
                maxLength={5000}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <div className="space-y-2">
              <Label htmlFor="nextStep">Next Step</Label>
              <Textarea
                id="nextStep"
                placeholder="Action items for them or you..."
                className="min-h-[80px] resize-y"
                value={formData.nextStep}
                onChange={handleChange("nextStep")}
                maxLength={5000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpDate">Follow-Up Date</Label>
              <Input
                id="followUpDate"
                type="date"
                className="w-full"
                value={formData.followUpDate}
                onChange={handleChange("followUpDate")}
              />
            </div>
          </div>
          {saveStatus === "error" && (
            <p
              className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              Your notes were not saved. Please try again.
            </p>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={saveNote}
              disabled={!dirty || updateNote.isPending}
            >
              {updateNote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save private notes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}