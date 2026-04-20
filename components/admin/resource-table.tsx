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
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border-border bg-background pl-10 text-sm"
            />
          </div>

          {availableFilters.map((filter) => (
            <Select
              key={String(filter.key)}
              value={activeFilters[String(filter.key)] ?? "All"}
              onChange={(event) => {
                startTransition(() => {
                  setActiveFilters((current) => ({
                    ...current,
                    [String(filter.key)]: event.target.value,
                  }));
                });
              }}
              className="h-10 w-full lg:w-[140px] shrink-0 rounded-xl border-border bg-background text-sm"
            >
              <option value="All">All {filter.label}</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          ))}

          {dateKey ? (
            <div className="flex shrink-0 items-center gap-2">
              <Input
                type="date"
                aria-label={`${dateColumnLabel} from`}
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-10 flex-1 lg:w-[130px] rounded-xl border-border bg-background text-sm"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="date"
                aria-label={`${dateColumnLabel} to`}
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-10 flex-1 lg:w-[130px] rounded-xl border-border bg-background text-sm"
              />
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Select
              value={String(sortKey)}
              onChange={(event) => setSortKey(event.target.value as keyof T | "")}
              className="h-10 flex-1 lg:w-[140px] shrink-0 rounded-xl border-border bg-background text-sm"
            >
              <option value="">Sort by</option>
              {columns
                .filter((column) => column.key)
                .map((column, index) => (
                  <option key={column.id ?? (column.key ? String(column.key) : `col-${index}`)} value={String(column.key)}>
                    {column.header}
                  </option>
                ))}
            </Select>

            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 rounded-xl px-3"
              onClick={() =>
                setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
              }
              aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
            >
              <ArrowUpDown className="size-4" />
            </Button>

            {hasActiveState ? (
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-3 text-xs font-semibold uppercase tracking-[0.16em]"
                onClick={resetControls}
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column, index) => (
              <TableHead key={column.id ?? (column.key ? String(column.key) : `col-${index}`)}>
                {column.header}
              </TableHead>
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
                {columns.map((column, columnIndex) => {
                  const value = column.key ? row[column.key] : "";
                  const isStatus =
                    column.cellType === "status" ||
                    column.header.toLowerCase().includes("status") ||
                    column.header.toLowerCase().includes("risk");
                  const isEmailAction = column.cellType === "email-action";

                  return (
                    <TableCell key={column.id ?? (column.key ? String(column.key) : `col-${columnIndex}`)} className="text-[15px]">
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
