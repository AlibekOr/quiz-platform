"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { readSheet } from "read-excel-file/browser";
import { toast } from "sonner";
import {
  importStudents,
  previewStudentImport,
} from "@/app/teacher/students/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IMPORT_COLUMNS,
  sheetToRows,
  type ValidatedRow,
} from "@/lib/students/import";

export function ImportStudents() {
  const router = useRouter();
  const [rows, setRows] = useState<ValidatedRow[] | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  function onFile(file: File | undefined) {
    setRows(null);
    setError(undefined);
    if (!file) return;

    startTransition(async () => {
      let sheet;
      try {
        sheet = await readSheet(file);
      } catch {
        setError("Faylni o'qib bo'lmadi. .xlsx formatidagi Excel fayl tanlang");
        return;
      }
      const parsed = sheetToRows(sheet);
      if ("error" in parsed) {
        setError(parsed.error);
        return;
      }
      const preview = await previewStudentImport(parsed.rows);
      if (preview.ok) setRows(preview.rows);
      else setError(preview.error);
    });
  }

  function onImport() {
    if (!rows) return;
    startTransition(async () => {
      const result = await importStudents(
        rows.map(({ fullName, username, password, group, line }) => ({
          fullName,
          username,
          password,
          group,
          line,
        })),
      );
      if (result.ok) {
        toast.success(`${result.created} ta o'quvchi qo'shildi`);
        router.push("/teacher/students");
      } else {
        setError(result.error);
        if (result.rows) setRows(result.rows);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
        <p>
          Birinchi qatorda ustun nomlari bo&apos;lsin:{" "}
          <code className="bg-muted rounded px-1 py-0.5">
            {IMPORT_COLUMNS.join(" | ")}
          </code>
        </p>
        <p className="text-muted-foreground">
          Guruh nomi mavjud guruh bilan bir xil bo&apos;lishi kerak. Login:
          lotin harflari, raqam, &quot;.&quot;, &quot;_&quot;, &quot;-&quot;.
          Parol kamida 6 belgi.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="file">Excel fayl (.xlsx)</Label>
        <Input
          id="file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => onFile(e.target.files?.[0])}
          disabled={pending}
          className="sm:max-w-sm"
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {rows && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Jami {rows.length} ta qator
              {errorCount > 0 ? (
                <span className="text-destructive">
                  , {errorCount} tasida xato — tuzatib, faylni qayta yuklang
                </span>
              ) : (
                <span className="text-muted-foreground">, xato yo&apos;q</span>
              )}
            </p>
            <Button onClick={onImport} disabled={pending || errorCount > 0}>
              {rows.length} ta o&apos;quvchini qo&apos;shish
            </Button>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Qator</TableHead>
                  <TableHead>F.I.Sh</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Guruh</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.line}
                    className={
                      r.errors.length > 0 ? "bg-destructive/5" : undefined
                    }
                  >
                    <TableCell className="text-muted-foreground">
                      {r.line}
                    </TableCell>
                    <TableCell>{r.fullName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.username}
                    </TableCell>
                    <TableCell>{r.group}</TableCell>
                    <TableCell className="whitespace-normal">
                      {r.errors.length === 0 ? (
                        <Badge variant="secondary">OK</Badge>
                      ) : (
                        <ul className="text-destructive list-disc pl-4">
                          {r.errors.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
