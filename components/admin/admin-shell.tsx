"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/supabase/roles";
import { cn } from "@/lib/utils";

type AdminTheme = "light" | "dark";

const THEME_STORAGE_KEY = "continental-admin-theme";
const SIDEBAR_STORAGE_KEY = "continental-admin-sidebar-collapsed";

export function AdminShell({
  children,
  role,
  userName,
  initialTheme,
  initialSidebarCollapsed,
}: {
  children: React.ReactNode;
  role: AppRole;
  userName: string;
  initialTheme: AdminTheme;
  initialSidebarCollapsed: boolean;
}) {
  const [theme, setTheme] = useState<AdminTheme>(initialTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(initialSidebarCollapsed);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
    document.cookie = `${SIDEBAR_STORAGE_KEY}=${String(isSidebarCollapsed)}; path=/; max-age=31536000; samesite=lax`;
  }, [isSidebarCollapsed]);

  const isLightMode = theme === "light";

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground transition-colors duration-300",
        isLightMode && "light"
      )}
    >
      <AdminSidebar
        userName={userName}
        role={role}
        isCollapsed={isSidebarCollapsed}
        isOpen={isSidebarOpen}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
        onToggleMobile={() => setIsSidebarOpen((current) => !current)}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-20 bg-black/45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-out",
          isSidebarCollapsed ? "lg:pl-24" : "lg:pl-72"
        )}
      >
        <header className="sticky top-0 z-20 border-b border-border bg-background/88 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-2xl"
                aria-label={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
                onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              >
                {isLightMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </Button>
              <form action="/auth/signout" method="post">
                <Button
                  variant="outline"
                  className="h-10 rounded-2xl px-4 text-xs font-semibold uppercase tracking-[0.16em]"
                >
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-81px)] bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
