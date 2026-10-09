"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightLeftIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPhone } from "@/lib/students/format";
import { StudentRowActions } from "./student-row-actions";
import { TransferDialog } from "./transfer-dialog";
import type { GroupOption, StudentRow } from "./types";

/** O'quvchilar jadvali: bir nechtasini tanlab birga boshqa guruhga o'tkazish mumkin */
export function StudentsTable({
  rows,
  groups,
}: {
  rows: StudentRow[];
  groups: GroupOption[];
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [transferOpen, setTransferOpen] = useState(false);

  // Arxivdagilarni o'tkazib bo'lmaydi. Filtr o'zgarsa, ko'rinmay qolganlar tanlovdan tushadi
  const selectable = rows.filter((r) => !r.archived);
  const chosen = selectable.filter((r) => selected.has(r.id));
  const allChosen =
    selectable.length > 0 && chosen.length === selectable.length;

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <>
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {chosen.length === 0 ? (
          <p className="text-muted-foreground text-sm">Jami: {rows.length}</p>
        ) : (
          <>
            <p className="text-sm font-medium">Tanlandi: {chosen.length}</p>
            <Button size="sm" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeftIcon />
              Boshqa guruhga o&apos;tkazish
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              <XIcon />
              Bekor qilish
            </Button>
          </>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                {selectable.length > 0 && (
                  <input
                    type="checkbox"
                    className="accent-primary size-4 align-middle"
                    aria-label="Hammasini tanlash"
                    checked={allChosen}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? new Set(selectable.map((r) => r.id))
                          : new Set(),
                      )
                    }
                  />
                )}
              </TableHead>
              <TableHead>F.I.Sh</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Guruh</TableHead>
              <TableHead className="hidden md:table-cell">Telefon</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Amallar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow
                key={s.id}
                data-state={selected.has(s.id) ? "selected" : undefined}
                className={
                  s.isActive && !s.archived
                    ? undefined
                    : "text-muted-foreground"
                }
              >
                <TableCell>
                  {!s.archived && (
                    <input
                      type="checkbox"
                      className="accent-primary size-4 align-middle"
                      aria-label={`${s.fullName}: tanlash`}
                      checked={selected.has(s.id)}
                      onChange={(e) => toggle(s.id, e.target.checked)}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/teacher/students/${s.id}`}
                    className="hover:underline"
                  >
                    {s.fullName}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {s.username}
                </TableCell>
                <TableCell>{s.groupName ?? "—"}</TableCell>
                <TableCell className="hidden whitespace-nowrap md:table-cell">
                  {s.profile?.phone ? formatPhone(s.profile.phone) : "—"}
                </TableCell>
                <TableCell>
                  {s.archived ? (
                    <Badge variant="outline">Arxivda</Badge>
                  ) : s.isActive ? (
                    <Badge variant="secondary">Faol</Badge>
                  ) : (
                    <Badge variant="destructive">Bloklangan</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <StudentRowActions student={s} groups={groups} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {chosen.length > 0 && (
        <TransferDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          students={chosen}
          groups={groups}
          onDone={() => setSelected(new Set())}
        />
      )}
    </>
  );
}
