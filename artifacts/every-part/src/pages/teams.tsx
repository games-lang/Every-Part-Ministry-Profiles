import { useState } from "react";
import {
  getGetDashboardSummaryQueryKey,
  getListTeamsQueryKey,
  type MinistryTeam,
  useCreateTeam,
  useListTeams,
  useUpdateTeam,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  Pencil,
  Plus,
  Users,
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

type EditorState =
  | { mode: "create" }
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
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
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
            Give pastors a clear place to organize people serving together.
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

function TeamCard({
  team,
  onEdit,
}: {
  team: MinistryTeam;
  onEdit: () => void;
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
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" />
            {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
          </div>
          {team.members.length ? (
            <div className="divide-y rounded-xl border border-border/60 bg-background">
              {team.members.map((member) => (
                <Link
                  key={member.id}
                  href={`/profiles/${member.id}`}
                  className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
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
  const [editor, setEditor] = useState<EditorState>(null);
  const activeTeams = teams?.filter((team) => !team.isArchived) ?? [];
  const archivedTeams = teams?.filter((team) => team.isArchived) ?? [];

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
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-medium">
              Create your first ministry team
            </h2>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Add the teams already serving in your church, then assign
              profiles as leaders discern the right fit together.
            </p>
            <Button className="mt-6" onClick={() => setEditor({ mode: "create" })}>
              <Plus className="mr-2 h-4 w-4" />
              Create team
            </Button>
          </CardContent>
        </Card>
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