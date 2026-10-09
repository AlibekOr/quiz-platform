"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { decideRequest } from "@/app/(teacher)/teacher/requests/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** Kutilayotgan so'rov: tasdiqlash (arxivlash) yoki izoh bilan rad etish */
export function RequestDecision({
  requestId,
  studentName,
}: {
  requestId: string;
  studentName: string;
}) {
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setDialog("approve")}
      >
        Tasdiqlash
      </Button>
      <Button size="sm" variant="outline" onClick={() => setDialog("reject")}>
        Rad etish
      </Button>
      <ConfirmAction
        open={dialog === "approve"}
        onOpenChange={close}
        title="So'rovni tasdiqlash"
        description={`${studentName} arxivlanadi: tizimga kira olmaydi va ro'yxatlarda ko'rinmaydi. Natijalari saqlanadi, "Arxiv" filtridan tiklash mumkin.`}
        confirmLabel="Tasdiqlash"
        destructive
        action={() => decideRequest(requestId, { approve: true, note: "" })}
      />
      <Dialog open={dialog === "reject"} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>So&apos;rovni rad etish</DialogTitle>
            <DialogDescription>
              {studentName}. Izoh menejerga ko&apos;rinadi.
            </DialogDescription>
          </DialogHeader>
          <RejectForm requestId={requestId} onDone={() => setDialog(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RejectForm({
  requestId,
  onDone,
}: {
  requestId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await decideRequest(requestId, { approve: false, note });
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        setError(result.fieldErrors?.note?.[0] ?? result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <FormField id="reject-note" label="Sabab">
        <Textarea
          id="reject-note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormField>
      <FormError message={error} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Rad etish
        </Button>
      </DialogFooter>
    </form>
  );
}
