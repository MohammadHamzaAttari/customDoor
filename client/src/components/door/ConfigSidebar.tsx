// client/src/components/door/ConfigSidebar.tsx
import { useState } from "react";
import {
  useDoorConfig,
  AnglePresetId,
  MIN_BORDER_WITH_HINGES,
  MIN_BORDER_WITHOUT_HINGES,
} from "@/lib/stores/useDoorConfig";
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
import {
  Info,
  Plus,
  X,
  AlertTriangle,
  Check,
  ChevronRight,
  Lock,
  Unlock,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// INFO TOOLTIP COMPONENT (reusable)
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
          <AccordionItem value="door-style">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Door Style & Thickness
                <Badge variant="outline" className="text-[10px]">
                  {config.thickness}mm {config.panelType === "NONE" ? "Slab" : "Shaker"}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <DoorStyleSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dimensions">
            <AccordionTrigger className="text-sm font-medium">
              Door Dimensions
            </AccordionTrigger>
            <AccordionContent>
              <DoorDimensionsSection />
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
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
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
                  <Badge variant="secondary" className="text-xs">
                    {config.midRails.length}
                  </Badge>
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
                  <Badge variant="secondary" className="text-xs">
                    {config.hinges.length} holes
                  </Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <HingePositionsSection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rebates">
            <AccordionTrigger className="text-sm font-medium">
              Rebate Specifications
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
// DOOR STYLE & THICKNESS SECTION
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
      description: "Classic MDF panel — robust feel, minimal rear recess",
      only22: false,
    },
    {
      value: "REEDED_19MM" as const,
      label: "Reeded 19mm",
      description: "Finsa Tex Flute — textured vertical lines, 22mm doors only",
      only22: true,
    },
    {
      value: "MELAMINE_18MM" as const,
      label: "Melamine 18mm",
      description: "Fabric-effect board (e.g. Canvas Greige), 22mm doors only",
      only22: true,
    },
    {
      value: "NONE" as const,
      label: "Slab (No Panel)",
      description: "Solid door without panel opening — available in 18mm or 22mm",
      only22: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Thickness */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-gray-800">
            Door Thickness
          </Label>
          <InfoTip>
            <p>
              <strong>22mm</strong> is the standard shaker door thickness and
              supports all panel options including reeded and melamine.
            </p>
            <p className="mt-1">
              <strong>18mm</strong> is only available for slab doors (no panel),
              plinths, and cover panels.
            </p>
          </InfoTip>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {thicknessOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => opt.available && setThickness(opt.value)}
              disabled={!opt.available}
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-center",
                thickness === opt.value
                  ? "border-orange-500 bg-orange-50"
                  : opt.available
                    ? "border-gray-200 hover:border-orange-300"
                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed",
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

      {/* Panel Type */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-gray-800">
            Panel Type
          </Label>
          <InfoTip>
            <p>
              Panels drop into a 10mm wide rebate at the back of the door frame.
              The panel choice affects the front recess depth and overall
              appearance.
            </p>
            <p className="mt-1">
              <strong>Standard 12mm:</strong> 8mm front recess, 2mm rear
              expression.
            </p>
            <p>
              <strong>Reeded 19mm:</strong> Sits nearly flush with a 1mm shadow
              gap.
            </p>
            <p>
              <strong>Melamine 18mm:</strong> Fabric/texture effect boards.
            </p>
          </InfoTip>
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
                      : "border-gray-200 hover:border-orange-300",
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
// DIMENSIONS SECTION
// ============================================

function DoorDimensionsSection() {
  const { height, width, setHeight, setWidth } = useDoorConfig();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Height (mm)</Label>
          <InfoTip>
            <p>
              Overall door height. Maximum 2430mm (standard 8' × 4' sheet
              size).
            </p>
          </InfoTip>
        </div>
        <Input
          type="number"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className="w-full"
          min={200}
          max={2430}
        />
        <span className="text-xs text-gray-400">Range: 200–2430mm</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Width (mm)</Label>
          <InfoTip>
            <p>Overall door width. Maximum 1200mm.</p>
          </InfoTip>
        </div>
        <Input
          type="number"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full"
          min={200}
          max={1200}
        />
        <span className="text-xs text-gray-400">Range: 200–1200mm</span>
      </div>
    </div>
  );
}

// ============================================
// BORDER WIDTHS SECTION
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
    hinges,
    getMinBorderForSide,
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
              Sets all borders (stiles and rails) to the same width. This is
              your starting point — enable "Custom Borders" below to set each
              individually.
            </p>
            <p className="mt-1">
              <strong>Minimum {MIN_BORDER_WITH_HINGES}mm</strong> on any side
              with hinges (for hinge boss fixing plate clearance).
            </p>
            <p>
              <strong>Minimum {MIN_BORDER_WITHOUT_HINGES}mm</strong> on sides
              without hinges.
            </p>
          </InfoTip>
        </div>
        <Input
          type="number"
          value={borderWidth}
          onChange={(e) =>
            setBorderWidth(Math.max(minUniform, Number(e.target.value)))
          }
          min={minUniform}
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
            <InfoTip>
              <p>
                Set different widths for each stile and rail. Useful when
                splitting doors into shorter sections where rails need to align
                with adjacent full-height doors.
              </p>
            </InfoTip>
          </div>
          <Switch
            checked={customBorders}
            onCheckedChange={setCustomBorders}
          />
        </div>

        {customBorders && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Top Rail (min {minTop}mm)
              </Label>
              <Input
                type="number"
                value={topRail}
                onChange={(e) =>
                  setTopRail(Math.max(minTop, Number(e.target.value)))
                }
                min={minTop}
                className="h-9 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Bottom Rail (min {minBottom}mm)
              </Label>
              <Input
                type="number"
                value={bottomRail}
                onChange={(e) =>
                  setBottomRail(Math.max(minBottom, Number(e.target.value)))
                }
                min={minBottom}
                className="h-9 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Left Stile (min {minLeft}mm)
                {minLeft === MIN_BORDER_WITH_HINGES && (
                  <span className="text-amber-500 ml-1">🔩</span>
                )}
              </Label>
              <Input
                type="number"
                value={leftStile}
                onChange={(e) =>
                  setLeftStile(Math.max(minLeft, Number(e.target.value)))
                }
                min={minLeft}
                className="h-9 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Right Stile (min {minRight}mm)
                {minRight === MIN_BORDER_WITH_HINGES && (
                  <span className="text-amber-500 ml-1">🔩</span>
                )}
              </Label>
              <Input
                type="number"
                value={rightStile}
                onChange={(e) =>
                  setRightStile(Math.max(minRight, Number(e.target.value)))
                }
                min={minRight}
                className="h-9 text-right"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ANGLED CORNERS SECTION
// ============================================

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

  const [showCustomLeft, setShowCustomLeft] = useState(
    leftAnglePreset === "custom",
  );
  const [showCustomRight, setShowCustomRight] = useState(
    rightAnglePreset === "custom",
  );

  const leftValidation = validateAngleCutout(
    width, height, leftTriangleCutoutWidth, leftTriangleCutoutHeight, borderWidth,
  );
  const rightValidation = validateAngleCutout(
    width, height, rightTriangleCutoutWidth, rightTriangleCutoutHeight, borderWidth,
  );

  const presets = ANGLE_PRESETS.filter((p) => p.id !== "custom");

  // Render a single angle side
  const renderAngleSide = (
    side: "left" | "right",
    enabled: boolean,
    setEnabled: (v: boolean) => void,
    anglePreset: string,
    setAnglePreset: (id: AnglePresetId) => void,
    cutW: number,
    cutH: number,
    setCutW: (v: number) => void,
    setCutH: (v: number) => void,
    angleDeg: number,
    showCustom: boolean,
    setShowCustom: (v: boolean) => void,
    validation: { valid: boolean; errors: string[] },
    accentColor: string,
  ) => {
    const label = side === "left" ? "Left Angle" : "Right Angle";
    const icon = side === "left" ? "◢" : "◣";

    return (
      <div
        className={cn(
          "rounded-xl border-2 transition-all duration-300",
          enabled
            ? `border-${accentColor}-200 bg-${accentColor}-50/50`
            : "border-gray-100 bg-gray-50/50",
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-lg",
                  enabled
                    ? `bg-${accentColor}-500 text-white`
                    : "bg-gray-200 text-gray-500",
                )}
              >
                {icon}
              </div>
              <div>
                <span className="font-medium text-gray-900">{label}</span>
                {enabled && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {angleDeg}°
                  </Badge>
                )}
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {/* Preset buttons */}
              <div className="grid grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setAnglePreset(preset.id as AnglePresetId);
                      setShowCustom(false);
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-center hover:shadow-md",
                      anglePreset === preset.id
                        ? "border-orange-500 bg-orange-100 shadow-sm"
                        : "border-gray-200 bg-white hover:border-orange-300",
                    )}
                  >
                    <span className="text-lg mb-1 block">{preset.icon}</span>
                    <span className="text-xs font-medium text-gray-700 block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {preset.angle}°
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom toggle */}
              <button
                onClick={() => {
                  setShowCustom(!showCustom);
                  if (!showCustom) setAnglePreset("custom");
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                  showCustom || anglePreset === "custom"
                    ? "border-amber-400 bg-amber-50"
                    : "border-dashed border-gray-300 hover:border-gray-400",
                )}
              >
                <div className="flex items-center gap-2">
                  {showCustom ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">Custom Dimensions</span>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform",
                    showCustom && "rotate-90",
                  )}
                />
              </button>

              {/* Custom inputs */}
              {(showCustom || anglePreset === "custom") && (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">
                        Cut Width (mm)
                      </Label>
                      <Input
                        type="number"
                        value={cutW}
                        onChange={(e) => setCutW(Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">
                        Cut Height (mm)
                      </Label>
                      <Input
                        type="number"
                        value={cutH}
                        onChange={(e) => setCutH(Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">
                      Resulting Angle:
                    </span>
                    <Badge variant="outline" className="font-mono">
                      {angleDeg}°
                    </Badge>
                  </div>
                </div>
              )}

              {/* Validation */}
              {!validation.valid && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-700 space-y-1">
                    {validation.errors.map((error, i) => (
                      <p key={i}>{error}</p>
                    ))}
                  </div>
                </div>
              )}

              {validation.valid && anglePreset !== "custom" && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">
                    Optimised for{" "}
                    {ANGLE_PRESETS.find((p) => p.id === anglePreset)?.description}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <InfoTip>
          <p>
            Perfect for under-stair cupboards and loft access. We've calculated
            optimal angles based on UK building standards. A £25 surcharge
            applies for any angled door.
          </p>
        </InfoTip>
        <span className="text-xs text-gray-500">
          Select preset or customise
        </span>
      </div>

      {renderAngleSide(
        "left", angledLeft, setAngledLeft,
        leftAnglePreset, setLeftAnglePreset,
        leftTriangleCutoutWidth, leftTriangleCutoutHeight,
        setLeftTriangleCutoutWidth, setLeftTriangleCutoutHeight,
        leftAngleDegrees, showCustomLeft, setShowCustomLeft,
        leftValidation, "orange",
      )}

      {renderAngleSide(
        "right", angledRight, setAngledRight,
        rightAnglePreset, setRightAnglePreset,
        rightTriangleCutoutWidth, rightTriangleCutoutHeight,
        setRightTriangleCutoutWidth, setRightTriangleCutoutHeight,
        rightAngleDegrees, showCustomRight, setShowCustomRight,
        rightValidation, "purple",
      )}

      {(angledLeft || angledRight) && (
        <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
          <p className="text-xs text-stone-600 font-medium">
            👆 Rotate the 3D model to see the angled cuts from all sides
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// MID RAILS SECTION
// ============================================

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
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Enable Mid Rails</Label>
          <InfoTip>
            <p>
              Add horizontal mid-rails to divide the panel into multiple
              sections. £5 surcharge per rail. Specify the position from the
              bottom of the door.
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
          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-600">Equalise Spacing</Label>
            <Switch
              checked={midRailsEqualise}
              onCheckedChange={setMidRailsEqualise}
            />
          </div>

          <div className="space-y-4">
            {midRails.map((rail, index) => (
              <div
                key={rail.id}
                className="p-3 bg-gray-50 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Mid Rail {index + 1}
                  </span>
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
                    <Label className="text-xs text-gray-500">
                      Position from bottom (mm)
                    </Label>
                    <Input
                      type="number"
                      value={rail.positionFromBottom}
                      onChange={(e) =>
                        updateMidRail(
                          rail.id,
                          "positionFromBottom",
                          Number(e.target.value),
                        )
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      Rail width (mm)
                    </Label>
                    <Input
                      type="number"
                      value={rail.dimension}
                      onChange={(e) =>
                        updateMidRail(
                          rail.id,
                          "dimension",
                          Number(e.target.value),
                        )
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addMidRail} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Mid Rail
          </Button>
        </>
      )}
    </div>
  );
}

// ============================================
// HINGE POSITIONS SECTION
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
  } = useDoorConfig();

  const isHingeInvalid = (hinge: any) => {
    const hY = hinge.positionFromBottomMm;
    const hX = hinge.side === "LEFT" ? 22.5 : width - 22.5;

    if (hinge.side === "LEFT" && angledLeft) {
      const heightFromTop = height - hY;
      if (heightFromTop < leftTriangleCutoutHeight && leftTriangleCutoutHeight > 0) {
        const maxX =
          leftTriangleCutoutWidth *
          (1 - heightFromTop / leftTriangleCutoutHeight);
        if (hX < maxX) return true;
      }
    }
    if (hinge.side === "RIGHT" && angledRight) {
      const heightFromTop = height - hY;
      if (heightFromTop < rightTriangleCutoutHeight && rightTriangleCutoutHeight > 0) {
        const minX =
          width -
          rightTriangleCutoutWidth *
            (1 - heightFromTop / rightTriangleCutoutHeight);
        if (hX > minX) return true;
      }
    }
    return false;
  };

  // Determine current hinge side (all hinges should be on same side)
  const currentSide =
    hinges.length > 0 ? hinges[0].side : "LEFT";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Hinge Drilling</Label>
          <InfoTip>
            <p>
              35mm cup holes, 13mm deep, 5mm from door edge (22.5mm to hole
              centre). £1.50 per hinge hole.
            </p>
            <p className="mt-1">
              <strong>Screw points:</strong> 4mm V-point drill marks, 0.5mm
              deep — standard mounting.
            </p>
            <p>
              <strong>Inserta:</strong> 8mm holes, 13mm deep — for Blum
              'Inserta' clip-on hinges.
            </p>
          </InfoTip>
        </div>
        <Switch checked={hingeDrilling} onCheckedChange={setHingeDrilling} />
      </div>

      {hingeDrilling && (
        <>
          {/* Hinge Side Quick Swap */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Hinged Side: {currentSide}
              </p>
              <p className="text-xs text-blue-600">
                All hinges on {currentSide.toLowerCase()} edge
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={swapHingeSide}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <ArrowLeftRight className="w-4 h-4 mr-1" />
              Swap Side
            </Button>
          </div>

          {/* Hinge Type Selection */}
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
                    onClick={() => {
                      // Update all hinges to the same type
                      hinges.forEach((h) => updateHinge(h.id, "type", type));
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all",
                      isActive
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300",
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

          {/* Individual Hinge Positions */}
          <div className="space-y-3 pt-2">
            {hinges.map((hinge, index) => (
              <div
                key={hinge.id}
                className="p-3 bg-gray-50 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Hinge {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHinge(hinge.id)}
                    className="h-6 w-6 p-0 text-red-500"
                    disabled={hinges.length <= 2}
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

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    Position from bottom (mm)
                  </Label>
                  <Input
                    type="number"
                    value={hinge.positionFromBottomMm}
                    onChange={(e) =>
                      updateHinge(
                        hinge.id,
                        "positionFromBottomMm",
                        Number(e.target.value),
                      )
                    }
                    className="h-8 text-sm"
                  />
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

// ============================================
// FINISH OPTION SECTION
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
        "2mm arris roundovers, edges sanded to 240 grit, panels glued in, gaps caulked. 2.5mm internal corner radii left as machined.",
    },
    {
      value: "PRIMED" as const,
      label: "Primed",
      description:
        "Fully prepped and primed with Sayerlack AU474 waterbased primer. Note: we cannot guarantee adhesion of your final paint choice.",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <InfoTip>
          <p>
            Choose your level of finish. Most trade customers choose "Raw
            Unassembled" as they prefer to control the finishing process
            themselves.
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
            "w-full text-left p-4 rounded-lg border-2 transition-all",
            finish === option.value
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300",
          )}
        >
          <div className="font-medium text-gray-900">{option.label}</div>
          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
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
    rebateWidthMm,
    setRebateWidth,
    rebateDepthMm,
    setRebateDepth,
    frontFaceThicknessMm,
    setFrontFaceThickness,
    cornerRadiusMm,
    setCornerRadius,
  } = useDoorConfig();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <InfoTip>
          <p>
            Standard rebate is 10mm wide × 14mm deep, leaving 8mm at the front
            face. Internal corners have a 2.5mm radius from the 5mm finishing
            cutter.
          </p>
          <p className="mt-1">
            These are advanced settings — only change if you have specific
            manufacturing requirements.
          </p>
        </InfoTip>
        <span className="text-xs text-gray-500">Advanced — rarely needs changing</span>
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