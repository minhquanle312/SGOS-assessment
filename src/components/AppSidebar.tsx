"use client";

import { useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { PlusIcon, GraduationCapIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { EvaluationListItem, EvaluationRecord } from "@/lib/types";

export type AppSidebarHandle = {
  refresh: () => void;
};

const AppSidebar = forwardRef<
  AppSidebarHandle,
  {
    selectedId: string | null;
    onSelect: (evaluation: EvaluationRecord) => void;
    onNewEvaluation: () => void;
  }
>(function AppSidebar({ selectedId, onSelect, onNewEvaluation }, ref) {
  const [items, setItems] = useState<EvaluationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch("/api/evaluations");
      const data = await res.json();
      setItems(res.ok ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  useImperativeHandle(ref, () => ({ refresh: fetchList }));

  async function handleSelect(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/evaluations/${id}`);
      const data = await res.json();
      if (res.ok) onSelect(data as EvaluationRecord);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 pt-3">
        <div className="flex items-center gap-2 px-2 text-sm font-semibold group-data-[collapsible=icon]:justify-center">
          <GraduationCapIcon className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">SGOS Assistant</span>
        </div>
        <Button onClick={onNewEvaluation} className="w-full justify-start gap-2">
          <PlusIcon className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">New evaluation</span>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && (
                <p className="px-2 py-1 text-xs text-sidebar-foreground/60">Loading...</p>
              )}
              {!loading && items.length === 0 && (
                <p className="px-2 py-1 text-xs text-sidebar-foreground/60">No evaluations yet.</p>
              )}
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={selectedId === item.id}
                    disabled={loadingId === item.id}
                    onClick={() => handleSelect(item.id)}
                    tooltip={item.learningGoal}
                  >
                    <span className="truncate">{item.learningGoal}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
});

export default AppSidebar;
