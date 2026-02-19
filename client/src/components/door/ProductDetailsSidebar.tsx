// client/src/components/door/ProductDetailsSidebar.tsx
import { useState } from "react";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { useDoorStore } from "@/lib/stores/useDoorStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Check,
  Package,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function ProductDetailsSidebar() {
  const [, setLocation] = useLocation();
  const config = useDoorConfig();
  const { addDoor, doors } = useDoorStore();

  const {
    width,
    height,
    thickness,
    panelType,
    panelCount,
    panelOrientation,
    preset,
    finish,
    price,
    shape,
    angledLeft,
    angledRight,
    leftAngleDegrees,
    rightAngleDegrees,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    borderWidth,
    customBorders,
    leftStile,
    rightStile,
    topRail,
    bottomRail,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise,
    midRails,
    hingeDrilling,
    hinges,
    material,
    showDimensions,
    isNewSession,
  } = config;

  // Cart count derived from the single source of truth: useDoorStore
  const cartCount = doors.reduce((sum, d) => sum + d.qty, 0);
  const [justAdded, setJustAdded] = useState(false);

  // Calculate area
  const areaM2 = (width * height) / 1000000;

  // Panel type labels
  const panelLabels: Record<string, string> = {
    STANDARD_12MM: "Standard 12mm MDF",
    REEDED_19MM: "Reeded 19mm MDF",
    MELAMINE_18MM: "Melamine 18mm",
    NONE: "Slab (No Panel)",
    FRETWORK: "Fretwork Pattern",
    GLASS: "Glass Ready",
  };

  // Finish labels
  const finishLabels: Record<string, { label: string; color: string }> = {
    RAW_UNASSEMBLED: {
      label: "Raw Unassembled",
      color: "bg-stone-100 text-stone-700",
    },
    ASSEMBLED_PREP: {
      label: "Assembled & Prepped",
      color: "bg-stone-200 text-stone-800",
    },
    PRIMED: {
      label: "Primed",
      color: "bg-emerald-100 text-emerald-700",
    },
  };

  const currentFinish = finishLabels[finish] || finishLabels.RAW_UNASSEMBLED;

  // Build features list
  const features: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Dimensions", value: `${width} × ${height} × ${thickness}mm` },
    { label: "Area", value: `${areaM2.toFixed(3)} m²` },
    { label: "Panel Type", value: panelLabels[panelType] || panelType },
  ];

  if (angledLeft) {
    features.push({
      label: "Left Angle",
      value: `${leftAngleDegrees}°`,
      highlight: true,
    });
  }
  if (angledRight) {
    features.push({
      label: "Right Angle",
      value: `${rightAngleDegrees}°`,
      highlight: true,
    });
  }
  if (midRailsEnabled && midRails.length > 0) {
    features.push({
      label: "Mid Rails",
      value: `${midRails.length} rail${midRails.length > 1 ? "s" : ""}`,
      highlight: true,
    });
  }
  if (hingeDrilling && hinges.length > 0) {
    features.push({
      label: "Hinge Holes",
      value: `${hinges.length} hole${hinges.length > 1 ? "s" : ""}`,
      highlight: true,
    });
  }

  /**
   * Add current door config to the unified door store (catalogue).
   * This is the SINGLE cart system — no more localStorage cartUtils.
   */
  const handleAddToCart = () => {
    addDoor({
      width,
      height,
      thickness,
      preset,
      panelType,
      panelCount,
      panelOrientation: panelOrientation || "vertical",
      shape: shape || "rectangular",
      angledLeft,
      angledRight,
      leftTriangleCutoutWidth,
      leftTriangleCutoutHeight,
      rightTriangleCutoutWidth,
      rightTriangleCutoutHeight,
      leftAngleDegrees,
      rightAngleDegrees,
      borderWidth,
      customBorders,
      leftStile: customBorders ? leftStile : borderWidth,
      rightStile: customBorders ? rightStile : borderWidth,
      bottomRail: customBorders ? bottomRail : borderWidth,
      topRail: customBorders ? topRail : borderWidth,
      rebateWidthMm,
      rebateDepthMm,
      frontFaceThicknessMm,
      cornerRadiusMm,
      midRailsEnabled,
      midRailsEqualise: midRailsEqualise || false,
      midRails: midRailsEnabled ? midRails : [],
      hingeDrilling,
      hinges: hingeDrilling ? hinges : [],
      material,
      finish,
      showDimensions,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);

    // Calculate new total (current doors + the one we just added)
    const newTotal = cartCount + 1;

    toast.success("Added to cart!", {
      description: `${width}×${height}mm door — £${price.toFixed(2)}. ${newTotal} item${newTotal > 1 ? "s" : ""} in cart.`,
      action: {
        label: "View Cart",
        onClick: () => setLocation("/checkout"),
      },
    });
  };

  /**
   * Add to cart AND navigate straight to checkout
   */
  const handleAddAndCheckout = () => {
    addDoor({
      width,
      height,
      thickness,
      preset,
      panelType,
      panelCount,
      panelOrientation: panelOrientation || "vertical",
      shape: shape || "rectangular",
      angledLeft,
      angledRight,
      leftTriangleCutoutWidth,
      leftTriangleCutoutHeight,
      rightTriangleCutoutWidth,
      rightTriangleCutoutHeight,
      leftAngleDegrees,
      rightAngleDegrees,
      borderWidth,
      customBorders,
      leftStile: customBorders ? leftStile : borderWidth,
      rightStile: customBorders ? rightStile : borderWidth,
      bottomRail: customBorders ? bottomRail : borderWidth,
      topRail: customBorders ? topRail : borderWidth,
      rebateWidthMm,
      rebateDepthMm,
      frontFaceThicknessMm,
      cornerRadiusMm,
      midRailsEnabled,
      midRailsEqualise: midRailsEqualise || false,
      midRails: midRailsEnabled ? midRails : [],
      hingeDrilling,
      hinges: hingeDrilling ? hinges : [],
      material,
      finish,
      showDimensions,
    });

    toast.success("Added to cart! Redirecting…", {
      description: `${width}×${height}mm door — £${price.toFixed(2)}`,
    });

    // Small delay to let the store persist before navigation
    setTimeout(() => setLocation("/checkout"), 150);
  };

  /**
   * Navigate to checkout without adding (for viewing existing cart)
   */
  const handleViewCart = () => {
    setLocation("/checkout");
  };

  // Order subtotal from all doors in the store
  const orderSubtotal = doors.reduce((sum, d) => sum + d.lineTotal, 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-br from-stone-50 to-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Trade Shaker Door
            </h2>
            <p className="text-sm text-gray-500 mt-1">Custom MDF Door</p>
          </div>
          <Badge className={cn("text-xs font-medium", currentFinish.color)}>
            {currentFinish.label}
          </Badge>
        </div>

        {/* Price Display */}
        <div className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-xl p-4 text-white shadow-lg border border-stone-700">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-stone-300 text-xs uppercase tracking-wider font-medium">
                Unit Price
              </p>
              <p className="text-3xl font-bold mt-1 text-white">
                £{isNewSession ? '0.00' : price.toFixed(2)}
              </p>
              {isNewSession && (
                <p className="text-xs text-stone-400 mt-1">Configure your door to see the price</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          Specifications
        </h3>

        <div className="space-y-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg",
                feature.highlight ? "bg-orange-50" : "bg-gray-50",
              )}
            >
              <span className="text-sm text-gray-600">{feature.label}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  feature.highlight ? "text-orange-700" : "text-gray-900",
                )}
              >
                {feature.value}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Cart status indicator — shows summary of all doors in the order */}
        {cartCount > 0 && (
          <button
            onClick={handleViewCart}
            className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl mb-4 hover:bg-orange-100 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">
                {cartCount}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-stone-900">
                  {cartCount} item{cartCount > 1 ? "s" : ""} in cart
                </p>
                <p className="text-xs text-stone-500">
                  Subtotal: £{orderSubtotal.toFixed(2)}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t bg-gray-50 space-y-3">
        {/* Primary: Add to Cart (stay on page to configure more doors) */}
        <Button
          className={cn(
            "w-full h-12 font-bold tracking-wide shadow-lg transition-all hover:scale-[1.02]",
            justAdded
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white",
          )}
          size="lg"
          onClick={handleAddToCart}
        >
          {justAdded ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Added to Cart!
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Add to Cart
            </>
          )}
        </Button>

        {/* Secondary: Add & Go to Checkout */}
        <Button
          variant="outline"
          className="w-full h-10 border-stone-300 text-stone-700 hover:bg-stone-100 hover:border-orange-300 hover:text-orange-700 font-semibold transition-all"
          onClick={handleAddAndCheckout}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add & Checkout
        </Button>

        {/* Tertiary: View Cart (only if items exist) */}
        {cartCount > 0 && (
          <Button
            variant="ghost"
            className="w-full h-9 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm font-medium"
            onClick={handleViewCart}
          >
            View Cart ({cartCount} item{cartCount > 1 ? "s" : ""})
          </Button>
        )}

        <p className="text-[10px] text-center text-gray-400 pt-2">
          Prices subject to final confirmation. Trade accounts only.
        </p>
      </div>
    </div>
  );
}