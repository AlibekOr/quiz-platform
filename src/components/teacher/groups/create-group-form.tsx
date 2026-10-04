"use client";

import { useRef } from "react";
import { createGroup } from "@/app/(teacher)/teacher/groups/actions";
import { formError, useFormAction } from "@/components/common/use-form-action";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateGroupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useFormAction(createGroup, () =>
    formRef.current?.reset(),
  );

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="name"
          placeholder="Yangi guruh nomi"
          aria-label="Guruh nomi"
          required
          maxLength={64}
        />
        <Button type="submit" disabled={pending}>
          Guruh qo&apos;shish
        </Button>
      </div>
      <FormError message={formError(state)} />
    </form>
  );
}
