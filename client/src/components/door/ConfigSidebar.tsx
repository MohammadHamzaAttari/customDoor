// client/src/components/door/ConfigSidebar.tsx
import { useState } from "react";
import {
  useDoorConfig,
  MIN_BORDER_WITH_HINGES,
  MIN_BORDER_WITHOUT_HINGES,
} from "@/lib/stores/useDoorConfig";
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
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <Info className="h-3 w-3 text-gray-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm" side="top">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// MAIN SIDEBAR
// ============================================

interface ConfigSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function ConfigSidebar({ isMobile = false, onClose }: ConfigSidebarProps) {
  const { selectedSection, setSelectedSection, ...config } = useDoorConfig();

  return (
    <div
      className={cn(
        "w-full h-full bg-white flex flex-col shadow-lg",
        !isMobile && "md:w-96 border-l border-gray-200",
      )}
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-orange-600 to-red-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base md:text-xl font-bold text-white tracking-wide">
              Door Configurator
            </h1>
            <p className="text-sm text-orange-100 mt-1 font-medium">
              Design your perfect door
            </p>
          </div>
          <div className="text-right">
            <p className="text-orange-200 text-xs">Unit Price</p>
            <p className="text-xl font-bold text-white">
              £{config.price.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={selectedSection}
          onValueChange={setSelectedSection}
        >
          <AccordionItem value="dimensions">
            <AccordionTrigger className="text-sm font-medium">
              Door Dimensions
            </AccordionTrigger>
            <AccordionContent>
              <DoorDimensionsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="door-style">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Door Thickness and Panel
                <Badge variant="outline" className="text-[10px]">
                  {config.thickness}mm {config.panelType === "NONE" ? "Slab" : "Shaker"}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <DoorStyleSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="borders">
            <AccordionTrigger className="text-sm font-medium">
              Frames & Borders
            </AccordionTrigger>
            <AccordionContent>
              <BorderWidthsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="angled">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Angled Corners
                {(config.angledLeft || config.angledRight) && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <AngledCornersSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mid-rails">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Mid Rails
                {config.midRailsEnabled && config.midRails.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{config.midRails.length}</Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <MidRailsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="finish">
            <AccordionTrigger className="text-sm font-medium">
              Level of Finish
            </AccordionTrigger>
            <AccordionContent>
              <FinishOptionSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hinges">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Hinge Drilling
                {config.hingeDrilling && (
                  <Badge variant="secondary" className="text-xs">{config.hinges.length} holes</Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <HingePositionsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rebates">
            <AccordionTrigger className="text-sm font-medium">
              Detailed Specifications
            </AccordionTrigger>
            <AccordionContent>
              <RebateSection />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
    { value: 22, label: "22mm", description: "Standard shaker door thickness", available: true },
    { value: 18, label: "18mm", description: "Slab doors, plinths & cover panels only", available: panelType === "NONE" },
  ];

  const panelTypes = [
    { value: "STANDARD_12MM" as const, label: "Standard 12mm", description: "Robust feel, minimal rear recess", only22: false },
    { value: "STANDARD_9MM" as const, label: "Standard 9mm", description: "More of a rear recess for a more traditional look", only22: false },
    { value: "REEDED_19MM" as const, label: "Reeded 19mm", description: "Finsa Tex Flute — textured vertical lines, 22mm doors only", only22: true },
    { value: "MELAMINE_18MM" as const, label: "Melamine 18mm", description: "Fabric-effect board (e.g. Canvas Greige), 22mm doors only", only22: true },
    { value: "FRETWORK" as const, label: "Fretwork Pattern", description: "Decorative fretwork panel with intricate patterns", only22: false },
    { value: "NONE" as const, label: "Slab (No Panel)", description: "Solid door without panel opening — available in 18mm or 22mm", only22: false },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-gray-800">Door Thickness</Label>
          <InfoTip>
            <p><strong>22mm</strong> supports all panel options. <strong>18mm</strong> is only for slab doors.</p>
          </InfoTip>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {thicknessOptions.map((opt) => (
            <button key={opt.value} onClick={() => opt.available && setThickness(opt.value as 22 | 18)} disabled={!opt.available}
              className={cn("p-3 rounded-lg border-2 transition-all text-center",
                thickness === opt.value ? "border-orange-500 bg-orange-50"
                  : opt.available ? "border-gray-200 hover:border-orange-300"
                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed")}>
              <div className="text-lg font-bold text-gray-900">{opt.label}</div>
              <div className="text-[10px] text-gray-500 mt-1">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-gray-800">Panel Type</Label>
        </div>
        <div className="space-y-2">
          {panelTypes.map((type) => {
            const disabled = type.only22 && thickness !== 22;
            return (
              <button key={type.value} onClick={() => !disabled && setPanelType(type.value)} disabled={disabled}
                className={cn("w-full text-left p-3 rounded-lg border-2 transition-all",
                  panelType === type.value ? "border-orange-500 bg-orange-50"
                    : disabled ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-orange-300")}>
                <div className="font-medium text-gray-900 text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
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
  const { height, width, setHeight, setWidth } = useDoorConfig();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Height (mm)</Label>
          <InfoTip><p>Overall door height. Maximum 2430mm.</p></InfoTip>
        </div>
        <NumberInput value={height} onChange={setHeight} min={200} max={2430} className="w-full" />
        <span className="text-xs text-gray-400">Range: 200–2430mm</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Width (mm)</Label>
          <InfoTip><p>Overall door width. Maximum 1200mm.</p></InfoTip>
        </div>
        <NumberInput value={width} onChange={setWidth} min={200} max={1200} className="w-full" />
        <span className="text-xs text-gray-400">Range: 200–1200mm</span>
      </div>
    </div>
  );
}

// ============================================
// BORDER WIDTHS
// ============================================

function BorderWidthsSection() {
  const {
    leftStile, rightStile, bottomRail, topRail,
    setLeftStile, setRightStile, setBottomRail, setTopRail,
    setBorderWidth, setCustomBorders, customBorders, borderWidth,
    hingeDrilling, getMinBorderForSide,
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
          <Label className="text-gray-700 font-medium">Default Border Width (mm)</Label>
          <InfoTip><p>Sets all borders to the same width. Enable "Custom Borders" for individual control.</p></InfoTip>
        </div>
        <NumberInput value={borderWidth} onChange={setBorderWidth} min={minUniform} max={300} className="w-full" />
        {hingeDrilling && (
          <p className="text-xs text-amber-600">⚠ Hinge side minimum: {MIN_BORDER_WITH_HINGES}mm</p>
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
              <Label className="text-xs text-gray-500">Top Rail (min {minTop}mm)</Label>
              <NumberInput value={topRail} onChange={setTopRail} min={minTop} max={300} className="h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Bottom Rail (min {minBottom}mm)</Label>
              <NumberInput value={bottomRail} onChange={setBottomRail} min={minBottom} max={300} className="h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Left Stile (min {minLeft}mm)
                {minLeft === MIN_BORDER_WITH_HINGES && <span className="text-amber-500 ml-1">🔩</span>}
              </Label>
              <NumberInput value={leftStile} onChange={setLeftStile} min={minLeft} max={300} className="h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Right Stile (min {minRight}mm)
                {minRight === MIN_BORDER_WITH_HINGES && <span className="text-amber-500 ml-1">🔩</span>}
              </Label>
              <NumberInput value={rightStile} onChange={setRightStile} min={minRight} max={300} className="h-9" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// AngledCornersSection is imported from ./sections/AngledCornersSection

// ============================================
// MID RAILS
// ============================================

function MidRailsSection() {
  const {
    midRailsEnabled, midRailsEqualise, midRails,
    setMidRailsEnabled, setMidRailsEqualise,
    addMidRail, removeMidRail, updateMidRail,
  } = useDoorConfig();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Enable Mid Rails</Label>
          <InfoTip><p>Add horizontal mid-rails to divide the panel. £5 surcharge per rail.</p></InfoTip>
        </div>
        <Switch checked={midRailsEnabled} onCheckedChange={setMidRailsEnabled} />
      </div>

      {midRailsEnabled && (
        <>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-900">Equal Spacing</p>
              <p className="text-xs text-blue-600">Distribute rails evenly</p>
            </div>
            <Switch checked={midRailsEqualise} onCheckedChange={setMidRailsEqualise} />
          </div>

          <div className="space-y-4 flex flex-col-reverse">
            {[...midRails].sort((a, b) => a.positionFromBottom - b.positionFromBottom).map((rail, index) => (
              <div key={rail.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Mid Rail {index + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeMidRail(rail.id)} className="h-6 w-6 p-0 text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Position from bottom (mm)</Label>
                    <NumberInput
                      value={rail.positionFromBottom}
                      onChange={(val) => updateMidRail(rail.id, "positionFromBottom", val)}
                      min={50}
                      disabled={midRailsEqualise}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Rail width (mm, min 35)</Label>
                    <NumberInput
                      value={rail.dimension}
                      onChange={(val) => updateMidRail(rail.id, "dimension", val)}
                      min={35}
                      max={200}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addMidRail} className="w-full">
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
    width, height,
    angledLeft, angledRight,
    leftTriangleCutoutWidth, leftTriangleCutoutHeight,
    rightTriangleCutoutWidth, rightTriangleCutoutHeight,
    hingeDrilling, setHingeDrilling,
    hinges, addHinge, removeHinge, updateHinge,
    swapHingeSide, equaliseHinges, setHinges,
  } = useDoorConfig();

  // Helper to add a hinge relative to an existing one
  const handleAddRelative = (referenceHinge: any, offset: number) => {
    const newId = crypto.randomUUID();
    const newPos = Math.min(Math.max(50, referenceHinge.positionMm + offset), height - 50);
    const newHinges = [...hinges, {
      ...referenceHinge,
      id: newId,
      positionMm: newPos,
    }];
    setHinges(newHinges);
  };

  const isHingeInvalid = (hinge: any) => {
    const hY = hinge.reference === "BOTTOM" ? hinge.positionMm : height - hinge.positionMm;
    const hX = hinge.side === "LEFT" ? 22.5 : width - 22.5;
    if (hinge.side === "LEFT" && angledLeft) {
      const heightFromTop = height - hY;
      if (heightFromTop < leftTriangleCutoutHeight && leftTriangleCutoutHeight > 0) {
        const maxX = leftTriangleCutoutWidth * (1 - heightFromTop / leftTriangleCutoutHeight);
        if (hX < maxX) return true;
      }
    }
    if (hinge.side === "RIGHT" && angledRight) {
      const heightFromTop = height - hY;
      if (heightFromTop < rightTriangleCutoutHeight && rightTriangleCutoutHeight > 0) {
        const minX = width - rightTriangleCutoutWidth * (1 - heightFromTop / rightTriangleCutoutHeight);
        if (hX > minX) return true;
      }
    }
    return false;
  };

  const currentSide = hinges.length > 0 ? hinges[0].side : "LEFT";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Hinge Drilling</Label>
          <InfoTip><p>35mm cup holes, 13mm deep, 22.5mm centre from edge. £1.50 per hole.</p></InfoTip>
        </div>
        <Switch checked={hingeDrilling} onCheckedChange={setHingeDrilling} />
      </div>

      {hingeDrilling && (
        <>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-900">Hinged Side: {currentSide}</p>
              <p className="text-xs text-blue-600">All hinges on {currentSide.toLowerCase()} edge</p>
            </div>
            <Button variant="outline" size="sm" onClick={swapHingeSide} className="border-blue-300 text-blue-700 hover:bg-blue-100">
              <ArrowLeftRight className="w-4 h-4 mr-1" /> Swap
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600 font-medium">Fixing Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["SCREW_POINTS", "INSERTA"] as const).map((type) => {
                const isActive = hinges.length > 0 && hinges[0].type === type;
                return (
                  <button key={type}
                    onClick={() => hinges.forEach((h) => updateHinge(h.id, "type", type))}
                    className={cn("p-3 rounded-lg border-2 text-center transition-all",
                      isActive ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300")}>
                    <div className="text-sm font-medium">{type === "SCREW_POINTS" ? "Screw Fixed" : "Inserta"}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{type === "SCREW_POINTS" ? "4mm V-point marks" : "8mm holes for clip-on"}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {hinges.map((hinge, index) => {
              const symbol = hinge.reference === "TOP" ? "T" : "B";
              const typeHinges = hinges.filter(h => h.reference === hinge.reference)
                .sort((a, b) => a.positionMm - b.positionMm);
              const indexOfType = typeHinges.findIndex(h => h.id === hinge.id);
              const label = `${symbol}${indexOfType + 1}`;
              const isLastOfType = indexOfType === typeHinges.length - 1;

              return (
                <div key={hinge.id} className="p-3 bg-gray-50 rounded-lg space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Hinge {label}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeHinge(hinge.id)} className="h-6 w-6 p-0 text-red-500" disabled={hinges.length <= 2}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {isHingeInvalid(hinge) && (
                    <div className="flex items-center gap-2 text-[10px] text-red-500 bg-red-50 p-1.5 rounded border border-red-100">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span>Hinge is in the angled cutout area</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Reference</Label>
                      <select
                        value={hinge.reference}
                        onChange={(e) => updateHinge(hinge.id, "reference", e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="TOP">Top</option>
                        <option value="BOTTOM">Bottom</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Position (mm)</Label>
                      <NumberInput
                        value={hinge.positionMm}
                        onChange={(val) => updateHinge(hinge.id, "positionMm", val)}
                        min={50}
                        max={height - 50}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {isLastOfType && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 translate-y-1/2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddRelative(hinge, 250)}
                        className="h-6 w-6 rounded-full p-0 shadow-md border border-gray-200"
                        title={`Add hinge below ${label}`}
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="grid grid-cols-1 gap-2 pt-4">
              <Button variant="default" size="sm" onClick={equaliseHinges} disabled={hinges.length < 2}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700" title="Evenly space all hinges">
                <Equal className="w-3 h-3 mr-2" /> Equal Spacing
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// FINISH - FIXED: removed PRIMED, corrected 180 grit
// ============================================

function FinishOptionSection() {
  const { finish, setFinish } = useDoorConfig();

  const finishOptions = [
    {
      value: "RAW_UNASSEMBLED" as const,
      label: "Raw Unassembled",
      description: "Parts straight off the CNC. Panels placed loose in rebates. You handle all finishing, gluing, and edge work.",
    },
    {
      value: "ASSEMBLED_PREP" as const,
      label: "Assembled & Prepped",
      description: "2mm arris roundovers, edges sanded to 180 grit, panels glued in, gaps caulked. 2.5mm internal corner radii left as machined.",
    },
    {
      value: "PRIMED" as const,
      label: "Primed",
      description: "Professionally sprayed with high-build primer, ready for topcoat.",
    },
    {
      value: "PAINTED" as const,
      label: "Painted",
      description: "Finished painted in your chosen color. Contact us for color matching details.",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <InfoTip><p>Choose your level of finish. Most trade customers choose "Raw Unassembled".</p></InfoTip>
        <span className="text-xs text-gray-500">Pricing varies by finish level</span>
      </div>
      {finishOptions.map((option) => (
        <button key={option.value} onClick={() => setFinish(option.value)}
          className={cn("w-full text-left p-4 rounded-lg border-2 transition-all",
            finish === option.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300")}>
          <div className="font-medium text-gray-900">{option.label}</div>
          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
        </button>
      ))}
    </div>
  );
}

// ============================================
// DETAILED SPECIFICATIONS (Read-only rebate/corner details)
// ============================================

function RebateSection() {
  const { thickness, rebateWidthMm, rebateDepthMm, frontFaceThicknessMm, cornerRadiusMm } = useDoorConfig();

  // Validate the current configuration for display purposes
  const totalUsed = frontFaceThicknessMm + rebateDepthMm;
  const isInvalid = totalUsed > thickness;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Rebate Width</p>
              <p className="text-sm font-semibold text-stone-900">{rebateWidthMm}mm</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Rebate Depth</p>
              <p className="text-sm font-semibold text-stone-900">{rebateDepthMm}mm</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Front Face</p>
              <p className="text-sm font-semibold text-stone-900">{frontFaceThicknessMm}mm</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Corner Radii</p>
              <p className="text-sm font-semibold text-stone-900">
                Front: {cornerRadiusMm}mm <br />
                Rear: 2.5mm
              </p>
            </div>
          </div>
        </div>

        {/* Simple Corner Diagram */}
        <div className="w-20 h-20 shrink-0 bg-white border border-stone-200 rounded-md flex items-center justify-center p-2 relative" title="Rebate Cross-section">
          <svg viewBox="0 0 100 100" className="w-full h-full text-stone-400">
            {/* Outer box representing door thickness */}
            <rect x="10" y="10" width="80" height="80" fill="#f5f5f4" stroke="currentColor" strokeWidth="2" />

            {/* Rebate cut-out */}
            <path d="M10 90 L50 90 A2 2 0 0 0 52 88 L52 30 L10 30 Z" fill="white" />
            <path d="M52 88 L52 30" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" />
            <path d="M10 30 L52 30" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" />

            {/* Labels */}
            <text x="60" y="60" fontSize="10" fill="#78716c" transform="rotate(-90 60 60)">Depth</text>
            <text x="30" y="24" fontSize="10" fill="#78716c">Width</text>
          </svg>
        </div>
      </div>

      {isInvalid && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-red-700">
            Warning: The current rebate depth ({rebateDepthMm}mm) and front face ({frontFaceThicknessMm}mm) exceed the door thickness ({thickness}mm).
          </div>
        </div>
      )}

      <p className="text-xs text-stone-500 px-1">
        These are standard manufacturing specifications. To request custom rebate dimensions, please contact support.
      </p>
    </div>
  );
}