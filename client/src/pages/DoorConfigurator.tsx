import { useIsMobile } from "@/hooks/use-is-mobile";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { ConfigSidebar } from "@/components/door/ConfigSidebar";
import { ProductDetailsSidebar } from "@/components/door/ProductDetailsSidebar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronUp, Settings2, RotateCcw, Menu, Eye } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Door2D } from "@/components/door/Door2D";
import { cn } from "@/lib/utils";

export default function DoorConfigurator() {
  const isMobile = useIsMobile();
  const config = useDoorConfig();
  const { price, setSelectedSection, isNewSession } = config;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"front" | "back">("front");

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
            <span className="text-lg font-bold text-amber-400">£{isNewSession ? '0.00' : price.toFixed(2)}</span>
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
        "flex-1 relative overflow-hidden flex flex-col bg-white"
      )}>
        {/* View Mode Toggles */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200">
          {(["front", "back"] as const).map((mode) => (
            <button key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5",
                viewMode === mode
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              )}>
              <><Eye className="w-3.5 h-3.5" />{mode.toUpperCase()}</>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 relative w-full h-full">
          <div className="w-full h-full flex items-center justify-center bg-white relative">
            <Door2D face={viewMode} />
            {isNewSession && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] z-10">
                <div className="text-center py-8 px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-sm">
                    <Settings2 className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Configure Your Door</h3>
                  <p className="text-sm text-gray-500 max-w-xs">Use the sidebar to set dimensions, style, and options. The preview and price will update as you go.</p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4 pointer-events-none z-10">
            <div className="rounded-lg px-3 py-2 shadow-lg border bg-gray-50 border-gray-200">
              <p className="text-xs font-bold tracking-wide text-orange-600">Freebird Trade</p>
              <p className="text-[10px] text-gray-500">Premium Door Manufacturer</p>
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