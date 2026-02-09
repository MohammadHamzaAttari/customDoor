// client/src/components/ui/FloatingSyncStatus.tsx
import React from "react";
import { useSyncStatus } from "@/lib/stores/useSyncStatus";
import { SyncStatusPanel } from "@/components/ui/SyncStatusPanel";

export function FloatingSyncStatus() {
  const { phase } = useSyncStatus();
  
  // Only show as floating panel when actively syncing
  if (phase === "idle") return null;
  
  return <SyncStatusPanel />;
}