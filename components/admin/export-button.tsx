"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExportColumn<T> = {
  header: string;
  key: keyof T;
};

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function ExportButton<T extends object>({
  rows,
  columns,
  filename,
}: {
  rows: T[];
  columns: ExportColumn<T>[];
  filename: string;
}) {
  function exportCsv() {
    const headers = columns.map((column) => column.header);
    const body = rows.map((row) =>
      columns.map((column) => csvEscape(row[column.key])).join(",")
    );
    const blob = new Blob([[headers.map(csvEscape).join(","), ...body].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]"
      onClick={exportCsv}
      disabled={rows.length === 0}
    >
      <Download className="size-4" />
      Export
    </Button>
  );
}
