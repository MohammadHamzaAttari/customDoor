// client/src/components/door/ConfigSidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  useDoorConfig,
  MIN_BORDER_WITH_HINGES,
  MIN_BORDER_WITHOUT_HINGES,
  MIN_WIDTH_MM,
  MAX_WIDTH_MM,
  MIN_HEIGHT_MM,
  MAX_HEIGHT_MM,
  MIN_SHORT_SIDE_HEIGHT_MM,
  HINGE_CUP_DIAMETER_MM,
} from "@/lib/stores/useDoorConfig";
import { useDoorStore } from "@/lib/stores/useDoorStore";
import { AngledCornersSection } from "@/components/door/sections/AngledCornersSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/NumberInput";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Info,
  Plus,
  X,
  AlertTriangle,
  ArrowLeftRight,
  Equal,
  RotateCcw,
  ShieldAlert,
  Ruler,
  Layers,
  Square,
  TriangleRight,
  GripHorizontal,
  Paintbrush,
  Wrench,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// INFO TOOLTIP COMPONENT
// ============================================

function InfoTip({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 hover:bg-orange-100 hover:scale-110 transition-all duration-200"
            onClick={(e) => e.preventDefault()}
          >
            <Info className="h-3 w-3 text-stone-400" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm shadow-lg" side="top">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// RESET CONFIRMATION BUTTON
// ============================================

function ResetConfigButton({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (confirming) {
      timerRef.current = setTimeout(() => setConfirming(false), 5000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [confirming]);

  return (
    <div className="mt-6 mb-2">
      {!confirming ? (
        <Button
          variant="outline"
          className="w-full text-red-400 border-red-200/50 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300 rounded-xl btn-press group"
          onClick={() => setConfirming(true)}
        >
          <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-[-180deg] transition-transform duration-500" />
          Reset Configuration
        </Button>
      ) : (
        <div className="animate-in rounded-2xl overflow-hidden border-2 border-red-200 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 shadow-lg shadow-red-500/10">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-md shadow-red-500/30 animate-pulse-soft">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">
              Reset Everything?
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              This will restore all settings to factory defaults.
              <br />This action cannot be undone.
            </p>
          </div>
          {/* Actions */}
          <div className="flex gap-2 px-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 transition-all duration-200 btn-press"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-md shadow-red-500/20 transition-all duration-200 btn-press font-bold"
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Yes, Reset All
            </Button>
          </div>
          {/* Auto-dismiss progress bar */}
          <div className="h-0.5 bg-red-100">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full"
              style={{ animation: "shrink 5s linear forwards" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN SIDEBAR
// ============================================

interface ConfigSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function ConfigSidebar({
  isMobile = false,
  onClose,
}: ConfigSidebarProps) {
  const { selectedSection, setSelectedSection, angleValidationIssues, ...config } =
    useDoorConfig();
  const { activeDoorId, updateDoor } = useDoorStore();

  const hasAngleErrors = angleValidationIssues.some((i) => i.type === "error");
  const hasAngleWarnings = angleValidationIssues.some(
    (i) => i.type === "warning"
  );

  return (
    <div
      className={cn(
        "w-full h-full bg-white flex flex-col shadow-lg",
        !isMobile && "md:w-96 border-l border-gray-200"
      )}
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-orange-100 bg-white relative overflow-hidden flex flex-col items-start shadow-sm">
        {/* Subtle dot pattern texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: "16px 16px" }}
        />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-400/20 to-transparent rounded-bl-full blur-[40px] pointer-events-none" />

        <div className="flex flex-col relative z-10 w-full">
          <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 tracking-tight flex items-center gap-2">
            Configurator
          </h1>
          <p className="text-[12px] text-stone-500 mt-1 font-semibold tracking-wide uppercase">
            Design your perfect door
          </p>
        </div>
      </div>

      {/* Global validation banner */}
      {hasAngleErrors && (
        <div className="mx-4 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-700 font-semibold">
            {angleValidationIssues.filter((i) => i.type === "error").length}{" "}
            configuration error(s) must be resolved
          </span>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 scrollbar-autohide">
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-2 mt-4"
          value={selectedSection}
          onValueChange={setSelectedSection}
        >
          <AccordionItem
            value="dimensions"
            className="border-0 rounded-2xl px-4 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-gradient-to-b from-white to-stone-50/50 hover:shadow-[0_8px_30px_rgba(199,91,51,0.08)] transition-all duration-300 data-[state=open]:shadow-[0_10px_40px_rgba(199,91,51,0.12)] data-[state=open]:bg-white group"
          >
            <AccordionTrigger className="text-[15px] font-bold text-stone-700 hover:text-orange-600 hover:no-underline py-4">
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-data-[state=open]:bg-orange-100 group-hover:bg-orange-100 transition-colors">
                  <Ruler className="w-4 h-4 text-orange-500" />
                </div>
                Dimensions
                {config.width > 0 && config.height > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1 animate-scale-in" />
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                <DoorDimensionsSection />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4 text-[10px] h-8 uppercase tracking-wider text-stone-400 hover:text-orange-600 border border-dashed border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200 rounded-lg btn-press"
                  onClick={() => {
                    config.setWidth(0);
                    config.setHeight(0);
                    config.setPanelType("UNSELECTED");
                  }}
                >
                  Clear All
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="door-style"
            className="border-0 rounded-2xl px-4 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-gradient-to-b from-white to-stone-50/50 hover:shadow-[0_8px_30px_rgba(199,91,51,0.08)] transition-all duration-300 data-[state=open]:shadow-[0_10px_40px_rgba(199,91,51,0.12)] data-[state=open]:bg-white group"
          >
            <AccordionTrigger className="text-[15px] font-bold text-stone-700 hover:text-orange-600 hover:no-underline py-4">
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-data-[state=open]:bg-orange-100 group-hover:bg-orange-100 transition-colors">
                  <Layers className="w-4 h-4 text-orange-500" />
                </div>
                Thickness & Panel
                <Badge variant="secondary" className="text-[10px] font-black tracking-wider uppercase bg-stone-100 text-stone-600 border-none ml-2">
                  {config.thickness}mm {config.panelType === "NONE" ? "Slab" : "Shaker"}
                </Badge>
                {config.panelType !== "UNSELECTED" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in" />
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <DoorStyleSection />
            </AccordionContent>
          </AccordionItem>

          {config.panelType !== "NONE" && (
            <AccordionItem
              value="borders"
              className="border-0 rounded-2xl px-4 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-gradient-to-b from-white to-stone-50/50 hover:shadow-[0_8px_30px_rgba(199,91,51,0.08)] transition-all duration-300 data-[state=open]:shadow-[0_10px_40px_rgba(199,91,51,0.12)] data-[state=open]:bg-white group"
            >
              <AccordionTrigger className="text-[15px] font-bold text-stone-700 hover:text-orange-600 hover:no-underline py-4">
                <span className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-data-[state=open]:bg-orange-100 group-hover:bg-orange-100 transition-colors">
                    <Square className="w-4 h-4 text-orange-500" />
                  </div>
                  Frames & Borders
                  {(config.borderWidth > 0 || config.customBorders) && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in ml-1" />
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <BorderWidthsSection />
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem
            value="angled"
            className={cn(
              "border-0 rounded-2xl px-4 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 data-[state=open]:shadow-[0_10px_40px_rgba(199,91,51,0.12)] data-[state=open]:bg-white group",
              hasAngleErrors
                ? "bg-red-50 hover:shadow-red-500/10"
                : hasAngleWarnings
                  ? "bg-amber-50 hover:shadow-amber-500/10"
                  : "bg-gradient-to-b from-white to-stone-50/50 hover:shadow-[0_8px_30px_rgba(199,91,51,0.08)]"
            )}
          >
            <AccordionTrigger className="text-[15px] font-bold text-stone-700 hover:text-orange-600 hover:no-underline py-4">
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-data-[state=open]:bg-orange-100 group-hover:bg-orange-100 transition-colors">
                  <TriangleRight className="w-4 h-4 text-orange-500" />
                </div>
                Angled Corners
                {(config.angledLeft || config.angledRight) && (
                  <>
                    <Badge variant="default" className="text-[10px] font-black uppercase tracking-wider bg-orange-500 hover:bg-orange-600 ml-2 shadow-sm">
                      Active
                    </Badge>
                    {hasAngleErrors && (
                      <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                    )}
                    {!hasAngleErrors && hasAngleWarnings && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <AngledCornersSection />
            </AccordionContent>
          </AccordionItem>

          {config.panelType !== "NONE" && (
            <AccordionItem
              value="mid-rails"
              className="border-0 rounded-2xl px-4 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-gradient-to-b from-white to-stone-50/50 hover:shadow-[0_8px_30px_rgba(199,91,51,0.08)] transition-all duration-300 data-[state=open]:shadow-[0_10px_40px_rgba(199,91,51,0.12)] data-[state=open]:bg-white group"
            >
              <AccordionTrigger className="text-[15px] font-bold text-stone-700 hover:text-orange-600 hover:no-underline py-4">
                <span className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-data-[state=open]:bg-orange-100 group-hover:bg-orange-100 transition-colors">
                    <GripHorizontal className="w-4 h-4 text-orange-500" />
                  </div>
                  Mid Rails
                  {config.midRailsEnabled && config.midRails.length > 0 && (
                    <Badge variant="default" className="text-[10px] bg-orange-100 text-orange-700 font-black border-none hover:bg-orange-200 ml-2">
                      {config.midRails.length} Rails
                    </Badge>
                  )}
                  {config.midRailsEnabled && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in ml-1" />
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <MidRailsSection />
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem
            value="finish"
            className="border-0 rounded-2xl px-4 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-gradient-to-b from-white to-stone-50/50 hover:shadow-[0_8px_30px_rgba(199,91,51,0.08)] transition-all duration-300 data-[state=open]:shadow-[0_10px_40px_rgba(199,91,51,0.12)] data-[state=open]:bg-white group"
          >
            <AccordionTrigger className="text-[15px] font-bold text-stone-700 hover:text-orange-600 hover:no-underline py-4">
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-data-[state=open]:bg-orange-100 group-hover:bg-orange-100 transition-colors">
                  <Paintbrush className="w-4 h-4 text-orange-500" />
                </div>
                Finish Level
                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in" />
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <FinishOptionSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="hinges"
            className="border-0 rounded-2xl px-4 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-gradient-to-b from-white to-stone-50/50 hover:shadow-[0_8px_30px_rgba(199,91,51,0.08)] transition-all duration-300 data-[state=open]:shadow-[0_10px_40px_rgba(199,91,51,0.12)] data-[state=open]:bg-white group"
          >
            <AccordionTrigger className="text-[15px] font-bold text-stone-700 hover:text-orange-600 hover:no-underline py-4">
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-data-[state=open]:bg-orange-100 group-hover:bg-orange-100 transition-colors">
                  <Wrench className="w-4 h-4 text-orange-500" />
                </div>
                Hinge Drilling
                {config.hingeDrilling && (
                  <Badge variant="default" className="text-[10px] bg-orange-100 text-orange-700 font-black border-none hover:bg-orange-200 ml-2">
                    {config.hinges.length} Holes
                  </Badge>
                )}
                {config.hingeDrilling && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in ml-1" />
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <HingePositionsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="rebates"
            className="border-0 bg-transparent opacity-50 hover:opacity-100 transition-opacity mt-4 group"
          >
            <AccordionTrigger className="text-[11px] py-2 uppercase tracking-[0.2em] font-black text-stone-400 hover:text-stone-800 hover:no-underline flex justify-center w-full">
              <span className="flex items-center justify-center gap-2">
                <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
                Rebate & Tech Specs
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <RebateSection />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <ResetConfigButton onReset={config.resetConfig} />

        <div className="h-6" />
      </div>
    </div>
  );
}

// ============================================
// DOOR THICKNESS & PANEL
// ============================================

function DoorStyleSection() {
  const { panelType, setPanelType, thickness, setThickness } = useDoorConfig();

  const thicknessOptions = [
    {
      value: 22,
      label: "22mm",
      description: "Standard shaker door thickness",
      available: true,
    },
    {
      value: 18,
      label: "18mm",
      description: "Slab doors, plinths & cover panels only",
      available: panelType === "NONE",
    },
  ];

  const panelTypes = [
    {
      value: "STANDARD_12MM" as const,
      label: "Standard 12mm",
      description: "Robust feel, minimal rear recess",
      only22: false,
    },
    {
      value: "STANDARD_9MM" as const,
      label: "Standard 9mm",
      description: "More of a rear recess for a more traditional look",
      only22: false,
    },
    {
      value: "REEDED_19MM" as const,
      label: "Reeded 19mm",
      description:
        "Finsa Tex Flute — textured vertical lines, 22mm doors only",
      only22: true,
    },
    {
      value: "MELAMINE_18MM" as const,
      label: "Melamine 18mm",
      description:
        "Fabric-effect board (e.g. Canvas Greige), 22mm doors only",
      only22: true,
    },
    {
      value: "FRETWORK" as const,
      label: "Fretwork Pattern",
      description: "Decorative fretwork panel with intricate patterns",
      only22: false,
    },
    {
      value: "NONE" as const,
      label: "Slab (No Panel)",
      description:
        "Solid door without panel opening — available in 18mm or 22mm",
      only22: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-gray-800">
            Door Thickness
          </Label>
          <InfoTip>
            <p>
              <strong>22mm</strong> supports all panel options.{" "}
              <strong>18mm</strong> is only for slab doors.
            </p>
          </InfoTip>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {thicknessOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                opt.available && setThickness(opt.value as 22 | 18)
              }
              disabled={!opt.available}
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-center",
                thickness === opt.value
                  ? "border-orange-500 bg-orange-50"
                  : opt.available
                    ? "border-gray-200 hover:border-orange-300"
                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
              )}
            >
              <div className="text-lg font-bold text-gray-900">
                {opt.label}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-gray-800">
            Panel Type
          </Label>
        </div>
        <div className="space-y-2">
          {panelTypes.map((type) => {
            const disabled = type.only22 && thickness !== 22;
            return (
              <button
                key={type.value}
                onClick={() => !disabled && setPanelType(type.value)}
                disabled={disabled}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-all",
                  panelType === type.value
                    ? "border-orange-500 bg-orange-50"
                    : disabled
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-orange-300"
                )}
              >
                <div className="font-medium text-gray-900 text-sm">
                  {type.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {type.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// DIMENSIONS
// ============================================

function DoorDimensionsSection() {
  const {
    height,
    width,
    setHeight,
    setWidth,
    angledLeft,
    angledRight,
    leftTriangleCutoutHeight,
    rightTriangleCutoutHeight,
  } = useDoorConfig();

  // Show warning if changing dimensions would affect angles
  const angleHeightWarning =
    (angledLeft && height - leftTriangleCutoutHeight < MIN_SHORT_SIDE_HEIGHT_MM + 50) ||
    (angledRight && height - rightTriangleCutoutHeight < MIN_SHORT_SIDE_HEIGHT_MM + 50);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600 font-medium">Height</Label>
            <InfoTip>
              <p>
                Overall door height. Range: {MIN_HEIGHT_MM}–{MAX_HEIGHT_MM}mm.
                {(angledLeft || angledRight) && (
                  <>
                    {" "}
                    <strong>Note:</strong> Changing height will auto-adjust
                    angled cutout dimensions to maintain valid geometry.
                  </>
                )}
              </p>
            </InfoTip>
          </div>
          <span className="text-[10px] text-stone-400 tabular-nums font-medium">
            {MIN_HEIGHT_MM}–{MAX_HEIGHT_MM}mm
          </span>
        </div>
        <NumberInput
          value={height}
          onChange={setHeight}
          min={MIN_HEIGHT_MM}
          max={MAX_HEIGHT_MM}
          unit="mm"
          className="w-full"
        />
        {angleHeightWarning && (
          <p className="text-[10px] text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Height is close to angle cutout limits. Cutouts may be auto-adjusted.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600 font-medium">Width</Label>
            <InfoTip>
              <p>
                Overall door width. Range: {MIN_WIDTH_MM}–{MAX_WIDTH_MM}mm.
                {(angledLeft || angledRight) && (
                  <>
                    {" "}
                    <strong>Note:</strong> Changing width will auto-adjust
                    angled cutout widths if they exceed available space.
                  </>
                )}
              </p>
            </InfoTip>
          </div>
          <span className="text-[10px] text-stone-400 tabular-nums font-medium">
            {MIN_WIDTH_MM}–{MAX_WIDTH_MM}mm
          </span>
        </div>
        <NumberInput
          value={width}
          onChange={setWidth}
          min={MIN_WIDTH_MM}
          max={MAX_WIDTH_MM}
          unit="mm"
          className="w-full"
        />
      </div>

      {/* Quick size presets */}
      {(height === 0 ||
        width === 0 ||
        (height === 600 && width === 720)) && (
          <div className="pt-2">
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider mb-2">
              Common Sizes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { w: 400, h: 720, label: "400×720" },
                { w: 500, h: 720, label: "500×720" },
                { w: 600, h: 720, label: "600×720" },
                { w: 600, h: 1200, label: "600×1200" },
                { w: 600, h: 2100, label: "600×2100" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setWidth(preset.w);
                    setHeight(preset.h);
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    "border border-stone-200 text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

// ============================================
// BORDER WIDTHS
// ============================================

function BorderWidthsSection() {
  const {
    leftStile,
    rightStile,
    bottomRail,
    topRail,
    setLeftStile,
    setRightStile,
    setBottomRail,
    setTopRail,
    setBorderWidth,
    setCustomBorders,
    customBorders,
    borderWidth,
    hingeDrilling,
    getMinBorderForSide,
    angledLeft,
    angledRight,
    leftAngledRailWidth,
    rightAngledRailWidth,
    setLeftAngledRailWidth,
    setRightAngledRailWidth,
  } = useDoorConfig();

  const minLeft = getMinBorderForSide("LEFT");
  const minRight = getMinBorderForSide("RIGHT");
  const minTop = getMinBorderForSide("TOP");
  const minBottom = getMinBorderForSide("BOTTOM");
  const minUniform = Math.max(minLeft, minRight, minTop, minBottom);

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-gray-700 font-medium">
            Default Border Width (mm)
          </Label>
          <InfoTip>
            <p>
              Sets all borders to the same width. Enable "Custom Borders" for
              individual control.
            </p>
          </InfoTip>
        </div>
        <NumberInput
          value={borderWidth}
          onChange={setBorderWidth}
          min={minUniform}
          max={300}
          unit="mm"
          className="w-full"
        />
        {hingeDrilling && (
          <p className="text-xs text-amber-600">
            ⚠ Hinge side minimum: {MIN_BORDER_WITH_HINGES}mm
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600">Custom Borders</Label>
          </div>
          <Switch checked={customBorders} onCheckedChange={setCustomBorders} />
        </div>

        {customBorders && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Top Rail (min {minTop}mm)
              </Label>
              <NumberInput
                value={topRail}
                onChange={setTopRail}
                min={minTop}
                max={300}
                unit="mm"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Bottom Rail (min {minBottom}mm)
              </Label>
              <NumberInput
                value={bottomRail}
                onChange={setBottomRail}
                min={minBottom}
                max={300}
                unit="mm"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Left Stile (min {minLeft}mm)
                {minLeft === MIN_BORDER_WITH_HINGES && (
                  <span className="text-amber-500 ml-1">🔩</span>
                )}
              </Label>
              <NumberInput
                value={leftStile}
                onChange={setLeftStile}
                min={minLeft}
                max={300}
                unit="mm"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Right Stile (min {minRight}mm)
                {minRight === MIN_BORDER_WITH_HINGES && (
                  <span className="text-amber-500 ml-1">🔩</span>
                )}
              </Label>
              <NumberInput
                value={rightStile}
                onChange={setRightStile}
                min={minRight}
                max={300}
                unit="mm"
                className="h-9"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MID RAILS
// ============================================

function MidRailsSection() {
  const {
    height,
    bottomRail,
    topRail,
    midRailsEnabled,
    midRailsEqualise,
    midRails,
    setMidRailsEnabled,
    setMidRailsEqualise,
    addMidRail,
    removeMidRail,
    updateMidRail,
    angledLeft,
    angledRight,
    leftTriangleCutoutHeight,
    rightTriangleCutoutHeight,
    getMaxMidRailPosition,
    angleValidationIssues,
  } = useDoorConfig();

  const maxMidRailPos = getMaxMidRailPosition();
  const midRailIssues = angleValidationIssues.filter(
    (i) => i.code === "MIDRAIL_IN_ANGLED_ZONE"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Enable Mid Rails</Label>
          <InfoTip>
            <p>
              Add horizontal mid-rails to divide the panel. £5 surcharge per
              rail.
              {(angledLeft || angledRight) && (
                <>
                  {" "}
                  <strong>Note:</strong> Mid rails must be positioned below the
                  angled transition zone.
                </>
              )}
            </p>
          </InfoTip>
        </div>
        <Switch
          checked={midRailsEnabled}
          onCheckedChange={setMidRailsEnabled}
        />
      </div>

      {midRailsEnabled && (
        <>


          {/* Mid rail in angle zone errors */}
          {midRailIssues.length > 0 && (
            <div className="space-y-1.5">
              {midRailIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-red-50 rounded-md border border-red-200 text-xs text-red-700"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Equal Spacing
              </p>
              <p className="text-xs text-blue-600">
                Distribute rails evenly
              </p>
            </div>
            <Switch
              checked={midRailsEqualise}
              onCheckedChange={setMidRailsEqualise}
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {(() => {
              const sorted = [...midRails].sort(
                (a, b) => b.positionFromBottom - a.positionFromBottom
              );
              const elements: React.ReactNode[] = [];

              for (let i = 0; i < sorted.length; i++) {
                const rail = sorted[i];
                const realIndex =
                  midRails.filter(
                    (r) => r.positionFromBottom < rail.positionFromBottom
                  ).length + 1;

                const isInAngledZone =
                  rail.positionFromBottom + rail.dimension > maxMidRailPos;

                // Top Panel Indicator
                if (i === 0) {
                  const topPanelSpace =
                    height -
                    topRail -
                    (rail.positionFromBottom + rail.dimension);
                  elements.push(
                    <div key="top-panel" className="flex justify-center">
                      <span className="bg-yellow-50 text-yellow-800 text-[11px] font-medium px-3 py-1 rounded-full border border-yellow-200 flex items-center gap-1.5">
                        Top Panel: {Math.round(topPanelSpace)}mm
                      </span>
                    </div>
                  );
                }

                // Mid Rail Card
                elements.push(
                  <div
                    key={rail.id}
                    className={cn(
                      "p-4 rounded-xl space-y-3 border shadow-sm",
                      "bg-gray-50/80 border-gray-100"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        Mid Rail {realIndex}

                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMidRail(rail.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500 font-medium">
                          Position from bottom (mm)
                        </Label>
                        <NumberInput
                          value={rail.positionFromBottom}
                          onChange={(val) => {
                            updateMidRail(
                              rail.id,
                              "positionFromBottom",
                              Math.max(50, val)
                            );
                          }}
                          min={50}
                          max={height - topRail - rail.dimension}
                          disabled={midRailsEqualise}
                          unit="mm"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500 font-medium">
                          Rail width (mm, min 35)
                        </Label>
                        <NumberInput
                          value={rail.dimension}
                          onChange={(val) =>
                            updateMidRail(rail.id, "dimension", val)
                          }
                          min={35}
                          max={200}
                          unit="mm"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                  </div>
                );

                // Panel Below Indicator
                const railBelow = sorted[i + 1];
                const bottomPanelSpace = railBelow
                  ? rail.positionFromBottom -
                  (railBelow.positionFromBottom + railBelow.dimension)
                  : rail.positionFromBottom - bottomRail;

                const label = railBelow
                  ? `Mid Panel (R${realIndex - 1} to R${realIndex})`
                  : `Bottom Panel`;
                elements.push(
                  <div
                    key={`panel-below-${rail.id}`}
                    className="flex justify-center"
                  >
                    <span className="bg-yellow-50 text-yellow-800 text-[11px] font-medium px-3 py-1 rounded-full border border-yellow-200 flex items-center gap-1.5">
                      {label}: {Math.round(bottomPanelSpace)}mm
                    </span>
                  </div>
                );
              }
              return elements;
            })()}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addMidRail}
            className="w-full rounded-lg border-dashed hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700 transition-all duration-200 btn-press"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Mid Rail
          </Button>
        </>
      )}
    </div>
  );
}

// ============================================
// HINGE POSITIONS
// ============================================

function HingePositionsSection() {
  const {
    width,
    height,
    angledLeft,
    angledRight,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    hingeDrilling,
    setHingeDrilling,
    hinges,
    addHinge,
    removeHinge,
    updateHinge,
    swapHingeSide,
    equaliseHinges,
    setHinges,
    getAngleSafeHingeRange,
    angleValidationIssues,
    intendedHingeSide,
  } = useDoorConfig();

  const handleAddRelative = (referenceHinge: any, offset: number) => {
    const newId = crypto.randomUUID();
    const newPos = Math.min(
      Math.max(50, referenceHinge.positionMm + offset),
      height - 50
    );
    const newHinges = [
      ...hinges,
      {
        ...referenceHinge,
        id: newId,
        positionMm: newPos,
      },
    ];
    setHinges(newHinges);
  };

  const currentSide = intendedHingeSide;
  const safeRange = getAngleSafeHingeRange(currentSide);
  const hingeInAngleIssues = angleValidationIssues.filter(
    (i) =>
      i.code === "HINGE_IN_LEFT_CUTOUT" || i.code === "HINGE_IN_RIGHT_CUTOUT"
  );

  // Check if current hinge side has an active angle
  const currentSideHasAngle =
    (currentSide === "LEFT" && angledLeft) ||
    (currentSide === "RIGHT" && angledRight);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Hinge Drilling</Label>
          <InfoTip>
            <p>
              35mm cup holes, 13mm deep, 22.5mm centre from edge. £1.50 per
              hole.
              {(angledLeft || angledRight) && (
                <>
                  {" "}
                  <strong>Note:</strong> Hinges on an angled side will be
                  validated to ensure they don't fall in the cutout zone.
                </>
              )}
            </p>
          </InfoTip>
        </div>
        <Switch checked={hingeDrilling} onCheckedChange={setHingeDrilling} />
      </div>

      {hingeDrilling && (
        <>
          {/* Angle-hinge warnings */}
          {currentSideHasAngle && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                Hinges are on the <strong>{currentSide.toLowerCase()}</strong>{" "}
                side which has an active angle. Top-referenced hinges must stay
                below the transition zone. Max safe position from top:{" "}
                <strong>{Math.round(safeRange.max)}mm</strong>.
              </div>
            </div>
          )}

          {hingeInAngleIssues.length > 0 && (
            <div className="space-y-1.5">
              {hingeInAngleIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-red-50 rounded-md border border-red-200 text-xs text-red-700"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Hinged Side: {currentSide}
              </p>
              <p className="text-xs text-blue-600">
                All hinges on {currentSide.toLowerCase()} edge
                {currentSideHasAngle && " (angled side)"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={swapHingeSide}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <ArrowLeftRight className="w-4 h-4 mr-1" /> Swap
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600 font-medium">
              Fixing Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(["SCREW_POINTS", "INSERTA"] as const).map((type) => {
                const isActive =
                  hinges.length > 0 && hinges[0].type === type;
                return (
                  <button
                    key={type}
                    onClick={() =>
                      hinges.forEach((h) => updateHinge(h.id, "type", type))
                    }
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all",
                      isActive
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    )}
                  >
                    <div className="text-sm font-medium">
                      {type === "SCREW_POINTS" ? "Screw Fixed" : "Inserta"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {type === "SCREW_POINTS"
                        ? "4mm V-point marks"
                        : "8mm holes for clip-on"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addHinge("TOP")}
              className="flex-1 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Top (T)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addHinge("BOTTOM")}
              className="flex-1 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Bottom (B)
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {hinges
              .sort((a, b) => {
                if (a.reference === b.reference) {
                  return a.positionMm - b.positionMm;
                }
                return a.reference === "TOP" ? -1 : 1;
              })
              .map((hinge) => {
                const symbol = hinge.reference === "TOP" ? "T" : "B";
                const typeHinges = hinges
                  .filter((h) => h.reference === hinge.reference)
                  .sort((a, b) => a.positionMm - b.positionMm);
                const indexOfType = typeHinges.findIndex(
                  (h) => h.id === hinge.id
                );
                const label = `${symbol}${indexOfType + 1}`;

                // Check if this specific hinge has an issue
                const isHingeInCutout = hingeInAngleIssues.some(
                  (i) =>
                    i.message.includes(`${hinge.positionMm}mm`) &&
                    i.message.includes(hinge.reference.toLowerCase())
                );

                // Calculate max position based on angle constraints
                let maxPos = height - 50;
                if (hinge.reference === "TOP" && currentSideHasAngle) {
                  maxPos = safeRange.max;
                }

                return (
                  <div
                    key={hinge.id}
                    className={cn(
                      "p-3 rounded-lg space-y-3 relative border",
                      isHingeInCutout
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-100"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        Hinge {label}
                        {isHingeInCutout && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHinge(hinge.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase">
                          Anchor
                        </Label>
                        <select
                          value={hinge.reference}
                          onChange={(e) =>
                            updateHinge(
                              hinge.id,
                              "reference",
                              e.target.value
                            )
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm focus:ring-1 focus:ring-orange-500 transition-all"
                        >
                          <option value="TOP">From Top</option>
                          <option value="BOTTOM">From Bottom</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold text-gray-400 uppercase">
                            Position
                          </Label>
                          {![100, 200, 300, 400, 500, 600, 700].includes(
                            hinge.positionMm
                          ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateHinge(hinge.id, "positionMm", 100)
                                }
                                className="text-[9px] text-blue-500 hover:text-blue-700 font-medium"
                              >
                                Presets
                              </button>
                            )}
                        </div>
                        {[100, 200, 300, 400, 500, 600, 700].includes(
                          hinge.positionMm
                        ) ? (
                          <select
                            value={hinge.positionMm}
                            onChange={(e) => {
                              if (e.target.value === "custom") {
                                updateHinge(
                                  hinge.id,
                                  "positionMm",
                                  hinge.positionMm + 1
                                );
                              } else {
                                const newVal = parseInt(e.target.value, 10);
                                // Validate against angle safe zone
                                if (
                                  hinge.reference === "TOP" &&
                                  currentSideHasAngle &&
                                  newVal > safeRange.max
                                ) {
                                  updateHinge(
                                    hinge.id,
                                    "positionMm",
                                    Math.round(safeRange.max)
                                  );
                                } else {
                                  updateHinge(hinge.id, "positionMm", newVal);
                                }
                              }
                            }}
                            className="flex h-8 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                          >
                            {[100, 200, 300, 400, 500, 600, 700]
                              .filter((pos) => {
                                // Filter out presets that fall in angle zone
                                if (
                                  hinge.reference === "TOP" &&
                                  currentSideHasAngle
                                ) {
                                  return pos <= safeRange.max;
                                }
                                return true;
                              })
                              .map((pos) => (
                                <option key={pos} value={pos}>
                                  {pos}mm
                                </option>
                              ))}
                            <option value="custom">Custom...</option>
                          </select>
                        ) : (
                          <NumberInput
                            value={hinge.positionMm}
                            onChange={(val) => {
                              // Clamp to safe range if on angled side
                              let clampedVal = val;
                              if (
                                hinge.reference === "TOP" &&
                                currentSideHasAngle
                              ) {
                                clampedVal = Math.min(val, safeRange.max);
                              }
                              updateHinge(
                                hinge.id,
                                "positionMm",
                                Math.max(50, clampedVal)
                              );
                            }}
                            min={50}
                            max={
                              hinge.reference === "TOP" && currentSideHasAngle
                                ? Math.round(safeRange.max)
                                : height - 50
                            }
                            unit="mm"
                            className="h-8 text-xs font-medium"
                          />
                        )}
                        {hinge.reference === "TOP" && currentSideHasAngle && (
                          <span className="text-[9px] text-amber-600">
                            Max: {Math.round(safeRange.max)}mm (angle limit)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {hinges.length > 1 && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={equaliseHinges}
                  className="w-full h-8 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/50 hover:bg-blue-50 border border-dashed border-blue-200"
                  title="Evenly space all hinges"
                >
                  <Equal className="w-3 h-3 mr-2" /> Equalise All Spacing
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// FINISH
// ============================================

function FinishOptionSection() {
  const { finish, setFinish } = useDoorConfig();

  const finishOptions = [
    {
      value: "RAW_UNASSEMBLED" as const,
      label: "Raw Unassembled",
      description:
        "Parts straight off the CNC. Panels placed loose in rebates. You handle all finishing, gluing, and edge work.",
    },
    {
      value: "ASSEMBLED_PREP" as const,
      label: "Assembled & Prepped",
      description:
        "2mm arris roundovers, edges sanded to 180 grit, panels glued in, gaps caulked. 2.5mm internal corner radii left as machined.",
    },
    {
      value: "PRIMED" as const,
      label: "Primed",
      description:
        "Professionally sprayed with high-build primer, ready for topcoat.",
    },
    {
      value: "PAINTED" as const,
      label: "Painted",
      description:
        "Finished painted in your chosen color. Contact us for color matching details.",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <InfoTip>
          <p>
            Choose your level of finish. Most trade customers choose "Raw
            Unassembled".
          </p>
        </InfoTip>
        <span className="text-xs text-gray-500">
          Pricing varies by finish level
        </span>
      </div>
      {finishOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setFinish(option.value)}
          className={cn(
            "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 btn-press",
            finish === option.value
              ? "border-orange-500 bg-orange-50 shadow-sm"
              : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
          )}
        >
          <div className="font-semibold text-gray-900 text-sm">{option.label}</div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{option.description}</p>
        </button>
      ))}
    </div>
  );
}

// ============================================
// REBATE SECTION
// ============================================

function RebateSection() {
  const {
    thickness,
    panelType,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    setRebateWidth,
    setRebateDepth,
    setFrontFaceThickness,
    setCornerRadius,
    setRearCornerRadius,
  } = useDoorConfig();

  const totalUsed = frontFaceThicknessMm + rebateDepthMm;
  const isInvalid = totalUsed > thickness;

  return (
    <div className="space-y-4">
      <div className="space-y-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Rebate Width (mm)
            </Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {rebateWidthMm}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Rebate Depth (mm)
            </Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {rebateDepthMm}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Front Face (mm)
            </Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {frontFaceThicknessMm}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Front Corner (mm)
            </Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {cornerRadiusMm}
            </div>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Rear Corner Radius (mm)
            </Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {rearCornerRadiusMm}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-stone-200">
        <p className="text-[10px] text-stone-400 italic">
          Adjusting these values updates the internal door construction. Total
          depth (Front Face + Rebate Depth) must not exceed {thickness}mm.
        </p>
      </div>

      {isInvalid && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200 mt-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-red-700">
            Warning: The current rebate depth ({rebateDepthMm}mm) and front
            face ({frontFaceThicknessMm}mm) exceed the door thickness (
            {thickness}mm).
          </div>
        </div>
      )}

      <p className="text-xs text-stone-500 px-1 mt-4">
        Customise these values for specific architectural requirements. Standard
        defaults are pre-loaded.
      </p>
    </div>
  );
}