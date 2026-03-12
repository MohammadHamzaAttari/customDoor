import { useIsMobile } from "@/hooks/use-is-mobile";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { ConfigSidebar } from "@/components/door/ConfigSidebar";
import { ProductDetailsSidebar } from "@/components/door/ProductDetailsSidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronUp, Settings2, Menu, Eye, Sparkles } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useDoorStore } from "@/lib/stores/useDoorStore";
import { Door2D } from "@/components/door/Door2D";
import { cn } from "@/lib/utils";
import { MobileCartBar } from "@/components/door/ProductDetailsSidebar";

export default function DoorConfigurator() {
  const isMobile = useIsMobile();
  const config = useDoorConfig();
  const { price, setSelectedSection, isNewSession } = config;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"front" | "back">("front");

  const { activeDoorId, updateDoor, doors } = useDoorStore();

  const handlePartClick = useCallback(
    (section: string) => setSelectedSection(section),
    [setSelectedSection]
  );

  // Sync effect: When editing a cart item, automatically persist changes back to the main store
  useEffect(() => {
    if (config.editingCartItemId && config._hasInteracted) {
      const {
        width,
        height,
        thickness,
        panelType,
        panelCount,
        panelOrientation,
        angledLeft,
        angledRight,
        leftTriangleCutoutWidth,
        leftTriangleCutoutHeight,
        rightTriangleCutoutWidth,
        rightTriangleCutoutHeight,
        leftAngleDegrees,
        rightAngleDegrees,
        leftAngledRailWidth,
        rightAngledRailWidth,
        borderWidth,
        customBorders,
        leftStile,
        rightStile,
        bottomRail,
        topRail,
        rebateWidthMm,
        rebateDepthMm,
        frontFaceThicknessMm,
        cornerRadiusMm,
        rearCornerRadiusMm,
        midRailsEnabled,
        midRailsEqualise,
        midRails,
        hingeDrilling,
        hinges,
        finish,
        showDimensions,
      } = config;

      updateDoor(config.editingCartItemId, {
        width,
        height,
        thickness,
        panelType,
        panelCount,
        panelOrientation: panelOrientation || "vertical",
        shape: (angledLeft || angledRight) ? "angled" : "rectangular",
        angledLeft,
        angledRight,
        leftTriangleCutoutWidth,
        leftTriangleCutoutHeight,
        rightTriangleCutoutWidth,
        rightTriangleCutoutHeight,
        leftAngleDegrees,
        rightAngleDegrees,
        leftAngledRailWidth,
        rightAngledRailWidth,
        borderWidth,
        customBorders,
        leftStile,
        rightStile,
        bottomRail,
        topRail,
        rebateWidthMm,
        rebateDepthMm,
        frontFaceThicknessMm,
        cornerRadiusMm,
        rearCornerRadiusMm,
        midRailsEnabled,
        midRailsEqualise: midRailsEqualise || false,
        midRails: midRailsEnabled ? midRails : [],
        hingeDrilling,
        hinges: hingeDrilling ? hinges : [],
        material: "MDF",
        finish,
        showDimensions,
      } as any);
    }
  }, [
    config.editingCartItemId,
    config._hasInteracted,
    config.width,
    config.height,
    config.thickness,
    config.panelType,
    config.panelCount,
    config.panelOrientation,
    config.angledLeft,
    config.angledRight,
    config.leftTriangleCutoutWidth,
    config.leftTriangleCutoutHeight,
    config.rightTriangleCutoutWidth,
    config.rightTriangleCutoutHeight,
    config.leftAngleDegrees,
    config.rightAngleDegrees,
    config.leftAngledRailWidth,
    config.rightAngledRailWidth,
    config.borderWidth,
    config.customBorders,
    config.leftStile,
    config.rightStile,
    config.bottomRail,
    config.topRail,
    config.rebateWidthMm,
    config.rebateDepthMm,
    config.frontFaceThicknessMm,
    config.cornerRadiusMm,
    config.rearCornerRadiusMm,
    config.midRailsEnabled,
    config.midRailsEqualise,
    config.midRails,
    config.hingeDrilling,
    config.hinges,
    config.finish,
    config.showDimensions,
  ]);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#f9f6ef] overflow-hidden">
      {/* ── Mobile Header ── */}
      {isMobile && (
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 z-20 shadow-lg shadow-black/40 shrink-0 relative overflow-hidden">
          {/* Subtle top edge glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 -ml-2 rounded-xl transition-all duration-300"
            onClick={() => setIsSheetOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-[15px] font-black text-white leading-tight tracking-tight">
              Trade Shaker
            </h1>
            <p className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] font-bold mt-0.5">
              Custom Door Designer
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-[0.15em] mb-0.5">
              Est. Price
            </span>
            <span className="text-[17px] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 tabular-nums tracking-tight">
              £{isNewSession ? "0.00" : (price || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ── Desktop Left Sidebar ── */}
      {!isMobile && (
        <div className="h-full w-[380px] shadow-xl z-20 relative shrink-0 bg-zinc-950 border-r border-zinc-800">
          <ConfigSidebar isMobile={false} />
        </div>
      )}

      {/* ── Main Viewer Area ── */}
      <div
        className={cn(
          "flex-1 relative overflow-hidden flex flex-col",
          "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#f9f6ef] via-white to-[#f0ece1]"
        )}
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* View Mode Toggle */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 animate-in">
          <div className="flex p-1.5 glass-strong rounded-full shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1)] border border-white/60">
            <div className="relative flex w-full">
              {/* Sliding Background Indicator */}
              <div
                className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-md shadow-orange-500/20 transition-all duration-500 ease-out"
                style={{ transform: `translateX(${viewMode === "front" ? "0%" : "100%"})` }}
              />

              {(["front", "back"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex-1 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-colors duration-300 flex items-center justify-center gap-2 relative z-10",
                    viewMode === mode
                      ? "text-white"
                      : "text-stone-500 hover:text-stone-800"
                  )}
                >
                  <Eye className={cn("w-3.5 h-3.5", viewMode === mode ? "opacity-100" : "opacity-60")} />
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative w-full h-full pt-14">
          <div className="w-full h-full flex items-center justify-center bg-transparent relative">
            <Door2D face={viewMode} />

            {/* New Session Onboarding Overlay */}
            {isNewSession && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50/60 backdrop-blur-md z-10 animate-in">
                <div className="text-center p-10 max-w-md w-full mx-4 glass-strong rounded-[2rem] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                  {/* Subtle animated card glow */}
                  <div className="absolute -inset-2 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />

                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-white to-orange-50 border border-orange-100/50 flex items-center justify-center shadow-lg shadow-orange-500/10 animate-float">
                    <Sparkles className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-br from-orange-500 to-red-500 drop-shadow-sm" style={{ stroke: "url(#orange-gradient)" }} />
                    {/* SVG Gradient definition for lucide icon */}
                    <svg width="0" height="0">
                      <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop stopColor="#f97316" offset="0%" />
                        <stop stopColor="#ef4444" offset="100%" />
                      </linearGradient>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-stone-800 mb-3 tracking-tight">
                    Start Designing
                  </h3>
                  <p className="text-sm font-medium text-stone-500 leading-relaxed mb-8">
                    Use the sidebar panels to set custom dimensions, select panel styles, and configure mid-rails. The preview and price update instantly.
                  </p>

                  {!isMobile && (
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-stone-800 text-stone-100 shadow-md shadow-stone-800/20 border border-stone-700 animate-pulse-soft">
                      <span className="text-[13px] font-bold tracking-wide">
                        ← Configure your door
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Brand Watermark */}
          <div className="absolute bottom-5 left-5 pointer-events-none z-10 animate-in-up">
            <div className="rounded-2xl px-5 py-3.5 glass-strong border-white/60 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
              <p className="text-[13px] font-black tracking-wide text-gradient drop-shadow-sm">
                Freebird Trade
              </p>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                CNC Door Designer
              </p>
            </div>
          </div>

          {/* Dimensions Badge */}
          {!isNewSession && !isMobile && (
            <div className="absolute top-5 right-5 z-10 animate-in">
              <div className="glass-strong rounded-full px-5 py-2.5 border-white/60 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                <p className="text-[11px] font-black text-stone-600 uppercase tracking-widest tabular-nums flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                  {config.width} <span className="text-stone-400 font-normal">W</span> × {config.height} <span className="text-stone-400 font-normal">H</span> <span className="text-stone-300 mx-1">|</span> {config.thickness}mm
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Sheet and Cart Bar */}
        {isMobile && (
          <>
            <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 z-20">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button className="rounded-full shadow-[0_10px_40px_-10px_rgba(199,91,51,0.5)] bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-7 py-4 h-auto flex items-center gap-2 group border border-orange-400/30 transition-all duration-300 hover:shadow-[0_15px_50px_-10px_rgba(199,91,51,0.6)] hover:-translate-y-1 animate-pulse-soft btn-press relative overflow-hidden">
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                    <Settings2 className="w-5 h-5 text-white/90 group-hover:rotate-90 transition-transform duration-500 relative z-10" />
                    <span className="font-bold uppercase text-[11px] tracking-[0.15em] relative z-10">
                      Configure
                    </span>
                    <ChevronUp className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180 relative z-10" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="h-[85vh] px-0 pb-0 rounded-t-3xl border-t-0 shadow-2xl bg-white"
                >
                  <div className="sr-only">
                    <SheetHeader>
                      <SheetTitle>Door Configurator</SheetTitle>
                    </SheetHeader>
                  </div>
                  <div className="h-full overflow-y-auto pt-2 bg-white pb-24 scrollbar-autohide">
                    <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mb-4" />
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

            <MobileCartBar />
          </>
        )}
      </div>

      {/* ── Desktop Right Sidebar ── */}
      {!isMobile && (
        <div className="h-full w-[340px] shadow-xl z-20 relative shrink-0 bg-zinc-950 border-l border-zinc-800">
          <ProductDetailsSidebar />
        </div>
      )}
    </div>
  );
}