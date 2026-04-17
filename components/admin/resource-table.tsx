"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";

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
  key: keyof T;
};

type FilterConfig<T> = {
  key: keyof T;
  label: string;
  options: string[];
};

function isDateValue(value: string) {
  return !Number.isNaN(Date.parse(value));
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

  let filteredRows = rows.filter((row) => {
    const matchesSearch =
      deferredSearch.trim().length === 0 ||
      searchKeys.some((key) =>
        String(row[key]).toLowerCase().includes(deferredSearch.toLowerCase())
      );

    if (!matchesSearch) return false;

    const matchesFilters = filters.every((filter) => {
      const filterValue = activeFilters[String(filter.key)];
      return !filterValue || filterValue === "All" || row[filter.key] === filterValue;
    });

    if (!matchesFilters) return false;

    if (!dateKey || (!dateFrom && !dateTo)) return true;

    const rawDate = row[dateKey];
    if (!isDateValue(rawDate)) return true;

    const rowDate = new Date(rawDate);
    if (dateFrom && rowDate < new Date(dateFrom)) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (rowDate > end) return false;
    }

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative min-w-[240px] flex-1 xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 rounded-2xl pl-9"
            />
          </div>

          {filters.map((filter) => (
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
              className="min-w-[160px]"
            >
              <option value="All">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {dateKey ? (
            <>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-11 rounded-2xl"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-11 rounded-2xl"
              />
            </>
          ) : null}

          <div className="flex gap-2">
            <Select
              value={String(sortKey)}
              onChange={(event) => setSortKey(event.target.value as keyof T | "")}
              className="min-w-[160px]"
            >
              <option value="">Sort by</option>
              {columns.map((column) => (
                <option key={String(column.key)} value={String(column.key)}>
                  {column.header}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl px-4"
              onClick={() =>
                setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
              }
            >
              <ArrowUpDown className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No results
              </TableCell>
            </TableRow>
          ) : (
            filteredRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => {
                  const value = row[column.key];
                  const isStatus =
                    column.header.toLowerCase().includes("status") ||
                    column.header.toLowerCase().includes("risk");

                  return (
                    <TableCell key={String(column.key)}>
                      {isStatus ? <Badge variant="secondary">{value}</Badge> : value}
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
