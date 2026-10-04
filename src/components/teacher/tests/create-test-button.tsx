"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { createTest } from "@/app/(teacher)/teacher/tests/actions";
import { FormError, FormField } from "@/components/common/form-field";
import {
  fieldError,
  formError,
  useFormAction,
} from "@/components/common/use-form-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreateTestButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Yangi test
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi test</DialogTitle>
          </DialogHeader>
          <CreateTestForm />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateTestForm() {
  // Muvaffaqiyatda action test sahifasiga redirect qiladi
  const [state, action, pending] = useFormAction(createTest);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField
        id="title"
        label="Test nomi"
        error={fieldError(state, "title")}
      >
        <Input id="title" name="title" required maxLength={200} autoFocus />
      </FormField>
      <FormField
        id="durationMin"
        label="Vaqt (daqiqa)"
        error={fieldError(state, "durationMin")}
      >
        <Input
          id="durationMin"
          name="durationMin"
          type="number"
          min={1}
          max={300}
          defaultValue={20}
          required
        />
      </FormField>
      <FormError message={formError(state)} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Yaratish
        </Button>
      </DialogFooter>
    </form>
  );
}
