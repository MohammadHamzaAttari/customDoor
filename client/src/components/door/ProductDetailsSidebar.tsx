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
    rearCornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise,
    midRails,
    hingeDrilling,
    hinges,
    material,
    showDimensions,
    isNewSession,
    editingCartItemId,
    leftAngledRailWidth,
    rightAngledRailWidth,
  } = config;

  // ✅ Single source of truth
  const cartCount = doors.reduce((sum: number, d: any) => sum + d.qty, 0);
  const [justAdded, setJustAdded] = useState(false);

  // Panel type labels
  const panelLabels: Record<string, string> = {
    STANDARD_12MM: "Standard 12mm",
    STANDARD_9MM: "Standard 9mm",
    REEDED_19MM: "Reeded 19mm",
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
    PAINTED: {
      label: "Painted",
      color: "bg-blue-100 text-blue-700",
    },
  };

  const currentFinish =
    finishLabels[finish] || finishLabels.RAW_UNASSEMBLED;

  // Build features list
  const features: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Dimensions", value: `${width} × ${height} × ${thickness}mm` },
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

  if (angledLeft || angledRight) {
    features.push({
      label: "Angled Rails",
      value: `L: ${leftAngledRailWidth}mm | R: ${rightAngledRailWidth}mm`,
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

  if (panelType !== "NONE") {
    features.push({
      label: "Rebate",
      value: `${rebateWidthMm}w × ${rebateDepthMm}d mm`,
    });
    features.push({
      label: "Front Face",
      value: `${frontFaceThicknessMm}mm`,
    });
    features.push({
      label: "Radii (F/R)",
      value: `R${cornerRadiusMm} / R${rearCornerRadiusMm}`,
    });
  }

  const buildDoorData = () => ({
    id: editingCartItemId || undefined,
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
    leftAngledRailWidth,
    rightAngledRailWidth,
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
    rearCornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise: midRailsEqualise || false,
    midRails: midRailsEnabled ? midRails : [],
    hingeDrilling,
    hinges: hingeDrilling ? hinges : [],
    material,
    finish,
    showDimensions,
  });

  const handleAddToCart = () => {
    const doorData = buildDoorData();

    if (editingCartItemId) {
      useDoorStore.getState().updateDoor(editingCartItemId, doorData);
    } else {
      addDoor(doorData);
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);

    const newTotal = editingCartItemId ? cartCount : cartCount + 1;

    toast.success(
      editingCartItemId ? "Updated cart!" : "Added to cart!",
      {
        description: `${width}×${height}mm door — £${price.toFixed(
          2
        )}. ${newTotal} item${newTotal > 1 ? "s" : ""} in cart.`,
        action: {
          label: "View Cart",
          onClick: () => setLocation("/checkout"),
        },
      }
    );
  };

  const handleAddAndCheckout = () => {
    const doorData = buildDoorData();

    if (editingCartItemId) {
      useDoorStore.getState().updateDoor(editingCartItemId, doorData);
    } else {
      addDoor(doorData);
    }

    toast.success(
      editingCartItemId
        ? "Updated cart! Redirecting…"
        : "Added to cart! Redirecting…",
      {
        description: `${width}×${height}mm door — £${price.toFixed(2)}`,
      }
    );

    setTimeout(() => setLocation("/checkout"), 150);
  };

  const handleViewCart = () => {
    setLocation("/checkout");
  };

  const orderSubtotal = doors.reduce((sum: number, d: any) => sum + d.lineTotal, 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-br from-stone-50 to-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Trade Shaker Door
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Custom MDF Door
            </p>
          </div>
          <Badge className={cn("text-xs font-medium", currentFinish.color)}>
            {currentFinish.label}
          </Badge>
        </div>

        <div className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-xl p-4 text-white shadow-lg border border-stone-700">
          <p className="text-stone-300 text-xs uppercase tracking-wider font-medium">
            Unit Price
          </p>
          <p className="text-3xl font-bold mt-1">
            £{isNewSession ? "0.00" : price.toFixed(2)}
          </p>
          {isNewSession && (
            <p className="text-xs text-stone-400 mt-1">
              Configure your door to see the price
            </p>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          Specifications
        </h3>

        <div className="space-y-3">
          {features.map((f, i) => (
            <div
              key={i}
              className={cn(
                "flex justify-between py-2 px-3 rounded-lg",
                f.highlight ? "bg-orange-50" : "bg-gray-50"
              )}
            >
              <span className="text-sm text-gray-600">{f.label}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  f.highlight ? "text-orange-700" : "text-gray-900"
                )}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {cartCount > 0 && (
          <button
            onClick={handleViewCart}
            className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition"
          >
            <div>
              <p className="text-sm font-semibold">
                {cartCount} item{cartCount > 1 ? "s" : ""} in cart
              </p>
              <p className="text-xs text-gray-500">
                Subtotal: £{orderSubtotal.toFixed(2)}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-orange-500" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t bg-gray-50 space-y-3">
        <Button
          className={cn(
            "w-full h-12 font-bold",
            justAdded
              ? "bg-emerald-600"
              : "bg-gradient-to-r from-orange-600 to-red-600"
          )}
          onClick={handleAddToCart}
        >
          {justAdded ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              {editingCartItemId ? "Saved!" : "Added!"}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              {editingCartItemId ? "Save Changes" : "Add to Cart"}
            </>
          )}
        </Button>

        <Button variant="outline" onClick={handleAddAndCheckout}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          {editingCartItemId ? "Save & Checkout" : "Add & Checkout"}
        </Button>
      </div>
    </div>
  );
}