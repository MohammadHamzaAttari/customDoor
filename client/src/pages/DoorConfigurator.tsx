import { useIsMobile } from "@/hooks/use-is-mobile";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { ConfigSidebar } from "@/components/door/ConfigSidebar";
import { ProductDetailsSidebar } from "@/components/door/ProductDetailsSidebar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronUp, Settings2, RotateCcw, Move3d, Menu, Eye } from "lucide-react";
import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { Door2D } from "@/components/door/Door2D";
import { cn } from "@/lib/utils";

// Lazy load 3D only when needed
const Door3DLazy = lazy(() => import("@/components/door/Door3DLazy"));

export default function DoorConfigurator() {
  const isMobile = useIsMobile();
  const config = useDoorConfig();
  const { price, setSelectedSection } = config;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [rotationEnabled, setRotationEnabled] = useState(!isMobile);
  const [viewMode, setViewMode] = useState<"front" | "back" | "3d">("front");

  const canvasRef = useRef<{ resetView: () => void } | null>(null);

  const handleResetView = useCallback(() => {
    canvasRef.current?.resetView();
  }, []);

  const handlePartClick = useCallback(
    (section: string) => setSelectedSection(section),
    [setSelectedSection],
  );

  return (
    <div className="flex flex-col md:flex-row h-full w-full min-h-screen bg-gray-100 overflow-x-hidden overflow-y-auto">
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950 z-20 shadow-sm shrink-0">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2" onClick={() => setIsSheetOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white leading-tight">Trade Shaker</h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Custom Door Designer</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 font-medium block">Price:</span>
            <span className="text-lg font-bold text-amber-400">£{price.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      {!isMobile && (
        <div className="h-full w-[380px] shadow-xl z-20 relative shrink-0 bg-zinc-950 border-r border-zinc-800">
          <ConfigSidebar isMobile={false} />
        </div>
      )}

      {/* Main Viewer Area */}
      <div className={cn(
        "flex-1 relative overflow-hidden flex flex-col",
        viewMode === "3d" ? "bg-gradient-to-br from-zinc-950 via-slate-950 to-neutral-950" : "bg-white"
      )}>
        {/* View Mode Toggles */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200">
          {(["front", "back", "3d"] as const).map((mode) => (
            <button key={mode}
              onClick={() => { if (mode === "3d") setRotationEnabled(!isMobile); setViewMode(mode); }}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5",
                viewMode === mode
                  ? mode === "3d" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md" : "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              )}>
              {mode === "3d" ? <><RotateCcw className="w-3.5 h-3.5" />3D</> : <><Eye className="w-3.5 h-3.5" />{mode.toUpperCase()}</>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 relative w-full h-full">
          {viewMode === "3d" ? (
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-zinc-400">Loading 3D view...</div>}>
              <Door3DLazy ref={canvasRef} config={config} onPartClick={handlePartClick} rotationEnabled={rotationEnabled} isMobile={isMobile} forceHideLabels={isMobile && isSheetOpen} />
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <Button variant="secondary" size="icon" onClick={handleResetView} className="bg-zinc-900/80 backdrop-blur-md shadow-lg hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50" title="Reset View">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-4 right-4 pointer-events-none z-10">
                <div className="bg-zinc-900/70 backdrop-blur-md rounded-lg px-3 py-2 border border-zinc-700/40">
                  <p className="text-[10px] text-zinc-300 opacity-90 font-medium">🖱️ Drag to rotate • Scroll to zoom</p>
                </div>
              </div>
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <Door2D face={viewMode} />
            </div>
          )}

          {/* Branding */}
          <div className="absolute bottom-4 left-4 pointer-events-none z-10">
            <div className={cn("rounded-lg px-3 py-2 shadow-lg border",
              viewMode === "3d" ? "bg-zinc-900/70 backdrop-blur-md border-zinc-700/40" : "bg-gray-50 border-gray-200")}>
              <p className={cn("text-xs font-bold tracking-wide", viewMode === "3d" ? "text-amber-400" : "text-orange-600")}>Freebird Trade</p>
              <p className={cn("text-[10px]", viewMode === "3d" ? "text-zinc-400" : "text-gray-500")}>Premium Door Manufacturer</p>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Sheet */}
        {isMobile && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button className="rounded-full shadow-2xl bg-zinc-100 hover:bg-white text-zinc-950 px-6 py-6 h-auto flex items-center gap-2 group border-2 border-zinc-200">
                  <Settings2 className="w-5 h-5 text-zinc-950" />
                  <span className="font-bold uppercase text-xs tracking-wider">Configure Door</span>
                  <ChevronUp className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] px-0 pb-0 rounded-t-3xl border-t-0 shadow-2xl bg-zinc-950">
                <div className="sr-only"><SheetHeader><SheetTitle>Door Configurator</SheetTitle></SheetHeader></div>
                <div className="h-full overflow-y-auto pt-2 bg-zinc-950">
                  <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4" />
                  <div className="px-4 pb-20">
                    <ConfigSidebar isMobile={true} onClose={() => setIsSheetOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* Desktop Right Sidebar */}
      {!isMobile && (
        <div className="h-full w-[340px] shadow-xl z-20 relative shrink-0 bg-zinc-950 border-l border-zinc-800">
          <ProductDetailsSidebar />
        </div>
      )}
    </div>
  );
}