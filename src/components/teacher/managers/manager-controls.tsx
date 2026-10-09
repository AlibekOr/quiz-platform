"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontalIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createManager,
  resetManagerPassword,
  setManagerActive,
  setManagerGroups,
  updateManager,
} from "@/app/(teacher)/teacher/managers/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { applyServerErrors } from "@/components/common/form-errors";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { generatePassword } from "@/lib/students/generate-password";
import {
  managerCreateSchema,
  managerUpdateSchema,
  type ManagerUpdateInput,
} from "@/lib/validators/manager";
import { resetPasswordSchema } from "@/lib/validators/student";

type Option = { id: string; name: string };

export type ManagerRow = {
  id: string;
  fullName: string;
  username: string;
  isActive: boolean;
  regionId: string | null;
  groupIds: string[];
};

export function AddManagerButton({ regions }: { regions: Option[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Menejer qo&apos;shish
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi menejer</DialogTitle>
            <DialogDescription>
              Menejer o&apos;z regionidagi va unga biriktirilgan guruhlar
              o&apos;quvchilarini boshqaradi.
            </DialogDescription>
          </DialogHeader>
          <CreateManagerForm regions={regions} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ManagerRowActions({
  manager,
  regions,
  groups,
}: {
  manager: ManagerRow;
  regions: Option[];
  groups: Option[];
}) {
  const [dialog, setDialog] = useState<
    "edit" | "password" | "groups" | "block" | null
  >(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${manager.fullName}: amallar`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("groups")}>
            Qo&apos;shimcha guruhlar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("password")}>
            Parolni tiklash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={manager.isActive ? "destructive" : "default"}
            onClick={() => setDialog("block")}
          >
            {manager.isActive ? "Bloklash" : "Blokdan chiqarish"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "edit"} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Menejerni tahrirlash</DialogTitle>
            <DialogDescription>
              Region o&apos;zgarsa, menejer keyingi sahifadanoq yangi guruhlarni
              ko&apos;radi.
            </DialogDescription>
          </DialogHeader>
          <EditManagerForm
            regions={regions}
            manager={manager}
            onDone={() => setDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "groups"} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qo&apos;shimcha guruhlar</DialogTitle>
            <DialogDescription>
              {manager.fullName} region guruhlaridan tashqari shu guruhlarni ham
              ko&apos;radi.
            </DialogDescription>
          </DialogHeader>
          <GroupsForm
            managerId={manager.id}
            groups={groups}
            initial={manager.groupIds}
            onDone={() => setDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "password"} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parolni tiklash</DialogTitle>
            <DialogDescription>
              {manager.fullName} ({manager.username}). Eski sessiyalari
              yopiladi.
            </DialogDescription>
          </DialogHeader>
          <PasswordForm managerId={manager.id} onDone={() => setDialog(null)} />
        </DialogContent>
      </Dialog>

      <ConfirmAction
        open={dialog === "block"}
        onOpenChange={close}
        title={manager.isActive ? "Menejerni bloklash" : "Blokdan chiqarish"}
        description={
          manager.isActive
            ? `${manager.fullName} tizimga kira olmaydi, ochiq sessiyasi ham yopiladi.`
            : `${manager.fullName} yana tizimga kira oladi.`
        }
        confirmLabel={manager.isActive ? "Bloklash" : "Blokdan chiqarish"}
        destructive={manager.isActive}
        action={() => setManagerActive(manager.id, !manager.isActive)}
      />
    </>
  );
}

/** Yaratish va tahrirlash uchun umumiy maydonlar: ism, login, region */
function ManagerFields({ regions }: { regions: Option[] }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ManagerUpdateInput>();
  return (
    <>
      <FormField
        id="m-fullName"
        label="F.I.Sh"
        error={errors.fullName?.message}
      >
        <Input
          id="m-fullName"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
      </FormField>
      <FormField id="m-username" label="Login" error={errors.username?.message}>
        <Input
          id="m-username"
          autoComplete="off"
          aria-invalid={!!errors.username}
          {...register("username")}
        />
      </FormField>
      <FormField id="m-region" label="Region" error={errors.regionId?.message}>
        <NativeSelect id="m-region" {...register("regionId")}>
          <NativeSelectOption value="">Regionsiz</NativeSelectOption>
          {regions.map((r) => (
            <NativeSelectOption key={r.id} value={r.id}>
              {r.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
    </>
  );
}

function CreateManagerForm({
  regions,
  onDone,
}: {
  regions: Option[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(managerCreateSchema),
    defaultValues: {
      fullName: "",
      username: "",
      regionId: "",
      password: generatePassword(),
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      // Server o'zi qayta tekshiradi va "" -> null qiladi
      const result = await createManager(form.getValues());
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <ManagerFields regions={regions} />
        <FormField
          id="m-password"
          label="Parol"
          error={errors.password?.message}
        >
          <div className="flex gap-2">
            <Input
              id="m-password"
              autoComplete="off"
              className="font-mono"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Yangi parol yaratish"
              onClick={() =>
                form.setValue("password", generatePassword(), {
                  shouldValidate: true,
                })
              }
            >
              <RefreshCwIcon />
            </Button>
          </div>
        </FormField>
        <FormError message={errors.root?.server?.message} />
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            Saqlash
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

function EditManagerForm({
  regions,
  manager,
  onDone,
}: {
  regions: Option[];
  manager: ManagerRow;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(managerUpdateSchema),
    defaultValues: {
      fullName: manager.fullName,
      username: manager.username,
      regionId: manager.regionId ?? "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const result = await updateManager(manager.id, form.getValues());
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <ManagerFields regions={regions} />
        <FormError message={errors.root?.server?.message} />
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            Saqlash
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

function GroupsForm({
  managerId,
  groups,
  initial,
  onDone,
}: {
  managerId: string;
  groups: Option[];
  initial: string[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    new Set(initial),
  );
  const [error, setError] = useState<string>();

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await setManagerGroups(managerId, {
        groupIds: [...selected],
      });
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">Guruhlar yo&apos;q.</p>
      ) : (
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {groups.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-primary size-4"
                checked={selected.has(g.id)}
                onChange={(e) => toggle(g.id, e.target.checked)}
              />
              {g.name}
            </label>
          ))}
        </div>
      )}
      <FormError message={error} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}

function PasswordForm({
  managerId,
  onDone,
}: {
  managerId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: generatePassword() },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await resetManagerPassword(managerId, values);
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField
        id="m-new-password"
        label="Yangi parol"
        error={errors.password?.message}
      >
        <Input
          id="m-new-password"
          autoComplete="off"
          className="font-mono"
          aria-invalid={!!errors.password}
          {...form.register("password")}
        />
      </FormField>
      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Parolni saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
