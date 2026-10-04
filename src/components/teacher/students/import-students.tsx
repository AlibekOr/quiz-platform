"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  importStudents,
  previewStudentImport,
  type ImportPreviewRow,
} from "@/app/(teacher)/teacher/students/actions";
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
import { IMPORT_COLUMNS, REQUIRED_COLUMNS } from "@/lib/students/import";

export function ImportStudents() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportPreviewRow[] | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  function toFormData(f: File) {
    const formData = new FormData();
    formData.append("file", f);
    return formData;
  }

  function onFile(selected: File | undefined) {
    setRows(null);
    setError(undefined);
    setFile(selected ?? null);
    if (!selected) return;

    startTransition(async () => {
      const preview = await previewStudentImport(toFormData(selected));
      if (preview.ok) setRows(preview.rows);
      else setError(preview.error);
    });
  }

  function onImport() {
    if (!file) return;
    startTransition(async () => {
      // Server faylni qayta o'qiydi va tekshiradi
      const result = await importStudents(toFormData(file));
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
          <code className="bg-muted rounded px-1 py-0.5 break-words">
            {IMPORT_COLUMNS.join(" | ")}
          </code>
        </p>
        <p className="text-muted-foreground">
          Majburiy: {REQUIRED_COLUMNS.join(", ")}. Guruh nomi mavjud guruh bilan
          bir xil bo&apos;lishi kerak. Login: lotin harflari, raqam,
          &quot;.&quot;, &quot;_&quot;, &quot;-&quot;. Parol kamida 6 belgi.
        </p>
        <p className="text-muted-foreground">
          Aloqa ustunlari ixtiyoriy: telefonlar <code>90 123 45 67</code> yoki{" "}
          <code>+998901234567</code>, telegram <code>@username</code> yoki
          telefon, parentRelation <code>ota</code> / <code>ona</code> /{" "}
          <code>boshqa</code>.
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
                  <TableHead className="hidden md:table-cell">Aloqa</TableHead>
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
                    <TableCell className="hidden text-xs md:table-cell">
                      {[r.phone, r.telegram, r.parentName]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </TableCell>
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
