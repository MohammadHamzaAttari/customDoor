import { useIsMobile } from "@/hooks/use-is-mobile";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { ConfigSidebar } from "@/components/door/ConfigSidebar";
import { ProductDetailsSidebar } from "@/components/door/ProductDetailsSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronUp, Settings2, RotateCcw, Move3d } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import Door3DLazy from "@/components/door/Door3DLazy";

export default function DoorConfigurator() {
  const isMobile = useIsMobile();
  const config = useDoorConfig();
  const { price, setSelectedSection } = config;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [rotationEnabled, setRotationEnabled] = useState(!isMobile);

  // Exposed from Door3DCanvas via imperative handle
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
      {/* ─── Mobile Header ─── */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 z-20 shadow-sm shrink-0">
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              Trade Shaker
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Custom Door Designer
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 font-medium block">
              Total Price:
            </span>
            <span className="text-lg font-bold text-amber-400">
              £{price.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ─── Desktop Left Sidebar ─── */}
      {!isMobile && (
        <div className="h-full w-[380px] shadow-xl z-20 relative shrink-0 bg-zinc-950 border-r border-zinc-800">
          <ConfigSidebar isMobile={false} />
        </div>
      )}

      {/* ─── Main 3D Viewer ─── */}
      <div className="flex-1 relative bg-gradient-to-br from-zinc-950 via-slate-950 to-neutral-950 overflow-hidden">
        {/* 3D Canvas — lazy loaded, Three.js downloads AFTER page paints */}
        <Door3DLazy
          ref={canvasRef}
          config={config}
          onPartClick={handlePartClick}
          rotationEnabled={rotationEnabled}
          isMobile={isMobile}
        />

        {/* Ambient glow overlays for atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
        </div>

        {/* View Controls Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleResetView}
            className="bg-zinc-900/80 backdrop-blur-md shadow-lg hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50 transition-all hover:border-amber-500/30 hover:shadow-amber-500/10"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          {isMobile && (
            <Button
              variant={rotationEnabled ? "default" : "secondary"}
              size="icon"
              onClick={() => setRotationEnabled(!rotationEnabled)}
              className={
                rotationEnabled
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30"
                  : "bg-zinc-900/80 backdrop-blur-md shadow-lg hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50"
              }
              title={
                rotationEnabled
                  ? "Disable 3D Rotation"
                  : "Enable 3D Rotation"
              }
            >
              <Move3d className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Branding Watermark */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="bg-zinc-900/70 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-zinc-700/40">
            <p className="text-xs font-bold text-amber-400 tracking-wide">
              Freebird Trade
            </p>
            <p className="text-[10px] text-zinc-400">
              Premium Door Manufacturer
            </p>
          </div>
        </div>

        {/* Interaction Hints */}
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <div className="bg-zinc-900/70 backdrop-blur-md rounded-lg px-3 py-2 border border-zinc-700/40">
            <p className="text-[10px] text-zinc-300 opacity-90 font-medium">
              {isMobile
                ? rotationEnabled
                  ? "🔄 Rotation ON • Tap button to scroll"
                  : "📜 Scroll enabled • Tap 3D button to rotate"
                : "🖱️ Drag to rotate • Scroll to zoom"}
            </p>
          </div>
        </div>

        {/* Mobile Bottom Sheet Trigger */}
        {isMobile && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button className="rounded-full shadow-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 px-6 py-6 h-auto flex items-center gap-2 group border-2 border-amber-300/20 transition-all hover:scale-105 active:scale-95 shadow-amber-500/30">
                  <Settings2 className="w-5 h-5" />
                  <span className="font-bold uppercase text-xs tracking-wider">
                    Configure Door
                  </span>
                  <ChevronUp className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[85vh] px-0 pb-0 rounded-t-3xl border-t-0 shadow-2xl bg-zinc-950"
              >
                <div className="h-full overflow-y-auto pt-2 bg-zinc-950">
                  <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4" />
                  <div className="px-4 pb-20">
                    <ConfigSidebar
                      isMobile={true}
                      onClose={() => setIsSheetOpen(false)}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* ─── Desktop Right Sidebar ─── */}
      {!isMobile && (
        <div className="h-full w-[340px] shadow-xl z-20 relative shrink-0 bg-zinc-950 border-l border-zinc-800">
          <ProductDetailsSidebar />
        </div>
      )}
    </div>
  );
}