"use client";

import type { ReactNode, Ref } from "react";
import AppSidebar, { type AppSidebarHandle } from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import type { EvaluationRecord } from "@/lib/types";

export default function AppShell({
  title,
  selectedId,
  onSelect,
  onNewEvaluation,
  sidebarRef,
  wide = false,
  children,
}: {
  title: string;
  selectedId: string | null;
  onSelect: (evaluation: EvaluationRecord) => void;
  onNewEvaluation: () => void;
  sidebarRef?: Ref<AppSidebarHandle>;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar ref={sidebarRef} selectedId={selectedId} onSelect={onSelect} onNewEvaluation={onNewEvaluation} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-sm font-semibold">{title}</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className={`mx-auto flex w-full flex-1 flex-col gap-6 px-6 py-8 ${wide ? "max-w-4xl" : "max-w-3xl"}`}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
