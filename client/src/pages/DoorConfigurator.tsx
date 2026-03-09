import { useIsMobile } from "@/hooks/use-is-mobile";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { ConfigSidebar } from "@/components/door/ConfigSidebar";
import { ProductDetailsSidebar } from "@/components/door/ProductDetailsSidebar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronUp, Settings2, Menu, Eye } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
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
    [setSelectedSection],
  );

  // Sync effect: When editing a cart item, automatically persist changes back to the main store
  useEffect(() => {
    if (config.editingCartItemId && config._hasInteracted) {
      const {
        width, height, thickness, preset, panelType, panelCount,
        panelOrientation, shape, angledLeft, angledRight,
        leftTriangleCutoutWidth, leftTriangleCutoutHeight,
        rightTriangleCutoutWidth, rightTriangleCutoutHeight,
        leftAngleDegrees, rightAngleDegrees,
        leftAngledRailWidth, rightAngledRailWidth,
        borderWidth, customBorders, leftStile, rightStile,
        bottomRail, topRail, rebateWidthMm, rebateDepthMm,
        frontFaceThicknessMm, cornerRadiusMm, rearCornerRadiusMm,
        midRailsEnabled, midRailsEqualise, midRails,
        hingeDrilling, hinges, material, finish, showDimensions
      } = config;

      updateDoor(config.editingCartItemId, {
        width, height, thickness, preset, panelType, panelCount,
        panelOrientation: panelOrientation || "vertical", shape: shape || "rectangular",
        angledLeft, angledRight,
        leftTriangleCutoutWidth, leftTriangleCutoutHeight,
        rightTriangleCutoutWidth, rightTriangleCutoutHeight,
        leftAngleDegrees, rightAngleDegrees,
        leftAngledRailWidth, rightAngledRailWidth,
        borderWidth, customBorders, leftStile, rightStile,
        bottomRail, topRail, rebateWidthMm, rebateDepthMm,
        frontFaceThicknessMm, cornerRadiusMm, rearCornerRadiusMm,
        midRailsEnabled, midRailsEqualise: midRailsEqualise || false,
        midRails: midRailsEnabled ? midRails : [],
        hingeDrilling, hinges: hingeDrilling ? hinges : [],
        material, finish, showDimensions
      } as any);
    }
  }, [
    config.editingCartItemId, config._hasInteracted,
    config.width, config.height, config.thickness, config.preset, config.panelType,
    config.panelCount, config.panelOrientation, config.shape,
    config.angledLeft, config.angledRight,
    config.leftTriangleCutoutWidth, config.leftTriangleCutoutHeight,
    config.rightTriangleCutoutWidth, config.rightTriangleCutoutHeight,
    config.leftAngleDegrees, config.rightAngleDegrees,
    config.leftAngledRailWidth, config.rightAngledRailWidth,
    config.borderWidth, config.customBorders, config.leftStile, config.rightStile,
    config.bottomRail, config.topRail, config.rebateWidthMm, config.rebateDepthMm,
    config.frontFaceThicknessMm, config.cornerRadiusMm, config.rearCornerRadiusMm,
    config.midRailsEnabled, config.midRailsEqualise, config.midRails,
    config.hingeDrilling, config.hinges, config.material, config.finish, config.showDimensions
  ]);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#f9f6ef] overflow-hidden">
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
        "flex-1 relative overflow-hidden flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#f9f6ef] via-white to-[#f0ece1]"
      )}>
        {/* View Mode Toggles */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex p-1.5 bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-md border border-white/50 rounded-full">
          {(["front", "back"] as const).map((mode) => (
            <button key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                viewMode === mode
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 scale-100"
                  : "text-stone-600 hover:text-stone-900 hover:bg-white/60 scale-95 hover:scale-100"
              )}>
              <><Eye className="w-4 h-4" />{mode.toUpperCase()}</>
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

        {/* Mobile Bottom Sheet and Cart Bar */}
        {isMobile && (
          <>
            <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 z-20">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button className="rounded-full shadow-2xl bg-[#c75b33] hover:bg-[#b04f2c] text-white px-6 py-4 h-auto flex items-center gap-2 group border-2 border-[#b04f2c]">
                    <Settings2 className="w-5 h-5 text-white" />
                    <span className="font-bold uppercase text-xs tracking-wider">Configure Door</span>
                    <ChevronUp className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] px-0 pb-0 rounded-t-3xl border-t-0 shadow-2xl bg-white">
                  <div className="sr-only"><SheetHeader><SheetTitle>Door Configurator</SheetTitle></SheetHeader></div>
                  <div className="h-full overflow-y-auto pt-2 bg-white pb-24">
                    <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mb-4" />
                    <div className="px-4 pb-20">
                      <ConfigSidebar isMobile={true} onClose={() => setIsSheetOpen(false)} />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <MobileCartBar />
          </>
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