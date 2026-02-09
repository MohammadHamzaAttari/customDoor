// client/src/components/door/ConfigSidebar.tsx
import { useState } from "react";
import { useDoorConfig, AnglePresetId } from "@/lib/stores/useDoorConfig";
import { ANGLE_PRESETS, validateAngleCutout } from "@/lib/anglePresets";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Info, Download, Plus, X, AlertTriangle, Check, ChevronRight, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function ConfigSidebar({ isMobile = false, onClose }: ConfigSidebarProps) {
  const { selectedSection, setSelectedSection, ...config } = useDoorConfig();
  const [savedMessage, setSavedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleExportDxf = async () => {
    setIsLoading(true);
    try {
      const exportConfig = {
        width: config.width,
        height: config.height,
        thickness: config.thickness,
        preset: config.preset,
        panelType: config.panelType,
        panelCount: config.panelCount,
        shape: config.shape,
        material: config.material,
        finish: config.finish,
        rebateWidthMm: config.rebateWidthMm,
        rebateDepthMm: config.rebateDepthMm,
        frontFaceThicknessMm: config.frontFaceThicknessMm,
        cornerRadiusMm: config.cornerRadiusMm,
        leftStile: config.leftStile,
        rightStile: config.rightStile,
        topRail: config.topRail,
        bottomRail: config.bottomRail,
        midRailsEnabled: config.midRailsEnabled,
        midRails: config.midRails,
        angledLeft: config.angledLeft,
        angledRight: config.angledRight,
        leftTriangleCutoutWidth: config.leftTriangleCutoutWidth,
        leftTriangleCutoutHeight: config.leftTriangleCutoutHeight,
        rightTriangleCutoutWidth: config.rightTriangleCutoutWidth,
        rightTriangleCutoutHeight: config.rightTriangleCutoutHeight,
        hinges: config.hinges,
      };

      const response = await fetch("/api/export/prepare?type=dxf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportConfig),
      });

      if (!response.ok) {
        throw new Error("Failed to prepare DXF export");
      }

      const { token } = await response.json();
      window.location.href = `/api/download/dxf/${token}`;
      setSavedMessage("DXF file downloading...");
    } catch (error: any) {
      const msg = error.message || "Error generating DXF file";
      setSavedMessage(msg);
      console.error("DXF Export Error:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSavedMessage(""), 5000);
    }
  };

  const handleExportSvg = async () => {
    setIsLoading(true);
    try {
      const exportConfig = {
        width: config.width,
        height: config.height,
        thickness: config.thickness,
        preset: config.preset,
        panelType: config.panelType,
        panelCount: config.panelCount,
        panelOrientation: config.panelOrientation,
        shape: config.shape,
        angledLeft: config.angledLeft,
        angledRight: config.angledRight,
        leftTriangleCutoutWidth: config.leftTriangleCutoutWidth,
        leftTriangleCutoutHeight: config.leftTriangleCutoutHeight,
        rightTriangleCutoutWidth: config.rightTriangleCutoutWidth,
        rightTriangleCutoutHeight: config.rightTriangleCutoutHeight,
        borderWidth: config.borderWidth,
        customBorders: config.customBorders,
        leftStile: config.leftStile,
        rightStile: config.rightStile,
        bottomRail: config.bottomRail,
        topRail: config.topRail,
        midRailsEnabled: config.midRailsEnabled,
        midRails: config.midRails,
        rebateWidthMm: config.rebateWidthMm,
        rebateDepthMm: config.rebateDepthMm,
        frontFaceThicknessMm: config.frontFaceThicknessMm,
        cornerRadiusMm: config.cornerRadiusMm,
        hingeDrilling: config.hingeDrilling,
        hinges: config.hinges,
        material: config.material,
        finish: config.finish,
      };

      const response = await fetch("/api/export/prepare?type=svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportConfig),
      });

      if (!response.ok) {
        throw new Error("Failed to prepare SVG export");
      }

      const { token } = await response.json();
      window.location.href = `/api/download/svg/${token}`;
      setSavedMessage("SVG file downloading...");
    } catch (error) {
      setSavedMessage("Error generating SVG file");
      console.error(error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSavedMessage(""), 3000);
    }
  };

  return (
    <div className={cn(
      "w-full h-full bg-white flex flex-col shadow-lg",
      !isMobile && "md:w-96 border-l border-gray-200"
    )}>
      <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-orange-600 to-red-700">
        <h1 className="text-base md:text-xl font-bold text-white tracking-wide">Door Configurator</h1>
        <p className="text-sm text-orange-100 mt-1 font-medium">Design your perfect door</p>
      </div>


      {/* Export buttons hidden - exports generated server-side during order creation */}

      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={selectedSection}
          onValueChange={setSelectedSection}
        >
          <AccordionItem value="door-style">
            <AccordionTrigger className="text-sm font-medium">Door Style</AccordionTrigger>
            <AccordionContent>
              <DoorStyleSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dimensions">
            <AccordionTrigger className="text-sm font-medium">Door Dimensions</AccordionTrigger>
            <AccordionContent>
              <DoorDimensionsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="borders">
            <AccordionTrigger className="text-sm font-medium">Frames & Borders</AccordionTrigger>
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
            <AccordionTrigger className="text-sm font-medium">Mid Rails</AccordionTrigger>
            <AccordionContent>
              <MidRailsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="finish">
            <AccordionTrigger className="text-sm font-medium">Finish Option</AccordionTrigger>
            <AccordionContent>
              <FinishOptionSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hinges">
            <AccordionTrigger className="text-sm font-medium">Hinge Positions</AccordionTrigger>
            <AccordionContent>
              <HingePositionsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rebates">
            <AccordionTrigger className="text-sm font-medium">Rebate Specifications</AccordionTrigger>
            <AccordionContent>
              <RebateSection />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="h-6"></div>
      </div>
    </div >
  );
}

