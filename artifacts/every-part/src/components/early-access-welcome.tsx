import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetEarlyAccessWelcomeQueryKey,
  useAcknowledgeEarlyAccessWelcome,
  useGetEarlyAccessWelcome,
} from "@workspace/api-client-react";
import { Check, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EarlyAccessWelcome() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetEarlyAccessWelcome();
  const acknowledgement = useAcknowledgeEarlyAccessWelcome();
  const [open, setOpen] = useState(true);

  if (isLoading || !data?.show || !open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/20 text-primary">
            <FlaskConical className="h-5 w-5" />
          </div>
          <DialogTitle className="font-serif text-2xl">
            Welcome to Every Part Early Access
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2 text-left text-sm leading-6">
            <span className="block">
              You are among the first churches helping shape Every Part.
            </span>
            <span className="block">
              Every Part is designed to help people discover how God has
              equipped them and help church leaders connect them with
              meaningful opportunities to serve.
            </span>
            <span className="block">
              During Early Access, you may occasionally notice features being
              improved, expanded, or refined. Your real-world experience and
              feedback will help us make Every Part better for churches
              everywhere.
            </span>
            <span className="block">
              Thank you for helping build something designed to strengthen the
              Body of Christ.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            className="rounded-full"
            disabled={acknowledgement.isPending}
            onClick={() =>
              acknowledgement.mutate(
                undefined,
                {
                  onSuccess: () => {
                    queryClient.setQueryData(
                      getGetEarlyAccessWelcomeQueryKey(),
                      (current) => current ? { ...current, show: false } : current,
                    );
                    setOpen(false);
                  },
                },
              )
            }
          >
            <Check className="mr-2 h-4 w-4" />
            {acknowledgement.isPending
              ? "Saving…"
              : "Continue to Every Part"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}