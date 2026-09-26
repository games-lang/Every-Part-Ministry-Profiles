import { useState } from "react";
import {
  getGetDashboardSummaryQueryKey,
  getListProfilesQueryKey,
  getListTeamsQueryKey,
  type MinistryTeam,
  type ProfileListItem,
  type TeamSuggestion,
  useCreateTeam,
  useGenerateTeamSuggestions,
  useListProfiles,
  useListTeams,
  useUpdateProfileTeam,
  useUpdateTeam,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Info,
  Lightbulb,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Users,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/empty-state";
import { TeamSchedule } from "@/components/team-schedule";

type EditorState =
  | {
      mode: "create";
      initial?: { name: string; description: string };
    }
  | { mode: "edit"; team: MinistryTeam }
  | null;

function TeamEditor({
  editor,
  onClose,
}: {
  editor: EditorState;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const team = editor?.mode === "edit" ? editor.team : null;
  const [name, setName] = useState(
    team?.name ?? (editor?.mode === "create" ? editor.initial?.name : "") ?? "",
  );
  const [description, setDescription] = useState(
    team?.description ??
      (editor?.mode === "create" ? editor.initial?.description : "") ??
      "",
  );
  const isPending = createTeam.isPending || updateTeam.isPending;

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() }),
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      }),
    ]);
  };

  const submit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: "Add a team name", variant: "destructive" });
      return;
    }
    const data = {
      name: trimmedName,
      description: description.trim() || null,
    };
    const options = {
      onSuccess: async () => {
        await refresh();
        toast({ title: team ? "Team updated" : "Team created" });
        onClose();
      },
      onError: () => {
        toast({
          title: `Unable to ${team ? "update" : "create"} team`,
          description: "Check the team name and try again.",
          variant: "destructive",
        });
      },
    };
    if (team) {
      updateTeam.mutate({ id: team.id, data }, options);
    } else {
      createTeam.mutate({ data }, options);
    }
  };

  return (
    <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team ? "Edit team" : "Create a team"}</DialogTitle>
          <DialogDescription>
            {editor?.mode === "create" && editor.initial
              ? "Review this AI-generated starting point before creating the team."
              : "Give pastors a clear place to organize people serving together."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder="Kids Ministry"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-description">Description (optional)</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={4}
              placeholder="What this team does and who it serves."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {team ? "Save changes" : "Create team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamSuggestionCard({
  suggestion,
  onDismiss,
  onCreate,
}: {
  suggestion: TeamSuggestion;
  onDismiss: () => void;
  onCreate: () => void;
}) {
  return (
    <Card className="overflow-hidden border-primary/20 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary/30" />
      <CardHeader className="gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-serif text-xl">{suggestion.name}</CardTitle>
            <Badge variant="secondary" className="gap-1 bg-secondary/20 text-foreground">
              <Sparkles className="h-3 w-3" />
              Suggested
            </Badge>
          </div>
          <CardDescription className="mt-2 max-w-2xl leading-relaxed">
            {suggestion.purpose}
          </CardDescription>
        </div>
              <Button variant="ghost" size="sm" onClick={onDismiss} aria-label={`Dismiss ${suggestion.name} suggestion`}>
          Dismiss
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Shared profile signals
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestion.supportingSignals.map((signal) => (
              <Badge key={signal} variant="outline" className="font-normal">
                {signal}
              </Badge>
            ))}
          </div>
        </div>

        {suggestion.candidates.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Profiles to review</p>
              <span className="text-xs text-muted-foreground">
                {suggestion.candidates.length} possible{" "}
                {suggestion.candidates.length === 1 ? "connection" : "connections"}
              </span>
            </div>
            <div className="divide-y rounded-xl border border-border/60 bg-background">
              {suggestion.candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/profiles/${candidate.id}`}
                  className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {candidate.memberName}
                    </Link>
                    <ul className="mt-1 space-y-1 text-xs leading-relaxed text-muted-foreground">
                      {candidate.reasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                  {candidate.isAssigned && (
                    <Badge variant="outline" className="w-fit shrink-0 text-xs">
                      Already assigned
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No individual profiles were associated with this idea. Review the shared
            signals and decide whether it fits your church.
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Creating the team will not assign anyone automatically.
          </p>
          <Button onClick={onCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Review & create team
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSuggestions({
  onCreate,
}: {
  onCreate: (suggestion: TeamSuggestion) => void;
}) {
  const [focus, setFocus] = useState("");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const mutation = useGenerateTeamSuggestions();
  const visibleSuggestions =
    mutation.data?.suggestions.filter((suggestion) => !dismissed.has(suggestion.id)) ?? [];

  const generate = () => {
    const trimmedFocus = focus.trim();
    mutation.mutate({ data: trimmedFocus ? { focus: trimmedFocus } : {} });
    setDismissed(new Set());
  };

  return (
    <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-primary/5 shadow-sm">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/20 text-secondary-foreground">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="font-serif text-xl">Find a starting point</CardTitle>
            <CardDescription className="mt-1 max-w-2xl leading-relaxed">
              Use shared profile reflections to brainstorm a few ministry team themes.
              You stay in control of every team and invitation.
            </CardDescription>
          </div>
        </div>
        <Button onClick={generate} disabled={mutation.isPending} className="shrink-0">
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {mutation.isPending ? "Exploring profiles..." : "Suggest starter teams"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-2xl">
          <Label htmlFor="team-suggestion-focus">
            Optional focus
          </Label>
          <Input
            id="team-suggestion-focus"
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            maxLength={240}
            placeholder="e.g. welcoming newcomers, serving families, or prayer"
            className="mt-2 bg-background/80"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            This guides the brainstorm; it does not change which profiles the church can review.
          </p>
        </div>

        {mutation.isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            We couldn’t generate team ideas right now. Please try again.
          </div>
        ) : mutation.data ? (
          <div className="space-y-5">
            <div className="flex gap-3 rounded-xl border border-primary/15 bg-background/70 p-4">
              {mutation.data.usedAi ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              ) : (
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              )}
              <div className="space-y-1">
                <p className="text-sm leading-relaxed">{mutation.data.summary}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {mutation.data.advisory}
                </p>
              </div>
            </div>
            {visibleSuggestions.length > 0 ? (
              <div className="grid gap-5">
                {visibleSuggestions.map((suggestion) => (
                  <TeamSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onDismiss={() =>
                      setDismissed((current) => new Set(current).add(suggestion.id))
                    }
                    onCreate={() => onCreate(suggestion)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="font-serif text-lg font-medium">No ideas left to review</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate another set of suggestions or create a team manually.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Suggestions will appear here after you ask us to explore the completed profiles.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TeamMemberPicker({
  team,
  profiles,
  teamNames,
  isLoadingProfiles,
}: {
  team: MinistryTeam;
  profiles: ProfileListItem[];
  teamNames: Map<number, string>;
  isLoadingProfiles: boolean;
}) {
  const queryClient = useQueryClient();
  const updateProfileTeam = useUpdateProfileTeam();
  const [open, setOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const availableProfiles = profiles.filter(
    (profile) => profile.profileType === "adult" && profile.teamId !== team.id,
  );
  const selectedProfile = availableProfiles.find(
    (profile) => profile.id === Number(selectedProfileId),
  );

  const close = () => {
    if (updateProfileTeam.isPending) return;
    setOpen(false);
    setSelectedProfileId("");
  };
  const addPerson = () => {
    if (!selectedProfile) {
      toast({
        title: "Choose a person",
        description: "Select a completed adult profile to add to this team.",
        variant: "destructive",
      });
      return;
    }
    updateProfileTeam.mutate(
      { id: selectedProfile.id, data: { teamId: team.id } },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getListProfilesQueryKey() }),
            queryClient.invalidateQueries({
              queryKey: getGetDashboardSummaryQueryKey(),
            }),
          ]);
          setOpen(false);
          setSelectedProfileId("");
          toast({ title: `${selectedProfile.memberName} added to ${team.name}` });
        },
        onError: () =>
          toast({
            title: "Unable to add person to team",
            description: "The assignment could not be saved. Please try again.",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : close())}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedProfileId("");
          setOpen(true);
        }}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Add person
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add someone to {team.name}</DialogTitle>
          <DialogDescription>
            Choose a completed adult Ministry Profile to add to this pastor-led
            team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor={`team-member-${team.id}`}>Person</Label>
          {isLoadingProfiles ? (
            <Skeleton className="h-10 w-full" />
          ) : availableProfiles.length > 0 ? (
            <select
              id={`team-member-${team.id}`}
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Choose a person</option>
              {availableProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.memberName}
                  {profile.teamId
                    ? ` · Currently on ${teamNames.get(profile.teamId) ?? "another team"}`
                    : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              {profiles.some((profile) => profile.profileType === "adult")
                ? "All completed adult profiles are already assigned to this team."
                : "No completed adult profiles yet"}
            </div>
          )}
          {selectedProfile?.teamId && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              This will move {selectedProfile.memberName} from{" "}
              {teamNames.get(selectedProfile.teamId) ?? "their current team"}.
              Each profile can have one current team.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={updateProfileTeam.isPending}>
            Cancel
          </Button>
          <Button
            onClick={addPerson}
            disabled={isLoadingProfiles || !selectedProfile || updateProfileTeam.isPending}
          >
            {updateProfileTeam.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add to team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamCard({
  team,
  onEdit,
  profiles,
  teamNames,
  isLoadingProfiles,
}: {
  team: MinistryTeam;
  onEdit: () => void;
  profiles: ProfileListItem[];
  teamNames: Map<number, string>;
  isLoadingProfiles: boolean;
}) {
  const queryClient = useQueryClient();
  const updateTeam = useUpdateTeam();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const setArchived = (isArchived: boolean) => {
    updateTeam.mutate(
      { id: team.id, data: { isArchived } },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() }),
            queryClient.invalidateQueries({
              queryKey: getGetDashboardSummaryQueryKey(),
            }),
          ]);
          toast({ title: isArchived ? "Team archived" : "Team restored" });
          setConfirmArchive(false);
        },
        onError: () =>
          toast({
            title: "Unable to update team",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <>
      <Card
        className={`border-border/60 shadow-sm ${
          team.isArchived ? "bg-muted/30" : ""
        }`}
      >
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-serif text-xl">{team.name}</CardTitle>
              {team.isArchived && <Badge variant="outline">Archived</Badge>}
            </div>
            <CardDescription className="mt-2 max-w-2xl leading-relaxed">
              {team.description || "No description added yet."}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            {!team.isArchived && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={updateTeam.isPending}
              onClick={() =>
                team.isArchived
                  ? setArchived(false)
                  : setConfirmArchive(true)
              }
            >
              {team.isArchived ? (
                <ArchiveRestore className="mr-2 h-4 w-4" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              {team.isArchived ? "Restore" : "Archive"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              {`${team.memberCount} ${team.memberCount === 1 ? "member" : "members"}`}
            </div>
            {!team.isArchived && (
              <TeamMemberPicker
                team={team}
                profiles={profiles}
                teamNames={teamNames}
                isLoadingProfiles={isLoadingProfiles}
              />
            )}
          </div>
          {team.members.length ? (
            <div className="divide-y rounded-xl border border-border/60 bg-background">
              {team.members.map((member) => (
                  <Link
                  key={member.id}
                  href={`/profiles/${member.id}`}
                    className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{member.memberName}</span>
                  <span className="text-sm text-muted-foreground">
                    {member.email}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No profiles are assigned to this team yet.
            </div>
          )}
          <TeamSchedule team={team} />
        </CardContent>
      </Card>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {team.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The team will leave the active list, but its member assignments
              will be preserved. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setArchived(true)}
              disabled={updateTeam.isPending}
            >
              Archive team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Teams() {
  const { data: teams, isLoading, error } = useListTeams();
  const { data: profiles, isLoading: isLoadingProfiles } = useListProfiles();
  const [editor, setEditor] = useState<EditorState>(null);
  const activeTeams = teams?.filter((team) => !team.isArchived) ?? [];
  const archivedTeams = teams?.filter((team) => team.isArchived) ?? [];
  const teamNames = new Map(teams?.map((team) => [team.id, team.name]) ?? []);

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 border-b border-border/50 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            Ministry Teams
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Organize current serving teams and connect completed profiles with
            the people they may serve alongside.
          </p>
        </div>
        <Button onClick={() => setEditor({ mode: "create" })}>
          <Plus className="mr-2 h-4 w-4" />
          Create team
        </Button>
      </div>

      <TeamSuggestions
        onCreate={(suggestion) =>
          setEditor({
            mode: "create",
            initial: { name: suggestion.name, description: suggestion.purpose },
          })
        }
      />

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          Failed to load teams. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid gap-5">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="p-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="mt-3 h-4 w-72 max-w-full" />
              <Skeleton className="mt-6 h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : activeTeams.length ? (
        <div className="grid gap-5">
          {activeTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={() => setEditor({ mode: "edit", team })}
              profiles={profiles ?? []}
              teamNames={teamNames}
              isLoadingProfiles={isLoadingProfiles}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Create your first ministry team"
          description="Add the teams already serving in your church, then assign profiles as leaders discern the right fit together."
          actionLabel="Create team"
          onAction={() => setEditor({ mode: "create" })}
        />
      )}

      {archivedTeams.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-medium">Archived teams</h2>
            <p className="text-sm text-muted-foreground">
              Archived teams keep their member history and can be restored.
            </p>
          </div>
          <div className="grid gap-5">
            {archivedTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={() => setEditor({ mode: "edit", team })}
                profiles={profiles ?? []}
                teamNames={teamNames}
                isLoadingProfiles={isLoadingProfiles}
              />
            ))}
          </div>
        </section>
      )}

      {editor && (
        <TeamEditor
          key={editor.mode === "edit" ? editor.team.id : "create"}
          editor={editor}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}