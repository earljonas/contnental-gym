"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, Menu, RotateCcw, Search } from "lucide-react";

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
  cellType?: "text" | "status" | "email-action" | "payment-action" | "member-view";
};

type FilterConfig<T> = {
  key: keyof T;
  label: string;
  options: string[];
};

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

function MemberViewMenu({
  rowId,
  memberViewPath,
}: {
  rowId: string | number;
  memberViewPath: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    function closeMenu() {
      setOpen(false);
    }

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [open]);

  function toggleMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(12, rect.right - 176),
      });
    }
    setOpen((current) => !current);
  }

  return (
    <div className="flex justify-end">
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-xl"
        onClick={toggleMenu}
        aria-label="Open member actions"
        aria-expanded={open}
      >
        <Menu className="size-4" />
      </Button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[80] w-44 rounded-2xl border border-border bg-card p-1"
              style={{ top: position.top, left: position.left }}
            >
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-full justify-start rounded-xl px-3"
                onClick={() => {
                  setOpen(false);
                  router.push(`${memberViewPath}?memberId=${rowId}`);
                }}
              >
                <Eye className="size-4 text-muted-foreground" />
                View
              </Button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function ResourceTable<T extends Record<string, unknown>>({
  columns,
  rows,
  searchPlaceholder,
  searchKeys,
  filters = [],
  dateKey,
  onPaymentConfirm,
  memberViewPath = "/admin/members",
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder: string;
  searchKeys: (keyof T)[];
  filters?: FilterConfig<T>[];
  dateKey?: keyof T;
  onPaymentConfirm?: (id: number) => Promise<unknown>;
  memberViewPath?: string;
}) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<keyof T | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
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
    setPage(1);
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

    const rawDate = String(row[dateKey] ?? "");
    const rowYMD = normalizeToYMD(rawDate);
    if (!rowYMD) return false;

    if (dateFrom && rowYMD < dateFrom) return false;
    if (dateTo && rowYMD > dateTo) return false;

    return true;
  });

  if (sortKey) {
    filteredRows = [...filteredRows].sort((a, b) => {
      const left = String(a[sortKey] ?? "");
      const right = String(b[sortKey] ?? "");
      const leftDate = Date.parse(left);
      const rightDate = Date.parse(right);

      const result =
        !Number.isNaN(leftDate) && !Number.isNaN(rightDate)
          ? leftDate - rightDate
          : left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });

      return sortDirection === "asc" ? result : -result;
    });
  }

  const rowsPerPage = 10;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[26px] border border-border bg-secondary/35 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border-border bg-background pl-10 text-sm"
            />
          </div>

          {availableFilters.map((filter) => (
            <Select
              key={String(filter.key)}
              value={activeFilters[String(filter.key)] ?? "All"}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => {
                  setActiveFilters((current) => ({
                    ...current,
                    [String(filter.key)]: value,
                  }));
                  setPage(1);
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
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
                className="h-10 flex-1 lg:w-[130px] rounded-xl border-border bg-background text-sm"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="date"
                aria-label={`${dateColumnLabel} to`}
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
                className="h-10 flex-1 lg:w-[130px] rounded-xl border-border bg-background text-sm"
              />
            </div>
          ) : null}

          <div className="flex items-center gap-2">

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
            paginatedRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, columnIndex) => {
                  const value = column.key ? String(row[column.key] ?? "") : "";
                  const isStatus =
                    column.cellType === "status" ||
                    column.header.toLowerCase().includes("status") ||
                    column.header.toLowerCase().includes("risk");
                  const isEmailAction = column.cellType === "email-action";
                  const isPaymentAction = column.cellType === "payment-action";
                  const isMemberView = column.cellType === "member-view";

                  return (
                    <TableCell key={column.id ?? (column.key ? String(column.key) : `col-${columnIndex}`)} className="text-[15px]">
                      {isMemberView ? (
                        <MemberViewMenu
                          rowId={row["id"] as string | number}
                          memberViewPath={memberViewPath}
                        />
                      ) : isEmailAction ? (
                        <Button asChild variant="outline" className="h-9 rounded-full px-3.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                          <a href={`mailto:${value}`}>Email</a>
                        </Button>
                      ) : isPaymentAction ? (
                        row["status"] === "Pending" ? (
                          <Button
                            onClick={() => onPaymentConfirm?.(row["id"] as number)}
                            className="h-9 rounded-full px-3.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                          >
                            Confirm
                          </Button>
                        ) : null
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

      {filteredRows.length > rowsPerPage ? (
        <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {(currentPage - 1) * rowsPerPage + 1}-
            {Math.min(currentPage * rowsPerPage, filteredRows.length)} of{" "}
            {filteredRows.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-3"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="min-w-16 text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {currentPage}/{pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-3"
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              disabled={currentPage === pageCount}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