// ============================================
// SECTION COMPONENTS
// ============================================

function DoorDimensionsSection() {
  const { height, width, setHeight, setWidth } = useDoorConfig();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm text-gray-600">Height (mm)</Label>
        <Input
          type="number"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className="w-full"
          min={200}
          max={2500}
        />
        <span className="text-xs text-gray-400">Range: 200-2500mm</span>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-600">Width (mm)</Label>
        <Input
          type="number"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full"
          min={200}
          max={1200}
        />
        <span className="text-xs text-gray-400">Range: 200-1200mm</span>
      </div>
    </div>
  );
}

function DoorStyleSection() {
  const { panelType, setPanelType } = useDoorConfig();

  const panelTypes = [
    { value: "STANDARD_12MM", label: "Standard 12mm", description: "Classic MDF panel" },
    { value: "REEDED_19MM", label: "Reeded 19mm", description: "Textured vertical lines" },
    { value: "MELAMINE_18MM", label: "Melamine 18mm", description: "Durable melamine finish" },
    { value: "NONE", label: "Slab (No Panel)", description: "Solid door without panel" },
  ];

  return (
    <div className="space-y-3">
      {panelTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => setPanelType(type.value as any)}
          className={cn(
            "w-full text-left p-4 rounded-lg border-2 transition-all",
            panelType === type.value
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 hover:border-orange-300"
          )}
        >
          <div className="font-medium text-gray-900">{type.label}</div>
          <div className="text-sm text-gray-500">{type.description}</div>
        </button>
      ))}
    </div>
  );
}

