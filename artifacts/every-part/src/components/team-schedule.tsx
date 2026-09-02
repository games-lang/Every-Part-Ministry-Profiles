import { useState } from "react";
import {
  getListTeamScheduleQueryKey,
  type MinistryTeam,
  type TeamScheduleInput,
  type TeamScheduleItem,
  type TeamScheduleUpdate,
  useCreateTeamSchedule,
  useListTeamSchedule,
  useUpdateTeamSchedule,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  UserRound,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type ScheduleForm = {
  scheduledDate: string;
  startTime: string;
  endTime: string;
  role: string;
  profileId: string;
  notes: string;
};

function localDateInput() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function emptyForm(): ScheduleForm {
  return {
    scheduledDate: localDateInput(),
    startTime: "09:00",
    endTime: "11:00",
    role: "",
    profileId: "",
    notes: "",
  };
}

function formFromShift(shift: TeamScheduleItem): ScheduleForm {
  return {
    scheduledDate: shift.scheduledDate,
    startTime: shift.startTime,
    endTime: shift.endTime ?? "",
    role: shift.role,
    profileId: shift.profileId ? String(shift.profileId) : "",
    notes: shift.notes ?? "",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function ShiftEditor({
  open,
  team,
  editing,
  form,
  onChange,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  team: MinistryTeam;
  editing: TeamScheduleItem | null;
  form: ScheduleForm;
  onChange: (field: keyof ScheduleForm, value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit schedule shift" : "Schedule a volunteer"}</DialogTitle>
          <DialogDescription>
            Add a one-time shift for {team.name}. You can leave the volunteer
            open and assign someone later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`schedule-date-${team.id}`}>Date</Label>
            <Input
              id={`schedule-date-${team.id}`}
              type="date"
              value={form.scheduledDate}
              onChange={(event) => onChange("scheduledDate", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`schedule-role-${team.id}`}>Role</Label>
            <Input
              id={`schedule-role-${team.id}`}
              value={form.role}
              onChange={(event) => onChange("role", event.target.value)}
              placeholder="Welcome desk"
              maxLength={120}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`schedule-start-${team.id}`}>Starts</Label>
            <Input
              id={`schedule-start-${team.id}`}
              type="time"
              value={form.startTime}
              onChange={(event) => onChange("startTime", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`schedule-end-${team.id}`}>Ends (optional)</Label>
            <Input
              id={`schedule-end-${team.id}`}
              type="time"
              value={form.endTime}
              onChange={(event) => onChange("endTime", event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`schedule-volunteer-${team.id}`}>Volunteer</Label>
            <select
              id={`schedule-volunteer-${team.id}`}
              value={form.profileId}
              onChange={(event) => onChange("profileId", event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Leave this shift open</option>
              {team.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.memberName}
                </option>
              ))}
            </select>
            {team.members.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Assign a completed Ministry Profile to this team before choosing a volunteer.
              </p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`schedule-notes-${team.id}`}>Notes (optional)</Label>
            <Textarea
              id={`schedule-notes-${team.id}`}
              value={form.notes}
              onChange={(event) => onChange("notes", event.target.value)}
              placeholder="Arrival details, room, or anything the volunteer should know."
              maxLength={1000}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save shift" : "Schedule shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamSchedule({ team }: { team: MinistryTeam }) {
  const queryClient = useQueryClient();
  const { data: shifts, isLoading, error } = useListTeamSchedule(team.id);
  const createShift = useCreateTeamSchedule();
  const updateShift = useUpdateTeamSchedule();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TeamScheduleItem | null>(null);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const isPending = createShift.isPending || updateShift.isPending;
  const upcomingShifts =
    shifts?.filter((shift) => shift.scheduledDate >= localDateInput()).slice(0, 8) ?? [];

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: getListTeamScheduleQueryKey(team.id),
    });
  };
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setEditorOpen(true);
  };
  const openEdit = (shift: TeamScheduleItem) => {
    setEditing(shift);
    setForm(formFromShift(shift));
    setEditorOpen(true);
  };
  const closeEditor = () => {
    if (isPending) return;
    setEditorOpen(false);
    setEditing(null);
  };
  const updateForm = (field: keyof ScheduleForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = () => {
    const role = form.role.trim();
    if (!form.scheduledDate || !form.startTime || !role) {
      toast({
        title: "Add a date, start time, and role",
        description: "Those details are needed to schedule a shift.",
        variant: "destructive",
      });
      return;
    }
    if (form.endTime && form.endTime <= form.startTime) {
      toast({
        title: "Check the time range",
        description: "The end time needs to be after the start time.",
        variant: "destructive",
      });
      return;
    }
    const data: TeamScheduleInput = {
      scheduledDate: form.scheduledDate,
      startTime: form.startTime,
      endTime: form.endTime || null,
      role,
      profileId: form.profileId ? Number(form.profileId) : null,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      const update: TeamScheduleUpdate = data;
      updateShift.mutate(
        { id: editing.id, data: update },
        {
          onSuccess: async () => {
            await refresh();
            setEditorOpen(false);
            setEditing(null);
            toast({ title: "Schedule shift updated" });
          },
          onError: () =>
            toast({
              title: "Could not update this shift",
              description: "Check the volunteer and time details and try again.",
              variant: "destructive",
            }),
        },
      );
    } else {
      createShift.mutate(
        { id: team.id, data },
        {
          onSuccess: async () => {
            await refresh();
            setEditorOpen(false);
            setEditing(null);
            toast({ title: "Volunteer shift scheduled" });
          },
          onError: () =>
            toast({
              title: "Could not schedule this shift",
              description: "Check the volunteer and time details and try again.",
              variant: "destructive",
            }),
        },
      );
    }
  };
  const setCancelled = (shift: TeamScheduleItem, isCancelled: boolean) => {
    updateShift.mutate(
      { id: shift.id, data: { isCancelled } },
      {
        onSuccess: async () => {
          await refresh();
          toast({ title: isCancelled ? "Shift cancelled" : "Shift restored" });
        },
        onError: () =>
          toast({
            title: "Could not update this shift",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <section className="mt-6 border-t border-border/50 pt-5">
      <ShiftEditor
        open={editorOpen}
        team={team}
        editing={editing}
        form={form}
        onChange={updateForm}
        onOpenChange={(open) => (open ? setEditorOpen(true) : closeEditor())}
        onSubmit={submit}
        isPending={isPending}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary-foreground">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium">Schedule</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upcoming shifts for this team
            </p>
          </div>
        </div>
        {!team.isArchived && (
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Schedule shift
          </Button>
        )}
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          The team schedule could not be loaded.
        </div>
      ) : isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : upcomingShifts.length > 0 ? (
        <div className="mt-4 divide-y rounded-xl border border-border/60 bg-background">
          {upcomingShifts.map((shift) => (
            <div
              key={shift.id}
              className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
                shift.isCancelled ? "bg-muted/30 opacity-70" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{shift.role}</p>
                  {shift.isCancelled ? (
                    <Badge variant="outline" className="border-destructive/20 text-destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Cancelled
                    </Badge>
                  ) : shift.profileId ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Filled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                      Open
                    </Badge>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(shift.scheduledDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatTime(shift.startTime)}
                    {shift.endTime ? `–${formatTime(shift.endTime)}` : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5" />
                    {shift.volunteerName ?? "Volunteer needed"}
                  </span>
                </div>
                {shift.notes && (
                  <p className="mt-1.5 text-xs text-muted-foreground">{shift.notes}</p>
                )}
              </div>
              {!team.isArchived && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(shift)}
                    aria-label={`Edit ${shift.role} shift`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCancelled(shift, !shift.isCancelled)}
                    disabled={updateShift.isPending}
                  >
                    {shift.isCancelled ? "Restore" : "Cancel"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">
            No upcoming shifts yet. Add the first one when your team’s serving rhythm is clear.
          </p>
        </div>
      )}
    </section>
  );
}