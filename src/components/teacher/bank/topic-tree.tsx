"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  createTopic,
  deleteTopic,
  renameTopic,
} from "@/app/(teacher)/teacher/bank/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TopicNode } from "@/lib/bank-data";
import { cn } from "@/lib/utils";

type Editing =
  | { kind: "create"; parent: TopicNode | null }
  | { kind: "rename"; topic: TopicNode };

/** Mavzular daraxti: bosilsa — shu mavzu (ichkilari bilan) bo'yicha filtr */
export function TopicTree({
  topics,
  readOnly,
}: {
  topics: TopicNode[];
  readOnly: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("topic");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<TopicNode | null>(null);

  function href(topicId: string | null) {
    const next = new URLSearchParams(params);
    if (topicId) next.set("topic", topicId);
    else next.delete("topic");
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <nav className="flex flex-col gap-1 text-sm" aria-label="Mavzular">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">Mavzular</span>
        {!readOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing({ kind: "create", parent: null })}
          >
            <PlusIcon />
            Mavzu
          </Button>
        )}
      </div>
      <Link
        prefetch={false}
        href={href(null)}
        className={cn(
          "hover:bg-muted rounded px-2 py-1",
          !active && "bg-muted font-medium",
        )}
      >
        Barcha mavzular
      </Link>
      {topics.length === 0 && (
        <p className="text-muted-foreground px-2 py-1">
          Hali mavzu yo&apos;q. Savol qo&apos;shishdan oldin mavzu yarating.
        </p>
      )}
      <ul className="flex flex-col">
        {topics.map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-1"
            style={{ paddingLeft: `${t.depth * 0.75}rem` }}
          >
            <Link
              prefetch={false}
              href={href(t.id)}
              className={cn(
                "hover:bg-muted flex min-w-0 flex-1 justify-between gap-2 rounded px-2 py-1",
                active === t.id && "bg-muted font-medium",
              )}
            >
              <span className="truncate">{t.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {t.questionCount}
              </span>
            </Link>
            {!readOnly && (
              <span className="flex shrink-0 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${t.name}: ichki mavzu`}
                  onClick={() => setEditing({ kind: "create", parent: t })}
                >
                  <PlusIcon />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${t.name}: nomini o'zgartirish`}
                  onClick={() => setEditing({ kind: "rename", topic: t })}
                >
                  <PencilIcon />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${t.name}: o'chirish`}
                  onClick={() => setDeleting(t)}
                >
                  <Trash2Icon />
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {editing && (
        <TopicDialog editing={editing} onClose={() => setEditing(null)} />
      )}
      <ConfirmAction
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Mavzuni o'chirish"
        description={`"${deleting?.path ?? ""}" o'chiriladi. Faqat bo'sh mavzu o'chiriladi.`}
        confirmLabel="O'chirish"
        destructive
        action={() => deleteTopic(deleting!.id)}
      />
    </nav>
  );
}

function TopicDialog({
  editing,
  onClose,
}: {
  editing: Editing;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(
    editing.kind === "rename" ? editing.topic.name : "",
  );
  const [error, setError] = useState<string>();
  const title =
    editing.kind === "rename"
      ? "Mavzu nomini o'zgartirish"
      : editing.parent
        ? `Ichki mavzu: ${editing.parent.path}`
        : "Yangi mavzu";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result =
                editing.kind === "rename"
                  ? await renameTopic(editing.topic.id, {
                      name,
                      parentId: editing.topic.parentId,
                    })
                  : await createTopic({
                      name,
                      parentId: editing.parent?.id ?? null,
                    });
              if (result.ok) {
                toast.success(result.message);
                onClose();
              } else setError(result.fieldErrors?.name?.[0] ?? result.error);
            });
          }}
        >
          <FormField id="topic-name" label="Nomi">
            <Input
              id="topic-name"
              autoFocus
              maxLength={100}
              placeholder="CSS Flexbox"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormError message={error} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
