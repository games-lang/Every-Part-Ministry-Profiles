import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getBillingSubscription,
  getGetBillingSubscriptionQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetProfileQueryKey,
  getListChurchRemovalAuditQueryKey,
  getListPeopleQueryKey,
  getListProfilesQueryKey,
  getListTeamsQueryKey,
  useRemoveChurchPerson,
  useRemoveChurchProfile,
} from "@workspace/api-client-react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type RemovalTarget =
  | { kind: "profile"; id: number; name: string }
  | { kind: "person"; id: number; name: string; profileId?: number | null };

type ChurchRemovalMenuProps = {
  target: RemovalTarget;
  focusFallbackRef?: React.RefObject<HTMLElement | null>;
  onRemoved?: () => void;
};

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Please try again. If the problem continues, contact your church administrator.";
}

export function ChurchRemovalMenu({
  target,
  focusFallbackRef,
  onRemoved,
}: ChurchRemovalMenuProps) {
  const queryClient = useQueryClient();
  const removeProfile = useRemoveChurchProfile();
  const removePerson = useRemoveChurchPerson();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const removedRef = useRef(false);
  const isPending = removeProfile.isPending || removePerson.isPending;
  const mutationError = target.kind === "profile" ? removeProfile.error : removePerson.error;
  const removedProfileId = target.kind === "profile" ? target.id : target.profileId;

  const invalidateRemovalQueries = async () => {
    await Promise.all([
      // Refetch directory lists, not the detail page that was just deleted.
      queryClient.invalidateQueries({ queryKey: getListProfilesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListChurchRemovalAuditQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetBillingSubscriptionQueryKey(), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(), refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey(), refetchType: "all" }),
    ]);
  };

  const permanentlyRemove = () => {
    const mutation = target.kind === "profile" ? removeProfile : removePerson;
    mutation.mutate(
      { id: target.id },
      {
        onSuccess: async () => {
          if (removedProfileId != null) {
            queryClient.setQueryData<Awaited<ReturnType<typeof getBillingSubscription>>>(
              getGetBillingSubscriptionQueryKey(),
              (current) => {
                if (!current) return current;
                const profilesUsed = Math.max(0, current.profilesUsed - 1);
                return {
                  ...current,
                  profilesUsed,
                  profilesRemaining: current.profileLimit === null
                    ? null
                    : Math.max(0, current.profileLimit - profilesUsed),
                };
              },
            );
          }
          try {
            await invalidateRemovalQueries();
          } finally {
            removedRef.current = true;
            setOpen(false);
            toast({
              title: target.kind === "person" ? "Person removed" : "Profile removed",
              description: `${target.name} was permanently removed.`,
            });
            onRemoved?.();
            if (removedProfileId != null) {
              queryClient.removeQueries({ queryKey: getGetProfileQueryKey(removedProfileId) });
            }
          }
        },
      },
    );
  };

  const hasLinkedProfile = target.kind === "profile" || target.profileId != null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={`Actions for ${target.name}`}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => {
              removeProfile.reset();
              removePerson.reset();
              setOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remove person
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // The dropdown closes before the dialog, so its own focus restoration
            // can otherwise leave focus on BODY. Wait until both layers unmount.
            window.requestAnimationFrame(() => {
              const target = !removedRef.current && triggerRef.current?.isConnected
                ? triggerRef.current
                : focusFallbackRef?.current;
              if (target?.isConnected) {
                target.focus();
              } else {
                document.body.setAttribute("tabindex", "-1");
                document.body.focus();
              }
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{`Remove ${target.name} permanently?`}</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The following church records will be permanently removed:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {target.kind === "person" ? (
              <>
                <li>The invitation and person record</li>
                {hasLinkedProfile && <li>The linked completed profile and its reflection responses and results</li>}
              </>
            ) : (
              <>
                <li>The completed profile and its reflection responses and results</li>
                <li>Any linked invitation and person record</li>
              </>
            )}
            {hasLinkedProfile && (
              <li>Its team assignment, scheduled shifts, pastor notes, and profile photo; its private journey only if no other profile shares it</li>
            )}
          </ul>
          {mutationError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              The record could not be removed. {errorMessage(mutationError)}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={permanentlyRemove}
            >
              {isPending ? "Removing…" : "Permanently remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}