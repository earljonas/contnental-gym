"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { ArrowUpDown, CalendarRange, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Column<T> = {
  header: string;
  id?: string;
  key?: keyof T;
  cellType?: "text" | "status" | "email-action";
};

type FilterConfig<T> = {
  key: keyof T;
  label: string;
  options: string[];
};

function isDateValue(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function normalizeToYMD(value: string): string | null {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusBadgeClass(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "active") return "badge-active";
  if (normalized === "pending") return "badge-pending";
  if (normalized === "expired" || normalized === "cancelled") return "badge-expired";

  return "";
}

export function ResourceTable<T extends Record<string, string>>({
  columns,
  rows,
  searchPlaceholder,
  searchKeys,
  filters = [],
  dateKey,
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder: string;
  searchKeys: (keyof T)[];
  filters?: FilterConfig<T>[];
  dateKey?: keyof T;
}) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<keyof T | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const deferredSearch = useDeferredValue(search);
  const availableFilters = filters
    .map((filter) => ({
      ...filter,
      options: [...new Set(filter.options.map((option) => option.trim()).filter(Boolean))],
    }))
    .filter((filter) => filter.options.length > 1);
  const dateColumnLabel = dateKey
    ? columns.find((column) => column.key === dateKey)?.header ?? "Date"
    : null;
  const hasActiveState =
    search.trim().length > 0 ||
    dateFrom.length > 0 ||
    dateTo.length > 0 ||
    sortKey !== "" ||
    Object.values(activeFilters).some((value) => value && value !== "All");

  function resetControls() {
    setSearch("");
    setActiveFilters({});
    setSortKey("");
    setSortDirection("asc");
    setDateFrom("");
    setDateTo("");
  }

  let filteredRows = rows.filter((row) => {
    const matchesSearch =
      deferredSearch.trim().length === 0 ||
      searchKeys.some((key) =>
        String(row[key]).toLowerCase().includes(deferredSearch.toLowerCase())
      );

    if (!matchesSearch) return false;

    const matchesFilters = availableFilters.every((filter) => {
      const filterValue = activeFilters[String(filter.key)];
      if (!filterValue || filterValue === "All") return true;
      const rowValue = String(row[filter.key] ?? "").trim();
      return rowValue === filterValue;
    });

    if (!matchesFilters) return false;

    if (!dateKey || (!dateFrom && !dateTo)) return true;

    const rawDate = row[dateKey];
    const rowYMD = normalizeToYMD(rawDate);
    if (!rowYMD) return false;

    if (dateFrom && rowYMD < dateFrom) return false;
    if (dateTo && rowYMD > dateTo) return false;

    return true;
  });

  if (sortKey) {
    filteredRows = [...filteredRows].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const leftDate = Date.parse(left);
      const rightDate = Date.parse(right);

      const result =
        !Number.isNaN(leftDate) && !Number.isNaN(rightDate)
          ? leftDate - rightDate
          : left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });

      return sortDirection === "asc" ? result : -result;
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[26px] border border-border bg-secondary/35 p-4 sm:p-5">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Search className="size-3.5" />
              Search
            </div>
            <div className="relative min-w-[240px] max-w-2xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-12 rounded-2xl border-border bg-background pl-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              Filters & Sort
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {availableFilters.map((filter) => (
                <div key={String(filter.key)} className="min-w-[180px] flex-1 sm:flex-none sm:basis-[200px]">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {filter.label}
                  </label>
                  <Select
                    value={activeFilters[String(filter.key)] ?? "All"}
                    onChange={(event) => {
                      startTransition(() => {
                        setActiveFilters((current) => ({
                          ...current,
                          [String(filter.key)]: event.target.value,
                        }));
                      });
                    }}
                    className="h-12 min-w-0 rounded-2xl border-border bg-background"
                  >
                    <option value="All">All {filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}

              {dateKey ? (
                <div className="min-w-[280px] flex-1 sm:flex-none sm:basis-[320px]">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <CalendarRange className="size-3.5" />
                    {dateColumnLabel} Range
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <CalendarRange className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        aria-label={`${dateColumnLabel} from`}
                        value={dateFrom}
                        onChange={(event) => setDateFrom(event.target.value)}
                        className="h-12 rounded-2xl border-border bg-background pl-10"
                      />
                    </div>
                    <div className="relative">
                      <CalendarRange className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        aria-label={`${dateColumnLabel} to`}
                        value={dateTo}
                        onChange={(event) => setDateTo(event.target.value)}
                        className="h-12 rounded-2xl border-border bg-background pl-10"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="min-w-[220px] flex-1 sm:flex-none sm:basis-[240px]">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Sort
                </label>
                <div className="flex gap-2">
                  <Select
                    value={String(sortKey)}
                    onChange={(event) => setSortKey(event.target.value as keyof T | "")}
                    className="h-12 min-w-0 rounded-2xl border-border bg-background"
                  >
                    <option value="">Sort by</option>
                    {columns
                      .filter((column) => column.key)
                      .map((column) => (
                        <option key={column.id ?? String(column.key)} value={String(column.key)}>
                          {column.header}
                        </option>
                      ))}
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl px-4"
                    onClick={() =>
                      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
                    }
                    aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
                  >
                    <ArrowUpDown className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-3">
              {hasActiveState ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 rounded-2xl px-4 text-xs font-semibold uppercase tracking-[0.16em]"
                  onClick={resetControls}
                >
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              ) : null}
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Direction: {sortDirection === "asc" ? "Ascending" : "Descending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.id ?? String(column.key)}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-16 text-center text-sm text-muted-foreground"
              >
                No results
              </TableCell>
            </TableRow>
          ) : (
            filteredRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => {
                  const value = column.key ? row[column.key] : "";
                  const isStatus =
                    column.cellType === "status" ||
                    column.header.toLowerCase().includes("status") ||
                    column.header.toLowerCase().includes("risk");
                  const isEmailAction = column.cellType === "email-action";

                  return (
                    <TableCell key={column.id ?? String(column.key)} className="text-[15px]">
                      {isEmailAction ? (
                        <Button asChild variant="outline" className="h-9 rounded-full px-3.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                          <a href={`mailto:${value}`}>Email</a>
                        </Button>
                      ) : isStatus ? (
                        <Badge variant="secondary" className={statusBadgeClass(value)}>
                          {value}
                        </Badge>
                      ) : (
                        value
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
