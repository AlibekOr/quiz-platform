"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontalIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createTeacher,
  resetStaffPassword,
  setGroupRegionAdmin,
  setStaffActive,
  setTeacherRegions,
} from "@/app/(admin)/admin/actions";
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
import { teacherCreateSchema } from "@/lib/validators/admin";
import { resetPasswordSchema } from "@/lib/validators/student";

type Option = { id: string; name: string };

export type StaffRow = { id: string; fullName: string; isActive: boolean };

function RegionChecklist({
  regions,
  selected,
  onChange,
}: {
  regions: Option[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}) {
  if (regions.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        Avval Regionlar sahifasida region qo&apos;shing.
      </p>
    );
  return (
    <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
      {regions.map((r) => (
        <label key={r.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={selected.has(r.id)}
            onChange={(e) => {
              const next = new Set(selected);
              if (e.target.checked) next.add(r.id);
              else next.delete(r.id);
              onChange(next);
            }}
          />
          {r.name}
        </label>
      ))}
    </div>
  );
}

export function CreateTeacherButton({ regions }: { regions: Option[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const form = useForm({
    resolver: zodResolver(teacherCreateSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: generatePassword(),
      regionIds: [] as string[],
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await createTeacher({
        ...values,
        regionIds: [...selected],
      });
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        form.reset({
          fullName: "",
          username: "",
          password: generatePassword(),
          regionIds: [],
        });
        setSelected(new Set());
      } else applyServerErrors(form, result);
    }),
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        O&apos;qituvchi qo&apos;shish
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi o&apos;qituvchi</DialogTitle>
            <DialogDescription>
              Standart baholash shabloni va namunaviy jarima shablonlari
              o&apos;qituvchiga avtomatik yaratiladi — keyin o&apos;zi sozlaydi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <FormField
              id="t-fullName"
              label="F.I.Sh (familiya, ism)"
              error={errors.fullName?.message}
            >
              <Input
                id="t-fullName"
                placeholder="Orakbaev Alibek"
                aria-invalid={!!errors.fullName}
                {...form.register("fullName")}
              />
            </FormField>
            <FormField
              id="t-username"
              label="Login"
              error={errors.username?.message}
            >
              <Input
                id="t-username"
                autoComplete="off"
                aria-invalid={!!errors.username}
                {...form.register("username")}
              />
            </FormField>
            <FormField
              id="t-password"
              label="Parol"
              error={errors.password?.message}
            >
              <div className="flex gap-2">
                <Input
                  id="t-password"
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
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Regionlari</legend>
              <RegionChecklist
                regions={regions}
                selected={selected}
                onChange={setSelected}
              />
            </fieldset>
            <FormError message={errors.root?.server?.message} />
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** O'qituvchi va menejer uchun: parol tiklash, bloklash; o'qituvchiga — regionlar */
export function StaffRowActions({
  staff,
  regions,
  regionIds,
}: {
  staff: StaffRow;
  /** Berilsa — "Regionlar" bandi (faqat o'qituvchi) */
  regions?: Option[];
  regionIds?: string[];
}) {
  const [dialog, setDialog] = useState<"regions" | "password" | "block" | null>(
    null,
  );
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${staff.fullName}: amallar`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {regions && (
            <DropdownMenuItem onClick={() => setDialog("regions")}>
              Regionlar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setDialog("password")}>
            Parolni tiklash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={staff.isActive ? "destructive" : "default"}
            onClick={() => setDialog("block")}
          >
            {staff.isActive ? "Bloklash" : "Blokdan chiqarish"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {regions && (
        <Dialog open={dialog === "regions"} onOpenChange={close}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regionlar</DialogTitle>
              <DialogDescription>
                {staff.fullName} shu regionlarda guruh va menejer yaratadi.
                Guruhi bor regionni olib tashlab bo&apos;lmaydi.
              </DialogDescription>
            </DialogHeader>
            <RegionsForm
              teacherId={staff.id}
              regions={regions}
              initial={regionIds ?? []}
              onDone={() => setDialog(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={dialog === "password"} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parolni tiklash</DialogTitle>
            <DialogDescription>
              {staff.fullName}. Eski sessiyalari yopiladi.
            </DialogDescription>
          </DialogHeader>
          <PasswordForm userId={staff.id} onDone={() => setDialog(null)} />
        </DialogContent>
      </Dialog>

      <ConfirmAction
        open={dialog === "block"}
        onOpenChange={close}
        title={staff.isActive ? "Bloklash" : "Blokdan chiqarish"}
        description={
          staff.isActive
            ? `${staff.fullName} tizimga kira olmaydi, ochiq sessiyasi ham yopiladi.`
            : `${staff.fullName} yana tizimga kira oladi.`
        }
        confirmLabel={staff.isActive ? "Bloklash" : "Blokdan chiqarish"}
        destructive={staff.isActive}
        action={() => setStaffActive(staff.id, !staff.isActive)}
      />
    </>
  );
}

function RegionsForm({
  teacherId,
  regions,
  initial,
  onDone,
}: {
  teacherId: string;
  regions: Option[];
  initial: string[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const [error, setError] = useState<string>();
  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await setTeacherRegions(teacherId, {
            regionIds: [...selected],
          });
          if (result.ok) {
            toast.success(result.message);
            onDone();
          } else setError(result.error);
        });
      }}
    >
      <RegionChecklist
        regions={regions}
        selected={selected}
        onChange={setSelected}
      />
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
  userId,
  onDone,
}: {
  userId: string;
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
      const result = await resetStaffPassword(userId, values);
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else applyServerErrors(form, result);
    }),
  );
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField
        id="staff-password"
        label="Yangi parol"
        error={errors.password?.message}
      >
        <Input
          id="staff-password"
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

/** Guruh regioni (asosan regionsiz guruhlar uchun): faqat guruh o'qituvchisining regionlari */
export function GroupRegionAdminSelect({
  groupId,
  groupName,
  regionId,
  regions,
}: {
  groupId: string;
  groupName: string;
  regionId: string | null;
  regions: Option[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <NativeSelect
      aria-label={`${groupName}: region`}
      disabled={pending}
      value={regionId ?? ""}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          const result = await setGroupRegionAdmin(groupId, next);
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        });
      }}
    >
      <NativeSelectOption value="">Regionsiz</NativeSelectOption>
      {regions.map((r) => (
        <NativeSelectOption key={r.id} value={r.id}>
          {r.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