function AngledCornersSection() {
  const {
    width,
    height,
    borderWidth,
    angledLeft,
    angledRight,
    leftAnglePreset,
    rightAnglePreset,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    leftAngleDegrees,
    rightAngleDegrees,
    setAngledLeft,
    setAngledRight,
    setLeftAnglePreset,
    setRightAnglePreset,
    setLeftTriangleCutoutWidth,
    setLeftTriangleCutoutHeight,
    setRightTriangleCutoutWidth,
    setRightTriangleCutoutHeight,
  } = useDoorConfig();

  const [showCustomLeft, setShowCustomLeft] = useState(leftAnglePreset === "custom");
  const [showCustomRight, setShowCustomRight] = useState(rightAnglePreset === "custom");

  const leftValidation = validateAngleCutout(width, height, leftTriangleCutoutWidth, leftTriangleCutoutHeight, borderWidth);
  const rightValidation = validateAngleCutout(width, height, rightTriangleCutoutWidth, rightTriangleCutoutHeight, borderWidth);

  const presets = ANGLE_PRESETS.filter(p => p.id !== "custom");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Perfect for under-stair cupboards and loft access. We've calculated optimal angles
                based on UK building standards.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-xs text-gray-500">Select preset or customise</span>
      </div>

      {/* Left Angled Section */}
      <div className={cn(
        "rounded-xl border-2 transition-all duration-300",
        angledLeft ? "border-orange-200 bg-orange-50/50" : "border-gray-100 bg-gray-50/50"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-lg",
                angledLeft ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
              )}>
                ◢
              </div>
              <div>
                <span className="font-medium text-gray-900">Left Angle</span>
                {angledLeft && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-orange-100 text-orange-800 hover:bg-orange-200">
                    {leftAngleDegrees}°
                  </Badge>
                )}
              </div>
            </div>
            <Switch checked={angledLeft} onCheckedChange={setAngledLeft} />
          </div>

          {angledLeft && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setLeftAnglePreset(preset.id as AnglePresetId);
                      setShowCustomLeft(false);
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-center hover:shadow-md",
                      leftAnglePreset === preset.id
                        ? "border-orange-500 bg-orange-100 shadow-sm"
                        : "border-gray-200 bg-white hover:border-orange-300"
                    )}
                  >
                    <span className="text-lg mb-1 block">{preset.icon}</span>
                    <span className="text-xs font-medium text-gray-700 block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-gray-500">{preset.angle}°</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowCustomLeft(!showCustomLeft);
                  if (!showCustomLeft) {
                    setLeftAnglePreset("custom");
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                  showCustomLeft || leftAnglePreset === "custom"
                    ? "border-amber-400 bg-amber-50"
                    : "border-dashed border-gray-300 hover:border-gray-400"
                )}
              >
                <div className="flex items-center gap-2">
                  {showCustomLeft ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span className="text-sm font-medium">Custom Dimensions</span>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  showCustomLeft && "rotate-90"
                )} />
              </button>

              {(showCustomLeft || leftAnglePreset === "custom") && (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Cut Width (mm)</Label>
                      <Input
                        type="number"
                        value={leftTriangleCutoutWidth}
                        onChange={(e) => setLeftTriangleCutoutWidth(Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Cut Height (mm)</Label>
                      <Input
                        type="number"
                        value={leftTriangleCutoutHeight}
                        onChange={(e) => setLeftTriangleCutoutHeight(Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Resulting Angle:</span>
                    <Badge variant="outline" className="font-mono">
                      {leftAngleDegrees}°
                    </Badge>
                  </div>
                </div>
              )}

              {!leftValidation.valid && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-700 space-y-1">
                    {leftValidation.errors.map((error, i) => (
                      <p key={i}>{error}</p>
                    ))}
                  </div>
                </div>
              )}

              {leftValidation.valid && leftAnglePreset !== "custom" && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">
                    Optimised for {ANGLE_PRESETS.find(p => p.id === leftAnglePreset)?.description}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Angled Section */}
      <div className={cn(
        "rounded-xl border-2 transition-all duration-300",
        angledRight ? "border-stone-300 bg-stone-100/50" : "border-gray-100 bg-gray-50/50"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-lg",
                angledRight ? "bg-stone-700 text-white" : "bg-gray-200 text-gray-500"
              )}>
                ◣
              </div>
              <div>
                <span className="font-medium text-gray-900">Right Angle</span>
                {angledRight && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-stone-200 text-stone-800 hover:bg-stone-300">
                    {rightAngleDegrees}°
                  </Badge>
                )}
              </div>
            </div>
            <Switch checked={angledRight} onCheckedChange={setAngledRight} />
          </div>

          {angledRight && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setRightAnglePreset(preset.id as AnglePresetId);
                      setShowCustomRight(false);
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-center hover:shadow-md",
                      rightAnglePreset === preset.id
                        ? "border-stone-600 bg-stone-100 shadow-sm"
                        : "border-gray-200 bg-white hover:border-stone-400"
                    )}
                  >
                    <span className="text-lg mb-1 block">{preset.icon}</span>
                    <span className="text-xs font-medium text-gray-700 block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-gray-500">{preset.angle}°</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowCustomRight(!showCustomRight);
                  if (!showCustomRight) {
                    setRightAnglePreset("custom");
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                  showCustomRight || rightAnglePreset === "custom"
                    ? "border-amber-400 bg-amber-50"
                    : "border-dashed border-gray-300 hover:border-gray-400"
                )}
              >
                <div className="flex items-center gap-2">
                  {showCustomRight ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span className="text-sm font-medium">Custom Dimensions</span>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  showCustomRight && "rotate-90"
                )} />
              </button>

              {(showCustomRight || rightAnglePreset === "custom") && (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Cut Width (mm)</Label>
                      <Input
                        type="number"
                        value={rightTriangleCutoutWidth}
                        onChange={(e) => setRightTriangleCutoutWidth(Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Cut Height (mm)</Label>
                      <Input
                        type="number"
                        value={rightTriangleCutoutHeight}
                        onChange={(e) => setRightTriangleCutoutHeight(Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Resulting Angle:</span>
                    <Badge variant="outline" className="font-mono">
                      {rightAngleDegrees}°
                    </Badge>
                  </div>
                </div>
              )}

              {!rightValidation.valid && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-700 space-y-1">
                    {rightValidation.errors.map((error, i) => (
                      <p key={i}>{error}</p>
                    ))}
                  </div>
                </div>
              )}

              {rightValidation.valid && rightAnglePreset !== "custom" && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">
                    Optimised for {ANGLE_PRESETS.find(p => p.id === rightAnglePreset)?.description}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {(angledLeft || angledRight) && (
        <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-stone-50 rounded-lg border border-orange-200">
          <p className="text-xs text-stone-600 font-medium">
            👆 Rotate the 3D model to see the angled cuts from all sides
          </p>
        </div>
      )}
    </div>
  );
}

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
  } = useDoorConfig();

  const MIN_BORDER_WITH_HINGES = 65;
  const MIN_BORDER_WITHOUT_HINGES = 35;
  const minBorder = hingeDrilling ? MIN_BORDER_WITH_HINGES : MIN_BORDER_WITHOUT_HINGES;

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-gray-700 font-medium">Uniform Border (mm)</Label>
          <span className="text-sm text-gray-500">Min: {minBorder}mm</span>
        </div>
        <Input
          type="number"
          value={borderWidth}
          onChange={(e) => setBorderWidth(Math.max(minBorder, Number(e.target.value)))}
          min={minBorder}
          className="w-full"
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm text-gray-600">Custom Borders</Label>
          <Switch checked={customBorders} onCheckedChange={setCustomBorders} />
        </div>

        {customBorders && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Top Rail</Label>
              <Input
                type="number"
                value={topRail}
                onChange={e => setTopRail(Math.max(minBorder, Number(e.target.value)))}
                min={minBorder}
                className="h-9 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Bottom Rail</Label>
              <Input
                type="number"
                value={bottomRail}
                onChange={e => setBottomRail(Math.max(minBorder, Number(e.target.value)))}
                min={minBorder}
                className="h-9 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Left Stile</Label>
              <Input
                type="number"
                value={leftStile}
                onChange={e => setLeftStile(Math.max(minBorder, Number(e.target.value)))}
                min={minBorder}
                className="h-9 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Right Stile</Label>
              <Input
                type="number"
                value={rightStile}
                onChange={e => setRightStile(Math.max(minBorder, Number(e.target.value)))}
                min={minBorder}
                className="h-9 text-right"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MidRailsSection() {
  const {
    midRailsEnabled,
    midRailsEqualise,
    midRails,
    setMidRailsEnabled,
    setMidRailsEqualise,
    addMidRail,
    removeMidRail,
    updateMidRail,
  } = useDoorConfig();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-gray-600">Enable Mid Rails</Label>
        <Switch checked={midRailsEnabled} onCheckedChange={setMidRailsEnabled} />
      </div>

      {midRailsEnabled && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-600">Equalise Spacing</Label>
            <Switch checked={midRailsEqualise} onCheckedChange={setMidRailsEqualise} />
          </div>

          <div className="space-y-4">
            {midRails.map((rail, index) => (
              <div key={rail.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Mid Rail {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMidRail(rail.id)}
                    className="h-6 w-6 p-0 text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Position from bottom (mm)</Label>
                    <Input
                      type="number"
                      value={rail.positionFromBottom}
                      onChange={(e) => updateMidRail(rail.id, 'positionFromBottom', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Dimension (mm)</Label>
                    <Input
                      type="number"
                      value={rail.dimension}
                      onChange={(e) => updateMidRail(rail.id, 'dimension', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addMidRail}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Mid Rail
          </Button>
        </>
      )}
    </div>
  );
}

function RebateSection() {
  const {
    rebateWidthMm, setRebateWidth,
    rebateDepthMm, setRebateDepth,
    frontFaceThicknessMm, setFrontFaceThickness,
    cornerRadiusMm, setCornerRadius
  } = useDoorConfig();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Standard rebate is 10mm wide x 14mm deep. This ensures the panel sits securely.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-xs text-gray-500">Advanced settings</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Rebate Width (mm)</Label>
          <Input
            type="number"
            value={rebateWidthMm}
            onChange={(e) => setRebateWidth(Number(e.target.value))}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Rebate Depth (mm)</Label>
          <Input
            type="number"
            value={rebateDepthMm}
            onChange={(e) => setRebateDepth(Number(e.target.value))}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Front Face (mm)</Label>
          <Input
            type="number"
            value={frontFaceThicknessMm}
            onChange={(e) => setFrontFaceThickness(Number(e.target.value))}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Corner Radius (mm)</Label>
          <Input
            type="number"
            step="0.1"
            value={cornerRadiusMm}
            onChange={(e) => setCornerRadius(Number(e.target.value))}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}

function HingePositionsSection() {
  const {
    width, height,
    angledLeft, angledRight,
    leftTriangleCutoutWidth, leftTriangleCutoutHeight,
    rightTriangleCutoutWidth, rightTriangleCutoutHeight,
    hingeDrilling, setHingeDrilling,
    hinges, addHinge, removeHinge, updateHinge
  } = useDoorConfig();

  const isHingeInvalid = (hinge: any) => {
    const hY = hinge.positionFromBottomMm;
    const hX = hinge.side === "LEFT" ? 22 : width - 22;

    if (hinge.side === "LEFT" && angledLeft) {
      const heightFromTop = height - hY;
      if (heightFromTop < leftTriangleCutoutHeight) {
        const maxX = (leftTriangleCutoutWidth * heightFromTop) / leftTriangleCutoutHeight;
        if (hX < maxX) return true;
      }
    }
    if (hinge.side === "RIGHT" && angledRight) {
      const heightFromTop = height - hY;
      if (heightFromTop < rightTriangleCutoutHeight) {
        const minX = width - (rightTriangleCutoutWidth * heightFromTop) / rightTriangleCutoutHeight;
        if (hX > minX) return true;
      }
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-gray-600">Hinge Drilling</Label>
        <Switch checked={hingeDrilling} onCheckedChange={setHingeDrilling} />
      </div>

      {hingeDrilling && (
        <>
          <p className="text-xs text-gray-500">
            35mm cup holes, 13mm deep, 5mm from edge. €1.50 per hinge.
          </p>

          <div className="space-y-3 pt-2">
            {hinges.map((hinge, index) => (
              <div key={hinge.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Hinge {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHinge(hinge.id)}
                    className="h-6 w-6 p-0 text-red-500"
                  >
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
                    <Label className="text-xs text-gray-500">From Bottom (mm)</Label>
                    <Input
                      type="number"
                      value={hinge.positionFromBottomMm}
                      onChange={(e) => updateHinge(hinge.id, 'positionFromBottomMm', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Side</Label>
                    <select
                      value={hinge.side}
                      onChange={(e) => updateHinge(hinge.id, 'side', e.target.value)}
                      className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
                    >
                      <option value="LEFT">Left</option>
                      <option value="RIGHT">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addHinge}
              className="w-full h-8 text-xs"
            >
              <Plus className="w-3 h-3 mr-2" />
              Add Hinge
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function FinishOptionSection() {
  const { finish, setFinish } = useDoorConfig();

  const finishOptions = [
    {
      value: "RAW_UNASSEMBLED",
      label: "Raw Unassembled",
      description: "Parts straight off CNC. You finish edges and glue panels.",
      multiplier: 1.0,
    },
    {
      value: "ASSEMBLED_PREP",
      label: "Assembled & Prepped",
      description: "Edges sanded to 240 grit, panels glued and caulked.",
      multiplier: 1.3,
    },
    {
      value: "PRIMED",
      label: "Primed",
      description: "Fully prepped and primed with Sayerlack primer.",
      multiplier: 1.8,
    },
  ];

  return (
    <div className="space-y-3">
      {finishOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setFinish(option.value as any)}
          className={cn(
            "w-full text-left p-4 rounded-lg border-2 transition-all",
            finish === option.value
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{option.label}</h4>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            </div>
            {option.multiplier > 1.0 && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                +{((option.multiplier - 1) * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}