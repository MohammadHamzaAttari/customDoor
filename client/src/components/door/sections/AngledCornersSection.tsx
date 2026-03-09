// client/src/components/door/sections/AngledCornersSection.tsx
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { calculateAngleFromCutout, calculateCutoutFromAngle, validateAngleCutout } from "@/lib/anglePresets";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

export function AngledCornersSection() {
  const {
    width,
    height,
    borderWidth,
    angledLeft,
    angledRight,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    leftAngleDegrees,
    rightAngleDegrees,
    setAngledLeft,
    setAngledRight,
    setLeftTriangleCutoutWidth,
    setLeftTriangleCutoutHeight,
    setRightTriangleCutoutWidth,
    setRightTriangleCutoutHeight,
  } = useDoorConfig();

  // Validation
  const leftValidation = validateAngleCutout(width, height, leftTriangleCutoutWidth, leftTriangleCutoutHeight, borderWidth);
  const rightValidation = validateAngleCutout(width, height, rightTriangleCutoutWidth, rightTriangleCutoutHeight, borderWidth);

  // Local state for precise decimal typing without losing trailing dots
  const [leftInput, setLeftInput] = useState(leftAngleDegrees?.toString() || "");
  const [rightInput, setRightInput] = useState(rightAngleDegrees?.toString() || "");

  useEffect(() => {
    if (leftAngleDegrees !== undefined && parseFloat(leftInput) !== leftAngleDegrees) {
      setLeftInput(leftAngleDegrees.toString());
    }
  }, [leftAngleDegrees]);

  useEffect(() => {
    if (rightAngleDegrees !== undefined && parseFloat(rightInput) !== rightAngleDegrees) {
      setRightInput(rightAngleDegrees.toString());
    }
  }, [rightAngleDegrees]);

  /**
   * When the user types an angle directly, recalculate the cutout dimensions
   * to match the angle while preserving a reasonable proportional cutout.
   */
  const handleLeftAngleChange = (degrees: number) => {
    if (isNaN(degrees) || degrees <= 0 || degrees >= 90) return;
    const cutout = calculateCutoutFromAngle(degrees, width, height);
    setLeftTriangleCutoutWidth(cutout.width);
    setLeftTriangleCutoutHeight(cutout.height);
  };

  const handleRightAngleChange = (degrees: number) => {
    if (isNaN(degrees) || degrees <= 0 || degrees >= 90) return;
    const cutout = calculateCutoutFromAngle(degrees, width, height);
    setRightTriangleCutoutWidth(cutout.width);
    setRightTriangleCutoutHeight(cutout.height);
  };

  return (
    <div className="space-y-6">
      {/* Header with Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-blue-600 font-semibold text-sm">Angled Corners</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Perfect for under-stair cupboards and loft access. Enter the angle directly
                  or specify cutout dimensions for exact requirements.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ── Left Angled Section ── */}
      <div className={cn(
        "rounded-xl border-2 transition-all duration-300",
        angledLeft ? "border-blue-200 bg-blue-50/50" : "border-gray-100 bg-gray-50/50"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                angledLeft ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
              )}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21V3h18v18H3z" />
                  <path d="M3 3l8 8" strokeDasharray="2 2" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-gray-900">Left Angle</span>
                {angledLeft && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {(leftAngleDegrees || 0).toFixed(2)}°
                  </Badge>
                )}
              </div>
            </div>
            <Switch checked={angledLeft} onCheckedChange={setAngledLeft} />
          </div>

          {angledLeft && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {/* Angle Input */}
              <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Angle (degrees)</Label>
                  <Input
                    type="number"
                    value={leftInput}
                    onChange={(e) => {
                      setLeftInput(e.target.value);
                      handleLeftAngleChange(parseFloat(e.target.value));
                    }}
                    min={5}
                    max={85}
                    step="0.01"
                    className="h-9"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Recommended: 5° – 85°</span>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-xs text-gray-500 mb-2 block font-medium">Cutout Dimensions</Label>
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

                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Vertical Side Height (mm)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Input
                              type="number"
                              value={Math.round(height - leftTriangleCutoutHeight)}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  setLeftTriangleCutoutHeight(Math.max(0, height - val));
                                }
                              }}
                              className="h-9 pr-8"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono">
                              V
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Height of the straight vertical edge (Total Height - Cut Height)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">Resulting Angle:</span>
                  <Badge variant="outline" className="font-mono">
                    {(leftAngleDegrees || 0).toFixed(2)}°
                  </Badge>
                </div>
              </div>

              {/* Validation Warnings */}
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

              {/* Success State */}
              {leftValidation.valid && leftAngleDegrees > 0 && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">
                    {(leftAngleDegrees || 0).toFixed(2)}° angle configured — {leftTriangleCutoutWidth}mm × {leftTriangleCutoutHeight}mm cutout
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Angled Section ── */}
      <div className={cn(
        "rounded-xl border-2 transition-all duration-300",
        angledRight ? "border-purple-200 bg-purple-50/50" : "border-gray-100 bg-gray-50/50"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                angledRight ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-500"
              )}>
                <svg className="w-5 h-5 transform scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21V3h18v18H3z" />
                  <path d="M3 3l8 8" strokeDasharray="2 2" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-gray-900">Right Angle</span>
                {angledRight && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-700">
                    {(rightAngleDegrees || 0).toFixed(2)}°
                  </Badge>
                )}
              </div>
            </div>
            <Switch checked={angledRight} onCheckedChange={setAngledRight} />
          </div>

          {angledRight && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {/* Angle Input */}
              <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Angle (degrees)</Label>
                  <Input
                    type="number"
                    value={rightInput}
                    onChange={(e) => {
                      setRightInput(e.target.value);
                      handleRightAngleChange(parseFloat(e.target.value));
                    }}
                    min={5}
                    max={85}
                    step="0.01"
                    className="h-9"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Recommended: 5° – 85°</span>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-xs text-gray-500 mb-2 block font-medium">Cutout Dimensions</Label>
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

                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Vertical Side Height (mm)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Input
                              type="number"
                              value={Math.round(height - rightTriangleCutoutHeight)}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  setRightTriangleCutoutHeight(Math.max(0, height - val));
                                }
                              }}
                              className="h-9 pr-8"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono">
                              V
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Height of the straight vertical edge (Total Height - Cut Height)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">Resulting Angle:</span>
                  <Badge variant="outline" className="font-mono">
                    {(rightAngleDegrees || 0).toFixed(2)}°
                  </Badge>
                </div>
              </div>

              {/* Validation */}
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

              {rightValidation.valid && rightAngleDegrees > 0 && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">
                    {(rightAngleDegrees || 0).toFixed(2)}° angle configured — {rightTriangleCutoutWidth}mm × {rightTriangleCutoutHeight}mm cutout
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3D Visual Preview Hint Removed */}
    </div>
  );
}