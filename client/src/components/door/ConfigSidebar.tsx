// client/src/components/door/ConfigSidebar.tsx
import React, { useState } from "react";
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
    angledLeft, angledRight,
    leftAngledRailWidth, rightAngledRailWidth,
    setLeftAngledRailWidth, setRightAngledRailWidth
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
            {angledLeft && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 text-blue-600 font-medium">Angled Rail Left (min {minTop}mm)</Label>
                <NumberInput value={leftAngledRailWidth} onChange={setLeftAngledRailWidth} min={minTop} max={300} className="h-9 border-blue-200 focus:ring-blue-500" />
              </div>
            )}
            {angledRight && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 text-purple-600 font-medium">Angled Rail Right (min {minTop}mm)</Label>
                <NumberInput value={rightAngledRailWidth} onChange={setRightAngledRailWidth} min={minTop} max={300} className="h-9 border-purple-200 focus:ring-purple-500" />
              </div>
            )}
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

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addHinge("TOP")} className="flex-1 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Top (T)
            </Button>
            <Button variant="outline" size="sm" onClick={() => addHinge("BOTTOM")} className="flex-1 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Bottom (B)
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {hinges
              .sort((a, b) => {
                if (a.reference === b.reference) {
                  return a.reference === "TOP"
                    ? a.positionMm - b.positionMm
                    : a.positionMm - b.positionMm; // Both sorted by distance from their anchor
                }
                return a.reference === "TOP" ? -1 : 1;
              })
              .map((hinge) => {
                const symbol = hinge.reference === "TOP" ? "T" : "B";
                const typeHinges = hinges.filter(h => h.reference === hinge.reference)
                  .sort((a, b) => a.positionMm - b.positionMm);
                const indexOfType = typeHinges.findIndex(h => h.id === hinge.id);
                const label = `${symbol}${indexOfType + 1}`;

                return (
                  <div key={hinge.id} className="p-3 bg-gray-50 rounded-lg space-y-3 relative border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">Hinge {label}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeHinge(hinge.id)} className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {isHingeInvalid(hinge) && (
                      <div className="flex items-center gap-2 text-[10px] text-red-500 bg-red-50 p-1.5 rounded border border-red-100 shadow-sm">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>Hinge overlaps angled edge or rail</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase">Anchor</Label>
                        <select
                          value={hinge.reference}
                          onChange={(e) => updateHinge(hinge.id, "reference", e.target.value)}
                          className="flex h-8 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm focus:ring-1 focus:ring-orange-500 transition-all"
                        >
                          <option value="TOP">From Top</option>
                          <option value="BOTTOM">From Bottom</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold text-gray-400 uppercase">Position</Label>
                          {![100, 200, 300, 400, 500, 600, 700].includes(hinge.positionMm) && (
                            <button
                              type="button"
                              onClick={() => updateHinge(hinge.id, "positionMm", 100)}
                              className="text-[9px] text-blue-500 hover:text-blue-700 font-medium"
                            >
                              Presets
                            </button>
                          )}
                        </div>
                        {[100, 200, 300, 400, 500, 600, 700].includes(hinge.positionMm) ? (
                          <select
                            value={hinge.positionMm}
                            onChange={(e) => {
                              if (e.target.value === "custom") {
                                updateHinge(hinge.id, "positionMm", hinge.positionMm + 1);
                              } else {
                                updateHinge(hinge.id, "positionMm", parseInt(e.target.value, 10));
                              }
                            }}
                            className="flex h-8 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                          >
                            {[100, 200, 300, 400, 500, 600, 700].map((pos) => {
                              const symbol = hinge.reference === "TOP" ? "T" : "B";
                              const prefix = `${symbol}${pos / 100}`;
                              return (
                                <option key={pos} value={pos}>
                                  {prefix} ({pos}mm)
                                </option>
                              );
                            })}
                            <option value="custom">Custom...</option>
                          </select>
                        ) : (
                          <NumberInput
                            value={hinge.positionMm}
                            onChange={(val) => updateHinge(hinge.id, "positionMm", val)}
                            min={50}
                            max={height - 50}
                            className="h-8 text-xs font-medium"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {hinges.length > 1 && (
              <div className="pt-2">
                <Button variant="ghost" size="sm" onClick={equaliseHinges}
                  className="w-full h-8 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/50 hover:bg-blue-50 border border-dashed border-blue-200" title="Evenly space all hinges">
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
  const {
    thickness,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    setRebateWidth,
    setRebateDepth,
    setFrontFaceThickness,
    setCornerRadius,
    setRearCornerRadius
  } = useDoorConfig();

  // Validate the current configuration for display purposes
  const totalUsed = frontFaceThicknessMm + rebateDepthMm;
  const isInvalid = totalUsed > thickness;

  return (
    <div className="space-y-4">
      <div className="space-y-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Rebate Width (mm)</Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {rebateWidthMm}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Rebate Depth (mm)</Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {rebateDepthMm}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Front Face (mm)</Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {frontFaceThicknessMm}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Front Corner (mm)</Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {cornerRadiusMm}
            </div>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Rear Corner Radius (mm)</Label>
            <div className="flex h-8 w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm items-center text-stone-700 font-medium cursor-not-allowed">
              {rearCornerRadiusMm}
            </div>
          </div>
        </div>

        {/* Premium Corner Zoom Diagram */}
        <div className="w-full aspect-[16/9] bg-stone-100 rounded-xl border border-stone-200 overflow-hidden relative shadow-inner">
          <svg viewBox="0 0 400 225" className="w-full h-full">
            {/* Background pattern */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />
              </pattern>
              <linearGradient id="doorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f5f5f4" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Main Door Cross-Section Zoomed in on Top-Right Corner */}
            <g transform="translate(140, 50) scale(1.3)">
              {/* Outer Shadow for Depth */}
              <path
                d={`M 0,0 H 120 Q 130,0 130,10 V 90 Q 130,100 120,100 H 40 Q 30,100 30,90 V 45 Q 30,35 20,35 H 0 Z`}
                fill="url(#doorGrad)"
                stroke="#57534e"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="drop-shadow-sm"
              />

              {/* Panel Area (Indicated) */}
              <rect x="-30" y="45" width="60" height="55" fill="#e7e5e4" opacity="0.4" stroke="#a8a29e" strokeWidth="1" strokeDasharray="3 2" />
              <text x="-5" y="75" fill="#a8a29e" fontSize="7" fontWeight="700">PANEL SLOT</text>

              {/* Dimension Annotations */}
              <g className="text-[8px] font-bold" fill="#78716c">
                {/* Total Thickness */}
                <line x1="-15" y1="0" x2="-15" y2="100" stroke="#a8a29e" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M -18,0 H -12 M -18,100 H -12" stroke="#a8a29e" strokeWidth="1.5" />
                <text x="-48" y="50" dominantBaseline="middle" fontSize="9">{thickness}mm</text>

                {/* Front Face (Blue) */}
                <line x1="160" y1="0" x2="160" y2="35" stroke="#3b82f6" strokeWidth="2" />
                <path d="M 157,0 H 163 M 157,35 H 163" stroke="#3b82f6" strokeWidth="2" />
                <text x="170" y="18" fill="#2563eb" fontSize="7.5" dominantBaseline="middle">FRONT: {frontFaceThicknessMm}mm</text>

                {/* Rebate Depth (Orange) */}
                <line x1="160" y1="35" x2="160" y2="100" stroke="#ea580c" strokeWidth="2" />
                <path d="M 157,100 H 163" stroke="#ea580c" strokeWidth="2" />
                <text x="170" y="68" fill="#c2410c" fontSize="7.5" dominantBaseline="middle">REBATE: {rebateDepthMm}mm</text>

                {/* Rebate Width (Cyan) */}
                <line x1="30" y1="120" x2="130" y2="120" stroke="#0891b2" strokeWidth="2" />
                <path d="M 30,117 V 123 M 130,117 V 123" stroke="#0891b2" strokeWidth="2" />
                <text x="80" y="132" textAnchor="middle" fill="#0e7490" fontSize="7.5">REBATE WIDTH: {rebateWidthMm}mm</text>

                {/* Radii (Green & Purple) */}
                {/* Front Corner */}
                <g transform="translate(132, -5)">
                  <circle r="4" fill="#22c55e" opacity="0.2" />
                  <path d="M 0,-4 A 4,4 0 0,1 4,0" fill="none" stroke="#16a34a" strokeWidth="1.5" />
                  <text x="8" y="2" fill="#166534" fontSize="7">Int. R{cornerRadiusMm}</text>
                </g>

                {/* Rear Corner */}
                <g transform="translate(35, 105)">
                  <circle r="4" fill="#a855f7" opacity="0.2" />
                  <path d="M -4,0 A 4,4 0 0,0 0,4" fill="none" stroke="#9333ea" strokeWidth="1.5" />
                  <text x="10" y="8" fill="#6b21a8" fontSize="7" textAnchor="start">Ext. R{rearCornerRadiusMm}</text>
                </g>
              </g>

              {/* Interactive Indicators — glow when values change */}
              <circle cx="130" cy="0" r="3" fill="#16a34a" className="animate-pulse" />
              <circle cx="30" cy="100" r="3" fill="#9333ea" className="animate-pulse" />
            </g>

            {/* Title */}
            <text x="12" y="18" className="text-[9px] font-bold text-stone-400">CORNER CROSS-SECTION</text>
          </svg>
        </div>

        <div className="pt-2 border-t border-stone-200">
          <p className="text-[10px] text-stone-400 italic">
            Adjusting these values updates the internal door construction.
            Total depth (Front Face + Rebate Depth) must not exceed {thickness}mm.
          </p>
        </div>

        {isInvalid && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200 mt-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700">
              Warning: The current rebate depth ({rebateDepthMm}mm) and front face ({frontFaceThicknessMm}mm) exceed the door thickness ({thickness}mm).
            </div>
          </div>
        )}

        <p className="text-xs text-stone-500 px-1 mt-4">
          Customise these values for specific architectural requirements. Standard defaults are pre-loaded.
        </p>
      </div>
    </div>
  );
}
